import { supabase } from './supabaseClient';
import type { KnowledgeItem, WorkflowStage, WorkflowComment, WorkflowChecklistItem, StageHistory } from '../types/knowledge';

export interface WorkflowNotification {
  id: string;
  type: 'stage_change' | 'assignment' | 'comment' | 'approval' | 'reminder';
  recipient_id: string;
  recipient_email: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'stage_entry' | 'stage_exit' | 'time_based' | 'manual';
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  type: 'assign_user' | 'send_notification' | 'create_task' | 'update_field' | 'run_webhook';
  parameters: Record<string, any>;
  delay_hours?: number;
  retry_count?: number;
}

export interface WorkflowAssignment {
  id: string;
  knowledge_item_id: string;
  user_id: string;
  role: 'reviewer' | 'approver' | 'editor' | 'owner';
  assigned_at: string;
  assigned_by: string;
  due_date?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

export interface WorkflowMetrics {
  avgTimeInStage: Record<string, number>;
  bottlenecks: string[];
  completionRate: number;
  overdueItems: number;
  userWorkload: Record<string, number>;
  stageDistribution: Record<string, number>;
}

export class ContentWorkflowService {
  private notificationQueue: WorkflowNotification[] = [];
  private workflowRules: WorkflowRule[] = [];

  constructor() {
    this.initializeWorkflowRules();
  }

  private async initializeWorkflowRules() {
    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;
      this.workflowRules = data || [];
    } catch (error) {
      console.error('Error initializing workflow rules:', error);
    }
  }

