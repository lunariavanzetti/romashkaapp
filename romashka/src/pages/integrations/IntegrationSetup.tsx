import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Shield, Key, Zap, Settings, Eye, EyeOff } from 'lucide-react';
import { Button, Badge, AnimatedSpinner } from '../../components/ui';
import { IntegrationProvider, IntegrationSetupStep, SetupField, IntegrationConfig } from '../../types/integrations';
import { integrationManager } from '../../services/integrations/integrationManager';

interface IntegrationSetupProps {
  provider: IntegrationProvider;
  onComplete: (integrationId: string) => void;
  onCancel: () => void;
}

// Provider-specific setup steps configuration
const getSetupSteps = (provider: IntegrationProvider): IntegrationSetupStep[] => {
  const baseSteps: IntegrationSetupStep[] = [
    {
      id: 'credentials',
      title: 'Authentication',
      description: 'Connect your account securely',
      type: 'credentials',
      required: true,
      completed: false,
      fields: getCredentialFields(provider)
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Configure sync settings and preferences',
      type: 'configuration',
      required: true,
      completed: false,
      fields: getConfigurationFields(provider)
    },
    {
      id: 'field_mapping',
      title: 'Field Mapping',
      description: 'Map fields between systems',
      type: 'field_mapping',
      required: false,
      completed: false
    },
    {
      id: 'testing',
      title: 'Test Connection',
      description: 'Verify your integration works correctly',
      type: 'testing',
      required: true,
      completed: false
    }
  ];

  return baseSteps;
};

function getCredentialFields(provider: IntegrationProvider): SetupField[] {
  switch (provider.id) {
    case 'salesforce':
      return [
        { name: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://yourcompany.my.salesforce.com' },
        { name: 'clientId', label: 'Consumer Key', type: 'text', required: true },
        { name: 'clientSecret', label: 'Consumer Secret', type: 'password', required: true },
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'securityToken', label: 'Security Token', type: 'password', required: true }
      ];
    case 'hubspot':
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'pat-na1-...' },
        { name: 'portalId', label: 'Portal ID', type: 'text', required: true }
      ];
    case 'zendesk':
      return [
        { name: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'yourcompany' },
        { name: 'email', label: 'Email', type: 'text', required: true },
        { name: 'apiToken', label: 'API Token', type: 'password', required: true }
      ];
    case 'shopify':
      return [
        { name: 'shopDomain', label: 'Shop Domain', type: 'text', required: true, placeholder: 'yourstore.myshopify.com' },
        { name: 'accessToken', label: 'Access Token', type: 'password', required: true },
        { name: 'webhookSecret', label: 'Webhook Secret (Optional)', type: 'password', required: false }
      ];
    case 'google-calendar':
      return [
        { name: 'clientId', label: 'Client ID', type: 'text', required: true },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
        { name: 'calendarId', label: 'Calendar ID', type: 'text', required: false, placeholder: 'primary' }
      ];
    default:
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', required: true },
        { name: 'apiUrl', label: 'API URL', type: 'url', required: false }
      ];
  }
}

function getConfigurationFields(provider: IntegrationProvider): SetupField[] {
  return [
    { 
      name: 'syncDirection', 
      label: 'Sync Direction', 
      type: 'select', 
      required: true,
      options: [
        { value: 'bidirectional', label: 'Two-way sync' },
        { value: 'inbound', label: 'Import only' },
        { value: 'outbound', label: 'Export only' }
      ]
    },
    { 
      name: 'syncFrequency', 
      label: 'Sync Frequency', 
      type: 'select', 
      required: true,
      options: [
        { value: '300', label: 'Every 5 minutes' },
        { value: '900', label: 'Every 15 minutes' },
        { value: '3600', label: 'Every hour' },
        { value: '21600', label: 'Every 6 hours' },
        { value: '86400', label: 'Daily' }
      ]
    },
    { 
      name: 'autoSync', 
      label: 'Enable Auto Sync', 
      type: 'checkbox', 
      required: false 
    }
  ];
}

export default function IntegrationSetup({ provider, onComplete, onCancel }: IntegrationSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<IntegrationSetupStep[]>(getSetupSteps(provider));
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStepData.completed || !currentStepData.required;

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateCurrentStep = (): boolean => {
    if (!currentStepData.fields) return true;

    const requiredFields = currentStepData.fields.filter(field => field.required);
    return requiredFields.every(field => formData[field.name]?.toString().trim());
  };

  const handleNext = async () => {
    if (currentStepData.type === 'testing') {
      await testConnection();
    } else {
      const isValid = validateCurrentStep();
      if (isValid) {
        setSteps(prev => prev.map((step, index) => 
          index === currentStep ? { ...step, completed: true } : step
        ));
        
        if (isLastStep) {
          await createIntegration();
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      // Create temporary integration config for testing
      const config: IntegrationConfig = {
        provider: provider.id,
        credentials: getCredentialsFromForm(),
        settings: {
          syncDirection: formData.syncDirection || 'bidirectional',
          syncFrequency: parseInt(formData.syncFrequency || '3600'),
          autoSync: formData.autoSync || false,
          conflictResolution: 'manual',
          batchSize: 100
        },
        fieldMappings: [],
        webhookConfig: formData.webhookSecret ? {
          url: `${window.location.origin}/api/webhooks/${provider.id}`,
          secret: formData.webhookSecret,
          events: ['create', 'update', 'delete']
        } : undefined
      };

      // Test connection using integration manager
      const tempIntegrationId = await integrationManager.createIntegration(config);
      const connectionSuccess = await integrationManager.testConnection(tempIntegrationId);
      
      if (connectionSuccess) {
        setTestResult({ success: true, message: 'Connection successful!' });
        setSteps(prev => prev.map((step, index) => 
          index === currentStep ? { ...step, completed: true } : step
        ));
      } else {
        setTestResult({ success: false, message: 'Connection failed. Please check your credentials.' });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async () => {
    setLoading(true);
    try {
      const config: IntegrationConfig = {
        provider: provider.id,
        credentials: getCredentialsFromForm(),
        settings: {
          syncDirection: formData.syncDirection || 'bidirectional',
          syncFrequency: parseInt(formData.syncFrequency || '3600'),
          autoSync: formData.autoSync || false,
          conflictResolution: 'manual',
          batchSize: 100
        },
        fieldMappings: [],
        webhookConfig: formData.webhookSecret ? {
          url: `${window.location.origin}/api/webhooks/${provider.id}`,
          secret: formData.webhookSecret,
          events: ['create', 'update', 'delete']
        } : undefined
      };

      const integrationId = await integrationManager.createIntegration(config);
      onComplete(integrationId);
    } catch (error) {
      console.error('Failed to create integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCredentialsFromForm = () => {
    const credentials: Record<string, any> = {};
    const credentialFields = getCredentialFields(provider);
    
    credentialFields.forEach(field => {
      if (formData[field.name]) {
        credentials[field.name] = formData[field.name];
      }
    });

    return credentials;
  };

  const renderField = (field: SetupField) => {
    const value = formData[field.name] || '';
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
          </label>
        );
      
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPasswords[field.name] ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
              required={field.required}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );
      
      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl p-3 flex items-center justify-center shadow-sm">
            <img src={provider.logo_url} alt={provider.name} className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
              Setup {provider.name} Integration
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {provider.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${index === currentStep 
                  ? 'border-primary-teal bg-primary-teal text-white' 
                  : step.completed 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-600'
                }
              `}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${index === currentStep ? 'text-primary-teal' : step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-4 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass"
      >
        <div className="flex items-center gap-3 mb-6">
          {currentStepData.type === 'credentials' && <Key className="w-6 h-6 text-primary-teal" />}
          {currentStepData.type === 'configuration' && <Settings className="w-6 h-6 text-primary-teal" />}
          {currentStepData.type === 'field_mapping' && <Zap className="w-6 h-6 text-primary-teal" />}
          {currentStepData.type === 'testing' && <Shield className="w-6 h-6 text-primary-teal" />}
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{currentStepData.description}</p>
          </div>
        </div>

        {/* Form Fields */}
        {currentStepData.fields && (
          <div className="space-y-6">
            {currentStepData.fields.map(field => (
              <div key={field.name}>
                {field.type !== 'checkbox' && (
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        {/* Testing Step Content */}
        {currentStepData.type === 'testing' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              {testResult ? (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className={`flex items-center justify-center gap-2 mb-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 dark:text-gray-300">
                  <p className="mb-4">Ready to test your {provider.name} integration.</p>
                  <p className="text-sm">This will verify that your credentials are correct and the connection is working.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!validateCurrentStep() || loading}
            loading={loading}
          >
            {loading ? (
              <AnimatedSpinner size="sm" />
            ) : isLastStep ? (
              'Complete Setup'
            ) : currentStepData.type === 'testing' ? (
              'Test Connection'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}