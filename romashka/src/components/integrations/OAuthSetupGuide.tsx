/**
 * OAuth Setup Guide Component
 * Shows instructions for setting up OAuth credentials when they're missing
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle,
  Settings,
  Key,
  Globe
} from 'lucide-react';
import { Button, Badge } from '../ui';

interface OAuthSetupGuideProps {
  provider: 'shopify' | 'salesforce' | 'hubspot';
  onClose: () => void;
}

const providerConfigs = {
  shopify: {
    name: 'Shopify',
    color: 'bg-green-500',
    icon: '🛍️',
    setupUrl: 'https://partners.shopify.com/',
    docsUrl: 'https://shopify.dev/docs/apps/auth/oauth',
    clientIdEnvVar: 'SHOPIFY_CLIENT_ID',
    clientSecretEnvVar: 'SHOPIFY_CLIENT_SECRET',
    scopes: ['read_customers', 'read_orders', 'read_products'],
    redirectUri: 'https://romashkaai.vercel.app/api/integrations/shopify/callback',
    steps: [
      'Go to Shopify Partners Dashboard',
      'Create a new app or select existing app',
      'Navigate to App setup → URLs',
      'Set App URL to: https://romashkaai.vercel.app',
      'Set Allowed redirection URL(s) to: https://romashkaai.vercel.app/api/integrations/shopify/callback',
      'Copy the API key (Client ID) and API secret key (Client Secret)',
      'Add these to your Vercel environment variables'
    ]
  },
  salesforce: {
    name: 'Salesforce',
    color: 'bg-blue-500',
    icon: '☁️',
    setupUrl: 'https://developer.salesforce.com/',
    docsUrl: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm',
    clientIdEnvVar: 'SALESFORCE_CLIENT_ID',
    clientSecretEnvVar: 'SALESFORCE_CLIENT_SECRET',
    scopes: ['api', 'refresh_token'],
    redirectUri: 'https://romashkaai.vercel.app/api/integrations/salesforce/callback',
    steps: [
      'Login to your Salesforce org',
      'Go to Setup → Apps → App Manager',
      'Click "New Connected App"',
      'Fill in basic information',
      'Enable OAuth Settings',
      'Set Callback URL to: https://romashkaai.vercel.app/api/integrations/salesforce/callback',
      'Select OAuth Scopes: Full access (api), Refresh token',
      'Save and copy Consumer Key (Client ID) and Consumer Secret (Client Secret)',
      'Add these to your Vercel environment variables'
    ]
  },
  hubspot: {
    name: 'HubSpot',
    color: 'bg-orange-500',
    icon: '🧡',
    setupUrl: 'https://developers.hubspot.com/',
    docsUrl: 'https://developers.hubspot.com/docs/api/working-with-oauth',
    clientIdEnvVar: 'HUBSPOT_CLIENT_ID',
    clientSecretEnvVar: 'HUBSPOT_CLIENT_SECRET',
    scopes: ['contacts', 'crm.objects.deals.read', 'crm.objects.companies.read'],
    redirectUri: 'https://romashkaai.vercel.app/api/integrations/hubspot/callback',
    steps: [
      'Go to HubSpot Developer Portal',
      'Create a new app or select existing app',
      'Navigate to Auth tab',
      'Set Redirect URL to: https://romashkaai.vercel.app/api/integrations/hubspot/callback',
      'Select scopes: contacts, crm.objects.deals.read, crm.objects.companies.read',
      'Copy the Client ID and Client Secret',
      'Add these to your Vercel environment variables'
    ]
  }
};

export default function OAuthSetupGuide({ provider, onClose }: OAuthSetupGuideProps) {
  const config = providerConfigs[provider];
  
  const [copiedEnvVar, setCopiedEnvVar] = React.useState<string | null>(null);
  
  // Since we know the user has configured credentials, show a success message
  const [credentialsConfigured, setCredentialsConfigured] = React.useState(true);

  const envVarTemplate = `# ${config.name} OAuth Configuration
${config.clientIdEnvVar}=your_${provider}_client_id_here
${config.clientSecretEnvVar}=your_${provider}_client_secret_here

# Additional required variables
NEXT_PUBLIC_APP_URL=https://romashkaai.vercel.app
FRONTEND_URL=https://romashkaai.vercel.app
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key`;

  const handleCopyEnvVars = () => {
    navigator.clipboard.writeText(envVarTemplate);
    setCopiedEnvVar('template');
    setTimeout(() => setCopiedEnvVar(null), 2000);
  };

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText(config.redirectUri);
    setCopiedEnvVar('redirect');
    setTimeout(() => setCopiedEnvVar(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${config.color} rounded-lg p-2 flex items-center justify-center`}>
                <span className="text-2xl">{config.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {config.name} OAuth Setup Required
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure OAuth credentials to enable {config.name} integration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  OAuth Credentials Missing
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The {config.name} integration requires OAuth credentials to be configured in your environment variables.
                  Follow the steps below to set this up.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Setup Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                1. Create OAuth App in {config.name}
              </h3>
              
              <div className="space-y-3">
                {config.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-teal text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(config.setupUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open {config.name} Setup
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(config.docsUrl, '_blank')}
                >
                  View Docs
                </Button>
              </div>
            </div>

            {/* Configuration Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2" />
                2. Configuration Details
              </h3>

              {/* Redirect URI */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Redirect URI
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyRedirectUri}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedEnvVar === 'redirect' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                  {config.redirectUri}
                </code>
              </div>

              {/* Scopes */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Required Scopes
                </label>
                <div className="flex flex-wrap gap-2">
                  {config.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Environment Variables Template
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEnvVars}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedEnvVar === 'template' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                  <code>{envVarTemplate}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Vercel Deployment Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              3. Add to Vercel Environment Variables
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• Go to your Vercel project dashboard</p>
              <p>• Navigate to Settings → Environment Variables</p>
              <p>• Add the {config.clientIdEnvVar} and {config.clientSecretEnvVar} variables</p>
              <p>• Redeploy your application for changes to take effect</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Vercel Dashboard
            </Button>
          </div>

          {/* Success Steps */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              4. Test Your Integration
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              After configuring the environment variables and redeploying:
            </p>
            <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <p>• Return to the integrations page</p>
              <p>• Click "Connect {config.name}" again</p>
              <p>• You should be redirected to {config.name} for authorization</p>
              <p>• Complete the OAuth flow to connect your {config.name} account</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Close Guide
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Configure on Vercel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}