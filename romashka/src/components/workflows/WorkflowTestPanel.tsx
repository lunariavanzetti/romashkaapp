import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Workflow, TestResult, ExecutionStatus } from '../../types/workflow';

interface WorkflowTestPanelProps {
  workflow?: Workflow;
  onClose: () => void;
}

const WorkflowTestPanel: React.FC<WorkflowTestPanelProps> = ({
  workflow,
  onClose
}) => {
  const [testData, setTestData] = useState({
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      tier: 'premium'
    },
    message: {
      content: 'I need a refund for my order',
      sentiment_score: -0.8
    },
    order: {
      id: 'ORDER-123',
      value: 599.99,
      status: 'delayed'
    }
  });

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      execution_id: 'test-exec-1',
      status: 'completed',
      duration: 2340,
      steps_executed: 5,
      errors: [],
      outputs: {
        email_sent: true,
        hubspot_ticket_created: 'TICKET-456',
        slack_notification_sent: true
      }
    }
  ]);

  const [isRunningTest, setIsRunningTest] = useState(false);

  const handleRunTest = async () => {
    setIsRunningTest(true);
    
    // Simulate test execution
    setTimeout(() => {
      const newTestResult: TestResult = {
        execution_id: `test-exec-${Date.now()}`,
        status: Math.random() > 0.2 ? 'completed' : 'failed',
        duration: Math.floor(Math.random() * 5000) + 1000,
        steps_executed: Math.floor(Math.random() * 8) + 1,
        errors: Math.random() > 0.7 ? ['Sample error message'] : [],
        outputs: {
          test_run: true,
          timestamp: new Date().toISOString()
        }
      };
      
      setTestResults([newTestResult, ...testResults]);
      setIsRunningTest(false);
    }, 2000);
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Test Workflow: {workflow?.name || 'Untitled Workflow'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Test Data Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Test Data</h4>
                
                {/* Customer Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Customer</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <input
                        type="text"
                        value={testData.customer.name}
                        onChange={(e) => setTestData({
                          ...testData,
                          customer: { ...testData.customer, name: e.target.value }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Email</label>
                      <input
                        type="email"
                        value={testData.customer.email}
                        onChange={(e) => setTestData({
                          ...testData,
                          customer: { ...testData.customer, email: e.target.value }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Tier</label>
                      <select
                        value={testData.customer.tier}
                        onChange={(e) => setTestData({
                          ...testData,
                          customer: { ...testData.customer, tier: e.target.value }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Message Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Message</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Content</label>
                      <textarea
                        value={testData.message.content}
                        onChange={(e) => setTestData({
                          ...testData,
                          message: { ...testData.message, content: e.target.value }
                        })}
                        rows={3}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Sentiment Score (-1 to 1)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="-1"
                        max="1"
                        value={testData.message.sentiment_score}
                        onChange={(e) => setTestData({
                          ...testData,
                          message: { ...testData.message, sentiment_score: parseFloat(e.target.value) }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Order (Optional)</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Order ID</label>
                      <input
                        type="text"
                        value={testData.order.id}
                        onChange={(e) => setTestData({
                          ...testData,
                          order: { ...testData.order, id: e.target.value }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testData.order.value}
                        onChange={(e) => setTestData({
                          ...testData,
                          order: { ...testData.order, value: parseFloat(e.target.value) }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Status</label>
                      <select
                        value={testData.order.status}
                        onChange={(e) => setTestData({
                          ...testData,
                          order: { ...testData.order, status: e.target.value }
                        })}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Run Test Button */}
                <button
                  onClick={handleRunTest}
                  disabled={isRunningTest}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isRunningTest ? (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    'Run Test'
                  )}
                </button>
              </div>

              {/* Test Results */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Test Results</h4>
                
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm">No test results yet</p>
                    <p className="text-xs">Run a test to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={result.execution_id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {getStatusIcon(result.status)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(result.status)}`}>
                              {result.status.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {result.duration}ms
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Steps:</span>
                            <span className="ml-1 font-medium">{result.steps_executed}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Errors:</span>
                            <span className="ml-1 font-medium text-red-600">
                              {result.errors.length}
                            </span>
                          </div>
                        </div>

                        {result.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded text-xs">
                            <div className="font-medium text-red-800 mb-1">Errors:</div>
                            {result.errors.map((error, i) => (
                              <div key={i} className="text-red-700">{error}</div>
                            ))}
                          </div>
                        )}

                        {Object.keys(result.outputs).length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-gray-700 mb-2">Outputs:</div>
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(result.outputs, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Scenarios */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Test Scenarios</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setTestData({
                    customer: { name: 'Jane Smith', email: 'jane@example.com', phone: '+1987654321', tier: 'premium' },
                    message: { content: 'This is terrible! I want my money back!', sentiment_score: -0.9 },
                    order: { id: 'ORDER-789', value: 1299.99, status: 'delayed' }
                  })}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900">Angry Customer</div>
                  <div className="text-xs text-gray-500">High-value premium customer with negative sentiment</div>
                </button>

                <button
                  onClick={() => setTestData({
                    customer: { name: 'Bob Johnson', email: 'bob@example.com', phone: '+1555666777', tier: 'free' },
                    message: { content: 'Great service, thank you!', sentiment_score: 0.8 },
                    order: { id: 'ORDER-456', value: 49.99, status: 'delivered' }
                  })}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900">Happy Customer</div>
                  <div className="text-xs text-gray-500">Free tier customer with positive sentiment</div>
                </button>

                <button
                  onClick={() => setTestData({
                    customer: { name: 'Alice Brown', email: 'alice@company.com', phone: '+1444555666', tier: 'enterprise' },
                    message: { content: 'I need help with my account setup', sentiment_score: 0.1 },
                    order: { id: 'ORDER-999', value: 5000.00, status: 'processing' }
                  })}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900">Enterprise Customer</div>
                  <div className="text-xs text-gray-500">High-value enterprise customer needing support</div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTestPanel;