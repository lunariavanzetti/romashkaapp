import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  VideoIcon,
  Phone,
  Mail,
  Plus,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { Button, Badge } from '../../components/ui';
import { ConsultationBooking, MEETING_TYPES } from '../../types/calendar';
import { consultationBookingService } from '../../services/calendar/consultationBookingService';

export default function CalendarDashboard() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadDashboardData();
  }, [selectedFilter, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Load bookings and analytics
      const [bookingsData, analyticsData] = await Promise.all([
        consultationBookingService.getBookings({
          status: selectedFilter === 'all' ? undefined : selectedFilter,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        consultationBookingService.getBookingAnalytics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      ]);

      setBookings(bookingsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading calendar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'no_show':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading calendar dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                  Calendar Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Manage consultations and view booking analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.total_bookings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">+12%</span>
                <span className="text-gray-500 ml-1">vs last period</span>
              </div>
            </div>

            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.completed_bookings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {analytics.completion_rate || 0}% completion rate
                </span>
              </div>
            </div>

            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No Shows</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.no_show_bookings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {analytics.no_show_rate || 0}% no-show rate
                </span>
              </div>
            </div>

            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(analytics.average_duration || 0)}m</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Average meeting length</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters and Bookings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass"
        >
          {/* Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white">
                Recent Bookings
              </h2>
              
              <div className="flex items-center gap-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No consultation bookings match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary-teal/10 rounded-lg flex items-center justify-center">
                          {booking.meeting_type === 'consultation' && <Users className="w-6 h-6 text-primary-teal" />}
                          {booking.meeting_type === 'demo' && <VideoIcon className="w-6 h-6 text-primary-teal" />}
                          {booking.meeting_type === 'support' && <Phone className="w-6 h-6 text-primary-teal" />}
                          {booking.meeting_type === 'sales' && <TrendingUp className="w-6 h-6 text-primary-teal" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {booking.customer_details.name}
                            </h3>
                            <Badge className={getStatusColor(booking.status)} variant="secondary">
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {MEETING_TYPES.find(t => t.id === booking.meeting_type)?.name || booking.meeting_type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDateTime(booking.scheduled_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.duration_minutes} minutes
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {booking.customer_details.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {booking.meeting_link && (
                          <Button variant="ghost" size="sm">
                            <VideoIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}