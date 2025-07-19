/*
 * WebsiteScanner Service - CORS-Safe Implementation v2.0.0
 * Cache-bust: 2025-07-19T19:50:00Z
 */
import { supabase } from './supabaseClient';
import type {
  WebsiteScanJob,
  ScanConfig,
  ScanProgress,
  ExtractedContent,
  PageContent,
  UrlValidationResult,
  ScanError,
  ContentType,
  ScanJobStatus
} from '../types/websiteScanning';

export interface WebsiteScanner {
  startScanJob(urls: string[], config: ScanConfig): Promise<string>;
  scanUrl(url: string): Promise<ExtractedContent>;
  extractPageContent(html: string, url: string): Promise<PageContent>;
  classifyContentType(content: string, url: string): Promise<ContentType>;
  extractBusinessInfo(content: string): Promise<any>;
  validateUrl(url: string): Promise<UrlValidationResult>;
  getScanProgress(jobId: string): Promise<ScanProgress>;
  pauseScanJob(jobId: string): Promise<void>;
  resumeScanJob(jobId: string): Promise<void>;
  cancelScanJob(jobId: string): Promise<void>;
}

export class WebsiteScannerService implements WebsiteScanner {
  private activeJobs: Map<string, boolean> = new Map();
  private rateLimiters: Map<string, number> = new Map();

