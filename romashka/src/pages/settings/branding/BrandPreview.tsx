import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Smartphone, 
  MessageSquare, 
  Mail, 
  Globe, 
  Eye,
  Settings,
  User,
  Bell,
  Search
} from 'lucide-react';
import { BrandConfig } from './BrandSettings';

interface BrandPreviewProps {
  config: BrandConfig;
}

type PreviewContext = 'header' | 'widget' | 'email' | 'dashboard';

export default function BrandPreview({ config }: BrandPreviewProps) {
  const [activeContext, setActiveContext] = useState<PreviewContext>('header');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const contexts = [
    {
      id: 'header' as const,
      label: 'Header',
      icon: <Monitor size={16} />,
      description: 'How your logo appears in the header'
    },
    {
      id: 'widget' as const,
      label: 'Chat Widget',
      icon: <MessageSquare size={16} />,
      description: 'Chat widget appearance'
    },
    {
      id: 'email' as const,
      label: 'Email',
      icon: <Mail size={16} />,
      description: 'Email template branding'
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: <Globe size={16} />,
      description: 'Dashboard interface preview'
    }
  ];

  const renderHeaderPreview = () => {
    const logoUrl = config.logos.primary || config.logos.light;
    
    return (
      <div 
        className="w-full rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${config.colors.primary}, ${config.colors.secondary})`
        }}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-8 object-contain"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-white font-bold text-sm">
                  {config.companyName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-white font-heading text-lg font-bold">
              {config.companyName}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-white/60" size={16} />
              <input 
                className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 w-64 text-white placeholder-white/60 text-sm" 
                placeholder="Search..." 
                readOnly
              />
            </div>
            <Bell className="text-white/80" size={20} />
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWidgetPreview = () => {
    const logoUrl = config.logos.primary || config.logos.light;
    
    return (
      <div className="flex justify-end">
        <div 
          className="w-80 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: config.colors.background }}
        >
          {/* Widget Header */}
          <div 
            className="px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: config.colors.primary }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-6 object-contain"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-white font-bold text-xs">
                  {config.companyName.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">{config.companyName}</h3>
              <p className="text-white/80 text-xs">{config.tagline}</p>
            </div>
          </div>
          
          {/* Widget Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: config.colors.primary }}
              >
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <div className="flex-1">
                <div 
                  className="p-3 rounded-lg rounded-bl-none text-sm"
                  style={{ 
                    backgroundColor: config.colors.primary + '20',
                    color: config.colors.text
                  }}
                >
                  Hello! How can I help you today?
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1">
                <div 
                  className="p-3 rounded-lg rounded-br-none text-sm ml-8"
                  style={{ 
                    backgroundColor: config.colors.secondary,
                    color: '#ffffff'
                  }}
                >
                  I need help with my account
                </div>
              </div>
            </div>
          </div>
          
          {/* Widget Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                style={{ color: config.colors.text }}
                readOnly
              />
              <button
                className="p-2 rounded-lg text-white"
                style={{ backgroundColor: config.colors.secondary }}
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmailPreview = () => {
    const logoUrl = config.logos.primary || config.logos.light;
    
    return (
      <div 
        className="w-full rounded-lg overflow-hidden shadow-lg"
        style={{ backgroundColor: config.colors.background }}
      >
        {/* Email Header */}
        <div 
          className="px-6 py-4 border-b"
          style={{ 
            backgroundColor: config.colors.primary,
            borderBottomColor: config.colors.primary + '40'
          }}
        >
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-8 object-contain"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-white font-bold text-sm">
                  {config.companyName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-white font-heading text-lg font-bold">
                {config.companyName}
              </h2>
              <p className="text-white/80 text-sm">{config.tagline}</p>
            </div>
          </div>
        </div>
        
        {/* Email Content */}
        <div className="p-6">
          <h3 
            className="text-xl font-semibold mb-4"
            style={{ color: config.colors.text }}
          >
            Welcome to {config.companyName}!
          </h3>
          
          <div 
            className="space-y-4 text-sm"
            style={{ color: config.colors.text }}
          >
            <p>Thank you for signing up for our platform. We're excited to have you on board!</p>
            
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: config.colors.secondary + '20' }}
            >
              <p className="font-medium">Getting Started:</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Complete your profile setup</li>
                <li>• Explore the dashboard</li>
                <li>• Connect your first integration</li>
              </ul>
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <button
                className="px-6 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: config.colors.primary }}
              >
                Get Started
              </button>
              <button
                className="px-6 py-2 rounded-lg font-medium"
                style={{ 
                  backgroundColor: config.colors.secondary + '20',
                  color: config.colors.secondary
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        {/* Email Footer */}
        <div 
          className="px-6 py-4 border-t text-center"
          style={{ 
            backgroundColor: config.colors.background,
            borderTopColor: config.colors.primary + '20'
          }}
        >
          <p 
            className="text-xs"
            style={{ color: config.colors.text + '80' }}
          >
            © 2024 {config.companyName}. All rights reserved.
          </p>
        </div>
      </div>
    );
  };

  const renderDashboardPreview = () => {
    return (
      <div className="w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
        {/* Dashboard Header */}
        <div 
          className="px-6 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(90deg, ${config.colors.primary}, ${config.colors.secondary})` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <span className="text-white font-bold text-xs">
                {config.companyName.charAt(0)}
              </span>
            </div>
            <span className="text-white font-medium text-sm">{config.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="text-white/80" size={16} />
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Stats Cards */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <span className="text-xs font-medium">Active Chats</span>
              </div>
              <p className="text-lg font-bold mt-1">24</p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.colors.secondary }}
                />
                <span className="text-xs font-medium">Response Time</span>
              </div>
              <p className="text-lg font-bold mt-1">1.2s</p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.colors.accent }}
                />
                <span className="text-xs font-medium">Satisfaction</span>
              </div>
              <p className="text-lg font-bold mt-1">4.8/5</p>
            </div>
          </div>
          
          {/* Chart Preview */}
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Activity Overview</h4>
            <div className="h-16 rounded" style={{ backgroundColor: config.colors.primary + '20' }}>
              <div className="h-full flex items-end justify-around p-2">
                {[40, 60, 80, 45, 70, 90, 65].map((height, i) => (
                  <div
                    key={i}
                    className="rounded-t"
                    style={{
                      backgroundColor: config.colors.primary,
                      height: `${height}%`,
                      width: '8px'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (activeContext) {
      case 'header':
        return renderHeaderPreview();
      case 'widget':
        return renderWidgetPreview();
      case 'email':
        return renderEmailPreview();
      case 'dashboard':
        return renderDashboardPreview();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-elevation-1 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="text-primary-teal" size={20} />
            <h3 className="font-semibold">Live Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded-lg ${deviceView === 'desktop' ? 'bg-primary-teal text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded-lg ${deviceView === 'mobile' ? 'bg-primary-teal text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
        
        {/* Context Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {contexts.map((context) => (
            <button
              key={context.id}
              onClick={() => setActiveContext(context.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeContext === context.id
                  ? 'bg-primary-teal text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {context.icon}
              {context.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="p-4">
        <div className={`${deviceView === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeContext}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPreview()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {contexts.find(c => c.id === activeContext)?.description}
        </p>
      </div>
    </div>
  );
}