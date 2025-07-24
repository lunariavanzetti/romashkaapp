import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ActionType } from '../../types/workflow';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, updates: any) => void;
  onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdate, onClose }) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [config, setConfig] = useState(node.data.config || {});

  useEffect(() => {
    setLabel(node.data.label || '');
    setDescription(node.data.description || '');
    setConfig(node.data.config || {});
  }, [node]);

  const handleSave = () => {
    onUpdate(node.id, {
      label,
      description,
      config
    });
  };

  const renderActionConfig = () => {
    const actionType = config.action_type as ActionType;

    switch (actionType) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">To Email</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => setConfig({ ...config, to: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="recipient@example.com or {{customer.email}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Template</label>
              <textarea
                value={config.template || ''}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Email template with {{variables}}"
              />
            </div>
          </div>
        );

      case 'send_sms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={config.to || ''}
                onChange={(e) => setConfig({ ...config, to: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="+1234567890 or {{customer.phone}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="SMS message with {{variables}}"
              />
            </div>
          </div>
        );

      case 'send_slack':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Channel</label>
              <input
                type="text"
                value={config.channel || ''}
                onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="#general or @username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Slack message with {{variables}}"
              />
            </div>
          </div>
        );

      case 'hubspot_create_contact':
      case 'hubspot_update_contact':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="{{customer.email}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={config.firstname || ''}
                onChange={(e) => setConfig({ ...config, firstname: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="{{customer.first_name}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={config.lastname || ''}
                onChange={(e) => setConfig({ ...config, lastname: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="{{customer.last_name}}"
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (milliseconds)</label>
              <input
                type="number"
                value={config.duration || ''}
                onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="5000"
              />
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Body (JSON)</label>
              <textarea
                value={config.body ? JSON.stringify(config.body, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setConfig({ ...config, body: parsed });
                  } catch {
                    // Invalid JSON, keep the string for now
                  }
                }}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            Select an action type to configure specific settings.
          </div>
        );
    }
  };

  const renderConditionConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Field</label>
          <input
            type="text"
            value={config.field || ''}
            onChange={(e) => setConfig({ ...config, field: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="customer.tier or sentiment_score"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Operator</label>
          <select
            value={config.operator || 'equals'}
            onChange={(e) => setConfig({ ...config, operator: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="contains">Contains</option>
            <option value="not_contains">Not Contains</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
            <option value="greater_equal">Greater Than or Equal</option>
            <option value="less_equal">Less Than or Equal</option>
            <option value="in">In List</option>
            <option value="not_in">Not In List</option>
            <option value="regex">Regex Match</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Value</label>
          <input
            type="text"
            value={config.value || ''}
            onChange={(e) => setConfig({ ...config, value: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="premium or -0.7"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Data Type</label>
          <select
            value={config.type || 'string'}
            onChange={(e) => setConfig({ ...config, type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
            <option value="array">Array</option>
          </select>
        </div>
      </div>
    );
  };

  const renderNodeSpecificConfig = () => {
    switch (node.data.nodeType) {
      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Action Type</label>
              <select
                value={config.action_type || ''}
                onChange={(e) => setConfig({ ...config, action_type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select action type...</option>
                <optgroup label="Notifications">
                  <option value="send_email">Send Email</option>
                  <option value="send_sms">Send SMS</option>
                  <option value="send_slack">Send Slack Message</option>
                </optgroup>
                <optgroup label="HubSpot">
                  <option value="hubspot_create_contact">Create HubSpot Contact</option>
                  <option value="hubspot_update_contact">Update HubSpot Contact</option>
                  <option value="hubspot_create_deal">Create HubSpot Deal</option>
                  <option value="hubspot_update_deal">Update HubSpot Deal</option>
                  <option value="hubspot_create_ticket">Create HubSpot Ticket</option>
                </optgroup>
                <optgroup label="Salesforce">
                  <option value="salesforce_create_contact">Create Salesforce Contact</option>
                  <option value="salesforce_update_contact">Update Salesforce Contact</option>
                  <option value="salesforce_create_opportunity">Create Salesforce Opportunity</option>
                  <option value="salesforce_create_task">Create Salesforce Task</option>
                  <option value="salesforce_create_case">Create Salesforce Case</option>
                </optgroup>
                <optgroup label="Shopify">
                  <option value="shopify_create_customer">Create Shopify Customer</option>
                  <option value="shopify_update_customer">Update Shopify Customer</option>
                  <option value="shopify_create_order">Create Shopify Order</option>
                  <option value="shopify_update_order">Update Shopify Order</option>
                  <option value="shopify_create_discount">Create Shopify Discount</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="escalate_to_human">Escalate to Human</option>
                  <option value="delay">Delay</option>
                  <option value="webhook">Webhook</option>
                  <option value="custom_script">Custom Script</option>
                </optgroup>
              </select>
            </div>
            {config.action_type && renderActionConfig()}
          </div>
        );

      case 'condition':
        return renderConditionConfig();

      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Message Template</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Message with {{variables}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Channel</label>
              <select
                value={config.channel || 'chat'}
                onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="chat">Chat</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Input Type</label>
              <select
                value={config.input_type || 'text'}
                onChange={(e) => setConfig({ ...config, input_type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prompt</label>
              <input
                type="text"
                value={config.prompt || ''}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="What information do you need?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Variable Name</label>
              <input
                type="text"
                value={config.variable_name || ''}
                onChange={(e) => setConfig({ ...config, variable_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="customer_name"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.required || false}
                  onChange={(e) => setConfig({ ...config, required: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configure Node</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Basic Settings</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Node label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Node-specific Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            {node.data.nodeType.charAt(0).toUpperCase() + node.data.nodeType.slice(1)} Settings
          </h4>
          {renderNodeSpecificConfig()}
        </div>

        {/* Variable Helper */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Available Variables</h5>
          <div className="text-xs text-blue-700 space-y-1">
            <div><code>{'{{customer.name}}'}</code> - Customer name</div>
            <div><code>{'{{customer.email}}'}</code> - Customer email</div>
            <div><code>{'{{customer.phone}}'}</code> - Customer phone</div>
            <div><code>{'{{customer.tier}}'}</code> - Customer tier</div>
            <div><code>{'{{message.content}}'}</code> - Message content</div>
            <div><code>{'{{sentiment_score}}'}</code> - Sentiment score</div>
            <div><code>{'{{workflow.name}}'}</code> - Workflow name</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;