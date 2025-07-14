import * as mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';
import { JSDOM } from 'jsdom';
import stringSimilarity from 'string-similarity';
import { supabase } from '../supabaseClient';
import { enhancedWebsiteScanner } from './enhancedWebsiteScanner';
import { openaiService } from '../openaiService';
import type { KnowledgeItem, ContentSource } from '../contentIngestion';
import type { ExtractedContent, ProcessingResult } from '../../types/websiteScanning';

export interface ImportConfig {
  deduplicateContent: boolean;
  similarityThreshold: number;
  validateContent: boolean;
  generateSummary: boolean;
  extractKeywords: boolean;
  classifyContent: boolean;
  generateFAQ: boolean;
  maxFileSize: number; // in MB
  supportedMimeTypes: string[];
  aiProcessing: {
    summarization: boolean;
    keywordExtraction: boolean;
    contentClassification: boolean;
    faqGeneration: boolean;
    qualityScoring: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  processedItems: KnowledgeItem[];
  errors: string[];
  warnings: string[];
  duplicatesFound: number;
  totalProcessed: number;
  statistics: {
    filesImported: number;
    urlsImported: number;
    manualEntriesCreated: number;
    duplicatesSkipped: number;
    errorsEncountered: number;
    processingTime: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  quality: number;
  issues: string[];
  suggestions: string[];
}

export class ContentImporter {
  private defaultConfig: ImportConfig = {
    deduplicateContent: true,
    similarityThreshold: 0.85,
    validateContent: true,
    generateSummary: true,
    extractKeywords: true,
    classifyContent: true,
    generateFAQ: false,
    maxFileSize: 10, // 10MB
    supportedMimeTypes: [
      'text/plain',
      'text/html',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json'
    ],
    aiProcessing: {
      summarization: true,
      keywordExtraction: true,
      contentClassification: true,
      faqGeneration: false,
      qualityScoring: true
    }
  };

  constructor(private config: ImportConfig = this.defaultConfig) {}

  async bulkImport(sources: ContentSource[], config?: Partial<ImportConfig>): Promise<ImportResult> {
    const finalConfig = { ...this.config, ...config };
    const result: ImportResult = {
      success: true,
      processedItems: [],
      errors: [],
      warnings: [],
      duplicatesFound: 0,
      totalProcessed: 0,
      statistics: {
        filesImported: 0,
        urlsImported: 0,
        manualEntriesCreated: 0,
        duplicatesSkipped: 0,
        errorsEncountered: 0,
        processingTime: 0
      }
    };

    const startTime = Date.now();

    try {
      // Process sources in batches to avoid overwhelming the system
      const batchSize = 5;
      const batches = this.chunkArray(sources, batchSize);

      for (const batch of batches) {
        const batchPromises = batch.map(source => this.processSingleSource(source, finalConfig));
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((batchResult, index) => {
          const source = batch[index];
          if (batchResult.status === 'fulfilled') {
            const item = batchResult.value;
            if (item) {
              result.processedItems.push(item);
              result.totalProcessed++;
              
              // Update statistics
              switch (source.type) {
                case 'file':
                  result.statistics.filesImported++;
                  break;
                case 'url':
                  result.statistics.urlsImported++;
                  break;
                case 'manual':
                  result.statistics.manualEntriesCreated++;
                  break;
              }
            }
          } else {
            result.errors.push(`Failed to process ${source.type}: ${batchResult.reason}`);
            result.statistics.errorsEncountered++;
          }
        });
      }

      // Deduplicate content if enabled
      if (finalConfig.deduplicateContent) {
        const deduplicatedItems = await this.deduplicateContent(result.processedItems, finalConfig.similarityThreshold);
        result.duplicatesFound = result.processedItems.length - deduplicatedItems.length;
        result.processedItems = deduplicatedItems;
      }

      // Save to database
      await this.saveKnowledgeItems(result.processedItems);

      result.statistics.processingTime = Date.now() - startTime;

    } catch (error) {
      result.success = false;
      result.errors.push(`Bulk import failed: ${error}`);
    }

    return result;
  }

  async importFromFile(file: File, config?: Partial<ImportConfig>): Promise<KnowledgeItem | null> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      // Validate file
      const validation = await this.validateFile(file, finalConfig);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.issues.join(', ')}`);
      }

      // Extract content based on file type
      const content = await this.extractFileContent(file);
      
      // Create knowledge item
      const knowledgeItem = await this.createKnowledgeItem({
        title: this.extractTitleFromFilename(file.name),
        content,
        source_type: 'file',
        file_path: file.name,
        language: 'en',
        confidence_score: 0.9
      }, finalConfig);

      return knowledgeItem;
    } catch (error) {
      console.error('Error importing file:', error);
      throw error;
    }
  }

  async importFromURL(url: string, config?: Partial<ImportConfig>): Promise<KnowledgeItem | null> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      // Use enhanced website scanner
      const extractedContent = await enhancedWebsiteScanner.scanUrl(url, finalConfig);
      
      // Convert to knowledge item
      const knowledgeItem = await this.createKnowledgeItem({
        title: extractedContent.title,
        content: extractedContent.content,
        source_type: 'url',
        source_url: url,
        language: 'en',
        confidence_score: extractedContent.processing_quality
      }, finalConfig);

      return knowledgeItem;
    } catch (error) {
      console.error('Error importing URL:', error);
      throw error;
    }
  }

  async importFromText(content: string, title: string, config?: Partial<ImportConfig>): Promise<KnowledgeItem | null> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      // Validate content
      const validation = await this.validateContent(content);
      if (!validation.isValid) {
        throw new Error(`Content validation failed: ${validation.issues.join(', ')}`);
      }

      // Create knowledge item
      const knowledgeItem = await this.createKnowledgeItem({
        title,
        content,
        source_type: 'manual',
        language: 'en',
        confidence_score: 1.0
      }, finalConfig);

      return knowledgeItem;
    } catch (error) {
      console.error('Error importing text:', error);
      throw error;
    }
  }

  async importFromAPI(apiEndpoint: string, apiKey?: string, config?: Partial<ImportConfig>): Promise<ImportResult> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      // Fetch data from API
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process API data (assuming it returns an array of documents)
      const sources: ContentSource[] = [];
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.content && item.title) {
            sources.push({
              type: 'manual',
              data: item.content,
              category: item.category || 'general'
            });
          }
        });
      }

      // Use bulk import for processing
      return await this.bulkImport(sources, finalConfig);
    } catch (error) {
      return {
        success: false,
        processedItems: [],
        errors: [`API import failed: ${error}`],
        warnings: [],
        duplicatesFound: 0,
        totalProcessed: 0,
        statistics: {
          filesImported: 0,
          urlsImported: 0,
          manualEntriesCreated: 0,
          duplicatesSkipped: 0,
          errorsEncountered: 1,
          processingTime: 0
        }
      };
    }
  }

  async validateFile(file: File, config: ImportConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      quality: 1.0,
      issues: [],
      suggestions: []
    };

    // Check file size
    if (file.size > config.maxFileSize * 1024 * 1024) {
      result.isValid = false;
      result.issues.push(`File size exceeds maximum limit of ${config.maxFileSize}MB`);
    }

    // Check MIME type
    if (!config.supportedMimeTypes.includes(file.type)) {
      result.isValid = false;
      result.issues.push(`Unsupported file type: ${file.type}`);
    }

    // Check file extension
    const allowedExtensions = ['.txt', '.html', '.md', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      result.warnings = [`File extension ${fileExtension} may not be fully supported`];
      result.quality -= 0.1;
    }

    return result;
  }

  async validateContent(content: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      quality: 1.0,
      issues: [],
      suggestions: []
    };

    // Check content length
    if (content.length < 50) {
      result.isValid = false;
      result.issues.push('Content is too short (minimum 50 characters)');
    }

    if (content.length > 100000) {
      result.warnings = ['Content is very long and may need to be split'];
      result.quality -= 0.2;
    }

    // Check for meaningful content
    const words = content.split(/\s+/).filter(word => word.length > 2);
    if (words.length < 10) {
      result.isValid = false;
      result.issues.push('Content lacks sufficient meaningful words');
    }

    // Check for spam indicators
    const spamPatterns = [
      /(.)\1{10,}/g, // Repeated characters
      /\b(buy now|click here|free|urgent|limited time)\b/gi,
      /[A-Z]{20,}/g // Excessive caps
    ];

    spamPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        result.quality -= 0.3;
        result.suggestions.push('Content may contain spam-like patterns');
      }
    });

    return result;
  }

  private async processSingleSource(source: ContentSource, config: ImportConfig): Promise<KnowledgeItem | null> {
    try {
      switch (source.type) {
        case 'file':
          return await this.importFromFile(source.data as File, config);
        case 'url':
          return await this.importFromURL(source.data as string, config);
        case 'manual':
          return await this.importFromText(source.data as string, 'Manual Entry', config);
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }
    } catch (error) {
      console.error(`Error processing source ${source.type}:`, error);
      return null;
    }
  }

  private async extractFileContent(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return await this.extractTextFile(file);
      } else if (fileType === 'text/html' || fileName.endsWith('.html')) {
        return await this.extractHTMLFile(file);
      } else if (fileType === 'text/markdown' || fileName.endsWith('.md')) {
        return await this.extractMarkdownFile(file);
      } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractPDFFile(file);
      } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        return await this.extractWordFile(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return await this.extractWordFile(file);
      } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        return await this.extractCSVFile(file);
      } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
        return await this.extractJSONFile(file);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to extract content from ${fileName}: ${error}`);
    }
  }

  private async extractTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private async extractHTMLFile(file: File): Promise<string> {
    const html = await this.extractTextFile(file);
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    return document.body?.textContent || document.textContent || '';
  }

  private async extractMarkdownFile(file: File): Promise<string> {
    const markdown = await this.extractTextFile(file);
    
    // Simple markdown to text conversion
    return markdown
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1') // Remove code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .trim();
  }

  private async extractPDFFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractWordFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private async extractCSVFile(file: File): Promise<string> {
    const csv = await this.extractTextFile(file);
    const lines = csv.split('\n');
    const headers = lines[0]?.split(',') || [];
    
    // Convert CSV to readable text
    let content = `CSV Data with columns: ${headers.join(', ')}\n\n`;
    
    lines.slice(1).forEach((line, index) => {
      if (line.trim()) {
        const values = line.split(',');
        content += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          content += `  ${header}: ${values[i] || ''}\n`;
        });
        content += '\n';
      }
    });
    
    return content;
  }

  private async extractJSONFile(file: File): Promise<string> {
    const jsonText = await this.extractTextFile(file);
    const jsonData = JSON.parse(jsonText);
    
    // Convert JSON to readable text
    return this.jsonToReadableText(jsonData);
  }

  private jsonToReadableText(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let text = '';
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          text += `${spaces}Item ${index + 1}:\n`;
          text += this.jsonToReadableText(item, indent + 1);
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          text += `${spaces}${key}: `;
          if (typeof value === 'object') {
            text += '\n';
            text += this.jsonToReadableText(value, indent + 1);
          } else {
            text += `${value}\n`;
          }
        });
      }
    } else {
      text += `${spaces}${obj}\n`;
    }
    
    return text;
  }

  private extractTitleFromFilename(filename: string): string {
    const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
    return nameWithoutExtension
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private async createKnowledgeItem(
    data: Partial<KnowledgeItem>, 
    config: ImportConfig
  ): Promise<KnowledgeItem> {
    const baseItem: KnowledgeItem = {
      id: '', // Will be generated by database
      title: data.title || 'Untitled',
      content: data.content || '',
      source_type: data.source_type || 'manual',
      source_url: data.source_url,
      file_path: data.file_path,
      confidence_score: data.confidence_score || 0.8,
      usage_count: 0,
      effectiveness_score: 0.5,
      language: data.language || 'en',
      tags: data.tags || [],
      status: 'active',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // AI-powered enhancements
    if (config.aiProcessing.summarization && config.generateSummary) {
      try {
        const summary = await this.generateSummary(baseItem.content);
        baseItem.metadata = { ...baseItem.metadata, summary };
      } catch (error) {
        console.warn('Failed to generate summary:', error);
      }
    }

    if (config.aiProcessing.keywordExtraction && config.extractKeywords) {
      try {
        const keywords = await this.extractKeywords(baseItem.content);
        baseItem.tags = [...baseItem.tags, ...keywords];
      } catch (error) {
        console.warn('Failed to extract keywords:', error);
      }
    }

    if (config.aiProcessing.contentClassification && config.classifyContent) {
      try {
        const category = await this.classifyContent(baseItem.content);
        baseItem.category_id = category;
      } catch (error) {
        console.warn('Failed to classify content:', error);
      }
    }

    if (config.aiProcessing.faqGeneration && config.generateFAQ) {
      try {
        const faq = await this.generateFAQ(baseItem.content);
        baseItem.metadata = { ...baseItem.metadata, faq };
      } catch (error) {
        console.warn('Failed to generate FAQ:', error);
      }
    }

    if (config.aiProcessing.qualityScoring) {
      try {
        const qualityScore = await this.calculateQualityScore(baseItem.content);
        baseItem.confidence_score = qualityScore;
      } catch (error) {
        console.warn('Failed to calculate quality score:', error);
      }
    }

    return baseItem;
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `Please provide a concise summary of the following content:\n\n${content.substring(0, 2000)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 150 });
      return response.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  private async extractKeywords(content: string): Promise<string[]> {
    try {
      const prompt = `Extract 5-10 relevant keywords from this content. Return only the keywords separated by commas:\n\n${content.substring(0, 1000)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 100 });
      return response.split(',').map(keyword => keyword.trim()).filter(k => k.length > 0);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  private async classifyContent(content: string): Promise<string> {
    try {
      const prompt = `Classify this content into one of these categories: general, product, pricing, faq, about, contact, policy. Return only the category name:\n\n${content.substring(0, 500)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 50 });
      return response.trim().toLowerCase();
    } catch (error) {
      console.error('Error classifying content:', error);
      return 'general';
    }
  }

  private async generateFAQ(content: string): Promise<any[]> {
    try {
      const prompt = `Generate 3-5 frequently asked questions based on this content. Format as JSON array with question and answer fields:\n\n${content.substring(0, 1500)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 300 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating FAQ:', error);
      return [];
    }
  }

  private async calculateQualityScore(content: string): Promise<number> {
    let score = 0.5; // Base score
    
    // Length factor
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 100) score += 0.1;
    if (wordCount > 500) score += 0.1;
    if (wordCount > 1000) score += 0.1;
    
    // Structure factor
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) score += 0.1;
    
    // Readability factor
    const avgWordsPerSentence = wordCount / sentences.length;
    if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private async deduplicateContent(items: KnowledgeItem[], threshold: number): Promise<KnowledgeItem[]> {
    const deduplicated: KnowledgeItem[] = [];
    const processed: Set<string> = new Set();
    
    for (const item of items) {
      let isDuplicate = false;
      
      for (const existing of deduplicated) {
        const similarity = stringSimilarity.compareTwoStrings(item.content, existing.content);
        if (similarity >= threshold) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        deduplicated.push(item);
      }
    }
    
    return deduplicated;
  }

  private async saveKnowledgeItems(items: KnowledgeItem[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .insert(items);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving knowledge items:', error);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const contentImporter = new ContentImporter();