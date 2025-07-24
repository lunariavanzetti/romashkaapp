// Core workflow interfaces
export interface WorkflowNode {
  id: string;
  type: 'start' | 'message' | 'input' | 'condition' | 'action' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    message?: string;
    condition?: string;
    action?: string;
    inputType?: string;
    inputLabel?: string;
    inputs?: string[];
    outputs?: string[];
    nextNodeId?: string;
    trueNodeId?: string;
    falseNodeId?: string;
  };
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_conditions: WorkflowTrigger;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  is_active: boolean;
  execution_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// Enhanced workflow types for the new engine
export type TriggerType = 
  | 'chat_message' 
  | 'integration_change' 
  | 'time_based' 
  | 'webhook' 
  | 'manual' 
  | 'sentiment_analysis'
  | 'keyword_detection'
  | 'customer_action';

export interface TriggerEvent {
  type: TriggerType;
  data: any;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface WorkflowTrigger {
  type: TriggerType;
  conditions: WorkflowCondition[];
  settings: Record<string, any>;
  schedule?: ScheduleConfig;
}

export interface ScheduleConfig {
  schedule_type: 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';
  schedule_value?: number; // For interval (minutes)
  cron_expression?: string; // For cron schedules
  timezone?: string;
  last_triggered?: string;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  logical_operator?: 'AND' | 'OR';
}

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'in'
  | 'not_in'
  | 'regex'
  | 'exists'
  | 'not_exists';

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  required?: boolean;
  retry_config?: RetryConfig;
}

export type ActionType = 
  | 'send_email'
  | 'send_sms'
  | 'send_slack'
  | 'hubspot_create_contact'
  | 'hubspot_update_contact'
  | 'hubspot_create_deal'
  | 'hubspot_update_deal'
  | 'hubspot_create_ticket'
  | 'salesforce_create_contact'
  | 'salesforce_update_contact'
  | 'salesforce_create_opportunity'
  | 'salesforce_update_opportunity'
  | 'salesforce_create_task'
  | 'salesforce_create_case'
  | 'shopify_create_customer'
  | 'shopify_update_customer'
  | 'shopify_create_order'
  | 'shopify_update_order'
  | 'shopify_create_discount'
  | 'escalate_to_human'
  | 'send_chat_message'
  | 'update_customer_profile'
  | 'create_knowledge_entry'
  | 'schedule_follow_up'
  | 'delay'
  | 'webhook'
  | 'custom_script'
  | 'conditional_branch'
  | 'loop'
  | 'parallel_execution';

export interface RetryConfig {
  max_attempts: number;
  delay_ms: number;
  backoff_multiplier?: number;
  retry_on_error_types?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_event: TriggerEvent;
  status: ExecutionStatus;
  context: WorkflowContext;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
  execution_log: ExecutionLogEntry[];
  result?: ActionResult;
  conversation_id?: string;
  current_node_id?: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface ExecutionLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
  action_id?: string;
  node_id?: string;
}

export interface WorkflowContext {
  workflow_id: string;
  execution_id: string;
  trigger_event: TriggerEvent;
  variables: Record<string, any>;
  integrations: {
    hubspot: any;
    salesforce: any;
    shopify: any;
  };
  customer_data?: CustomerData;
  conversation_data?: ConversationData;
}

export interface CustomerData {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  tier?: 'free' | 'premium' | 'enterprise';
  lifetime_value?: number;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface ConversationData {
  id: string;
  messages: Message[];
  sentiment_score?: number;
  intent?: string;
  confidence?: number;
  language?: string;
  channel?: string;
  agent_id?: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  next_action_id?: string;
  should_continue?: boolean;
}

// Workflow templates and presets
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  trigger_type: TriggerType;
  default_config: Record<string, any>;
  thumbnail?: string;
  use_cases: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
}

export type WorkflowCategory = 
  | 'customer_service'
  | 'sales_automation'
  | 'marketing'
  | 'lead_nurturing'
  | 'escalation'
  | 'notifications'
  | 'data_sync'
  | 'reporting'
  | 'custom';

// Pre-built workflow scenarios
export interface WorkflowScenario {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  expected_outcome: string;
  metrics: string[];
}

// Analytics and monitoring
export interface WorkflowAnalytics {
  workflow_id: string;
  time_range: {
    start: Date;
    end: Date;
  };
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  running_executions: number;
  success_rate: number;
  failure_rate: number;
  average_execution_time: number;
  most_common_errors: ErrorSummary[];
  performance_trends: PerformanceTrend[];
  action_success_rates: ActionSuccessRate[];
}

export interface ErrorSummary {
  error_type: string;
  count: number;
  percentage: number;
  last_occurrence: Date;
  affected_actions: string[];
}

export interface PerformanceTrend {
  date: string;
  executions: number;
  success_rate: number;
  average_duration: number;
}

export interface ActionSuccessRate {
  action_type: ActionType;
  total_attempts: number;
  successful_attempts: number;
  success_rate: number;
  average_duration: number;
}

// Workflow builder UI types
export interface WorkflowBuilderState {
  workflow: Workflow;
  selectedNode?: WorkflowNode;
  selectedConnection?: WorkflowConnection;
  isEditing: boolean;
  isDirty: boolean;
  validationErrors: ValidationError[];
  testResults?: TestResult[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  node_id?: string;
  connection_id?: string;
  field?: string;
}

export interface TestResult {
  execution_id: string;
  status: ExecutionStatus;
  duration: number;
  steps_executed: number;
  errors: string[];
  outputs: Record<string, any>;
}

// Workflow management
export interface WorkflowManager {
  createWorkflow(template: WorkflowTemplate): Promise<Workflow>;
  updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<void>;
  deleteWorkflow(workflowId: string): Promise<void>;
  duplicateWorkflow(workflowId: string, newName: string): Promise<Workflow>;
  validateWorkflow(workflow: Workflow): ValidationError[];
  testWorkflow(workflowId: string, testData: any): Promise<TestResult>;
  getWorkflowAnalytics(workflowId: string, timeRange?: { start: Date; end: Date }): Promise<WorkflowAnalytics>;
  exportWorkflow(workflowId: string): Promise<string>;
  importWorkflow(workflowData: string): Promise<Workflow>;
}

// Legacy interfaces for backward compatibility
export interface Conversation {
  id: string;
  workflow_id: string;
  user_email?: string;
  user_name?: string;
  status: 'active' | 'closed' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type NodeType = 'start' | 'message' | 'input' | 'condition' | 'action' | 'end';

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs: number;
  outputs: number;
  canHaveMultipleOutputs: boolean;
}

export interface NodeExecutionResult {
  success: boolean;
  message?: string;
  nextNodeId?: string;
  context?: Record<string, any>;
  error?: string;
} 