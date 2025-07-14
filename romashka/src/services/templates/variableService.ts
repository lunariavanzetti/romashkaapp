import { supabase } from '../supabaseClient';
import { 
  TemplateVariable, 
  VariableSuggestion, 
  VariableSourceConfig,
  ConversationContext,
  ValidationRule 
} from '../../types/responseTemplates';

export class VariableService {
  private readonly SYSTEM_VARIABLES = [
    'current_date',
    'current_time',
    'current_datetime',
    'agent_name',
    'agent_email',
    'company_name',
    'company_website',
    'current_year',
    'current_month',
    'current_day'
  ];

  private readonly CUSTOMER_DATA_VARIABLES = [
    'customer_name',
    'customer_email',
    'customer_phone',
    'customer_company',
    'customer_address',
    'customer_city',
    'customer_country',
    'customer_timezone',
    'customer_language',
    'customer_type'
  ];

  private readonly CONVERSATION_VARIABLES = [
    'conversation_id',
    'conversation_subject',
    'conversation_channel',
    'conversation_priority',
    'conversation_tags',
    'message_count',
    'conversation_duration',
    'last_message_time',
    'conversation_sentiment',
    'conversation_intent'
  ];

  private readonly COMMON_VARIABLES = [
    'order_number',
    'ticket_number',
    'product_name',
    'service_name',
    'issue_description',
    'resolution_steps',
    'next_steps',
    'meeting_link',
    'support_link',
    'knowledge_base_link'
  ];

  async getVariableSuggestions(
    query: string, 
    context?: ConversationContext,
    limit: number = 10
  ): Promise<VariableSuggestion[]> {
    const suggestions: VariableSuggestion[] = [];
    
    // Get system variable suggestions
    const systemSuggestions = this.getSystemVariableSuggestions(query);
    suggestions.push(...systemSuggestions);
    
    // Get customer data variable suggestions
    const customerSuggestions = this.getCustomerDataVariableSuggestions(query, context);
    suggestions.push(...customerSuggestions);
    
    // Get conversation variable suggestions
    const conversationSuggestions = this.getConversationVariableSuggestions(query, context);
    suggestions.push(...conversationSuggestions);
    
    // Get common variable suggestions
    const commonSuggestions = this.getCommonVariableSuggestions(query);
    suggestions.push(...commonSuggestions);
    
    // Get custom variable suggestions from database
    const customSuggestions = await this.getCustomVariableSuggestions(query);
    suggestions.push(...customSuggestions);
    
    // Filter and sort suggestions
    const filteredSuggestions = suggestions
      .filter(suggestion => 
        suggestion.name.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by relevance (confidence * usage_frequency)
        const aRelevance = a.confidence * a.usage_frequency;
        const bRelevance = b.confidence * b.usage_frequency;
        return bRelevance - aRelevance;
      })
      .slice(0, limit);
    
