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
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  conversation_id: string;
  current_node_id?: string;
  context: Record<string, any>;
  status: 'running' | 'completed' | 'failed' | 'paused';
  created_at: string;
  updated_at: string;
}

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

export interface WorkflowContext {
  userMessage?: string;
  conversationId: string;
  userEmail?: string;
  userName?: string;
  collectedData: Record<string, any>;
  currentNodeId?: string;
  workflowId: string;
}

export interface NodeExecutionResult {
  success: boolean;
  message?: string;
  nextNodeId?: string;
  context?: Record<string, any>;
  error?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  thumbnail?: string;
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