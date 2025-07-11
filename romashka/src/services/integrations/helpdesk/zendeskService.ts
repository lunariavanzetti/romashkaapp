import { oauthManager } from '../oauthManager';
import type { OAuthConfig } from '../oauthManager';
import type { 
  Ticket, 
  TicketComment, 
  User, 
  ZendeskConfig,
  Integration 
} from '../../../types/integrations';

export interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
  type: 'problem' | 'incident' | 'question' | 'task';
  assignee_id?: number;
  requester_id: number;
  submitter_id: number;
  organization_id?: number;
  group_id?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_at?: string;
  external_id?: string;
  custom_fields?: Array<{
    id: number;
    value: any;
  }>;
}

export interface ZendeskUser {
  id: number;
  email: string;
  name: string;
  role: 'end-user' | 'agent' | 'admin';
  active: boolean;
  verified: boolean;
  phone?: string;
  organization_id?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  custom_fields?: Record<string, any>;
}

export interface ZendeskComment {
  id: number;
  type: 'Comment' | 'VoiceComment';
  author_id: number;
  body: string;
  html_body: string;
  plain_body: string;
  public: boolean;
  created_at: string;
  attachments?: Array<{
    id: number;
    file_name: string;
    content_url: string;
    content_type: string;
    size: number;
  }>;
}

export interface ZendeskOrganization {
  id: number;
  name: string;
  domain_names: string[];
  details?: string;
  notes?: string;
  group_id?: number;
  shared_tickets: boolean;
  shared_comments: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  custom_fields?: Record<string, any>;
}

export interface ZendeskResponse<T> {
  results?: T[];
  count?: number;
  next_page?: string;
  previous_page?: string;
  page?: number;
  per_page?: number;
  page_count?: number;
}

export class ZendeskService {
  private readonly baseUrl: string;
  private rateLimitRemaining: number = 100;
  private rateLimitReset: number = 0;

  constructor(private subdomain: string) {
    this.baseUrl = `https://${subdomain}.zendesk.com/api/v2`;
  }

  // Authentication methods
  async authenticate(integrationId: string): Promise<string> {
    const config = this.getOAuthConfig();
    return await oauthManager.getValidAccessToken(integrationId, config);
  }

  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const accessToken = await this.authenticate(integrationId);
      
