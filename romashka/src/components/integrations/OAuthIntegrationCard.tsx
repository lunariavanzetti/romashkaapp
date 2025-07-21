/**
 * OAuth Integration Card Component
 * Displays OAuth-based integrations (Shopify, Salesforce, HubSpot) with connection status and actions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ExternalLink,
  BarChart3,
  Users,
  Package,
  DollarSign
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { ConnectedIntegration, SyncStats } from '../../services/integrations/unifiedIntegrationService';

interface OAuthIntegrationCardProps {
  integration: ConnectedIntegration;
  syncStats?: SyncStats;
  onSync: (integrationId: string) => Promise<void>;
  onDisconnect: (integrationId: string) => Promise<void>;
  onTest: (integrationId: string) => Promise<boolean>;
  loading?: boolean;
}

const providerIcons = {
  shopify: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/shopify.svg',
  salesforce: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/salesforce.svg',
  hubspot: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hubspot.svg',
};

const providerColors = {
  shopify: 'bg-green-500',
  salesforce: 'bg-blue-500', 
  hubspot: 'bg-orange-500',
};

const statusIcons = {
  connected: <CheckCircle className="w-4 h-4 text-green-500" />,
  disconnected: <AlertTriangle className="w-4 h-4 text-gray-400" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

const statusColors = {
  connected: 'bg-green-50 text-green-700 border-green-200',
  disconnected: 'bg-gray-50 text-gray-700 border-gray-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

export default function OAuthIntegrationCard({
  integration,
  syncStats,
  onSync,
  onDisconnect,
  onTest,
  loading = false
}: OAuthIntegrationCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<boolean | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await onSync(integration.id);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const result = await onTest(integration.id);
      setLastTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      setLastTestResult(false);
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm(`Are you sure you want to disconnect ${integration.name}? This will remove all synced data.`)) {
      try {
        await onDisconnect(integration.id);
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getProviderSpecificStats = () => {
    if (!syncStats) return null;

    switch (integration.provider) {
      case 'shopify':
        return (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-1">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.contacts}</div>
              <div className="text-xs text-gray-500">Customers</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.orders}</div>
              <div className="text-xs text-gray-500">Orders</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mb-1">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.products}</div>
              <div className="text-xs text-gray-500">Products</div>
            </div>
          </div>
        );
      
      case 'salesforce':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-1">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.contacts}</div>
              <div className="text-xs text-gray-500">Leads & Contacts</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-1">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.deals}</div>
              <div className="text-xs text-gray-500">Opportunities</div>
            </div>
          </div>
        );
      
      case 'hubspot':
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mb-1">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.contacts}</div>
              <div className="text-xs text-gray-500">Contacts</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-1">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">{syncStats.deals}</div>
              <div className="text-xs text-gray-500">Deals</div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${providerColors[integration.provider]} rounded-lg p-2 flex items-center justify-center`}>
            <img
              src={providerIcons[integration.provider]}
              alt={integration.provider}
              className="w-8 h-8 filter brightness-0 invert"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{integration.provider}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[integration.status]}`}>
            {statusIcons[integration.status]}
            <span className="ml-1 capitalize">{integration.status}</span>
          </div>
        </div>
      </div>

      {/* Connection Test Result */}
      {lastTestResult !== null && (
        <div className={`mb-4 p-3 rounded-lg ${lastTestResult ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center space-x-2">
            {lastTestResult ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700">Connection test successful</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">Connection test failed</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sync Information */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Last Sync</span>
          <span className="text-gray-900">{formatLastSync(integration.last_sync_at)}</span>
        </div>
        
        {syncStats && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Records</span>
            <span className="font-medium text-gray-900">{syncStats.total_synced.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Provider-specific stats */}
      {getProviderSpecificStats()}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing || loading || integration.status !== 'connected'}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            disabled={testing || loading}
          >
            <ExternalLink className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={syncing || loading || integration.status !== 'connected'}
          onClick={handleSync}
        >
          {syncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </Button>
      </div>
    </motion.div>
  );
}