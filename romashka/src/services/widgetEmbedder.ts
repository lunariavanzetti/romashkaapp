export interface WidgetConfig {
  projectId: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  title: string;
  subtitle: string;
  welcomeMessage: string;
  showBranding: boolean;
  autoOpen: boolean;
  zIndex: number;
}

export interface EmbedCode {
  html: string;
  css: string;
  js: string;
  fullCode: string;
}

export class WidgetEmbedder {
  private static readonly BASE_URL = 'https://romashka.ai';
  private static readonly WIDGET_VERSION = '1.0.0';

  static generateEmbedCode(config: WidgetConfig): EmbedCode {
    const widgetId = `romashka-widget-${config.projectId}`;
    const positionClasses = this.getPositionClasses(config.position);
    
    const html = this.generateHTML(widgetId, config);
    const css = this.generateCSS(widgetId, config, positionClasses);
    const js = this.generateJS(widgetId, config);
    const fullCode = this.generateFullCode(html, css, js);

    return {
      html,
      css,
      js,
      fullCode
    };
  }

  private static generateHTML(widgetId: string, config: WidgetConfig): string {
    return `
<!-- ROMASHKA AI Chat Widget -->
<div id="${widgetId}" class="romashka-widget-container">
  <!-- Widget Toggle Button -->
  <button class="romashka-widget-toggle" id="${widgetId}-toggle">
    <svg class="romashka-widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  </button>

  <!-- Widget Window -->
  <div class="romashka-widget-window" id="${widgetId}-window">
    <!-- Header -->
    <div class="romashka-widget-header">
      <div class="romashka-widget-header-content">
        <div class="romashka-widget-status">
          <span class="romashka-widget-status-dot"></span>
          <span class="romashka-widget-status-text">Online</span>
        </div>
        <h3 class="romashka-widget-title">${config.title}</h3>
        <p class="romashka-widget-subtitle">${config.subtitle}</p>
      </div>
      <button class="romashka-widget-close" id="${widgetId}-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Messages Container -->
    <div class="romashka-widget-messages" id="${widgetId}-messages">
      <div class="romashka-widget-welcome">
        <div class="romashka-widget-welcome-icon">🤖</div>
        <p class="romashka-widget-welcome-text">${config.welcomeMessage}</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="romashka-widget-input-area">
      <div class="romashka-widget-input-container">
        <input 
          type="text" 
          class="romashka-widget-input" 
          id="${widgetId}-input"
          placeholder="Type your message..."
        />
        <button class="romashka-widget-send" id="${widgetId}-send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>`;
  }

  private static generateCSS(widgetId: string, config: WidgetConfig, positionClasses: string): string {
    const primaryColor = config.primaryColor || '#ec4899';
    const secondaryColor = config.secondaryColor || '#8b5cf6';
    
    return `
/* ROMASHKA AI Chat Widget Styles */
#${widgetId} {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: ${config.zIndex || 999999};
}

.romashka-widget-container {
  position: fixed;
  ${positionClasses}
}

.romashka-widget-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.romashka-widget-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.romashka-widget-icon {
  width: 24px;
  height: 24px;
}

.romashka-widget-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: none;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.romashka-widget-window.active {
  display: flex;
}

.romashka-widget-header {
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.romashka-widget-header-content {
  flex: 1;
}

.romashka-widget-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.romashka-widget-status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.romashka-widget-status-text {
  font-size: 12px;
  opacity: 0.9;
}

.romashka-widget-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.romashka-widget-subtitle {
  font-size: 12px;
  opacity: 0.9;
  margin: 0;
}

.romashka-widget-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.romashka-widget-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.romashka-widget-close svg {
  width: 16px;
  height: 16px;
}

.romashka-widget-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8fafc;
}

.romashka-widget-welcome {
  text-align: center;
  padding: 20px 0;
}

.romashka-widget-welcome-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.romashka-widget-welcome-text {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.romashka-widget-message {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-end;
}

.romashka-widget-message.user {
  justify-content: flex-end;
}

.romashka-widget-message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}

.romashka-widget-message.user .romashka-widget-message-content {
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: white;
}

.romashka-widget-message.bot .romashka-widget-message-content {
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.romashka-widget-input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.romashka-widget-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.romashka-widget-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.romashka-widget-input:focus {
  border-color: ${primaryColor};
}

.romashka-widget-send {
  width: 32px;
  height: 32px;
  border: none;
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.romashka-widget-send:hover {
  transform: scale(1.1);
}

.romashka-widget-send svg {
  width: 16px;
  height: 16px;
}

.romashka-widget-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 480px) {
  .romashka-widget-window {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    bottom: 80px;
    right: 16px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .romashka-widget-window {
    background: #1f2937;
    border-color: #374151;
  }
  
  .romashka-widget-messages {
    background: #111827;
  }
  
  .romashka-widget-message.bot .romashka-widget-message-content {
    background: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }
  
  .romashka-widget-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .romashka-widget-input-area {
    background: #1f2937;
    border-color: #374151;
  }
}`;
  }

