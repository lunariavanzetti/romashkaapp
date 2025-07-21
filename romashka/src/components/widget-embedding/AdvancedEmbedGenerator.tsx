/**
 * Advanced Embed Generator
 * Provides embedding options for React, Vue, HTML, WordPress, Shopify, etc.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  Copy, 
  Download, 
  ExternalLink,
  Settings,
  Palette,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { useAuth } from '../../hooks/useAuth';

interface EmbedConfig {
  agentId: string;
  agentName: string;
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  borderRadius: number;
  showAvatar: boolean;
  initialMessage: string;
  placeholder: string;
  width: number;
  height: number;
}

type EmbedType = 'html' | 'react' | 'vue' | 'wordpress' | 'shopify' | 'angular' | 'svelte';

export default function AdvancedEmbedGenerator() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<EmbedType>('html');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [config, setConfig] = useState<EmbedConfig>({
    agentId: user?.id || '',
    agentName: 'AI Assistant',
    theme: 'auto',
    position: 'bottom-right',
    primaryColor: '#0EA5E9',
    borderRadius: 12,
    showAvatar: true,
    initialMessage: 'Hi! How can I help you today?',
    placeholder: 'Type your message...',
    width: 400,
    height: 600
  });

  const embedTypes = [
    { 
      id: 'html' as const, 
      name: 'HTML/JavaScript', 
      description: 'Vanilla JavaScript for any website',
      icon: '🌐',
      popular: true
    },
    { 
      id: 'react' as const, 
      name: 'React', 
      description: 'React component with TypeScript',
      icon: '⚛️',
      popular: true
    },
    { 
      id: 'vue' as const, 
      name: 'Vue.js', 
      description: 'Vue component with composition API',
      icon: '💚',
      popular: false
    },
    { 
      id: 'wordpress' as const, 
      name: 'WordPress', 
      description: 'WordPress plugin code',
      icon: '🔧',
      popular: true
    },
    { 
      id: 'shopify' as const, 
      name: 'Shopify', 
      description: 'Liquid template integration',
      icon: '🛍️',
      popular: true
    },
    { 
      id: 'angular' as const, 
      name: 'Angular', 
      description: 'Angular component',
      icon: '🅰️',
      popular: false
    },
    { 
      id: 'svelte' as const, 
      name: 'Svelte', 
      description: 'Svelte component',
      icon: '🔥',
      popular: false
    }
  ];

  const generateEmbedCode = (type: EmbedType): string => {
    const baseUrl = 'https://romashkaai.vercel.app';
    const configJson = JSON.stringify(config, null, 2);

    switch (type) {
      case 'html':
        return `<!-- ROMASHKA AI Chat Widget -->
<script>
  window.RomashkaConfig = ${configJson};
  
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.onload = function() {
      window.RomashkaWidget.init(window.RomashkaConfig);
    };
    document.head.appendChild(script);
    
    // Add CSS
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '${baseUrl}/widget.css';
    document.head.appendChild(css);
  })();
</script>

<!-- Optional: Custom styling -->
<style>
  .romashka-widget {
    --primary-color: ${config.primaryColor};
    --border-radius: ${config.borderRadius}px;
  }
</style>`;

      case 'react':
        return `// Install: npm install @romashka/chat-widget
import React from 'react';
import { RomashkaChatWidget } from '@romashka/chat-widget';

const config = ${configJson};

export default function App() {
  return (
    <div className="App">
      {/* Your app content */}
      
      <RomashkaChatWidget 
        agentId="${config.agentId}"
        agentName="${config.agentName}"
        theme="${config.theme}"
        position="${config.position}"
        primaryColor="${config.primaryColor}"
        borderRadius={${config.borderRadius}}
        showAvatar={${config.showAvatar}}
        initialMessage="${config.initialMessage}"
        placeholder="${config.placeholder}"
        width={${config.width}}
        height={${config.height}}
      />
    </div>
  );
}`;

      case 'vue':
        return `<!-- Install: npm install @romashka/chat-widget -->
<template>
  <div id="app">
    <!-- Your app content -->
    
    <RomashkaChatWidget 
      :agent-id="config.agentId"
      :agent-name="config.agentName"
      :theme="config.theme"
      :position="config.position"
      :primary-color="config.primaryColor"
      :border-radius="config.borderRadius"
      :show-avatar="config.showAvatar"
      :initial-message="config.initialMessage"
      :placeholder="config.placeholder"
      :width="config.width"
      :height="config.height"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RomashkaChatWidget } from '@romashka/chat-widget'

const config = ref(${configJson});
</script>`;

      case 'wordpress':
        return `<?php
// Add this to your theme's functions.php file
function romashka_chat_widget() {
    $config = '${configJson.replace(/'/g, "\\'")}';
    
    echo '<script>
        window.RomashkaConfig = ' . $config . ';
        
        (function() {
            var script = document.createElement("script");
            script.src = "${baseUrl}/widget.js";
            script.async = true;
            script.onload = function() {
                window.RomashkaWidget.init(window.RomashkaConfig);
            };
            document.head.appendChild(script);
            
            var css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = "${baseUrl}/widget.css";
            document.head.appendChild(css);
        })();
    </script>';
}

// Add to footer
add_action('wp_footer', 'romashka_chat_widget');

// Or use shortcode: [romashka_chat]
function romashka_chat_shortcode() {
    ob_start();
    romashka_chat_widget();
    return ob_get_clean();
}
add_shortcode('romashka_chat', 'romashka_chat_shortcode');
?>`;

      case 'shopify':
        return `<!-- Add to your theme.liquid file, before </body> -->
<script>
  window.RomashkaConfig = ${configJson};
  
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.async = true;
    script.onload = function() {
      window.RomashkaWidget.init(window.RomashkaConfig);
    };
    document.head.appendChild(script);
    
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '${baseUrl}/widget.css';
    document.head.appendChild(css);
  })();
</script>

<!-- Optional: Add to settings_schema.json for theme customization -->
{
  "name": "ROMASHKA AI Chat",
  "settings": [
    {
      "type": "checkbox",
      "id": "romashka_enabled",
      "label": "Enable AI Chat Widget",
      "default": true
    },
    {
      "type": "text",
      "id": "romashka_agent_name",
      "label": "Agent Name",
      "default": "${config.agentName}"
    }
  ]
}`;

      case 'angular':
        return `// Install: npm install @romashka/chat-widget
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="app">
      <!-- Your app content -->
      
      <romashka-chat-widget 
        [agentId]="config.agentId"
        [agentName]="config.agentName"
        [theme]="config.theme"
        [position]="config.position"
        [primaryColor]="config.primaryColor"
        [borderRadius]="config.borderRadius"
        [showAvatar]="config.showAvatar"
        [initialMessage]="config.initialMessage"
        [placeholder]="config.placeholder"
        [width]="config.width"
        [height]="config.height">
      </romashka-chat-widget>
    </div>
  \`
})
export class AppComponent {
  config = ${configJson};
}

// Don't forget to import RomashkaChatWidgetModule in your app.module.ts`;

      case 'svelte':
        return `<!-- Install: npm install @romashka/chat-widget -->
<script>
  import { RomashkaChatWidget } from '@romashka/chat-widget';
  
  const config = ${configJson};
</script>

<main>
  <!-- Your app content -->
  
  <RomashkaChatWidget 
    agentId={config.agentId}
    agentName={config.agentName}
    theme={config.theme}
    position={config.position}
    primaryColor={config.primaryColor}
    borderRadius={config.borderRadius}
    showAvatar={config.showAvatar}
    initialMessage={config.initialMessage}
    placeholder={config.placeholder}
    width={config.width}
    height={config.height}
  />
</main>`;

      default:
        return '';
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(selectedType);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownload = (code: string) => {
    const extension = selectedType === 'html' ? 'html' : 
                    selectedType === 'react' ? 'jsx' :
                    selectedType === 'vue' ? 'vue' :
                    selectedType === 'wordpress' ? 'php' :
                    selectedType === 'shopify' ? 'liquid' :
                    selectedType === 'angular' ? 'ts' : 'svelte';
                    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `romashka-widget.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const embedCode = generateEmbedCode(selectedType);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Widget Embedding
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Embed your AI chat widget anywhere with platform-specific code
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Platform Selection */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Platform
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {embedTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                    selectedType === type.id
                      ? 'bg-primary-teal/10 border border-primary-teal text-primary-teal dark:bg-primary-teal/20'
                      : 'bg-gray-50 dark:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{type.name}</span>
                        {type.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                    </div>
                  </div>
                  {selectedType === type.id && (
                    <CheckCircle className="w-5 h-5 text-primary-teal" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Widget Configuration */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Settings className="w-5 h-5 inline mr-2" />
              Widget Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={config.agentName}
                  onChange={(e) => setConfig(prev => ({ ...prev, agentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position
                </label>
                <select
                  value={config.position}
                  onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Theme
                </label>
                <select
                  value={config.theme}
                  onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {embedTypes.find(t => t.id === selectedType)?.name} Code
                  </h3>
                  <Badge variant="outline">{selectedType}</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCode(embedCode)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedCode === selectedType ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(embedCode)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm font-mono leading-relaxed max-h-96">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>

          {/* Installation Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Installation Instructions
            </h4>
            
            {selectedType === 'html' && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>1. Copy the code above</p>
                <p>2. Paste it before the closing &lt;/body&gt; tag on your website</p>
                <p>3. The widget will automatically appear on your site</p>
              </div>
            )}
            
            {selectedType === 'react' && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>1. Install the package: <code className="bg-gray-100 px-1 rounded">npm install @romashka/chat-widget</code></p>
                <p>2. Import and use the component in your React app</p>
                <p>3. Customize the props as needed</p>
              </div>
            )}
            
            {selectedType === 'wordpress' && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>1. Add the PHP code to your theme's functions.php file</p>
                <p>2. The widget will appear on all pages</p>
                <p>3. Alternatively, use the shortcode [romashka_chat] on specific pages</p>
              </div>
            )}
            
            {selectedType === 'shopify' && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>1. Go to Online Store &gt; Themes &gt; Actions &gt; Edit code</p>
                <p>2. Open theme.liquid and paste the code before &lt;/body&gt;</p>
                <p>3. Save and the widget will appear on your store</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}