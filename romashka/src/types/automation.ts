export type WorkflowTriggerType = 'message_received' | 'visitor_behavior' | 'time_based';
export type WorkflowActionType = 'send_message' | 'create_ticket' | 'notify_agent' | 'update_crm';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  conditions: Record<string, unknown>;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  parameters: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface FlowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
} 