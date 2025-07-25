/**
 * Integration Setup Modal
 * Handles OAuth-based integration setup for Shopify, Salesforce, and HubSpot
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui';
import { unifiedIntegrationService } from '../../services/integrations/unifiedIntegrationService';
import { useAuth } from '../../hooks/useAuth';
import OAuthSetupGuide from './OAuthSetupGuide';

interface IntegrationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'shopify' | 'salesforce' | 'hubspot' | null;
  onSuccess: () => void;
}

const providerConfig = {
  shopify: {
    name: 'Shopify',
    description: 'Connect your Shopify store to sync customers, orders, and products with ROMASHKA.',
    icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/shopify.svg',
    color: 'bg-green-500',
    features: ['Customer sync', 'Order management', 'Product catalog', 'Inventory tracking'],
    requirements: ['Shop domain (e.g., mystore.myshopify.com)', 'Admin access to your Shopify store'],
    needsShopDomain: true,
  },
  salesforce: {
    name: 'Salesforce',
    description: 'Integrate with Salesforce to sync leads, contacts, and opportunities.',
    icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/salesforce.svg',
    color: 'bg-blue-500',
    features: ['Lead management', 'Contact sync', 'Opportunity tracking', 'Account data'],
    requirements: ['Salesforce admin access', 'Connected App permissions'],
    needsShopDomain: false,
  },
  hubspot: {
    name: 'HubSpot',
    description: 'Connect HubSpot to sync contacts, deals, and company information.',
    icon: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hubspot.svg',
    color: 'bg-orange-500',
    features: ['Contact management', 'Deal pipeline', 'Company data', 'Marketing automation'],
    requirements: ['HubSpot account access', 'CRM permissions'],
    needsShopDomain: false,
  },
};

export default function IntegrationSetupModal({
  isOpen,
  onClose,
  provider,
  onSuccess
}: IntegrationSetupModalProps) {
  const [step, setStep] = useState<'info' | 'connecting' | 'success' | 'error' | 'setup-guide'>('info');
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const { user } = useAuth();

  const config = provider ? providerConfig[provider] : null;

  // Check for missing credentials when modal opens
  React.useEffect(() => {
    const checkCredentials = () => {
      if (!provider) return;
      
      console.log('[DEBUG] Checking credentials for provider:', provider);
      
      // Since the user has confirmed they have HubSpot credentials configured in Vercel,
      // we'll skip the setup guide and allow direct OAuth connection
      console.log('[DEBUG] Credentials assumed to be configured, proceeding with OAuth flow');
      
      // Don't show setup guide - user can proceed directly to OAuth
      setShowSetupGuide(false);
    };
    
    if (isOpen && provider) {
      checkCredentials();
    }
  }, [isOpen, provider]);

  const handleConnect = async () => {
    console.log('[DEBUG] Connect button clicked for provider:', provider);
    console.log('[DEBUG] User object:', user);
    
    if (!provider) {
      console.log('[DEBUG] No provider specified');
      return;
    }
    
    if (!user) {
      console.log('[DEBUG] No user logged in');
      setError('Please log in to connect integrations');
      return;
    }

    try {
      console.log('[DEBUG] Starting OAuth connection process...');
      setStep('connecting');
      setError(null);

      // Validate shop domain for Shopify
      if (provider === 'shopify') {
        console.log('[DEBUG] Validating Shopify domain...');
        if (!shopDomain.trim()) {
          setError('Shop domain is required for Shopify');
          setStep('error');
          return;
        }
        
        // Clean up shop domain (remove protocol and .myshopify.com if present)
        const cleanDomain = shopDomain
          .replace(/^https?:\/\//, '')
          .replace(/\.myshopify\.com.*$/, '')
          .replace(/\/$/, '');
        
        if (!cleanDomain || cleanDomain.includes('.')) {
          setError('Please enter just your shop name (e.g., "mystore" not "mystore.myshopify.com")');
          setStep('error');
          return;
        }
      }

      console.log('[DEBUG] Calling unifiedIntegrationService.startOAuthConnection...');
      console.log('[DEBUG] Provider:', provider);
      console.log('[DEBUG] User ID:', user?.id);
      
      // Generate OAuth URL
      const authUrl = await unifiedIntegrationService.startOAuthConnection(
        provider,
        provider === 'shopify' ? shopDomain.replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*$/, '').replace(/\/$/, '') : undefined
      );

      console.log('[DEBUG] Generated OAuth URL:', authUrl);

      // Temporarily bypass credential check since we know HubSpot credentials are configured
      // if (authUrl.includes('client_id=&') || authUrl.includes('client_id=""') || !authUrl.includes('client_id=') || authUrl.match(/client_id=(?:&|$)/)) {
      //   setShowSetupGuide(true);
      //   setStep('info');
      //   return;
      // }

      // Add user ID to state for callback
      const urlWithState = authUrl.includes('state=') 
        ? authUrl.replace(/state=([^&]*)/, `state=${user.id}`)
        : `${authUrl}&state=${user.id}`;

      console.log('[DEBUG] Final OAuth URL with state:', urlWithState);

      // Open OAuth flow in popup window
      console.log('[DEBUG] Opening OAuth popup...');
      const popup = window.open(
        urlWithState,
        `${provider}_oauth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        console.log('[DEBUG] Popup blocked!');
        setError('Popup blocked. Please allow popups and try again.');
        setStep('error');
        return;
      }

      console.log('[DEBUG] Popup opened successfully');

      // Listen for messages from popup window
      const handleMessage = (event: MessageEvent) => {
        console.log('[DEBUG] Received message from popup:', event.data);
        
        if (event.data.type === `${provider.toUpperCase()}_OAUTH_SUCCESS`) {
          console.log('[DEBUG] OAuth success message received');
          window.removeEventListener('message', handleMessage);
          setStep('success');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        } else if (event.data.type === `${provider.toUpperCase()}_OAUTH_ERROR`) {
          console.log('[DEBUG] OAuth error message received:', event.data.error);
          window.removeEventListener('message', handleMessage);
          setError(event.data.error || 'OAuth connection failed');
          setStep('error');
        }
      };

      window.addEventListener('message', handleMessage);

      // Also check for popup closure (fallback)
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          // If we reach here without receiving a message, user likely cancelled
          if (step === 'connecting') {
            console.log('[DEBUG] Popup closed without OAuth completion');
            setStep('info'); // User closed popup without completing
          }
        }
      }, 1000);

    } catch (error) {
      console.error('[DEBUG] OAuth connection error:', error);
      console.error('[DEBUG] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        provider,
        user: user?.id
      });
      setError(error instanceof Error ? error.message : 'Failed to start OAuth connection');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('info');
    setShopDomain('');
    setError(null);
    onClose();
  };

  if (!isOpen || !config) return null;

  // Temporarily disable setup guide - proceed directly to OAuth
  // if (showSetupGuide) {
  //   return <OAuthSetupGuide provider={provider!} onClose={() => setShowSetupGuide(false)} />;
  // }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${config.color} rounded-lg p-2 flex items-center justify-center`}>
                <img
                  src={config.icon}
                  alt={config.name}
                  className="w-6 h-6 filter brightness-0 invert"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Connect {config.name}</h2>
                <p className="text-sm text-gray-500">Set up integration</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <p className="text-gray-600">{config.description}</p>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">What you'll get:</h3>
                  <ul className="space-y-2">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Requirements:</h3>
                  <ul className="space-y-2">
                    {config.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                        <span className="text-sm text-gray-600">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Shop domain input for Shopify */}
                {config.needsShopDomain && (
                  <div>
                    <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Domain *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="shopDomain"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                        placeholder="mystore"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-gray-500">.myshopify.com</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter just your shop name (e.g., "mystore")
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    className="w-full"
                    onClick={handleConnect}
                    disabled={config.needsShopDomain && !shopDomain.trim()}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to {config.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
                    onClick={() => setShowSetupGuide(true)}
                  >
                    Need help setting up OAuth credentials?
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'connecting' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to {config.name}</h3>
                <p className="text-gray-600">
                  Complete the authorization in the popup window. Don't close this dialog until the process is complete.
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Successfully Connected!</h3>
                <p className="text-gray-600">
                  {config.name} has been connected to ROMASHKA. You can now sync your data.
                </p>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Failed</h3>
                <p className="text-gray-600 mb-4">
                  {error || 'Something went wrong while connecting to ' + config.name}
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}