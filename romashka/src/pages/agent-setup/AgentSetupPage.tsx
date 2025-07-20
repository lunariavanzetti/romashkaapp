import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlayIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  GlobeAltIcon,
  SparklesIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface SetupStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactElement;
  status: 'pending' | 'in_progress' | 'completed';
  optional?: boolean;
}

const AgentSetupPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessType, setBusinessType] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentTone, setAgentTone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [humanAgents, setHumanAgents] = useState([{ name: '', email: '' }]);
  const [setupComplete, setSetupComplete] = useState(false);

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 1,
      title: 'Welcome to ROMASHKA',
      description: 'Get started with your AI-powered customer service agent',
      icon: <SparklesIcon className="w-6 h-6" />,
      status: 'in_progress'
    },
    {
      id: 2,
      title: 'Enable ROMASHKA AI Agent',
      description: 'Choose your business type and enable the AI agent',
      icon: <AcademicCapIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 3,
      title: 'Let ROMASHKA Learn from Your Website',
      description: 'Scan your website or upload knowledge documents',
      icon: <GlobeAltIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 4,
      title: 'Customize ROMASHKA',
      description: 'Configure name, tone, and response guidelines',
      icon: <CogIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 5,
      title: 'Test ROMASHKA',
      description: 'Preview and test your AI agent responses',
      icon: <PlayIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 6,
      title: 'Add Human Agent Fallback',
      description: 'Configure human agents for complex queries',
      icon: <UsersIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 7,
      title: 'Embed Widget on Website',
      description: 'Add the chat widget to your website',
      icon: <GlobeAltIcon className="w-6 h-6" />,
      status: 'pending'
    },
    {
      id: 8,
      title: 'Monitor Conversations',
      description: 'Track performance and optimize responses',
      icon: <ChartBarIcon className="w-6 h-6" />,
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: number, status: 'pending' | 'in_progress' | 'completed') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      updateStepStatus(currentStep, 'completed');
      setCurrentStep(currentStep + 1);
      updateStepStatus(currentStep + 1, 'in_progress');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      updateStepStatus(currentStep, 'pending');
      setCurrentStep(currentStep - 1);
      updateStepStatus(currentStep - 1, 'in_progress');
    }
  };

  const businessTypes = [
    { value: 'ecommerce', label: 'E-commerce Store', description: 'Selling products online' },
    { value: 'service', label: 'Service Provider', description: 'Consulting, agencies, professional services' },
    { value: 'saas', label: 'SaaS/Software', description: 'Software as a Service, tech products' },
    { value: 'education', label: 'Education', description: 'Schools, courses, training' },
    { value: 'healthcare', label: 'Healthcare', description: 'Medical services, clinics, hospitals' },
    { value: 'other', label: 'Other', description: 'Tell us more about your business' }
  ];

  const toneOptions = [
    { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and conversational' },
    { value: 'professional', label: 'Professional', description: 'Formal, business-like, and respectful' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, informal, and easy-going' }
  ];

  const handleWebsiteScan = async () => {
    setIsScanning(true);
    // Simulate website scanning
    setTimeout(() => {
      setIsScanning(false);
      setKnowledgeContent(`
**Shipping Information**
- Free shipping on orders over $50
- 2-3 business days delivery
- International shipping available

**Return Policy**
- 30-day return policy
- Items must be in original condition
- Free returns for defective items

**Contact Information**
- Email: support@example.com
- Phone: 1-800-123-4567
- Live chat available 24/7
      `.trim());
    }, 3000);
  };

  const addHumanAgent = () => {
    setHumanAgents([...humanAgents, { name: '', email: '' }]);
  };

  const updateHumanAgent = (index: number, field: 'name' | 'email', value: string) => {
    const updated = humanAgents.map((agent, i) => 
      i === index ? { ...agent, [field]: value } : agent
    );
    setHumanAgents(updated);
  };

  const removeHumanAgent = (index: number) => {
    if (humanAgents.length > 1) {
      setHumanAgents(humanAgents.filter((_, i) => i !== index));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ROMASHKA AI</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Set up your AI-powered customer service agent in just a few minutes. 
                ROMASHKA will learn from your website and handle customer inquiries 24/7, 
                escalating complex issues to your team when needed.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-700">
                <strong>💡 This will take about 5-10 minutes</strong><br />
                Have your website URL and support team emails ready.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable ROMASHKA AI Agent</h2>
              <p className="text-gray-600">Choose your business type to customize the AI for your needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {businessTypes.map(type => (
                <div
                  key={type.value}
                  onClick={() => setBusinessType(type.value)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    businessType === type.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  {businessType === type.value && (
                    <CheckIcon className="w-5 h-5 text-blue-500 float-right mt-2" />
                  )}
                </div>
              ))}
            </div>
            
            {businessType && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-green-700">
                  ✅ Great! ROMASHKA will be optimized for {businessTypes.find(t => t.value === businessType)?.label.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let ROMASHKA Learn from Your Website</h2>
              <p className="text-gray-600">Enter your website URL and we'll scan for FAQ pages, help content, and other useful information</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleWebsiteScan}
                    disabled={!websiteUrl || isScanning}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Scanning...
                      </>
                    ) : (
                      'Scan Website'
                    )}
                  </button>
                </div>
              </div>
              
              {knowledgeContent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Knowledge Extracted Successfully!</h3>
                  <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{knowledgeContent}</pre>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    ROMASHKA found information about shipping, returns, and contact details from your website.
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Or manually add knowledge by uploading documents (.pdf, .docx, .txt) or pasting FAQ content
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize ROMASHKA</h2>
              <p className="text-gray-600">Configure your AI agent's name, personality, and response guidelines</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., Alex, Maya, Customer Support Bot"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conversation Tone</label>
                <div className="space-y-3">
                  {toneOptions.map(tone => (
                    <div
                      key={tone.value}
                      onClick={() => setAgentTone(tone.value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        agentTone === tone.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{tone.label}</h3>
                          <p className="text-sm text-gray-600">{tone.description}</p>
                        </div>
                        {agentTone === tone.value && (
                          <CheckIcon className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">🛠️ Advanced Settings</h3>
                <div className="space-y-2 text-sm text-yellow-700">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Avoid discussing pricing (escalate to human)
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Don't answer technical support questions
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Always ask for customer contact info
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Test ROMASHKA</h2>
              <p className="text-gray-600">Try asking some questions to see how your AI agent responds</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">Preview Chat Widget</h3>
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="bg-blue-500 text-white p-3 rounded-t-lg">
                    <h4 className="font-medium">Chat with {agentName || 'ROMASHKA'}</h4>
                    <p className="text-sm opacity-90">Online • Typically responds in a few minutes</p>
                  </div>
                  <div className="p-4 h-64 overflow-y-auto space-y-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        R
                      </div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
                        <p className="text-sm">
                          Hi! I'm {agentName || 'ROMASHKA'}, your {agentTone} AI assistant. How can I help you today?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Send</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Try these sample questions:</h4>
                <div className="space-y-2">
                  {[
                    "What are your shipping options?",
                    "Do you accept returns?",
                    "Where are you located?",
                    "How can I contact support?"
                  ].map((question, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                      onClick={() => {
                        // Simulate AI response
                        alert(`ROMASHKA would respond based on your knowledge base and ${agentTone} tone.`);
                      }}
                    >
                      "{question}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Human Agent Fallback</h2>
              <p className="text-gray-600">Add your team members who will handle complex questions that ROMASHKA can't answer</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="space-y-4">
                {humanAgents.map((agent, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900">Human Agent {index + 1}</h3>
                      {humanAgents.length > 1 && (
                        <button
                          onClick={() => removeHumanAgent(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={agent.name}
                          onChange={(e) => updateHumanAgent(index, 'name', e.target.value)}
                          placeholder="Agent name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={agent.email}
                          onChange={(e) => updateHumanAgent(index, 'email', e.target.value)}
                          placeholder="agent@company.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addHumanAgent}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Add Another Human Agent
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-blue-900 mb-2">🤝 How Human Fallback Works</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ROMASHKA will try to answer questions using your knowledge base</li>
                  <li>• If it's unsure, it will offer to connect the customer to a human agent</li>
                  <li>• Your team will be notified via email and dashboard notifications</li>
                  <li>• Seamless handoff with full conversation context</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Embed Widget on Your Website</h2>
              <p className="text-gray-600">Copy this code and paste it before the closing &lt;/body&gt; tag in your website</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium">JavaScript Widget Code</h3>
                  <button
                    onClick={() => {
                      const code = `<script src="https://widget.romashka.ai/embed.js" data-agent="${agentName || 'romashka'}" data-tone="${agentTone}"></script>`;
                      navigator.clipboard.writeText(code);
                      alert('Widget code copied to clipboard!');
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Copy Code
                  </button>
                </div>
                <code className="text-green-400 text-sm block break-all">
                  {`<script src="https://widget.romashka.ai/embed.js" data-agent="${agentName || 'romashka'}" data-tone="${agentTone}"></script>`}
                </code>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 font-bold">W</span>
                  </div>
                  <h3 className="font-medium text-gray-900">WordPress</h3>
                  <p className="text-sm text-gray-600 mt-1">Add to theme footer or use plugin</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">S</span>
                  </div>
                  <h3 className="font-medium text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-600 mt-1">Paste in theme.liquid file</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">H</span>
                  </div>
                  <h3 className="font-medium text-gray-900">HTML</h3>
                  <p className="text-sm text-gray-600 mt-1">Add before &lt;/body&gt; tag</p>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">✅ Widget Features</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Responsive design that works on all devices</li>
                  <li>• Customizable colors and positioning</li>
                  <li>• GDPR compliant and privacy-friendly</li>
                  <li>• Real-time typing indicators</li>
                  <li>• File upload support</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Monitor Conversations</h2>
              <p className="text-gray-600">Track ROMASHKA's performance and optimize responses</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    See conversation volume, response accuracy, and customer satisfaction
                  </p>
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    View Analytics
                  </button>
                </div>
                
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UsersIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Live Conversations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitor active chats and jump in when human help is needed
                  </p>
                  <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Open Inbox
                  </button>
                </div>
                
                <div className="bg-white border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AcademicCapIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Improve Responses</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Review and improve ROMASHKA's answers based on real conversations
                  </p>
                  <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                    Train Agent
                  </button>
                </div>
              </div>
              
              <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h2>
                <p className="text-lg text-gray-700 mb-6">
                  Your ROMASHKA AI agent is now live and ready to help your customers 24/7!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="font-semibold text-gray-900">Agent Name</div>
                    <div className="text-gray-600">{agentName || 'ROMASHKA'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="font-semibold text-gray-900">Tone</div>
                    <div className="text-gray-600 capitalize">{agentTone || 'Professional'}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="font-semibold text-gray-900">Business Type</div>
                    <div className="text-gray-600 capitalize">{businessType || 'General'}</div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSetupComplete(true)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 font-semibold"
                >
                  Complete Setup & Start Using ROMASHKA
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (setupComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Setup Complete! 🎉</h1>
          <p className="text-lg text-gray-600 mb-8">
            ROMASHKA AI agent is now active and handling customer inquiries.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => window.location.href = '/dashboard/conversations'}
              className="p-6 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <UsersIcon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">View Conversations</h3>
              <p className="text-sm text-gray-600 mt-1">Monitor live chats and agent performance</p>
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard/analytics'}
              className="p-6 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <ChartBarIcon className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">Track metrics and optimize responses</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🛠️ STEP-BY-STEP: SETTING UP ROMASHKA AI</h1>
        <p className="text-gray-600 mt-2">
          Set up your AI-powered customer service agent in just a few simple steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                ${step.status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : step.status === 'in_progress'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.status === 'completed' ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  h-1 w-16 mx-2
                  ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-gray-600 mt-1">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Previous
        </button>
        
        <div className="text-sm text-gray-500">
          Step {currentStep} of {steps.length}
        </div>
        
        <button
          onClick={nextStep}
          disabled={
            currentStep === steps.length ||
            (currentStep === 2 && !businessType) ||
            (currentStep === 3 && !websiteUrl && !knowledgeContent) ||
            (currentStep === 4 && (!agentName || !agentTone)) ||
            (currentStep === 6 && humanAgents.some(agent => !agent.name || !agent.email))
          }
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length ? 'Complete Setup' : 'Next'}
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AgentSetupPage;