    return filteredSuggestions;
  }

  private getSystemVariableSuggestions(query: string): VariableSuggestion[] {
    return this.SYSTEM_VARIABLES.map(name => ({
      name,
      type: this.getVariableType(name),
      description: this.getVariableDescription(name),
      example_value: this.getExampleValue(name),
      source: 'system',
      confidence: this.calculateConfidence(name, query),
      usage_frequency: this.getUsageFrequency(name)
    }));
  }

  private getCustomerDataVariableSuggestions(query: string, context?: ConversationContext): VariableSuggestion[] {
    return this.CUSTOMER_DATA_VARIABLES.map(name => ({
      name,
      type: this.getVariableType(name),
      description: this.getVariableDescription(name),
      example_value: this.getExampleValue(name, context),
      source: 'customer_data',
      confidence: this.calculateConfidence(name, query),
      usage_frequency: this.getUsageFrequency(name)
    }));
  }

  private getConversationVariableSuggestions(query: string, context?: ConversationContext): VariableSuggestion[] {
    return this.CONVERSATION_VARIABLES.map(name => ({
      name,
      type: this.getVariableType(name),
      description: this.getVariableDescription(name),
      example_value: this.getExampleValue(name, context),
      source: 'conversation_context',
      confidence: this.calculateConfidence(name, query),
      usage_frequency: this.getUsageFrequency(name)
    }));
  }

  private getCommonVariableSuggestions(query: string): VariableSuggestion[] {
    return this.COMMON_VARIABLES.map(name => ({
      name,
      type: this.getVariableType(name),
      description: this.getVariableDescription(name),
      example_value: this.getExampleValue(name),
      source: 'manual',
      confidence: this.calculateConfidence(name, query),
      usage_frequency: this.getUsageFrequency(name)
    }));
  }

  private async getCustomVariableSuggestions(query: string): Promise<VariableSuggestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: variables, error } = await supabase
        .from('template_variables')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`);

      if (error) throw error;

      return (variables || []).map(variable => ({
        name: variable.name,
        type: variable.type,
        description: variable.description || '',
        example_value: variable.default_value || '',
        source: variable.source,
        confidence: 0.8,
        usage_frequency: 0.5
      }));
    } catch (error) {
      console.error('Error fetching custom variable suggestions:', error);
      return [];
    }
  }

  private getVariableType(name: string): string {
    const typeMap: Record<string, string> = {
      'current_date': 'date',
      'current_time': 'text',
      'current_datetime': 'date',
      'current_year': 'number',
      'current_month': 'number',
      'current_day': 'number',
      'customer_email': 'email',
      'customer_phone': 'phone',
      'agent_email': 'email',
      'company_website': 'url',
      'meeting_link': 'url',
      'support_link': 'url',
      'knowledge_base_link': 'url',
      'message_count': 'number',
      'conversation_duration': 'number'
    };

    return typeMap[name] || 'text';
  }

  private getVariableDescription(name: string): string {
    const descriptionMap: Record<string, string> = {
      'current_date': 'Current date in YYYY-MM-DD format',
      'current_time': 'Current time in HH:MM format',
      'current_datetime': 'Current date and time',
      'current_year': 'Current year',
      'current_month': 'Current month number',
      'current_day': 'Current day of month',
      'agent_name': 'Name of the current agent',
      'agent_email': 'Email address of the current agent',
      'company_name': 'Name of the company',
      'company_website': 'Company website URL',
      'customer_name': 'Customer\'s full name',
      'customer_email': 'Customer\'s email address',
      'customer_phone': 'Customer\'s phone number',
      'customer_company': 'Customer\'s company name',
      'customer_address': 'Customer\'s address',
      'customer_city': 'Customer\'s city',
      'customer_country': 'Customer\'s country',
      'customer_timezone': 'Customer\'s timezone',
      'customer_language': 'Customer\'s preferred language',
      'customer_type': 'Customer type (new, returning, premium, etc.)',
      'conversation_id': 'Unique conversation identifier',
      'conversation_subject': 'Subject or topic of the conversation',
      'conversation_channel': 'Channel used for the conversation',
      'conversation_priority': 'Priority level of the conversation',
      'conversation_tags': 'Tags associated with the conversation',
      'message_count': 'Number of messages in the conversation',
      'conversation_duration': 'Duration of the conversation in minutes',
      'last_message_time': 'Time of the last message',
      'conversation_sentiment': 'Overall sentiment of the conversation',
      'conversation_intent': 'Intent detected in the conversation',
      'order_number': 'Order or reference number',
      'ticket_number': 'Support ticket number',
      'product_name': 'Name of the product',
      'service_name': 'Name of the service',
      'issue_description': 'Description of the customer issue',
      'resolution_steps': 'Steps to resolve the issue',
      'next_steps': 'Next steps for the customer',
      'meeting_link': 'Link to schedule a meeting',
      'support_link': 'Link to support resources',
      'knowledge_base_link': 'Link to knowledge base articles'
    };

    return descriptionMap[name] || `Variable: ${name}`;
  }

  private getExampleValue(name: string, context?: ConversationContext): string {
    const now = new Date();
    
    const exampleMap: Record<string, string> = {
      'current_date': now.toISOString().split('T')[0],
      'current_time': now.toTimeString().split(' ')[0].slice(0, 5),
      'current_datetime': now.toISOString(),
      'current_year': now.getFullYear().toString(),
      'current_month': (now.getMonth() + 1).toString(),
      'current_day': now.getDate().toString(),
      'agent_name': 'John Smith',
      'agent_email': 'john.smith@company.com',
      'company_name': 'ROMASHKA',
      'company_website': 'https://romashka.com',
      'customer_name': context?.customer_data?.name || 'Jane Doe',
      'customer_email': context?.customer_data?.email || 'jane.doe@example.com',
      'customer_phone': context?.customer_data?.phone || '+1-555-123-4567',
      'customer_company': context?.customer_data?.company || 'Example Corp',
      'customer_address': context?.customer_data?.address || '123 Main St',
      'customer_city': context?.customer_data?.city || 'New York',
      'customer_country': context?.customer_data?.country || 'USA',
      'customer_timezone': context?.customer_data?.timezone || 'EST',
      'customer_language': context?.customer_data?.language || 'en',
      'customer_type': context?.customer_type || 'returning',
      'conversation_id': context?.customer_id || 'conv_123456',
      'conversation_subject': 'Support Request',
      'conversation_channel': context?.channel || 'chat',
      'conversation_priority': 'medium',
      'conversation_tags': 'support, billing',
      'message_count': context?.previous_interactions?.toString() || '5',
      'conversation_duration': '15',
      'last_message_time': now.toISOString(),
      'conversation_sentiment': context?.sentiment || 'positive',
      'conversation_intent': context?.intent || 'support',
      'order_number': 'ORD-2024-001',
      'ticket_number': 'TKT-2024-001',
      'product_name': 'Pro Plan',
      'service_name': 'Customer Support',
      'issue_description': 'Unable to access account',
      'resolution_steps': '1. Reset password\n2. Clear browser cache\n3. Try logging in again',
      'next_steps': 'Please follow the resolution steps and contact us if the issue persists',
      'meeting_link': 'https://calendar.app/meeting-link',
      'support_link': 'https://support.romashka.com',
      'knowledge_base_link': 'https://kb.romashka.com'
    };

    return exampleMap[name] || `Example ${name}`;
  }

  private calculateConfidence(name: string, query: string): number {
    const queryLower = query.toLowerCase();
    const nameLower = name.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return 1.0;
    
    // Starts with query
    if (nameLower.startsWith(queryLower)) return 0.9;
    
    // Contains query
    if (nameLower.includes(queryLower)) return 0.7;
    
    // Semantic similarity (simple word matching)
    const queryWords = queryLower.split(/[_\s]+/);
    const nameWords = nameLower.split(/[_\s]+/);
    
    const commonWords = queryWords.filter(word => nameWords.includes(word));
    const similarity = commonWords.length / Math.max(queryWords.length, nameWords.length);
    
    return similarity * 0.6;
  }

  private getUsageFrequency(name: string): number {
    // Based on common usage patterns
    const frequencyMap: Record<string, number> = {
      'customer_name': 0.9,
      'customer_email': 0.8,
      'agent_name': 0.7,
      'current_date': 0.6,
      'order_number': 0.5,
      'ticket_number': 0.5,
      'customer_company': 0.4,
      'conversation_id': 0.3,
      'product_name': 0.3,
      'service_name': 0.3,
      'current_time': 0.2,
      'customer_phone': 0.2,
      'meeting_link': 0.2,
      'support_link': 0.2
    };

    return frequencyMap[name] || 0.1;
  }

  async resolveVariableValue(
    variable: TemplateVariable,
    context: ConversationContext,
    customValues?: Record<string, any>
  ): Promise<any> {
    // Check custom values first
    if (customValues && customValues[variable.name] !== undefined) {
      return customValues[variable.name];
    }

    // Resolve based on variable source
    switch (variable.source) {
      case 'system':
        return this.resolveSystemVariable(variable.name);
      
      case 'customer_data':
        return this.resolveCustomerDataVariable(variable.name, context);
      
      case 'conversation_context':
        return this.resolveConversationVariable(variable.name, context);
      
      case 'external_api':
        return this.resolveExternalApiVariable(variable, context);
      
      case 'manual':
      default:
        return variable.default_value || '';
    }
  }

  private resolveSystemVariable(name: string): any {
    const now = new Date();
    
    switch (name) {
      case 'current_date':
        return now.toISOString().split('T')[0];
      case 'current_time':
        return now.toTimeString().split(' ')[0].slice(0, 5);
      case 'current_datetime':
        return now.toISOString();
      case 'current_year':
        return now.getFullYear();
      case 'current_month':
        return now.getMonth() + 1;
      case 'current_day':
        return now.getDate();
      case 'agent_name':
        return 'Current Agent'; // Would be resolved from user context
      case 'agent_email':
        return 'agent@romashka.com'; // Would be resolved from user context
      case 'company_name':
        return 'ROMASHKA';
      case 'company_website':
        return 'https://romashka.com';
      default:
        return '';
    }
  }

  private resolveCustomerDataVariable(name: string, context: ConversationContext): any {
    const customerData = context.customer_data || {};
    
    switch (name) {
      case 'customer_name':
        return customerData.name || customerData.full_name || '';
      case 'customer_email':
        return customerData.email || '';
      case 'customer_phone':
        return customerData.phone || '';
      case 'customer_company':
        return customerData.company || '';
      case 'customer_address':
        return customerData.address || '';
      case 'customer_city':
        return customerData.city || '';
      case 'customer_country':
        return customerData.country || '';
      case 'customer_timezone':
        return customerData.timezone || '';
      case 'customer_language':
        return customerData.language || 'en';
      case 'customer_type':
        return context.customer_type || 'new';
      default:
        return customerData[name] || '';
    }
  }

  private resolveConversationVariable(name: string, context: ConversationContext): any {
    switch (name) {
      case 'conversation_id':
        return context.customer_id || '';
      case 'conversation_subject':
        return context.intent || '';
      case 'conversation_channel':
        return context.channel || '';
      case 'conversation_priority':
        return context.urgency || 'medium';
      case 'conversation_tags':
        return context.customer_data?.tags?.join(', ') || '';
      case 'message_count':
        return context.previous_interactions || 0;
      case 'conversation_duration':
        return 0; // Would be calculated from conversation start time
      case 'last_message_time':
        return new Date().toISOString();
      case 'conversation_sentiment':
        return context.sentiment || 'neutral';
      case 'conversation_intent':
        return context.intent || '';
      default:
        return '';
    }
  }

  private async resolveExternalApiVariable(
    variable: TemplateVariable,
    context: ConversationContext
  ): Promise<any> {
    if (!variable.source_config?.api_endpoint) {
      return variable.default_value || '';
    }

    try {
      const response = await fetch(variable.source_config.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variable_name: variable.name,
          context: context,
          params: variable.source_config.api_params || {}
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.value || variable.default_value || '';
    } catch (error) {
      console.error('Error resolving external API variable:', error);
      return variable.default_value || '';
    }
  }

  async validateVariableValue(
    variable: TemplateVariable,
    value: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check if required
    if (variable.required && (value === null || value === undefined || value === '')) {
      errors.push(`${variable.name} is required`);
    }

    // Validate based on type
    switch (variable.type) {
      case 'email':
        if (value && !this.isValidEmail(value)) {
          errors.push(`${variable.name} must be a valid email address`);
        }
        break;
      
      case 'phone':
        if (value && !this.isValidPhone(value)) {
          errors.push(`${variable.name} must be a valid phone number`);
        }
        break;
      
      case 'url':
        if (value && !this.isValidUrl(value)) {
          errors.push(`${variable.name} must be a valid URL`);
        }
        break;
      
      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push(`${variable.name} must be a valid number`);
        }
        break;
      
      case 'date':
        if (value && !this.isValidDate(value)) {
          errors.push(`${variable.name} must be a valid date`);
        }
        break;
    }

    // Apply validation rules
    if (variable.validation_rules) {
      for (const rule of variable.validation_rules) {
        const ruleError = this.validateRule(variable.name, value, rule);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateRule(variableName: string, value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        if (!value || value === '') {
          return rule.message || `${variableName} is required`;
        }
        break;
      
      case 'min_length':
        if (typeof value === 'string' && value.length < Number(rule.value)) {
          return rule.message || `${variableName} must be at least ${rule.value} characters`;
        }
        break;
      
      case 'max_length':
        if (typeof value === 'string' && value.length > Number(rule.value)) {
          return rule.message || `${variableName} must be at most ${rule.value} characters`;
        }
        break;
      
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(String(rule.value)).test(value)) {
          return rule.message || `${variableName} format is invalid`;
        }
        break;
      
      case 'range':
        const numValue = Number(value);
        const [min, max] = String(rule.value).split(',').map(Number);
        if (numValue < min || numValue > max) {
          return rule.message || `${variableName} must be between ${min} and ${max}`;
        }
        break;
    }
    
    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  async getVariableUsageStats(variableName: string): Promise<{
    total_uses: number;
    unique_templates: number;
    avg_effectiveness: number;
    last_used: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // This would require a more complex query to get actual usage stats
      // For now, return mock data
      return {
        total_uses: 0,
        unique_templates: 0,
        avg_effectiveness: 0,
        last_used: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting variable usage stats:', error);
      return {
        total_uses: 0,
        unique_templates: 0,
        avg_effectiveness: 0,
        last_used: new Date().toISOString()
      };
    }
  }

  async bulkResolveVariables(
    variables: TemplateVariable[],
    context: ConversationContext,
    customValues?: Record<string, any>
  ): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {};
    
    for (const variable of variables) {
      try {
        resolved[variable.name] = await this.resolveVariableValue(
          variable,
          context,
          customValues
        );
      } catch (error) {
        console.error(`Error resolving variable ${variable.name}:`, error);
        resolved[variable.name] = variable.default_value || '';
      }
    }
    
    return resolved;
  }
}