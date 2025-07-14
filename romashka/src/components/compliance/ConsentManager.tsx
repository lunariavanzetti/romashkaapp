import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Download, Trash2, Eye, Settings, Check, X } from 'lucide-react';
import { gdprService } from '../../services/security/gdprService';
import type { ConsentSettings, DataSubjectRequest, GDPRExportData } from '../../types/security';

interface ConsentManagerProps {
  customerId?: string;
  isWidget?: boolean;
  onConsentChange?: (settings: ConsentSettings) => void;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ 
  customerId, 
  isWidget = false, 
  onConsentChange 
}) => {
  const [consents, setConsents] = useState<ConsentSettings>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    lastUpdated: new Date().toISOString()
  });
  const [showBanner, setShowBanner] = useState(true);
  const [showDetailedOptions, setShowDetailedOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadConsentSettings();
  }, [customerId]);

  const loadConsentSettings = async () => {
    if (!customerId) return;

    try {
      const { data, error } = await gdprService.getConsentHistory(customerId);
      if (error) throw error;

      if (data && data.length > 0) {
        const latestConsent = data[0];
        setConsents({
          essential: true, // Always true
          functional: data.some(c => c.consent_type === 'functional' && c.consent_given),
          analytics: data.some(c => c.consent_type === 'analytics' && c.consent_given),
          marketing: data.some(c => c.consent_type === 'marketing' && c.consent_given),
          lastUpdated: latestConsent.updated_at
        });
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error loading consent settings:', error);
    }
  };

  const updateConsents = async (newConsents: ConsentSettings) => {
    if (!customerId) return;

    try {
      setLoading(true);
      const { error } = await gdprService.updateConsentSettings(customerId, newConsents);
      if (error) throw error;

      setConsents(newConsents);
      setShowBanner(false);
      setMessage({ type: 'success', text: 'Consent preferences updated successfully' });
      onConsentChange?.(newConsents);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update consent preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (type: keyof ConsentSettings, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled

    const newConsents = {
      ...consents,
      [type]: value,
      lastUpdated: new Date().toISOString()
    };

    updateConsents(newConsents);
  };

  const acceptAll = () => {
    const newConsents = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      lastUpdated: new Date().toISOString()
    };

    updateConsents(newConsents);
  };

  const acceptEssential = () => {
    const newConsents = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      lastUpdated: new Date().toISOString()
    };

    updateConsents(newConsents);
  };

  const exportData = async () => {
    if (!customerId) return;

    try {
      setExportLoading(true);
      const data = await gdprService.exportCustomerData(customerId, 'json');
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `romashka-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Data export downloaded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setExportLoading(false);
    }
  };

  const requestDataDeletion = async () => {
    if (!customerId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all your data? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      const { error } = await gdprService.submitDataSubjectRequest({
        request_type: 'erasure',
        customer_id: customerId,
        request_details: 'User requested complete data deletion from privacy settings'
      });

      if (error) throw error;

      setMessage({ 
        type: 'success', 
        text: 'Data deletion request submitted. You will receive confirmation within 30 days.' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit data deletion request' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const ConsentBanner = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              We respect your privacy
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We use cookies and similar technologies to improve your experience, analyze site usage, 
              and personalize content. You can manage your preferences below.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => setShowDetailedOptions(true)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Cookie Settings
              </button>
              <span className="text-gray-300">|</span>
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                Privacy Policy
              </a>
            </div>
          </div>
          <div className="flex space-x-3 ml-4">
            <button
              onClick={acceptEssential}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Essential Only
            </button>
            <button
              onClick={acceptAll}
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DetailedOptions = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
            <button
              onClick={() => setShowDetailedOptions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Essential Cookies */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Essential Cookies</h3>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Always Active</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              These cookies are necessary for the website to function and cannot be switched off. 
              They are usually only set in response to actions made by you which amount to a request for services.
            </p>
          </div>

          {/* Functional Cookies */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Functional Cookies</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.functional}
                  onChange={(e) => handleConsentChange('functional', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full ${consents.functional ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${consents.functional ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              These cookies enable the website to provide enhanced functionality and personalization. 
              They may be set by us or by third-party providers whose services we have added to our pages.
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Analytics Cookies</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.analytics}
                  onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full ${consents.analytics ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${consents.analytics ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              These cookies allow us to count visits and traffic sources so we can measure and improve 
              the performance of our site. They help us to know which pages are the most and least popular.
            </p>
          </div>

          {/* Marketing Cookies */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">Marketing Cookies</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full ${consents.marketing ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${consents.marketing ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-600">
              These cookies may be set through our site by our advertising partners. They may be used 
              to build a profile of your interests and show you relevant adverts on other sites.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={acceptEssential}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Save Essential Only
            </button>
            <button
              onClick={() => setShowDetailedOptions(false)}
              disabled={loading}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PrivacyControls = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Privacy Controls</h2>
          <p className="text-sm text-gray-600">Manage your data and privacy preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Consent Status */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Consent Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Cookie className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Essential Cookies</span>
              </div>
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Functional Cookies</span>
              </div>
              {consents.functional ? 
                <Check className="h-5 w-5 text-green-500" /> : 
                <X className="h-5 w-5 text-red-500" />
              }
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Analytics Cookies</span>
              </div>
              {consents.analytics ? 
                <Check className="h-5 w-5 text-green-500" /> : 
                <X className="h-5 w-5 text-red-500" />
              }
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Marketing Cookies</span>
              </div>
              {consents.marketing ? 
                <Check className="h-5 w-5 text-green-500" /> : 
                <X className="h-5 w-5 text-red-500" />
              }
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Last updated: {new Date(consents.lastUpdated).toLocaleString()}
          </p>
        </div>

        {/* Data Rights */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Data Rights</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Export Your Data</h4>
                <p className="text-sm text-gray-600">Download a copy of all your personal data</p>
              </div>
              <button
                onClick={exportData}
                disabled={exportLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Delete Your Data</h4>
                <p className="text-sm text-gray-600">Request permanent deletion of all your data</p>
              </div>
              <button
                onClick={requestDataDeletion}
                disabled={deleteLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Update Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Update Preferences</h3>
          <button
            onClick={() => setShowDetailedOptions(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Cookie Settings
          </button>
        </div>
      </div>
    </div>
  );

  // Message display component
  const Message = () => {
    if (!message) return null;

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center">
          {message.type === 'success' ? 
            <Check className="h-5 w-5 mr-2" /> : 
            <X className="h-5 w-5 mr-2" />
          }
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (isWidget) {
    return (
      <>
        {showBanner && <ConsentBanner />}
        {showDetailedOptions && <DetailedOptions />}
        <Message />
      </>
    );
  }

  return (
    <>
      <PrivacyControls />
      {showDetailedOptions && <DetailedOptions />}
      <Message />
    </>
  );
};

export default ConsentManager;