      const response = await fetch(`${this.baseUrl}/users/me.json`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Zendesk connection test failed:', error);
      return false;
    }
  }

  // Ticket operations
  async createTicket(integrationId: string, ticketData: Partial<Ticket>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const zendeskTicket = this.mapToZendeskTicket(ticketData);
    
    const response = await this.makeRequest('POST', '/tickets.json', { ticket: zendeskTicket }, accessToken);
    
    return response.ticket.id.toString();
  }

  async updateTicket(integrationId: string, ticketId: string, updates: Partial<Ticket>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const zendeskUpdates = this.mapToZendeskTicket(updates);
    
    await this.makeRequest('PUT', `/tickets/${ticketId}.json`, { ticket: zendeskUpdates }, accessToken);
  }

  async getTicket(integrationId: string, ticketId: string): Promise<Ticket | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/tickets/${ticketId}.json`, null, accessToken);
    
    if (!response?.ticket) return null;
    
    return this.mapFromZendeskTicket(response.ticket);
  }

  async listTickets(integrationId: string, status?: string, limit: number = 100): Promise<Ticket[]> {
    const accessToken = await this.authenticate(integrationId);
    
    let endpoint = `/tickets.json?per_page=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    
    const response = await this.makeRequest('GET', endpoint, null, accessToken);
    
    if (!response?.tickets) return [];
    
    return response.tickets.map((ticket: ZendeskTicket) => this.mapFromZendeskTicket(ticket));
  }

  async searchTickets(integrationId: string, query: string, limit: number = 100): Promise<Ticket[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const encodedQuery = encodeURIComponent(query);
    const response = await this.makeRequest('GET', `/search.json?query=${encodedQuery}&per_page=${limit}`, null, accessToken);
    
    if (!response?.results) return [];
    
    const tickets = response.results.filter((result: any) => result.result_type === 'ticket');
    return tickets.map((ticket: ZendeskTicket) => this.mapFromZendeskTicket(ticket));
  }

  async deleteTicket(integrationId: string, ticketId: string): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    await this.makeRequest('DELETE', `/tickets/${ticketId}.json`, null, accessToken);
  }

  // Ticket comment operations
  async addComment(integrationId: string, ticketId: string, comment: string, isPublic: boolean = true): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const commentData = {
      ticket: {
        comment: {
          body: comment,
          public: isPublic
        }
      }
    };
    
    const response = await this.makeRequest('PUT', `/tickets/${ticketId}.json`, commentData, accessToken);
    
    return response.audit.events[0].id.toString();
  }

  async getTicketComments(integrationId: string, ticketId: string): Promise<TicketComment[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/tickets/${ticketId}/comments.json`, null, accessToken);
    
    if (!response?.comments) return [];
    
    return response.comments.map((comment: ZendeskComment) => this.mapFromZendeskComment(comment));
  }

  // User operations
  async createUser(integrationId: string, userData: Partial<User>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const zendeskUser = this.mapToZendeskUser(userData);
    
    const response = await this.makeRequest('POST', '/users.json', { user: zendeskUser }, accessToken);
    
    return response.user.id.toString();
  }

  async updateUser(integrationId: string, userId: string, updates: Partial<User>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const zendeskUpdates = this.mapToZendeskUser(updates);
    
    await this.makeRequest('PUT', `/users/${userId}.json`, { user: zendeskUpdates }, accessToken);
  }

  async getUser(integrationId: string, userId: string): Promise<User | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/users/${userId}.json`, null, accessToken);
    
    if (!response?.user) return null;
    
    return this.mapFromZendeskUser(response.user);
  }

  async getUserByEmail(integrationId: string, email: string): Promise<User | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/users/search.json?query=${encodeURIComponent(email)}`, null, accessToken);
    
    if (!response?.users || response.users.length === 0) return null;
    
    return this.mapFromZendeskUser(response.users[0]);
  }

  async listUsers(integrationId: string, role?: string, limit: number = 100): Promise<User[]> {
    const accessToken = await this.authenticate(integrationId);
    
    let endpoint = `/users.json?per_page=${limit}`;
    if (role) {
      endpoint += `&role=${role}`;
    }
    
    const response = await this.makeRequest('GET', endpoint, null, accessToken);
    
    if (!response?.users) return [];
    
    return response.users.map((user: ZendeskUser) => this.mapFromZendeskUser(user));
  }

  // Organization operations
  async createOrganization(integrationId: string, orgData: any): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const zendeskOrg = {
      name: orgData.name,
      domain_names: orgData.domain_names || [],
      details: orgData.details,
      notes: orgData.notes,
      shared_tickets: orgData.shared_tickets || false,
      shared_comments: orgData.shared_comments || false,
      tags: orgData.tags || []
    };
    
    const response = await this.makeRequest('POST', '/organizations.json', { organization: zendeskOrg }, accessToken);
    
    return response.organization.id.toString();
  }

  async updateOrganization(integrationId: string, orgId: string, updates: any): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    await this.makeRequest('PUT', `/organizations/${orgId}.json`, { organization: updates }, accessToken);
  }

  async getOrganization(integrationId: string, orgId: string): Promise<any | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/organizations/${orgId}.json`, null, accessToken);
    
    return response?.organization || null;
  }

  // Batch operations
  async batchCreateTickets(integrationId: string, tickets: Partial<Ticket>[]): Promise<{ success: boolean; errors: string[] }> {
    const accessToken = await this.authenticate(integrationId);
    const errors: string[] = [];
    const batchSize = 100; // Zendesk limit
    
    for (let i = 0; i < tickets.length; i += batchSize) {
      const batch = tickets.slice(i, i + batchSize);
      
      try {
        const zendeskTickets = batch.map(ticket => this.mapToZendeskTicket(ticket));
        const batchData = {
          tickets: zendeskTickets
        };
        
        const response = await this.makeRequest('POST', '/tickets/create_many.json', batchData, accessToken);
        
        if (response.job_status && response.job_status.status === 'failed') {
          errors.push(`Batch ${i / batchSize + 1}: ${response.job_status.message}`);
        }
      } catch (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  // Data fetching for sync
  async fetchData(integrationId: string, entities: string[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const entity of entities) {
      try {
        let data: any[] = [];
        
        switch (entity) {
          case 'tickets':
            data = await this.listTickets(integrationId, undefined, 1000);
            break;
          case 'users':
            data = await this.listUsers(integrationId, undefined, 1000);
            break;
          case 'organizations':
            data = await this.listOrganizations(integrationId, 1000);
            break;
        }
        
        results.push(...data);
      } catch (error) {
        console.error(`Failed to fetch ${entity}:`, error);
      }
    }
    
    return results;
  }

  // Webhook handling
  async handleWebhook(integrationId: string, payload: any): Promise<void> {
    try {
      const { type, ticket_id, user_id, organization_id } = payload;
      
      switch (type) {
        case 'ticket_created':
          await this.handleTicketCreated(integrationId, ticket_id);
          break;
        case 'ticket_updated':
          await this.handleTicketUpdated(integrationId, ticket_id);
          break;
        case 'ticket_comment_created':
          await this.handleTicketCommentCreated(integrationId, ticket_id, payload.comment_id);
          break;
        case 'user_created':
          await this.handleUserCreated(integrationId, user_id);
          break;
        case 'user_updated':
          await this.handleUserUpdated(integrationId, user_id);
          break;
        case 'organization_created':
          await this.handleOrganizationCreated(integrationId, organization_id);
          break;
        case 'organization_updated':
          await this.handleOrganizationUpdated(integrationId, organization_id);
          break;
      }
    } catch (error) {
      console.error('Zendesk webhook handling failed:', error);
    }
  }

  // Helper methods
  private async makeRequest(method: string, endpoint: string, data: any, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest(method, endpoint, data, accessToken);
    }
    
    if (!response.ok) {
      let errorMessage = `Zendesk API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error || errorData.description || JSON.stringify(errorData)}`;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    // Update rate limit info
    this.rateLimitRemaining = parseInt(response.headers.get('X-Rate-Limit-Remaining') || '100');
    this.rateLimitReset = parseInt(response.headers.get('X-Rate-Limit-Reset') || '0');
    
    return response.status === 204 ? null : await response.json();
  }

  private getOAuthConfig(): OAuthConfig {
    const baseUrl = window.location.origin;
    return {
      clientId: '', // Should be configured
      clientSecret: '', // Should be configured
      redirectUri: `${baseUrl}/integrations/oauth/callback/zendesk`,
      authUrl: `https://${this.subdomain}.zendesk.com/oauth/authorizations/new`,
      tokenUrl: `https://${this.subdomain}.zendesk.com/oauth/tokens`,
      scope: 'read write',
      provider: 'zendesk'
    };
  }

  // Mapping methods
  private mapToZendeskTicket(ticket: Partial<Ticket>): any {
    return {
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      type: 'question', // Default type
      requester_id: ticket.requester_id,
      assignee_id: ticket.assignee_id,
      tags: ticket.tags || [],
      external_id: ticket.id // Use our ID as external ID
    };
  }

  private mapFromZendeskTicket(zdTicket: ZendeskTicket): Ticket {
    return {
      id: zdTicket.id.toString(),
      subject: zdTicket.subject,
      description: zdTicket.description,
      priority: zdTicket.priority as any,
      status: zdTicket.status as any,
      assignee_id: zdTicket.assignee_id?.toString(),
      requester_id: zdTicket.requester_id.toString(),
      tags: zdTicket.tags,
      created_at: zdTicket.created_at,
      updated_at: zdTicket.updated_at
    };
  }

  private mapToZendeskUser(user: Partial<User>): any {
    return {
      name: user.name,
      email: user.email,
      role: user.role || 'end-user',
      verified: true,
      active: user.active !== false
    };
  }

  private mapFromZendeskUser(zdUser: ZendeskUser): User {
    return {
      id: zdUser.id.toString(),
      email: zdUser.email,
      name: zdUser.name,
      role: zdUser.role,
      active: zdUser.active,
      created_at: zdUser.created_at,
      updated_at: zdUser.updated_at
    };
  }

  private mapFromZendeskComment(zdComment: ZendeskComment): TicketComment {
    return {
      id: zdComment.id.toString(),
      ticket_id: '', // Would need to be provided from context
      author_id: zdComment.author_id.toString(),
      body: zdComment.body,
      is_public: zdComment.public,
      created_at: zdComment.created_at
    };
  }

  // Additional list methods
  private async listOrganizations(integrationId: string, limit: number = 100): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/organizations.json?per_page=${limit}`, null, accessToken);
    
    if (!response?.organizations) return [];
    
    return response.organizations.map((org: ZendeskOrganization) => ({
      id: org.id.toString(),
      name: org.name,
      domain_names: org.domain_names,
      details: org.details,
      notes: org.notes,
      shared_tickets: org.shared_tickets,
      shared_comments: org.shared_comments,
      tags: org.tags,
      created_at: org.created_at,
      updated_at: org.updated_at
    }));
  }

  // Webhook handlers
  private async handleTicketCreated(integrationId: string, ticketId: string): Promise<void> {
    console.log('Zendesk ticket created:', ticketId);
    // Implementation depends on specific requirements
  }

  private async handleTicketUpdated(integrationId: string, ticketId: string): Promise<void> {
    console.log('Zendesk ticket updated:', ticketId);
    // Implementation depends on specific requirements
  }

  private async handleTicketCommentCreated(integrationId: string, ticketId: string, commentId: string): Promise<void> {
    console.log('Zendesk ticket comment created:', ticketId, commentId);
    // Implementation depends on specific requirements
  }

  private async handleUserCreated(integrationId: string, userId: string): Promise<void> {
    console.log('Zendesk user created:', userId);
    // Implementation depends on specific requirements
  }

  private async handleUserUpdated(integrationId: string, userId: string): Promise<void> {
    console.log('Zendesk user updated:', userId);
    // Implementation depends on specific requirements
  }

  private async handleOrganizationCreated(integrationId: string, orgId: string): Promise<void> {
    console.log('Zendesk organization created:', orgId);
    // Implementation depends on specific requirements
  }

  private async handleOrganizationUpdated(integrationId: string, orgId: string): Promise<void> {
    console.log('Zendesk organization updated:', orgId);
    // Implementation depends on specific requirements
  }

  // Find record for sync
  async findRecord(integrationId: string, record: any): Promise<any> {
    if (record.email) {
      return await this.getUserByEmail(integrationId, record.email);
    }
    return null;
  }

  // Create record for sync
  async createRecord(integrationId: string, record: any): Promise<string> {
    if (record.subject && record.description) {
      return await this.createTicket(integrationId, record);
    } else if (record.email && record.name) {
      return await this.createUser(integrationId, record);
    }
    throw new Error('Unsupported record type');
  }

  // Update record for sync
  async updateRecord(integrationId: string, recordId: string, record: any): Promise<void> {
    if (record.subject || record.description || record.status) {
      await this.updateTicket(integrationId, recordId, record);
    } else if (record.email || record.name) {
      await this.updateUser(integrationId, recordId, record);
    }
  }

  // Analytics and metrics
  async getTicketMetrics(integrationId: string, startDate: string, endDate: string): Promise<any> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/incremental/ticket_metric_events.json?start_time=${startDate}&end_time=${endDate}`,
      null,
      accessToken
    );
    
    return response;
  }

  async getSatisfactionRatings(integrationId: string, limit: number = 100): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/satisfaction_ratings.json?per_page=${limit}`,
      null,
      accessToken
    );
    
    return response?.satisfaction_ratings || [];
  }

  // Custom field operations
  async getCustomFields(integrationId: string, objectType: 'ticket' | 'user' | 'organization'): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/${objectType}_fields.json`,
      null,
      accessToken
    );
    
    return response?.[`${objectType}_fields`] || [];
  }

  // Automation and triggers
  async getTriggers(integrationId: string): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', '/triggers.json', null, accessToken);
    
    return response?.triggers || [];
  }

  async getAutomations(integrationId: string): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', '/automations.json', null, accessToken);
    
    return response?.automations || [];
  }
}