import type { 
  WorkflowTemplate, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowTrigger,
  WorkflowAction,
  WorkflowCondition 
} from '../../types/workflow';

// Customer Complaint Escalation Workflow
export const customerComplaintEscalationTemplate: WorkflowTemplate = {
  id: 'customer-complaint-escalation',
  name: 'Customer Complaint Escalation',
  description: 'Automatically escalate customer complaints based on sentiment analysis and customer tier',
  category: 'customer_service',
  tags: ['escalation', 'sentiment', 'complaints', 'support'],
  complexity_level: 'intermediate',
  trigger_type: 'chat_message',
  default_config: {
    sentiment_threshold: -0.7,
    keywords: ['refund', 'cancel', 'terrible', 'awful', 'worst', 'hate'],
    premium_tier_only: true
  },
  use_cases: [
    'Automatically detect negative customer sentiment',
    'Escalate premium customer complaints immediately',
    'Notify managers of critical issues',
    'Send apology emails to affected customers'
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        label: 'Chat Message Received',
        inputs: [],
        outputs: ['sentiment-check']
      }
    },
    {
      id: 'sentiment-check',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: {
        label: 'Check Sentiment Score',
        condition: 'sentiment_score < -0.7',
        trueNodeId: 'tier-check',
        falseNodeId: 'end'
      }
    },
    {
      id: 'tier-check',
      type: 'condition',
      position: { x: 500, y: 100 },
      data: {
        label: 'Check Customer Tier',
        condition: 'customer.tier === "premium"',
        trueNodeId: 'escalate-immediate',
        falseNodeId: 'keyword-check'
      }
    },
    {
      id: 'keyword-check',
      type: 'condition',
      position: { x: 500, y: 250 },
      data: {
        label: 'Check Keywords',
        condition: 'message contains escalation keywords',
        trueNodeId: 'escalate-immediate',
        falseNodeId: 'end'
      }
    },
    {
      id: 'escalate-immediate',
      type: 'action',
      position: { x: 700, y: 100 },
      data: {
        label: 'Escalate to Human Agent',
        action: 'escalate_to_human',
        nextNodeId: 'create-hubspot-ticket'
      }
    },
    {
      id: 'create-hubspot-ticket',
      type: 'action',
      position: { x: 900, y: 100 },
      data: {
        label: 'Create HubSpot Ticket',
        action: 'hubspot_create_ticket',
        nextNodeId: 'notify-manager'
      }
    },
    {
      id: 'notify-manager',
      type: 'action',
      position: { x: 1100, y: 100 },
      data: {
        label: 'Notify Manager via Slack',
        action: 'send_slack',
        nextNodeId: 'send-apology-email'
      }
    },
    {
      id: 'send-apology-email',
      type: 'action',
      position: { x: 1300, y: 100 },
      data: {
        label: 'Send Apology Email',
        action: 'send_email',
        nextNodeId: 'end'
      }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1500, y: 100 },
      data: {
        label: 'Workflow Complete',
        inputs: ['send-apology-email', 'sentiment-check', 'keyword-check']
      }
    }
  ],
  connections: [
    { id: 'c1', source: 'start', target: 'sentiment-check' },
    { id: 'c2', source: 'sentiment-check', target: 'tier-check', label: 'Negative' },
    { id: 'c3', source: 'sentiment-check', target: 'end', label: 'Positive/Neutral' },
    { id: 'c4', source: 'tier-check', target: 'escalate-immediate', label: 'Premium' },
    { id: 'c5', source: 'tier-check', target: 'keyword-check', label: 'Standard' },
    { id: 'c6', source: 'keyword-check', target: 'escalate-immediate', label: 'Keywords Found' },
    { id: 'c7', source: 'keyword-check', target: 'end', label: 'No Keywords' },
    { id: 'c8', source: 'escalate-immediate', target: 'create-hubspot-ticket' },
    { id: 'c9', source: 'create-hubspot-ticket', target: 'notify-manager' },
    { id: 'c10', source: 'notify-manager', target: 'send-apology-email' },
    { id: 'c11', source: 'send-apology-email', target: 'end' }
  ],
  thumbnail: '/templates/complaint-escalation.png'
};