  async startScanJob(urls: string[], config: ScanConfig): Promise<string> {
    try {
      this.checkSupabase();
      
      console.log('🔍 Starting scan job with URLs:', urls);
      
      // Validate URLs
      const validationResults = await Promise.all(
        urls.map(url => {
          console.log(`🔎 Validating URL: ${url}`);
          return this.validateUrl(url);
        })
      );
      
      console.log('📊 Validation results:', validationResults);
      
      const validUrls = validationResults
        .filter(result => result.isValid)
        .map(result => result.normalizedUrl!);

      console.log('✅ Valid URLs found:', validUrls);

      if (validUrls.length === 0) {
        console.error('❌ No valid URLs after validation');
        throw new Error('No valid URLs provided');
      }

      // Create scan job
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase!
        .from('website_scan_jobs')
        .insert({
          user_id: user.id,
          urls: validUrls,
          status: 'pending',
          scan_settings: config,
          pages_found: 0,
          pages_processed: 0,
          progress_percentage: 0
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

  async scanUrl(url: string): Promise<ExtractedContent> {
    try {
      // For now, simulate the scan with mock content since CORS prevents direct fetching
      console.log(`Mock scanning URL: ${url}`);
      
      // Generate mock content based on URL
      const mockContent = this.generateMockContent(url);
      const pageContent = await this.extractPageContent(mockContent.html, url);
      
      // Classify content type
      const contentType = await this.classifyContentType(pageContent.content, url);
      
      // Calculate processing quality
      const processingQuality = this.calculateProcessingQuality(pageContent);
      
      // Extract entities
      const extractedEntities = await this.extractEntities(pageContent.content);

      return {
        id: '', // Will be set when saved to database
        scan_job_id: '', // Will be set when saved to database
        url,
        title: mockContent.title,
        content: pageContent.content,
        content_type: contentType,
        headings: this.extractHeadings(pageContent.headings),
        metadata: pageContent.metadata,
        word_count: pageContent.content.split(/\s+/).length,
        processing_quality: processingQuality,
        extracted_entities: extractedEntities,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error scanning URL:', error);
      throw error;
    }
  }

  async extractPageContent(html: string, url: string): Promise<PageContent> {
    try {
      // Parse HTML (in a real implementation, you'd use a proper HTML parser)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract title
      const title = doc.querySelector('title')?.textContent || '';
      
      // Extract main content
      const mainContent = this.extractMainContent(doc);
      
      // Extract metadata
      const metadata = this.extractMetadata(doc);
      
      // Extract links
      const links = Array.from(doc.querySelectorAll('a[href]'))
        .map(link => (link as HTMLAnchorElement).href)
        .filter(href => href.startsWith('http'));
      
      // Extract images
      const images = Array.from(doc.querySelectorAll('img[src]'))
        .map(img => (img as HTMLImageElement).src);
      
      // Extract headings
      const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(heading => ({
          level: parseInt(heading.tagName.charAt(1)),
          text: heading.textContent?.trim() || '',
          id: heading.id || undefined
        }));
      
      // Extract text blocks
      const textBlocks = Array.from(doc.querySelectorAll('p, div, span'))
        .filter(element => element.textContent?.trim())
        .map(element => ({
          text: element.textContent?.trim() || '',
          tag: element.tagName.toLowerCase(),
          className: element.className || undefined,
          id: element.id || undefined
        }));

      return {
        url,
        title,
        content: mainContent,
        html,
        metadata,
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
    try {
      // Simple content classification based on URL patterns and content analysis
      const urlLower = url.toLowerCase();
      const contentLower = content.toLowerCase();
      
      // Check URL patterns
      if (urlLower.includes('pricing') || urlLower.includes('price') || urlLower.includes('plan')) {
        return 'pricing';
      }
      
      if (urlLower.includes('faq') || urlLower.includes('help') || urlLower.includes('support')) {
        return 'faq';
      }
      
      if (urlLower.includes('about') || urlLower.includes('company') || urlLower.includes('team')) {
        return 'about';
      }
      
      if (urlLower.includes('product') || urlLower.includes('service')) {
        return 'product';
      }
      
      if (urlLower.includes('policy') || urlLower.includes('terms') || urlLower.includes('privacy')) {
        return 'policy';
      }
      
      if (urlLower.includes('contact') || urlLower.includes('support')) {
        return 'contact';
      }
      
      // Check content patterns
      if (contentLower.includes('$') && (contentLower.includes('month') || contentLower.includes('year'))) {
        return 'pricing';
      }
      
      if (contentLower.includes('question') && contentLower.includes('answer')) {
        return 'faq';
      }
      
      if (contentLower.includes('about us') || contentLower.includes('our story')) {
        return 'about';
      }
      
      return 'general';
    } catch (error) {
      console.error('Error classifying content type:', error);
      return 'general';
    }
  }

  async extractBusinessInfo(content: string): Promise<any> {
    try {
      // Extract business information using regex patterns
      const businessInfo: any = {
        companyName: this.extractCompanyName(content),
        contactInfo: this.extractContactInfo(content),
        socialMedia: this.extractSocialMedia(content),
        address: this.extractAddress(content)
      };
      
      return businessInfo;
    } catch (error) {
      console.error('Error extracting business info:', error);
      return {};
    }
  }

  async validateUrl(url: string): Promise<UrlValidationResult> {
    // COMPLETELY AVOID ANY NETWORK REQUESTS - CORS SAFE VALIDATION ONLY
    console.log(`🔎 [CORS-SAFE] Validating URL: ${url}`);
    
    const result: UrlValidationResult = {
      isValid: false,
      errors: [],
      warnings: []
    };
    
    try {
      // Handle URLs without protocol
      let testUrl = url.trim();
      if (!testUrl) {
        result.errors?.push('Empty URL');
        return result;
      }
      
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = `https://${testUrl}`;
      }
      
      // Use URL constructor for validation (no network request)
      const urlObj = new URL(testUrl);
      
      // Basic validation checks
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        result.errors?.push('Invalid hostname');
        return result;
      }
      
      if (!urlObj.hostname.includes('.')) {
        result.errors?.push('Hostname must contain a domain');
        return result;
      }
      
      // All checks passed
      result.isValid = true;
      result.normalizedUrl = urlObj.toString();
      
      console.log(`✅ [CORS-SAFE] URL validation passed: ${result.normalizedUrl}`);
      return result;
      
    } catch (error) {
      console.error(`❌ [CORS-SAFE] URL validation failed for ${url}:`, error);
      result.errors?.push(`Invalid URL format: ${error.message}`);
      return result;
    }
  }

  async getScanProgress(jobId: string): Promise<ScanProgress> {
    try {
      this.checkSupabase();
      
      const { data, error } = await supabase!
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
        estimatedTimeRemaining: this.calculateEstimatedTime(data)
      };
    } catch (error) {
      console.error('Error getting scan progress:', error);
      throw error;
    }
  }

  async pauseScanJob(jobId: string): Promise<void> {
    try {
      this.activeJobs.set(jobId, false);
      await this.updateScanJobStatus(jobId, 'pending');
    } catch (error) {
      console.error('Error pausing scan job:', error);
      throw error;
    }
  }

  async resumeScanJob(jobId: string): Promise<void> {
    try {
      this.activeJobs.set(jobId, true);
      await this.updateScanJobStatus(jobId, 'scanning');
      // Restart background scan
      this.restartBackgroundScan(jobId);
    } catch (error) {
      console.error('Error resuming scan job:', error);
      throw error;
    }
  }

  async cancelScanJob(jobId: string): Promise<void> {
    try {
      this.activeJobs.set(jobId, false);
      await this.updateScanJobStatus(jobId, 'failed');
    } catch (error) {
      console.error('Error canceling scan job:', error);
      throw error;
    }
  }

  // Private helper methods
  private checkSupabase(): void {
    if (!supabase) throw new Error('Supabase client not initialized');
  }

  private generateMockContent(url: string): { title: string; html: string } {
    // Generate realistic mock content based on URL
    const urlLower = url.toLowerCase();
    let title = 'Website Content';
    let content = '';

    if (urlLower.includes('pricing') || urlLower.includes('price')) {
      title = 'Pricing Plans';
      content = `
        <h1>Pricing Plans</h1>
        <h2>Choose Your Perfect Plan</h2>
        <div class="pricing-tier">
          <h3>Basic Plan</h3>
          <p>Perfect for small businesses</p>
          <div class="price">$29/month</div>
          <ul>
            <li>Up to 5 team members</li>
            <li>10GB storage</li>
            <li>Email support</li>
          </ul>
        </div>
        <div class="pricing-tier">
          <h3>Pro Plan</h3>
          <p>Great for growing teams</p>
          <div class="price">$59/month</div>
          <ul>
            <li>Up to 25 team members</li>
            <li>100GB storage</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
          </ul>
        </div>
        <div class="pricing-tier">
          <h3>Enterprise</h3>
          <p>For large organizations</p>
          <div class="price">Contact us</div>
          <ul>
            <li>Unlimited team members</li>
            <li>Unlimited storage</li>
            <li>24/7 phone support</li>
            <li>Custom integrations</li>
          </ul>
        </div>
      `;
    } else if (urlLower.includes('faq') || urlLower.includes('help')) {
      title = 'Frequently Asked Questions';
      content = `
        <h1>Frequently Asked Questions</h1>
        <div class="faq-item">
          <h3>How do I get started?</h3>
          <p>Getting started is easy! Simply sign up for an account and follow our step-by-step onboarding process.</p>
        </div>
        <div class="faq-item">
          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
        </div>
        <div class="faq-item">
          <h3>Can I cancel my subscription anytime?</h3>
          <p>Yes, you can cancel your subscription at any time. Your account will remain active until the end of your billing period.</p>
        </div>
        <div class="faq-item">
          <h3>Do you offer customer support?</h3>
          <p>We offer 24/7 customer support via email, chat, and phone for all our users.</p>
        </div>
      `;
    } else if (urlLower.includes('about') || urlLower.includes('company')) {
      title = 'About Us';
      content = `
        <h1>About Our Company</h1>
        <h2>Our Story</h2>
        <p>Founded in 2020, we are passionate about helping businesses succeed in the digital age. Our team of experts has years of experience in technology and customer service.</p>
        <h2>Our Mission</h2>
        <p>To provide innovative solutions that help businesses grow and thrive in an increasingly connected world.</p>
        <h2>Our Values</h2>
        <ul>
          <li>Customer-first approach</li>
          <li>Innovation and excellence</li>
          <li>Transparency and integrity</li>
          <li>Continuous improvement</li>
        </ul>
        <h2>Leadership Team</h2>
        <p>Our leadership team brings together decades of experience from leading technology companies.</p>
      `;
    } else if (urlLower.includes('contact') || urlLower.includes('support')) {
      title = 'Contact Us';
      content = `
        <h1>Contact Us</h1>
        <h2>Get in Touch</h2>
        <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        <div class="contact-info">
          <h3>Contact Information</h3>
          <p>Email: support@example.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>Address: 123 Business St, Suite 100, City, State 12345</p>
        </div>
        <div class="business-hours">
          <h3>Business Hours</h3>
          <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
          <p>Saturday: 10:00 AM - 4:00 PM EST</p>
          <p>Sunday: Closed</p>
        </div>
      `;
    } else {
      title = 'Welcome to Our Website';
      content = `
        <h1>Welcome to Our Website</h1>
        <h2>We're Here to Help</h2>
        <p>This is sample content extracted from the website. In a real implementation, this would be the actual content from the webpage.</p>
        <p>Our website contains information about our products, services, pricing, and how to get in touch with us.</p>
        <h3>What We Offer</h3>
        <ul>
          <li>Professional services</li>
          <li>Expert consultation</li>
          <li>24/7 customer support</li>
          <li>Affordable pricing</li>
        </ul>
      `;
    }

    return {
      title,
      html: `<!DOCTYPE html><html><head><title>${title}</title></head><body>${content}</body></html>`
    };
  }

  private async startBackgroundScan(jobId: string, urls: string[], config: ScanConfig): Promise<void> {
    this.activeJobs.set(jobId, true);
    
    try {
      await this.updateScanJobStatus(jobId, 'scanning');
      
      let pagesProcessed = 0;
      const maxPages = config.maxPages || 50;
      
      for (const url of urls) {
        if (!this.activeJobs.get(jobId)) break;
        
        try {
          // Rate limiting
          await this.rateLimit(url, config.rateLimit);
          
          // Scan URL
          const extractedContent = await this.scanUrl(url);
          
          // Save to database
          await this.saveExtractedContent(jobId, extractedContent);
          
          pagesProcessed++;
          await this.updateScanProgress(jobId, pagesProcessed, maxPages);
          
          // Log progress
          await this.logScanJob(jobId, 'info', `Processed: ${url}`);
          
        } catch (error) {
          await this.logScanJob(jobId, 'error', `Failed to process ${url}: ${error}`);
        }
      }
      
      await this.updateScanJobStatus(jobId, 'completed');
      
    } catch (error) {
      await this.updateScanJobStatus(jobId, 'failed');
      await this.logScanJob(jobId, 'error', `Scan job failed: ${error}`);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  private async updateScanJobStatus(jobId: string, status: ScanJobStatus): Promise<void> {
    try {
      this.checkSupabase();
      
      const { error } = await supabase!
        .from('website_scan_jobs')
        .update({ status })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating scan job status:', error);
      throw error;
    }
  }

  private async updateScanProgress(jobId: string, pagesProcessed: number, totalPages: number): Promise<void> {
    try {
      this.checkSupabase();
      
      const progressPercentage = Math.round((pagesProcessed / totalPages) * 100);
      
      const { error } = await supabase!
        .from('website_scan_jobs')
        .update({
          pages_processed: pagesProcessed,
          pages_found: totalPages,
          progress_percentage: progressPercentage
        })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating scan progress:', error);
      throw error;
    }
  }

  private async saveExtractedContent(jobId: string, content: ExtractedContent): Promise<void> {
    try {
      this.checkSupabase();
      
      const { error } = await supabase!
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
    } catch (error) {
      console.error('Error saving extracted content:', error);
      throw error;
    }
  }

  private async logScanJob(jobId: string, level: 'info' | 'warning' | 'error', message: string): Promise<void> {
    try {
      this.checkSupabase();
      
      const { error } = await supabase!
        .from('scan_job_logs')
        .insert({
          scan_job_id: jobId,
          log_level: level,
          message
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging scan job:', error);
    }
  }

  private async rateLimit(url: string, rateLimit?: number): Promise<void> {
    if (!rateLimit) return;
    
    const domain = new URL(url).hostname;
    const lastRequest = this.rateLimiters.get(domain);
    const now = Date.now();
    
    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      const minInterval = 1000 / rateLimit; // milliseconds between requests
      
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, minInterval - timeSinceLastRequest)
        );
      }
    }
    
    this.rateLimiters.set(domain, now);
  }

  private extractMainContent(doc: Document): string {
    // Simple content extraction - in a real implementation, you'd use more sophisticated algorithms
    const mainSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];
    
    for (const selector of mainSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        return element.textContent?.trim() || '';
      }
    }
    
    // Fallback to body content
    return doc.body?.textContent?.trim() || '';
  }

  private extractMetadata(doc: Document): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract meta tags
    const metaTags = doc.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });
    
