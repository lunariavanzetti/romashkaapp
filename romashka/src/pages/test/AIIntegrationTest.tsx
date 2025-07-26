import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { aiService } from '../../services/aiService';
import AIIntegrationBridge from '../../services/integrations/aiIntegrationBridge';
import SmartKnowledgeGenerator from '../../services/integrations/smartKnowledgeGenerator';

interface TestResult {
  query: string;
  response: string;
  timestamp: string;
  integrationDetected: boolean;
  error?: string;
}

export default function AIIntegrationTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  const testQueries = [
    "Who are our customers?",
    "What deals are in our pipeline?", 
    "Show me our business overview",
    "Do we have any high-value deals?",
    "Tell me about our customer database",
    "What's our sales situation?",
    "How many contacts do we have?",
    "What companies are we working with?"
  ];

  const runSingleTest = async (query: string) => {
    if (!user) {
      setTestResults(prev => [...prev, {
        query,
        response: 'Error: User not authenticated',
        timestamp: new Date().toISOString(),
        integrationDetected: false,
        error: 'No user session'
      }]);
      return;
    }

    try {
      console.log(`[Test] Running query: ${query}`);
      
      // Check if query would be detected as integration query
      const bridge = new AIIntegrationBridge(user);
      const integrationDetected = bridge.isIntegrationQuery(query);
      
      // Get AI response
      const response = await aiService.generateResponse(query, [], 'en', user);
      
      setTestResults(prev => [...prev, {
        query,
        response: response || 'No response received',
        timestamp: new Date().toISOString(),
        integrationDetected,
      }]);
      
      console.log(`[Test] Completed: ${query} - Integration detected: ${integrationDetected}`);
    } catch (error) {
      console.error(`[Test] Error for query "${query}":`, error);
      setTestResults(prev => [...prev, {
        query,
        response: 'Error generating response',
        timestamp: new Date().toISOString(),
        integrationDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const query of testQueries) {
      await runSingleTest(query);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
  };

  const runCustomTest = async () => {
    if (customQuery.trim()) {
      await runSingleTest(customQuery);
      setCustomQuery('');
    }
  };

  const testIntegrationBridge = async () => {
    if (!user) return;
    
    try {
      const bridge = new AIIntegrationBridge(user);
      const data = await bridge.getIntegrationContext();
      
      setTestResults(prev => [...prev, {
        query: '[BRIDGE TEST] Get Integration Context',
        response: `Contacts: ${data.contacts.length}, Deals: ${data.deals.length}, Products: ${data.products.length}, Orders: ${data.orders.length}`,
        timestamp: new Date().toISOString(),
        integrationDetected: true
      }]);
    } catch (error) {
      console.error('Bridge test error:', error);
      setTestResults(prev => [...prev, {
        query: '[BRIDGE TEST] Get Integration Context',
        response: 'Error testing integration bridge',
        timestamp: new Date().toISOString(),
        integrationDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const testKnowledgeGeneration = async () => {
    if (!user) return;
    
    try {
      const generator = new SmartKnowledgeGenerator(user);
      const success = await generator.autoGenerateKnowledge();
      
      setTestResults(prev => [...prev, {
        query: '[KNOWLEDGE TEST] Auto-generate Knowledge',
        response: success ? 'Knowledge generation completed successfully' : 'Knowledge generation failed',
        timestamp: new Date().toISOString(),
        integrationDetected: true
      }]);
    } catch (error) {
      console.error('Knowledge generation test error:', error);
      setTestResults(prev => [...prev, {
        query: '[KNOWLEDGE TEST] Auto-generate Knowledge',
        response: 'Error testing knowledge generation',
        timestamp: new Date().toISOString(),
        integrationDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h2>
          <p className="text-red-700">Please log in to test AI-Integration Bridge functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 AI-Integration Bridge Testing</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Test Status</h3>
          <p className="text-blue-800">User: {user.email}</p>
          <p className="text-blue-800">Integration Bridge: ✅ Available</p>
          <p className="text-blue-800">Smart Knowledge Generator: ✅ Available</p>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run All AI Tests'}
          </button>
          
          <button
            onClick={testIntegrationBridge}
            disabled={isRunning}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Integration Bridge
          </button>
          
          <button
            onClick={testKnowledgeGeneration}
            disabled={isRunning}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Test Knowledge Generation
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>

        {/* Custom Query */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Custom Test Query</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter your test query..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && runCustomTest()}
            />
            <button
              onClick={runCustomTest}
              disabled={!customQuery.trim() || isRunning}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Test
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Test Results ({testResults.length})</h3>
          
          {testResults.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              No test results yet. Click "Run All AI Tests" to start testing.
            </div>
          )}
          
          {testResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{result.query}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.integrationDetected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {result.integrationDetected ? 'Integration Query' : 'Regular Query'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {result.error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  Error: {result.error}
                </div>
              )}
              
              <div className="bg-gray-50 rounded p-3">
                <p className="text-gray-700 whitespace-pre-wrap">{result.response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}