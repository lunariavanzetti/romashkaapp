import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  BarChart3,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { Button, Badge, AnimatedSpinner } from '../../components/ui';
import { Integration, IntegrationStatusInfo, SyncJob } from '../../types/integrations';
import { integrationManager } from '../../services/integrations/integrationManager';
import { unifiedIntegrationService, ConnectedIntegration, SyncStats, IntegrationLog } from '../../services/integrations/unifiedIntegrationService';
import OAuthIntegrationCard from '../../components/integrations/OAuthIntegrationCard';
import IntegrationSetupModal from '../../components/integrations/IntegrationSetupModal';
import IntegrationLogsPage from '../../components/integrations/IntegrationLogsPage';

interface IntegrationManagerProps {
  onCreateNew: () => void;
  onEditIntegration: (integration: Integration) => void;
}

const statusIcons = {
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  inactive: <Pause className="w-4 h-4 text-gray-400" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500" />,
  pending_setup: <Clock className="w-4 h-4 text-yellow-500" />
};

const statusColors = {
  active: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  inactive: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  pending_setup: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
};

const typeLabels = {
  crm: 'CRM',
  helpdesk: 'Help Desk',
  ecommerce: 'E-commerce',
  email_marketing: 'Email Marketing',
  calendar: 'Calendar',
  analytics: 'Analytics'
};