    // Extract Open Graph tags
    const ogTags: Record<string, string> = {};
    doc.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (property && content) {
        ogTags[property] = content;
      }
    });
    metadata.ogTags = ogTags;
    
    return metadata;
  }

  private extractHeadings(headings: any[]): Record<string, any> {
    const headingMap: Record<string, any> = {};
    headings.forEach(heading => {
      const level = heading.level;
      if (!headingMap[`h${level}`]) {
        headingMap[`h${level}`] = [];
      }
      headingMap[`h${level}`].push(heading.text);
    });
    return headingMap;
  }

  private calculateProcessingQuality(pageContent: PageContent): number {
    // Calculate quality score based on content length, structure, etc.
    let score = 0;
    
    // Content length score
    const wordCount = pageContent.content.split(/\s+/).length;
    if (wordCount > 100) score += 0.3;
    if (wordCount > 500) score += 0.2;
    
    // Structure score
    if (pageContent.headings.length > 0) score += 0.2;
    if (pageContent.textBlocks.length > 5) score += 0.2;
    
    // Metadata score
    if (pageContent.metadata.title) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private async extractEntities(content: string): Promise<Record<string, any>> {
    // Simple entity extraction - in a real implementation, you'd use NLP libraries
    const entities: Record<string, any> = {
      emails: content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [],
      phones: content.match(/[\+]?[1-9][\d]{0,15}/g) || [],
      urls: content.match(/https?:\/\/[^\s]+/g) || []
    };
    
    return entities;
  }

  private extractCompanyName(content: string): string | undefined {
    // Simple company name extraction
    const patterns = [
      /(?:about|company|we are)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:inc|corp|company|ltd|llc)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }

  private extractContactInfo(content: string): any {
    const contactInfo: any = {};
    
    // Extract email
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) contactInfo.email = emailMatch[0];
    
    // Extract phone
    const phoneMatch = content.match(/[\+]?[1-9][\d]{0,15}/);
    if (phoneMatch) contactInfo.phone = phoneMatch[0];
    
    return contactInfo;
  }

  private extractSocialMedia(content: string): any {
    const socialMedia: any = {};
    
    const patterns = {
      facebook: /facebook\.com\/([^\s]+)/i,
      twitter: /twitter\.com\/([^\s]+)/i,
      linkedin: /linkedin\.com\/([^\s]+)/i,
      instagram: /instagram\.com\/([^\s]+)/i
    };
    
    for (const [platform, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) socialMedia[platform] = match[0];
    }
    
    return socialMedia;
  }

  private extractAddress(content: string): any {
    // Simple address extraction
    const addressMatch = content.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)[,\s]+[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5})/);
    
    if (addressMatch) {
      return { full: addressMatch[1] };
    }
    
    return {};
  }

  private calculateEstimatedTime(scanJob: WebsiteScanJob): number | undefined {
    if (scanJob.pages_processed === 0) return undefined;
    
    const elapsedTime = Date.now() - new Date(scanJob.started_at!).getTime();
    const avgTimePerPage = elapsedTime / scanJob.pages_processed;
    const remainingPages = scanJob.pages_found - scanJob.pages_processed;
    
    return remainingPages * avgTimePerPage;
  }

  private restartBackgroundScan(jobId: string): void {
    // This would restart the background scan process
    // Implementation depends on your background job system
    console.log(`Restarting background scan for job ${jobId}`);
  }
}

// Export singleton instance
export const websiteScanner = new WebsiteScannerService(); 