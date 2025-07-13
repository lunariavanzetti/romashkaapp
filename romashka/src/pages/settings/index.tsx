import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../../components/layout';
import { 
  Settings, 
  Palette, 
  User, 
  Shield, 
  CreditCard, 
  Bell,
  Globe,
  Users,
  Database
} from 'lucide-react';
import BrandSettings from './branding/BrandSettings';

type SettingsTab = 'brand' | 'account' | 'security' | 'billing' | 'notifications' | 'team' | 'advanced';

interface SettingsTabInfo {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ComponentType;
}

const settingsTabs: SettingsTabInfo[] = [
  {
    id: 'brand',
    label: 'Brand & Customization',
    icon: <Palette size={20} />,
    description: 'Customize your brand colors, logo, and white-label settings',
    component: BrandSettings
  },
  {
    id: 'account',
    label: 'Account',
    icon: <User size={20} />,
    description: 'Manage your account information and preferences',
    component: () => <div className="p-6">Account settings coming soon...</div>
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield size={20} />,
    description: 'Password, two-factor authentication, and security settings',
    component: () => <div className="p-6">Security settings coming soon...</div>
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <CreditCard size={20} />,
    description: 'Manage your subscription and billing information',
    component: () => <div className="p-6">Billing settings coming soon...</div>
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell size={20} />,
    description: 'Configure email and push notification preferences',
    component: () => <div className="p-6">Notification settings coming soon...</div>
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users size={20} />,
    description: 'Manage team members and permissions',
    component: () => <div className="p-6">Team settings coming soon...</div>
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <Database size={20} />,
    description: 'API keys, webhooks, and advanced configuration',
    component: () => <div className="p-6">Advanced settings coming soon...</div>
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('brand');

  const activeTabInfo = settingsTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabInfo?.component || (() => <div>Tab not found</div>);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-primary-deep-blue dark:text-primary-teal" size={28} />
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your account, branding, and platform configuration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevation-1 border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {settingsTabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                      ${activeTab === tab.id
                        ? 'bg-gradient-button text-white shadow-elevation-1'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex-shrink-0">{tab.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className={`text-xs mt-0.5 ${
                        activeTab === tab.id 
                          ? 'text-white/80' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevation-1 border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Tab Header */}
              <div className="bg-gradient-to-r from-primary-deep-blue to-primary-teal p-6 text-white">
                <div className="flex items-center gap-3">
                  {activeTabInfo?.icon}
                  <div>
                    <h2 className="text-xl font-heading font-bold">{activeTabInfo?.label}</h2>
                    <p className="text-white/80 mt-1">{activeTabInfo?.description}</p>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[600px]">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}