export default function IntegrationManager({ onCreateNew, onEditIntegration }: IntegrationManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [oauthIntegrations, setOauthIntegrations] = useState<ConnectedIntegration[]>([]);
  const [syncStats, setSyncStats] = useState<{ [provider: string]: SyncStats }>({});
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showLogsPage, setShowLogsPage] = useState(false);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  
  // OAuth Integration Modal
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'shopify' | 'salesforce' | 'hubspot' | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Starting to fetch integrations...');
      
      // Fetch each integration type with individual error handling
      let traditionalIntegrations = [];
      let oauthIntegrations = [];
      let syncStatsData = {};
      let logs = [];
      
      try {
        console.log('[DEBUG] Fetching traditional integrations...');
        traditionalIntegrations = await integrationManager.getIntegrations();
        console.log('[DEBUG] Traditional integrations loaded:', traditionalIntegrations.length);
      } catch (error) {
        console.error('Error fetching traditional integrations:', error);
      }
      
      try {
        console.log('[DEBUG] Fetching OAuth connected integrations...');
        oauthIntegrations = await unifiedIntegrationService.getConnectedIntegrations();
        console.log('[DEBUG] OAuth integrations loaded:', oauthIntegrations.length);
      } catch (error) {
        console.error('Error getting connected integrations:', error);
        oauthIntegrations = []; // Fallback to empty array on error
      }
      
      try {
        console.log('[DEBUG] Fetching sync stats...');
        syncStatsData = await unifiedIntegrationService.getSyncStats();
        console.log('[DEBUG] Sync stats loaded:', Object.keys(syncStatsData).length);
      } catch (error) {
        console.error('Error fetching sync stats:', error);
        syncStatsData = {}; // Fallback to empty object on error
      }
      
      try {
        console.log('[DEBUG] Fetching integration logs...');
        logs = await unifiedIntegrationService.getIntegrationLogs(undefined, 50);
        console.log('[DEBUG] Integration logs loaded:', logs.length);
      } catch (error) {
        console.error('Error getting integration logs:', error);
        logs = []; // Fallback to empty array on error
      }
      
      setIntegrations(traditionalIntegrations);
      setOauthIntegrations(oauthIntegrations);
      setSyncStats(syncStatsData);
      setIntegrationLogs(logs);
      
      console.log('[DEBUG] All integrations fetched successfully');
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      setActionLoading(prev => ({ ...prev, [integration.id]: true }));
      await integrationManager.syncData(integration.id, 'incremental');
      await fetchIntegrations();
    } catch (error) {
      console.error('Error syncing integration:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleToggleStatus = async (integration: Integration) => {
    try {
      setActionLoading(prev => ({ ...prev, [integration.id]: true }));
      const newStatus = integration.status === 'active' ? 'inactive' : 'active';
      await integrationManager.updateIntegration(integration.id, { status: newStatus });
      await fetchIntegrations();
    } catch (error) {
      console.error('Error toggling integration status:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const handleDelete = async (integration: Integration) => {
    if (window.confirm(`Are you sure you want to delete the ${integration.name} integration?`)) {
      try {
        setActionLoading(prev => ({ ...prev, [integration.id]: true }));
        await integrationManager.deleteIntegration(integration.id);
        await fetchIntegrations();
      } catch (error) {
        console.error('Error deleting integration:', error);
      } finally {
        setActionLoading(prev => ({ ...prev, [integration.id]: false }));
      }
    }
  };

  const handleViewDetails = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDetails(true);
    
    // Fetch sync jobs for this integration
    try {
      // In a real app, this would fetch from the API
      // For now, we'll use mock data
      setSyncJobs([]);
    } catch (error) {
      console.error('Error fetching sync jobs:', error);
    }
  };

  // OAuth Integration Handlers
  const handleOAuthSync = async (integrationId: string): Promise<void> => {
    try {
      await unifiedIntegrationService.syncIntegration(integrationId);
      await fetchIntegrations(); // Refresh data
    } catch (error) {
      console.error('OAuth sync failed:', error);
      throw error;
    }
  };

  const handleOAuthDisconnect = async (integrationId: string): Promise<void> => {
    try {
      await unifiedIntegrationService.disconnectIntegration(integrationId);
      await fetchIntegrations(); // Refresh data
    } catch (error) {
      console.error('OAuth disconnect failed:', error);
      throw error;
    }
  };

  const handleOAuthTest = async (integrationId: string): Promise<boolean> => {
    try {
      return await unifiedIntegrationService.testConnection(integrationId);
    } catch (error) {
      console.error('OAuth test failed:', error);
      return false;
    }
  };

  const handleAddOAuthIntegration = (provider: 'shopify' | 'salesforce' | 'hubspot') => {
    setSelectedProvider(provider);
    setShowSetupModal(true);
  };

  const handleSetupSuccess = () => {
    fetchIntegrations(); // Refresh data after successful setup
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
    const matchesType = typeFilter === 'all' || integration.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderLogo = (provider: string) => {
    const logoMap: Record<string, string> = {
      salesforce: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/salesforce.svg',
      hubspot: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hubspot.svg',
      zendesk: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/zendesk.svg',
      intercom: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/intercom.svg',
      shopify: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/shopify.svg',
      mailchimp: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mailchimp.svg',
      'google-calendar': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/googlecalendar.svg'
    };
    return logoMap[provider] || 'https://via.placeholder.com/32x32/6366f1/white?text=' + provider.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <AnimatedSpinner size="lg" />
      </div>
    );
  }

  if (showLogsPage) {
    return (
      <IntegrationLogsPage
        onBack={() => setShowLogsPage(false)}
      />
    );
  }

  if (showDetails && selectedIntegration) {
    return (
      <IntegrationDetails
        integration={selectedIntegration}
        syncJobs={syncJobs}
        onBack={() => setShowDetails(false)}
        onEdit={() => onEditIntegration(selectedIntegration)}
        onSync={() => handleSync(selectedIntegration)}
        onToggleStatus={() => handleToggleStatus(selectedIntegration)}
        onDelete={() => handleDelete(selectedIntegration)}
        loading={actionLoading[selectedIntegration.id] || false}
      />
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
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                Integration Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your active integrations and sync settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowLogsPage(true)}>
              <FileText className="w-4 h-4 mr-2" />
              View Logs
            </Button>
            <Button variant="primary" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
            <option value="pending_setup">Pending Setup</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal"
          >
            <option value="all">All Types</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Quick Add OAuth Integrations */}
      {oauthIntegrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { provider: 'shopify' as const, name: 'Shopify', description: 'E-commerce platform', color: 'bg-green-500' },
              { provider: 'salesforce' as const, name: 'Salesforce', description: 'CRM platform', color: 'bg-blue-500' },
              { provider: 'hubspot' as const, name: 'HubSpot', description: 'Marketing & CRM', color: 'bg-orange-500' }
            ].map((integration) => (
              <button
                key={integration.provider}
                onClick={() => handleAddOAuthIntegration(integration.provider)}
                className="p-4 text-left border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${integration.color} rounded-lg flex items-center justify-center`}>
                    <img
                      src={`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/${integration.provider}.svg`}
                      alt={integration.name}
                      className="w-6 h-6 filter brightness-0 invert"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* OAuth Integrations */}
      {oauthIntegrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Integrations</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleAddOAuthIntegration('shopify')}>
                + Shopify
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddOAuthIntegration('salesforce')}>
                + Salesforce
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddOAuthIntegration('hubspot')}>
                + HubSpot
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {oauthIntegrations.map((integration) => (
              <OAuthIntegrationCard
                key={integration.id}
                integration={integration}
                syncStats={syncStats[integration.provider]}
                onSync={handleOAuthSync}
                onDisconnect={handleOAuthDisconnect}
                onTest={handleOAuthTest}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Traditional Integrations Grid */}
      {filteredIntegrations.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Other Integrations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass hover:shadow-elevation-2 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm">
                    <img 
                      src={getProviderLogo(integration.provider)} 
                      alt={integration.provider} 
                      className="w-8 h-8" 
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {typeLabels[integration.type]}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[integration.status]}`}>
                    {statusIcons[integration.status]}
                    {integration.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Last Sync</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(integration.last_sync_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Sync Frequency</span>
                  <span className="text-gray-900 dark:text-white">
                    {integration.sync_frequency < 60 ? `${integration.sync_frequency}s` :
                     integration.sync_frequency < 3600 ? `${Math.floor(integration.sync_frequency / 60)}m` :
                     `${Math.floor(integration.sync_frequency / 3600)}h`}
                  </span>
                </div>
                {integration.error_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Errors</span>
                    <span className="text-red-600 font-medium">{integration.error_count}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(integration)}
                    disabled={actionLoading[integration.id] || integration.status !== 'active'}
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading[integration.id] ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(integration)}
                    disabled={actionLoading[integration.id]}
                  >
                    {integration.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditIntegration(integration)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(integration)}
                    disabled={actionLoading[integration.id]}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(integration)}
                >
                  View Details
                </Button>
              </div>
            </motion.div>
          ))}
          </div>
        </motion.div>
      ) : null}

      {/* Empty State */}
      {oauthIntegrations.length === 0 && filteredIntegrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No integrations connected yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Connect your first integration to start syncing data with ROMASHKA.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="primary" onClick={() => handleAddOAuthIntegration('shopify')}>
              Connect Shopify
            </Button>
            <Button variant="outline" onClick={() => handleAddOAuthIntegration('salesforce')}>
              Connect Salesforce
            </Button>
            <Button variant="outline" onClick={() => handleAddOAuthIntegration('hubspot')}>
              Connect HubSpot
            </Button>
          </div>
        </motion.div>
      )}

      {/* Integration Setup Modal */}
      <IntegrationSetupModal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          setSelectedProvider(null);
        }}
        provider={selectedProvider}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}

// Integration Details Component
interface IntegrationDetailsProps {
  integration: Integration;
  syncJobs: SyncJob[];
  onBack: () => void;
  onEdit: () => void;
  onSync: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  loading: boolean;
}

function IntegrationDetails({ 
  integration, 
  syncJobs, 
  onBack, 
  onEdit, 
  onSync, 
  onToggleStatus, 
  onDelete, 
  loading 
}: IntegrationDetailsProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Plus className="w-4 h-4 mr-2 rotate-45" />
            Back to Integrations
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl p-3 flex items-center justify-center shadow-sm">
              <img 
                src={`https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/${integration.provider}.svg`} 
                alt={integration.provider} 
                className="w-10 h-10" 
              />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                {integration.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {integration.provider} • {typeLabels[integration.type]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            <Button 
              variant="primary" 
              onClick={onSync}
              disabled={loading || integration.status !== 'active'}
              loading={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${statusColors[integration.status]}`}>
              {statusIcons[integration.status]}
              {integration.status.replace('_', ' ').toUpperCase()}
            </div>
            {integration.last_sync_at && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Last synced: {new Date(integration.last_sync_at).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={integration.status === 'active' ? 'outline' : 'primary'}
              size="sm"
              onClick={onToggleStatus}
              disabled={loading}
            >
              {integration.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Configuration Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Sync Direction</label>
            <p className="text-gray-900 dark:text-white">
              {integration.sync_settings?.syncDirection || 'Bidirectional'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Sync Frequency</label>
            <p className="text-gray-900 dark:text-white">
              {integration.sync_frequency < 60 ? `${integration.sync_frequency} seconds` :
               integration.sync_frequency < 3600 ? `${Math.floor(integration.sync_frequency / 60)} minutes` :
               `${Math.floor(integration.sync_frequency / 3600)} hours`}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Auto Sync</label>
            <p className="text-gray-900 dark:text-white">
              {integration.sync_settings?.autoSync ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Error Count</label>
            <p className={integration.error_count > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}>
              {integration.error_count}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sync History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sync History</h3>
        {syncJobs.length > 0 ? (
          <div className="space-y-3">
            {syncJobs.slice(0, 10).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'failed' ? 'bg-red-500' :
                    job.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {job.job_type.replace('_', ' ')} sync
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {job.records_processed} / {job.records_total} records
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {job.started_at && new Date(job.started_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No sync history available
          </div>
        )}
      </motion.div>
    </div>
  );
}