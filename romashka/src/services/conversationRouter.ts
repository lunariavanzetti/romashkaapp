import { supabase } from './supabaseClient';
import { agentService } from './agentService';
import type { Conversation } from './agentService';

export interface RoutingRules {
  department: string;
  priority: number;
  skills: string[];
  language: string;
  customerTier: string;
}

export interface EscalationTrigger {
  type: 'customer_request' | 'ai_confidence_low' | 'complex_issue' | 'sla_breach';
  reason: string;
  conversationId: string;
  metadata?: any;
}

export class ConversationRouter {
  private static instance: ConversationRouter;

  static getInstance(): ConversationRouter {
    if (!ConversationRouter.instance) {
      ConversationRouter.instance = new ConversationRouter();
    }
    return ConversationRouter.instance;
  }

  async routeConversation(conversation: Conversation, reason: string): Promise<string | null> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      // Determine department based on conversation content or tags
      const department = await this.determineDepartment(conversation);
      
      // Update conversation with department
      await supabase
        .from('conversations')
        .update({ department })
        .eq('id', conversation.id);

      // Find best agent for the department
      const agentId = await agentService.findBestAgent({
        ...conversation,
        department
      });

      if (agentId) {
        // Assign conversation to agent
        const success = await agentService.assignConversation(conversation.id, agentId);
        if (success) {
          // Log the routing decision
          await this.logRoutingDecision(conversation.id, agentId, department, reason);
          return agentId;
        }
      }

