// ROMASHKA AI Chat Widget
// Version 1.0.0

(function() {
  'use strict';

  // Check if widget is already loaded
  if (window.RomashkaWidget) {
    return;
  }

  // Widget configuration
  const config = window.RomashkaConfig || {};
  const widget = config.widget || {};

  // Default configuration
  const defaultConfig = {
    apiUrl: 'https://romashkaai.vercel.app',
    widget: {
      primaryColor: '#3B82F6',
      position: 'bottom-right',
      greeting: 'Hello! How can I help you today?',
      placeholder: 'Type your message...',
      showAvatar: true,
      enableSounds: true,
      widgetTitle: 'Chat Support',
      personality: {
        formality: 50,
        enthusiasm: 50,
        technical_depth: 50,
        empathy: 50
      },
      style: 'conversational'
    }
  };

  // Merge configurations
  const finalConfig = {
    ...defaultConfig,
    ...config,
    widget: {
      ...defaultConfig.widget,
      ...widget
    }
  };

  // Widget state
  let isOpen = false;
  let isMinimized = false;
  let conversationHistory = [];

  // Create widget HTML
  function createWidgetHTML() {
    return `
      <div id="romashka-widget" style="
        position: fixed;
        ${finalConfig.widget.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${finalConfig.widget.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      ">
        <!-- Chat Button -->
        <div id="romashka-button" style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${finalConfig.widget.primaryColor};
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        <!-- Chat Window -->
        <div id="romashka-chat" style="
          position: absolute;
          ${finalConfig.widget.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
          ${finalConfig.widget.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            background: ${finalConfig.widget.primaryColor};
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${finalConfig.widget.showAvatar ? `<div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7V9C15 11.7 12.8 14 10 14V16L21 16V14C21 11.3 18.7 9 16 9H21Z"/>
                </svg>
              </div>` : ''}
              <div>
                <div style="font-weight: 600; font-size: 14px;">${finalConfig.widget.widgetTitle}</div>
                <div style="font-size: 12px; opacity: 0.9;">Online</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="romashka-minimize" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.8;
              " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button id="romashka-close" style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.8;
              " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div id="romashka-messages" style="
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8f9fa;
          ">
            <div style="
              background: white;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 12px;
              border-left: 3px solid ${finalConfig.widget.primaryColor};
            ">
              ${finalConfig.widget.greeting}
            </div>
          </div>

          <!-- Input Area -->
          <div style="
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
          ">
            <div style="display: flex; gap: 8px;">
              <input 
                id="romashka-input" 
                type="text" 
                placeholder="${finalConfig.widget.placeholder}"
                style="
                  flex: 1;
                  padding: 8px 12px;
                  border: 1px solid #e5e7eb;
                  border-radius: 20px;
                  outline: none;
                  font-size: 14px;
                "
              />
              <button id="romashka-send" style="
                background: ${finalConfig.widget.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Add message to chat
  function addMessage(message, isUser = false) {
    const messagesContainer = document.getElementById('romashka-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      ${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      ${isUser 
        ? `background: ${finalConfig.widget.primaryColor}; color: white; border-bottom-right-radius: 4px;`
        : 'background: white; color: #374151; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'
      }
    `;
    messageBubble.textContent = message;

    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store in conversation history
    conversationHistory.push({ message, isUser, timestamp: new Date() });
  }

  // Send message to API
  async function sendMessage(message) {
    try {
      // Add user message
      addMessage(message, true);

      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.id = 'typing-indicator';
      typingDiv.style.cssText = `
        margin-bottom: 12px;
        padding: 8px 12px;
        background: white;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
        max-width: 80%;
        font-size: 14px;
        color: #6b7280;
      `;
      typingDiv.innerHTML = 'Typing<span style="animation: typing 1.5s infinite;">...</span>';
      
      const messagesContainer = document.getElementById('romashka-messages');
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Get real API response using scanned data
      const response = await getRealAPIResponse(message);

      // Remove typing indicator
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }

      // Add AI response
      addMessage(response, false);

      if (finalConfig.widget.enableSounds) {
        playNotificationSound();
      }

    } catch (error) {
      console.error('ROMASHKA Widget: Error sending message:', error);
      
      // Remove typing indicator
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
      
      addMessage('Sorry, I encountered an error. Please try again.', false);
    }
  }

  // Initialize Supabase client for widget
  function createSupabaseClient() {
    // Use the same Supabase config as the main app
    const supabaseUrl = 'https://ztcnqxswlbevqmuzudpw.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Y25xeHN3bGJldnFtdXp1ZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NzQ4MTEsImV4cCI6MjA0NzQ1MDgxMX0.iKw3LBnXaEd_9Q2yyE5H3gj1FHV-LnTPDbcIjZYmqAE';
    
    // Create a simple Supabase client without importing the full library
    return {
      from: function(table) {
        return {
          select: function(columns = '*') {
            const query = {
              table,
              columns,
              filters: []
            };
            
            return {
              eq: function(column, value) {
                query.filters.push({ type: 'eq', column, value });
                return this;
              },
              order: function(column, options = {}) {
                query.order = { column, ...options };
                return this;
              },
              limit: function(count) {
                query.limit = count;
                return this;
              },
              execute: async function() {
                try {
                  let url = `${supabaseUrl}/rest/v1/${table}`;
                  const params = new URLSearchParams();
                  
                  if (query.columns !== '*') {
                    params.append('select', query.columns);
                  }
                  
                  query.filters.forEach(filter => {
                    if (filter.type === 'eq') {
                      params.append(filter.column, `eq.${filter.value}`);
                    }
                  });
                  
                  if (query.order) {
                    params.append('order', `${query.order.column}.${query.order.ascending === false ? 'desc' : 'asc'}`);
                  }
                  
                  if (query.limit) {
                    params.append('limit', query.limit.toString());
                  }
                  
                  if (params.toString()) {
                    url += '?' + params.toString();
                  }
                  
                  console.log('🔍 Widget: Querying Supabase:', url);
                  
                  const response = await fetch(url, {
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                  }
                  
                  const data = await response.json();
                  return { data, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              }
            };
          }
        };
      }
    };
  }

  // Get real FAQ data from scanned content
  async function getRealFAQData() {
    try {
      console.log('🔍 Widget: Fetching real FAQ data from database...');
      
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('extracted_content')
        .select('url, title, content, content_type')
        .eq('content_type', 'faq')
        .order('created_at', { ascending: false })
        .limit(10)
        .execute();
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Widget: Found ${data?.length || 0} FAQ entries`);
      return data || [];
    } catch (error) {
      console.warn('⚠️ Widget: Failed to fetch real FAQ data:', error);
      return [];
    }
  }

  // Extract Q&A pairs from FAQ content
  function extractQAPairs(content) {
    const pairs = [];
    
    // Split content into lines and look for questions (ending with ?)
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line looks like a question
      if (line.includes('?') && line.length > 10 && line.length < 200) {
        const question = line;
        
        // Look for the answer in the next few lines
        let answer = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          
          // Stop if we hit another question
          if (nextLine.includes('?') && nextLine.length > 10) break;
          
          // Add this line to the answer
          if (nextLine.length > 10) {
            answer += (answer ? ' ' : '') + nextLine;
          }
        }
        
        if (answer.length > 10) {
          pairs.push({ question, answer });
        }
      }
    }
    
    console.log(`📝 Widget: Extracted ${pairs.length} Q&A pairs from FAQ content`);
    return pairs;
  }

  // Find matching FAQ answer for user message
  function findFAQMatch(message, faqData) {
    console.log(`🔍 Widget: Searching for FAQ match for: "${message}"`);
    
    const lowerMessage = message.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    for (const faqEntry of faqData) {
      if (faqEntry.content_type === 'faq' && faqEntry.content) {
        const qaPairs = extractQAPairs(faqEntry.content);
        
        for (const qa of qaPairs) {
          const questionWords = qa.question.toLowerCase().split(' ');
          const messageWords = lowerMessage.split(' ');
          
          // Calculate similarity score
          let matches = 0;
          for (const word of questionWords) {
            if (word.length > 3 && messageWords.includes(word)) {
              matches++;
            }
          }
          
          const score = matches / Math.max(questionWords.length, messageWords.length);
          
          if (score > bestScore && score > 0.2) { // Minimum 20% match
            bestMatch = qa;
            bestScore = score;
          }
        }
      }
    }
    
    if (bestMatch) {
      console.log(`✅ Widget: Found FAQ match (${(bestScore * 100).toFixed(1)}% confidence):`, bestMatch.question);
      return bestMatch.answer;
    }
    
    console.log('❌ Widget: No FAQ match found');
    return null;
  }

  // Real API response using scanned data
  async function getRealAPIResponse(message) {
    try {
      // Get real FAQ data
      const faqData = await getRealFAQData();
      
      if (faqData.length > 0) {
        // Try to find a matching FAQ answer
        const faqAnswer = findFAQMatch(message, faqData);
        
        if (faqAnswer) {
          // Adjust answer based on personality
          return adjustResponseForPersonality(faqAnswer, finalConfig.widget.personality);
        }
      }
      
      // Fall back to personality-based response if no FAQ match
      return generatePersonalityResponse(message, finalConfig.widget.personality);
      
    } catch (error) {
      console.error('Widget: Error getting real API response:', error);
      return generatePersonalityResponse(message, finalConfig.widget.personality);
    }
  }

  // Adjust response based on personality settings
  function adjustResponseForPersonality(response, personality) {
    let adjustedResponse = response;
    
    // Formality adjustment
    if (personality.formality <= 30) {
      adjustedResponse = adjustedResponse.replace(/I am/g, 'I\'m').replace(/I will/g, 'I\'ll');
      adjustedResponse = adjustedResponse.replace(/\./g, '!');
    } else if (personality.formality >= 80) {
      adjustedResponse = adjustedResponse.replace(/I'm/g, 'I am').replace(/I'll/g, 'I will');
      adjustedResponse += ' Please let me know if you need any additional assistance.';
    }
    
    // Enthusiasm adjustment
    if (personality.enthusiasm >= 70) {
      adjustedResponse = adjustedResponse.replace(/\./g, '!');
      adjustedResponse = adjustedResponse.replace(/help/g, 'love to help');
    } else if (personality.enthusiasm <= 30) {
      adjustedResponse = adjustedResponse.replace(/!/g, '.');
    }
    
    // Empathy adjustment
    if (personality.empathy >= 70) {
      adjustedResponse = 'I understand this is important to you. ' + adjustedResponse;
    }
    
    return adjustedResponse;
  }

  // Generate personality-based fallback response
  function generatePersonalityResponse(message, personality) {
    const lowerMessage = message.toLowerCase();
    let response = '';

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      if (personality.formality > 70) {
        response = 'Our pricing structure varies based on your specific requirements. I would be pleased to provide you with detailed information tailored to your needs.';
      } else {
        response = 'Great question! Our pricing is super flexible based on what you need. Let me help you find the perfect plan! 😊';
      }
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      if (personality.formality > 70) {
        response = 'Good day! I am here to assist you with any inquiries you may have. How may I be of service?';
      } else {
        response = 'Hey there! 👋 I\'m so glad you\'re here! How can I help make your day awesome?';
      }
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      if (personality.empathy > 70) {
        response = 'I understand you need assistance, and I\'m here to help you through this. What specific challenge can I help you overcome?';
      } else {
        response = 'I can help you with that. What do you need assistance with?';
      }
    } else if (lowerMessage.includes('wedding') || lowerMessage.includes('bride') || lowerMessage.includes('groom')) {
      response = 'How exciting! Weddings are such special occasions! 💕 I\'d love to help you with your wedding planning needs. What can I assist you with?';
    } else {
      // Default response based on personality
      if (personality.formality > 70) {
        response = 'Thank you for your inquiry. I am processing your request and will provide you with the most appropriate assistance.';
      } else if (personality.enthusiasm > 70) {
        response = 'That\'s an awesome question! I\'m excited to help you out! Let me get you the perfect answer! ✨';
      } else {
        response = 'Thanks for reaching out! I\'m here to help. Could you tell me a bit more about what you\'re looking for?';
      }
    }

    return response;
  }

  // Play notification sound
  function playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+HyvmsiC06h4PFyXxM=');
      audio.volume = 0.1;
      audio.play().catch(() => {}); // Ignore errors if sound fails
    } catch (error) {
      // Ignore sound errors
    }
  }

  // Toggle widget
  function toggleWidget() {
    const chatWindow = document.getElementById('romashka-chat');
    const button = document.getElementById('romashka-button');
    
    if (isOpen) {
      chatWindow.style.display = 'none';
      isOpen = false;
    } else {
      chatWindow.style.display = 'flex';
      isOpen = true;
      // Focus input when opened
      setTimeout(() => {
        const input = document.getElementById('romashka-input');
        if (input) input.focus();
      }, 100);
    }
  }

  // Initialize widget
  function initWidget() {
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = createWidgetHTML();
    document.body.appendChild(widgetContainer);

    // Add event listeners
    const button = document.getElementById('romashka-button');
    const closeBtn = document.getElementById('romashka-close');
    const minimizeBtn = document.getElementById('romashka-minimize');
    const sendBtn = document.getElementById('romashka-send');
    const input = document.getElementById('romashka-input');

    if (button) {
      button.addEventListener('click', toggleWidget);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', toggleWidget);
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', toggleWidget);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const message = input.value.trim();
        if (message) {
          sendMessage(message);
          input.value = '';
        }
      });
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const message = input.value.trim();
          if (message) {
            sendMessage(message);
            input.value = '';
          }
        }
      });
    }

    // Add typing animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes typing {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    console.log('ROMASHKA Widget initialized successfully');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose widget API
  window.RomashkaWidget = {
    config: finalConfig,
    toggle: toggleWidget,
    sendMessage: sendMessage,
    conversationHistory: () => conversationHistory,
    version: '1.0.0'
  };

})();