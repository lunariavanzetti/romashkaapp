import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';

export interface ProcessingResult {
  conversationCount: number;
  validRecords: number;
  invalidRecords: number;
  categories: string[];
  errors?: string[];
}

export interface ConversationRecord {
  id: string;
  userMessage: string;
  aiResponse: string;
  rating?: number;
  category?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface TrainingDataStructure {
  conversations?: ConversationRecord[];
  records?: any[];
  metadata?: {
    source: string;
    processedAt: string;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
  };
}

class DataProcessingService {
  private static instance: DataProcessingService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY!,
      dangerouslyAllowBrowser: true,
    });
  }

  static getInstance(): DataProcessingService {
    if (!DataProcessingService.instance) {
      DataProcessingService.instance = new DataProcessingService();
    }
    return DataProcessingService.instance;
  }

  /**
   * Process training file based on file type
   */
  async processTrainingFile(
    fileContent: string,
    fileType: string,
    fileName: string
  ): Promise<ProcessingResult> {
    try {
      let data: any;
      
      // Parse file content based on type
      switch (fileType) {
        case 'text/csv':
          data = await this.parseCSV(fileContent);
          break;
        case 'application/json':
          data = JSON.parse(fileContent);
          break;
        case 'text/plain':
          data = await this.parseTextFile(fileContent);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Process and validate data
      const processedData = await this.processAndValidateData(data);
      
      // Store in database
      await this.storeTrainingData(fileName, fileType, processedData);

      return {
        conversationCount: processedData.conversations?.length || 0,
        validRecords: processedData.metadata?.validRecords || 0,
        invalidRecords: processedData.metadata?.invalidRecords || 0,
        categories: this.extractCategories(processedData),
      };
    } catch (error) {
      console.error('Error processing training file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file content
   */
  private async parseCSV(content: string): Promise<any> {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    return { records };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse text file as unstructured conversation data
   */
  private async parseTextFile(content: string): Promise<any> {
    try {
      // Use AI to extract conversation data from text
      const prompt = `
Extract conversation data from this text file. Look for patterns like:
- Question and answer pairs
- User messages and AI responses
- Customer support conversations

Text content:
${content.substring(0, 2000)}...

Return a JSON object with:
{
  "conversations": [
    {
      "userMessage": "user's question or message",
      "aiResponse": "AI or agent response",
      "category": "topic category if identifiable"
    }
  ]
}

Extract up to 50 conversations.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const extractedData = JSON.parse(response.choices[0].message.content || '{"conversations": []}');
      return extractedData;
    } catch (error) {
      console.error('Error parsing text file:', error);
      // Fallback: split by lines and create simple conversation pairs
      const lines = content.split('\n').filter(line => line.trim());
      const conversations = [];
      
      for (let i = 0; i < lines.length - 1; i += 2) {
        if (lines[i] && lines[i + 1]) {
          conversations.push({
            userMessage: lines[i],
            aiResponse: lines[i + 1],
            category: 'general',
          });
        }
      }
      
      return { conversations };
    }
  }

  /**
   * Process and validate data structure
   */
  private async processAndValidateData(data: any): Promise<TrainingDataStructure> {
    const conversations: ConversationRecord[] = [];
    let validRecords = 0;
    let invalidRecords = 0;
    const errors: string[] = [];

    // Handle different data structures
    if (data.conversations) {
      // Already in conversation format
      for (const conv of data.conversations) {
        const processed = this.processConversationRecord(conv);
        if (processed) {
          conversations.push(processed);
          validRecords++;
        } else {
          invalidRecords++;
          errors.push(`Invalid conversation record: ${JSON.stringify(conv)}`);
        }
      }
    } else if (data.records) {
      // CSV format with records
      for (const record of data.records) {
        const processed = this.processCSVRecord(record);
        if (processed) {
          conversations.push(processed);
          validRecords++;
        } else {
          invalidRecords++;
          errors.push(`Invalid CSV record: ${JSON.stringify(record)}`);
        }
      }
    } else {
      throw new Error('Unrecognized data format');
    }

    // Enhance data with AI analysis
    const enhancedConversations = await this.enhanceConversations(conversations);

    return {
      conversations: enhancedConversations,
      metadata: {
        source: 'user_upload',
        processedAt: new Date().toISOString(),
        totalRecords: validRecords + invalidRecords,
        validRecords,
        invalidRecords,
      },
    };
  }

  /**
   * Process individual conversation record
   */
  private processConversationRecord(conv: any): ConversationRecord | null {
    if (!conv.userMessage || !conv.aiResponse) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      userMessage: String(conv.userMessage).trim(),
      aiResponse: String(conv.aiResponse).trim(),
      rating: conv.rating ? Number(conv.rating) : undefined,
      category: conv.category || 'general',
      timestamp: conv.timestamp || new Date().toISOString(),
      metadata: conv.metadata || {},
    };
  }

  /**
   * Process CSV record into conversation format
   */
  private processCSVRecord(record: any): ConversationRecord | null {
    // Try to identify user message and AI response fields
    const userFields = ['user_message', 'user', 'question', 'input', 'prompt'];
    const aiFields = ['ai_response', 'ai', 'answer', 'response', 'output'];
    const ratingFields = ['rating', 'score', 'satisfaction'];
    const categoryFields = ['category', 'topic', 'type'];

    let userMessage = '';
    let aiResponse = '';
    let rating: number | undefined;
    let category = 'general';

    // Find user message
    for (const field of userFields) {
      if (record[field]) {
        userMessage = String(record[field]).trim();
        break;
      }
    }

    // Find AI response
    for (const field of aiFields) {
      if (record[field]) {
        aiResponse = String(record[field]).trim();
        break;
      }
    }

    // Find rating
    for (const field of ratingFields) {
      if (record[field]) {
        const ratingValue = Number(record[field]);
        if (!isNaN(ratingValue)) {
          rating = ratingValue;
        }
        break;
      }
    }

    // Find category
    for (const field of categoryFields) {
      if (record[field]) {
        category = String(record[field]).trim();
        break;
      }
    }

    if (!userMessage || !aiResponse) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      userMessage,
      aiResponse,
      rating,
      category,
      timestamp: new Date().toISOString(),
      metadata: record,
    };
  }

  /**
   * Enhance conversations with AI analysis
   */
  private async enhanceConversations(conversations: ConversationRecord[]): Promise<ConversationRecord[]> {
    const enhanced = [];
    
    // Process in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize);
      const enhancedBatch = await Promise.all(
        batch.map(conv => this.enhanceConversation(conv))
      );
      enhanced.push(...enhancedBatch);
    }

    return enhanced;
  }

  /**
   * Enhance individual conversation with AI analysis
   */
  private async enhanceConversation(conversation: ConversationRecord): Promise<ConversationRecord> {
    try {
      const prompt = `
Analyze this conversation and provide enhancements:

User: ${conversation.userMessage}
AI: ${conversation.aiResponse}

Provide a JSON response with:
{
  "category": "appropriate category for this conversation",
  "sentiment": "positive/neutral/negative",
  "confidence": 0.8,
  "topics": ["topic1", "topic2"],
  "qualityScore": 4.2,
  "suggestions": ["improvement suggestion if any"]
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        ...conversation,
        category: analysis.category || conversation.category,
        metadata: {
          ...conversation.metadata,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          topics: analysis.topics,
          qualityScore: analysis.qualityScore,
          suggestions: analysis.suggestions,
          enhancedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error enhancing conversation:', error);
      return conversation;
    }
  }

  /**
   * Extract categories from processed data
   */
  private extractCategories(data: TrainingDataStructure): string[] {
    const categories = new Set<string>();
    
    if (data.conversations) {
      for (const conv of data.conversations) {
        if (conv.category) {
          categories.add(conv.category);
        }
      }
    }

    return Array.from(categories);
  }

  /**
   * Store training data in database
   */
  private async storeTrainingData(
    fileName: string,
    fileType: string,
    processedData: TrainingDataStructure
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('training_data')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.user.id,
          filename: fileName,
          file_type: fileType,
          content: processedData,
          category: this.extractPrimaryCategory(processedData),
          status: 'processed',
          processed_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing training data:', error);
      throw error;
    }
  }

  /**
   * Extract primary category from data
   */
  private extractPrimaryCategory(data: TrainingDataStructure): string {
    const categories = this.extractCategories(data);
    if (categories.length === 0) return 'general';
    
    // Return most common category
    const categoryCount: Record<string, number> = {};
    if (data.conversations) {
      for (const conv of data.conversations) {
        if (conv.category) {
          categoryCount[conv.category] = (categoryCount[conv.category] || 0) + 1;
        }
      }
    }

    return Object.entries(categoryCount).reduce((a, b) => 
      categoryCount[a[0]] > categoryCount[b[0]] ? a : b
    )[0] || 'general';
  }

  /**
   * Validate conversation data quality
   */
  async validateDataQuality(conversations: ConversationRecord[]): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let qualityScore = 100;

    // Check for data completeness
    const incompleteRecords = conversations.filter(c => !c.userMessage || !c.aiResponse);
    if (incompleteRecords.length > 0) {
      issues.push(`${incompleteRecords.length} records are missing user message or AI response`);
      qualityScore -= (incompleteRecords.length / conversations.length) * 20;
    }

    // Check for diversity in categories
    const categories = new Set(conversations.map(c => c.category));
    if (categories.size < 3) {
      issues.push('Limited category diversity - consider adding more varied conversation types');
      qualityScore -= 10;
    }

    // Check for ratings availability
    const recordsWithRatings = conversations.filter(c => c.rating !== undefined);
    if (recordsWithRatings.length < conversations.length * 0.5) {
      issues.push('Less than 50% of records have ratings - ratings help improve training quality');
      qualityScore -= 15;
    }

    // Check message length diversity
    const avgUserLength = conversations.reduce((sum, c) => sum + c.userMessage.length, 0) / conversations.length;
    const avgAILength = conversations.reduce((sum, c) => sum + c.aiResponse.length, 0) / conversations.length;
    
    if (avgUserLength < 20) {
      issues.push('User messages are too short on average - consider longer, more detailed examples');
      qualityScore -= 10;
    }

    if (avgAILength < 50) {
      issues.push('AI responses are too short on average - detailed responses improve training');
      qualityScore -= 10;
    }

    // Generate recommendations
    if (qualityScore < 80) {
      recommendations.push('Add more diverse conversation examples covering different scenarios');
    }
    if (recordsWithRatings.length === 0) {
      recommendations.push('Include customer satisfaction ratings to improve training effectiveness');
    }
    if (categories.size < 5) {
      recommendations.push('Add conversations from more categories to improve AI versatility');
    }

    return {
      score: Math.max(0, Math.min(100, qualityScore)),
      issues,
      recommendations,
    };
  }
}

export const dataProcessingService = DataProcessingService.getInstance();