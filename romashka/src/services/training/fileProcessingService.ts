import { supabase } from '../../lib/supabase';
import type { 
  FileProcessingResult, 
  QualityIndicators,
  TrainingData 
} from '../../types/training';

interface ConversationRecord {
  user_message: string;
  ai_response: string;
  rating?: number;
  category?: string;
  timestamp?: string;
  [key: string]: any;
}

class FileProcessingService {
  private static instance: FileProcessingService;

  static getInstance(): FileProcessingService {
    if (!FileProcessingService.instance) {
      FileProcessingService.instance = new FileProcessingService();
    }
    return FileProcessingService.instance;
  }

  /**
   * Process a training file and return processing results
   */
  async processTrainingFile(
    fileContent: string,
    fileType: string,
    filename: string
  ): Promise<FileProcessingResult> {
    try {
      let records: ConversationRecord[] = [];

      // Parse file based on type
      switch (fileType) {
        case 'text/csv':
        case 'application/vnd.ms-excel':
          records = this.parseCSV(fileContent);
          break;
        case 'application/json':
          records = this.parseJSON(fileContent);
          break;
        case 'text/plain':
          records = this.parseTextFile(fileContent);
          break;
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          // For XLSX files, we'll need to handle them differently
          // For now, treat as JSON if possible
          try {
            records = this.parseJSON(fileContent);
          } catch {
            throw new Error('XLSX files need to be converted to CSV or JSON format');
          }
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Validate and categorize records
      const { validRecords, invalidRecords, categories } = this.validateRecords(records);

      // Calculate quality indicators
      const qualityIndicators = this.calculateQualityIndicators(validRecords);

      // Store the processed data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const trainingData = await this.storeTrainingData({
        user_id: user.id,
        filename,
        file_type: fileType,
        content: {
          records: validRecords,
          invalid_records: invalidRecords,
          processing_metadata: {
            processed_at: new Date().toISOString(),
            quality_indicators: qualityIndicators
          }
        },
        status: 'processed',
        quality_score: qualityIndicators.overall_quality,
        category: this.determinePrimaryCategory(categories),
        record_count: validRecords.length,
        valid_records: validRecords.length,
        invalid_records: invalidRecords.length,
        categories
      });

      return {
        conversation_count: validRecords.length,
        valid_records: validRecords.length,
        invalid_records: invalidRecords.length,
        categories,
        quality_indicators: qualityIndicators
      };

    } catch (error) {
      console.error('Error processing training file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file content
   */
  private parseCSV(content: string): ConversationRecord[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have at least a header and one data row');

    const headers = this.parseCSVLine(lines[0]);
    const records: ConversationRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        record[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
      });

      // Map common field variations to standard names
      const mappedRecord = this.mapFieldNames(record);
      if (mappedRecord.user_message && mappedRecord.ai_response) {
        records.push(mappedRecord);
      }
    }

    return records;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else if (char === '"') {
        // Toggle quotes
        inQuotes = !inQuotes;
        i++;
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parse JSON file content
   */
  private parseJSON(content: string): ConversationRecord[] {
    try {
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        return data.map(this.mapFieldNames);
      } else if (data.conversations && Array.isArray(data.conversations)) {
        return data.conversations.map(this.mapFieldNames);
      } else if (data.data && Array.isArray(data.data)) {
        return data.data.map(this.mapFieldNames);
      } else {
        throw new Error('JSON file must contain an array of conversations or have a "conversations" property');
      }
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse plain text file
   */
  private parseTextFile(content: string): ConversationRecord[] {
    // Try to parse as simple format: User: message\nAI: response\n\n
    const conversations = content.split('\n\n').filter(conv => conv.trim());
    const records: ConversationRecord[] = [];

    for (const conversation of conversations) {
      const lines = conversation.split('\n').filter(line => line.trim());
      let userMessage = '';
      let aiResponse = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith('user:') || trimmedLine.toLowerCase().startsWith('human:')) {
          userMessage = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
        } else if (trimmedLine.toLowerCase().startsWith('ai:') || trimmedLine.toLowerCase().startsWith('assistant:')) {
          aiResponse = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
        }
      }

      if (userMessage && aiResponse) {
        records.push({
          user_message: userMessage,
          ai_response: aiResponse,
          category: 'general'
        });
      }
    }

    if (records.length === 0) {
      throw new Error('No valid conversation pairs found in text file. Expected format: User: message\\nAI: response\\n\\n');
    }

    return records;
  }

  /**
   * Map various field names to standard format
   */
  private mapFieldNames(record: any): ConversationRecord {
    const mapped: any = {};

    // Map user message variations
    const userFields = ['user_message', 'user', 'human', 'customer', 'question', 'input', 'prompt'];
    const aiFields = ['ai_response', 'ai', 'assistant', 'bot', 'response', 'answer', 'output'];
    const ratingFields = ['rating', 'score', 'satisfaction', 'quality'];
    const categoryFields = ['category', 'topic', 'type', 'subject', 'intent'];

    // Find and map user message
    for (const field of userFields) {
      if (record[field] && !mapped.user_message) {
        mapped.user_message = String(record[field]).trim();
        break;
      }
    }

    // Find and map AI response
    for (const field of aiFields) {
      if (record[field] && !mapped.ai_response) {
        mapped.ai_response = String(record[field]).trim();
        break;
      }
    }

    // Find and map rating
    for (const field of ratingFields) {
      if (record[field] && !mapped.rating) {
        const rating = parseFloat(record[field]);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          mapped.rating = rating;
        }
        break;
      }
    }

    // Find and map category
    for (const field of categoryFields) {
      if (record[field] && !mapped.category) {
        mapped.category = String(record[field]).trim().toLowerCase();
        break;
      }
    }

    // Copy other fields
    Object.keys(record).forEach(key => {
      if (!mapped[key] && record[key] !== undefined && record[key] !== null) {
        mapped[key] = record[key];
      }
    });

    return mapped;
  }

