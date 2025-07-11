import { oauthManager } from '../oauthManager';
import type { OAuthConfig } from '../oauthManager';
import type { 
  Contact, 
  Lead, 
  Deal, 
  Task, 
  HubSpotConfig,
  Integration 
} from '../../../types/integrations';

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    phone?: string;
    address?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    hubspot_owner_id?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotTask {
  id: string;
  properties: {
    hs_task_subject?: string;
    hs_task_body?: string;
    hs_task_due_date?: string;
    hs_task_priority?: string;
    hs_task_status?: string;
    hs_task_type?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

export class HubSpotService {
  private readonly baseUrl = 'https://api.hubapi.com';
  private rateLimitRemaining: number = 100;
  private rateLimitReset: number = 0;

  // Authentication methods
  async authenticate(integrationId: string): Promise<string> {
    const config = this.getOAuthConfig();
    return await oauthManager.getValidAccessToken(integrationId, config);
  }

  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const accessToken = await this.authenticate(integrationId);
      
      const response = await fetch(`${this.baseUrl}/contacts/v1/lists/all/contacts/all`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }

  // Contact operations
  async createContact(integrationId: string, contactData: Partial<Contact>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotContact = this.mapToHubSpotContact(contactData);
    
    const response = await this.makeRequest('POST', '/crm/v3/objects/contacts', hubspotContact, accessToken);
    
    return response.id;
  }

  async updateContact(integrationId: string, contactId: string, updates: Partial<Contact>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotUpdates = this.mapToHubSpotContact(updates);
    
    await this.makeRequest('PATCH', `/crm/v3/objects/contacts/${contactId}`, hubspotUpdates, accessToken);
  }

  async getContact(integrationId: string, contactId: string): Promise<Contact | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/crm/v3/objects/contacts/${contactId}`, null, accessToken);
    
    if (!response) return null;
    
    return this.mapFromHubSpotContact(response);
  }

  async getContactByEmail(integrationId: string, email: string): Promise<Contact | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'POST',
      '/crm/v3/objects/contacts/search',
      {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: email
          }]
        }]
      },
      accessToken
    );
    
    if (!response?.results || response.results.length === 0) return null;
    
    return this.mapFromHubSpotContact(response.results[0]);
  }

  async listContacts(integrationId: string, limit: number = 100): Promise<Contact[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company,jobtitle,hs_lead_status,createdate,lastmodifieddate`,
      null,
      accessToken
    );
    
    if (!response?.results) return [];
    
    return response.results.map((contact: HubSpotContact) => this.mapFromHubSpotContact(contact));
  }

  // Company operations
  async createCompany(integrationId: string, companyData: any): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotCompany = {
      properties: {
        name: companyData.name,
        domain: companyData.domain,
        industry: companyData.industry,
        phone: companyData.phone,
        address: companyData.address
      }
    };
    
    const response = await this.makeRequest('POST', '/crm/v3/objects/companies', hubspotCompany, accessToken);
    
    return response.id;
  }

  async updateCompany(integrationId: string, companyId: string, updates: any): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotUpdates = {
      properties: updates
    };
    
    await this.makeRequest('PATCH', `/crm/v3/objects/companies/${companyId}`, hubspotUpdates, accessToken);
  }

  async getCompany(integrationId: string, companyId: string): Promise<any | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/crm/v3/objects/companies/${companyId}`, null, accessToken);
    
    return response || null;
  }

  // Deal operations
  async createDeal(integrationId: string, dealData: Partial<Deal>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotDeal = this.mapToHubSpotDeal(dealData);
    
    const response = await this.makeRequest('POST', '/crm/v3/objects/deals', hubspotDeal, accessToken);
    
    return response.id;
  }

  async updateDeal(integrationId: string, dealId: string, updates: Partial<Deal>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotUpdates = this.mapToHubSpotDeal(updates);
    
    await this.makeRequest('PATCH', `/crm/v3/objects/deals/${dealId}`, hubspotUpdates, accessToken);
  }

  async getDeal(integrationId: string, dealId: string): Promise<Deal | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/crm/v3/objects/deals/${dealId}`, null, accessToken);
    
    if (!response) return null;
    
    return this.mapFromHubSpotDeal(response);
  }

  async listDeals(integrationId: string, limit: number = 100): Promise<Deal[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,closedate,pipeline,createdate,lastmodifieddate`,
      null,
      accessToken
    );
    
    if (!response?.results) return [];
    
    return response.results.map((deal: HubSpotDeal) => this.mapFromHubSpotDeal(deal));
  }

  // Task operations
  async createTask(integrationId: string, taskData: Partial<Task>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotTask = this.mapToHubSpotTask(taskData);
    
    const response = await this.makeRequest('POST', '/crm/v3/objects/tasks', hubspotTask, accessToken);
    
    return response.id;
  }

  async updateTask(integrationId: string, taskId: string, updates: Partial<Task>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const hubspotUpdates = this.mapToHubSpotTask(updates);
    
    await this.makeRequest('PATCH', `/crm/v3/objects/tasks/${taskId}`, hubspotUpdates, accessToken);
  }

  // Note operations
  async addNote(integrationId: string, objectType: string, objectId: string, noteBody: string): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const noteData = {
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date().toISOString()
      }
    };
    
    const response = await this.makeRequest('POST', '/crm/v3/objects/notes', noteData, accessToken);
    
    // Associate note with object
    await this.makeRequest(
      'PUT',
      `/crm/v3/objects/notes/${response.id}/associations/${objectType}/${objectId}/note_to_${objectType}`,
      null,
      accessToken
    );
    
    return response.id;
  }

  // Batch operations
  async batchCreate(integrationId: string, objectType: string, records: any[]): Promise<{ success: boolean; errors: string[] }> {
    const accessToken = await this.authenticate(integrationId);
    const errors: string[] = [];
    const batchSize = 100; // HubSpot limit
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const batchData = {
          inputs: batch
        };
        
        const response = await this.makeRequest(
          'POST',
          `/crm/v3/objects/${objectType}/batch/create`,
          batchData,
          accessToken
        );
        
        if (response.errors && response.errors.length > 0) {
          errors.push(...response.errors.map((error: any) => error.message));
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
          case 'contacts':
            data = await this.listContacts(integrationId, 1000);
            break;
          case 'companies':
            data = await this.listCompanies(integrationId, 1000);
            break;
          case 'deals':
            data = await this.listDeals(integrationId, 1000);
            break;
          case 'tasks':
            data = await this.listTasks(integrationId, 1000);
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
      const { subscriptionType, objectId, propertyName, propertyValue } = payload;
      
      switch (subscriptionType) {
        case 'contact.creation':
          await this.handleContactCreated(integrationId, objectId);
          break;
        case 'contact.propertyChange':
          await this.handleContactUpdated(integrationId, objectId, propertyName, propertyValue);
          break;
        case 'contact.deletion':
          await this.handleContactDeleted(integrationId, objectId);
          break;
        case 'deal.creation':
          await this.handleDealCreated(integrationId, objectId);
          break;
        case 'deal.propertyChange':
          await this.handleDealUpdated(integrationId, objectId, propertyName, propertyValue);
          break;
        case 'deal.deletion':
          await this.handleDealDeleted(integrationId, objectId);
          break;
      }
    } catch (error) {
      console.error('HubSpot webhook handling failed:', error);
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
    
    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.makeRequest(method, endpoint, data, accessToken);
    }
    
    if (!response.ok) {
      let errorMessage = `HubSpot API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    // Update rate limit info
    this.rateLimitRemaining = parseInt(response.headers.get('X-HubSpot-RateLimit-Remaining') || '100');
    this.rateLimitReset = parseInt(response.headers.get('X-HubSpot-RateLimit-Reset') || '0');
    
    return response.status === 204 ? null : await response.json();
  }

  private getOAuthConfig(): OAuthConfig {
    const baseUrl = window.location.origin;
    return {
      clientId: '', // Should be configured
      clientSecret: '', // Should be configured
      redirectUri: `${baseUrl}/integrations/oauth/callback/hubspot`,
      authUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scope: 'contacts crm.objects.deals.read crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.write crm.objects.companies.write crm.objects.contacts.write',
      provider: 'hubspot'
    };
  }

  // Mapping methods
  private mapToHubSpotContact(contact: Partial<Contact>): any {
    return {
      properties: {
        firstname: contact.first_name,
        lastname: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobtitle: contact.title,
        hs_lead_status: contact.lead_source
      }
    };
  }

  private mapFromHubSpotContact(hsContact: HubSpotContact): Contact {
    return {
      id: hsContact.id,
      first_name: hsContact.properties.firstname,
      last_name: hsContact.properties.lastname || '',
      email: hsContact.properties.email || '',
      phone: hsContact.properties.phone,
      company: hsContact.properties.company,
      title: hsContact.properties.jobtitle,
      lead_source: hsContact.properties.hs_lead_status,
      created_at: hsContact.properties.createdate || new Date().toISOString(),
      updated_at: hsContact.properties.lastmodifieddate || new Date().toISOString()
    };
  }

  private mapToHubSpotDeal(deal: Partial<Deal>): any {
    return {
      properties: {
        dealname: deal.name,
        amount: deal.amount?.toString(),
        dealstage: deal.stage,
        closedate: deal.close_date,
        pipeline: 'default'
      }
    };
  }

  private mapFromHubSpotDeal(hsDeal: HubSpotDeal): Deal {
    return {
      id: hsDeal.id,
      name: hsDeal.properties.dealname || '',
      amount: hsDeal.properties.amount ? parseFloat(hsDeal.properties.amount) : undefined,
      stage: hsDeal.properties.dealstage,
      close_date: hsDeal.properties.closedate,
      contact_id: undefined, // Would need to fetch associations
      probability: undefined, // HubSpot doesn't have direct probability field
      created_at: hsDeal.properties.createdate || new Date().toISOString(),
      updated_at: hsDeal.properties.lastmodifieddate || new Date().toISOString()
    };
  }

  private mapToHubSpotTask(task: Partial<Task>): any {
    return {
      properties: {
        hs_task_subject: task.subject,
        hs_task_body: task.description,
        hs_task_due_date: task.due_date,
        hs_task_priority: task.priority,
        hs_task_status: task.status || 'NOT_STARTED',
        hs_task_type: 'TODO'
      }
    };
  }

  // Additional list methods
  private async listCompanies(integrationId: string, limit: number = 100): Promise<any[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/crm/v3/objects/companies?limit=${limit}&properties=name,domain,industry,phone,address,createdate,lastmodifieddate`,
      null,
      accessToken
    );
    
    if (!response?.results) return [];
    
    return response.results.map((company: HubSpotCompany) => ({
      id: company.id,
      name: company.properties.name,
      domain: company.properties.domain,
      industry: company.properties.industry,
      phone: company.properties.phone,
      address: company.properties.address,
      created_at: company.properties.createdate || new Date().toISOString(),
      updated_at: company.properties.lastmodifieddate || new Date().toISOString()
    }));
  }

  private async listTasks(integrationId: string, limit: number = 100): Promise<Task[]> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest(
      'GET',
      `/crm/v3/objects/tasks?limit=${limit}&properties=hs_task_subject,hs_task_body,hs_task_due_date,hs_task_priority,hs_task_status,createdate,lastmodifieddate`,
      null,
      accessToken
    );
    
    if (!response?.results) return [];
    
    return response.results.map((task: HubSpotTask) => ({
      id: task.id,
      subject: task.properties.hs_task_subject || '',
      description: task.properties.hs_task_body,
      due_date: task.properties.hs_task_due_date,
      priority: task.properties.hs_task_priority,
      status: task.properties.hs_task_status,
      contact_id: undefined, // Would need to fetch associations
      deal_id: undefined, // Would need to fetch associations
      created_at: task.properties.createdate || new Date().toISOString(),
      updated_at: task.properties.lastmodifieddate || new Date().toISOString()
    }));
  }

  // Webhook handlers
  private async handleContactCreated(integrationId: string, contactId: string): Promise<void> {
    console.log('HubSpot contact created:', contactId);
    // Implementation depends on specific requirements
  }

  private async handleContactUpdated(integrationId: string, contactId: string, propertyName: string, propertyValue: any): Promise<void> {
    console.log('HubSpot contact updated:', contactId, propertyName, propertyValue);
    // Implementation depends on specific requirements
  }

  private async handleContactDeleted(integrationId: string, contactId: string): Promise<void> {
    console.log('HubSpot contact deleted:', contactId);
    // Implementation depends on specific requirements
  }

  private async handleDealCreated(integrationId: string, dealId: string): Promise<void> {
    console.log('HubSpot deal created:', dealId);
    // Implementation depends on specific requirements
  }

  private async handleDealUpdated(integrationId: string, dealId: string, propertyName: string, propertyValue: any): Promise<void> {
    console.log('HubSpot deal updated:', dealId, propertyName, propertyValue);
    // Implementation depends on specific requirements
  }

  private async handleDealDeleted(integrationId: string, dealId: string): Promise<void> {
    console.log('HubSpot deal deleted:', dealId);
    // Implementation depends on specific requirements
  }

  // Find record for sync
  async findRecord(integrationId: string, record: any): Promise<any> {
    if (record.email) {
      return await this.getContactByEmail(integrationId, record.email);
    }
    return null;
  }

  // Create record for sync
  async createRecord(integrationId: string, record: any): Promise<string> {
    if (record.email && record.last_name) {
      return await this.createContact(integrationId, record);
    }
    throw new Error('Unsupported record type');
  }

  // Update record for sync
  async updateRecord(integrationId: string, recordId: string, record: any): Promise<void> {
    await this.updateContact(integrationId, recordId, record);
  }
}