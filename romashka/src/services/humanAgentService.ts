import { supabase } from './supabaseClient';

export interface HumanAgent {
  id: string;
  name: string;
  email: string;
  is_online: boolean;
  last_active: string;
  assigned_conversations: number;
  status: 'available' | 'busy' | 'away' | 'offline';
  created_at: string;
  updated_at: string;
}

export interface EscalationRequest {
  id: string;
  conversation_id: string;
  customer_message: string;
  ai_response: string;
  escalation_reason: string;
  assigned_agent_id?: string;
  status: 'pending' | 'assigned' | 'resolved';
  created_at: string;
  updated_at: string;
}

export class HumanAgentService {
  // Add human agents to the team
  static async addHumanAgent(agentData: Omit<HumanAgent, 'id' | 'created_at' | 'updated_at' | 'is_online' | 'last_active' | 'assigned_conversations'>): Promise<HumanAgent | null> {
    try {
      const { data, error } = await supabase
        .from('human_agents')
        .insert([{
          ...agentData,
          is_online: false,
          last_active: new Date().toISOString(),
          assigned_conversations: 0,
          status: 'offline'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding human agent:', error);
      return null;
    }
  }

  // Get all human agents
  static async getHumanAgents(): Promise<HumanAgent[]> {
    try {
      const { data, error } = await supabase
        .from('human_agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching human agents:', error);
      return [];
    }
  }

  // Update agent status
  static async updateAgentStatus(agentId: string, status: HumanAgent['status']): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('human_agents')
        .update({ 
          status,
          last_active: new Date().toISOString(),
          is_online: status !== 'offline'
        })
        .eq('id', agentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating agent status:', error);
      return false;
    }
  }

  // Find available agent for escalation
  static async findAvailableAgent(): Promise<HumanAgent | null> {
    try {
      const { data, error } = await supabase
        .from('human_agents')
        .select('*')
        .eq('status', 'available')
        .eq('is_online', true)
        .order('assigned_conversations', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error finding available agent:', error);
      return null;
    }
  }

  // Create escalation request
  static async createEscalation(escalationData: Omit<EscalationRequest, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<EscalationRequest | null> {
    try {
      // Find available agent
      const availableAgent = await this.findAvailableAgent();
      
      const { data, error } = await supabase
        .from('escalation_requests')
        .insert([{
          ...escalationData,
          assigned_agent_id: availableAgent?.id || null,
          status: availableAgent ? 'assigned' : 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // If agent is assigned, increment their conversation count
      if (availableAgent) {
        await supabase
          .from('human_agents')
          .update({ 
            assigned_conversations: availableAgent.assigned_conversations + 1 
          })
          .eq('id', availableAgent.id);

        // Send notification to agent
        await this.notifyAgent(availableAgent.id, data.id);
      }

      return data;
    } catch (error) {
      console.error('Error creating escalation:', error);
      return null;
    }
  }

  // Get escalation requests
  static async getEscalationRequests(status?: EscalationRequest['status']): Promise<EscalationRequest[]> {
    try {
      let query = supabase
        .from('escalation_requests')
        .select(`
          *,
          human_agents (
            id,
            name,
            email,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching escalation requests:', error);
      return [];
    }
  }

  // Assign escalation to specific agent
  static async assignEscalation(escalationId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('escalation_requests')
        .update({ 
          assigned_agent_id: agentId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', escalationId);

      if (error) throw error;

      // Increment agent's conversation count
      const { data: agent } = await supabase
        .from('human_agents')
        .select('assigned_conversations')
        .eq('id', agentId)
        .single();

      if (agent) {
        await supabase
          .from('human_agents')
          .update({ 
            assigned_conversations: agent.assigned_conversations + 1 
          })
          .eq('id', agentId);
      }

      // Send notification to agent
      await this.notifyAgent(agentId, escalationId);

      return true;
    } catch (error) {
      console.error('Error assigning escalation:', error);
      return false;
    }
  }

  // Resolve escalation
  static async resolveEscalation(escalationId: string): Promise<boolean> {
    try {
      // Get escalation details
      const { data: escalation } = await supabase
        .from('escalation_requests')
        .select('assigned_agent_id')
        .eq('id', escalationId)
        .single();

      // Update escalation status
      const { error } = await supabase
        .from('escalation_requests')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', escalationId);

      if (error) throw error;

      // Decrement agent's conversation count if assigned
      if (escalation?.assigned_agent_id) {
        const { data: agent } = await supabase
          .from('human_agents')
          .select('assigned_conversations')
          .eq('id', escalation.assigned_agent_id)
          .single();

        if (agent && agent.assigned_conversations > 0) {
          await supabase
            .from('human_agents')
            .update({ 
              assigned_conversations: agent.assigned_conversations - 1 
            })
            .eq('id', escalation.assigned_agent_id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error resolving escalation:', error);
      return false;
    }
  }

  // Send notification to agent (placeholder - implement with your notification system)
  private static async notifyAgent(agentId: string, escalationId: string): Promise<void> {
    try {
      // Get agent details
      const { data: agent } = await supabase
        .from('human_agents')
        .select('email, name')
        .eq('id', agentId)
        .single();

      if (agent) {
        // Here you would integrate with your email service or notification system
        console.log(`Notification sent to ${agent.email}: New escalation ${escalationId} assigned`);
        
        // You could also create a notification record in the database
        await supabase
          .from('notifications')
          .insert([{
            recipient_id: agentId,
            type: 'escalation_assigned',
            title: 'New Customer Escalation',
            message: `You have been assigned a new customer escalation request.`,
            data: { escalation_id: escalationId },
            is_read: false
          }]);
      }
    } catch (error) {
      console.error('Error sending agent notification:', error);
    }
  }

  // Get agent performance metrics
  static async getAgentMetrics(agentId?: string): Promise<any> {
    try {
      let query = supabase
        .from('escalation_requests')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          assigned_agent_id,
          human_agents (
            id,
            name,
            email
          )
        `);

      if (agentId) {
        query = query.eq('assigned_agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const totalEscalations = data?.length || 0;
      const resolvedEscalations = data?.filter(e => e.status === 'resolved').length || 0;
      const pendingEscalations = data?.filter(e => e.status === 'pending').length || 0;
      const activeEscalations = data?.filter(e => e.status === 'assigned').length || 0;

      // Calculate average resolution time for resolved escalations
      const resolvedWithTimes = data?.filter(e => e.status === 'resolved' && e.updated_at) || [];
      let averageResolutionTime = 0;

      if (resolvedWithTimes.length > 0) {
        const totalResolutionTime = resolvedWithTimes.reduce((sum, escalation) => {
          const created = new Date(escalation.created_at).getTime();
          const resolved = new Date(escalation.updated_at).getTime();
          return sum + (resolved - created);
        }, 0);
        
        averageResolutionTime = totalResolutionTime / resolvedWithTimes.length;
      }

      return {
        totalEscalations,
        resolvedEscalations,
        pendingEscalations,
        activeEscalations,
        resolutionRate: totalEscalations > 0 ? (resolvedEscalations / totalEscalations) * 100 : 0,
        averageResolutionTime: Math.round(averageResolutionTime / (1000 * 60)), // Convert to minutes
        data
      };
    } catch (error) {
      console.error('Error fetching agent metrics:', error);
      return {
        totalEscalations: 0,
        resolvedEscalations: 0,
        pendingEscalations: 0,
        activeEscalations: 0,
        resolutionRate: 0,
        averageResolutionTime: 0,
        data: []
      };
    }
  }
}

export default HumanAgentService;