  /**
   * Validate records and categorize them
   */
  private validateRecords(records: ConversationRecord[]): {
    validRecords: ConversationRecord[];
    invalidRecords: any[];
    categories: string[];
  } {
    const validRecords: ConversationRecord[] = [];
    const invalidRecords: any[] = [];
    const categoriesSet = new Set<string>();

    for (const record of records) {
      const errors: string[] = [];

      // Check required fields
      if (!record.user_message || record.user_message.trim().length === 0) {
        errors.push('Missing user message');
      }

      if (!record.ai_response || record.ai_response.trim().length === 0) {
        errors.push('Missing AI response');
      }

      // Check message length constraints
      if (record.user_message && record.user_message.length > 2000) {
        errors.push('User message too long (max 2000 characters)');
      }

      if (record.ai_response && record.ai_response.length > 4000) {
        errors.push('AI response too long (max 4000 characters)');
      }

      // Check rating if present
      if (record.rating !== undefined) {
        const rating = parseFloat(String(record.rating));
        if (isNaN(rating) || rating < 1 || rating > 5) {
          errors.push('Rating must be between 1 and 5');
        }
      }

      if (errors.length === 0) {
        // Clean and normalize the record
        const cleanRecord: ConversationRecord = {
          user_message: record.user_message.trim(),
          ai_response: record.ai_response.trim(),
          rating: record.rating,
          category: record.category || 'general',
          timestamp: record.timestamp || new Date().toISOString()
        };

        validRecords.push(cleanRecord);
        
        if (cleanRecord.category) {
          categoriesSet.add(cleanRecord.category);
        }
      } else {
        invalidRecords.push({
          ...record,
          validation_errors: errors
        });
      }
    }

    return {
      validRecords,
      invalidRecords,
      categories: Array.from(categoriesSet).sort()
    };
  }

