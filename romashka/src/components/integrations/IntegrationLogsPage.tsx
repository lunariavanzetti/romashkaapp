/**
 * Integration Logs Page
 * Displays comprehensive logs and analytics for all OAuth integrations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Filter, 
  Calendar, 
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  ArrowLeft,
  Activity,
  BarChart3,
  Users,
  Database
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { unifiedIntegrationService, IntegrationLog } from '../../services/integrations/unifiedIntegrationService';

interface IntegrationLogsPageProps {
  onBack?: () => void;
}

const statusIcons = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500" />,
  pending: <Clock className="w-4 h-4 text-yellow-500" />
};

const statusColors = {
  success: 'bg-green-50 text-green-700 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200', 
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200'
};

const providerColors = {
  shopify: 'bg-green-500',
  salesforce: 'bg-blue-500',
  hubspot: 'bg-orange-500'
};

export default function IntegrationLogsPage({ onBack }: IntegrationLogsPageProps) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('7d');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [providerFilter, statusFilter, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (providerFilter !== 'all') filters.provider = providerFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      
      const logsData = await unifiedIntegrationService.getIntegrationLogs(filters, 100);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const handleExportLogs = () => {
    const csvData = logs.map(log => ({
      timestamp: log.created_at,
      provider: log.provider,
      action: log.action,
      status: log.status,
      message: log.message
    }));

    const csvString = [
      ['Timestamp', 'Provider', 'Action', 'Status', 'Message'],
      ...csvData.map(row => [row.timestamp, row.provider, row.action, row.status, row.message])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogStats = () => {
    const total = logs.length;
    const success = logs.filter(log => log.status === 'success').length;
    const errors = logs.filter(log => log.status === 'error').length;
    const pending = logs.filter(log => log.status === 'pending').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, errors, pending, successRate };
  };

  const stats = getLogStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                Integration Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor all integration activities and troubleshoot issues
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="primary" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20 backdrop-blur-glass">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Events</div>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20 backdrop-blur-glass">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.success}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Successful</div>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20 backdrop-blur-glass">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.errors}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Errors</div>
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20 backdrop-blur-glass">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
          >
            <option value="all">All Providers</option>
            <option value="shopify">Shopify</option>
            <option value="salesforce">Salesforce</option>
            <option value="hubspot">HubSpot</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {paginatedLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 ${providerColors[log.provider as keyof typeof providerColors]} rounded flex items-center justify-center`}>
                        <img
                          src={`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/${log.provider}.svg`}
                          alt={log.provider}
                          className="w-4 h-4 filter brightness-0 invert"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {log.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="text-xs">
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[log.status]}`}>
                      {statusIcons[log.status]}
                      <span className="ml-1 capitalize">{log.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                    {log.message}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No logs found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Integration logs will appear here as your integrations are used.'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}