      // If no agent found, put in queue
      await this.addToQueue(conversation.id, department);
      return null;
    } catch (error) {
      console.error('Error routing conversation:', error);
      return null;
    }
  }

  async handleEscalation(conversationId: string, escalationType: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Get conversation details
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      // Update conversation status
      await supabase
        .from('conversations')
        .update({
          status: 'escalated',
          handoff_reason: escalationType,
          priority: this.calculateEscalationPriority(conversation.priority, escalationType)
        })
        .eq('id', conversationId);

      // Find specialized agent for escalation
      const agentId = await this.findEscalationAgent(conversation, escalationType);
      
      if (agentId) {
        await agentService.assignConversation(conversationId, agentId);
      }

      // Create escalation record
      await this.createEscalationRecord(conversationId, escalationType);
    } catch (error) {
      console.error('Error handling escalation:', error);
    }
  }

  async balanceWorkload(): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Get all agents and their current workload
      const { data: agents, error } = await supabase
        .from('agent_availability')
        .select('agent_id, current_chat_count, max_concurrent_chats')
        .eq('is_online', true)
        .eq('status', 'available');

      if (error) throw error;

      // Find overloaded agents
      const overloadedAgents = agents?.filter(agent => 
        agent.current_chat_count > agent.max_concurrent_chats * 0.8
      ) || [];

      // Find underutilized agents
      const underutilizedAgents = agents?.filter(agent => 
        agent.current_chat_count < agent.max_concurrent_chats * 0.5
      ) || [];

      // Redistribute conversations from overloaded to underutilized agents
      for (const overloadedAgent of overloadedAgents) {
        const conversationsToTransfer = await this.getConversationsForTransfer(overloadedAgent.agent_id);
        
        for (const conversation of conversationsToTransfer) {
          const targetAgent = underutilizedAgents.find(agent => 
            agent.current_chat_count < agent.max_concurrent_chats * 0.7
          );
          
          if (targetAgent) {
            await this.transferConversation(conversation.id, overloadedAgent.agent_id, targetAgent.agent_id);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error balancing workload:', error);
    }
  }

  async handleAfterHours(conversation: Conversation): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Check if any agents are available
      const availableAgents = await agentService.getAvailableAgents();
      
      if (availableAgents.length === 0) {
        // No agents available, set conversation to after-hours status
        await supabase
          .from('conversations')
          .update({
            status: 'after_hours',
            priority: 'normal'
          })
          .eq('id', conversation.id);

        // Send automated response
        await this.sendAfterHoursMessage(conversation.id);
      }
    } catch (error) {
      console.error('Error handling after hours:', error);
    }
  }

  private async determineDepartment(conversation: Conversation): Promise<string> {
    // Simple keyword-based department detection
    const keywords = {
      'billing': ['billing', 'payment', 'invoice', 'charge', 'refund', 'subscription'],
      'technical': ['technical', 'bug', 'error', 'issue', 'problem', 'broken', 'not working'],
      'sales': ['pricing', 'plan', 'upgrade', 'downgrade', 'features', 'comparison'],
      'general': ['hello', 'help', 'question', 'support']
    };

    const message = conversation.last_message?.toLowerCase() || '';
    
    for (const [department, departmentKeywords] of Object.entries(keywords)) {
      if (departmentKeywords.some(keyword => message.includes(keyword))) {
        return department;
      }
    }

    return 'general';
  }

  private calculateEscalationPriority(currentPriority: string, escalationType: string): string {
    const priorityMap = {
      'low': 1,
      'normal': 2,
      'high': 3,
      'urgent': 4
    };

    const escalationBoost = {
      'customer_request': 1,
      'ai_confidence_low': 1,
      'complex_issue': 2,
      'sla_breach': 3
    };

    const currentLevel = priorityMap[currentPriority as keyof typeof priorityMap] || 2;
    const boost = escalationBoost[escalationType as keyof typeof escalationBoost] || 1;
    const newLevel = Math.min(currentLevel + boost, 4);

    return Object.keys(priorityMap).find(key => priorityMap[key as keyof typeof priorityMap] === newLevel) || 'high';
  }

  private async findEscalationAgent(conversation: any, escalationType: string): Promise<string | null> {
    // Find agents with expertise in the escalation type
    const expertiseMap = {
      'customer_request': ['customer_service', 'support'],
      'ai_confidence_low': ['technical', 'support'],
      'complex_issue': ['technical', 'senior_support'],
      'sla_breach': ['senior_support', 'management']
    };

    const requiredSkills = expertiseMap[escalationType as keyof typeof expertiseMap] || ['support'];
    
    // This would need to be implemented based on your agent skills data structure
    // For now, return the first available agent
    const availableAgents = await agentService.getAvailableAgents(conversation.department);
    return availableAgents.length > 0 ? availableAgents[0].id : null;
  }

  private async logRoutingDecision(conversationId: string, agentId: string, department: string, reason: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: conversationId,
          to_agent_id: agentId,
          transfer_reason: `Auto-routed to ${department}: ${reason}`
        });
    } catch (error) {
      console.error('Error logging routing decision:', error);
    }
  }

  private async addToQueue(conversationId: string, department: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('conversations')
        .update({
          status: 'queued',
          department
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  private async createEscalationRecord(conversationId: string, escalationType: string): Promise<void> {
    try {
      if (!supabase) return;

      await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: conversationId,
          transfer_reason: `Escalated: ${escalationType}`
        });
    } catch (error) {
      console.error('Error creating escalation record:', error);
    }
  }

  private async getConversationsForTransfer(agentId: string): Promise<any[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('id, priority, created_at')
        .eq('assigned_agent_id', agentId)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting conversations for transfer:', error);
      return [];
    }
  }

  private async transferConversation(conversationId: string, fromAgentId: string, toAgentId: string): Promise<void> {
    try {
      if (!supabase) return;

      // Update conversation assignment
      await supabase
        .from('conversations')
        .update({ assigned_agent_id: toAgentId })
        .eq('id', conversationId);

      // Log the transfer
      await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: conversationId,
          from_agent_id: fromAgentId,
          to_agent_id: toAgentId,
          transfer_reason: 'Workload balancing'
        });

      // Update agent chat counts
      await agentService.updateAgentStatus(fromAgentId, { currentChatCount: -1 });
      await agentService.updateAgentStatus(toAgentId, { currentChatCount: 1 });
    } catch (error) {
      console.error('Error transferring conversation:', error);
    }
  }

  private async sendAfterHoursMessage(conversationId: string): Promise<void> {
    try {
      if (!supabase) return;

      const afterHoursMessage = {
        conversation_id: conversationId,
        sender_type: 'ai',
        content: "Thank you for contacting us. Our team is currently offline. We'll get back to you as soon as possible during our business hours (9 AM - 6 PM EST). For urgent matters, please leave a detailed message and we'll prioritize your request.",
        created_at: new Date().toISOString()
      };

      await supabase
        .from('messages')
        .insert(afterHoursMessage);
    } catch (error) {
      console.error('Error sending after hours message:', error);
    }
  }
}

export const conversationRouter = ConversationRouter.getInstance(); 