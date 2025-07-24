interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

interface SlackResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: any;
  error?: string;
}

class SlackService {
  private initialized = false;
  private webhookUrl: string | null = null;
  private botToken: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.botToken = process.env.SLACK_BOT_TOKEN || null;

    if (!this.webhookUrl && !this.botToken) {
      console.warn('Slack webhook URL or bot token not found. Slack functionality will be disabled.');
      return;
    }

    this.initialized = true;
  }

  async sendSlackNotification(channel: string, message: string, options?: Partial<SlackMessage>): Promise<SlackResponse> {
    if (!this.initialized) {
      throw new Error('Slack service not initialized. Please check your Slack configuration.');
    }

    const slackMessage: SlackMessage = {
      channel,
      text: message,
      username: 'ROMASHKA Workflow Bot',
      icon_emoji: ':robot_face:',
      ...options
    };

    try {
      if (this.botToken) {
        return await this.sendViaAPI(slackMessage);
      } else if (this.webhookUrl) {
        return await this.sendViaWebhook(slackMessage);
      } else {
        throw new Error('No Slack configuration available');
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  private async sendViaAPI(message: SlackMessage): Promise<SlackResponse> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result;
  }

  private async sendViaWebhook(message: SlackMessage): Promise<SlackResponse> {
    if (!this.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.statusText}`);
    }

    return {
      ok: true,
      channel: message.channel,
      ts: Date.now().toString(),
      message: message
    };
  }

  // Pre-defined Slack message templates for workflow scenarios
  async sendEscalationAlert(
    channel: string,
    customerInfo: any,
    issueDetails: any,
    assignedAgent?: string
  ): Promise<SlackResponse> {
    const urgencyColor = this.getUrgencyColor(issueDetails.priority);
    
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Customer Escalation Alert'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Customer:* ${customerInfo.name || 'Unknown'}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${customerInfo.email || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${issueDetails.priority || 'Medium'}`
          },
          {
            type: 'mrkdwn',
            text: `*Tier:* ${customerInfo.tier || 'N/A'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Issue:* ${issueDetails.description || 'No description provided'}`
        }
      }
    ];

    if (issueDetails.sentiment_score) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Sentiment Score:* ${issueDetails.sentiment_score} ${this.getSentimentEmoji(issueDetails.sentiment_score)}`
        }
      });
    }

    if (assignedAgent) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Assigned to:* <@${assignedAgent}>`
        }
      });
    }

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Customer Profile'
          },
          style: 'primary',
          url: `${process.env.FRONTEND_URL}/customers/${customerInfo.id}`
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Join Conversation'
          },
          url: `${process.env.FRONTEND_URL}/conversations/${issueDetails.conversation_id}`
        }
      ]
    });

    return this.sendSlackNotification(channel, '', {
      blocks,
      attachments: [{
        color: urgencyColor,
        footer: 'ROMASHKA Workflow Engine',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  async sendWorkflowStatusUpdate(
    channel: string,
    workflowName: string,
    status: 'completed' | 'failed' | 'started',
    details: any
  ): Promise<SlackResponse> {
    const statusEmoji = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '🚀';
    const statusColor = status === 'completed' ? 'good' : status === 'failed' ? 'danger' : '#439FE0';

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${statusEmoji} *Workflow ${status.toUpperCase()}*\n*${workflowName}*`
        }
      }
    ];

    if (details.execution_time) {
      blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Execution Time:* ${details.execution_time}ms`
          },
          {
            type: 'mrkdwn',
            text: `*Steps Completed:* ${details.steps_completed || 0}`
          }
        ]
      });
    }

    if (details.error && status === 'failed') {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:* \`${details.error}\``
        }
      });
    }

    if (details.customer_affected) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Customer:* ${details.customer_affected.name} (${details.customer_affected.email})`
        }
      });
    }

    return this.sendSlackNotification(channel, '', {
      blocks,
      attachments: [{
        color: statusColor,
        footer: 'ROMASHKA Workflow Engine',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  async sendDailyWorkflowSummary(
    channel: string,
    summaryData: {
      total_executions: number;
      successful_executions: number;
      failed_executions: number;
      top_workflows: Array<{ name: string; executions: number }>;
      top_errors: Array<{ error: string; count: number }>;
    }
  ): Promise<SlackResponse> {
    const successRate = summaryData.total_executions > 0 
      ? ((summaryData.successful_executions / summaryData.total_executions) * 100).toFixed(1)
      : '0';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Daily Workflow Summary'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Executions:* ${summaryData.total_executions}`
          },
          {
            type: 'mrkdwn',
            text: `*Success Rate:* ${successRate}%`
          },
          {
            type: 'mrkdwn',
            text: `*Successful:* ${summaryData.successful_executions}`
          },
          {
            type: 'mrkdwn',
            text: `*Failed:* ${summaryData.failed_executions}`
          }
        ]
      }
    ];

    if (summaryData.top_workflows.length > 0) {
      const workflowList = summaryData.top_workflows
        .map(w => `• ${w.name}: ${w.executions} executions`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Top Workflows:*\n${workflowList}`
        }
      });
    }

    if (summaryData.top_errors.length > 0) {
      const errorList = summaryData.top_errors
        .map(e => `• ${e.error}: ${e.count} occurrences`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Common Errors:*\n${errorList}`
        }
      });
    }

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Full Analytics'
          },
          style: 'primary',
          url: `${process.env.FRONTEND_URL}/analytics/workflows`
        }
      ]
    });

    return this.sendSlackNotification(channel, '', {
      blocks,
      attachments: [{
        color: summaryData.failed_executions > 0 ? 'warning' : 'good',
        footer: 'ROMASHKA Workflow Engine',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  async sendOrderUpdateNotification(
    channel: string,
    orderInfo: any,
    updateType: 'delay' | 'shipped' | 'delivered' | 'cancelled'
  ): Promise<SlackResponse> {
    const typeEmoji = {
      delay: '⏰',
      shipped: '📦',
      delivered: '✅',
      cancelled: '❌'
    };

    const typeColor = {
      delay: 'warning',
      shipped: '#439FE0',
      delivered: 'good',
      cancelled: 'danger'
    };

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${typeEmoji[updateType]} *Order ${updateType.toUpperCase()}*\nOrder #${orderInfo.order_id}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Customer:* ${orderInfo.customer_name}`
          },
          {
            type: 'mrkdwn',
            text: `*Value:* $${orderInfo.order_value}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:* ${orderInfo.status}`
          },
          {
            type: 'mrkdwn',
            text: `*Date:* ${new Date().toLocaleDateString()}`
          }
        ]
      }
    ];

    if (orderInfo.message) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:* ${orderInfo.message}`
        }
      });
    }

    return this.sendSlackNotification(channel, '', {
      blocks,
      attachments: [{
        color: typeColor[updateType],
        footer: 'ROMASHKA Workflow Engine',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  async sendCustomAlert(
    channel: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    actions?: Array<{ text: string; url: string; style?: 'primary' | 'danger' }>
  ): Promise<SlackResponse> {
    const priorityEmoji = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔥',
      critical: '🚨'
    };

    const priorityColor = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff6b6b',
      critical: '#d32f2f'
    };

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${priorityEmoji[priority]} *${title}*\n${message}`
        }
      }
    ];

    if (actions && actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text
          },
          url: action.url,
          style: action.style
        }))
      });
    }

    return this.sendSlackNotification(channel, '', {
      blocks,
      attachments: [{
        color: priorityColor[priority],
        footer: 'ROMASHKA Workflow Engine',
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  }

  // Utility methods
  private getUrgencyColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'good';
      default:
        return '#439FE0';
    }
  }

  private getSentimentEmoji(score: number): string {
    if (score >= 0.5) return '😊';
    if (score >= 0) return '😐';
    if (score >= -0.5) return '😟';
    return '😡';
  }

  // Method to send threaded replies
  async sendThreadReply(
    channel: string,
    threadTs: string,
    message: string
  ): Promise<SlackResponse> {
    return this.sendSlackNotification(channel, message, {
      thread_ts: threadTs
    });
  }

  // Method to update a message (requires bot token)
  async updateMessage(
    channel: string,
    messageTs: string,
    newText: string,
    blocks?: any[]
  ): Promise<SlackResponse> {
    if (!this.botToken) {
      throw new Error('Bot token required for message updates');
    }

    const response = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        ts: messageTs,
        text: newText,
        blocks
      })
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result;
  }

  // Method to get channel info
  async getChannelInfo(channel: string): Promise<any> {
    if (!this.botToken) {
      throw new Error('Bot token required for channel info');
    }

    const response = await fetch(`https://slack.com/api/conversations.info?channel=${channel}`, {
      headers: {
        'Authorization': `Bearer ${this.botToken}`
      }
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result.channel;
  }
}

// Export singleton instance
const slackService = new SlackService();

// Export main functions for workflow engine
export const sendSlackNotification = (channel: string, message: string, options?: any) =>
  slackService.sendSlackNotification(channel, message, options);

export const sendEscalationAlert = (channel: string, customerInfo: any, issueDetails: any, assignedAgent?: string) =>
  slackService.sendEscalationAlert(channel, customerInfo, issueDetails, assignedAgent);

export const sendWorkflowStatusUpdate = (channel: string, workflowName: string, status: 'completed' | 'failed' | 'started', details: any) =>
  slackService.sendWorkflowStatusUpdate(channel, workflowName, status, details);

export const sendDailyWorkflowSummary = (channel: string, summaryData: any) =>
  slackService.sendDailyWorkflowSummary(channel, summaryData);

export const sendOrderUpdateNotification = (channel: string, orderInfo: any, updateType: 'delay' | 'shipped' | 'delivered' | 'cancelled') =>
  slackService.sendOrderUpdateNotification(channel, orderInfo, updateType);

export const sendCustomAlert = (channel: string, title: string, message: string, priority?: 'low' | 'medium' | 'high' | 'critical', actions?: any[]) =>
  slackService.sendCustomAlert(channel, title, message, priority, actions);

export default slackService;