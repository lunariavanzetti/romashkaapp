import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Palette, User, Shield, CreditCard, Bell } from 'lucide-react';
import BrandSettings from './branding/BrandSettings';

type SettingsTab = 'brand' | 'account' | 'security' | 'billing' | 'notifications';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('brand');

  const tabs = [
    { id: 'brand' as const, label: 'Brand', icon: Palette, description: 'Logo, colors, and white-label settings' },
    { id: 'account' as const, label: 'Account', icon: User, description: 'Profile and organization settings' },
    { id: 'security' as const, label: 'Security', icon: Shield, description: 'Password, 2FA, and security settings' },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard, description: 'Subscription and payment methods' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, description: 'Email and alert preferences' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'brand':
        return <BrandSettings />;
      case 'account':
        return (
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
            <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-4">
              Account Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Account settings will be implemented in a future update.
            </p>
          </div>
        );
      case 'security':
        return (
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
            <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-4">
              Security Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Security settings will be implemented in a future update.
            </p>
          </div>
        );
      case 'billing':
        return (
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
            <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-4">
              Billing Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Billing settings will be implemented in a future update.
            </p>
          </div>
        );
      case 'notifications':
        return (
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
            <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Notification settings will be implemented in a future update.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Manage your ROMASHKA configuration and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass">
              <nav className="p-6">
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                          activeTab === tab.id
                            ? 'bg-primary-teal/10 text-primary-teal border border-primary-teal/20'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tab.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}