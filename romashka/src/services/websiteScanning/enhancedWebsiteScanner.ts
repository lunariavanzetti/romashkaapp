import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import robotsParser from 'robots-parser';
import stringSimilarity from 'string-similarity';
import TurndownService from 'turndown';
import { supabase } from '../supabaseClient';
import type {
  WebsiteScanJob,
  ScanConfig,
  ScanProgress,
  ExtractedContent,
  PageContent,
  UrlValidationResult,
  ScanError,
  ContentType,
  ScanJobStatus,
  ProcessingResult,
  ContentAnalysis,
  BusinessInfo
} from '../../types/websiteScanning';

export interface EnhancedWebsiteScanner {
  startScanJob(urls: string[], config: ScanConfig): Promise<string>;
  bulkScanUrls(urls: string[], config: ScanConfig): Promise<ProcessingResult>;
  scanUrl(url: string, config?: Partial<ScanConfig>): Promise<ExtractedContent>;
  extractPageContent(html: string, url: string): Promise<PageContent>;
  classifyContentType(content: string, url: string): Promise<ContentType>;
  analyzeContent(content: string, url: string): Promise<ContentAnalysis>;
  extractBusinessInfo(content: string, url: string): Promise<BusinessInfo>;
  validateUrl(url: string): Promise<UrlValidationResult>;
  getScanProgress(jobId: string): Promise<ScanProgress>;
  pauseScanJob(jobId: string): Promise<void>;
  resumeScanJob(jobId: string): Promise<void>;
  cancelScanJob(jobId: string): Promise<void>;
  checkRobotsTxt(url: string): Promise<boolean>;
  detectDuplicateContent(content: string, threshold?: number): Promise<string[]>;
}

