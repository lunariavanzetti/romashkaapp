import { supabase } from './supabaseClient';
import OpenAIService from './openaiService';
import ContextManager from './contextManager';
import { knowledgeRetrieval as KnowledgeRetrievalEngine } from './knowledgeRetrieval';
import type { ConversationContext, AIResponse } from './openaiService';

export interface WorkflowContext {
  conversationId: string;
  userMessage: string;
  collectedData: Record<string, any>;
  conversationHistory: any[];
  knowledgeBaseResults: any[];
  confidence: number;
  aiResponse?: AIResponse;
  conversationContext?: ConversationContext;
}

export interface NodeExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
  nextNodeId?: string;
  shouldEscalate?: boolean;
  aiResponse?: AIResponse;
}

export class WorkflowEngine {
  private context: WorkflowContext;
  private openaiService: OpenAIService;

  constructor() {
    this.context = {
      conversationId: '',
      userMessage: '',
      collectedData: {},
      conversationHistory: [],
      knowledgeBaseResults: [],
      confidence: 0,
    };
    this.openaiService = new OpenAIService();
  }

  async executeWorkflow(workflowId: string, userMessage: string, conversationId: string): Promise<NodeExecutionResult> {
    try {
      // Get conversation context
      const conversationContext = await ContextManager.getConversationContext(conversationId);
      
      // Initialize context
      this.context = {
        conversationId,
        userMessage,
        collectedData: {},
        conversationHistory: await this.getConversationHistory(conversationId),
        knowledgeBaseResults: await this.searchKnowledgeBase(userMessage, workflowId),
        confidence: 0,
        conversationContext: conversationContext || undefined,
      };

      // Get workflow from database
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error || !workflow) {
        throw new Error('Workflow not found');
      }

      // Execute workflow nodes (using 'nodes' column name from actual database)
      const result = await this.executeNodes(workflow.nodes || workflow.steps, workflow.connections);
      
      // Store execution result
      await this.storeExecutionResult(workflowId, conversationId, result);

      return result;
    } catch (error) {
      console.error('Workflow execution error:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error. Please try again.',
        shouldEscalate: true,
      };
    }
  }

  async searchKnowledgeBase(query: string, projectId: string): Promise<any[]> {
    try {
      // Use the new knowledge retrieval engine
      const matches = await KnowledgeRetrievalEngine.searchKnowledge({
        query,
        language: 'en',
        maxResults: 5
      });
      return matches.map(match => match.item);
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  async getConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      return messages?.reverse() || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  async generateContextualResponse(message: string, context: WorkflowContext): Promise<{ response: string; confidence: number; aiResponse?: AIResponse }> {
    try {
      if (!context.conversationContext) {
        // Create default conversation context
        context.conversationContext = {
          conversationId: context.conversationId,
          messages: context.conversationHistory,
          customerProfile: {
            name: 'Customer',
            email: 'customer@example.com',
            preferences: [],
            history: context.conversationHistory.map(m => m.content),
            language: 'en'
          },
          knowledgeBase: context.knowledgeBaseResults,
          language: 'en',
          sentiment: 'neutral',
          intent: 'general_inquiry',
          confidence: 0.5,
          businessContext: {
            companyName: 'ROMASHKA',
            industry: 'Technology',
            products: ['AI Chat Support', 'Customer Service Platform'],
            policies: ['24/7 Support', 'Money-back guarantee'],
            contactInfo: {
              email: 'support@romashka.com',
              phone: '+1 (555) 123-4567',
              website: 'https://romashka.com',
              address: '123 Tech Street, Silicon Valley, CA'
            }
          }
        };
      }

      // Generate AI response using the new service
      const aiResponse = await this.openaiService.generateResponse(message, context.conversationContext);

      // Update context with AI analysis
      await ContextManager.updateContext(context.conversationId, message, aiResponse);

      return { 
        response: aiResponse.message, 
        confidence: aiResponse.confidence,
        aiResponse 
      };
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return {
        response: 'I apologize, but I need to connect you with a human agent for better assistance.',
        confidence: 0,
      };
    }
  }

  private calculateConfidence(response: string, knowledgeResults: any[]): number {
    // Enhanced confidence calculation
    let confidence = 0.3; // Base confidence
    
    // Boost confidence if knowledge base matches found
    if (knowledgeResults.length > 0) {
      confidence += Math.min(0.4, knowledgeResults.length * 0.1);
    }
    
    // Boost confidence for longer, more detailed responses
    if (response.length > 100) {
      confidence += 0.1;
    }
    
    // Reduce confidence for generic responses
    if (response.includes("I don't know") || response.includes("not sure")) {
      confidence -= 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  async executeTemplate(templateId: string, conversationId: string): Promise<NodeExecutionResult> {
    try {
      // Load template from database
      const { data: template, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        throw new Error('Template not found');
      }

      // Execute template workflow
      return await this.executeWorkflow(template.workflow_id, '', conversationId);
    } catch (error) {
      console.error('Template execution error:', error);
      return {
        success: false,
        message: 'Template execution failed',
        shouldEscalate: true,
      };
    }
  }

  private async executeNodes(nodes: any[], connections: any[]): Promise<NodeExecutionResult> {
    // Find start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      throw new Error('No start node found');
    }

    let currentNode = startNode;
    let result: NodeExecutionResult = { success: true };

    while (currentNode && currentNode.type !== 'end') {
      try {
        result = await this.executeNode(currentNode);
        
        if (!result.success) {
          return result;
        }

        // Find next node based on connections
        const connection = connections.find(conn => conn.source === currentNode.id);
        if (connection) {
          currentNode = nodes.find(node => node.id === connection.target);
        } else {
          break;
        }
      } catch (error) {
        console.error('Node execution error:', error);
        return {
          success: false,
          message: 'Node execution failed',
          shouldEscalate: true,
        };
      }
    }

    return result;
  }

  private async executeNode(node: any): Promise<NodeExecutionResult> {
    switch (node.type) {
      case 'ai_response':
        return await this.executeAIResponseNode(node);
      case 'data_collection':
        return await this.executeDataCollectionNode(node);
      case 'condition':
        return await this.executeConditionNode(node);
      case 'action':
        return await this.executeActionNode(node);
      default:
        return { success: true, message: 'Unknown node type' };
    }
  }

  private async executeAIResponseNode(node: any): Promise<NodeExecutionResult> {
    try {
      const { response, confidence, aiResponse } = await this.generateContextualResponse(
        this.context.userMessage,
        this.context
      );

      // Store the AI response
      await this.storeMessage(this.context.conversationId, 'ai', response);

      // Update context
      this.context.confidence = confidence;
      if (aiResponse) {
        this.context.aiResponse = aiResponse;
      }

      return {
        success: true,
        message: response,
        data: { confidence, aiResponse },
      };
    } catch (error) {
      console.error('AI response node error:', error);
      return {
        success: false,
        message: 'Failed to generate AI response',
        shouldEscalate: true,
      };
    }
  }

  private async executeDataCollectionNode(node: any): Promise<NodeExecutionResult> {
    try {
      const { field, prompt } = node.config;
      
      // Store the prompt message
      await this.storeMessage(this.context.conversationId, 'ai', prompt);

      // In a real implementation, you would wait for user input
      // For now, we'll simulate data collection
      const collectedData = {
        [field]: 'Sample data', // This would come from user input
      };

      this.context.collectedData = { ...this.context.collectedData, ...collectedData };

      return {
        success: true,
        message: prompt,
        data: collectedData,
      };
    } catch (error) {
      console.error('Data collection node error:', error);
      return {
        success: false,
        message: 'Data collection failed',
        shouldEscalate: true,
      };
    }
  }

  private async executeConditionNode(node: any): Promise<NodeExecutionResult> {
    try {
      const { condition, field, operator, value } = node.config;
      
      let result = false;
      const fieldValue = this.context.collectedData[field];

      switch (operator) {
        case 'equals':
          result = fieldValue === value;
          break;
        case 'contains':
          result = String(fieldValue).includes(value);
          break;
        case 'greater_than':
          result = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          result = Number(fieldValue) < Number(value);
          break;
        default:
          result = false;
      }

      return {
        success: true,
        message: `Condition ${condition} evaluated to ${result}`,
        data: { conditionResult: result },
        nextNodeId: result ? node.config.trueNodeId : node.config.falseNodeId,
      };
    } catch (error) {
      console.error('Condition node error:', error);
      return {
        success: false,
        message: 'Condition evaluation failed',
        shouldEscalate: true,
      };
    }
  }

  private async executeActionNode(node: any): Promise<NodeExecutionResult> {
    try {
      const { action, parameters } = node.config;

      switch (action) {
        case 'create_ticket':
          await this.createSupportTicket();
          break;
        case 'notify_agent':
          await this.notifyAgent();
          break;
        case 'save_data':
          await this.saveCollectedData();
          break;
        default:
          console.warn('Unknown action:', action);
      }

      return {
        success: true,
        message: `Action ${action} executed successfully`,
        data: { action, parameters },
      };
    } catch (error) {
      console.error('Action node error:', error);
      return {
        success: false,
        message: 'Action execution failed',
        shouldEscalate: true,
      };
    }
  }

  private async storeMessage(conversationId: string, senderType: string, content: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }

  private async storeExecutionResult(workflowId: string, conversationId: string, result: NodeExecutionResult) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          conversation_id: conversationId,
          status: result.success ? 'completed' : 'failed',
          execution_data: {
            result,
            context: this.context,
          },
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing execution result:', error);
    }
  }

  private async saveCollectedData() {
    // Implementation for saving collected data
    console.log('Saving collected data:', this.context.collectedData);
  }

  private async createSupportTicket() {
    // Implementation for creating support ticket
    console.log('Creating support ticket for conversation:', this.context.conversationId);
  }

  private async notifyAgent() {
    // Implementation for notifying agent
    console.log('Notifying agent about conversation:', this.context.conversationId);
  }
}

export default new WorkflowEngine(); 