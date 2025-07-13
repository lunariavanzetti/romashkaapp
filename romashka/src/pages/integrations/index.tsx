import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IntegrationMarketplace from './IntegrationMarketplace';
import IntegrationSetup from './IntegrationSetup';
import IntegrationManager from './IntegrationManager';
import { IntegrationProvider, Integration } from '../../types/integrations';

type ViewMode = 'marketplace' | 'setup' | 'manager';

export default function IntegrationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const handleSetupIntegration = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setViewMode('setup');
  };

  const handleSetupComplete = (integrationId: string) => {
    // Integration setup completed successfully
    console.log('Integration setup completed:', integrationId);
    setSelectedProvider(null);
    setViewMode('manager');
    // Could show a success toast here
  };

  const handleSetupCancel = () => {
    setSelectedProvider(null);
    setViewMode('manager');
  };

  const handleCreateNew = () => {
    setViewMode('marketplace');
  };

  const handleEditIntegration = (integration: Integration) => {
    // For now, we'll just log this - in a real implementation,
    // this would open an edit form similar to the setup wizard
    console.log('Edit integration:', integration);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'marketplace':
        return (
          <IntegrationMarketplace
            onSetupIntegration={handleSetupIntegration}
          />
        );
      
      case 'setup':
        if (!selectedProvider) {
          setViewMode('marketplace');
          return null;
        }
        return (
          <IntegrationSetup
            provider={selectedProvider}
            onComplete={handleSetupComplete}
            onCancel={handleSetupCancel}
          />
        );
      
      case 'manager':
      default:
        return (
          <IntegrationManager
            onCreateNew={handleCreateNew}
            onEditIntegration={handleEditIntegration}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Navigation Tab Bar */}
      {viewMode === 'manager' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between py-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setViewMode('manager')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'manager'
                      ? 'text-primary-teal border-b-2 border-primary-teal'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  My Integrations
                </button>
                <button
                  onClick={() => setViewMode('marketplace')}
                  className="px-3 py-2 text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Browse Marketplace
                </button>
              </nav>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}