export class EnhancedWebsiteScannerService implements EnhancedWebsiteScanner {
  private activeJobs: Map<string, boolean> = new Map();
  private rateLimiters: Map<string, { lastRequest: number; queue: Promise<void>[] }> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private turndownService: TurndownService;
  private contentCache: Map<string, ExtractedContent> = new Map();
  private duplicateThreshold = 0.85;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced'
    });
  }

  async startScanJob(urls: string[], config: ScanConfig): Promise<string> {
    try {
      // Validate URLs first
      const validationResults = await Promise.allSettled(
        urls.map(url => this.validateUrl(url))
      );

      const validUrls = validationResults
        .filter((result): result is PromiseFulfilledResult<UrlValidationResult> => 
          result.status === 'fulfilled' && result.value.isValid)
        .map(result => result.value.normalizedUrl!)
        .filter(Boolean);

      if (validUrls.length === 0) {
        throw new Error('No valid URLs provided');
      }

      // Create scan job
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('website_scan_jobs')
        .insert({
          user_id: user.id,
          urls: validUrls,
          status: 'pending',
          scan_settings: config,
          pages_found: validUrls.length,
          pages_processed: 0,
          progress_percentage: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Start scanning in background
      this.startBackgroundScan(data.id, validUrls, config);

      return data.id;
    } catch (error) {
      console.error('Error starting scan job:', error);
      throw error;
    }
  }

  async bulkScanUrls(urls: string[], config: ScanConfig): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      success: true,
      extractedContent: [],
      knowledgeItems: [],
      statistics: {
        totalPages: urls.length,
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
      },
      errors: []
    };

    const startTime = Date.now();
    const concurrencyLimit = config.rateLimit || 5;
    const chunks = this.chunkArray(urls, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(async (url) => {
        try {
          const content = await this.scanUrl(url, config);
          results.extractedContent.push(content);
          results.statistics.successfulExtractions++;
          results.statistics.contentTypes[content.content_type]++;
          
          // Convert to knowledge item
          const knowledgeItem = await this.convertToKnowledgeItem(content);
          results.knowledgeItems.push(knowledgeItem);
          
          return content;
        } catch (error) {
          results.statistics.failedExtractions++;
          results.errors?.push(`Failed to scan ${url}: ${error}`);
          return null;
        }
      });

      await Promise.all(promises);
    }

    // Calculate statistics
    results.statistics.processingTime = Date.now() - startTime;
    results.statistics.averageQuality = results.extractedContent.length > 0 
      ? results.extractedContent.reduce((sum, content) => sum + content.processing_quality, 0) / results.extractedContent.length
      : 0;

    return results;
  }

  async scanUrl(url: string, config: Partial<ScanConfig> = {}): Promise<ExtractedContent> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check robots.txt if required
        if (config.respectRobotsTxt !== false) {
          const robotsAllowed = await this.checkRobotsTxt(url);
          if (!robotsAllowed) {
            throw new Error('Blocked by robots.txt');
          }
        }

        // Apply rate limiting
        await this.applyRateLimit(url, config.rateLimit || 1);

        // Fetch page content
        const response = await fetch(url, {
          headers: {
            'User-Agent': config.userAgent || 'ROMASHKA-WebScanner/2.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          },
          timeout: (config.timeout || 30) * 1000
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const pageContent = await this.extractPageContent(html, url);
        
        // Analyze content
        const analysis = await this.analyzeContent(pageContent.content, url);
        
        // Extract business info
        const businessInfo = await this.extractBusinessInfo(pageContent.content, url);
        
        // Calculate processing quality
        const processingQuality = this.calculateProcessingQuality(pageContent, analysis);

        const extractedContent: ExtractedContent = {
          id: '', // Will be set when saved to database
          scan_job_id: '', // Will be set when saved to database
          url,
          title: pageContent.title || '',
          content: pageContent.content,
          content_type: analysis.contentType,
          headings: this.extractHeadings(pageContent.headings),
          metadata: {
            ...pageContent.metadata,
            businessInfo,
            analysis: {
              sentiment: analysis.sentiment,
              readability: analysis.readability,
              keywords: analysis.keywords
            }
          },
          word_count: pageContent.content.split(/\s+/).length,
          processing_quality: processingQuality,
          extracted_entities: analysis.entities,
          created_at: new Date().toISOString()
        };

        // Cache the result
        this.contentCache.set(url, extractedContent);

        return extractedContent;

      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
      }
    }

    throw new Error('Max retries exceeded');
  }

  async extractPageContent(html: string, url: string): Promise<PageContent> {
    try {
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, nav, footer, aside, .ads, .advertisement, .popup').remove();
      
      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   $('meta[property="og:title"]').attr('content') || '';
      
      // Extract main content using multiple strategies
      const mainContent = this.extractMainContent($);
      
      // Extract metadata
      const metadata = this.extractMetadata($);
      
      // Extract structured data
      const structuredData = this.extractStructuredData($);
      
      // Extract links
      const links = this.extractLinks($, url);
      
      // Extract images
      const images = this.extractImages($, url);
      
      // Extract headings
      const headings = this.extractHeadingStructure($);
      
      // Extract text blocks
      const textBlocks = this.extractTextBlocks($);

      return {
        url,
        title,
        content: mainContent,
        html,
        metadata: {
          ...metadata,
          structuredData
        },
        links,
        images,
        headings,
        textBlocks
      };
    } catch (error) {
      console.error('Error extracting page content:', error);
      throw error;
    }
  }

  async classifyContentType(content: string, url: string): Promise<ContentType> {
    const urlLower = url.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Enhanced classification with scoring
    const scores = {
      pricing: 0,
      faq: 0,
      about: 0,
      product: 0,
      policy: 0,
      contact: 0,
      general: 0
    };

    // URL-based classification
    if (urlLower.includes('pricing') || urlLower.includes('price') || urlLower.includes('plan')) {
      scores.pricing += 0.4;
    }
    
    if (urlLower.includes('faq') || urlLower.includes('help') || urlLower.includes('support')) {
      scores.faq += 0.4;
    }
    
    if (urlLower.includes('about') || urlLower.includes('company') || urlLower.includes('team')) {
      scores.about += 0.4;
    }
    
    if (urlLower.includes('product') || urlLower.includes('service') || urlLower.includes('feature')) {
      scores.product += 0.4;
    }
    
    if (urlLower.includes('policy') || urlLower.includes('terms') || urlLower.includes('privacy')) {
      scores.policy += 0.4;
    }
    
    if (urlLower.includes('contact') || urlLower.includes('support')) {
      scores.contact += 0.4;
    }

    // Content-based classification
    const pricingKeywords = ['$', 'price', 'cost', 'plan', 'subscription', 'billing', 'payment'];
    const faqKeywords = ['question', 'answer', 'frequently asked', 'faq', 'help'];
    const aboutKeywords = ['about us', 'our story', 'company', 'mission', 'vision'];
    const productKeywords = ['feature', 'product', 'service', 'solution', 'tool'];
    const policyKeywords = ['privacy policy', 'terms of service', 'cookie policy', 'legal'];
    const contactKeywords = ['contact us', 'get in touch', 'email', 'phone', 'address'];

    [pricingKeywords, faqKeywords, aboutKeywords, productKeywords, policyKeywords, contactKeywords].forEach((keywords, index) => {
      const typeNames = ['pricing', 'faq', 'about', 'product', 'policy', 'contact'];
      const matches = keywords.filter(keyword => contentLower.includes(keyword)).length;
      scores[typeNames[index] as ContentType] += matches * 0.1;
    });

    // Return the type with highest score
    const maxScore = Math.max(...Object.values(scores));
    const bestType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as ContentType;
    
    return bestType || 'general';
  }

  async analyzeContent(content: string, url: string): Promise<ContentAnalysis> {
    const contentType = await this.classifyContentType(content, url);
    
    return {
      contentType,
      confidence: 0.8, // This would be calculated based on classification scores
      entities: await this.extractEntities(content),
      sentiment: this.analyzeSentiment(content),
      readability: this.calculateReadability(content),
      keywords: this.extractKeywords(content)
    };
  }

  async extractBusinessInfo(content: string, url: string): Promise<BusinessInfo> {
    const businessInfo: BusinessInfo = {
      contactInfo: {}
    };

    // Extract company name
    businessInfo.companyName = this.extractCompanyName(content, url);
    
    // Extract description
    businessInfo.description = this.extractDescription(content);
    
    // Extract contact information
    businessInfo.contactInfo = {
      email: this.extractEmail(content),
      phone: this.extractPhone(content),
      website: url,
      contactForm: this.extractContactForm(content)
    };
    
    // Extract social media
    businessInfo.socialMedia = this.extractSocialMedia(content);
    
    // Extract address
    businessInfo.address = this.extractAddress(content);
    
    // Extract additional info
    businessInfo.industry = this.extractIndustry(content);
    businessInfo.founded = this.extractFounded(content);
    businessInfo.employees = this.extractEmployees(content);

    return businessInfo;
  }

  async validateUrl(url: string): Promise<UrlValidationResult> {
    const result: UrlValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };

    try {
      // Basic URL validation
      const urlObj = new URL(url);
      result.normalizedUrl = urlObj.toString();
      result.isValid = true;

      // Check if URL is accessible
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent': 'ROMASHKA-WebScanner/2.0'
          }
        });

        if (!response.ok) {
          result.errors?.push(`HTTP ${response.status}: ${response.statusText}`);
          result.isValid = false;
        }

        // Check for redirects
        if (response.redirected) {
          result.redirects = [response.url];
          result.finalUrl = response.url;
          result.warnings?.push('URL redirects to different location');
        }
      } catch (error) {
        result.errors?.push(`Unable to access URL: ${error}`);
        result.isValid = false;
      }

    } catch (error) {
      result.errors?.push('Invalid URL format');
      result.isValid = false;
    }

    return result;
  }

  async getScanProgress(jobId: string): Promise<ScanProgress> {
    const { data, error } = await supabase
      .from('website_scan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;

    return {
      jobId: data.id,
      status: data.status,
      progress: data.progress_percentage,
      pagesFound: data.pages_found,
      pagesProcessed: data.pages_processed,
      currentUrl: data.current_url,
      estimatedTimeRemaining: this.calculateEstimatedTime(data)
    };
  }

  async pauseScanJob(jobId: string): Promise<void> {
    this.activeJobs.set(jobId, false);
    await this.updateScanJobStatus(jobId, 'pending');
  }

  async resumeScanJob(jobId: string): Promise<void> {
    this.activeJobs.set(jobId, true);
    await this.updateScanJobStatus(jobId, 'scanning');
  }

  async cancelScanJob(jobId: string): Promise<void> {
    this.activeJobs.set(jobId, false);
    await this.updateScanJobStatus(jobId, 'failed');
  }

  async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      const response = await fetch(robotsUrl, { timeout: 5000 });
      if (!response.ok) return true; // If robots.txt doesn't exist, allow crawling
      
      const robotsTxt = await response.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      
      return robots.isAllowed(url, 'ROMASHKA-WebScanner') ?? true;
    } catch (error) {
      return true; // Default to allowing if we can't check
    }
  }

  async detectDuplicateContent(content: string, threshold = this.duplicateThreshold): Promise<string[]> {
    const duplicates: string[] = [];
    
    for (const [url, cachedContent] of this.contentCache.entries()) {
      const similarity = stringSimilarity.compareTwoStrings(content, cachedContent.content);
      if (similarity >= threshold) {
        duplicates.push(url);
      }
    }
    
    return duplicates;
  }

  // Private helper methods
  private extractMainContent($: cheerio.CheerioAPI): string {
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.post-content',
      '.entry-content'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 100) {
        return this.turndownService.turndown(element.html() || '');
      }
    }
    
    // Fallback: extract from body, excluding navigation and sidebar
    const bodyClone = $('body').clone();
    bodyClone.find('nav, .nav, .navigation, .sidebar, .menu, footer, .footer').remove();
    
    return this.turndownService.turndown(bodyClone.html() || '');
  }

  private extractMetadata($: cheerio.CheerioAPI): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract meta tags
    $('meta').each((_, element) => {
      const name = $(element).attr('name') || $(element).attr('property');
      const content = $(element).attr('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    
    // Extract Open Graph and Twitter Card data
    const ogTags: Record<string, string> = {};
    const twitterTags: Record<string, string> = {};
    
    $('meta[property^="og:"]').each((_, element) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');
      if (property && content) {
        ogTags[property] = content;
      }
    });
    
    $('meta[name^="twitter:"]').each((_, element) => {
      const name = $(element).attr('name');
      const content = $(element).attr('content');
      if (name && content) {
        twitterTags[name] = content;
      }
    });
    
    metadata.ogTags = ogTags;
    metadata.twitterTags = twitterTags;
    
    return metadata;
  }

  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).text());
        structuredData.push(data);
      } catch (error) {
        // Invalid JSON, skip
      }
    });
    
    return structuredData;
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = [];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          if (absoluteUrl.startsWith('http')) {
            links.push(absoluteUrl);
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });
    
    return Array.from(new Set(links)); // Remove duplicates
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    
    $('img[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).toString();
          images.push(absoluteUrl);
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });
    
    return Array.from(new Set(images)); // Remove duplicates
  }

  private extractHeadingStructure($: cheerio.CheerioAPI): any[] {
    const headings: any[] = [];
    
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $element = $(element);
      headings.push({
        level: parseInt(element.tagName.charAt(1)),
        text: $element.text().trim(),
        id: $element.attr('id'),
        className: $element.attr('class')
      });
    });
    
    return headings;
  }

  private extractTextBlocks($: cheerio.CheerioAPI): any[] {
    const textBlocks: any[] = [];
    
    $('p, div, span, li').each((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      
      if (text.length > 10) { // Only include meaningful text blocks
        textBlocks.push({
          text,
          tag: element.tagName.toLowerCase(),
          className: $element.attr('class'),
          id: $element.attr('id')
        });
      }
    });
    
    return textBlocks;
  }

  private extractHeadings(headings: any[]): Record<string, any> {
    const headingMap: Record<string, any> = {};
    
    headings.forEach(heading => {
      const level = heading.level;
      const key = `h${level}`;
      
      if (!headingMap[key]) {
        headingMap[key] = [];
      }
      
      headingMap[key].push(heading.text);
    });
    
    return headingMap;
  }

  private calculateProcessingQuality(pageContent: PageContent, analysis: ContentAnalysis): number {
    let score = 0;
    
    // Content length score (0-0.3)
    const wordCount = pageContent.content.split(/\s+/).length;
    if (wordCount > 50) score += 0.1;
    if (wordCount > 200) score += 0.1;
    if (wordCount > 500) score += 0.1;
    
    // Structure score (0-0.3)
    if (pageContent.headings.length > 0) score += 0.1;
    if (pageContent.headings.length > 3) score += 0.1;
    if (pageContent.textBlocks.length > 5) score += 0.1;
    
    // Metadata score (0-0.2)
    if (pageContent.metadata.title) score += 0.1;
    if (pageContent.metadata.description) score += 0.1;
    
    // Content analysis score (0-0.2)
    if (analysis.readability.average > 50) score += 0.1;
    if (analysis.keywords.length > 5) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private async extractEntities(content: string): Promise<any[]> {
    const entities: any[] = [];
    
    // Extract emails
    const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      emailMatches.forEach(email => {
        entities.push({ text: email, type: 'email', confidence: 0.9 });
      });
    }
    
    // Extract phone numbers
    const phoneMatches = content.match(/[\+]?[1-9][\d\s\-\(\)]{7,15}/g);
    if (phoneMatches) {
      phoneMatches.forEach(phone => {
        entities.push({ text: phone, type: 'phone', confidence: 0.8 });
      });
    }
    
    // Extract URLs
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      urlMatches.forEach(url => {
        entities.push({ text: url, type: 'url', confidence: 0.9 });
      });
    }
    
    // Extract dates
    const dateMatches = content.match(/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g);
    if (dateMatches) {
      dateMatches.forEach(date => {
        entities.push({ text: date, type: 'date', confidence: 0.7 });
      });
    }
    
    return entities;
  }

  private analyzeSentiment(content: string): any {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor', 'disappointing'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = (positiveCount - negativeCount) / words.length;
    
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.01) label = 'positive';
    else if (score < -0.01) label = 'negative';
    
    return {
      score: Math.max(-1, Math.min(1, score * 10)), // Normalize to -1 to 1
      label,
      confidence: Math.min(0.9, Math.abs(score * 100))
    };
  }

  private calculateReadability(content: string): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch-Kincaid Grade Level
    const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
    
    // Simplified readability scores
    const readabilityScore = Math.max(0, Math.min(100, 100 - fleschKincaid * 5));
    
    return {
      fleschKincaid,
      gunningFog: fleschKincaid, // Simplified
      smog: fleschKincaid, // Simplified
      colemanLiau: fleschKincaid, // Simplified
      automatedReadability: fleschKincaid, // Simplified
      average: readabilityScore
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]/g);
    let syllableCount = vowels ? vowels.length : 1;
    
    // Subtract silent e
    if (word.endsWith('e')) syllableCount--;
    
    return Math.max(1, syllableCount);
  }

  private extractKeywords(content: string): any[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Count word frequency
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Get top keywords
    const keywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, frequency]) => ({
        word,
        frequency,
        importance: frequency / words.length,
        category: 'general'
      }));
    
    return keywords;
  }

  private extractCompanyName(content: string, url: string): string | undefined {
    // Try to extract from URL domain
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const domainParts = domain.split('.');
      if (domainParts.length > 0) {
        return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      }
    } catch (error) {
      // Continue with content extraction
    }
    
    // Extract from content
    const patterns = [
      /(?:about|company|we are)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:inc|corp|company|ltd|llc)/i,
      /welcome to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }

  private extractDescription(content: string): string | undefined {
    // Look for meta description or first paragraph
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.length > 0 ? sentences[0].trim() + '.' : undefined;
  }

  private extractEmail(content: string): string | undefined {
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : undefined;
  }

  private extractPhone(content: string): string | undefined {
    const phoneMatch = content.match(/[\+]?[1-9][\d\s\-\(\)]{7,15}/);
    return phoneMatch ? phoneMatch[0] : undefined;
  }

  private extractContactForm(content: string): string | undefined {
    if (content.toLowerCase().includes('contact form') || content.toLowerCase().includes('contact us')) {
      return 'Available';
    }
    return undefined;
  }

  private extractSocialMedia(content: string): any {
    const socialMedia: any = {};
    
    const patterns = {
      facebook: /facebook\.com\/([^\s"'<>]+)/i,
      twitter: /(?:twitter\.com|x\.com)\/([^\s"'<>]+)/i,
      linkedin: /linkedin\.com\/(?:in|company)\/([^\s"'<>]+)/i,
      instagram: /instagram\.com\/([^\s"'<>]+)/i,
      youtube: /youtube\.com\/(?:user|channel|c)\/([^\s"'<>]+)/i
    };
    
    for (const [platform, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        socialMedia[platform] = match[0];
      }
    }
    
    return Object.keys(socialMedia).length > 0 ? socialMedia : undefined;
  }

  private extractAddress(content: string): any {
    const addressMatch = content.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[,\s]+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5})/);
    
    if (addressMatch) {
      const fullAddress = addressMatch[1];
      const parts = fullAddress.split(',');
      
      return {
        full: fullAddress,
        street: parts[0]?.trim(),
        city: parts[1]?.trim(),
        state: parts[2]?.trim().split(' ')[0],
        zipCode: parts[2]?.trim().split(' ')[1]
      };
    }
    
    return undefined;
  }

  private extractIndustry(content: string): string | undefined {
    const industryKeywords = [
      'technology', 'software', 'healthcare', 'finance', 'education', 'retail',
      'manufacturing', 'consulting', 'marketing', 'real estate', 'automotive',
      'food', 'travel', 'entertainment', 'sports', 'fashion', 'beauty'
    ];
    
    const contentLower = content.toLowerCase();
    for (const industry of industryKeywords) {
      if (contentLower.includes(industry)) {
        return industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    }
    
    return undefined;
  }

  private extractFounded(content: string): string | undefined {
    const foundedMatch = content.match(/(?:founded|established|since)\s+(\d{4})/i);
    return foundedMatch ? foundedMatch[1] : undefined;
  }

  private extractEmployees(content: string): string | undefined {
    const employeeMatch = content.match(/(\d+[\+\-]*)\s+employees/i);
    return employeeMatch ? employeeMatch[1] : undefined;
  }

  private calculateEstimatedTime(scanJob: any): number | undefined {
    if (!scanJob.started_at || scanJob.pages_processed === 0) return undefined;
    
    const elapsedTime = Date.now() - new Date(scanJob.started_at).getTime();
    const avgTimePerPage = elapsedTime / scanJob.pages_processed;
    const remainingPages = scanJob.pages_found - scanJob.pages_processed;
    
    return remainingPages * avgTimePerPage;
  }

  private async applyRateLimit(url: string, requestsPerSecond: number): Promise<void> {
    const domain = new URL(url).hostname;
    const rateLimiter = this.rateLimiters.get(domain) || { lastRequest: 0, queue: [] };
    
    const now = Date.now();
    const minInterval = 1000 / requestsPerSecond;
    const timeSinceLastRequest = now - rateLimiter.lastRequest;
    
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }
    
    rateLimiter.lastRequest = Date.now();
    this.rateLimiters.set(domain, rateLimiter);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async convertToKnowledgeItem(content: ExtractedContent): Promise<any> {
    return {
      id: content.id,
      title: content.title,
      content: content.content,
      category: content.content_type,
      tags: content.extracted_entities?.map((e: any) => e.type) || [],
      confidence: content.processing_quality,
      source_url: content.url,
      created_at: content.created_at,
      updated_at: content.created_at
    };
  }

  private async startBackgroundScan(jobId: string, urls: string[], config: ScanConfig): Promise<void> {
    this.activeJobs.set(jobId, true);
    
    try {
      await this.updateScanJobStatus(jobId, 'scanning');
      
      const results = await this.bulkScanUrls(urls, config);
      
      // Save results to database
      for (const content of results.extractedContent) {
        await this.saveExtractedContent(jobId, content);
      }
      
      await this.updateScanJobStatus(jobId, 'completed');
      await this.updateScanProgress(jobId, results.statistics.successfulExtractions, urls.length);
      
    } catch (error) {
      await this.updateScanJobStatus(jobId, 'failed');
      await this.logScanJob(jobId, 'error', `Scan job failed: ${error}`);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async updateScanJobStatus(jobId: string, status: ScanJobStatus): Promise<void> {
    const { error } = await supabase
      .from('website_scan_jobs')
      .update({ 
        status,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', jobId);

    if (error) throw error;
  }

  private async updateScanProgress(jobId: string, pagesProcessed: number, totalPages: number): Promise<void> {
    const progressPercentage = Math.round((pagesProcessed / totalPages) * 100);
    
    const { error } = await supabase
      .from('website_scan_jobs')
      .update({
        pages_processed: pagesProcessed,
        pages_found: totalPages,
        progress_percentage: progressPercentage
      })
      .eq('id', jobId);

    if (error) throw error;
  }

  private async saveExtractedContent(jobId: string, content: ExtractedContent): Promise<void> {
    const { error } = await supabase
      .from('extracted_content')
      .insert({
        scan_job_id: jobId,
        url: content.url,
        title: content.title,
        content: content.content,
        content_type: content.content_type,
        headings: content.headings,
        metadata: content.metadata,
        word_count: content.word_count,
        processing_quality: content.processing_quality,
        extracted_entities: content.extracted_entities
      });

    if (error) throw error;
  }

  private async logScanJob(jobId: string, level: 'info' | 'warning' | 'error', message: string): Promise<void> {
    const { error } = await supabase
      .from('scan_job_logs')
      .insert({
        scan_job_id: jobId,
        log_level: level,
        message
      });

    if (error) console.error('Error logging scan job:', error);
  }
}

// Export singleton instance
export const enhancedWebsiteScanner = new EnhancedWebsiteScannerService();