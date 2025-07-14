import { oauthManager, OAuthConfig } from '../oauthManager';
import type { 
  Contact, 
  Lead, 
  Deal, 
  Task, 
  SalesforceConfig,
  Integration 
} from '../../../types/integrations';

export interface SalesforceContact {
  Id: string;
  FirstName?: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Account?: { Name: string };
  Title?: string;
  LeadSource?: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceLead {
  Id: string;
  FirstName?: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Company: string;
  Title?: string;
  LeadSource?: string;
  Status: string;
  Rating?: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount?: number;
  StageName: string;
  CloseDate: string;
  ContactId?: string;
  Probability?: number;
  LeadSource?: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceTask {
  Id: string;
  Subject: string;
  Description?: string;
  ActivityDate?: string;
  Priority: string;
  Status: string;
  WhoId?: string; // Contact or Lead ID
  WhatId?: string; // Account or Opportunity ID
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}

export interface SalesforceError {
  message: string;
  errorCode: string;
  fields?: string[];
}

export class SalesforceService {
  private readonly baseUrl: string;
  private rateLimitRemaining: number = 100;
  private rateLimitReset: number = 0;

  constructor(private instanceUrl: string = 'https://login.salesforce.com') {
    this.baseUrl = `${instanceUrl}/services/data/v57.0`;
  }

  // Authentication methods
  async authenticate(integrationId: string): Promise<string> {
    const config = this.getOAuthConfig();
    return await oauthManager.getValidAccessToken(integrationId, config);
  }

  async testConnection(integrationId: string): Promise<boolean> {
    try {
      const accessToken = await this.authenticate(integrationId);
      
      const response = await fetch(`${this.baseUrl}/sobjects/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }

  // Contact operations
  async createContact(integrationId: string, contactData: Partial<Contact>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceContact = this.mapToSalesforceContact(contactData);
    
    const response = await this.makeRequest('POST', '/sobjects/Contact/', salesforceContact, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to create contact: ${response.errors?.[0]?.message}`);
    }
    
    return response.id;
  }

  async updateContact(integrationId: string, contactId: string, updates: Partial<Contact>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceUpdates = this.mapToSalesforceContact(updates);
    
    const response = await this.makeRequest('PATCH', `/sobjects/Contact/${contactId}`, salesforceUpdates, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to update contact: ${response.errors?.[0]?.message}`);
    }
  }

  async getContact(integrationId: string, contactId: string): Promise<Contact | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await this.makeRequest('GET', `/sobjects/Contact/${contactId}`, null, accessToken);
    
    if (!response) return null;
    
    return this.mapFromSalesforceContact(response);
  }

  async getContactByEmail(integrationId: string, email: string): Promise<Contact | null> {
    const accessToken = await this.authenticate(integrationId);
    
    const query = `SELECT Id, FirstName, LastName, Email, Phone, Account.Name, Title, LeadSource, CreatedDate, LastModifiedDate FROM Contact WHERE Email = '${email.replace(/'/g, "\\'")}'`;
    
    const result = await this.query<SalesforceContact>(integrationId, query);
    
    if (result.records.length === 0) return null;
    
    return this.mapFromSalesforceContact(result.records[0]);
  }

  async listContacts(integrationId: string, limit: number = 100, offset: number = 0): Promise<Contact[]> {
    const query = `SELECT Id, FirstName, LastName, Email, Phone, Account.Name, Title, LeadSource, CreatedDate, LastModifiedDate FROM Contact ORDER BY CreatedDate DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const result = await this.query<SalesforceContact>(integrationId, query);
    
    return result.records.map(contact => this.mapFromSalesforceContact(contact));
  }

  // Lead operations
  async createLead(integrationId: string, leadData: Partial<Lead>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceLead = this.mapToSalesforceLead(leadData);
    
    const response = await this.makeRequest('POST', '/sobjects/Lead/', salesforceLead, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to create lead: ${response.errors?.[0]?.message}`);
    }
    