  private static generateJS(widgetId: string, config: WidgetConfig): string {
    return `
// ROMASHKA AI Chat Widget JavaScript
(function() {
  'use strict';
  
  const widget = {
    id: '${widgetId}',
    config: ${JSON.stringify(config)},
    isOpen: false,
    messages: [],
    isTyping: false,
    
    init() {
      this.bindEvents();
      this.setupCrossOriginMessaging();
      ${config.autoOpen ? 'this.open();' : ''}
    },
    
    bindEvents() {
      const toggle = document.getElementById(this.id + '-toggle');
      const close = document.getElementById(this.id + '-close');
      const input = document.getElementById(this.id + '-input');
      const send = document.getElementById(this.id + '-send');
      
      toggle.addEventListener('click', () => this.toggle());
      close.addEventListener('click', () => this.close());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      send.addEventListener('click', () => this.sendMessage());
    },
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open() {
      const window = document.getElementById(this.id + '-window');
      window.classList.add('active');
      this.isOpen = true;
      this.focusInput();
      this.postMessage('widget_opened');
    },
    
    close() {
      const window = document.getElementById(this.id + '-window');
      window.classList.remove('active');
      this.isOpen = false;
      this.postMessage('widget_closed');
    },
    
    focusInput() {
      const input = document.getElementById(this.id + '-input');
      input.focus();
    },
    
    sendMessage() {
      const input = document.getElementById(this.id + '-input');
      const message = input.value.trim();
      
      if (!message || this.isTyping) return;
      
      this.addMessage(message, 'user');
      input.value = '';
      
      this.postMessage('message_sent', { message });
      this.simulateTyping();
    },
    
    addMessage(content, sender) {
      const messagesContainer = document.getElementById(this.id + '-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = \`romashka-widget-message \${sender}\`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'romashka-widget-message-content';
      contentDiv.textContent = content;
      
      messageDiv.appendChild(contentDiv);
      messagesContainer.appendChild(messageDiv);
      
      this.scrollToBottom();
      this.messages.push({ content, sender, timestamp: new Date() });
    },
    
    addBotMessage(content) {
      this.addMessage(content, 'bot');
    },
    
    simulateTyping() {
      this.isTyping = true;
      const sendButton = document.getElementById(this.id + '-send');
      sendButton.disabled = true;
      
      // Simulate AI response (in production, this would be a real API call)
      setTimeout(() => {
        this.addBotMessage('Thank you for your message! I\\'m here to help. How can I assist you today?');
        this.isTyping = false;
        sendButton.disabled = false;
        this.focusInput();
      }, 1000 + Math.random() * 2000);
    },
    
    scrollToBottom() {
      const messagesContainer = document.getElementById(this.id + '-messages');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    setupCrossOriginMessaging() {
      window.addEventListener('message', (event) => {
        if (event.origin !== '${this.BASE_URL}') return;
        
        const { type, data } = event.data;
        
        switch (type) {
          case 'open_widget':
            this.open();
            break;
          case 'close_widget':
            this.close();
            break;
          case 'send_message':
            if (data && data.message) {
              this.addMessage(data.message, 'user');
              this.simulateTyping();
            }
            break;
        }
      });
    },
    
    postMessage(type, data = {}) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'romashka_widget',
          widgetId: this.id,
          action: type,
          data
        }, '*');
      }
    },
    
    // Public API methods
    openWidget() { this.open(); },
    closeWidget() { this.close(); },
    sendMessageToWidget(message) { 
      this.addMessage(message, 'user');
      this.simulateTyping();
    }
  };
  
  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => widget.init());
  } else {
    widget.init();
  }
  
  // Expose widget API globally
  window.RomashkaWidget = widget;
})();`;
  }

  private static generateFullCode(html: string, css: string, js: string): string {
    return `<!-- ROMASHKA AI Chat Widget -->
<!-- Copy and paste this code into your website -->
<style>
${css}
</style>

${html}

<script>
${js}
</script>`;
  }

  private static getPositionClasses(position: string): string {
    switch (position) {
      case 'bottom-left':
        return 'bottom: 24px; left: 24px;';
      case 'top-right':
        return 'top: 24px; right: 24px;';
      case 'top-left':
        return 'top: 24px; left: 24px;';
      case 'bottom-right':
      default:
        return 'bottom: 24px; right: 24px;';
    }
  }

  static generateCustomizationCode(config: WidgetConfig): string {
    return `
// Customize your ROMASHKA widget
window.RomashkaWidgetConfig = {
  projectId: '${config.projectId}',
  position: '${config.position}',
  theme: '${config.theme}',
  primaryColor: '${config.primaryColor}',
  secondaryColor: '${config.secondaryColor}',
  title: '${config.title}',
  subtitle: '${config.subtitle}',
  welcomeMessage: '${config.welcomeMessage}',
  showBranding: ${config.showBranding},
  autoOpen: ${config.autoOpen},
  zIndex: ${config.zIndex}
};

// Example usage:
// window.RomashkaWidget.openWidget();
// window.RomashkaWidget.sendMessageToWidget('Hello!');
// window.RomashkaWidget.closeWidget();`;
  }

  static validateConfig(config: WidgetConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.projectId) {
      errors.push('Project ID is required');
    }

    if (!['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.position)) {
      errors.push('Invalid position. Must be one of: bottom-right, bottom-left, top-right, top-left');
    }

    if (!['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Invalid theme. Must be one of: light, dark, auto');
    }

    if (!config.primaryColor || !/^#[0-9A-F]{6}$/i.test(config.primaryColor)) {
      errors.push('Primary color must be a valid hex color (e.g., #ec4899)');
    }

    if (!config.secondaryColor || !/^#[0-9A-F]{6}$/i.test(config.secondaryColor)) {
      errors.push('Secondary color must be a valid hex color (e.g., #8b5cf6)');
    }

    if (!config.title || config.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!config.subtitle || config.subtitle.trim().length === 0) {
      errors.push('Subtitle is required');
    }

    if (!config.welcomeMessage || config.welcomeMessage.trim().length === 0) {
      errors.push('Welcome message is required');
    }

    if (config.zIndex && (config.zIndex < 1 || config.zIndex > 999999)) {
      errors.push('Z-index must be between 1 and 999999');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const widgetEmbedder = new WidgetEmbedder(); 