// Order Delay Notification Workflow
export const orderDelayNotificationTemplate: WorkflowTemplate = {
  id: 'order-delay-notification',
  name: 'Order Delay Notification',
  description: 'Automatically notify customers about order delays and offer compensation',
  category: 'customer_service',
  tags: ['orders', 'notifications', 'delays', 'compensation'],
  complexity_level: 'beginner',
  trigger_type: 'integration_change',
  default_config: {
    min_order_value: 500,
    compensation_percentage: 10,
    notification_channels: ['email', 'sms', 'chat']
  },
  use_cases: [
    'Proactively notify customers of order delays',
    'Offer automatic compensation for high-value orders',
    'Update CRM with customer interactions',
    'Schedule follow-up reminders'
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        label: 'Order Status Changed to Delayed',
        inputs: [],
        outputs: ['order-value-check']
      }
    },
    {
      id: 'order-value-check',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: {
        label: 'Check Order Value',
        condition: 'order.value > 500',
        trueNodeId: 'chat-session-check',
        falseNodeId: 'send-email-only'
      }
    },
    {
      id: 'chat-session-check',
      type: 'condition',
      position: { x: 500, y: 100 },
      data: {
        label: 'Customer Has Active Chat?',
        condition: 'customer.has_active_chat === true',
        trueNodeId: 'send-chat-message',
        falseNodeId: 'send-email-notification'
      }
    },
    {
      id: 'send-chat-message',
      type: 'action',
      position: { x: 700, y: 100 },
      data: {
        label: 'Send Proactive Chat Message',
        action: 'send_chat_message',
        nextNodeId: 'offer-compensation'
      }
    },
    {
      id: 'send-email-notification',
      type: 'action',
      position: { x: 700, y: 200 },
      data: {
        label: 'Send Email Notification',
        action: 'send_email',
        nextNodeId: 'offer-compensation'
      }
    },
    {
      id: 'send-email-only',
      type: 'action',
      position: { x: 500, y: 300 },
      data: {
        label: 'Send Basic Email',
        action: 'send_email',
        nextNodeId: 'update-hubspot'
      }
    },
    {
      id: 'offer-compensation',
      type: 'action',
      position: { x: 900, y: 150 },
      data: {
        label: 'Generate Discount Code',
        action: 'shopify_create_discount',
        nextNodeId: 'update-hubspot'
      }
    },
    {
      id: 'update-hubspot',
      type: 'action',
      position: { x: 1100, y: 200 },
      data: {
        label: 'Update HubSpot Contact',
        action: 'hubspot_update_contact',
        nextNodeId: 'schedule-followup'
      }
    },
    {
      id: 'schedule-followup',
      type: 'action',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Schedule 24h Follow-up',
        action: 'schedule_follow_up',
        nextNodeId: 'end'
      }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1500, y: 200 },
      data: {
        label: 'Workflow Complete',
        inputs: ['schedule-followup']
      }
    }
  ],
  connections: [
    { id: 'c1', source: 'start', target: 'order-value-check' },
    { id: 'c2', source: 'order-value-check', target: 'chat-session-check', label: '>$500' },
    { id: 'c3', source: 'order-value-check', target: 'send-email-only', label: '<$500' },
    { id: 'c4', source: 'chat-session-check', target: 'send-chat-message', label: 'Active Chat' },
    { id: 'c5', source: 'chat-session-check', target: 'send-email-notification', label: 'No Chat' },
    { id: 'c6', source: 'send-chat-message', target: 'offer-compensation' },
    { id: 'c7', source: 'send-email-notification', target: 'offer-compensation' },
    { id: 'c8', source: 'send-email-only', target: 'update-hubspot' },
    { id: 'c9', source: 'offer-compensation', target: 'update-hubspot' },
    { id: 'c10', source: 'update-hubspot', target: 'schedule-followup' },
    { id: 'c11', source: 'schedule-followup', target: 'end' }
  ],
  thumbnail: '/templates/order-delay.png'
};

