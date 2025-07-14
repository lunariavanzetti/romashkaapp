import { supabase } from '../../lib/supabase';
import {
  BookingRequest,
  ConsultationBooking,
  CalendarEvent,
  ReminderSequence,
  MEETING_TYPES
} from '../../types/calendar';
import { googleCalendarService } from './googleCalendarService';
import { leadScoringEngine } from '../leadScoring/leadScoringEngine';

export class ConsultationBookingService {
  private static instance: ConsultationBookingService;

  private constructor() {}

  static getInstance(): ConsultationBookingService {
    if (!ConsultationBookingService.instance) {
      ConsultationBookingService.instance = new ConsultationBookingService();
    }
    return ConsultationBookingService.instance;
  }

  /**
   * Book a consultation automatically triggered by lead scoring
   */
  async bookConsultationFromLeadScore(
    leadScoreId: string,
    customerId: string,
    customerEmail: string,
    customerName: string,
    preferredTimeSlot?: { date: string; time: string }
  ): Promise<ConsultationBooking> {
    try {
      // Get lead score details
      const { data: leadScore } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('id', leadScoreId)
        .single();

      if (!leadScore) {
        throw new Error('Lead score not found');
      }

      // If no preferred time, find next available slot
      let bookingTime = preferredTimeSlot;
      if (!bookingTime) {
        bookingTime = await this.findNextAvailableSlot();
      }

      // Create booking request
      const bookingRequest: BookingRequest = {
        customer_id: customerId,
        lead_score_id: leadScoreId,
        preferred_date: bookingTime.date,
        preferred_time: bookingTime.time,
        duration_minutes: 30, // Default consultation duration
        meeting_type: 'consultation',
        customer_name: customerName,
        customer_email: customerEmail,
        notes: `High-value lead (Score: ${leadScore.score_percentage}%) - Auto-booked consultation`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      return this.createBooking(bookingRequest);
    } catch (error) {
      console.error('Error booking consultation from lead score:', error);
      throw error;
    }
  }

  /**
   * Create a new consultation booking
   */
  async createBooking(request: BookingRequest): Promise<ConsultationBooking> {
    try {
      // Initialize calendar service
      await googleCalendarService.initialize();
      
      if (!googleCalendarService.isConfigured()) {
        throw new Error('Google Calendar not configured. Please set up calendar integration first.');
      }

      // Create calendar event
      const calendarEvent = await googleCalendarService.createConsultationEvent(request);

      // Create booking record
      const booking: Omit<ConsultationBooking, 'id' | 'created_at' | 'updated_at'> = {
        customer_id: request.customer_id,
        lead_score_id: request.lead_score_id,
        event_id: calendarEvent.id,
        calendar_id: calendarEvent.calendar_id,
        status: 'confirmed',
        meeting_type: request.meeting_type,
        scheduled_at: calendarEvent.start_time,
        duration_minutes: request.duration_minutes,
        meeting_link: calendarEvent.meeting_link,
        customer_details: {
          name: request.customer_name,
          email: request.customer_email,
          phone: request.customer_phone
        },
        notes: request.notes,
        reminders_sent: []
      };

      const { data: savedBooking, error } = await supabase
        .from('consultation_bookings')
        .insert(booking)
        .select()
        .single();

      if (error) {
        console.error('Error saving booking:', error);
        throw error;
      }

      // Schedule reminder sequences
      await this.scheduleReminders(savedBooking);

      // Send confirmation email
      await this.sendBookingConfirmation(savedBooking);

      return savedBooking;
    } catch (error) {
      console.error('Error creating consultation booking:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for booking
   */
  async getAvailableSlots(
    startDate: string,
    endDate: string,
    duration: number = 30
  ) {
    try {
      await googleCalendarService.initialize();
      
      if (!googleCalendarService.isConfigured()) {
        throw new Error('Google Calendar not configured');
      }

      return await googleCalendarService.getAvailability(startDate, endDate, duration);
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  /**
   * Reschedule a consultation booking
   */
  async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newTime: string
  ): Promise<ConsultationBooking> {
    try {
      // Get existing booking
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update calendar event
      const newStartTime = new Date(newDate + 'T' + newTime);
      const newEndTime = new Date(newStartTime.getTime() + (booking.duration_minutes * 60000));

      const calendarEvent = await googleCalendarService.updateEvent(booking.event_id, {
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString()
      });

      // Update booking record
      const { data: updatedBooking, error } = await supabase
        .from('consultation_bookings')
        .update({
          scheduled_at: calendarEvent.start_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        throw error;
      }

      // Cancel old reminders and schedule new ones
      await this.cancelReminders(bookingId);
      await this.scheduleReminders(updatedBooking);

      // Send reschedule notification
      await this.sendRescheduleNotification(updatedBooking);

      return updatedBooking;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  }

  /**
   * Cancel a consultation booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      // Get booking details
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Cancel calendar event
      await googleCalendarService.cancelEvent(booking.event_id);

      // Update booking status
      const { error } = await supabase
        .from('consultation_bookings')
        .update({
          status: 'cancelled',
          notes: booking.notes ? `${booking.notes}\n\nCancelled: ${reason || 'No reason provided'}` : `Cancelled: ${reason || 'No reason provided'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      // Cancel reminders
      await this.cancelReminders(bookingId);

      // Send cancellation notification
      await this.sendCancellationNotification(booking, reason);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Get bookings for a user
   */
  async getBookings(filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    meeting_type?: string;
  }): Promise<ConsultationBooking[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('consultation_bookings')
        .select(`
          *,
          customers!inner(user_id)
        `)
        .eq('customers.user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date) {
        query = query.gte('scheduled_at', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('scheduled_at', filters.end_date);
      }
      if (filters?.meeting_type) {
        query = query.eq('meeting_type', filters.meeting_type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw error;
    }
  }

  /**
   * Mark a booking as completed
   */
  async markBookingCompleted(bookingId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({
          status: 'completed',
          notes: notes ? `${notes}\n\nCompleted: ${new Date().toISOString()}` : `Completed: ${new Date().toISOString()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error marking booking completed:', error);
        throw error;
      }

      // Schedule follow-up sequence if needed
      const { data: booking } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (booking) {
        await this.scheduleFollowUp(booking);
      }
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      throw error;
    }
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(startDate?: string, endDate?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_booking_analytics', {
        user_uuid: user.id,
        start_date: startDate,
        end_date: endDate
      });

      if (error) {
        console.error('Error fetching booking analytics:', error);
        throw error;
      }

      return data[0] || {};
    } catch (error) {
      console.error('Error getting booking analytics:', error);
      throw error;
    }
  }

  /**
   * Private method to find next available time slot
   */
  private async findNextAvailableSlot(): Promise<{ date: string; time: string }> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Look up to 7 days ahead

    const availability = await this.getAvailableSlots(
      tomorrow.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      30
    );

    // Find first available slot
    for (const day of availability) {
      const availableSlot = day.slots.find(slot => slot.available);
      if (availableSlot) {
        return {
          date: day.date,
          time: availableSlot.start
        };
      }
    }

    throw new Error('No available time slots found in the next 7 days');
  }

  /**
   * Private method to schedule reminder sequences
   */
  private async scheduleReminders(booking: ConsultationBooking): Promise<void> {
    const scheduledAt = new Date(booking.scheduled_at);
    const reminderTimes = [24, 2]; // 24 hours and 2 hours before

    for (const hours of reminderTimes) {
      const reminderTime = new Date(scheduledAt.getTime() - (hours * 60 * 60 * 1000));
      
      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        const reminder: Omit<ReminderSequence, 'id' | 'created_at'> = {
          booking_id: booking.id,
          sequence_type: 'reminder',
          scheduled_at: reminderTime.toISOString(),
          status: 'pending',
          content: {
            subject: `Reminder: Your ${booking.meeting_type} is scheduled for ${hours} hours`,
            body: this.generateReminderEmail(booking, hours),
            template_variables: {
              customer_name: booking.customer_details.name,
              meeting_type: booking.meeting_type,
              scheduled_time: scheduledAt.toLocaleString(),
              meeting_link: booking.meeting_link,
              hours_until: hours
            }
          }
        };

        await supabase.from('reminder_sequences').insert(reminder);
      }
    }
  }

  /**
   * Private method to cancel reminders
   */
  private async cancelReminders(bookingId: string): Promise<void> {
    await supabase
      .from('reminder_sequences')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
      .eq('status', 'pending');
  }

  /**
   * Private method to send booking confirmation
   */
  private async sendBookingConfirmation(booking: ConsultationBooking): Promise<void> {
    // This would integrate with email service
    console.log('Sending booking confirmation to:', booking.customer_details.email);
    // TODO: Implement actual email sending
  }

  /**
   * Private method to send reschedule notification
   */
  private async sendRescheduleNotification(booking: ConsultationBooking): Promise<void> {
    // This would integrate with email service
    console.log('Sending reschedule notification to:', booking.customer_details.email);
    // TODO: Implement actual email sending
  }

  /**
   * Private method to send cancellation notification
   */
  private async sendCancellationNotification(booking: ConsultationBooking, reason?: string): Promise<void> {
    // This would integrate with email service
    console.log('Sending cancellation notification to:', booking.customer_details.email, 'Reason:', reason);
    // TODO: Implement actual email sending
  }

  /**
   * Private method to schedule follow-up after completed booking
   */
  private async scheduleFollowUp(booking: ConsultationBooking): Promise<void> {
    const followUpTime = new Date();
    followUpTime.setDate(followUpTime.getDate() + 1); // Follow up next day

    const followUp: Omit<ReminderSequence, 'id' | 'created_at'> = {
      booking_id: booking.id,
      sequence_type: 'follow_up',
      scheduled_at: followUpTime.toISOString(),
      status: 'pending',
      content: {
        subject: 'Thank you for your consultation - Next steps',
        body: this.generateFollowUpEmail(booking),
        template_variables: {
          customer_name: booking.customer_details.name,
          meeting_type: booking.meeting_type
        }
      }
    };

    await supabase.from('reminder_sequences').insert(followUp);
  }

  /**
   * Private method to generate reminder email content
   */
  private generateReminderEmail(booking: ConsultationBooking, hoursUntil: number): string {
    return `
Dear ${booking.customer_details.name},

This is a friendly reminder that your ${booking.meeting_type} is scheduled for ${hoursUntil} hours from now.

Meeting Details:
- Type: ${MEETING_TYPES.find(t => t.id === booking.meeting_type)?.name || booking.meeting_type}
- Date & Time: ${new Date(booking.scheduled_at).toLocaleString()}
- Duration: ${booking.duration_minutes} minutes
${booking.meeting_link ? `- Meeting Link: ${booking.meeting_link}` : ''}

If you need to reschedule or cancel, please contact us as soon as possible.

We look forward to speaking with you!

Best regards,
The ROMASHKA Team
    `.trim();
  }

  /**
   * Private method to generate follow-up email content
   */
  private generateFollowUpEmail(booking: ConsultationBooking): string {
    return `
Dear ${booking.customer_details.name},

Thank you for taking the time to speak with us during your ${booking.meeting_type} yesterday.

We hope the discussion was valuable and that we were able to address your questions and needs.

Next Steps:
- We'll be preparing a customized proposal based on our conversation
- You should receive this within 2-3 business days
- We'll schedule a follow-up call to discuss the proposal in detail

If you have any immediate questions or need clarification on anything we discussed, please don't hesitate to reach out.

Best regards,
The ROMASHKA Team
    `.trim();
  }
}

// Export singleton instance
export const consultationBookingService = ConsultationBookingService.getInstance();