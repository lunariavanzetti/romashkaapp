import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, EyeIcon, CodeBracketIcon, CogIcon, PaintBrushIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { WidgetEmbedder, type WidgetConfig } from '../../services/widgetEmbedder';

interface WidgetCustomizerProps {
  projectId: string;
  onConfigChange?: (config: WidgetConfig) => void;
  onEmbedCodeGenerated?: (embedCode: string) => void;
}

const WidgetCustomizer: React.FC<WidgetCustomizerProps> = ({ 
  projectId, 
  onConfigChange, 
  onEmbedCodeGenerated 
}) => {
  const [config, setConfig] = useState<WidgetConfig>({
    projectId,
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#2563eb',
    secondaryColor: '#f8fafc',
    title: 'Chat with us',
    subtitle: 'We typically reply instantly',
    welcomeMessage: 'Hi there! How can I help you today?',
    showBranding: true,
    autoOpen: false,
    zIndex: 999999
  });

  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'messages' | 'advanced'>('appearance');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [embedCode, setEmbedCode] = useState('');
  const [installMethod, setInstallMethod] = useState<'html' | 'gtm' | 'wordpress'>('html');

  useEffect(() => {
    const generatedCode = WidgetEmbedder.generateEmbedCode(config);
    setEmbedCode(generatedCode.fullCode);
    onConfigChange?.(config);
    onEmbedCodeGenerated?.(generatedCode.fullCode);
  }, [config, onConfigChange, onEmbedCodeGenerated]);

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const ColorPicker: React.FC<{ value: string; onChange: (color: string) => void; label: string }> = ({ 
    value, 
    onChange, 
    label 
  }) => (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700 w-20">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Colors & Theme</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Theme</label>
            <div className="flex space-x-2">
              {(['light', 'dark', 'auto'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => updateConfig({ theme })}
                  className={`px-3 py-1 rounded text-sm ${
                    config.theme === theme
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <ColorPicker
            value={config.primaryColor}
            onChange={(color) => updateConfig({ primaryColor: color })}
            label="Primary"
          />
          
          <ColorPicker
            value={config.secondaryColor}
            onChange={(color) => updateConfig({ secondaryColor: color })}
            label="Secondary"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Position</h3>
        <div className="grid grid-cols-2 gap-2">
          {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map(position => (
            <button
              key={position}
              onClick={() => updateConfig({ position })}
              className={`px-3 py-2 rounded text-sm ${
                config.position === position
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Z-Index</h3>
        <input
          type="number"
          value={config.zIndex}
          onChange={(e) => updateConfig({ zIndex: parseInt(e.target.value) || 999999 })}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          max="2147483647"
        />
        <p className="text-sm text-gray-500 mt-1">Higher values appear on top of other elements</p>
      </div>
    </div>
  );

  const renderBehaviorTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Widget Behavior</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoOpen"
              checked={config.autoOpen}
              onChange={(e) => updateConfig({ autoOpen: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoOpen" className="text-sm font-medium text-gray-700">
              Auto-open on page load
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="showBranding"
              checked={config.showBranding}
              onChange={(e) => updateConfig({ showBranding: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showBranding" className="text-sm font-medium text-gray-700">
              Show ROMASHKA branding
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proactive Triggers</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Time-based Trigger</h4>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="30"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                min="1"
              />
              <span className="text-sm text-gray-600">seconds after page load</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Scroll Trigger</h4>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="50"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                min="1"
                max="100"
              />
              <span className="text-sm text-gray-600">% of page scrolled</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Exit Intent</h4>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="exitIntent"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="exitIntent" className="text-sm text-gray-700">
                Show when user tries to leave page
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Widget Text</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Chat with us"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="We typically reply instantly"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
            <textarea
              value={config.welcomeMessage}
              onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hi there! How can I help you today?"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Replies</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Quick reply option"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Add
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
              <span className="text-sm">How can I help you?</span>
              <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
              <span className="text-sm">I need support</span>
              <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Domain Restrictions</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Add
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Restrict widget to specific domains. Leave empty to allow all domains.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Fields</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Field name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <select className="px-3 py-2 border border-gray-300 rounded text-sm">
              <option>Text</option>
              <option>Email</option>
              <option>Phone</option>
              <option>Number</option>
            </select>
            <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">A/B Testing</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="enableABTest"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableABTest" className="text-sm font-medium text-gray-700">
              Enable A/B testing
            </label>
          </div>
          <div className="pl-7 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Test variation name:</span>
              <input
                type="text"
                placeholder="Variation B"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Traffic split:</span>
              <input
                type="number"
                placeholder="50"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                min="1"
                max="100"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            <DevicePhoneMobileIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className={`relative bg-white rounded-lg border-2 border-gray-200 ${
        previewMode === 'mobile' ? 'w-80 h-96' : 'w-full h-96'
      }`}>
        {/* Mock widget preview */}
        <div className={`absolute ${config.position.replace('-', ' ')} m-4`}>
          <div className="relative">
            {/* Chat window (if auto-open) */}
            {config.autoOpen && (
              <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 mb-2">
                <div className="p-4 border-b border-gray-200" style={{ backgroundColor: config.primaryColor }}>
                  <h4 className="font-medium text-white">{config.title}</h4>
                  <p className="text-sm text-white opacity-90">{config.subtitle}</p>
                </div>
                <div className="p-4">
                  <div className="bg-gray-100 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-800">{config.welcomeMessage}</p>
                  </div>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 text-sm">
                      How can I help you?
                    </button>
                    <button className="w-full text-left px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 text-sm">
                      I need support
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Widget button */}
            <button
              className="w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center"
              style={{ backgroundColor: config.primaryColor }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstallationCode = () => {
    const htmlCode = `<!-- ROMASHKA AI Chat Widget -->
<div id="romashka-widget-${projectId}"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.romashka.ai/widget.js';
    script.async = true;
    script.onload = function() {
      RomashkaWidget.init({
        projectId: '${projectId}',
        config: ${JSON.stringify(config, null, 2)}
      });
    };
    document.head.appendChild(script);
  })();
</script>`;

    const gtmCode = `{
  "tag": "Custom HTML Tag",
  "type": "html",
  "html": "${htmlCode.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
}`;

    const wordpressCode = `<?php
// Add this to your theme's functions.php file
function romashka_widget() {
    ?>
    ${htmlCode}
    <?php
}
add_action('wp_footer', 'romashka_widget');
?>`;

    const codes = {
      html: htmlCode,
      gtm: gtmCode,
      wordpress: wordpressCode
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Installation Method:</label>
          <select
            value={installMethod}
            onChange={(e) => setInstallMethod(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="html">HTML</option>
            <option value="gtm">Google Tag Manager</option>
            <option value="wordpress">WordPress</option>
          </select>
        </div>
        
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{codes[installMethod]}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(codes[installMethod])}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
          >
            Copy
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Widget Customizer</h1>
        <p className="text-gray-600 mt-2">
          Customize your chat widget appearance and behavior
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
                  { id: 'behavior', label: 'Behavior', icon: CogIcon },
                  { id: 'messages', label: 'Messages', icon: EyeIcon },
                  { id: 'advanced', label: 'Advanced', icon: CodeBracketIcon }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'appearance' && renderAppearanceTab()}
              {activeTab === 'behavior' && renderBehaviorTab()}
              {activeTab === 'messages' && renderMessagesTab()}
              {activeTab === 'advanced' && renderAdvancedTab()}
            </div>
          </div>

          {/* Installation Code */}
          <div className="bg-white rounded-lg shadow-md mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Installation Code</h3>
              {renderInstallationCode()}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetCustomizer;