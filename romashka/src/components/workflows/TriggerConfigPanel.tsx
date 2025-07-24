import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Workflow, TriggerType, WorkflowTrigger } from '../../types/workflow';

interface TriggerConfigPanelProps {
  workflow?: Workflow;
  onClose: () => void;
  onUpdate: (triggerConfig: WorkflowTrigger) => void;
}

const TriggerConfigPanel: React.FC<TriggerConfigPanelProps> = ({
  workflow,
  onClose,
  onUpdate
}) => {
  const [triggerType, setTriggerType] = useState<TriggerType>(
    workflow?.trigger_type || 'manual'
  );
  const [conditions, setConditions] = useState(
    workflow?.trigger_conditions?.conditions || []
  );
  const [settings, setSettings] = useState(
    workflow?.trigger_conditions?.settings || {}
  );

  const handleSave = () => {
    const triggerConfig: WorkflowTrigger = {
      type: triggerType,
      conditions,
      settings
    };
    onUpdate(triggerConfig);
  };

  const renderTriggerSpecificSettings = () => {
    switch (triggerType) {
      case 'chat_message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sentiment Threshold
              </label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={settings.sentiment_threshold || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  sentiment_threshold: parseFloat(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="-0.7"
              />
              <p className="mt-1 text-xs text-gray-500">
                Trigger when sentiment score is below this value (-1 to 1)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={settings.keywords?.join(', ') || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="refund, cancel, complaint"
              />
              <p className="mt-1 text-xs text-gray-500">
                Trigger when message contains any of these keywords
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.case_sensitive || false}
                  onChange={(e) => setSettings({
                    ...settings,
                    case_sensitive: e.target.checked
                  })}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Case sensitive matching</span>
              </label>
            </div>
          </div>
        );

      case 'integration_change':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Integration Source
              </label>
              <select
                value={settings.integration_source || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  integration_source: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select integration...</option>
                <option value="hubspot">HubSpot</option>
                <option value="salesforce">Salesforce</option>
                <option value="shopify">Shopify</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                value={settings.event_type || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  event_type: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select event type...</option>
                {settings.integration_source === 'hubspot' && (
                  <>
                    <option value="contact.created">Contact Created</option>
                    <option value="contact.updated">Contact Updated</option>
                    <option value="deal.created">Deal Created</option>
                    <option value="deal.updated">Deal Updated</option>
                    <option value="deal.stage_changed">Deal Stage Changed</option>
                  </>
                )}
                {settings.integration_source === 'salesforce' && (
                  <>
                    <option value="account.created">Account Created</option>
                    <option value="opportunity.created">Opportunity Created</option>
                    <option value="opportunity.updated">Opportunity Updated</option>
                    <option value="case.created">Case Created</option>
                  </>
                )}
                {settings.integration_source === 'shopify' && (
                  <>
                    <option value="order.created">Order Created</option>
                    <option value="order.updated">Order Updated</option>
                    <option value="order.cancelled">Order Cancelled</option>
                    <option value="customer.created">Customer Created</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Value (optional)
              </label>
              <input
                type="number"
                value={settings.min_value || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  min_value: parseFloat(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only trigger for records above this value (e.g., order amount, deal value)
              </p>
            </div>
          </div>
        );

      case 'time_based':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Schedule Type
              </label>
              <select
                value={settings.schedule_type || 'interval'}
                onChange={(e) => setSettings({
                  ...settings,
                  schedule_type: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="interval">Interval</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="cron">Cron Expression</option>
              </select>
            </div>

            {settings.schedule_type === 'interval' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.schedule_value || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    schedule_value: parseInt(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="60"
                />
              </div>
            )}

            {settings.schedule_type === 'daily' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time (24-hour format)
                </label>
                <input
                  type="time"
                  value={settings.schedule_time || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    schedule_time: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            {settings.schedule_type === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Day of Week
                </label>
                <select
                  value={settings.schedule_day || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    schedule_day: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select day...</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
            )}

            {settings.schedule_type === 'cron' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={settings.cron_expression || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    cron_expression: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                  placeholder="0 9 * * 1-5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Example: "0 9 * * 1-5" runs at 9 AM on weekdays
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                value={settings.timezone || 'UTC'}
                onChange={(e) => setSettings({
                  ...settings,
                  timezone: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.webhook_url || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  webhook_url: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://api.example.com/webhook"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                This URL will be generated automatically when you save the workflow
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Authentication Method
              </label>
              <select
                value={settings.auth_method || 'none'}
                onChange={(e) => setSettings({
                  ...settings,
                  auth_method: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="none">None</option>
                <option value="api_key">API Key</option>
                <option value="bearer_token">Bearer Token</option>
                <option value="basic_auth">Basic Auth</option>
              </select>
            </div>

            {settings.auth_method !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Authentication Value
                </label>
                <input
                  type="password"
                  value={settings.auth_value || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    auth_value: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Your API key or token"
                />
              </div>
            )}
          </div>
        );

      case 'sentiment_analysis':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sentiment Threshold
              </label>
              <input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={settings.sentiment_threshold || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  sentiment_threshold: parseFloat(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="-0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trigger Condition
              </label>
              <select
                value={settings.condition || 'below'}
                onChange={(e) => setSettings({
                  ...settings,
                  condition: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="below">Below threshold</option>
                <option value="above">Above threshold</option>
                <option value="equal">Equal to threshold</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            No additional settings required for this trigger type.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configure Trigger</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Trigger Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trigger Type
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="chat_message">Chat Message</option>
                  <option value="integration_change">Integration Change</option>
                  <option value="time_based">Time Based</option>
                  <option value="webhook">Webhook</option>
                  <option value="sentiment_analysis">Sentiment Analysis</option>
                  <option value="keyword_detection">Keyword Detection</option>
                  <option value="customer_action">Customer Action</option>
                </select>
              </div>

              {/* Trigger-specific Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Trigger Settings
                </h4>
                {renderTriggerSpecificSettings()}
              </div>

              {/* Customer Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Customer Filters (Optional)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Tier
                    </label>
                    <select
                      value={settings.customer_tier || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        customer_tier: e.target.value
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Any tier</option>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.new_customers_only || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          new_customers_only: e.target.checked
                        })}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        New customers only (first 30 days)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save Trigger
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriggerConfigPanel;