/**
 * Post-Setup Dashboard
 * Provides a comprehensive overview and next steps after agent setup completion
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  Rocket,
  Settings,
  BarChart3,
  MessageSquare,
  Globe,
  Copy,
  ExternalLink,
  PlayCircle,
  BookOpen,
  Users,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { agentSetupService, AgentSetupData } from '../../services/agentSetupService';
import { useAuth } from '../../hooks/useAuth';

interface PostSetupDashboardProps {
  setupData: AgentSetupData;
  onEdit: () => void;
  onGoToAnalytics: () => void;
  onGoToIntegrations: () => void;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function PostSetupDashboard({
  setupData,
  onEdit,
  onGoToAnalytics,
  onGoToIntegrations
}: PostSetupDashboardProps) {
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { user } = useAuth();

  const embedCode = `<!-- ROMASHKA AI Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://romashkaai.vercel.app/widget.js';
    script.setAttribute('data-agent-id', '${user?.id}');
    script.setAttribute('data-agent-name', '${setupData.agentName}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<noscript>
  <div id="romashka-chat-fallback">
    <p>Chat with us: <a href="mailto:support@yoursite.com">support@yoursite.com</a></p>
  </div>
</noscript>`;

  const nextSteps: NextStep[] = [
    {
      id: 'embed-widget',
      title: 'Embed Chat Widget',
      description: 'Add the AI chat widget to your website',
      icon: <Globe className="w-5 h-5" />,
      action: () => setShowEmbedCode(true),
      completed: completedSteps.includes('embed-widget'),
      priority: 'high'
    },
    {
      id: 'test-agent',
      title: 'Test Your Agent',
      description: 'Have a conversation to verify functionality',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => {
        // Open chat widget or test interface
        console.log('Open test interface');
      },
      completed: completedSteps.includes('test-agent'),
      priority: 'high'
    },
    {
      id: 'setup-integrations',
      title: 'Connect Integrations',
      description: 'Link Shopify, Salesforce, HubSpot, and more',
      icon: <Zap className="w-5 h-5" />,
      action: onGoToIntegrations,
      completed: completedSteps.includes('setup-integrations'),
      priority: 'medium'
    },
    {
      id: 'configure-analytics',
      title: 'Setup Analytics',
      description: 'Monitor performance and customer satisfaction',
      icon: <BarChart3 className="w-5 h-5" />,
      action: onGoToAnalytics,
      completed: completedSteps.includes('configure-analytics'),
      priority: 'medium'
    },
    {
      id: 'train-agent',
      title: 'Improve AI Training',
      description: 'Add more Q&As and refine responses',
      icon: <BookOpen className="w-5 h-5" />,
      action: onEdit,
      completed: completedSteps.includes('train-agent'),
      priority: 'low'
    },
    {
      id: 'setup-human-handoff',
      title: 'Configure Human Agents',
      description: 'Set up escalation to live support',
      icon: <Users className="w-5 h-5" />,
      action: () => {
        // Navigate to human agent setup
        console.log('Navigate to human agent setup');
      },
      completed: completedSteps.includes('setup-human-handoff'),
      priority: 'low'
    }
  ];

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const getCompletionPercentage = () => {
    const highPrioritySteps = nextSteps.filter(step => step.priority === 'high');
    const completedHighPriority = highPrioritySteps.filter(step => completedSteps.includes(step.id));
    return Math.round((completedHighPriority.length / highPrioritySteps.length) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-primary-deep-blue dark:text-white">
          🎉 Agent Setup Complete!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your AI agent "{setupData.agentName}" is ready to help your customers. 
          Here's what you can do next to maximize its potential.
        </p>
      </motion.div>

      {/* Agent Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {setupData.agentName}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {setupData.businessType} • {setupData.agentTone} tone
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>{setupData.websiteUrl || 'No website configured'}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onEdit}>
            <Settings className="w-4 h-4 mr-2" />
            Edit Configuration
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Setup Progress</h3>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {getCompletionPercentage()}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-teal to-primary-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="glass-card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Test Your Agent</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Try it out now</p>
            </div>
          </div>
          <Button variant="primary" className="w-full">
            <PlayCircle className="w-4 h-4 mr-2" />
            Start Test Chat
          </Button>
        </div>

        <div className="glass-card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Embed Widget</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Add to your site</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setShowEmbedCode(true)}>
            <Copy className="w-4 h-4 mr-2" />
            Get Embed Code
          </Button>
        </div>

        <div className="glass-card bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">View Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Monitor performance</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onGoToAnalytics}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Open Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Next Steps to Optimize Your Agent
        </h3>
        
        <div className="space-y-4">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                step.completed
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  step.completed
                    ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-400'
                    : step.priority === 'high'
                    ? 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-400'
                    : step.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
                }`}>
                  {step.completed ? <CheckCircle className="w-5 h-5" /> : step.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{step.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  variant={
                    step.priority === 'high' ? 'destructive' :
                    step.priority === 'medium' ? 'warning' : 'secondary'
                  }
                  className="text-xs"
                >
                  {step.priority} priority
                </Badge>
                {!step.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      step.action();
                      markStepCompleted(step.id);
                    }}
                  >
                    Start
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Embed Code Modal */}
      {showEmbedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Embed Your Chat Widget
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Copy this code and paste it before the closing &lt;/body&gt; tag on your website
              </p>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {embedCode}
                </pre>
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setShowEmbedCode(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={handleCopyEmbedCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedEmbed ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-full px-6 py-3">
          <Rocket className="w-4 h-4" />
          <span>Your AI agent is now live and ready to help customers 24/7!</span>
        </div>
      </motion.div>
    </div>
  );
}