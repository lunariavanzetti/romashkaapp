import { supabase } from './supabaseClient';

export interface AgentStatus {
  id: string;
  isOnline: boolean;
  status: 'available' | 'busy' | 'away' | 'offline';
  currentChatCount: number;
  maxConcurrentChats: number;
  lastActivity: Date;
  departments: string[];
  skills: string[];
}

export interface Conversation {
  id: string;
  user_name: string;
  user_email: string;
  status: string;
  priority: string;
  department?: string;
  assigned_agent_id?: string;
  tags?: string[];
  created_at: string;
  last_message?: string;
}

export class AgentManagementService {
  private static instance: AgentManagementService;

  static getInstance(): AgentManagementService {
    if (!AgentManagementService.instance) {
      AgentManagementService.instance = new AgentManagementService();
    }
    return AgentManagementService.instance;
  }

  async getAvailableAgents(department?: string): Promise<AgentStatus[]> {
    try {
      let query = supabase
        .from('agent_availability')
        .select(`
          *,
          profiles:agent_id (
            id,
            full_name,
            company_name
          )
        `)
        .eq('is_online', true)
        .eq('status', 'available');

      if (department) {
        query = query.eq('department', department);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(agent => ({
        id: agent.agent_id,
        isOnline: agent.is_online,
        status: agent.status as AgentStatus['status'],
        currentChatCount: agent.current_chat_count,
        maxConcurrentChats: agent.max_concurrent_chats,
        lastActivity: new Date(agent.last_activity),
        departments: agent.departments || [],
        skills: agent.skills || []
      }));
    } catch (error) {
      console.error('Error getting available agents:', error);
      return [];
    }
  }

  async assignConversation(conversationId: string, agentId?: string): Promise<boolean> {
    try {
      // If no agent specified, find the best available agent
      if (!agentId) {
        agentId = await this.findBestAgent({ id: conversationId } as Conversation);
        if (!agentId) {
          console.error('No available agents found');
          return false;
        }
      }

      // Update conversation assignment
      const { error: convError } = await supabase
        .from('conversations')
        .update({ 
          assigned_agent_id: agentId,
          status: 'assigned'
        })
        .eq('id', conversationId);

      if (convError) throw convError;

      // Update agent's current chat count
      const { error: agentError } = await supabase
        .from('agent_availability')
        .update({ 
          current_chat_count: supabase.raw('current_chat_count + 1'),
          status: 'busy'
        })
        .eq('agent_id', agentId);

      if (agentError) throw agentError;

      // Create SLA tracking record
      await this.createSLARecord(conversationId, 'assignment');

      return true;
    } catch (error) {
      console.error('Error assigning conversation:', error);
      return false;
    }
  }

  async updateAgentStatus(agentId: string, status: Partial<AgentStatus>): Promise<void> {
    try {
      const { error } = await supabase
        .from('agent_availability')
        .update({
          is_online: status.isOnline,
          status: status.status,
          current_chat_count: status.currentChatCount,
          last_activity: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  }

  async getAgentWorkload(agentId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('assigned_agent_id', agentId)
        .eq('status', 'active');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting agent workload:', error);
      return 0;
    }
  }

  async findBestAgent(conversation: Conversation): Promise<string | null> {
    try {
      // Get available agents
      const availableAgents = await this.getAvailableAgents(conversation.department);

      if (availableAgents.length === 0) {
        return null;
      }

      // Sort by workload (lowest first) and then by last activity
      const sortedAgents = availableAgents
        .filter(agent => agent.currentChatCount < agent.maxConcurrentChats)
        .sort((a, b) => {
          // Primary sort by current chat count
          if (a.currentChatCount !== b.currentChatCount) {
            return a.currentChatCount - b.currentChatCount;
          }
          // Secondary sort by last activity (most recent first)
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        });

      return sortedAgents.length > 0 ? sortedAgents[0].id : null;
    } catch (error) {
      console.error('Error finding best agent:', error);
      return null;
    }
  }

  async handleAgentOffline(agentId: string): Promise<void> {
    try {
      // Reassign active conversations to other agents
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, user_name, user_email, status, priority, department')
        .eq('assigned_agent_id', agentId)
        .eq('status', 'active');

      if (error) throw error;

      for (const conversation of conversations || []) {
        const newAgentId = await this.findBestAgent(conversation);
        if (newAgentId) {
          await this.assignConversation(conversation.id, newAgentId);
        }
      }

      // Update agent status to offline
      await this.updateAgentStatus(agentId, { 
        isOnline: false, 
        status: 'offline',
        currentChatCount: 0
      });
    } catch (error) {
      console.error('Error handling agent offline:', error);
    }
  }

  async createSLARecord(conversationId: string, slaType: string): Promise<void> {
    try {
      const targetTimes = {
        assignment: 60, // 1 minute
        first_response: 300, // 5 minutes
        resolution: 3600, // 1 hour
        handoff: 120 // 2 minutes
      };

      const { error } = await supabase
        .from('sla_tracking')
        .insert({
          conversation_id: conversationId,
          sla_type: slaType,
          target_time_seconds: targetTimes[slaType as keyof typeof targetTimes] || 300,
          status: 'pending'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating SLA record:', error);
    }
  }

  async getAgentPerformance(agentId: string, timeRange: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    try {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          customer_satisfaction,
          resolution_time_seconds,
          created_at,
          updated_at
        `)
        .eq('assigned_agent_id', agentId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const conversations = data || [];
      const resolved = conversations.filter(c => c.status === 'resolved');
      const avgSatisfaction = resolved.length > 0 
        ? resolved.reduce((sum, c) => sum + (c.customer_satisfaction || 0), 0) / resolved.length 
        : 0;
      const avgResolutionTime = resolved.length > 0
        ? resolved.reduce((sum, c) => sum + (c.resolution_time_seconds || 0), 0) / resolved.length
        : 0;

      return {
        totalConversations: conversations.length,
        resolvedConversations: resolved.length,
        resolutionRate: conversations.length > 0 ? resolved.length / conversations.length : 0,
        avgSatisfaction,
        avgResolutionTime,
        conversationsPerDay: conversations.length / days
      };
    } catch (error) {
      console.error('Error getting agent performance:', error);
      return null;
    }
  }
}

export const agentService = AgentManagementService.getInstance(); 