// Sales Opportunity Follow-up Workflow
export const salesFollowUpTemplate: WorkflowTemplate = {
  id: 'sales-opportunity-followup',
  name: 'Sales Opportunity Follow-up',
  description: 'Automatically follow up on sales opportunities based on deal stage and value',
  category: 'sales_automation',
  tags: ['sales', 'follow-up', 'opportunities', 'automation'],
  complexity_level: 'advanced',
  trigger_type: 'integration_change',
  default_config: {
    follow_up_delay_days: 3,
    min_deal_value: 10000,
    email_sequence_count: 3,
    manager_notification_threshold: 50000
  },
  use_cases: [
    'Automatic follow-up on high-value deals',
    'Create tasks in Salesforce for sales reps',
    'Send personalized email sequences',
    'Notify managers of large opportunities'
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        label: 'Deal Stage Changed to "Proposal Sent"',
        inputs: [],
        outputs: ['time-check']
      }
    },
    {
      id: 'time-check',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: {
        label: 'Check Time Since Last Contact',
        condition: 'days_since_last_contact >= 3',
        trueNodeId: 'deal-value-check',
        falseNodeId: 'end'
      }
    },
    {
      id: 'deal-value-check',
      type: 'condition',
      position: { x: 500, y: 100 },
      data: {
        label: 'Check Deal Value',
        condition: 'deal.value > 10000',
        trueNodeId: 'high-value-check',
        falseNodeId: 'standard-followup'
      }
    },
    {
      id: 'high-value-check',
      type: 'condition',
      position: { x: 700, y: 100 },
      data: {
        label: 'High Value Deal?',
        condition: 'deal.value > 50000',
        trueNodeId: 'notify-manager',
        falseNodeId: 'create-salesforce-task'
      }
    },
    {
      id: 'notify-manager',
      type: 'action',
      position: { x: 900, y: 50 },
      data: {
        label: 'Notify Sales Manager',
        action: 'send_slack',
        nextNodeId: 'create-salesforce-task'
      }
    },
    {
      id: 'create-salesforce-task',
      type: 'action',
      position: { x: 900, y: 150 },
      data: {
        label: 'Create Salesforce Follow-up Task',
        action: 'salesforce_create_task',
        nextNodeId: 'send-email-sequence'
      }
    },
    {
      id: 'standard-followup',
      type: 'action',
      position: { x: 700, y: 250 },
      data: {
        label: 'Send Standard Follow-up Email',
        action: 'send_email',
        nextNodeId: 'schedule-reminder'
      }
    },
    {
      id: 'send-email-sequence',
      type: 'action',
      position: { x: 1100, y: 150 },
      data: {
        label: 'Send Automated Email Sequence',
        action: 'send_email',
        nextNodeId: 'update-crm'
      }
    },
    {
      id: 'schedule-reminder',
      type: 'action',
      position: { x: 900, y: 250 },
      data: {
        label: 'Schedule CRM Reminder',
        action: 'salesforce_create_task',
        nextNodeId: 'end'
      }
    },
    {
      id: 'update-crm',
      type: 'action',
      position: { x: 1300, y: 150 },
      data: {
        label: 'Update CRM with Activity',
        action: 'salesforce_update_opportunity',
        nextNodeId: 'end'
      }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1500, y: 150 },
      data: {
        label: 'Workflow Complete',
        inputs: ['update-crm', 'schedule-reminder', 'time-check']
      }
    }
  ],
  connections: [
    { id: 'c1', source: 'start', target: 'time-check' },
    { id: 'c2', source: 'time-check', target: 'deal-value-check', label: '3+ Days' },
    { id: 'c3', source: 'time-check', target: 'end', label: 'Recent Contact' },
    { id: 'c4', source: 'deal-value-check', target: 'high-value-check', label: '>$10K' },
    { id: 'c5', source: 'deal-value-check', target: 'standard-followup', label: '<$10K' },
    { id: 'c6', source: 'high-value-check', target: 'notify-manager', label: '>$50K' },
    { id: 'c7', source: 'high-value-check', target: 'create-salesforce-task', label: '$10K-$50K' },
    { id: 'c8', source: 'notify-manager', target: 'create-salesforce-task' },
    { id: 'c9', source: 'create-salesforce-task', target: 'send-email-sequence' },
    { id: 'c10', source: 'standard-followup', target: 'schedule-reminder' },
    { id: 'c11', source: 'send-email-sequence', target: 'update-crm' },
    { id: 'c12', source: 'schedule-reminder', target: 'end' },
    { id: 'c13', source: 'update-crm', target: 'end' }
  ],
  thumbnail: '/templates/sales-followup.png'
};

