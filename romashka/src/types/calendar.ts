// Calendar Integration Types
export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees: string[];
  meeting_link?: string;
  calendar_id: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  duration_minutes: number;
}

export interface CalendarAvailability {
  date: string;
  slots: TimeSlot[];
  timezone: string;
}

export interface BookingRequest {
  customer_id: string;
  lead_score_id?: string;
  preferred_date: string;
  preferred_time: string;
  duration_minutes: number;
  meeting_type: 'consultation' | 'demo' | 'support' | 'sales';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  timezone: string;
}

export interface ConsultationBooking {
  id: string;
  customer_id: string;
  lead_score_id?: string;
  event_id: string;
  calendar_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meeting_type: 'consultation' | 'demo' | 'support' | 'sales';
  scheduled_at: string;
  duration_minutes: number;
  meeting_link?: string;
  customer_details: {
    name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
  reminders_sent: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarConfig {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  calendar_id: string;
  calendar_name: string;
  default_duration: number;
  buffer_time: number;
  working_hours: {
    [key: string]: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  timezone: string;
  booking_settings: {
    advance_notice_hours: number;
    max_days_ahead: number;
    allow_weekends: boolean;
    confirmation_required: boolean;
    auto_create_meeting_links: boolean;
  };
  notification_settings: {
    send_confirmations: boolean;
    send_reminders: boolean;
    reminder_times: number[]; // Hours before meeting
    custom_email_templates: {
      confirmation?: string;
      reminder?: string;
      cancellation?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface ReminderSequence {
  id: string;
  booking_id: string;
  sequence_type: 'confirmation' | 'reminder' | 'follow_up';
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  content: {
    subject: string;
    body: string;
    template_variables: Record<string, any>;
  };
  created_at: string;
}

export const DEFAULT_WORKING_HOURS = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '17:00' },
  sunday: { enabled: false, start: '09:00', end: '17:00' }
};

export const DEFAULT_REMINDER_TIMES = [24, 2]; // 24 hours and 2 hours before

export const MEETING_TYPES = [
  {
    id: 'consultation',
    name: 'Business Consultation',
    duration: 30,
    description: 'Initial consultation to discuss your business needs'
  },
  {
    id: 'demo',
    name: 'Product Demo',
    duration: 45,
    description: 'Live demonstration of our platform features'
  },
  {
    id: 'support',
    name: 'Technical Support',
    duration: 30,
    description: 'Technical assistance and troubleshooting'
  },
  {
    id: 'sales',
    name: 'Sales Discussion',
    duration: 60,
    description: 'Detailed discussion about pricing and packages'
  }
];