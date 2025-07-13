import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Palette, 
  Type, 
  Monitor, 
  Smartphone, 
  Save, 
  RotateCcw,
  Eye,
  Settings,
  Zap,
  Mail,
  Globe
} from 'lucide-react';
import { Button } from '../../../components/ui';
import LogoManager from './LogoManager';
import ColorCustomizer from './ColorCustomizer';
import BrandPreview from './BrandPreview';

export interface BrandConfig {
  // Company Information
  companyName: string;
  tagline: string;
  
  // Logo Configuration
  logos: {
    primary: string;
    light: string;
    dark: string;
    favicon: string;
  };
  
  // Color Palette
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
  
  // Typography
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
  };
  
  // White-label Options
  whiteLabel: {
    enabled: boolean;
    showBranding: boolean;
    customDomain: string;
    customTitle: string;
  };
}

const defaultBrandConfig: BrandConfig = {
  companyName: 'ROMASHKA',
  tagline: 'Your AI-Powered Customer Support Platform',
  logos: {
    primary: '',
    light: '',
    dark: '',
    favicon: ''
  },
  colors: {
    primary: '#1a365d',
    secondary: '#38b2ac',
    accent: '#ed8936',
    background: '#ffffff',
    text: '#2d3748',
    success: '#48bb78',
    warning: '#ecc94b',
    error: '#f56565'
  },
  typography: {
    headingFont: 'Sora',
    bodyFont: 'Inter',
    monoFont: 'Fira Code'
  },
  whiteLabel: {
    enabled: false,
    showBranding: true,
    customDomain: '',
    customTitle: ''
  }
};

export default function BrandSettings() {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(defaultBrandConfig);
  const [activeSection, setActiveSection] = useState<'logo' | 'colors' | 'typography' | 'whitelabel'>('logo');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing brand configuration
  useEffect(() => {
    loadBrandConfig();
  }, []);

  const loadBrandConfig = async () => {
    try {
      // In a real app, load from Supabase
      const saved = localStorage.getItem('brandConfig');
      if (saved) {
        setBrandConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load brand config:', error);
    }
  };

  const saveBrandConfig = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, save to Supabase
      localStorage.setItem('brandConfig', JSON.stringify(brandConfig));
      
      // Apply changes to CSS variables
      applyBrandChanges(brandConfig);
      
      setHasChanges(false);
      
      // Show success message
      console.log('Brand configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save brand config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetBrandConfig = () => {
    setBrandConfig(defaultBrandConfig);
    setHasChanges(true);
  };

  const applyBrandChanges = (config: BrandConfig) => {
    const root = document.documentElement;
    
    // Apply color variables
    root.style.setProperty('--brand-primary', config.colors.primary);
    root.style.setProperty('--brand-secondary', config.colors.secondary);
    root.style.setProperty('--brand-accent', config.colors.accent);
    root.style.setProperty('--brand-background', config.colors.background);
    root.style.setProperty('--brand-text', config.colors.text);
    root.style.setProperty('--brand-success', config.colors.success);
    root.style.setProperty('--brand-warning', config.colors.warning);
    root.style.setProperty('--brand-error', config.colors.error);
    
    // Apply typography
    root.style.setProperty('--brand-heading-font', config.typography.headingFont);
    root.style.setProperty('--brand-body-font', config.typography.bodyFont);
    root.style.setProperty('--brand-mono-font', config.typography.monoFont);
  };

  const updateBrandConfig = (updates: Partial<BrandConfig>) => {
    setBrandConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const sections = [
    {
      id: 'logo' as const,
      label: 'Logo & Identity',
      icon: <Upload size={20} />,
      description: 'Upload and manage your brand logos'
    },
    {
      id: 'colors' as const,
      label: 'Colors',
      icon: <Palette size={20} />,
      description: 'Customize your brand color palette'
    },
    {
      id: 'typography' as const,
      label: 'Typography',
      icon: <Type size={20} />,
      description: 'Choose fonts and text styling'
    },
    {
      id: 'whitelabel' as const,
      label: 'White-label',
      icon: <Settings size={20} />,
      description: 'Configure white-label options'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'logo':
        return (
          <LogoManager 
            config={brandConfig}
            onConfigUpdate={updateBrandConfig}
          />
        );
      case 'colors':
        return (
          <ColorCustomizer 
            config={brandConfig}
            onConfigUpdate={updateBrandConfig}
          />
        );
      case 'typography':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Typography Settings</h3>
            <p className="text-gray-600 dark:text-gray-300">Typography customization coming soon...</p>
          </div>
        );
      case 'whitelabel':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">White-label Settings</h3>
            <p className="text-gray-600 dark:text-gray-300">White-label options coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
      {/* Left Column - Settings */}
      <div className="xl:col-span-2 space-y-6">
        {/* Company Information */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-lg">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={brandConfig.companyName}
                onChange={(e) => updateBrandConfig({ companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tagline</label>
              <input
                type="text"
                value={brandConfig.tagline}
                onChange={(e) => updateBrandConfig({ tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Enter tagline"
              />
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${activeSection === section.id
                  ? 'bg-gradient-button text-white shadow-elevation-1'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {section.icon}
              <span className="text-sm">{section.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Active Section Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-elevation-1 border border-gray-200 dark:border-gray-700 min-h-[400px]">
          {renderActiveSection()}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={resetBrandConfig}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <RotateCcw size={16} />
              Reset to Default
            </button>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={saveBrandConfig}
              disabled={isLoading || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column - Live Preview */}
      <div className="xl:col-span-1">
        <div className="sticky top-6">
          <BrandPreview config={brandConfig} />
        </div>
      </div>
    </div>
  );
}