// Lead Nurturing Workflow
export const leadNurturingTemplate: WorkflowTemplate = {
  id: 'lead-nurturing-sequence',
  name: 'Lead Nurturing Sequence',
  description: 'Automated lead nurturing based on lead score and engagement',
  category: 'lead_nurturing',
  tags: ['leads', 'nurturing', 'scoring', 'email-sequence'],
  complexity_level: 'intermediate',
  trigger_type: 'integration_change',
  default_config: {
    min_lead_score: 50,
    email_delay_days: 2,
    sequence_length: 5,
    engagement_threshold: 3
  },
  use_cases: [
    'Nurture leads based on behavior scoring',
    'Send personalized content sequences',
    'Track engagement and adjust messaging',
    'Qualify leads for sales handoff'
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Lead Created',
        inputs: [],
        outputs: ['lead-score-check']
      }
    },
    {
      id: 'lead-score-check',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: {
        label: 'Check Lead Score',
        condition: 'lead.score >= 50',
        trueNodeId: 'send-welcome-email',
        falseNodeId: 'low-score-nurture'
      }
    },
    {
      id: 'send-welcome-email',
      type: 'action',
      position: { x: 500, y: 100 },
      data: {
        label: 'Send Welcome Email',
        action: 'send_email',
        nextNodeId: 'delay-2-days'
      }
    },
    {
      id: 'low-score-nurture',
      type: 'action',
      position: { x: 500, y: 200 },
      data: {
        label: 'Add to Low-Score Nurture',
        action: 'hubspot_update_contact',
        nextNodeId: 'end'
      }
    },
    {
      id: 'delay-2-days',
      type: 'action',
      position: { x: 700, y: 100 },
      data: {
        label: 'Wait 2 Days',
        action: 'delay',
        nextNodeId: 'send-educational-content'
      }
    },
    {
      id: 'send-educational-content',
      type: 'action',
      position: { x: 900, y: 100 },
      data: {
        label: 'Send Educational Content',
        action: 'send_email',
        nextNodeId: 'track-engagement'
      }
    },
    {
      id: 'track-engagement',
      type: 'condition',
      position: { x: 1100, y: 100 },
      data: {
        label: 'Check Email Engagement',
        condition: 'email.opened && email.clicked',
        trueNodeId: 'high-engagement-path',
        falseNodeId: 'low-engagement-path'
      }
    },
    {
      id: 'high-engagement-path',
      type: 'action',
      position: { x: 1300, y: 50 },
      data: {
        label: 'Send Product Demo Invite',
        action: 'send_email',
        nextNodeId: 'create-sales-task'
      }
    },
    {
      id: 'low-engagement-path',
      type: 'action',
      position: { x: 1300, y: 150 },
      data: {
        label: 'Continue Nurture Sequence',
        action: 'send_email',
        nextNodeId: 'end'
      }
    },
    {
      id: 'create-sales-task',
      type: 'action',
      position: { x: 1500, y: 50 },
      data: {
        label: 'Create Sales Follow-up Task',
        action: 'salesforce_create_task',
        nextNodeId: 'end'
      }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 1700, y: 100 },
      data: {
        label: 'Workflow Complete',
        inputs: ['create-sales-task', 'low-engagement-path', 'low-score-nurture']
      }
    }
  ],
  connections: [
    { id: 'c1', source: 'start', target: 'lead-score-check' },
    { id: 'c2', source: 'lead-score-check', target: 'send-welcome-email', label: 'Score ≥50' },
    { id: 'c3', source: 'lead-score-check', target: 'low-score-nurture', label: 'Score <50' },
    { id: 'c4', source: 'send-welcome-email', target: 'delay-2-days' },
    { id: 'c5', source: 'low-score-nurture', target: 'end' },
    { id: 'c6', source: 'delay-2-days', target: 'send-educational-content' },
    { id: 'c7', source: 'send-educational-content', target: 'track-engagement' },
    { id: 'c8', source: 'track-engagement', target: 'high-engagement-path', label: 'Engaged' },
    { id: 'c9', source: 'track-engagement', target: 'low-engagement-path', label: 'Not Engaged' },
    { id: 'c10', source: 'high-engagement-path', target: 'create-sales-task' },
    { id: 'c11', source: 'low-engagement-path', target: 'end' },
    { id: 'c12', source: 'create-sales-task', target: 'end' }
  ],
  thumbnail: '/templates/lead-nurturing.png'
};

