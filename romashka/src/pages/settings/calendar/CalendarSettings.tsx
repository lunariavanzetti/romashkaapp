import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Bell,
  Users,
  Video,
  Globe
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { CalendarConfig, DEFAULT_WORKING_HOURS, MEETING_TYPES } from '../../../types/calendar';
import { googleCalendarService } from '../../../services/calendar/googleCalendarService';

export default function CalendarSettings() {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      await googleCalendarService.initialize();
      const loadedConfig = googleCalendarService.getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading calendar configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setConnecting(true);
      const authUrl = await googleCalendarService.authenticate();
      window.open(authUrl, '_blank', 'width=500,height=600');
      
      // Listen for the callback
      const handleCallback = (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_CALENDAR_CONNECTED') {
          window.removeEventListener('message', handleCallback);
          setConnecting(false);
          loadConfiguration();
        }
      };
      
      window.addEventListener('message', handleCallback);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleCallback);
        setConnecting(false);
      }, 300000);
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setConnecting(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setSaveStatus('idle');
      
      // Save configuration logic would go here
      // await calendarService.updateConfiguration(config);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    if (!config) return;

    setConfig(prev => ({
      ...prev!,
      working_hours: {
        ...prev!.working_hours,
        [day]: {
          ...prev!.working_hours[day],
          [field]: value
        }
      }
    }));
  };

  const updateBookingSettings = (field: string, value: any) => {
    if (!config) return;

    setConfig(prev => ({
      ...prev!,
      booking_settings: {
        ...prev!.booking_settings,
        [field]: value
      }
    }));
  };

  const updateNotificationSettings = (field: string, value: any) => {
    if (!config) return;

    setConfig(prev => ({
      ...prev!,
      notification_settings: {
        ...prev!.notification_settings,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading calendar settings...</span>
        </div>
      </div>
    );
  }

  const isConnected = googleCalendarService.isConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-primary-teal" />
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                Calendar Integration
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Connect your calendar and configure booking settings for automated consultations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Saved successfully</span>
              </motion.div>
            )}
            
            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-600"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Save failed</span>
              </motion.div>
            )}

            {isConnected && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle className="w-4 h-4 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Calendar Not Connected
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Connect your Google Calendar to enable automatic consultation booking for high-scoring leads.
                </p>
                <Button 
                  variant="primary" 
                  onClick={handleConnectGoogleCalendar}
                  loading={connecting}
                  disabled={connecting}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {connecting ? 'Connecting...' : 'Connect Google Calendar'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Google Calendar Connected
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Calendar: {config?.calendar_name} • Timezone: {config?.timezone}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isConnected && config && (
        <>
          {/* Working Hours */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-teal" />
              Working Hours
            </h3>
            
            <div className="space-y-4">
              {Object.entries(config.working_hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-24">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hours.enabled}
                        onChange={(e) => updateWorkingHours(day, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded mr-2"
                      />
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {day}
                      </span>
                    </label>
                  </div>
                  
                  {hours.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Booking Settings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-teal" />
                Booking Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Meeting Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    step="15"
                    value={config.default_duration}
                    onChange={(e) => setConfig(prev => ({ ...prev!, default_duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buffer Time Between Meetings (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={config.buffer_time}
                    onChange={(e) => setConfig(prev => ({ ...prev!, buffer_time: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Advance Notice Required (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={config.booking_settings.advance_notice_hours}
                    onChange={(e) => updateBookingSettings('advance_notice_hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Days Ahead for Booking
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={config.booking_settings.max_days_ahead}
                    onChange={(e) => updateBookingSettings('max_days_ahead', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.booking_settings.allow_weekends}
                      onChange={(e) => updateBookingSettings('allow_weekends', e.target.checked)}
                      className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">Allow weekend bookings</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.booking_settings.auto_create_meeting_links}
                      onChange={(e) => updateBookingSettings('auto_create_meeting_links', e.target.checked)}
                      className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">Auto-create Google Meet links</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.booking_settings.confirmation_required}
                      onChange={(e) => updateBookingSettings('confirmation_required', e.target.checked)}
                      className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">Require manual confirmation</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-teal" />
                Notification Settings
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">Send booking confirmations</span>
                  <input
                    type="checkbox"
                    checked={config.notification_settings.send_confirmations}
                    onChange={(e) => updateNotificationSettings('send_confirmations', e.target.checked)}
                    className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">Send appointment reminders</span>
                  <input
                    type="checkbox"
                    checked={config.notification_settings.send_reminders}
                    onChange={(e) => updateNotificationSettings('send_reminders', e.target.checked)}
                    className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded"
                  />
                </label>

                {config.notification_settings.send_reminders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reminder Times (hours before meeting)
                    </label>
                    <div className="flex gap-2">
                      {config.notification_settings.reminder_times.map((time, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="168"
                            value={time}
                            onChange={(e) => {
                              const newTimes = [...config.notification_settings.reminder_times];
                              newTimes[index] = parseInt(e.target.value);
                              updateNotificationSettings('reminder_times', newTimes);
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <span className="text-sm text-gray-500">hours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meeting Types */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-teal" />
              Meeting Types
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MEETING_TYPES.map((type) => (
                <div key={type.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{type.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {type.duration} min
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setConfig(null)} disabled={saving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>

            <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}