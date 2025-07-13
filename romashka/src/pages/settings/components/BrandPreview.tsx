import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Globe, Smartphone } from 'lucide-react';

interface BrandPreviewProps {
  settings: {
    logo: {
      light: string;
      dark: string;
      favicon: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    company: {
      name: string;
      tagline: string;
    };
    whiteLabelSettings: {
      hidePoweredBy: boolean;
      customDomain: string;
    };
  };
  device: 'desktop' | 'mobile';
}

export default function BrandPreview({ settings, device }: BrandPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'widget' | 'email' | 'website'>('widget');

  const renderWidgetPreview = () => (
    <div 
      className={`bg-white rounded-lg shadow-lg border ${
        device === 'mobile' ? 'w-80 h-96' : 'w-96 h-80'
      } flex flex-col overflow-hidden`}
    >
      {/* Widget Header */}
      <div 
        className="p-4 text-white flex items-center gap-3"
        style={{ backgroundColor: settings.colors.primary }}
      >
        {settings.logo.light && (
          <img 
            src={settings.logo.light} 
            alt="Logo" 
            className="h-8 w-auto max-w-[120px] object-contain brightness-0 invert"
          />
        )}
        {!settings.logo.light && (
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{settings.company.name}</h3>
          <p className="text-xs opacity-90">Chat with us</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-3 bg-gray-50">
        <div className="flex items-start gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: settings.colors.primary }}
          >
            AI
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm text-gray-800">
                Hi! Welcome to {settings.company.name}. {settings.company.tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <div 
            className="rounded-lg p-3 text-white text-sm max-w-xs"
            style={{ backgroundColor: settings.colors.secondary }}
          >
            Hello! I need help with my order.
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: settings.colors.primary }}
          >
            AI
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm text-gray-800">
                I'd be happy to help you with your order! Could you please provide your order number?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': settings.colors.primary } as React.CSSProperties}
          />
          <button 
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: settings.colors.primary }}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Powered By */}
      {!settings.whiteLabelSettings.hidePoweredBy && (
        <div className="px-4 py-2 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Powered by {settings.logo.light ? settings.company.name : 'ROMASHKA'}
          </p>
        </div>
      )}
    </div>
  );

  const renderEmailPreview = () => (
    <div 
      className={`bg-white rounded-lg shadow-lg border overflow-hidden ${
        device === 'mobile' ? 'w-80' : 'w-96'
      }`}
    >
      {/* Email Header */}
      <div 
        className="p-6 text-white"
        style={{ backgroundColor: settings.colors.primary }}
      >
        <div className="flex items-center gap-3 mb-4">
          {settings.logo.light && (
            <img 
              src={settings.logo.light} 
              alt="Logo" 
              className="h-12 w-auto max-w-[150px] object-contain brightness-0 invert"
            />
          )}
          {!settings.logo.light && (
            <div className="text-2xl font-bold">{settings.company.name}</div>
          )}
        </div>
        <h1 className="text-xl font-semibold">Welcome to {settings.company.name}!</h1>
        <p className="text-sm opacity-90 mt-1">{settings.company.tagline}</p>
      </div>

      {/* Email Body */}
      <div className="p-6">
        <p className="text-gray-800 mb-4">
          Thank you for choosing {settings.company.name}. We're excited to help you get started!
        </p>
        
        <div 
          className="inline-block px-6 py-3 rounded-lg text-white font-medium"
          style={{ backgroundColor: settings.colors.secondary }}
        >
          Get Started
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Best regards,<br />
            The {settings.company.name} Team
          </p>
        </div>

        {!settings.whiteLabelSettings.hidePoweredBy && (
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Powered by {settings.logo.light ? settings.company.name : 'ROMASHKA'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWebsitePreview = () => (
    <div 
      className={`bg-white rounded-lg shadow-lg border overflow-hidden ${
        device === 'mobile' ? 'w-80 h-96' : 'w-96 h-80'
      }`}
    >
      {/* Website Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo.light && (
              <img 
                src={settings.logo.light} 
                alt="Logo" 
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            )}
            {!settings.logo.light && (
              <div className="text-lg font-bold text-gray-800">{settings.company.name}</div>
            )}
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-800">Home</a>
            <a href="#" className="hover:text-gray-800">About</a>
            <a href="#" className="hover:text-gray-800">Contact</a>
          </nav>
        </div>
      </div>

      {/* Website Content */}
      <div className="p-6 flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to {settings.company.name}
        </h1>
        <p className="text-gray-600 mb-6">{settings.company.tagline}</p>
        
        <div className="space-y-4">
          <button 
            className="px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: settings.colors.primary }}
          >
            Get Started
          </button>
          
          <button 
            className="ml-3 px-6 py-3 rounded-lg font-medium border"
            style={{ 
              color: settings.colors.secondary, 
              borderColor: settings.colors.secondary 
            }}
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Chat Widget Button */}
      <div className="absolute bottom-4 right-4">
        <button 
          className="w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center"
          style={{ backgroundColor: settings.colors.primary }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Preview Mode Selector */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setPreviewMode('widget')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            previewMode === 'widget'
              ? 'bg-white dark:bg-gray-600 text-primary-teal shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Widget
        </button>
        <button
          onClick={() => setPreviewMode('email')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            previewMode === 'email'
              ? 'bg-white dark:bg-gray-600 text-primary-teal shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          onClick={() => setPreviewMode('website')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            previewMode === 'website'
              ? 'bg-white dark:bg-gray-600 text-primary-teal shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          Website
        </button>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <motion.div
          key={`${previewMode}-${device}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {previewMode === 'widget' && renderWidgetPreview()}
          {previewMode === 'email' && renderEmailPreview()}
          {previewMode === 'website' && renderWebsitePreview()}
        </motion.div>
      </div>

      {/* Preview Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Preview shows how your branding appears across different touchpoints
      </div>
    </div>
  );
}