// Customer Onboarding Workflow
export const customerOnboardingTemplate: WorkflowTemplate = {
  id: 'customer-onboarding',
  name: 'Customer Onboarding Sequence',
  description: 'Comprehensive onboarding workflow for new customers',
  category: 'customer_service',
  tags: ['onboarding', 'welcome', 'setup', 'training'],
  complexity_level: 'advanced',
  trigger_type: 'integration_change',
  default_config: {
    welcome_delay_hours: 1,
    setup_reminder_days: 3,
    training_schedule_days: 7,
    satisfaction_survey_days: 14
  },
  use_cases: [
    'Welcome new customers with personalized messages',
    'Guide customers through setup process',
    'Schedule training sessions',
    'Collect feedback and measure satisfaction'
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Customer Signup',
        inputs: [],
        outputs: ['send-welcome']
      }
    },
    {
      id: 'send-welcome',
      type: 'action',
      position: { x: 300, y: 100 },
      data: {
        label: 'Send Welcome Email & SMS',
        action: 'send_email',
        nextNodeId: 'create-customer-record'
      }
    },
    {
      id: 'create-customer-record',
      type: 'action',
      position: { x: 500, y: 100 },
      data: {
        label: 'Create HubSpot Contact',
        action: 'hubspot_create_contact',
        nextNodeId: 'delay-1-hour'
      }
    },
    {
      id: 'delay-1-hour',
      type: 'action',
      position: { x: 700, y: 100 },
      data: {
        label: 'Wait 1 Hour',
        action: 'delay',
        nextNodeId: 'send-setup-guide'
      }
    },
    {
      id: 'send-setup-guide',
      type: 'action',
      position: { x: 900, y: 100 },
      data: {
        label: 'Send Setup Guide',
        action: 'send_email',
        nextNodeId: 'delay-3-days'
      }
    },
    {
      id: 'delay-3-days',
      type: 'action',
      position: { x: 1100, y: 100 },
      data: {
        label: 'Wait 3 Days',
        action: 'delay',
        nextNodeId: 'check-setup-completion'
      }
    },
    {
      id: 'check-setup-completion',
      type: 'condition',
      position: { x: 1300, y: 100 },
      data: {
        label: 'Setup Completed?',
        condition: 'customer.setup_completed === true',
        trueNodeId: 'schedule-training',
        falseNodeId: 'send-setup-reminder'
      }
    },
    {
      id: 'send-setup-reminder',
      type: 'action',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Send Setup Reminder',
        action: 'send_email',
        nextNodeId: 'create-support-task'
      }
    },
    {
      id: 'create-support-task',
      type: 'action',
      position: { x: 1500, y: 200 },
      data: {
        label: 'Create Support Follow-up Task',
        action: 'hubspot_create_ticket',
        nextNodeId: 'end'
      }
    },
    {
      id: 'schedule-training',
      type: 'action',
      position: { x: 1500, y: 100 },
      data: {
        label: 'Schedule Training Session',
        action: 'send_email',
        nextNodeId: 'delay-7-days'
      }
    },
    {
      id: 'delay-7-days',
      type: 'action',
      position: { x: 1700, y: 100 },
      data: {
        label: 'Wait 7 Days',
        action: 'delay',
        nextNodeId: 'send-satisfaction-survey'
      }
    },
    {
      id: 'send-satisfaction-survey',
      type: 'action',
      position: { x: 1900, y: 100 },
      data: {
        label: 'Send Satisfaction Survey',
        action: 'send_email',
        nextNodeId: 'end'
      }
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 2100, y: 150 },
      data: {
        label: 'Onboarding Complete',
        inputs: ['send-satisfaction-survey', 'create-support-task']
      }
    }
  ],
  connections: [
    { id: 'c1', source: 'start', target: 'send-welcome' },
    { id: 'c2', source: 'send-welcome', target: 'create-customer-record' },
    { id: 'c3', source: 'create-customer-record', target: 'delay-1-hour' },
    { id: 'c4', source: 'delay-1-hour', target: 'send-setup-guide' },
    { id: 'c5', source: 'send-setup-guide', target: 'delay-3-days' },
    { id: 'c6', source: 'delay-3-days', target: 'check-setup-completion' },
    { id: 'c7', source: 'check-setup-completion', target: 'schedule-training', label: 'Completed' },
    { id: 'c8', source: 'check-setup-completion', target: 'send-setup-reminder', label: 'Not Completed' },
    { id: 'c9', source: 'send-setup-reminder', target: 'create-support-task' },
    { id: 'c10', source: 'create-support-task', target: 'end' },
    { id: 'c11', source: 'schedule-training', target: 'delay-7-days' },
    { id: 'c12', source: 'delay-7-days', target: 'send-satisfaction-survey' },
    { id: 'c13', source: 'send-satisfaction-survey', target: 'end' }
  ],
  thumbnail: '/templates/customer-onboarding.png'
};

