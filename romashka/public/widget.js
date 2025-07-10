// Romashka Widget - Embeddable Chat Widget
// Version 1.0.0

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.RomashkaWidget && window.RomashkaWidget.initialized) {
    return;
  }

  // Widget configuration and state
  window.RomashkaWidget = window.RomashkaWidget || {};
  
  const widget = {
    initialized: false,
    config: window.RomashkaWidget.config || {},
    isOpen: false,
    messages: [],
    apiUrl: 'https://api.romashka.ai',
    wsUrl: 'wss://ws.romashka.ai',
    sessionId: null,
    conversationId: null,
    socket: null,

    // Default configuration
    defaultConfig: {
      position: 'bottom-right',
      theme: 'light',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      welcomeMessage: 'Hi! How can I help you today?',
      language: 'en',
      showBranding: true,
      customization: {
        borderRadius: 12,
        shadowSize: 'medium',
        animation: 'slide',
        width: 350,
        height: 500,
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        chatBubbleStyle: 'rounded',
        showTypingIndicator: true,
        enableSoundNotifications: false
      },
      behavior: {
        autoOpen: false,
        autoOpenDelay: 5000,
        showOfflineMessage: true,
        offlineMessage: 'We\'re currently offline. Please leave a message.',
        enableEmojis: true,
        enableFileUploads: false
      },
      security: {
        enableSSLOnly: true,
        enableRateLimiting: true,
        maxRequestsPerMinute: 60
      }
    },

    // Initialize the widget
    init: function(userConfig) {
      if (this.initialized) return;
      
      this.config = this.mergeConfig(this.defaultConfig, userConfig || {});
      this.validateConfig();
      this.createWidget();
      this.attachEventListeners();
      this.setupWebSocket();
      
      if (this.config.behavior.autoOpen) {
        setTimeout(() => {
          this.open();
        }, this.config.behavior.autoOpenDelay);
      }

      this.initialized = true;
      this.trackEvent('widget_loaded');
    },

    // Merge configurations
    mergeConfig: function(defaults, user) {
      const merged = JSON.parse(JSON.stringify(defaults));
      
      function deepMerge(target, source) {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = target[key] || {};
            deepMerge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
      
      deepMerge(merged, user);
      return merged;
    },

    // Validate configuration
    validateConfig: function() {
      if (!this.config.projectId) {
        console.error('Romashka Widget: projectId is required');
        return false;
      }
      
      if (!this.config.widgetId) {
        console.error('Romashka Widget: widgetId is required');
        return false;
      }
      
      return true;
    },

    // Create the widget HTML structure
    createWidget: function() {
      // Create container
      const container = document.createElement('div');
      container.id = 'romashka-widget';
      container.className = 'romashka-widget-container';
      
      // Apply position styles
      const position = this.config.position;
      const positionStyles = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' }
      };
      
      const pos = positionStyles[position] || positionStyles['bottom-right'];
      
      container.style.cssText = `
        position: fixed;
        ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
        ${pos.top ? `top: ${pos.top};` : ''}
        ${pos.right ? `right: ${pos.right};` : ''}
        ${pos.left ? `left: ${pos.left};` : ''}
        z-index: 999999;
        font-family: ${this.config.customization.fontFamily};
        font-size: ${this.config.customization.fontSize}px;
        transition: all 0.3s ease;
      `;

      // Create chat button
      const button = this.createChatButton();
      
      // Create chat window
      const chatWindow = this.createChatWindow();
      
      container.appendChild(button);
      container.appendChild(chatWindow);
      
      // Add to page
      document.body.appendChild(container);
      
      // Store references
      this.elements = {
        container,
        button,
        chatWindow,
        messagesContainer: chatWindow.querySelector('.romashka-messages'),
        input: chatWindow.querySelector('.romashka-input'),
        sendButton: chatWindow.querySelector('.romashka-send-button')
      };
      
      // Apply theme
      this.applyTheme();
    },

    // Create chat button
    createChatButton: function() {
      const button = document.createElement('div');
      button.className = 'romashka-chat-button';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      
      button.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        border: none;
        outline: none;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
      });
      
      button.addEventListener('click', () => {
        this.toggle();
      });
      
      return button;
    },

    // Create chat window
    createChatWindow: function() {
      const window = document.createElement('div');
      window.className = 'romashka-chat-window';
      window.style.cssText = `
        width: ${this.config.customization.width}px;
        height: ${this.config.customization.height}px;
        background: white;
        border-radius: ${this.config.customization.borderRadius}px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        position: absolute;
        bottom: 80px;
        right: 0;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      `;
      
      window.innerHTML = `
        <div class="romashka-header" style="
          background: ${this.config.customization.headerBackgroundColor || this.config.primaryColor};
          color: ${this.config.customization.headerTextColor || 'white'};
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Chat Support</div>
            <div style="font-size: 12px; opacity: 0.8;">We're here to help</div>
          </div>
          <button class="romashka-close-button" style="
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            opacity: 0.7;
            transition: opacity 0.2s;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="romashka-messages" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f9fafb;
        ">
          <div class="romashka-welcome-message" style="
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            ${this.config.welcomeMessage}
          </div>
        </div>
        
        <div class="romashka-input-container" style="
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        ">
          <div style="display: flex; gap: 8px;">
            <input type="text" class="romashka-input" placeholder="Type your message..." style="
              flex: 1;
              padding: 12px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              outline: none;
              font-size: 14px;
              font-family: inherit;
            ">
            <button class="romashka-send-button" style="
              background: ${this.config.primaryColor};
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              min-width: 44px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      
      // Add event listeners
      const closeButton = window.querySelector('.romashka-close-button');
      closeButton.addEventListener('click', () => this.close());
      
      const input = window.querySelector('.romashka-input');
      const sendButton = window.querySelector('.romashka-send-button');
      
      const sendMessage = () => {
        const message = input.value.trim();
        if (message) {
          this.sendMessage(message);
          input.value = '';
        }
      };
      
      sendButton.addEventListener('click', sendMessage);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
      
      return window;
    },

    // Apply theme styles
    applyTheme: function() {
      if (this.config.theme === 'dark') {
        this.elements.chatWindow.style.background = '#1f2937';
        this.elements.chatWindow.style.color = '#f9fafb';
      }
    },

    // Toggle widget open/close
    toggle: function() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    // Open widget
    open: function() {
      if (this.isOpen) return;
      
      this.elements.chatWindow.style.display = 'flex';
      this.elements.button.style.display = 'none';
      this.isOpen = true;
      
      // Animation
      if (this.config.customization.animation === 'slide') {
        this.elements.chatWindow.style.transform = 'translateY(20px)';
        this.elements.chatWindow.style.opacity = '0';
        
        setTimeout(() => {
          this.elements.chatWindow.style.transform = 'translateY(0)';
          this.elements.chatWindow.style.opacity = '1';
        }, 10);
      }
      
      this.trackEvent('widget_opened');
      
      // Focus input
      setTimeout(() => {
        this.elements.input.focus();
      }, 300);
    },

    // Close widget
    close: function() {
      if (!this.isOpen) return;
      
      this.elements.chatWindow.style.display = 'none';
      this.elements.button.style.display = 'flex';
      this.isOpen = false;
      
      this.trackEvent('widget_closed');
    },

    // Send message
    sendMessage: function(message) {
      // Add user message to UI
      this.addMessage(message, 'user');
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Send to API
      this.sendToAPI(message)
        .then(response => {
          this.hideTypingIndicator();
          this.addMessage(response.message, 'bot', response);
        })
        .catch(error => {
          this.hideTypingIndicator();
          this.addMessage('Sorry, I\'m having trouble responding right now. Please try again.', 'bot');
          console.error('Romashka Widget Error:', error);
        });
      
      this.trackEvent('message_sent', { message_length: message.length });
    },

    // Add message to chat
    addMessage: function(message, sender, metadata) {
      const messageEl = document.createElement('div');
      messageEl.className = `romashka-message romashka-message-${sender}`;
      
      const isUser = sender === 'user';
      
      messageEl.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        ${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      `;
      
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        max-width: 80%;
        padding: 12px 16px;
        border-radius: ${this.config.customization.chatBubbleStyle === 'bubble' ? '20px' : '8px'};
        background: ${isUser ? this.config.primaryColor : 'white'};
        color: ${isUser ? 'white' : '#374151'};
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        word-wrap: break-word;
        animation: slideIn 0.3s ease;
      `;
      
      bubble.textContent = message;
      messageEl.appendChild(bubble);
      
      // Add metadata for bot messages
      if (!isUser && metadata) {
        const metaEl = document.createElement('div');
        metaEl.style.cssText = `
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          padding-left: 16px;
        `;
        
        const confidence = metadata.confidence ? Math.round(metadata.confidence * 100) : 0;
        metaEl.textContent = `Confidence: ${confidence}%`;
        
        if (metadata.responseTimeMs) {
          metaEl.textContent += ` • ${metadata.responseTimeMs}ms`;
        }
        
        messageEl.appendChild(metaEl);
      }
      
      this.elements.messagesContainer.appendChild(messageEl);
      this.scrollToBottom();
      
      // Store message
      this.messages.push({
        message,
        sender,
        timestamp: new Date().toISOString(),
        metadata
      });
    },

    // Show typing indicator
    showTypingIndicator: function() {
      if (!this.config.customization.showTypingIndicator) return;
      
      const indicator = document.createElement('div');
      indicator.className = 'romashka-typing-indicator';
      indicator.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        justify-content: flex-start;
      `;
      
      indicator.innerHTML = `
        <div style="
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="font-size: 12px; color: #6b7280;">Typing</span>
          <div style="display: flex; gap: 2px;">
            <div style="width: 4px; height: 4px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out;"></div>
            <div style="width: 4px; height: 4px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.16s;"></div>
            <div style="width: 4px; height: 4px; background: #6b7280; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out 0.32s;"></div>
          </div>
        </div>
      `;
      
      this.elements.messagesContainer.appendChild(indicator);
      this.scrollToBottom();
    },

    // Hide typing indicator
    hideTypingIndicator: function() {
      const indicator = this.elements.messagesContainer.querySelector('.romashka-typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    },

    // Scroll to bottom
    scrollToBottom: function() {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    },

    // Send message to API
    sendToAPI: function(message) {
      const payload = {
        message,
        conversationId: this.conversationId,
        sessionId: this.sessionId,
        projectId: this.config.projectId,
        widgetId: this.config.widgetId
      };
      
      return fetch(`${this.apiUrl}/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || ''}`
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Update conversation/session IDs
        if (data.conversationId) this.conversationId = data.conversationId;
        if (data.sessionId) this.sessionId = data.sessionId;
        
        return data;
      });
    },

    // Setup WebSocket connection
    setupWebSocket: function() {
      if (!this.config.enableRealtime) return;
      
      try {
        this.socket = new WebSocket(`${this.wsUrl}/widget`);
        
        this.socket.onopen = () => {
          console.log('Romashka Widget: WebSocket connected');
          this.socket.send(JSON.stringify({
            type: 'auth',
            projectId: this.config.projectId,
            widgetId: this.config.widgetId
          }));
        };
        
        this.socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        };
        
        this.socket.onclose = () => {
          console.log('Romashka Widget: WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => this.setupWebSocket(), 5000);
        };
        
        this.socket.onerror = (error) => {
          console.error('Romashka Widget: WebSocket error', error);
        };
      } catch (error) {
        console.error('Romashka Widget: Failed to setup WebSocket', error);
      }
    },

    // Handle WebSocket messages
    handleWebSocketMessage: function(data) {
      switch (data.type) {
        case 'agent_message':
          this.addMessage(data.message, 'agent', data.metadata);
          break;
        case 'agent_typing':
          this.showTypingIndicator();
          break;
        case 'agent_stopped_typing':
          this.hideTypingIndicator();
          break;
        case 'conversation_ended':
          this.addMessage('The conversation has ended. Thank you!', 'system');
          break;
      }
    },

    // Track events
    trackEvent: function(event, data) {
      if (!this.config.analytics || !this.config.analytics.enableTracking) return;
      
      const payload = {
        event,
        data: data || {},
        timestamp: new Date().toISOString(),
        projectId: this.config.projectId,
        widgetId: this.config.widgetId,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      // Send to analytics endpoint
      fetch(`${this.apiUrl}/v1/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(error => {
        console.warn('Romashka Widget: Analytics tracking failed', error);
      });
    },

    // Destroy widget
    destroy: function() {
      if (this.elements && this.elements.container) {
        this.elements.container.remove();
      }
      
      if (this.socket) {
        this.socket.close();
      }
      
      this.initialized = false;
      this.isOpen = false;
      this.messages = [];
      this.sessionId = null;
      this.conversationId = null;
      
      this.trackEvent('widget_destroyed');
    }
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
    
    .romashka-widget-container * {
      box-sizing: border-box;
    }
    
    .romashka-chat-window {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .romashka-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    .romashka-messages::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    
    .romashka-messages::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    .romashka-messages::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    .romashka-input:focus {
      border-color: ${window.RomashkaWidget.config?.primaryColor || '#3B82F6'} !important;
      box-shadow: 0 0 0 3px ${window.RomashkaWidget.config?.primaryColor || '#3B82F6'}20 !important;
    }
    
    .romashka-send-button:hover {
      opacity: 0.9;
    }
    
    .romashka-close-button:hover {
      opacity: 1 !important;
      background: rgba(255,255,255,0.1) !important;
    }
  `;
  document.head.appendChild(style);

  // Expose widget to global scope
  window.RomashkaWidget = Object.assign(window.RomashkaWidget, widget);

  // Auto-initialize if config is available
  if (window.RomashkaWidget.config && Object.keys(window.RomashkaWidget.config).length > 0) {
    widget.init(window.RomashkaWidget.config);
  }

})();