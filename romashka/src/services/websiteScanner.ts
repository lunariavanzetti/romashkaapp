import { supabase } from './supabaseClient';
import { enhancedWebsiteScanner } from './websiteScanning/enhancedWebsiteScanner';
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

// Legacy interface for backward compatibility
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

/**
 * Legacy WebsiteScannerService - Maintained for backward compatibility
 * 
 * @deprecated Use enhancedWebsiteScanner from './websiteScanning/enhancedWebsiteScanner' instead
 * 
 * This class now acts as a wrapper around the enhanced website scanner
 * to maintain backward compatibility while providing access to improved features.
 */
export class WebsiteScannerService implements WebsiteScanner {
  
  async startScanJob(urls: string[], config: ScanConfig): Promise<string> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.startScanJob(urls, config);
  }

  async scanUrl(url: string): Promise<ExtractedContent> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.scanUrl(url);
  }

  async extractPageContent(html: string, url: string): Promise<PageContent> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.extractPageContent(html, url);
  }

  async classifyContentType(content: string, url: string): Promise<ContentType> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.classifyContentType(content, url);
  }

  async extractBusinessInfo(content: string): Promise<any> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.extractBusinessInfo(content, 'unknown');
  }

  async validateUrl(url: string): Promise<UrlValidationResult> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.validateUrl(url);
  }

  async getScanProgress(jobId: string): Promise<ScanProgress> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.getScanProgress(jobId);
  }

  async pauseScanJob(jobId: string): Promise<void> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.pauseScanJob(jobId);
  }

  async resumeScanJob(jobId: string): Promise<void> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.resumeScanJob(jobId);
  }

  async cancelScanJob(jobId: string): Promise<void> {
    console.warn('WebsiteScannerService is deprecated. Use enhancedWebsiteScanner instead.');
    return enhancedWebsiteScanner.cancelScanJob(jobId);
  }
}

// Export legacy singleton instance for backward compatibility
export const websiteScanner = new WebsiteScannerService();

// Re-export enhanced scanner for easy migration
export { enhancedWebsiteScanner } from './websiteScanning/enhancedWebsiteScanner';
export { contentImporter } from './websiteScanning/contentImporter';
export { knowledgeBaseManager } from './websiteScanning/knowledgeBaseManager';

/**
 * Migration Guide:
 * 
 * OLD:
 * import { websiteScanner } from './services/websiteScanner';
 * 
 * NEW:
 * import { enhancedWebsiteScanner } from './services/websiteScanning/enhancedWebsiteScanner';
 * 
 * The enhanced scanner provides:
 * - Better error handling and retry logic
 * - Improved content extraction using Cheerio
 * - AI-powered content analysis
 * - Bulk processing capabilities
 * - Duplicate detection
 * - Quality scoring
 * - And much more!
 */ 