// Export all templates
export const workflowTemplates: WorkflowTemplate[] = [
  customerComplaintEscalationTemplate,
  orderDelayNotificationTemplate,
  salesFollowUpTemplate,
  leadNurturingTemplate,
  customerOnboardingTemplate
];

// Template categories for UI organization
export const templateCategories = [
  {
    id: 'customer_service',
    name: 'Customer Service',
    description: 'Workflows for customer support and service automation',
    icon: '🎧',
    templates: workflowTemplates.filter(t => t.category === 'customer_service')
  },
  {
    id: 'sales_automation',
    name: 'Sales Automation',
    description: 'Workflows for sales process automation and lead management',
    icon: '💰',
    templates: workflowTemplates.filter(t => t.category === 'sales_automation')
  },
  {
    id: 'lead_nurturing',
    name: 'Lead Nurturing',
    description: 'Workflows for lead qualification and nurturing sequences',
    icon: '🌱',
    templates: workflowTemplates.filter(t => t.category === 'lead_nurturing')
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Workflows for marketing automation and campaigns',
    icon: '📢',
    templates: workflowTemplates.filter(t => t.category === 'marketing')
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Workflows for automated notifications and alerts',
    icon: '🔔',
    templates: workflowTemplates.filter(t => t.category === 'notifications')
  }
];

// Helper function to get template by ID
export function getTemplateById(templateId: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(template => template.id === templateId);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(template => template.category === category);
}

// Helper function to get templates by complexity
export function getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return workflowTemplates.filter(template => template.complexity_level === complexity);
}

// Helper function to search templates
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return workflowTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.use_cases.some(useCase => useCase.toLowerCase().includes(lowercaseQuery))
  );
}