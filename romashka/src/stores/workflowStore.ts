import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import type { 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  NodeType 
} from '../types/workflow';

interface WorkflowState {
  currentWorkflow: Workflow | null;
  selectedNode: WorkflowNode | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedNode: (node: WorkflowNode | null) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (source: string, target: string) => void;
  deleteConnection: (connectionId: string) => void;
  loadWorkflow: (workflowId: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  selectedNode: null,
  isLoading: false,
  error: null,

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  addNode: (type, position) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        message: type === 'message' ? 'Hello! How can I help you?' : '',
        condition: type === 'condition' ? 'true' : '',
        action: type === 'action' ? 'save_email' : '',
        inputType: type === 'input' ? 'email' : '',
        inputLabel: type === 'input' ? 'Please provide your email' : ''
      }
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: [...currentWorkflow.nodes, newNode]
      }
    });
  },

  updateNode: (nodeId, updates) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }
    });
  },

  deleteNode: (nodeId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    // Remove node and its connections
    set({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: currentWorkflow.nodes.filter(node => node.id !== nodeId),
        connections: currentWorkflow.connections.filter(
          conn => conn.source !== nodeId && conn.target !== nodeId
        )
      },
      selectedNode: null
    });
  },

  addConnection: (source, target) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      target
    };

    set({
      currentWorkflow: {
        ...currentWorkflow,
        connections: [...currentWorkflow.connections, newConnection]
      }
    });
  },

  deleteConnection: (connectionId) => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({
      currentWorkflow: {
        ...currentWorkflow,
        connections: currentWorkflow.connections.filter(
          conn => conn.id !== connectionId
        )
      }
    });
  },

  loadWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      set({ currentWorkflow: workflow, isLoading: false });
    } catch (error) {
      console.error('Error loading workflow:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workflow',
        isLoading: false 
      });
    }
  },

  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;

    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const workflowData = {
        ...currentWorkflow,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (currentWorkflow.id) {
        // Update existing workflow
        const { error } = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', currentWorkflow.id);

        if (error) throw error;
      } else {
        // Create new workflow
        const { data: newWorkflow, error } = await supabase
          .from('workflows')
          .insert(workflowData)
          .select()
          .single();

        if (error) throw error;
        set({ currentWorkflow: newWorkflow });
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Error saving workflow:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save workflow',
        isLoading: false 
      });
    }
  },

  createWorkflow: async (name, description) => {
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const newWorkflow: Workflow = {
        id: '',
        user_id: user.id,
        name,
        description: description || '',
        nodes: [],
        connections: [],
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      set({ currentWorkflow: newWorkflow, isLoading: false });
    } catch (error) {
      console.error('Error creating workflow:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create workflow',
        isLoading: false 
      });
    }
  },

  deleteWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      set({ currentWorkflow: null, isLoading: false });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete workflow',
        isLoading: false 
      });
    }
  },

  clearWorkflow: () => {
    set({ currentWorkflow: null, selectedNode: null });
  }
})); 