import { supabase } from './supabaseClient';
import type {
  ExtractedContent,
  ProcessingResult,
  ProcessingStatistics,
  KnowledgeItem,
  PricingPlan,
  FAQ,
  CompanyInfo,
  ContactInfo,
  ContentAnalysis,
  ContentType
} from '../types/websiteScanning';

export interface ContentProcessor {
  processExtractedContent(content: ExtractedContent[]): Promise<ProcessingResult>;
  extractPricingInfo(html: string): Promise<PricingPlan[]>;
  extractFAQs(html: string): Promise<FAQ[]>;
  extractCompanyInfo(html: string): Promise<CompanyInfo>;
  extractContactDetails(html: string): Promise<ContactInfo>;
  generateKnowledgeItems(content: ExtractedContent[]): Promise<KnowledgeItem[]>;
  categorizeContent(content: string): Promise<string>;
  analyzeContent(content: string): Promise<ContentAnalysis>;
}

export class ContentProcessorService implements ContentProcessor {
  async processExtractedContent(content: ExtractedContent[]): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      const knowledgeItems: KnowledgeItem[] = [];
      const statistics: ProcessingStatistics = {
        totalPages: content.length,
        successfulExtractions: 0,
        failedExtractions: 0,
        averageQuality: 0,
        processingTime: 0,
        contentTypes: {
          pricing: 0,
          faq: 0,
          about: 0,
          product: 0,
          policy: 0,
          contact: 0,
          general: 0
        }
      };

      let totalQuality = 0;
      let successfulCount = 0;

      for (const extractedContent of content) {
        try {
          // Generate knowledge items based on content type
          const items = await this.generateKnowledgeItems([extractedContent]);
          knowledgeItems.push(...items);
          
          // Update statistics
          statistics.contentTypes[extractedContent.content_type]++;
          totalQuality += extractedContent.processing_quality;
          successfulCount++;
          statistics.successfulExtractions++;
          
        } catch (error) {
          console.error('Error processing content:', error);
          statistics.failedExtractions++;
        }
      }

      // Calculate average quality
      if (successfulCount > 0) {
        statistics.averageQuality = totalQuality / successfulCount;
      }

      statistics.processingTime = Date.now() - startTime;

      return {
        success: statistics.failedExtractions === 0,
        extractedContent: content,
        knowledgeItems,
        statistics,
        errors: statistics.failedExtractions > 0 ? ['Some content failed to process'] : undefined
      };
    } catch (error) {
      console.error('Error processing extracted content:', error);
      throw error;
    }
  }

  async extractPricingInfo(html: string): Promise<PricingPlan[]> {
    try {
      const pricingPlans: PricingPlan[] = [];
      
      // Parse HTML to extract pricing information
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for pricing-related elements
      const pricingElements = doc.querySelectorAll('.pricing, .plan, .package, [class*="price"], [class*="plan"]');
      
      pricingElements.forEach(element => {
        const planName = this.extractPlanName(element);
        const price = this.extractPrice(element);
        const features = this.extractFeatures(element);
        
        if (planName && price) {
          pricingPlans.push({
            name: planName,
            price: price.amount,
            currency: price.currency || '$',
            billingCycle: price.billingCycle,
            features,
            description: this.extractDescription(element),
            popular: this.isPopularPlan(element),
            buttonText: this.extractButtonText(element)
          });
        }
      });
      
      return pricingPlans;
    } catch (error) {
      console.error('Error extracting pricing info:', error);
      return [];
    }
  }

  async extractFAQs(html: string): Promise<FAQ[]> {
    try {
      const faqs: FAQ[] = [];
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for FAQ elements
      const faqElements = doc.querySelectorAll('.faq, .question, [class*="faq"], [class*="question"]');
      
      faqElements.forEach(element => {
        const question = this.extractQuestion(element);
        const answer = this.extractAnswer(element);
        
        if (question && answer) {
          faqs.push({
            question,
            answer,
            category: this.extractFAQCategory(element),
            tags: this.extractFAQTags(element)
          });
        }
      });
      
      return faqs;
    } catch (error) {
      console.error('Error extracting FAQs:', error);
      return [];
    }
  }

  async extractCompanyInfo(html: string): Promise<CompanyInfo> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const companyInfo: CompanyInfo = {
        name: this.extractCompanyName(doc),
        description: this.extractCompanyDescription(doc),
        mission: this.extractMission(doc),
        vision: this.extractVision(doc),
        values: this.extractValues(doc),
        team: this.extractTeam(doc),
        history: this.extractHistory(doc)
      };
      
      return companyInfo;
    } catch (error) {
      console.error('Error extracting company info:', error);
      return {
        name: '',
        description: ''
      };
    }
  }

  async extractContactDetails(html: string): Promise<ContactInfo> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const contactInfo: ContactInfo = {
        email: this.extractEmail(doc),
        phone: this.extractPhone(doc),
        website: this.extractWebsite(doc),
        contactForm: this.extractContactForm(doc)
      };
      
      return contactInfo;
    } catch (error) {
      console.error('Error extracting contact details:', error);
      return {};
    }
  }

  async generateKnowledgeItems(content: ExtractedContent[]): Promise<KnowledgeItem[]> {
    try {
      const knowledgeItems: KnowledgeItem[] = [];
      
      for (const extractedContent of content) {
        const items = await this.generateKnowledgeFromContent(extractedContent);
        knowledgeItems.push(...items);
      }
      
      return knowledgeItems;
    } catch (error) {
      console.error('Error generating knowledge items:', error);
      return [];
    }
  }

  async categorizeContent(content: string): Promise<string> {
    try {
      // Simple content categorization based on keywords and patterns
      const contentLower = content.toLowerCase();
      
      if (contentLower.includes('$') && (contentLower.includes('month') || contentLower.includes('year'))) {
        return 'pricing';
      }
      
      if (contentLower.includes('question') && contentLower.includes('answer')) {
        return 'faq';
      }
      
      if (contentLower.includes('about us') || contentLower.includes('our story')) {
        return 'about';
      }
      
      if (contentLower.includes('product') || contentLower.includes('service')) {
        return 'product';
      }
      
      if (contentLower.includes('policy') || contentLower.includes('terms')) {
        return 'policy';
      }
      
      if (contentLower.includes('contact') || contentLower.includes('support')) {
        return 'contact';
      }
      
      return 'general';
    } catch (error) {
      console.error('Error categorizing content:', error);
      return 'general';
    }
  }

  async analyzeContent(content: string): Promise<ContentAnalysis> {
    try {
      const analysis: ContentAnalysis = {
        contentType: await this.categorizeContent(content) as ContentType,
        confidence: this.calculateConfidence(content),
        entities: await this.extractEntities(content),
        sentiment: this.analyzeSentiment(content),
        readability: this.calculateReadability(content),
        keywords: this.extractKeywords(content)
      };
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  }

  // Private helper methods
  private async generateKnowledgeFromContent(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      // Generate knowledge based on content type
      switch (content.content_type) {
        case 'pricing':
          items.push(...await this.generatePricingKnowledge(content));
          break;
        case 'faq':
          items.push(...await this.generateFAQKnowledge(content));
          break;
        case 'about':
          items.push(...await this.generateAboutKnowledge(content));
          break;
        case 'product':
          items.push(...await this.generateProductKnowledge(content));
          break;
        case 'contact':
          items.push(...await this.generateContactKnowledge(content));
          break;
        default:
          items.push(...await this.generateGeneralKnowledge(content));
      }
      
      return items;
    } catch (error) {
      console.error('Error generating knowledge from content:', error);
      return [];
    }
  }

  private async generatePricingKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      const pricingPlans = await this.extractPricingInfo(content.content);
      
      pricingPlans.forEach(plan => {
        items.push({
          id: '',
          title: `Pricing: ${plan.name}`,
          content: `${plan.name} plan costs ${plan.price}${plan.currency}${plan.billingCycle ? ` per ${plan.billingCycle}` : ''}. ${plan.description || ''} Features: ${plan.features.join(', ')}`,
          category: 'pricing',
          tags: ['pricing', 'plans', 'cost'],
          confidence: content.processing_quality,
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
      
      return items;
    } catch (error) {
      console.error('Error generating pricing knowledge:', error);
      return [];
    }
  }

  private async generateFAQKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      const faqs = await this.extractFAQs(content.content);
      
      faqs.forEach(faq => {
        items.push({
          id: '',
          title: faq.question,
          content: faq.answer,
          category: 'faq',
          tags: faq.tags || ['faq', 'help'],
          confidence: content.processing_quality,
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
      
      return items;
    } catch (error) {
      console.error('Error generating FAQ knowledge:', error);
      return [];
    }
  }

  private async generateAboutKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      const companyInfo = await this.extractCompanyInfo(content.content);
      
      if (companyInfo.name) {
        items.push({
          id: '',
          title: `About ${companyInfo.name}`,
          content: companyInfo.description,
          category: 'about',
          tags: ['about', 'company'],
          confidence: content.processing_quality,
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error generating about knowledge:', error);
      return [];
    }
  }

  private async generateProductKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      // Extract product information from content
      const productInfo = this.extractProductInfo(content.content);
      
      if (productInfo.name) {
        items.push({
          id: '',
          title: `Product: ${productInfo.name}`,
          content: productInfo.description,
          category: 'product',
          tags: ['product', 'service'],
          confidence: content.processing_quality,
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error generating product knowledge:', error);
      return [];
    }
  }

  private async generateContactKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      const contactInfo = await this.extractContactDetails(content.content);
      
      if (contactInfo.email || contactInfo.phone) {
        items.push({
          id: '',
          title: 'Contact Information',
          content: `Email: ${contactInfo.email || 'Not provided'}, Phone: ${contactInfo.phone || 'Not provided'}`,
          category: 'contact',
          tags: ['contact', 'support'],
          confidence: content.processing_quality,
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      return items;
    } catch (error) {
      console.error('Error generating contact knowledge:', error);
      return [];
    }
  }

  private async generateGeneralKnowledge(content: ExtractedContent): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    try {
      // Generate general knowledge from content
      const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      sentences.slice(0, 5).forEach(sentence => {
        items.push({
          id: '',
          title: sentence.substring(0, 100) + '...',
          content: sentence.trim(),
          category: 'general',
          tags: ['general'],
          confidence: content.processing_quality * 0.8, // Lower confidence for general content
          source_url: content.url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
      
      return items;
    } catch (error) {
      console.error('Error generating general knowledge:', error);
      return [];
    }
  }

  // Content extraction helper methods
  private extractPlanName(element: Element): string | null {
    const nameSelectors = ['.plan-name', '.package-name', 'h2', 'h3', '.title'];
    for (const selector of nameSelectors) {
      const nameElement = element.querySelector(selector);
      if (nameElement?.textContent) {
        return nameElement.textContent.trim();
      }
    }
    return null;
  }

  private extractPrice(element: Element): { amount: string; currency: string; billingCycle?: string } | null {
    const priceSelectors = ['.price', '.amount', '[class*="price"]'];
    for (const selector of priceSelectors) {
      const priceElement = element.querySelector(selector);
      if (priceElement?.textContent) {
        const priceText = priceElement.textContent.trim();
        const match = priceText.match(/([\$€£¥]?)(\d+(?:\.\d{2})?)(?:\/(month|year|week))?/);
        if (match) {
          return {
            amount: match[2],
            currency: match[1] || '$',
            billingCycle: match[3]
          };
        }
      }
    }
    return null;
  }

  private extractFeatures(element: Element): string[] {
    const features: string[] = [];
    const featureSelectors = ['.feature', '.benefit', 'li', '.list-item'];
    
    featureSelectors.forEach(selector => {
      const featureElements = element.querySelectorAll(selector);
      featureElements.forEach(feature => {
        const text = feature.textContent?.trim();
        if (text && text.length > 3) {
          features.push(text);
        }
      });
    });
    
    return features;
  }

  private extractDescription(element: Element): string | undefined {
    const descSelectors = ['.description', '.desc', 'p'];
    for (const selector of descSelectors) {
      const descElement = element.querySelector(selector);
      if (descElement?.textContent) {
        return descElement.textContent.trim();
      }
    }
    return undefined;
  }

  private isPopularPlan(element: Element): boolean {
    return element.classList.contains('popular') || 
           element.textContent?.toLowerCase().includes('popular') ||
           element.textContent?.toLowerCase().includes('recommended');
  }

  private extractButtonText(element: Element): string | undefined {
    const button = element.querySelector('button, .btn, .cta');
    return button?.textContent?.trim();
  }

  private extractQuestion(element: Element): string | null {
    const questionSelectors = ['.question', 'h3', 'h4', 'strong'];
    for (const selector of questionSelectors) {
      const questionElement = element.querySelector(selector);
      if (questionElement?.textContent) {
        return questionElement.textContent.trim();
      }
    }
    return null;
  }

  private extractAnswer(element: Element): string | null {
    const answerSelectors = ['.answer', 'p', '.content'];
    for (const selector of answerSelectors) {
      const answerElement = element.querySelector(selector);
      if (answerElement?.textContent) {
        return answerElement.textContent.trim();
      }
    }
    return null;
  }

  private extractFAQCategory(element: Element): string | undefined {
    const categoryElement = element.querySelector('.category, .tag');
    return categoryElement?.textContent?.trim();
  }

  private extractFAQTags(element: Element): string[] {
    const tagElements = element.querySelectorAll('.tag, .label');
    return Array.from(tagElements).map(tag => tag.textContent?.trim()).filter(Boolean) as string[];
  }

  private extractCompanyName(doc: Document): string {
    const nameSelectors = ['h1', '.company-name', '.brand', 'title'];
    for (const selector of nameSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private extractCompanyDescription(doc: Document): string {
    const descSelectors = ['.description', '.about', 'p'];
    for (const selector of descSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent && element.textContent.length > 50) {
        return element.textContent.trim();
      }
    }
    return '';
  }

  private extractMission(doc: Document): string | undefined {
    const missionElement = doc.querySelector('[class*="mission"]');
    return missionElement?.textContent?.trim();
  }

  private extractVision(doc: Document): string | undefined {
    const visionElement = doc.querySelector('[class*="vision"]');
    return visionElement?.textContent?.trim();
  }

  private extractValues(doc: Document): string[] {
    const values: string[] = [];
    const valueElements = doc.querySelectorAll('[class*="value"]');
    valueElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text) values.push(text);
    });
    return values;
  }

  private extractTeam(doc: Document): any[] {
    const team: any[] = [];
    const teamElements = doc.querySelectorAll('.team-member, .employee');
    teamElements.forEach(element => {
      const name = element.querySelector('.name, h3')?.textContent?.trim();
      const title = element.querySelector('.title, .position')?.textContent?.trim();
      if (name) {
        team.push({ name, title });
      }
    });
    return team;
  }

  private extractHistory(doc: Document): string | undefined {
    const historyElement = doc.querySelector('[class*="history"], [class*="story"]');
    return historyElement?.textContent?.trim();
  }

  private extractEmail(doc: Document): string | undefined {
    const emailMatch = doc.body?.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch?.[0];
  }

  private extractPhone(doc: Document): string | undefined {
    const phoneMatch = doc.body?.textContent?.match(/[\+]?[1-9][\d]{0,15}/);
    return phoneMatch?.[0];
  }

  private extractWebsite(doc: Document): string | undefined {
    const websiteMatch = doc.body?.textContent?.match(/https?:\/\/[^\s]+/);
    return websiteMatch?.[0];
  }

  private extractContactForm(doc: Document): string | undefined {
    const form = doc.querySelector('form[action*="contact"], form[class*="contact"]');
    return form?.getAttribute('action');
  }

  private extractProductInfo(content: string): { name: string; description: string } {
    // Simple product info extraction
    const lines = content.split('\n').filter(line => line.trim().length > 10);
    return {
      name: lines[0]?.substring(0, 100) || 'Product',
      description: lines.slice(1, 3).join(' ') || content.substring(0, 200)
    };
  }

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content quality
    let score = 0;
    
    if (content.length > 500) score += 0.3;
    if (content.length > 1000) score += 0.2;
    
    const sentences = content.split(/[.!?]+/).length;
    if (sentences > 10) score += 0.2;
    
    const words = content.split(/\s+/).length;
    if (words > 100) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private async extractEntities(content: string): Promise<any[]> {
    // Simple entity extraction
    const entities: any[] = [];
    
    // Extract emails
    const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    emails?.forEach(email => {
      entities.push({ text: email, type: 'email', confidence: 0.9 });
    });
    
    // Extract phones
    const phones = content.match(/[\+]?[1-9][\d]{0,15}/g);
    phones?.forEach(phone => {
      entities.push({ text: phone, type: 'phone', confidence: 0.8 });
    });
    
    return entities;
  }

  private analyzeSentiment(content: string): any {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
    
    const contentLower = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      const matches = contentLower.match(regex);
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      const matches = contentLower.match(regex);
      if (matches) negativeCount += matches.length;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }
    
    const score = (positiveCount - negativeCount) / total;
    const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    
    return { score, label, confidence: Math.abs(score) };
  }

  private calculateReadability(content: string): any {
    // Simple readability calculation
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);
    
    const fleschKincaid = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    return {
      fleschKincaid: Math.max(0, Math.min(100, fleschKincaid)),
      gunningFog: 0,
      smog: 0,
      colemanLiau: 0,
      automatedReadability: 0,
      average: fleschKincaid
    };
  }

  private countSyllables(text: string): number {
    // Simple syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;
    
    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllables += vowels.length;
      }
    });
    
    return syllables;
  }

  private extractKeywords(content: string): any[] {
    // Simple keyword extraction
    const words = content.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, frequency]) => ({
        word,
        frequency,
        importance: frequency / words.length
      }));
  }
}

// Export singleton instance
export const contentProcessor = new ContentProcessorService(); 