  /**
   * Calculate quality indicators for the dataset
   */
  private calculateQualityIndicators(records: ConversationRecord[]): QualityIndicators & { overall_quality: number } {
    if (records.length === 0) {
      return {
        avg_message_length: 0,
        response_completeness: 0,
        conversation_coherence: 0,
        sentiment_distribution: {},
        overall_quality: 0
      };
    }

    // Calculate average message length
    const totalUserLength = records.reduce((sum, r) => sum + r.user_message.length, 0);
    const totalAiLength = records.reduce((sum, r) => sum + r.ai_response.length, 0);
    const avg_message_length = (totalUserLength + totalAiLength) / (records.length * 2);

    // Calculate response completeness (percentage of responses that seem complete)
    const completeResponses = records.filter(r => {
      const response = r.ai_response.toLowerCase();
      // Simple heuristics for completeness
      return response.length > 10 && 
             !response.includes('...') && 
             !response.endsWith('(incomplete)') &&
             (response.includes('.') || response.includes('!') || response.includes('?'));
    });
    const response_completeness = completeResponses.length / records.length;

    // Calculate conversation coherence (simplified - based on length ratios)
    let coherenceScore = 0;
    for (const record of records) {
      const userLength = record.user_message.length;
      const aiLength = record.ai_response.length;
      const ratio = Math.min(userLength, aiLength) / Math.max(userLength, aiLength);
      coherenceScore += ratio;
    }
    const conversation_coherence = coherenceScore / records.length;

    // Simple sentiment distribution based on keywords
    const sentiment_distribution = this.calculateSentimentDistribution(records);

    // Overall quality score (weighted average)
    const overall_quality = (
      (avg_message_length > 20 ? 0.3 : (avg_message_length / 20) * 0.3) +
      (response_completeness * 0.4) +
      (conversation_coherence * 0.3)
    );

    return {
      avg_message_length: Math.round(avg_message_length),
      response_completeness: Math.round(response_completeness * 100) / 100,
      conversation_coherence: Math.round(conversation_coherence * 100) / 100,
      sentiment_distribution,
      overall_quality: Math.round(overall_quality * 100) / 100
    };
  }

  /**
   * Calculate sentiment distribution using simple keyword analysis
   */
  private calculateSentimentDistribution(records: ConversationRecord[]): Record<string, number> {
    const sentiments = { positive: 0, negative: 0, neutral: 0 };

    const positiveKeywords = ['good', 'great', 'excellent', 'perfect', 'love', 'happy', 'satisfied', 'thank'];
    const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'problem', 'issue'];

    for (const record of records) {
      const text = (record.user_message + ' ' + record.ai_response).toLowerCase();
      
      const positiveCount = positiveKeywords.filter(word => text.includes(word)).length;
      const negativeCount = negativeKeywords.filter(word => text.includes(word)).length;

      if (positiveCount > negativeCount) {
        sentiments.positive++;
      } else if (negativeCount > positiveCount) {
        sentiments.negative++;
      } else {
        sentiments.neutral++;
      }
    }

    const total = records.length;
    return {
      positive: Math.round((sentiments.positive / total) * 100) / 100,
      negative: Math.round((sentiments.negative / total) * 100) / 100,
      neutral: Math.round((sentiments.neutral / total) * 100) / 100
    };
  }

  /**
   * Determine the primary category from a list of categories
   */
  private determinePrimaryCategory(categories: string[]): string {
    if (categories.length === 0) return 'general';
    
    // Count frequency of each category
    const categoryCount: Record<string, number> = {};
    categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Return the most frequent category
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Store processed training data in the database
   */
  private async storeTrainingData(data: Partial<TrainingData>): Promise<TrainingData> {
    const { data: result, error } = await supabase
      .from('training_data')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Validate file before processing
   */
  async validateFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB');
    }

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/json',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported. Please use CSV, JSON, TXT, or XLSX files');
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long (max 255 characters)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get supported file formats information
   */
  getSupportedFormats(): Array<{
    type: string;
    extension: string;
    description: string;
    example: string;
  }> {
    return [
      {
        type: 'text/csv',
        extension: '.csv',
        description: 'Comma-separated values with headers',
        example: 'user_message,ai_response,rating,category\n"How do I reset password?","Click forgot password...","5","support"'
      },
      {
        type: 'application/json',
        extension: '.json',
        description: 'JSON format with conversation arrays',
        example: '{"conversations": [{"user": "Hello", "ai": "Hi there!", "rating": 5}]}'
      },
      {
        type: 'text/plain',
        extension: '.txt',
        description: 'Plain text with User:/AI: format',
        example: 'User: Hello\nAI: Hi there!\n\nUser: How are you?\nAI: I\'m doing well!'
      },
      {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: '.xlsx',
        description: 'Excel spreadsheet (convert to CSV recommended)',
        example: 'Excel file with columns: user_message, ai_response, rating, category'
      }
    ];
  }
}

export const fileProcessingService = FileProcessingService.getInstance();