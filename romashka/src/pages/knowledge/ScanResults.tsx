import React, { useState, useEffect } from 'react';
import type { 
  ExtractedContent, 
  ProcessingResult, 
  AutoGeneratedKnowledge,
  ContentType,
  ContentFilters 
} from '../../types/websiteScanning';
import { Button } from '../../components/ui/Button';
import { AnimatedInput } from '../../components/ui/AnimatedInput';
import { Badge } from '../../components/ui/Badge';
import { Toast } from '../../components/ui/Toast';
import { useToastStore } from '../../components/ui/useToastStore';

interface ScanResultsProps {
  processingResult: ProcessingResult;
  onKnowledgeApproved?: (knowledgeItems: any[]) => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ 
  processingResult, 
  onKnowledgeApproved 
}) => {
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState<'individual' | 'bulk'>('individual');
  const [filters, setFilters] = useState<ContentFilters>({});
  const [filteredContent, setFilteredContent] = useState<ExtractedContent[]>([]);
  const [autoGeneratedKnowledge, setAutoGeneratedKnowledge] = useState<AutoGeneratedKnowledge[]>([]);
  const [approvedKnowledge, setApprovedKnowledge] = useState<string[]>([]);
  
  const { showToast } = useToastStore();

  useEffect(() => {
    setFilteredContent(applyFilters(processingResult.extractedContent, filters));
  }, [processingResult.extractedContent, filters]);

  useEffect(() => {
    // Generate auto-generated knowledge items
    generateAutoKnowledge();
  }, [processingResult.extractedContent]);

  const applyFilters = (content: ExtractedContent[], filters: ContentFilters): ExtractedContent[] => {
    return content.filter(item => {
      if (filters.contentType && item.content_type !== filters.contentType) return false;
      if (filters.qualityThreshold && item.processing_quality < filters.qualityThreshold) return false;
      if (filters.wordCountRange) {
        const [min, max] = filters.wordCountRange;
        if (item.word_count < min || item.word_count > max) return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        if (!item.title?.toLowerCase().includes(searchLower) && 
            !item.content.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  };

  const generateAutoKnowledge = () => {
    const autoKnowledge: AutoGeneratedKnowledge[] = [];
    
    processingResult.extractedContent.forEach(content => {
      const confidence = content.processing_quality;
      const category = getAutoCategory(content.content_type);
      
      autoKnowledge.push({
        id: `auto-${content.id}`,
        scan_job_id: content.scan_job_id,
        extracted_content_id: content.id,
        auto_category: category,
        confidence_score: confidence,
        needs_review: confidence < 0.8,
        approved: false,
        created_at: new Date().toISOString()
      });
    });
    
    setAutoGeneratedKnowledge(autoKnowledge);
  };

  const getAutoCategory = (contentType: ContentType): string => {
    const categoryMap: Record<ContentType, string> = {
      pricing: 'pricing_information',
      faq: 'frequently_asked_questions',
      about: 'company_information',
      product: 'product_information',
      policy: 'legal_information',
      contact: 'contact_information',
      general: 'general_information'
    };
    
    return categoryMap[contentType] || 'general_information';
  };

  const handleContentSelect = (contentId: string) => {
    if (selectedContent.includes(contentId)) {
      setSelectedContent(selectedContent.filter(id => id !== contentId));
    } else {
      setSelectedContent([...selectedContent, contentId]);
    }
  };

  const handleBulkSelect = () => {
    if (selectedContent.length === filteredContent.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent(filteredContent.map(item => item.id));
    }
  };

  const handleApproveKnowledge = (knowledgeId: string) => {
    if (approvedKnowledge.includes(knowledgeId)) {
      setApprovedKnowledge(approvedKnowledge.filter(id => id !== knowledgeId));
    } else {
      setApprovedKnowledge([...approvedKnowledge, knowledgeId]);
    }
  };

  const handleBulkApprove = () => {
    const selectedKnowledge = autoGeneratedKnowledge.filter(
      knowledge => selectedContent.includes(knowledge.extracted_content_id)
    );
    
    const knowledgeIds = selectedKnowledge.map(k => k.id);
    setApprovedKnowledge([...approvedKnowledge, ...knowledgeIds]);
    
    showToast(`${knowledgeIds.length} knowledge items approved`, 'success');
  };

  const handleSaveApproved = () => {
    const approvedItems = autoGeneratedKnowledge.filter(
      knowledge => approvedKnowledge.includes(knowledge.id)
    );
    
    if (onKnowledgeApproved) {
      onKnowledgeApproved(approvedItems);
    }
    
    showToast('Approved knowledge items saved', 'success');
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 0.8) return 'bg-green-100 text-green-800';
    if (quality >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getContentTypeColor = (type: ContentType): string => {
    const colorMap: Record<ContentType, string> = {
      pricing: 'bg-blue-100 text-blue-800',
      faq: 'bg-green-100 text-green-800',
      about: 'bg-purple-100 text-purple-800',
      product: 'bg-orange-100 text-orange-800',
      policy: 'bg-gray-100 text-gray-800',
      contact: 'bg-indigo-100 text-indigo-800',
      general: 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Scan Results</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewMode('individual')}
              className={reviewMode === 'individual' ? 'bg-blue-50 border-blue-200' : ''}
            >
              Individual Review
            </Button>
            <Button
              variant="outline"
              onClick={() => setReviewMode('bulk')}
              className={reviewMode === 'bulk' ? 'bg-blue-50 border-blue-200' : ''}
            >
              Bulk Review
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {processingResult.statistics.totalPages}
            </div>
            <div className="text-sm text-blue-600">Pages Scanned</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {processingResult.knowledgeItems.length}
            </div>
            <div className="text-sm text-green-600">Knowledge Items</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(processingResult.statistics.averageQuality * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600">Average Quality</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {autoGeneratedKnowledge.filter(k => k.needs_review).length}
            </div>
            <div className="text-sm text-orange-600">Need Review</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <AnimatedInput
              placeholder="Search content..."
              value={filters.searchTerm || ''}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={filters.contentType || ''}
              onChange={(e) => setFilters({ ...filters, contentType: e.target.value as ContentType || undefined })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="pricing">Pricing</option>
              <option value="faq">FAQ</option>
              <option value="about">About</option>
              <option value="product">Product</option>
              <option value="policy">Policy</option>
              <option value="contact">Contact</option>
              <option value="general">General</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Quality
            </label>
            <AnimatedInput
              type="number"
              min="0"
              max="1"
              step="0.1"
              placeholder="0.0"
              value={filters.qualityThreshold || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                qualityThreshold: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word Count Range
            </label>
            <div className="flex gap-2">
              <AnimatedInput
                type="number"
                placeholder="Min"
                value={filters.wordCountRange?.[0] || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  wordCountRange: [
                    e.target.value ? parseInt(e.target.value) : 0,
                    filters.wordCountRange?.[1] || 1000
                  ]
                })}
              />
              <AnimatedInput
                type="number"
                placeholder="Max"
                value={filters.wordCountRange?.[1] || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  wordCountRange: [
                    filters.wordCountRange?.[0] || 0,
                    e.target.value ? parseInt(e.target.value) : 1000
                  ]
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Extracted Content ({filteredContent.length})
          </h3>
          {reviewMode === 'bulk' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBulkSelect}
              >
                {selectedContent.length === filteredContent.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleBulkApprove}
                disabled={selectedContent.length === 0}
              >
                Approve Selected ({selectedContent.length})
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredContent.map((content) => (
            <div
              key={content.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedContent.includes(content.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {reviewMode === 'bulk' && (
                      <input
                        type="checkbox"
                        checked={selectedContent.includes(content.id)}
                        onChange={() => handleContentSelect(content.id)}
                        className="rounded border-gray-300"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">
                      {content.title || 'Untitled'}
                    </h4>
                    <Badge className={getContentTypeColor(content.content_type)}>
                      {content.content_type}
                    </Badge>
                    <Badge className={getQualityColor(content.processing_quality)}>
                      {(content.processing_quality * 100).toFixed(0)}% quality
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {content.url}
                  </p>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    {content.content.substring(0, 200)}...
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{content.word_count} words</span>
                    <span>•</span>
                    <span>{new Date(content.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(content.url, '_blank')}
                  >
                    View Source
                  </Button>
                  {reviewMode === 'individual' && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveKnowledge(`auto-${content.id}`)}
                      className={
                        approvedKnowledge.includes(`auto-${content.id}`) 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : ''
                      }
                    >
                      {approvedKnowledge.includes(`auto-${content.id}`) ? 'Approved' : 'Approve'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Generated Knowledge */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Auto-Generated Knowledge ({autoGeneratedKnowledge.length})
          </h3>
          <Button
            onClick={handleSaveApproved}
            disabled={approvedKnowledge.length === 0}
          >
            Save Approved ({approvedKnowledge.length})
          </Button>
        </div>

        <div className="space-y-4">
          {autoGeneratedKnowledge.map((knowledge) => (
            <div
              key={knowledge.id}
              className={`border rounded-lg p-4 ${
                approvedKnowledge.includes(knowledge.id) ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      {knowledge.auto_category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getQualityColor(knowledge.confidence_score)}>
                      {(knowledge.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                    {knowledge.needs_review && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Needs Review
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">
                    Generated from: {filteredContent.find(c => c.id === knowledge.extracted_content_id)?.title || 'Unknown'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {new Date(knowledge.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveKnowledge(knowledge.id)}
                    className={
                      approvedKnowledge.includes(knowledge.id) 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : ''
                    }
                  >
                    {approvedKnowledge.includes(knowledge.id) ? 'Approved' : 'Approve'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 