    return response.id;
  }

  async updateLead(integrationId: string, leadId: string, updates: Partial<Lead>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceUpdates = this.mapToSalesforceLead(updates);
    
    const response = await this.makeRequest('PATCH', `/sobjects/Lead/${leadId}`, salesforceUpdates, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to update lead: ${response.errors?.[0]?.message}`);
    }
  }

  async convertLead(integrationId: string, leadId: string, contactId?: string, accountId?: string): Promise<{ contactId: string; accountId: string; opportunityId?: string }> {
    const accessToken = await this.authenticate(integrationId);
    
    const conversionData = {
      leadId,
      contactId,
      accountId,
      convertedStatus: 'Qualified',
      doNotCreateOpportunity: false
    };
    
    const response = await this.makeRequest('POST', '/sobjects/LeadConvert/', conversionData, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to convert lead: ${response.errors?.[0]?.message}`);
    }
    
    return {
      contactId: response.contactId,
      accountId: response.accountId,
      opportunityId: response.opportunityId
    };
  }

  // Opportunity operations
  async createOpportunity(integrationId: string, opportunityData: Partial<Deal>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceOpportunity = this.mapToSalesforceOpportunity(opportunityData);
    
    const response = await this.makeRequest('POST', '/sobjects/Opportunity/', salesforceOpportunity, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to create opportunity: ${response.errors?.[0]?.message}`);
    }
    
    return response.id;
  }

  async updateOpportunity(integrationId: string, opportunityId: string, updates: Partial<Deal>): Promise<void> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceUpdates = this.mapToSalesforceOpportunity(updates);
    
    const response = await this.makeRequest('PATCH', `/sobjects/Opportunity/${opportunityId}`, salesforceUpdates, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to update opportunity: ${response.errors?.[0]?.message}`);
    }
  }

  // Task operations
  async createTask(integrationId: string, taskData: Partial<Task>): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const salesforceTask = this.mapToSalesforceTask(taskData);
    
    const response = await this.makeRequest('POST', '/sobjects/Task/', salesforceTask, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to create task: ${response.errors?.[0]?.message}`);
    }
    
    return response.id;
  }

  async addNote(integrationId: string, parentId: string, noteBody: string): Promise<string> {
    const accessToken = await this.authenticate(integrationId);
    
    const noteData = {
      ParentId: parentId,
      Body: noteBody,
      Title: 'Note from ROMASHKA'
    };
    
    const response = await this.makeRequest('POST', '/sobjects/Note/', noteData, accessToken);
    
    if (!response.success) {
      throw new Error(`Failed to create note: ${response.errors?.[0]?.message}`);
    }
    
    return response.id;
  }

  // Query operations
  async query<T>(integrationId: string, soql: string): Promise<SalesforceQueryResult<T>> {
    const accessToken = await this.authenticate(integrationId);
    
    const encodedQuery = encodeURIComponent(soql);
    
    const response = await this.makeRequest('GET', `/query?q=${encodedQuery}`, null, accessToken);
    
    return response;
  }

  async queryMore<T>(integrationId: string, nextRecordsUrl: string): Promise<SalesforceQueryResult<T>> {
    const accessToken = await this.authenticate(integrationId);
    
    const response = await fetch(`${this.instanceUrl}${nextRecordsUrl}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Query more failed: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Bulk operations
  async bulkImport(integrationId: string, objectType: string, records: any[]): Promise<{ success: boolean; errors: string[] }> {
    const accessToken = await this.authenticate(integrationId);
    const errors: string[] = [];
    const batchSize = 200; // Salesforce limit
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const response = await this.makeRequest('POST', `/sobjects/${objectType}/`, batch, accessToken);
        
        if (!response.success) {
          errors.push(`Batch ${i / batchSize + 1}: ${response.errors?.[0]?.message || 'Unknown error'}`);
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
          case 'leads':
            data = await this.listLeads(integrationId, 1000);
            break;
          case 'opportunities':
            data = await this.listOpportunities(integrationId, 1000);
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
      const { sobject, event } = payload;
      
      switch (event) {
        case 'created':
          await this.handleRecordCreated(integrationId, sobject);
          break;
        case 'updated':
          await this.handleRecordUpdated(integrationId, sobject);
          break;
        case 'deleted':
          await this.handleRecordDeleted(integrationId, sobject);
          break;
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
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
    
    if (data && (method === 'POST' || method === 'PATCH')) {
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
      const error = await response.json();
      throw new Error(`Salesforce API error: ${error.message || response.statusText}`);
    }
    
    // Update rate limit info
    this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '100');
    this.rateLimitReset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');
    
    return response.status === 204 ? null : await response.json();
  }

  private getOAuthConfig(): OAuthConfig {
    const baseUrl = window.location.origin;
    return {
      clientId: '', // Should be configured
      clientSecret: '', // Should be configured
      redirectUri: `${baseUrl}/integrations/oauth/callback/salesforce`,
      authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scope: 'api refresh_token offline_access',
      provider: 'salesforce'
    };
  }

  // Mapping methods
  private mapToSalesforceContact(contact: Partial<Contact>): any {
    return {
      FirstName: contact.first_name,
      LastName: contact.last_name,
      Email: contact.email,
      Phone: contact.phone,
      Title: contact.title,
      LeadSource: contact.lead_source
    };
  }

  private mapFromSalesforceContact(sfContact: SalesforceContact): Contact {
    return {
      id: sfContact.Id,
      first_name: sfContact.FirstName,
      last_name: sfContact.LastName,
      email: sfContact.Email,
      phone: sfContact.Phone,
      company: sfContact.Account?.Name,
      title: sfContact.Title,
      lead_source: sfContact.LeadSource,
      created_at: sfContact.CreatedDate,
      updated_at: sfContact.LastModifiedDate
    };
  }

  private mapToSalesforceLead(lead: Partial<Lead>): any {
    return {
      FirstName: lead.first_name,
      LastName: lead.last_name,
      Email: lead.email,
      Phone: lead.phone,
      Company: lead.company,
      Title: lead.title,
      LeadSource: lead.lead_source,
      Status: lead.status || 'Open - Not Contacted',
      Rating: lead.score ? (lead.score > 80 ? 'Hot' : lead.score > 50 ? 'Warm' : 'Cold') : 'Cold'
    };
  }

  private mapToSalesforceOpportunity(deal: Partial<Deal>): any {
    return {
      Name: deal.name,
      Amount: deal.amount,
      StageName: deal.stage || 'Prospecting',
      CloseDate: deal.close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ContactId: deal.contact_id,
      Probability: deal.probability || 10
    };
  }

  private mapToSalesforceTask(task: Partial<Task>): any {
    return {
      Subject: task.subject,
      Description: task.description,
      ActivityDate: task.due_date,
      Priority: task.priority || 'Normal',
      Status: task.status || 'Not Started',
      WhoId: task.contact_id,
      WhatId: task.deal_id
    };
  }

  // Additional list methods
  private async listLeads(integrationId: string, limit: number = 100): Promise<Lead[]> {
    const query = `SELECT Id, FirstName, LastName, Email, Phone, Company, Title, LeadSource, Status, Rating, CreatedDate, LastModifiedDate FROM Lead ORDER BY CreatedDate DESC LIMIT ${limit}`;
    
    const result = await this.query<SalesforceLead>(integrationId, query);
    
    return result.records.map(lead => ({
      id: lead.Id,
      first_name: lead.FirstName,
      last_name: lead.LastName,
      email: lead.Email,
      phone: lead.Phone,
      company: lead.Company,
      title: lead.Title,
      lead_source: lead.LeadSource,
      status: lead.Status,
      score: lead.Rating === 'Hot' ? 90 : lead.Rating === 'Warm' ? 70 : 30,
      created_at: lead.CreatedDate,
      updated_at: lead.LastModifiedDate
    }));
  }

  private async listOpportunities(integrationId: string, limit: number = 100): Promise<Deal[]> {
    const query = `SELECT Id, Name, Amount, StageName, CloseDate, ContactId, Probability, LeadSource, CreatedDate, LastModifiedDate FROM Opportunity ORDER BY CreatedDate DESC LIMIT ${limit}`;
    
    const result = await this.query<SalesforceOpportunity>(integrationId, query);
    
    return result.records.map(opp => ({
      id: opp.Id,
      name: opp.Name,
      amount: opp.Amount,
      stage: opp.StageName,
      close_date: opp.CloseDate,
      contact_id: opp.ContactId,
      probability: opp.Probability,
      created_at: opp.CreatedDate,
      updated_at: opp.LastModifiedDate
    }));
  }

  private async listTasks(integrationId: string, limit: number = 100): Promise<Task[]> {
    const query = `SELECT Id, Subject, Description, ActivityDate, Priority, Status, WhoId, WhatId, CreatedDate, LastModifiedDate FROM Task ORDER BY CreatedDate DESC LIMIT ${limit}`;
    
    const result = await this.query<SalesforceTask>(integrationId, query);
    
    return result.records.map(task => ({
      id: task.Id,
      subject: task.Subject,
      description: task.Description,
      due_date: task.ActivityDate,
      priority: task.Priority,
      status: task.Status,
      contact_id: task.WhoId,
      deal_id: task.WhatId,
      created_at: task.CreatedDate,
      updated_at: task.LastModifiedDate
    }));
  }

  // Webhook handlers
  private async handleRecordCreated(integrationId: string, sobject: any): Promise<void> {
    // Implementation depends on specific requirements
    console.log('Record created:', sobject);
  }

  private async handleRecordUpdated(integrationId: string, sobject: any): Promise<void> {
    // Implementation depends on specific requirements
    console.log('Record updated:', sobject);
  }

  private async handleRecordDeleted(integrationId: string, sobject: any): Promise<void> {
    // Implementation depends on specific requirements
    console.log('Record deleted:', sobject);
  }

  // Find record for sync
  async findRecord(integrationId: string, record: any): Promise<any> {
    // Implementation depends on record type and matching criteria
    if (record.email) {
      return await this.getContactByEmail(integrationId, record.email);
    }
    return null;
  }

  // Create record for sync
  async createRecord(integrationId: string, record: any): Promise<string> {
    // Implementation depends on record type
    if (record.email && record.last_name) {
      return await this.createContact(integrationId, record);
    }
    throw new Error('Unsupported record type');
  }

  // Update record for sync
  async updateRecord(integrationId: string, recordId: string, record: any): Promise<void> {
    // Implementation depends on record type
    await this.updateContact(integrationId, recordId, record);
  }
}