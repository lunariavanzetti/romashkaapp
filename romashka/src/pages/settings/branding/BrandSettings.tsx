import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Palette, 
  Eye, 
  Save, 
  RotateCcw, 
  ImageIcon, 
  Monitor, 
  Smartphone,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/ui';
import LogoUploader from '../components/LogoUploader';
import ColorPicker from '../components/ColorPicker';
import BrandPreview from '../components/BrandPreview';
import { useThemeStore } from '../../../stores/themeStore';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

interface BrandSettings {
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
}

export default function BrandSettings() {
  const { theme } = useThemeStore();
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandSettings>({
    logo: {
      light: '',
      dark: '',
      favicon: '',
    },
    colors: {
      primary: '#1E40AF',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
    company: {
      name: 'ROMASHKA',
      tagline: 'AI-Powered Customer Service',
    },
    whiteLabelSettings: {
      hidePoweredBy: false,
      customDomain: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Load existing settings
  useEffect(() => {
    if (user) {
      loadBrandSettings();
    }
  }, [user]);

  const loadBrandSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSettings({
          logo: {
            light: data.custom_logo_url || '',
            dark: data.custom_logo_url || '',
            favicon: data.custom_logo_url || '',
          },
          colors: {
            primary: data.primary_color || '#1E40AF',
            secondary: data.secondary_color || '#10B981',
            accent: data.primary_color || '#F59E0B',
          },
          company: {
            name: data.company_name || 'ROMASHKA',
            tagline: 'AI-Powered Customer Service',
          },
          whiteLabelSettings: {
            hidePoweredBy: data.white_label_enabled || false,
            customDomain: data.custom_domain || '',
          },
        });
      }
    } catch (error) {
      console.error('Error loading brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('❌ Please sign in to save brand settings.');
      return;
    }

    try {
      setSaving(true);
      setSaveStatus('idle');
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          user_id: user.id,
          custom_logo_url: settings.logo.light,
          primary_color: settings.colors.primary,
          secondary_color: settings.colors.secondary,
          company_name: settings.company.name,
          white_label_enabled: settings.whiteLabelSettings.hidePoweredBy,
          custom_domain: settings.whiteLabelSettings.customDomain,
        }, {
          onConflict: 'user_id'
        });

        if (error) {
          throw error;
        }

        // Apply theme changes immediately
        applyBrandingToTheme();
        setSaveStatus('success');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving brand settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      logo: {
        light: '',
        dark: '',
        favicon: '',
      },
      colors: {
        primary: '#1E40AF',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
      company: {
        name: 'ROMASHKA',
        tagline: 'AI-Powered Customer Service',
      },
      whiteLabelSettings: {
        hidePoweredBy: false,
        customDomain: '',
      },
    });
  };

  const applyBrandingToTheme = () => {
    // Apply custom CSS variables for real-time theme updates
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.colors.primary);
    root.style.setProperty('--color-secondary', settings.colors.secondary);
    root.style.setProperty('--color-accent', settings.colors.accent);
  };

  const handleLogoUpload = (logoUrls: { light: string; dark: string; favicon: string }) => {
    setSettings(prev => ({
      ...prev,
      logo: logoUrls,
    }));
  };

  const handleColorChange = (colorType: keyof BrandSettings['colors'], color: string) => {
    setSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: color,
      },
    }));
  };

  if (loading) {
    return (
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-teal" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading brand settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              Brand Customization
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Customize your brand identity and white-label settings
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Saved successfully</span>
              </motion.div>
            )}
            
            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-600"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Save failed</span>
              </motion.div>
            )}

            {/* Preview Device Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-md transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-white dark:bg-gray-600 text-primary-teal shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-md transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-white dark:bg-gray-600 text-primary-teal shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Logo Upload Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-primary-teal" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Logo & Branding
                </h3>
              </div>
              <LogoUploader
                currentLogo={settings.logo}
                onLogoUpload={handleLogoUpload}
              />
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.company.tagline}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      company: { ...prev.company, tagline: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="Your company tagline"
                  />
                </div>
              </div>
            </div>

            {/* Color Customization */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-primary-teal" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Brand Colors
                </h3>
              </div>
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  color={settings.colors.primary}
                  onChange={(color) => handleColorChange('primary', color)}
                />
                <ColorPicker
                  label="Secondary Color"
                  color={settings.colors.secondary}
                  onChange={(color) => handleColorChange('secondary', color)}
                />
                <ColorPicker
                  label="Accent Color"
                  color={settings.colors.accent}
                  onChange={(color) => handleColorChange('accent', color)}
                />
              </div>
            </div>

            {/* White-Label Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                White-Label Settings
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.whiteLabelSettings.hidePoweredBy}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      whiteLabelSettings: {
                        ...prev.whiteLabelSettings,
                        hidePoweredBy: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Hide "Powered by ROMASHKA"
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Remove ROMASHKA branding from chat widgets and emails
                    </p>
                  </div>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.whiteLabelSettings.customDomain}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      whiteLabelSettings: {
                        ...prev.whiteLabelSettings,
                        customDomain: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    placeholder="chat.yourcompany.com"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Contact support to configure custom domain SSL
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-primary-teal" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Preview
              </h3>
            </div>
            <BrandPreview
              settings={settings}
              device={previewDevice}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => applyBrandingToTheme()}
              disabled={saving}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Changes
            </Button>
            
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}