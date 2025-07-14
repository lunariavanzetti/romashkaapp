import { supabase } from '../../lib/supabase';
import {
  CalendarEvent,
  CalendarAvailability,
  TimeSlot,
  BookingRequest,
  ConsultationBooking,
  GoogleCalendarCredentials,
  CalendarConfig
} from '../../types/calendar';

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private credentials: GoogleCalendarCredentials | null = null;
  private config: CalendarConfig | null = null;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Initialize Google Calendar service with user credentials
   */
  async initialize(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load calendar configuration
      const { data: calendarConfig } = await supabase
        .from('calendar_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider->type', 'google')
        .single();

      if (calendarConfig) {
        this.config = calendarConfig;
        
        // Load encrypted credentials
        const { data: credentialsData } = await supabase
          .from('integration_credentials')
          .select('credentials')
          .eq('user_id', user.id)
          .eq('provider', 'google_calendar')
          .single();

        if (credentialsData) {
          this.credentials = credentialsData.credentials;
        }
      }
    } catch (error) {
      console.error('Error initializing Google Calendar service:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Google Calendar
   */
  async authenticate(): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/integrations/google-calendar/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string): Promise<void> {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
      const redirectUri = `${window.location.origin}/integrations/google-calendar/callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      this.credentials = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: Date.now() + (tokens.expires_in * 1000),
      };

      // Save credentials securely
      await this.saveCredentials();

      // Get user's calendar list and create default config
      await this.createDefaultConfig();
    } catch (error) {
      console.error('Error handling Google Calendar callback:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for booking
   */
  async getAvailability(
    startDate: string,
    endDate: string,
    duration: number = 30
  ): Promise<CalendarAvailability[]> {
    if (!this.credentials || !this.config) {
      throw new Error('Google Calendar not configured');
    }

    try {
      await this.refreshTokenIfNeeded();

      // Get busy times from Google Calendar
      const busyResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: startDate,
            timeMax: endDate,
            items: [{ id: this.config.calendar_id }],
          }),
        }
      );

      if (!busyResponse.ok) {
        throw new Error('Failed to fetch calendar availability');
      }

      const busyData = await busyResponse.json();
      const busyTimes = busyData.calendars[this.config.calendar_id]?.busy || [];

      // Generate available slots
      return this.generateAvailableSlots(startDate, endDate, busyTimes, duration);
    } catch (error) {
      console.error('Error getting calendar availability:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event for consultation booking
   */
  async createConsultationEvent(booking: BookingRequest): Promise<CalendarEvent> {
    if (!this.credentials || !this.config) {
      throw new Error('Google Calendar not configured');
    }

    try {
      await this.refreshTokenIfNeeded();

      const startTime = new Date(booking.preferred_date + 'T' + booking.preferred_time);
      const endTime = new Date(startTime.getTime() + (booking.duration_minutes * 60000));

      const eventData = {
        summary: `${booking.meeting_type} - ${booking.customer_name}`,
        description: `Consultation booking\n\nCustomer: ${booking.customer_name}\nEmail: ${booking.customer_email}\nPhone: ${booking.customer_phone || 'Not provided'}\n\nNotes: ${booking.notes || 'None'}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: booking.timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: booking.timezone,
        },
        attendees: [
          { email: booking.customer_email, displayName: booking.customer_name },
        ],
        conferenceData: this.config.booking_settings.auto_create_meeting_links ? {
          createRequest: {
            requestId: `booking-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        } : undefined,
        reminders: {
          useDefault: false,
          overrides: this.config.notification_settings.reminder_times.map(hours => ({
            method: 'email',
            minutes: hours * 60,
          })),
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendar_id)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const createdEvent = await response.json();

      return {
        id: crypto.randomUUID(),
        title: createdEvent.summary,
        description: createdEvent.description,
        start_time: createdEvent.start.dateTime,
        end_time: createdEvent.end.dateTime,
        location: createdEvent.location,
        attendees: createdEvent.attendees?.map((a: any) => a.email) || [],
        meeting_link: createdEvent.conferenceData?.entryPoints?.[0]?.uri,
        calendar_id: this.config.calendar_id,
        external_id: createdEvent.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    if (!this.credentials || !this.config) {
      throw new Error('Google Calendar not configured');
    }

    try {
      await this.refreshTokenIfNeeded();

      const updateData: any = {};
      
      if (updates.title) updateData.summary = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.start_time) {
        updateData.start = { dateTime: updates.start_time };
      }
      if (updates.end_time) {
        updateData.end = { dateTime: updates.end_time };
      }
      if (updates.location) updateData.location = updates.location;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendar_id)}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.credentials.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update calendar event');
      }

      const updatedEvent = await response.json();

      return {
        id: updates.id || eventId,
        title: updatedEvent.summary,
        description: updatedEvent.description,
        start_time: updatedEvent.start.dateTime,
        end_time: updatedEvent.end.dateTime,
        location: updatedEvent.location,
        attendees: updatedEvent.attendees?.map((a: any) => a.email) || [],
        meeting_link: updatedEvent.conferenceData?.entryPoints?.[0]?.uri,
        calendar_id: this.config.calendar_id,
        external_id: updatedEvent.id,
        created_at: updates.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Cancel a calendar event
   */
  async cancelEvent(externalEventId: string): Promise<void> {
    if (!this.credentials || !this.config) {
      throw new Error('Google Calendar not configured');
    }

    try {
      await this.refreshTokenIfNeeded();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendar_id)}/events/${externalEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.credentials.access_token}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to cancel calendar event');
      }
    } catch (error) {
      console.error('Error canceling calendar event:', error);
      throw error;
    }
  }

  /**
   * Get calendar configuration
   */
  getConfig(): CalendarConfig | null {
    return this.config;
  }

  /**
   * Check if calendar is properly configured
   */
  isConfigured(): boolean {
    return !!(this.credentials && this.config);
  }

  /**
   * Private method to refresh access token if needed
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.credentials) return;

    if (Date.now() >= this.credentials.expiry_date - 300000) { // Refresh 5 minutes before expiry
      await this.refreshAccessToken();
    }
  }

  /**
   * Private method to refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: this.credentials.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokens = await response.json();
      
      this.credentials = {
        ...this.credentials,
        access_token: tokens.access_token,
        expiry_date: Date.now() + (tokens.expires_in * 1000),
      };

      // Update stored credentials
      await this.saveCredentials();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Private method to save credentials securely
   */
  private async saveCredentials(): Promise<void> {
    if (!this.credentials) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('integration_credentials')
      .upsert({
        user_id: user.id,
        provider: 'google_calendar',
        credentials: this.credentials,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving Google Calendar credentials:', error);
      throw error;
    }
  }

  /**
   * Private method to create default calendar configuration
   */
  private async createDefaultConfig(): Promise<void> {
    if (!this.credentials) return;

    try {
      // Get user's primary calendar
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get primary calendar');
      }

      const calendar = await response.json();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const defaultConfig: Omit<CalendarConfig, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        provider: {
          id: 'google',
          name: 'Google Calendar',
          type: 'google',
          enabled: true,
          config: {}
        },
        calendar_id: calendar.id,
        calendar_name: calendar.summary,
        default_duration: 30,
        buffer_time: 15,
        working_hours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' }
        },
        timezone: calendar.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        booking_settings: {
          advance_notice_hours: 2,
          max_days_ahead: 30,
          allow_weekends: false,
          confirmation_required: false,
          auto_create_meeting_links: true
        },
        notification_settings: {
          send_confirmations: true,
          send_reminders: true,
          reminder_times: [24, 2],
          custom_email_templates: {}
        }
      };

      const { data, error } = await supabase
        .from('calendar_configs')
        .upsert(defaultConfig)
        .select()
        .single();

      if (error) {
        console.error('Error creating default calendar config:', error);
        throw error;
      }

      this.config = data;
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  }

  /**
   * Private method to generate available time slots
   */
  private generateAvailableSlots(
    startDate: string,
    endDate: string,
    busyTimes: Array<{ start: string; end: string }>,
    duration: number
  ): CalendarAvailability[] {
    const availability: CalendarAvailability[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleLowerCase().substring(0, 3) + 'day';
      
      // Skip if not a working day
      if (!this.config?.working_hours[dayName]?.enabled) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const workingHours = this.config.working_hours[dayName];
      const slots: TimeSlot[] = [];

      // Generate time slots for the day
      const dayStart = new Date(currentDate);
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(currentDate);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      const slotStart = new Date(dayStart);
      
      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + (duration * 60000));
        
        if (slotEnd <= dayEnd) {
          // Check if slot conflicts with busy times
          const isAvailable = !busyTimes.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return (slotStart < busyEnd && slotEnd > busyStart);
          });

          slots.push({
            start: slotStart.toTimeString().substring(0, 5),
            end: slotEnd.toTimeString().substring(0, 5),
            available: isAvailable,
            duration_minutes: duration
          });
        }

        slotStart.setTime(slotStart.getTime() + (duration * 60000));
      }

      availability.push({
        date: dateStr,
        slots,
        timezone: this.config?.timezone || 'UTC'
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  }
}

// Export singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance();