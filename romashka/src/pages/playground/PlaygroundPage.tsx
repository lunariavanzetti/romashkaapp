import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  TestTube, 
  Palette, 
  Zap,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload,
  Eye,
  BarChart3,
  Users,
  Brain,
  Code,
  Copy,
  Heart,
  Volume2,
  Sliders
} from 'lucide-react';
import { botConfigurationService } from '../../services/botConfigurationService';
import { playgroundAIService } from '../../services/playgroundAIService';
import playgroundService from '../../services/playgroundService';
import { ABTestingService, ABTest, ABTestAnalysis } from '../../services/ab-testing/ABTestingService';
import { useAuth } from '../../hooks/useAuth';
import type { 
  BotConfiguration, 
  TestScenario, 
  ABTestConfiguration, 
  PlaygroundTestResponse 
} from '../../types/botConfiguration';

// Bot Personality Configuration (legacy interface for compatibility)
interface BotPersonality {
  name: string;
  avatar: string;
  tone: 'professional' | 'friendly' | 'casual' | 'enthusiastic' | 'formal';
  formality: number; // 0-100
  enthusiasm: number; // 0-100
  technicality: number; // 0-100
  empathy: number; // 0-100
  responseStyle: 'concise' | 'detailed' | 'conversational';
  language: string;
  specialties: string[];
  brandAlignment: {
    useCompanyVoice: boolean;
    brandKeywords: string[];
    avoidPhrases: string[];
  };
}

