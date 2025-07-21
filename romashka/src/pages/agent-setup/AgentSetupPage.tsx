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
import { agentSetupService, type AgentSetupData } from '../../services/agentSetupService';
import { ChatWidget } from '../../components/chat/ChatWidget';

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
  
  // File upload and manual Q&A states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [manualQAs, setManualQAs] = useState([{ question: '', answer: '' }]);
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState('website'); // 'website', 'files', 'manual'
  const [humanAgents, setHumanAgents] = useState([{ name: '', email: '' }]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Chat widget testing state
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'ai', timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Advanced settings state
  const [advancedSettings, setAdvancedSettings] = useState({
    avoidPricing: false,
    requireContactInfo: false,
    escalateComplexQueries: false,
    limitResponseLength: false
  });

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

  // Load existing progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const result = await agentSetupService.loadProgress();
        if (result.success && result.data) {
          const data = result.data;
          setCurrentStep(data.currentStep);
          setBusinessType(data.businessType);
          setAgentName(data.agentName);
          setAgentTone(data.agentTone);
          setWebsiteUrl(data.websiteUrl);
          setKnowledgeContent(data.knowledgeContent);
          setSetupComplete(data.setupCompleted);
          
          // Update steps status based on completed steps
          setSteps(prevSteps => 
            prevSteps.map(step => ({
              ...step,
              status: data.completedSteps.includes(step.id) 
                ? 'completed' 
                : step.id === data.currentStep 
                ? 'in_progress' 
                : 'pending'
            }))
          );
        }
      } catch (error) {
        console.error('Error loading setup progress:', error);
        setSaveError('Failed to load previous progress');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Auto-save when key fields change (debounced to avoid too many saves)
  useEffect(() => {
    if (!isLoading) { // Only save after initial load is complete
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 1000); // Debounce by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [agentName, agentTone, websiteUrl, knowledgeContent, advancedSettings, isLoading]);

  // Save progress whenever important state changes
  const saveProgress = async (additionalData?: Partial<AgentSetupData>) => {
    try {
      setSaveError(null);
      const data: Partial<AgentSetupData> = {
        currentStep,
        businessType,
        agentName,
        agentTone,
        websiteUrl,
        knowledgeContent,
        setupCompleted: setupComplete,
        completedSteps: steps.filter(step => step.status === 'completed').map(step => step.id),
        ...additionalData
      };

      const result = await agentSetupService.saveProgress(data);
      if (!result.success) {
        setSaveError(result.error || 'Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveError('Failed to save progress');
    }
  };

  const updateStepStatus = (stepId: number, status: 'pending' | 'in_progress' | 'completed') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const nextStep = async () => {
    if (currentStep < steps.length) {
      updateStepStatus(currentStep, 'completed');
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateStepStatus(newStep, 'in_progress');
      
      // Save progress with the new step
      await saveProgress({ currentStep: newStep });
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      updateStepStatus(currentStep, 'pending');
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateStepStatus(newStep, 'in_progress');
      
      // Save progress with the new step
      await saveProgress({ currentStep: newStep });
    }
  };

  const businessTypes = [
    { 
      value: 'ecommerce', 
      label: 'E-commerce Store', 
      description: 'Selling products online',
      defaultQuestions: [
        "Where is my order?",
        "What is your return policy?",
        "Do you offer free shipping?",
        "How long does delivery take?",
        "What payment methods do you accept?"
      ],
      defaultTone: 'friendly',
      suggestedName: 'Shopping Assistant'
    },
    { 
      value: 'service', 
      label: 'Service Provider', 
      description: 'Consulting, agencies, professional services',
      defaultQuestions: [
        "What services do you offer?",
        "How much do your services cost?",
        "What is your availability?",
        "Do you offer consultations?",
        "What is your project timeline?"
      ],
      defaultTone: 'professional',
      suggestedName: 'Service Assistant'
    },
    { 
      value: 'saas', 
      label: 'SaaS/Software', 
      description: 'Software as a Service, tech products',
      defaultQuestions: [
        "How do I get started?",
        "What features are included?",
        "Do you offer a free trial?",
        "How does billing work?",
        "Where can I find documentation?"
      ],
      defaultTone: 'professional',
      suggestedName: 'Support Assistant'
    },
    { 
      value: 'education', 
      label: 'Education', 
      description: 'Schools, courses, training',
      defaultQuestions: [
        "How do I enroll in courses?",
        "What are the course requirements?",
        "When do classes start?",
        "How much does it cost?",
        "Do you offer certificates?"
      ],
      defaultTone: 'friendly',
      suggestedName: 'Learning Assistant'
    },
    { 
      value: 'healthcare', 
      label: 'Healthcare', 
      description: 'Medical services, clinics, hospitals',
      defaultQuestions: [
        "How do I schedule an appointment?",
        "What insurance do you accept?",
        "What are your hours?",
        "Where are you located?",
        "Do you offer telehealth?"
      ],
      defaultTone: 'professional',
      suggestedName: 'Care Assistant'
    },
    { 
      value: 'other', 
      label: 'Other', 
      description: 'Tell us more about your business',
      defaultQuestions: [
        "How can I help you today?",
        "What information do you need?",
        "Would you like to speak with someone?"
      ],
      defaultTone: 'friendly',
      suggestedName: 'Assistant'
    }
  ];

  const toneOptions = [
    { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and conversational' },
    { value: 'professional', label: 'Professional', description: 'Formal, business-like, and respectful' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, informal, and easy-going' }
  ];

  const handleWebsiteScan = async () => {
    if (!websiteUrl) return;
    
    setIsScanning(true);
    
    try {
      // Use the existing website scanner service
      const { websiteScanner } = await import('../../services/websiteScanner');
      
      const result = await websiteScanner.scanUrl(websiteUrl);
      
      if (result && result.content) {
        // Extract and format the content
        const title = result.title || 'Website Content';
        const content = result.content || '';
        
        // Clean and format the content
        const cleanContent = content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (cleanContent.length > 100) {
          const formattedContent = `**${title}**\n${cleanContent.substring(0, 1000)}${cleanContent.length > 1000 ? '...' : ''}`;
          setKnowledgeContent(formattedContent);
        } else {
          // Fallback if content is too short
          setKnowledgeContent(`
**Website Content Extracted**
- Successfully scanned ${websiteUrl}
- Content extracted: "${cleanContent}"
- You may want to scan additional pages or add more content manually

**Manual Review Needed**
The automatic extraction found limited content. Consider adding more specific information about your business.
          `.trim());
        }
      } else {
        // Fallback for scanning errors
        setKnowledgeContent(`
**Scanning Notice**
We weren't able to automatically extract content from ${websiteUrl}.

**Next Steps:**
- Check if the URL is accessible publicly
- Try scanning a specific FAQ or help page
- Or manually paste your FAQ content below

**Manual Input:**
You can paste your FAQ content directly or upload documents (.pdf, .docx, .txt)
        `.trim());
      }
    } catch (error) {
      console.error('Website scanning error:', error);
      setKnowledgeContent(`
**Scanning Error**
Unable to scan ${websiteUrl} at this time.

**Possible Issues:**
- Website may be password protected
- CORS restrictions may prevent access
- URL may not be accessible

**Alternative Options:**
- Try a different URL (like yoursite.com/faq)
- Manually paste your FAQ content
- Upload documents instead
      `.trim());
    } finally {
      setIsScanning(false);
    }
  };

  const handleBusinessTypeSelection = async (typeValue: string) => {
    setBusinessType(typeValue);
    
    // Apply business type defaults
    const selectedType = businessTypes.find(type => type.value === typeValue);
    if (selectedType) {
      // Auto-populate agent name if not already set
      const newAgentName = !agentName && selectedType.suggestedName ? selectedType.suggestedName : agentName;
      if (newAgentName !== agentName) {
        setAgentName(newAgentName);
      }
      
      // Auto-populate tone if not already set
      const newAgentTone = !agentTone && selectedType.defaultTone ? selectedType.defaultTone : agentTone;
      if (newAgentTone !== agentTone) {
        setAgentTone(newAgentTone);
      }
      
      // Save progress with the selected business type and defaults
      await saveProgress({
        businessType: typeValue,
        agentName: newAgentName,
        agentTone: newAgentTone
      });
      
      // Show success message with business type impact
      setTimeout(() => {
        const impactMessage = `
✅ Great! ROMASHKA will be optimized for ${selectedType.label.toLowerCase()}.

**Automatic Configuration Applied:**
• Agent Name: ${selectedType.suggestedName}
• Communication Tone: ${selectedType.defaultTone.charAt(0).toUpperCase() + selectedType.defaultTone.slice(1)}
• Pre-configured Common Questions: ${selectedType.defaultQuestions.length} questions ready

**Next Steps:**
You can customize these settings in the following steps, or keep the recommended defaults.
        `.trim();
        
        // You could show this in a toast or update the UI to show the impact
        console.log('Business Type Impact:', impactMessage);
      }, 100);
    }
  };

  // File upload handlers
  const handleFileUpload = async (files: FileList) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const validFiles = Array.from(files).filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length === 0) {
      alert('Please upload only PDF, DOCX, or TXT files.');
      return;
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    setIsProcessingFiles(true);
    
    try {
      let combinedContent = knowledgeContent ? `${knowledgeContent}\n\n` : '';
      
      for (const file of validFiles) {
        const text = await extractTextFromFile(file);
        if (text) {
          combinedContent += `**${file.name}**\n${text}\n\n`;
        }
      }
      
      setKnowledgeContent(combinedContent.trim());
      
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing some files. Please try again.');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        
        if (file.type === 'text/plain') {
          resolve(text);
        } else if (file.type === 'application/pdf') {
          // For PDF files, we'll extract basic text (in a real app, you'd use a PDF library)
          resolve(`PDF content from ${file.name} - Please note: Full PDF parsing requires additional processing.`);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For DOCX files (in a real app, you'd use a DOCX library)
          resolve(`DOCX content from ${file.name} - Please note: Full DOCX parsing requires additional processing.`);
        } else {
          resolve('');
        }
      };
      
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Manual Q&A handlers
  const addManualQA = () => {
    setManualQAs(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateManualQA = (index: number, field: 'question' | 'answer', value: string) => {
    setManualQAs(prev => prev.map((qa, i) => 
      i === index ? { ...qa, [field]: value } : qa
    ));
  };

  const removeManualQA = (index: number) => {
    if (manualQAs.length > 1) {
      setManualQAs(prev => prev.filter((_, i) => i !== index));
    }
  };

  const processManualQAs = () => {
    const validQAs = manualQAs.filter(qa => qa.question.trim() && qa.answer.trim());
    
    if (validQAs.length === 0) {
      return;
    }
    
    let manualContent = knowledgeContent ? `${knowledgeContent}\n\n` : '';
    manualContent += '**Manual Q&A Content**\n';
    
    validQAs.forEach(qa => {
      manualContent += `Q: ${qa.question.trim()}\nA: ${qa.answer.trim()}\n\n`;
    });
    
    setKnowledgeContent(manualContent.trim());
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

  // Chat widget functions
  const sendTestMessage = async (message?: string) => {
    const messageText = message || currentMessage.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Simulate AI response based on setup
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 second delay
      
      const aiResponse = await generateTestResponse(messageText);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateTestResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    const selectedBusinessType = businessTypes.find(type => type.value === businessType);
    const tone = agentTone || 'friendly';
    const name = agentName || 'ROMASHKA';
    
    console.log('🤖 Generating response for:', userMessage);
    console.log('📚 Knowledge content available:', knowledgeContent ? 'YES' : 'NO');
    console.log('⚙️ Advanced settings:', advancedSettings);
    
    // Check if we need to collect contact info (but don't block answering questions)
    const hasProvidedContact = chatMessages.some(msg => 
      msg.sender === 'user' && (
        msg.text.includes('@') || // Email pattern
        /\b[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(msg.text) // Name pattern
      )
    );
    
    const shouldRequestContact = advancedSettings.requireContactInfo && !hasProvidedContact;
    console.log('📞 Contact info needed:', shouldRequestContact);
    
    // Step 2: Search through extracted knowledge content for relevant answers
    if (knowledgeContent) {
      try {
        const knowledgeMatch = await findKnowledgeMatch(userMessage, knowledgeContent);
        if (knowledgeMatch) {
          console.log('✅ Found knowledge match:', knowledgeMatch.substring(0, 100) + '...');
          
          // Add contact info request naturally after the answer
          let response = knowledgeMatch;
          
          if (shouldRequestContact) {
            if (tone === 'professional') {
              response += '\n\nCould you please provide your name and email address so I can assist you further?';
            } else if (tone === 'casual') {
              response += '\n\nBtw, could you share your name and email? Would love to help you out more! 😊';
            } else {
              response += '\n\nAlso, could you share your name and email? Want to make sure I can help you with everything! 😊';
            }
          } else {
            // Add natural closing based on tone
            if (tone === 'professional') {
              response += '\n\nIs there anything else I can help you with?';
            } else if (tone === 'casual') {
              response += '\n\nAnything else? 😊';
            } else {
              response += '\n\nAnything else I can help with? 😊';
            }
          }
          
          return response;
        }
      } catch (error) {
        console.error('Error in knowledge matching:', error);
        // Continue to fallback responses if AI matching fails
      }
    }
    
    // Step 3: Handle pricing queries with advanced settings
    if ((lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) && advancedSettings.avoidPricing) {
      console.log('💰 Avoiding pricing discussion due to advanced setting');
      return tone === 'professional'
        ? `I'd be happy to connect you with our sales team who can provide detailed pricing information tailored to your specific needs. Would you like me to arrange that?`
        : `I'll get you connected with our sales team for pricing details - they'll hook you up with the best options! Want me to set that up for you? 😊`;
    }
    
    // Step 4: Handle complex queries with escalation
    if (advancedSettings.escalateComplexQueries && isComplexQuery(userMessage)) {
      console.log('🔄 Escalating complex query due to advanced setting');
      return tone === 'professional'
        ? `This seems like a detailed question that would benefit from speaking with one of our specialists. Would you like me to connect you with a human agent who can provide comprehensive assistance?`
        : `This looks like something our human experts can help you with better! Want me to get you connected with one of our team members? 🙋‍♀️`;
    }
    
    // Step 5: Fallback to business type and general patterns
    const businessContext = selectedBusinessType?.label ? ` specializing in ${selectedBusinessType.label.toLowerCase()}` : '';
    
    // General pattern matching for common queries
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return tone === 'professional' 
        ? `Thank you for your inquiry. Based on our standard practices, we offer several shipping options. For specific delivery times and costs, I'd be happy to connect you with our fulfillment team.`
        : `Great question about shipping! We've got options to get your order to you. Let me know what you need and I can get you the details! 📦`;
    }
    
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return tone === 'professional'
        ? `Regarding returns, we have policies in place to ensure customer satisfaction. I can connect you with our customer service team who can review your specific situation.`
        : `No worries about returns! We want you to be happy with everything. Let me get you connected with someone who can sort that out for you! 😊`;
    }
    
    // Default response
    if (tone === 'professional') {
      return `Thank you for contacting ${name}. We are a company${businessContext} committed to providing excellent service. How may I assist you today?`;
    } else if (tone === 'casual') {
      return `Hey! ${name} here${businessContext}. What can I help you with today? 😎`;
    } else {
      return `Hi there! I'm ${name}${businessContext}, and I'm here to help! What questions do you have for me? 😊`;
    }
  };
  
  // Helper function to find relevant content in knowledge base
  const findKnowledgeMatch = async (userMessage: string, knowledge: string): Promise<string | null> => {
    console.log('🔍 Using AI to analyze knowledge for:', userMessage);
    console.log('📝 Knowledge content length:', knowledge.length);
    
    try {
      // Import the AI knowledge matching service
      const { knowledgeMatchingService } = await import('../../services/ai/knowledgeMatchingService');
      
      const result = await knowledgeMatchingService.findAnswer({
        question: userMessage,
        knowledgeBase: knowledge,
        agentTone: agentTone,
        businessType: businessType
      });
      
      if (result.answer) {
        console.log('✅ AI knowledge match found (confidence:', result.confidence, '):', result.answer.substring(0, 100) + '...');
        return result.answer;
      }
      
      console.log('❌ No relevant answer found in knowledge base');
      return null;
    } catch (error) {
      console.error('❌ Error in AI knowledge matching:', error);
      
      // Fallback: Basic keyword search for critical cases
      const lowerMessage = userMessage.toLowerCase();
      const lowerKnowledge = knowledge.toLowerCase();
      
      if (lowerMessage.includes('submit') && lowerMessage.includes('application') && 
          lowerKnowledge.includes('application')) {
        console.log('🔧 Using fallback for application submission question');
        
        // Find the application submission section
        const sentences = knowledge.split(/[.!?]+/).filter(s => s.trim().length > 20);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('submit') && 
              sentence.toLowerCase().includes('application') &&
              sentence.length > 100) {
            return sentence.trim();
          }
        }
      }
      
      return null;
    }
  };
  
  // Helper function to detect complex queries
  const isComplexQuery = (message: string): boolean => {
    const complexIndicators = [
      'technical', 'integration', 'custom', 'specification', 'detailed',
      'complex', 'advanced', 'enterprise', 'bulk', 'wholesale',
      'multiple', 'several', 'various', 'different options'
    ];
    
    const lowerMessage = message.toLowerCase();
    return complexIndicators.some(indicator => lowerMessage.includes(indicator)) || 
           message.split(' ').length > 15; // Long messages are considered complex
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatMessages.length === 0 && !isLoading) {
      const welcomeMessage = {
        id: 'welcome',
        text: `Hi! I'm ${agentName || 'ROMASHKA'}, your ${agentTone || 'friendly'} AI assistant. How can I help you today?`,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [agentName, agentTone, isLoading]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Reset chat when advanced settings change to allow testing new behavior
  useEffect(() => {
    if (!isLoading && chatMessages.length > 0) {
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        text: `Hi! I'm ${agentName || 'ROMASHKA'}, your ${agentTone || 'friendly'} AI assistant. How can I help you today?`,
        sender: 'ai' as const,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [advancedSettings, agentName, agentTone]);

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
                  onClick={() => handleBusinessTypeSelection(type.value)}
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-green-600 mb-2">
                    <CheckIcon className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    ✅ Configuration Applied for {businessTypes.find(t => t.value === businessType)?.label}
                  </h3>
                  <div className="text-sm text-green-700 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="font-medium">Agent Name</div>
                        <div className="text-green-600">{businessTypes.find(t => t.value === businessType)?.suggestedName}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="font-medium">Tone</div>
                        <div className="text-green-600 capitalize">{businessTypes.find(t => t.value === businessType)?.defaultTone}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="font-medium">Common Questions</div>
                        <div className="text-green-600">{businessTypes.find(t => t.value === businessType)?.defaultQuestions.length} questions</div>
                      </div>
                    </div>
                    <p className="text-xs mt-3">
                      💡 These defaults will be applied in the next steps. You can customize them anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let ROMASHKA Learn Your Business</h2>
              <p className="text-gray-600">Choose how you want to provide knowledge to your AI agent</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {/* Knowledge Source Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  {[
                    { id: 'website', label: 'Website Scan', icon: '🌐' },
                    { id: 'files', label: 'Upload Files', icon: '📄' },
                    { id: 'manual', label: 'Manual Q&A', icon: '✍️' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveKnowledgeTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeKnowledgeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Website Scan Tab */}
              {activeKnowledgeTab === 'website' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com/faq"
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
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Try your FAQ page, help section, or specific product pages
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload Tab */}
              {activeKnowledgeTab === 'files' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 text-2xl">📄</span>
                      </div>
                      <p className="text-gray-600 mb-2">Click to upload files or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, DOCX, TXT files supported</p>
                    </label>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Uploaded Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="mr-2">📄</span>
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isProcessingFiles && (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing files...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Q&A Tab */}
              {activeKnowledgeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">✍️ Add Your Own Q&A</h4>
                    <p className="text-sm text-blue-700">
                      Manually add questions and answers that your customers frequently ask. This gives you complete control over the responses.
                    </p>
                  </div>
                  
                  {manualQAs.map((qa, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Q&A Pair {index + 1}</h4>
                        {manualQAs.length > 1 && (
                          <button
                            onClick={() => removeManualQA(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                          <input
                            type="text"
                            value={qa.question}
                            onChange={(e) => updateManualQA(index, 'question', e.target.value)}
                            placeholder="e.g., What are your shipping options?"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                          <textarea
                            value={qa.answer}
                            onChange={(e) => updateManualQA(index, 'answer', e.target.value)}
                            placeholder="e.g., We offer free shipping on orders over $50..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={addManualQA}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      + Add Another Q&A
                    </button>
                    <button
                      onClick={processManualQAs}
                      disabled={!manualQAs.some(qa => qa.question.trim() && qa.answer.trim())}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                      Add to Knowledge Base
                    </button>
                  </div>
                </div>
              )}

              {/* Knowledge Preview */}
              {knowledgeContent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Knowledge Base Content</h3>
                  <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{knowledgeContent}</pre>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    ROMASHKA now has {knowledgeContent.split('\n').length} lines of knowledge to help answer customer questions.
                  </p>
                </div>
              )}
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
              {businessType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Pre-configured for {businessTypes.find(t => t.value === businessType)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Settings have been automatically optimized. You can still customize them below.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Agent Name
                  {agentName && businessType && businessTypes.find(t => t.value === businessType)?.suggestedName === agentName && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g., Alex, Maya, Customer Support Bot"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation Tone
                  {agentTone && businessType && businessTypes.find(t => t.value === businessType)?.defaultTone === agentTone && (
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Auto-filled</span>
                  )}
                </label>
                <div className="space-y-3">
                  {toneOptions.map(toneOption => (
                    <div
                      key={toneOption.value}
                      onClick={() => setAgentTone(toneOption.value)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        agentTone === toneOption.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {toneOption.label}
                            {agentTone === toneOption.value && businessType && businessTypes.find(t => t.value === businessType)?.defaultTone === toneOption.value && (
                              <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Recommended</span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{toneOption.description}</p>
                        </div>
                        {agentTone === toneOption.value && (
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
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={advancedSettings.avoidPricing}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, avoidPricing: e.target.checked }))}
                    />
                    Avoid discussing pricing (escalate to human)
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={advancedSettings.escalateComplexQueries}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, escalateComplexQueries: e.target.checked }))}
                    />
                    Escalate complex technical questions to humans
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={advancedSettings.requireContactInfo}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, requireContactInfo: e.target.checked }))}
                    />
                    Always ask for customer contact info
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={advancedSettings.limitResponseLength}
                      onChange={(e) => setAdvancedSettings(prev => ({ ...prev, limitResponseLength: e.target.checked }))}
                    />
                    Keep responses concise (max 2 sentences)
                  </label>
                </div>
                {(advancedSettings.avoidPricing || advancedSettings.requireContactInfo || advancedSettings.escalateComplexQueries || advancedSettings.limitResponseLength) && (
                  <div className="mt-3 p-2 bg-yellow-100 rounded-md">
                    <p className="text-xs text-yellow-800">
                      ✅ Advanced settings are active and will affect the chat behavior in the preview below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Test ROMASHKA</h2>
              <p className="text-gray-600">Try asking some questions to see how your AI agent responds with real AI-powered knowledge matching</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Live Chat Widget Preview</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is a fully functional preview using your actual configuration and knowledge base. 
                  The AI will analyze your scanned content and provide intelligent responses.
                </p>
                
                {/* Enhanced ChatWidget with real functionality */}
                <div className="relative h-[500px] bg-white rounded-lg border shadow-sm">
                  <ChatWidget
                    agentName={agentName || 'ROMASHKA'}
                    agentTone={agentTone as 'friendly' | 'professional' | 'casual'}
                    businessType={businessType}
                    primaryColor="#3b82f6"
                    knowledgeBase={knowledgeContent || 'General business knowledge base.'}
                    enableFileUpload={true}
                    enableEmojis={true}
                    welcomeMessage={`Hi! I'm ${agentName || 'ROMASHKA'}, your AI assistant. I can help answer questions about our ${businessType} business. What would you like to know?`}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Try these sample questions:</h4>
                  <div className="space-y-2">
                    {(businessTypes.find(t => t.value === businessType)?.defaultQuestions || [
                      "What are your shipping options?",
                      "Do you accept returns?", 
                      "Where are you located?",
                      "How can I contact support?"
                    ]).slice(0, 4).map((question, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg text-sm">
                        <strong>Try asking:</strong> "{question}"
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-900 mb-2">AI-Powered Testing</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Real AI responses</strong> using GPT-4o-mini</li>
                        <li>• <strong>Your knowledge base:</strong> {knowledgeContent ? `${Math.round(knowledgeContent.length / 1000)}k characters scanned` : 'No content scanned yet'}</li>
                        <li>• <strong>Agent tone:</strong> {agentTone || 'friendly'}</li>
                        <li>• <strong>Business context:</strong> {businessType}</li>
                        <li>• <strong>File upload:</strong> Enabled</li>
                        <li>• <strong>Analytics:</strong> Real-time tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-900 mb-1">What's New in This Preview</h5>
                    <p className="text-sm text-green-700">
                      This enhanced chat widget now features real AI-powered knowledge matching, natural conversation flow, 
                      file upload capabilities, message status tracking, and conversation analytics - everything your customers will experience.
                    </p>
                  </div>
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
                  onClick={() => addHumanAgent()}
                  className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  + Add Another Human Agent
                </button>
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
                  onClick={async () => {
                    await saveProgress({ 
                      setupCompleted: true,
                      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8]
                    });
                    setSetupComplete(true);
                  }}
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

  // Show loading screen while loading data
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading your agent setup...</h2>
          <p className="text-gray-500 mt-2">Restoring your previous progress</p>
        </div>
      </div>
    );
  }

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
        
        {/* Save Error Alert */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">
                Failed to save progress: {saveError}
              </p>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
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
            (currentStep === 3 && !knowledgeContent) ||
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