import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Users,
  Filter,
  Settings,
  Play,
  Pause,
  Trash2,
  Plus,
  Eye,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  BarChart3,
  TrendingUp,
  Target,
  Brain,
  Activity,
  Mail,
  Share2
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { ReportingService } from '../../services/analytics/reportingService';
import { Button } from '../../components/ui';
import type { 
  ReportData, 
  ScheduledReport, 
  ExportJob,
  ReportTemplate,
  ScheduledReportConfig
} from '../../services/analytics/reportingService';
import type { TimeRange } from '../../types/analytics';

interface ReportingDashboardState {
  reports: ReportData[];
  scheduledReports: ScheduledReport[];
  exportJobs: ExportJob[];
  templates: ReportTemplate[];
}

export default function ReportingDashboard() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'exports'>('generate');
  const [data, setData] = useState<ReportingDashboardState>({
    reports: [],
    scheduledReports: [],
    exportJobs: [],
    templates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportType, setReportType] = useState<'performance' | 'satisfaction' | 'ai_analytics' | 'custom'>('performance');
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: 'Last 30 days'
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<Partial<ScheduledReportConfig>>({
    name: '',
    description: '',
    reportType: 'performance',
    scheduleCron: '0 9 * * MON',
    recipients: [],
    filters: {},
    format: 'pdf',
    isActive: true
  });

  const reportingService = ReportingService.getInstance();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [scheduledReports, exportJobs] = await Promise.all([
        reportingService.getScheduledReports(),
        reportingService.getExportJobs('user-id') // TODO: Get from auth context
      ]);

      setData({
        reports: [],
        scheduledReports,
        exportJobs,
        templates: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reporting data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      setError(null);

      const reportData = await reportingService.generateReport(
        reportType,
        timeRange,
        {},
        selectedTemplate || undefined
      );

      setData(prev => ({
        ...prev,
        reports: [...prev.reports, reportData]
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = async (reportData: ReportData, format: 'pdf' | 'excel' | 'csv') => {
    try {
      let blob: Blob;
      
      switch (format) {
        case 'pdf':
          blob = await reportingService.exportToPDF(reportData);
          break;
        case 'excel':
          blob = await reportingService.exportToExcel(reportData);
          break;
        case 'csv':
          blob = await reportingService.exportToCSV(reportData);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/\s+/g, '_')}_${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  const scheduleReport = async () => {
    try {
      const reportId = await reportingService.scheduleReport(scheduleConfig as ScheduledReportConfig);
      
      setShowScheduleModal(false);
      setScheduleConfig({
        name: '',
        description: '',
        reportType: 'performance',
        scheduleCron: '0 9 * * MON',
        recipients: [],
        filters: {},
        format: 'pdf',
        isActive: true
      });
      
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule report');
    }
  };

  const toggleScheduledReport = async (reportId: string, isActive: boolean) => {
    try {
      // TODO: Implement toggle functionality
      console.log('Toggling report:', reportId, isActive);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle report');
    }
  };

  const deleteScheduledReport = async (reportId: string) => {
    try {
      // TODO: Implement delete functionality
      console.log('Deleting report:', reportId);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 className="w-4 h-4" />;
      case 'satisfaction': return <TrendingUp className="w-4 h-4" />;
      case 'ai_analytics': return <Brain className="w-4 h-4" />;
      case 'custom': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading reporting dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting Dashboard</h1>
          <p className="text-gray-600">Generate, schedule, and export analytics reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowScheduleModal(true)}
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'generate', label: 'Generate Reports', icon: <FileText className="w-4 h-4" /> },
            { id: 'scheduled', label: 'Scheduled Reports', icon: <Calendar className="w-4 h-4" /> },
            { id: 'exports', label: 'Export History', icon: <Download className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'generate' && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Report Generation Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Generate New Report</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="performance">Performance Report</option>
                      <option value="satisfaction">Satisfaction Report</option>
                      <option value="ai_analytics">AI Analytics Report</option>
                      <option value="custom">Custom Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Range
                    </label>
                    <select
                      value={timeRange.label}
                      onChange={(e) => {
                        const value = e.target.value;
                        const ranges = {
                          'Last 7 days': { start: subDays(new Date(), 7), end: new Date() },
                          'Last 30 days': { start: subDays(new Date(), 30), end: new Date() },
                          'Last 90 days': { start: subDays(new Date(), 90), end: new Date() }
                        };
                        setTimeRange({ ...ranges[value as keyof typeof ranges], label: value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Last 7 days">Last 7 days</option>
                      <option value="Last 30 days">Last 30 days</option>
                      <option value="Last 90 days">Last 90 days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Default Template</option>
                      <option value="executive">Executive Summary</option>
                      <option value="detailed">Detailed Analysis</option>
                      <option value="comparison">Period Comparison</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={generateReport}
                      loading={generatingReport}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
              </div>
              <div className="p-6">
                {data.reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reports generated yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.reports.map((report, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{report.title}</h4>
                            <p className="text-sm text-gray-500">{report.subtitle}</p>
                            <p className="text-xs text-gray-400">
                              Generated {format(report.metadata.generatedAt, 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => exportReport(report, 'pdf')}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            onClick={() => exportReport(report, 'excel')}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Excel
                          </Button>
                          <Button
                            onClick={() => exportReport(report, 'csv')}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            CSV
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'scheduled' && (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Scheduled Reports */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
              </div>
              <div className="p-6">
                {data.scheduledReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No scheduled reports</p>
                ) : (
                  <div className="space-y-4">
                    {data.scheduledReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            {getReportTypeIcon(report.config.reportType)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{report.config.name}</h4>
                            <p className="text-sm text-gray-500">{report.config.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Next run: {format(report.nextRun, 'MMM d, yyyy HH:mm')}</span>
                              {report.lastRun && (
                                <span>Last run: {format(report.lastRun, 'MMM d, yyyy HH:mm')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(report.status)}
                            <span className="text-sm text-gray-600">{report.status}</span>
                          </div>
                          <Button
                            onClick={() => toggleScheduledReport(report.id, !report.config.isActive)}
                            size="sm"
                            variant="outline"
                          >
                            {report.config.isActive ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => deleteScheduledReport(report.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'exports' && (
          <motion.div
            key="exports"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Export History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Export History</h3>
              </div>
              <div className="p-6">
                {data.exportJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No export jobs found</p>
                ) : (
                  <div className="space-y-4">
                    {data.exportJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{job.name}</h4>
                            <p className="text-sm text-gray-500">
                              {job.type} · {job.format.toUpperCase()}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Created: {format(job.createdAt, 'MMM d, yyyy HH:mm')}</span>
                              {job.completedAt && (
                                <span>Completed: {format(job.completedAt, 'MMM d, yyyy HH:mm')}</span>
                              )}
                              {job.fileSizeBytes && (
                                <span>Size: {formatFileSize(job.fileSizeBytes)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(job.status)}
                            <span className="text-sm text-gray-600">{job.status}</span>
                          </div>
                          {job.fileUrl && job.status === 'completed' && (
                            <Button
                              onClick={() => window.open(job.fileUrl, '_blank')}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={scheduleConfig.name}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Weekly Performance Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={scheduleConfig.description}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Automated weekly performance report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={scheduleConfig.reportType}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, reportType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="performance">Performance Report</option>
                  <option value="satisfaction">Satisfaction Report</option>
                  <option value="ai_analytics">AI Analytics Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  value={scheduleConfig.scheduleCron}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, scheduleCron: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="0 9 * * MON">Weekly (Mondays at 9 AM)</option>
                  <option value="0 9 * * *">Daily (9 AM)</option>
                  <option value="0 9 1 * *">Monthly (1st day at 9 AM)</option>
                  <option value="0 9 1 1,4,7,10 *">Quarterly (1st day at 9 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={scheduleConfig.format}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={scheduleConfig.recipients?.join(', ')}
                  onChange={(e) => setScheduleConfig(prev => ({ 
                    ...prev, 
                    recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="admin@company.com, manager@company.com"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                onClick={() => setShowScheduleModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={scheduleReport}
                disabled={!scheduleConfig.name || !scheduleConfig.recipients?.length}
              >
                Schedule Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}