const avatarOptions = ['🤖', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🎯', '⚡', '🌟', '💎'];

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personality' | 'testing' | 'abtest' | 'widget'>('personality');
  const abTestingService = new ABTestingService();
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<PlaygroundTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<{message: string, response: string, timestamp: Date, confidence?: number}[]>([]);
  const [abTests, setAbTests] = useState<ABTestConfiguration[]>([]);
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Widget embedding state
  const [widgetConfig, setWidgetConfig] = useState({
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    greeting: 'Hello! How can I help you today?',
    placeholder: 'Type your message...',
    showAvatar: true,
    enableSounds: true,
    customDomain: '',
    widgetTitle: 'Chat Support'
  });
  const [embedCode, setEmbedCode] = useState('');
  const [isEmbedCopied, setIsEmbedCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('html');

  // Initialize component
  useEffect(() => {
    const initializePlayground = async () => {
      try {
        // Load bot configuration
        let config = await botConfigurationService.loadBotConfig();
        if (!config) {
          config = await botConfigurationService.createDefaultConfiguration();
        }
        setBotConfig(config);

        // Load test scenarios
        const scenarios = await botConfigurationService.getTestScenarios();
        setTestScenarios(scenarios);

        // Load A/B tests
        const abTestConfigs = await botConfigurationService.getABTestConfigs();
        setAbTests(abTestConfigs);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize playground:', error);
      }
    };

    initializePlayground();
  }, []);

  // Bot configuration handlers
  const updateBotConfig = (updates: Partial<BotConfiguration>) => {
    if (!botConfig) return;
    setBotConfig(prev => ({ ...prev, ...updates } as BotConfiguration));
  };

  const updatePersonalityTraits = (field: keyof BotConfiguration['personality_traits'], value: number) => {
    if (!botConfig) return;
    setBotConfig(prev => ({
      ...prev,
      personality_traits: {
        ...prev.personality_traits,
        [field]: value
      }
    } as BotConfiguration));
  };

  const saveBotConfiguration = async () => {
    if (!botConfig) return;
    
    try {
      setIsLoading(true);
      const savedConfig = await botConfigurationService.saveBotConfig(botConfig);
      setBotConfig(savedConfig);
      // Update playground service with new config
      await playgroundService.updateBotConfig(savedConfig);
      
      // Show success notification
      alert('✅ Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save bot configuration:', error);
      alert('❌ Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportConfiguration = () => {
    if (!botConfig) return;
    
    const dataStr = JSON.stringify(botConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bot-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfiguration = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          setBotConfig(config);
          alert('✅ Configuration imported successfully!');
        } catch (error) {
          alert('❌ Invalid configuration file. Please check the format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Test message handler with real AI
  const testBotResponse = async () => {
    if (!testMessage.trim() || !botConfig) return;
    
    setIsLoading(true);
    try {
      // Generate real AI response
      const knowledgeContext = playgroundAIService.getDefaultKnowledgeContext();
      const response = await playgroundAIService.generateTestResponse(
        testMessage,
        botConfig,
        knowledgeContext
      );
      
      setTestResponse(response);
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response: response.response,
        timestamp: new Date(),
        confidence: response.confidence / 100
      }]);

      // Show notification if using mock response
      if (response.personality_score.suggestions.some(s => s.includes('demo mode'))) {
        console.log('🤖 Demo mode: Using mock response due to OpenAI API connection issue');
      }

      // Clear test message
      setTestMessage('');
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // A/B Test management
  const createABTest = async () => {
    if (!botConfig || !user) {
      alert('❌ Please sign in and configure bot personality first.');
      return;
    }

    try {
      setIsLoading(true);
      
      const newTest = await abTestingService.createTest({
        user_id: user.id.toString(),
        name: `Personality Test ${abTests.length + 1}`,
        description: 'Test different personality configurations to optimize performance',
        variant_a_config: {
          id: 'variant-a',
          traits: {
            friendliness: 60,
            professionalism: 90,
            empathy: 70,
            enthusiasm: 50,
            helpfulness: 85
          },
          tone: 'formal',
          style: 'professional',
          greeting: 'How may I assist you today?',
          responseLength: 'medium',
          personality: 'You are a professional AI assistant. Always maintain a formal, helpful tone.'
        },
        variant_b_config: {
          id: 'variant-b',
          traits: {
            friendliness: 95,
            professionalism: 70,
            empathy: 90,
            enthusiasm: 85,
            helpfulness: 95
          },
          tone: 'friendly',
          style: 'conversational',
          greeting: 'Hey! I\'d love to help you out 😊',
          responseLength: 'medium',
          personality: 'You are a friendly, warm AI assistant. Use a conversational tone and be empathetic.'
        },
        traffic_split: 0.5,
        target_sample_size: 100,
        confidence_level: 0.95
      });

      // Convert to legacy format for compatibility
      const legacyTest: ABTestConfiguration = {
        id: newTest.id,
        test_name: newTest.name,
        description: newTest.description,
        variants: [
          {
            id: 'variant-a',
            name: 'Professional Tone',
            personality_traits: {
              formality: 90,
              enthusiasm: 50,
              technical_depth: 70,
              empathy: 70
            },
            weight: 50
          },
          {
            id: 'variant-b',
            name: 'Friendly Tone',
            personality_traits: {
              formality: 40,
              enthusiasm: 85,
              technical_depth: 70,
              empathy: 90
            },
            weight: 50
          }
        ],
        is_running: newTest.status === 'running',
        metrics: {
          response_time: 0,
          satisfaction: 0,
          conversions: 0
        },
        sample_size: newTest.target_sample_size,
        confidence_level: newTest.confidence_level
      };

      setAbTests(prev => [...prev, legacyTest]);
      alert('✅ A/B Test created successfully! Start the test to begin comparing personality variants.');
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      alert('❌ Failed to create A/B test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const runScenarioTest = async (scenario: TestScenario) => {
    if (!botConfig || !scenario.user_messages) return;

    setSelectedScenario(scenario);
    setIsLoading(true);
    
    try {
      const results = await playgroundService.runScenarioTest(scenario.user_messages);
      
      // Add results to test history
      results.forEach((result, index) => {
        setTestHistory(prev => [...prev, {
          message: scenario.user_messages[index],
          response: result.message,
          timestamp: new Date(),
          confidence: result.confidence
        }]);
      });
      
      alert('✅ Scenario test completed successfully!');
    } catch (error) {
      console.error('Failed to run scenario test:', error);
      alert('❌ Failed to run scenario test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle A/B test running state
  const toggleABTest = async (test: ABTestConfiguration) => {
    if (!test.id) return;
    
    try {
      setIsLoading(true);
      
      let updatedTest;
      if (!test.is_running) {
        // Start the test
        updatedTest = await abTestingService.startTest(test.id);
        // Generate sample data for demonstration
        await abTestingService.generateSampleData(test.id, test.sample_size || 100);
      } else {
        // Stop the test
        updatedTest = await abTestingService.stopTest(test.id);
      }
      
      // Update UI state
      const legacyTest = {
        ...test,
        is_running: updatedTest.status === 'running',
        start_date: updatedTest.start_date,
        end_date: updatedTest.end_date
      };
      
      setAbTests(prev => prev.map(t => t.id === test.id ? legacyTest : t));
      
      if (updatedTest.status === 'running') {
        alert('🚀 A/B Test started! Sample data generated for demonstration. In production, real user interactions would be tracked.');
      } else {
        alert('⏸️ A/B Test stopped. View results to see the performance analysis.');
      }
    } catch (error) {
      console.error('Failed to toggle A/B test:', error);
      alert('❌ Failed to update A/B test status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // View A/B test results
  const viewABTestResults = async (test: ABTestConfiguration) => {
    if (!test.id) return;
    
    try {
      const analysis = await abTestingService.analyzeTest(test.id);
      
      const winner = analysis.statistical_significance.winner;
      const improvement = analysis.statistical_significance.improvement_percentage;
      const isSignificant = analysis.statistical_significance.is_significant;
      
      let resultMessage = `📊 A/B Test Results for "${test.test_name}":

**Variant A (Professional Tone):**
• Total Interactions: ${analysis.variant_a_metrics.total_interactions}
• Avg Response Time: ${analysis.variant_a_metrics.avg_response_time}ms
• Avg Satisfaction: ${analysis.variant_a_metrics.avg_satisfaction}/5
• Conversion Rate: ${analysis.variant_a_metrics.conversion_rate}%
• Escalation Rate: ${analysis.variant_a_metrics.escalation_rate}%

**Variant B (Friendly Tone):**
• Total Interactions: ${analysis.variant_b_metrics.total_interactions}
• Avg Response Time: ${analysis.variant_b_metrics.avg_response_time}ms
• Avg Satisfaction: ${analysis.variant_b_metrics.avg_satisfaction}/5
• Conversion Rate: ${analysis.variant_b_metrics.conversion_rate}%
• Escalation Rate: ${analysis.variant_b_metrics.escalation_rate}%

`;

      if (isSignificant && winner) {
        resultMessage += `🏆 **Winner: Variant ${winner}** (+${improvement?.toFixed(1)}% improvement)

`;
      } else {
        resultMessage += `⏳ **Not yet statistically significant** - continue testing

`;
      }

      resultMessage += `**Recommendations:**
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}

This demonstrates how real A/B testing would work with your personality configurations!`;

      alert(resultMessage);
    } catch (error) {
      console.error('Failed to view A/B test results:', error);
      alert('❌ Failed to load test results. Please try again.');
    }
  };

  // Widget embedding functions
  const generateEmbedCode = () => {
    if (!user || !botConfig) return '';
    
    const config = {
      userId: user.id,
      apiUrl: 'https://romashkaai.vercel.app',
      widget: {
        ...widgetConfig,
        personality: {
          formality: botConfig.personality_traits.formality,
          enthusiasm: botConfig.personality_traits.enthusiasm,
          technical_depth: botConfig.personality_traits.technical_depth,
          empathy: botConfig.personality_traits.empathy
        },
        style: botConfig.response_style,
        avatar: botConfig.avatar
      }
    };

    const configJson = JSON.stringify(config, null, 2);

    switch (selectedPlatform) {
      case 'html':
        return `<!-- ROMASHKA AI Chat Widget -->
<script>
  window.RomashkaConfig = ${configJson};
  (function() {
    var script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End ROMASHKA Widget -->`;

      case 'react':
        return `// Install: npm install romashka-widget (when available)
// Or use useEffect hook for script loading

import { useEffect } from 'react';

const RomashkaWidget = () => {
  useEffect(() => {
    // Set configuration
    window.RomashkaConfig = ${configJson};
    
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src="https://romashkaai.vercel.app/widget.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null; // Widget renders itself
};

export default RomashkaWidget;

// Usage in your component:
// import RomashkaWidget from './RomashkaWidget';
// <RomashkaWidget />`;

      case 'nextjs':
        return `// pages/_app.js or app/layout.js
import Script from 'next/script';

const romashkaConfig = ${configJson};

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      
      {/* ROMASHKA Widget */}
      <Script id="romashka-config" strategy="beforeInteractive">
        {\`window.RomashkaConfig = \${JSON.stringify(romashkaConfig)};\`}
      </Script>
      
      <Script
        src="https://romashkaai.vercel.app/widget.js"
        strategy="afterInteractive"
      />
    </>
  );
}

// Or for App Router (app/layout.js):
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        <Script id="romashka-config" strategy="beforeInteractive">
          {\`window.RomashkaConfig = \${JSON.stringify(romashkaConfig)};\`}
        </Script>
        
        <Script
          src="https://romashkaai.vercel.app/widget.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`;

      case 'vite':
        return `// src/main.js or src/main.ts
import './style.css';

// Set ROMASHKA configuration
window.RomashkaConfig = ${configJson};

// Load widget script
const script = document.createElement('script');
script.src = 'https://romashkaai.vercel.app/widget.js';
script.async = true;
document.head.appendChild(script);

// Your app initialization...
import { createApp } from 'vue'; // or React
import App from './App.vue';

createApp(App).mount('#app');

// Alternative: Create a composable (Vue 3)
// composables/useRomashka.js
export function useRomashka() {
  const loadWidget = () => {
    if (!window.RomashkaConfig) {
      window.RomashkaConfig = ${configJson};
    }
    
    if (!document.querySelector('script[src*="romashkaai.vercel.app"]')) {
      const script = document.createElement('script');
      script.src = 'https://romashkaai.vercel.app/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  };
  
  return { loadWidget };
}`;

      case 'vue':
        return `<!-- App.vue or main component -->
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    this.loadRomashkaWidget();
  },
  methods: {
    loadRomashkaWidget() {
      // Set configuration
      window.RomashkaConfig = ${configJson};
      
      // Load widget script
      const script = document.createElement('script');
      script.src = 'https://romashkaai.vercel.app/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  },
  beforeUnmount() {
    // Cleanup if needed
    const script = document.querySelector('script[src*="romashkaai.vercel.app"]');
    if (script) {
      script.remove();
    }
  }
};
</script>

<!-- Or as a composable (Vue 3): -->
<!-- composables/useRomashka.js -->
<script setup>
import { onMounted, onUnmounted } from 'vue';

export function useRomashka() {
  onMounted(() => {
    window.RomashkaConfig = ${configJson};
    
    const script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  });
  
  onUnmounted(() => {
    const script = document.querySelector('script[src*="romashkaai.vercel.app"]');
    if (script) script.remove();
  });
}
</script>`;

      case 'angular':
        return `// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <!-- Your app content -->
  \`
})
export class AppComponent implements OnInit, OnDestroy {
  
  ngOnInit() {
    this.loadRomashkaWidget();
  }
  
  ngOnDestroy() {
    const script = document.querySelector('script[src*="romashkaai.vercel.app"]');
    if (script) {
      script.remove();
    }
  }
  
  private loadRomashkaWidget() {
    // Set configuration
    (window as any).RomashkaConfig = ${configJson};
    
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  }
}

// Or create a service:
// romashka.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RomashkaService {
  
  loadWidget() {
    if (!(window as any).RomashkaConfig) {
      (window as any).RomashkaConfig = ${configJson};
    }
    
    if (!document.querySelector('script[src*="romashkaai.vercel.app"]')) {
      const script = document.createElement('script');
      script.src = 'https://romashkaai.vercel.app/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }
}`;

      case 'svelte':
        return `<!-- App.svelte or main component -->
<script>
  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    loadRomashkaWidget();
  });
  
  onDestroy(() => {
    const script = document.querySelector('script[src*="romashkaai.vercel.app"]');
    if (script) {
      script.remove();
    }
  });
  
  function loadRomashkaWidget() {
    // Set configuration
    window.RomashkaConfig = ${configJson};
    
    // Load widget script
    const script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  }
</script>

<!-- Your app content -->
<main>
  <!-- Widget will appear automatically -->
</main>`;

      case 'wordpress':
        return `<!-- WordPress Implementation -->

<!-- Method 1: Theme's functions.php -->
<?php
function add_romashka_widget() {
    $config = json_encode(${configJson});
    ?>
    <script>
      window.RomashkaConfig = <?php echo $config; ?>;
      (function() {
        var script = document.createElement('script');
        script.src = 'https://romashkaai.vercel.app/widget.js';
        script.async = true;
        document.head.appendChild(script);
      })();
    </script>
    <?php
}
add_action('wp_footer', 'add_romashka_widget');

<!-- Method 2: Direct HTML in footer.php -->
<!-- ROMASHKA AI Chat Widget -->
<script>
  window.RomashkaConfig = ${configJson};
  (function() {
    var script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End ROMASHKA Widget -->

<!-- Method 3: Code Injection Plugin -->
<!-- Install "Insert Headers and Footers" plugin -->
<!-- Paste the HTML code in Footer section -->`;

      case 'shopify':
        return `<!-- Shopify Implementation -->

<!-- Method 1: theme.liquid -->
<!-- Go to: Online Store > Themes > Edit Code > Layout > theme.liquid -->
<!-- Add before closing </body> tag: -->

<script>
  window.RomashkaConfig = ${configJson};
  (function() {
    var script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>

<!-- Method 2: Settings > Checkout > Additional Scripts -->
<!-- (Available on Shopify Plus only) -->

<!-- Method 3: Custom HTML Section -->
<!-- Create custom.liquid section with the script -->`;

      default:
        return `<!-- ROMASHKA AI Chat Widget -->
<script>
  window.RomashkaConfig = ${configJson};
  (function() {
    var script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End ROMASHKA Widget -->`;
    }
  };

  const handleGenerateEmbed = () => {
    const code = generateEmbedCode();
    setEmbedCode(code);
    alert('✅ Widget embed code generated! Copy the code below and paste it into your website\'s HTML.');
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setIsEmbedCopied(true);
      setTimeout(() => setIsEmbedCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      alert('❌ Failed to copy to clipboard. Please select and copy manually.');
    }
  };

  const getPlatformInstructions = () => {
    switch (selectedPlatform) {
      case 'html':
        return {
          title: 'HTML / Static Website Implementation',
          steps: [
            'Copy the embed code above',
            'Paste it into your HTML file before the closing </body> tag',
            'Save and reload your website',
            'The chat widget will appear in the chosen position'
          ]
        };
      case 'react':
        return {
          title: 'React Implementation',
          steps: [
            'Create a new component file (e.g., RomashkaWidget.jsx)',
            'Copy the code above and save it as your component',
            'Import and use <RomashkaWidget /> in your main App component',
            'The widget will load automatically when the component mounts'
          ]
        };
      case 'nextjs':
        return {
          title: 'Next.js Implementation',
          steps: [
            'Add the code to your _app.js file (Pages Router) or layout.js (App Router)',
            'The Script components will load the widget optimally',
            'Deploy your Next.js app',
            'Widget appears on all pages automatically'
          ]
        };
      case 'vite':
        return {
          title: 'Vite Implementation',
          steps: [
            'Add the code to your main.js or main.ts file',
            'Or use the composable approach for Vue projects',
            'Run your Vite dev server: npm run dev',
            'Widget loads with your application'
          ]
        };
      case 'vue':
        return {
          title: 'Vue.js Implementation',
          steps: [
            'Add the code to your main App.vue component',
            'Or create a separate component for the widget',
            'The widget loads in the mounted() lifecycle hook',
            'Use the composable approach for Vue 3 projects'
          ]
        };
      case 'angular':
        return {
          title: 'Angular Implementation',
          steps: [
            'Add the code to your app.component.ts file',
            'Or create a dedicated service using RomashkaService',
            'The widget loads in ngOnInit() lifecycle hook',
            'Inject the service in components that need the widget'
          ]
        };
      case 'svelte':
        return {
          title: 'Svelte/SvelteKit Implementation',
          steps: [
            'Add the code to your main App.svelte component',
            'The widget loads in the onMount() lifecycle function',
            'Clean up occurs automatically in onDestroy()',
            'Works with both Svelte and SvelteKit projects'
          ]
        };
      case 'wordpress':
        return {
          title: 'WordPress Implementation',
          steps: [
            'Method 1: Add PHP code to your theme\'s functions.php file',
            'Method 2: Paste HTML directly in footer.php template',
            'Method 3: Use "Insert Headers and Footers" plugin',
            'Widget appears on all pages of your WordPress site'
          ]
        };
      case 'shopify':
        return {
          title: 'Shopify Implementation',
          steps: [
            'Go to Online Store > Themes > Edit Code',
            'Open theme.liquid file in Layout folder',
            'Paste the code before closing </body> tag',
            'Save changes - widget appears on all store pages'
          ]
        };
      default:
        return {
          title: 'Implementation Instructions',
          steps: [
            'Copy the embed code above',
            'Follow the platform-specific instructions',
            'Test the widget on your website',
            'Configure personality and A/B testing as needed'
          ]
        };
    }
  };

  if (!isInitialized || !botConfig) {
    return (
      <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center mx-auto mb-4">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-darker">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Advanced Playground
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Customize your AI bot's personality, test responses, and optimize performance with A/B testing.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'personality', label: 'Personality', icon: <Palette className="w-4 h-4" /> },
            { id: 'testing', label: 'Response Testing', icon: <TestTube className="w-4 h-4" /> },
            { id: 'abtest', label: 'A/B Testing', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'widget', label: 'Widget Embed', icon: <Code className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium
                ${activeTab === tab.id 
                  ? 'bg-gradient-button text-white shadow-elevation-1' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'personality' && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Basic Configuration */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Basic Configuration
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={botConfig.bot_name}
                      onChange={(e) => updateBotConfig({ bot_name: e.target.value })}
                      className="input-primary"
                      placeholder="Enter bot name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Avatar
                    </label>
                    <div className="flex gap-2">
                      {avatarOptions.map(avatar => (
                        <button
                          key={avatar}
                          onClick={() => updateBotConfig({ avatar_emoji: avatar })}
                          className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all
                            ${botConfig.avatar_emoji === avatar 
                              ? 'bg-gradient-button text-white shadow-elevation-1' 
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personality Sliders */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Personality Traits
                </h2>
                
                <div className="space-y-6">
                  {[
                    { key: 'formality', label: 'Formality', icon: <Settings className="w-4 h-4" />, description: 'How formal should the bot be?' },
                    { key: 'enthusiasm', label: 'Enthusiasm', icon: <Zap className="w-4 h-4" />, description: 'How energetic and excited should responses be?' },
                    { key: 'technical_depth', label: 'Technical Depth', icon: <Brain className="w-4 h-4" />, description: 'How technical and detailed should explanations be?' },
                    { key: 'empathy', label: 'Empathy', icon: <Heart className="w-4 h-4" />, description: 'How understanding and supportive should the bot be?' }
                  ].map(trait => (
                    <div key={trait.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {trait.icon}
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {trait.label}
                        </label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}
                        onChange={(e) => updatePersonalityTraits(trait.key as keyof BotConfiguration['personality_traits'], parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        style={{
                          background: `linear-gradient(to right, #38b2ac 0%, #38b2ac ${botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%, #e2e8f0 ${botConfig.personality_traits[trait.key as keyof BotConfiguration['personality_traits']]}%, #e2e8f0 100%)`
                        }}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trait.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Style */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Response Style
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'concise', label: 'Concise', description: 'Short, to-the-point responses' },
                    { value: 'detailed', label: 'Detailed', description: 'Comprehensive, thorough explanations' },
                    { value: 'conversational', label: 'Conversational', description: 'Natural, flowing dialogue' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => updateBotConfig({ response_style: style.value as 'concise' | 'detailed' | 'conversational' })}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${botConfig.response_style === style.value
                          ? 'border-primary-teal bg-primary-teal/10 text-primary-teal'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-teal/50'
                        }
                      `}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="glass-card p-6 rounded-xl">
                <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                  Custom Instructions
                </h2>
                <textarea
                  value={botConfig.custom_instructions || ''}
                  onChange={(e) => updateBotConfig({ custom_instructions: e.target.value })}
                  className="input-primary h-32 resize-none"
                  placeholder="Add custom instructions for your bot's behavior..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  icon={<Save className="w-4 h-4" />}
                  onClick={saveBotConfiguration}
                  loading={isLoading}
                >
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Download className="w-4 h-4" />}
                  onClick={exportConfiguration}
                >
                  Export Config
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Upload className="w-4 h-4" />}
                  onClick={importConfiguration}
                >
                  Import Config
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'testing' && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Test Input */}
              <div className="glass-card p-6 rounded-xl">
                <div className="mb-4">
                  <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-2">
                    Test Bot Response
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Enter any message to see how your current bot configuration would respond.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Message
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="input-primary h-24 resize-none"
                      placeholder="Example: 'Hello, I need help with integrating WhatsApp to my account'"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      💡 Try asking about pricing, technical issues, or general support questions
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="primary" 
                      onClick={testBotResponse}
                      loading={isLoading}
                      disabled={!testMessage.trim() || isLoading}
                      icon={<Play className="w-4 h-4" />}
                    >
                      {isLoading ? 'Generating Response...' : 'Test Response'}
                    </Button>
                    
                    {testMessage && (
                      <Button 
                        variant="outline" 
                        onClick={() => setTestMessage('')}
                        disabled={isLoading}
                        icon={<RotateCcw className="w-4 h-4" />}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Response */}
              {testResponse && (
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-heading font-semibold text-primary-deep-blue dark:text-white mb-4">
                    Bot Response
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 dark:text-gray-300">{testResponse.response}</p>
                  </div>
                  
                  {/* Response Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {testResponse.confidence}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {testResponse.response_time}ms
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {testResponse.personality_score.overall_alignment}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Personality Match</div>
                    </div>
                  </div>

                  {/* Knowledge Sources */}
                  {testResponse.knowledge_sources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Knowledge Sources Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {testResponse.knowledge_sources.map((source, index) => (
                          <span key={index} className="px-2 py-1 bg-primary-teal/10 text-primary-teal rounded-full text-xs">
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personality Analysis */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Personality Analysis:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.formality_score}%
                        </div>
                        <div className="text-xs text-gray-500">Formality</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.enthusiasm_score}%
                        </div>
                        <div className="text-xs text-gray-500">Enthusiasm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.technical_depth_score}%
                        </div>
                        <div className="text-xs text-gray-500">Technical Depth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {testResponse.personality_score.empathy_score}%
                        </div>
                        <div className="text-xs text-gray-500">Empathy</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Scenarios */}
              <div className="glass-card p-6 rounded-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white mb-2">
                    Pre-built Test Scenarios
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Run comprehensive tests with realistic customer scenarios to evaluate your bot's performance.
                  </p>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <TestTube className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Test Scenario Tips
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-200">
                          Each scenario contains multiple test messages. Results will appear in your test history below 
                          and help you understand how your bot performs across different conversation types.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {testScenarios.map(scenario => (
                    <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-teal/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {scenario.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              scenario.difficulty_level === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              scenario.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              scenario.difficulty_level === 'hard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {scenario.difficulty_level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {scenario.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>💬 {scenario.user_messages.length} test messages</span>
                            <span>🏷️ {scenario.category}</span>
                            {scenario.expected_outcomes && (
                              <span>🎯 {scenario.expected_outcomes.length} expected outcomes</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runScenarioTest(scenario)}
                          disabled={isLoading}
                          loading={isLoading && selectedScenario?.id === scenario.id}
                          icon={<Play className="w-3 h-3" />}
                        >
                          {isLoading && selectedScenario?.id === scenario.id ? 'Testing...' : 'Run Test'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Test History */}
              {testHistory.length > 0 && (
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white">
                        Test History
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Recent test results from individual messages and scenario runs
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTestHistory([])}
                      icon={<RotateCcw className="w-4 h-4" />}
                    >
                      Clear History
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testHistory.slice().reverse().map((test, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              💬 "{test.message}"
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              🤖 {test.response}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>📅 {test.timestamp.toLocaleString()}</span>
                              {test.confidence && (
                                <span className={`px-2 py-1 rounded-full font-medium ${
                                  test.confidence >= 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  test.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {Math.round(test.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {testHistory.length > 5 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {testHistory.length} test results. Consider running A/B tests for systematic comparison.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'abtest' && (
            <motion.div
              key="abtest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* A/B Test Header */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white">
                      A/B Testing
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Test different personality configurations to optimize performance
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={createABTest}
                    loading={isLoading}
                    disabled={isLoading}
                    icon={<TestTube className="w-4 h-4" />}
                  >
                    Create A/B Test
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        How A/B Testing Works
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        Create tests with different personality variants, start the test, and we'll automatically route 
                        conversations to different variants to measure which performs better based on response time, 
                        satisfaction scores, and conversion rates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* A/B Tests List */}
              <div className="space-y-4">
                {abTests.length === 0 ? (
                  <div className="glass-card p-8 rounded-xl text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No A/B Tests Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first A/B test to optimize your bot's personality and improve customer satisfaction
                    </p>
                    
                    {/* Benefits list */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Benefits of A/B Testing:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Optimize response quality and customer satisfaction
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Reduce response times through personality tuning
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Increase conversion rates with better personality alignment
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Data-driven decisions for bot personality optimization
                        </li>
                      </ul>
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={createABTest}
                      loading={isLoading}
                      disabled={isLoading}
                      icon={<TestTube className="w-4 h-4" />}
                    >
                      Create Your First Test
                    </Button>
                  </div>
                ) : (
                  abTests.map(test => (
                    <div key={test.id} className="glass-card p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {test.test_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              test.is_running 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {test.is_running ? '🟢 Running' : '⏸️ Stopped'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {test.description}
                          </p>
                          {test.is_running && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              🔄 Active: Routing traffic to test variants
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={test.is_running ? "danger" : "primary"}
                            size="sm"
                            onClick={() => toggleABTest(test)}
                            disabled={isLoading}
                            loading={isLoading}
                            icon={test.is_running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          >
                            {test.is_running ? 'Stop Test' : 'Start Test'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewABTestResults(test)}
                            icon={<Eye className="w-3 h-3" />}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                      
                      {/* Test Configuration Details */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-white">{test.sample_size || 100}</div>
                            <div className="text-gray-500">Sample Size</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-white">{Math.round((test.confidence_level || 0.95) * 100)}%</div>
                            <div className="text-gray-500">Confidence</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-white">{test.variants.length}</div>
                            <div className="text-gray-500">Variants</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {test.start_date ? new Date(test.start_date).toLocaleDateString() : '-'}
                            </div>
                            <div className="text-gray-500">Started</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Variants */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Test Variants:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {test.variants.map(variant => (
                            <div key={variant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{variant.name}</span>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                  {variant.weight}% traffic
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  🎭 Formality: {variant.personality_traits.formality || 50}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ⚡ Enthusiasm: {variant.personality_traits.enthusiasm || 50}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  🧠 Technical: {variant.personality_traits.technical_depth || 50}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ❤️ Empathy: {variant.personality_traits.empathy || 50}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'widget' && (
            <motion.div
              key="widget"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Widget Header */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-primary-deep-blue dark:text-white">
                      Widget Embedding
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Generate embed code to add the AI chat widget to your website
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleGenerateEmbed}
                    icon={<Code className="w-4 h-4" />}
                  >
                    Generate Embed Code
                  </Button>
                </div>

                {/* Widget Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Widget Settings</h3>
                    
                    {/* Platform Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Platform / Framework
                      </label>
                      <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="html">HTML / Static Website</option>
                        <option value="react">React</option>
                        <option value="nextjs">Next.js</option>
                        <option value="vite">Vite (Vue/React)</option>
                        <option value="vue">Vue.js</option>
                        <option value="angular">Angular</option>
                        <option value="svelte">Svelte/SvelteKit</option>
                        <option value="wordpress">WordPress</option>
                        <option value="shopify">Shopify</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Choose your platform to get specific implementation code
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Widget Title
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.widgetTitle}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, widgetTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="Chat Support"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Greeting Message
                      </label>
                      <input
                        type="text"
                        value={widgetConfig.greeting}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, greeting: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="Hello! How can I help you today?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={widgetConfig.primaryColor}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Position
                      </label>
                      <select
                        value={widgetConfig.position}
                        onChange={(e) => setWidgetConfig(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Preview</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px] relative border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Widget Preview</p>
                        <p className="text-sm">Chat widget will appear here</p>
                      </div>
                      
                      {/* Mock widget button */}
                      <div 
                        className={`absolute ${widgetConfig.position.includes('right') ? 'right-4' : 'left-4'} ${widgetConfig.position.includes('bottom') ? 'bottom-4' : 'top-4'}`}
                      >
                        <div 
                          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white font-medium cursor-pointer transform hover:scale-110 transition-transform"
                          style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                          <MessageSquare className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Current Personality:</strong></p>
                      <p>🎭 Formality: {botConfig.personality_traits.formality}%</p>
                      <p>⚡ Enthusiasm: {botConfig.personality_traits.enthusiasm}%</p>
                      <p>🧠 Technical: {botConfig.personality_traits.technical_depth}%</p>
                      <p>❤️ Empathy: {botConfig.personality_traits.empathy}%</p>
                    </div>
                  </div>
                </div>

                {/* Embed Code Section */}
                {embedCode && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">Embed Code</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyEmbed}
                        icon={<Copy className="w-4 h-4" />}
                      >
                        {isEmbedCopied ? 'Copied!' : 'Copy Code'}
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{embedCode}</code>
                    </pre>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const instructions = getPlatformInstructions();
                        return (
                          <>
                            <p><strong>{instructions.title}:</strong></p>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                              {instructions.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-blue-800 dark:text-blue-200 text-sm">
                                <strong>💡 Platform Note:</strong> This code is optimized for {selectedPlatform === 'html' ? 'HTML/Static websites' : selectedPlatform === 'nextjs' ? 'Next.js' : selectedPlatform === 'vite' ? 'Vite projects' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} projects. 
                                Select a different platform above to get framework-specific implementation code.
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* A/B Testing Integration */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">A/B Testing Integration</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      <strong>💡 Pro Tip:</strong> When you create A/B tests in the A/B Testing tab, 
                      the widget will automatically use different personality variants for different visitors. 
                      This lets you test which personality performs better with real customers!
                    </p>
                    <div className="mt-3">
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        <strong>Active A/B Tests:</strong> {abTests.filter(test => test.is_running).length}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        <strong>Total Tests:</strong> {abTests.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 