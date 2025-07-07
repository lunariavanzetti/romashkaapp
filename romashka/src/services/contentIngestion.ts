import { supabase } from './supabaseClient';

export interface ContentSource {
  type: 'url' | 'file' | 'manual';
  data: string | File;
  language?: string;
  category?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  source_type: 'url' | 'file' | 'manual';
  source_url?: string;
  file_path?: string;
  confidence_score: number;
  usage_count: number;
  effectiveness_score: number;
  language: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  version: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export class ContentIngestionService {
  async processURL(url: string): Promise<KnowledgeItem> {
    try {
      // Simulate web scraping - in production, use Cheerio or Puppeteer
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract title and content (simplified)
      const title = this.extractTitle(html);
      const content = this.extractContent(html);
      
      // Create knowledge item
      const knowledgeItem = await this.createKnowledgeItem({
        title,
        content,
        source_type: 'url',
        source_url: url,
        language: 'en',
        confidence_score: 0.8
      });

      return knowledgeItem;
    } catch (error) {
      throw new Error(`Failed to process URL: ${error}`);
    }
  }

  async processFile(file: File): Promise<KnowledgeItem> {
    try {
      let content = '';
      const fileName = file.name;
      
      if (fileName.endsWith('.pdf')) {
        content = await this.extractTextFromPDF(file);
      } else if (fileName.endsWith('.txt')) {
        content = await this.extractTextFromFile(file);
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        content = await this.extractTextFromDocument(file);
      } else {
        throw new Error('Unsupported file format');
      }

      // Create knowledge item
      const knowledgeItem = await this.createKnowledgeItem({
        title: fileName,
        content,
        source_type: 'file',
        file_path: fileName,
        language: 'en',
        confidence_score: 0.9
      });

      return knowledgeItem;
    } catch (error) {
      throw new Error(`Failed to process file: ${error}`);
    }
  }

  async processManualContent(content: string, title?: string): Promise<KnowledgeItem> {
    try {
      const knowledgeItem = await this.createKnowledgeItem({
        title: title || 'Manual Content',
        content,
        source_type: 'manual',
        language: 'en',
        confidence_score: 1.0
      });

      return knowledgeItem;
    } catch (error) {
      throw new Error(`Failed to process manual content: ${error}`);
    }
  }

  async extractTextFromPDF(file: File): Promise<string> {
    // In production, use pdf-parse library
    // For now, return a placeholder
    return `PDF content from ${file.name} - This would be extracted using pdf-parse in production`;
  }

  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async extractTextFromDocument(file: File): Promise<string> {
    // In production, use mammoth.js for DOC/DOCX files
    // For now, return a placeholder
    return `Document content from ${file.name} - This would be extracted using mammoth.js in production`;
  }

  async scrapeWebPage(url: string): Promise<string> {
    // In production, use Cheerio or Puppeteer
    // For now, return a placeholder
    return `Web page content from ${url} - This would be scraped using Cheerio/Puppeteer in production`;
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : 'Untitled';
  }

  private extractContent(html: string): string {
    // Remove HTML tags and extract text content
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return textContent.substring(0, 1000); // Limit content length
  }

  private async createKnowledgeItem(data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const { data: knowledgeItem, error } = await supabase
      .from('knowledge_items')
      .insert({
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        source_type: data.source_type,
        source_url: data.source_url,
        file_path: data.file_path,
        confidence_score: data.confidence_score,
        language: data.language || 'en',
        tags: data.tags || [],
        status: data.status || 'active',
        version: data.version || 1,
        created_by: data.created_by,
        updated_by: data.updated_by
      })
      .select()
      .single();

    if (error) throw error;
    return knowledgeItem;
  }
}

export const contentIngestionService = new ContentIngestionService(); 