  async moveToStage(itemId: string, newStage: string, userId: string, notes?: string): Promise<boolean> {
    try {
      // Get current item
      const { data: item, error: itemError } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      const currentStage = item.workflow_stage?.stage || 'draft';

      // Create stage history entry
      const stageHistoryEntry: StageHistory = {
        stage: newStage,
        entered_at: new Date().toISOString(),
        user_id: userId,
        user_name: await this.getUserName(userId),
        notes,
        automated: false
      };

      // Update workflow stage
      const updatedWorkflowStage: WorkflowStage = {
        ...item.workflow_stage,
        stage: newStage as any,
        stage_history: [
          ...(item.workflow_stage?.stage_history || []),
          stageHistoryEntry
        ]
      };

      // Update item
      const { error: updateError } = await supabase
        .from('knowledge_items')
        .update({
          workflow_stage: updatedWorkflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Execute workflow rules
      await this.executeWorkflowRules('stage_entry', itemId, {
        from_stage: currentStage,
        to_stage: newStage,
        user_id: userId
      });

      return true;
    } catch (error) {
      console.error('Error moving item to stage:', error);
      return false;
    }
  }

  async assignUser(itemId: string, userId: string, role: string, assignedBy: string, dueDate?: string): Promise<boolean> {
    try {
      const assignment: Omit<WorkflowAssignment, 'id'> = {
        knowledge_item_id: itemId,
        user_id: userId,
        role: role as any,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy,
        due_date: dueDate,
        status: 'pending'
      };

      const { error } = await supabase
        .from('workflow_assignments')
        .insert(assignment);

      if (error) throw error;

      // Update item workflow stage
      const { data: item } = await supabase
        .from('knowledge_items')
        .select('workflow_stage')
        .eq('id', itemId)
        .single();

      if (item) {
        const updatedWorkflowStage: WorkflowStage = {
          ...item.workflow_stage,
          stage: item.workflow_stage?.stage || 'draft',
          assigned_to: userId,
          due_date: dueDate
        };

        await supabase
          .from('knowledge_items')
          .update({
            workflow_stage: updatedWorkflowStage,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);
      }

      // Send notification
      await this.sendNotification({
        type: 'assignment',
        recipient_id: userId,
        title: 'New Assignment',
        message: `You have been assigned to review content: ${itemId}`,
        data: { item_id: itemId, role, due_date: dueDate }
      });

      return true;
    } catch (error) {
      console.error('Error assigning user:', error);
      return false;
    }
  }

  async addComment(itemId: string, comment: Omit<WorkflowComment, 'id'>): Promise<boolean> {
    try {
      const { data: item } = await supabase
        .from('knowledge_items')
        .select('workflow_stage')
        .eq('id', itemId)
        .single();

      if (!item) return false;

      const newComment: WorkflowComment = {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const updatedWorkflowStage: WorkflowStage = {
        ...item.workflow_stage,
        stage: item.workflow_stage?.stage || 'draft',
        comments: [...(item.workflow_stage?.comments || []), newComment]
      };

      const { error } = await supabase
        .from('knowledge_items')
        .update({
          workflow_stage: updatedWorkflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      // Notify mentioned users
      if (comment.mentions) {
        for (const mentionedUserId of comment.mentions) {
          await this.sendNotification({
            type: 'comment',
            recipient_id: mentionedUserId,
            title: 'You were mentioned in a comment',
            message: `${comment.user_name} mentioned you in a comment: ${comment.content}`,
            data: { item_id: itemId, comment_id: newComment.id }
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }

  async updateChecklist(itemId: string, checklistItemId: string, completed: boolean, userId: string): Promise<boolean> {
    try {
      const { data: item } = await supabase
        .from('knowledge_items')
        .select('workflow_stage')
        .eq('id', itemId)
        .single();

      if (!item) return false;

             const updatedChecklist = item.workflow_stage?.checklist?.map((checklistItem: WorkflowChecklistItem) =>
         checklistItem.id === checklistItemId
           ? { 
               ...checklistItem, 
               completed, 
               completed_by: completed ? userId : undefined,
               completed_at: completed ? new Date().toISOString() : undefined
             }
           : checklistItem
       ) || [];

      const updatedWorkflowStage: WorkflowStage = {
        ...item.workflow_stage,
        stage: item.workflow_stage?.stage || 'draft',
        checklist: updatedChecklist
      };

      const { error } = await supabase
        .from('knowledge_items')
        .update({
          workflow_stage: updatedWorkflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      // Check if all checklist items are completed
      const allCompleted = updatedChecklist.every(item => item.completed);
      if (allCompleted) {
        await this.executeWorkflowRules('checklist_completed', itemId, {
          user_id: userId,
          checklist_items: updatedChecklist.length
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating checklist:', error);
      return false;
    }
  }

  async getWorkflowMetrics(dateRange?: { start: string; end: string }): Promise<WorkflowMetrics> {
    try {
      // Get all items with workflow stages
      let query = supabase
        .from('knowledge_items')
        .select('*');

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const stageDistribution: Record<string, number> = {};
      const avgTimeInStage: Record<string, number> = {};
      const userWorkload: Record<string, number> = {};
      let overdueItems = 0;

             for (const item of items as KnowledgeItem[]) {
         const stage = item.workflow_stage?.stage || 'draft';
         stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;

         // Check if overdue
         if (item.workflow_stage?.due_date) {
           const dueDate = new Date(item.workflow_stage.due_date);
           const now = new Date();
           if (dueDate < now) {
             overdueItems++;
           }
         }

         // Calculate user workload
         if (item.workflow_stage?.assigned_to) {
           const assignedTo = item.workflow_stage.assigned_to;
           userWorkload[assignedTo] = (userWorkload[assignedTo] || 0) + 1;
         }

         // Calculate average time in stage
         if (item.workflow_stage?.stage_history) {
           for (let i = 0; i < item.workflow_stage.stage_history.length; i++) {
             const historyItem = item.workflow_stage.stage_history[i];
             const nextItem = item.workflow_stage.stage_history[i + 1];
             
             if (nextItem) {
               const timeInStage = new Date(nextItem.entered_at).getTime() - new Date(historyItem.entered_at).getTime();
               const days = timeInStage / (1000 * 60 * 60 * 24);
               
               if (!avgTimeInStage[historyItem.stage]) {
                 avgTimeInStage[historyItem.stage] = 0;
               }
               avgTimeInStage[historyItem.stage] += days;
             }
           }
         }
       }

             // Calculate completion rate
       const completedItems = items.filter((item: KnowledgeItem) => 
         item.workflow_stage?.stage === 'published' || 
         item.workflow_stage?.stage === 'approved'
       ).length;
      const completionRate = items.length > 0 ? (completedItems / items.length) * 100 : 0;

      // Identify bottlenecks (stages with highest average time)
      const bottlenecks = Object.entries(avgTimeInStage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([stage]) => stage);

      return {
        avgTimeInStage,
        bottlenecks,
        completionRate,
        overdueItems,
        userWorkload,
        stageDistribution
      };
    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      return {
        avgTimeInStage: {},
        bottlenecks: [],
        completionRate: 0,
        overdueItems: 0,
        userWorkload: {},
        stageDistribution: {}
      };
    }
  }

  async createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Reload rules
      await this.initializeWorkflowRules();
      
      return data.id;
    } catch (error) {
      console.error('Error creating workflow rule:', error);
      return null;
    }
  }

  async executeWorkflowRules(trigger: string, itemId: string, context: Record<string, any>): Promise<void> {
    const applicableRules = this.workflowRules.filter(rule => 
      rule.trigger === trigger && rule.enabled
    );

    for (const rule of applicableRules) {
      try {
        // Check conditions
        if (!this.evaluateConditions(rule.conditions, context)) {
          continue;
        }

        // Execute actions
        for (const action of rule.actions) {
          await this.executeWorkflowAction(action, itemId, context);
        }
      } catch (error) {
        console.error(`Error executing workflow rule ${rule.id}:`, error);
      }
    }
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Simple condition evaluation - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async executeWorkflowAction(action: WorkflowAction, itemId: string, context: Record<string, any>): Promise<void> {
    if (action.delay_hours && action.delay_hours > 0) {
      // Schedule action for later (would need a job queue in production)
      setTimeout(() => {
        this.executeWorkflowAction({...action, delay_hours: undefined}, itemId, context);
      }, action.delay_hours * 60 * 60 * 1000);
      return;
    }

    switch (action.type) {
      case 'assign_user':
        await this.assignUser(
          itemId,
          action.parameters.user_id,
          action.parameters.role,
          'system',
          action.parameters.due_date
        );
        break;
      
      case 'send_notification':
        await this.sendNotification({
          type: action.parameters.type,
          recipient_id: action.parameters.recipient_id,
          title: action.parameters.title,
          message: action.parameters.message,
          data: { item_id: itemId, ...action.parameters.data }
        });
        break;
      
      case 'update_field':
        await supabase
          .from('knowledge_items')
          .update({
            [action.parameters.field]: action.parameters.value,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);
        break;
      
      case 'run_webhook':
        // Execute webhook
        await this.executeWebhook(action.parameters.url, {
          item_id: itemId,
          action: action.type,
          context,
          timestamp: new Date().toISOString()
        });
        break;
    }
  }

  private async sendNotification(notification: Omit<WorkflowNotification, 'id' | 'created_at' | 'recipient_email'>): Promise<void> {
    try {
      // Get user email
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', notification.recipient_id)
        .single();

      if (!user) return;

      const fullNotification: WorkflowNotification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipient_email: user.email,
        created_at: new Date().toISOString()
      };

      // Store notification
      await supabase
        .from('workflow_notifications')
        .insert(fullNotification);

      // Send email (would integrate with email service)
      console.log('Sending notification:', fullNotification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async executeWebhook(url: string, data: Record<string, any>): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error executing webhook:', error);
    }
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      return data?.name || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  async getOverdueItems(): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .not('workflow_stage->due_date', 'is', null);

      if (error) throw error;

             const now = new Date();
       return data.filter((item: KnowledgeItem) => {
         const dueDate = item.workflow_stage?.due_date;
         return dueDate && new Date(dueDate) < now;
       });
    } catch (error) {
      console.error('Error getting overdue items:', error);
      return [];
    }
  }

  async sendReminders(): Promise<void> {
    try {
      const overdueItems = await this.getOverdueItems();
      
      for (const item of overdueItems) {
        if (item.workflow_stage?.assigned_to) {
          await this.sendNotification({
            type: 'reminder',
            recipient_id: item.workflow_stage.assigned_to,
            title: 'Overdue Item Reminder',
            message: `The content "${item.title}" is overdue. Please review and take action.`,
            data: { item_id: item.id, due_date: item.workflow_stage.due_date }
          });
        }
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  }
}

export const contentWorkflowService = new ContentWorkflowService();