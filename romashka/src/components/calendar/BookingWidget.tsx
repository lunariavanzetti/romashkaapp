import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Video,
  MapPin
} from 'lucide-react';
import { Button } from '../ui';
import {
  CalendarAvailability,
  TimeSlot,
  BookingRequest,
  MEETING_TYPES
} from '../../types/calendar';
import { consultationBookingService } from '../../services/calendar/consultationBookingService';

interface BookingWidgetProps {
  isEmbedded?: boolean;
  customerId?: string;
  defaultMeetingType?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
  };
  onBookingComplete?: (booking: any) => void;
  onClose?: () => void;
}

type BookingStep = 'meeting-type' | 'date-time' | 'details' | 'confirmation';

export default function BookingWidget({
  isEmbedded = false,
  customerId,
  defaultMeetingType = 'consultation',
  theme = {},
  onBookingComplete,
  onClose
}: BookingWidgetProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('meeting-type');
  const [selectedMeetingType, setSelectedMeetingType] = useState(defaultMeetingType);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (currentStep === 'date-time') {
      loadAvailability();
    }
  }, [currentStep, currentMonth, selectedMeetingType]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const meetingType = MEETING_TYPES.find(t => t.id === selectedMeetingType);
      const duration = meetingType?.duration || 30;

      const availabilityData = await consultationBookingService.getAvailableSlots(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        duration
      );

      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load available times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    try {
      setBooking(true);
      setError('');

      const bookingRequest: BookingRequest = {
        customer_id: customerId || crypto.randomUUID(),
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        duration_minutes: MEETING_TYPES.find(t => t.id === selectedMeetingType)?.duration || 30,
        meeting_type: selectedMeetingType as any,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
        notes: customerDetails.notes,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const confirmedBooking = await consultationBookingService.createBooking(bookingRequest);
      
      setCurrentStep('confirmation');
      onBookingComplete?.(confirmedBooking);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: string; available: boolean; isToday: boolean }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', available: false, isToday: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const dayAvailability = availability.find(a => a.date === dateStr);
      const hasAvailableSlots = dayAvailability?.slots.some(slot => slot.available) || false;

      days.push({
        date: dateStr,
        available: hasAvailableSlots && date >= new Date(),
        isToday
      });
    }

    return days;
  };

  const getTimeSlotsForDate = (date: string): TimeSlot[] => {
    const dayAvailability = availability.find(a => a.date === date);
    return dayAvailability?.slots.filter(slot => slot.available) || [];
  };

  const containerStyle = {
    '--primary-color': theme.primaryColor || '#059669',
    '--bg-color': theme.backgroundColor || '#ffffff',
    '--text-color': theme.textColor || '#111827',
    '--border-radius': theme.borderRadius || '12px'
  } as React.CSSProperties;

  return (
    <div
      className={`${isEmbedded ? 'w-full max-w-md' : 'w-full max-w-lg'} bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
      style={containerStyle}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-teal to-primary-deep-blue p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Book a Meeting</h2>
            <p className="text-blue-100 opacity-90">Schedule time with our team</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className={currentStep === 'meeting-type' ? 'text-primary-teal font-medium' : 'text-gray-500'}>
            Meeting Type
          </span>
          <span className={currentStep === 'date-time' ? 'text-primary-teal font-medium' : 'text-gray-500'}>
            Date & Time
          </span>
          <span className={currentStep === 'details' ? 'text-primary-teal font-medium' : 'text-gray-500'}>
            Your Details
          </span>
          <span className={currentStep === 'confirmation' ? 'text-primary-teal font-medium' : 'text-gray-500'}>
            Confirmation
          </span>
        </div>
        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-teal h-2 rounded-full transition-all duration-300"
            style={{
              width: currentStep === 'meeting-type' ? '25%' :
                     currentStep === 'date-time' ? '50%' :
                     currentStep === 'details' ? '75%' : '100%'
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {/* Meeting Type Selection */}
          {currentStep === 'meeting-type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What type of meeting would you like?
              </h3>
              
              <div className="space-y-3">
                {MEETING_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedMeetingType(type.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedMeetingType === type.id
                        ? 'border-primary-teal bg-primary-teal/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-teal/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{type.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{type.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {type.duration} min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={() => setCurrentStep('date-time')}
                className="w-full mt-6"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Date & Time Selection */}
          {currentStep === 'date-time' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Choose a date and time
              </h3>

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {loading ? (
                    <div className="col-span-7 flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-teal"></div>
                    </div>
                  ) : (
                    getDaysInMonth().map((day, index) => (
                      <button
                        key={index}
                        onClick={() => day.available && setSelectedDate(day.date)}
                        disabled={!day.available || !day.date}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          !day.date
                            ? 'invisible'
                            : day.available
                            ? selectedDate === day.date
                              ? 'bg-primary-teal text-white'
                              : 'hover:bg-primary-teal/10 text-gray-900 dark:text-white'
                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        } ${day.isToday ? 'font-bold' : ''}`}
                      >
                        {day.date ? new Date(day.date).getDate() : ''}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Available times for {formatDate(selectedDate)}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {getTimeSlotsForDate(selectedDate).map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTime(slot.start)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          selectedTime === slot.start
                            ? 'border-primary-teal bg-primary-teal text-white'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-teal text-gray-900 dark:text-white'
                        }`}
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('meeting-type')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep('details')}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Customer Details */}
          {currentStep === 'details' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={customerDetails.notes}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="Tell us more about what you'd like to discuss..."
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('date-time')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBooking}
                  disabled={!customerDetails.name || !customerDetails.email || booking}
                  loading={booking}
                  className="flex-1"
                >
                  {booking ? 'Booking...' : 'Book Meeting'}
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Meeting Booked Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent a confirmation email with all the details.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {selectedDate && formatDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {selectedTime && formatTime(selectedTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {MEETING_TYPES.find(t => t.id === selectedMeetingType)?.name}
                    </span>
                  </div>
                </div>
              </div>

              {onClose && (
                <Button variant="primary" onClick={onClose} className="w-full">
                  Close
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}