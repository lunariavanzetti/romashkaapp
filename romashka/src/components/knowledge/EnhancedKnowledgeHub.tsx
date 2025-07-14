import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Upload,
  Download,
  BarChart3,
  BookOpen,
  Tag,
  Folder,
  Settings,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Link,
  History,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  FileText,
  Zap,
  Brain,
  Target,
  GitBranch,
  Users,
  Calendar,
  Activity,
  ChevronRight
} from 'lucide-react';

import { knowledgeBaseManager } from '../../services/websiteScanning/knowledgeBaseManager';
import { contentImporter } from '../../services/websiteScanning/contentImporter';
import { enhancedWebsiteScanner } from '../../services/websiteScanning/enhancedWebsiteScanner';
import type {
  KnowledgeCategory,
  KnowledgeSearchResult,
  KnowledgeSearchFilters,
  KnowledgeAnalytics,
  KnowledgeVersion,
  KnowledgeSuggestion
} from '../../services/websiteScanning/knowledgeBaseManager';

interface EnhancedKnowledgeHubProps {
  onItemSelect?: (item: KnowledgeSearchResult) => void;
  onEditItem?: (item: KnowledgeSearchResult) => void;
  onCreateNew?: () => void;
  className?: string;
}

interface ViewMode {
  type: 'grid' | 'list' | 'cards';
  columns: number;
}

interface SortOption {
  field: 'title' | 'updated_at' | 'usage_count' | 'effectiveness_score' | 'relevance_score';
  direction: 'asc' | 'desc';
}

interface ImportModalState {
  isOpen: boolean;
  type: 'file' | 'url' | 'text' | 'bulk';
  data: any;
}

export default function EnhancedKnowledgeHub({
  onItemSelect,
  onEditItem,
  onCreateNew,
  className = ''
}: EnhancedKnowledgeHubProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'analytics' | 'import' | 'settings'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeSearchResult[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<KnowledgeAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<KnowledgeSuggestion[]>([]);
  
  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'cards', columns: 3 });
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'updated_at', direction: 'desc' });
  const [filters, setFilters] = useState<KnowledgeSearchFilters>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [importModal, setImportModal] = useState<ImportModalState>({ isOpen: false, type: 'file', data: null });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [knowledgeGaps, setKnowledgeGaps] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load knowledge items when filters change
  useEffect(() => {
    loadKnowledgeItems();
  }, [selectedCategory, filters, currentPage, sortOption]);

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        loadKnowledgeItems();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, analyticsData, gaps] = await Promise.all([
        knowledgeBaseManager.getCategories(),
        knowledgeBaseManager.getAnalytics(),
        knowledgeBaseManager.identifyKnowledgeGaps()
      ]);

      setCategories(categoriesData);
      setAnalytics(analyticsData);
      setKnowledgeGaps(gaps);
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeItems = async () => {
    try {
      setLoading(true);
      const currentFilters = {
        ...filters,
        category_id: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      };

      const { items, total } = await knowledgeBaseManager.getKnowledgeItems(
        currentFilters,
        currentPage,
        itemsPerPage
      );

      // Sort items
      const sortedItems = [...items].sort((a, b) => {
        const aValue = a[sortOption.field];
        const bValue = b[sortOption.field];
        
        if (sortOption.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      setKnowledgeItems(sortedItems);
      setTotalItems(total);
    } catch (error) {
      setError('Failed to load knowledge items');
      console.error('Error loading knowledge items:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const currentFilters = {
        ...filters,
        category_id: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      };

      const { items, total } = await knowledgeBaseManager.searchKnowledge(
        searchQuery,
        currentFilters,
        currentPage,
        itemsPerPage
      );

      setKnowledgeItems(items);
      setTotalItems(total);
      setActiveTab('search');
    } catch (error) {
      setError('Search failed');
      console.error('Error searching knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (type: 'file' | 'url' | 'text', data: any) => {
    try {
      setLoading(true);
      let result;

      switch (type) {
        case 'file':
          result = await contentImporter.importFromFile(data);
          break;
        case 'url':
          result = await contentImporter.importFromURL(data);
          break;
        case 'text':
          result = await contentImporter.importFromText(data.content, data.title);
          break;
      }

      if (result) {
        await loadKnowledgeItems();
        setImportModal({ isOpen: false, type: 'file', data: null });
      }
    } catch (error) {
      setError('Import failed');
      console.error('Error importing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async (operation: 'delete' | 'archive' | 'tag', data?: any) => {
    try {
      setLoading(true);
      const itemIds = Array.from(selectedItems);

      switch (operation) {
        case 'delete':
          await Promise.all(itemIds.map(id => knowledgeBaseManager.deleteKnowledgeItem(id)));
          break;
        case 'archive':
          await knowledgeBaseManager.bulkUpdateKnowledgeItems(itemIds, { status: 'archived' });
          break;
        case 'tag':
          await knowledgeBaseManager.bulkUpdateKnowledgeItems(itemIds, { tags: data.tags });
          break;
      }

      setSelectedItems(new Set());
      await loadKnowledgeItems();
    } catch (error) {
      setError('Bulk operation failed');
      console.error('Error performing bulk operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: KnowledgeSearchResult) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const renderCategoryTree = (categories: KnowledgeCategory[], level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="mb-1">
        <div
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
            selectedCategory === category.id
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setSelectedCategory(category.id)}
        >
          <div className="flex items-center space-x-2">
            {category.children && category.children.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpansion(category.id);
                }}
                className="p-1 rounded hover:bg-gray-200"
              >
                <motion.div
                  animate={{ rotate: expandedCategories.has(category.id) ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </button>
            )}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color || '#6B7280' }}
            />
            <span className="text-sm font-medium">{category.name}</span>
          </div>
          {category.item_count && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {category.item_count}
            </span>
          )}
        </div>
        
        {category.children && expandedCategories.has(category.id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {renderCategoryTree(category.children, level + 1)}
          </motion.div>
        )}
      </div>
    ));
  };

  const renderKnowledgeItem = (item: KnowledgeSearchResult) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleItemSelection(item.id);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {item.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{item.usage_count}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Star className="w-4 h-4" />
                <span>{(item.effectiveness_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 line-clamp-3 mb-4">
            {item.summary || item.content.substring(0, 200)}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Folder className="w-4 h-4" />
                <span>{item.category_name || 'Uncategorized'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(item.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditItem) onEditItem(item);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_items}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.active_items}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.categories_count}</p>
              </div>
              <Folder className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Quality</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(analytics.quality_metrics.average_effectiveness * 100).toFixed(0)}%
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
            <div className="space-y-3">
              {analytics.top_categories.map(category => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{category.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(category.count / analytics.total_items) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Trends */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Search Trends</h3>
            <div className="space-y-3">
              {analytics.search_trends.map(trend => (
                <div key={trend.query} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{trend.query}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{trend.count}</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Knowledge Gaps */}
        {knowledgeGaps.length > 0 && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
              Knowledge Gaps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeGaps.map(gap => (
                <div key={gap} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800">{gap}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderImportModal = () => {
    if (!importModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-md"
        >
          <h3 className="text-lg font-semibold mb-4">Import Content</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setImportModal({ ...importModal, type: 'file' })}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  importModal.type === 'file'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 mx-auto mb-1" />
                File Upload
              </button>
              <button
                onClick={() => setImportModal({ ...importModal, type: 'url' })}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  importModal.type === 'url'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="w-4 h-4 mx-auto mb-1" />
                URL Import
              </button>
              <button
                onClick={() => setImportModal({ ...importModal, type: 'text' })}
                className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  importModal.type === 'text'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4 mx-auto mb-1" />
                Text Input
              </button>
            </div>

            {importModal.type === 'file' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, Word, Excel, TXT, MD, HTML, CSV, JSON
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.html,.csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => {
                        handleImport('file', file);
                      });
                    }
                  }}
                />
              </div>
            )}

            {importModal.type === 'url' && (
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="Enter URL to import..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleImport('url', e.currentTarget.value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input?.value) {
                      handleImport('url', input.value);
                    }
                  }}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import from URL
                </button>
              </div>
            )}

            {importModal.type === 'text' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                  placeholder="Enter content..."
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const titleInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                    const contentTextarea = document.querySelector('textarea') as HTMLTextAreaElement;
                    if (titleInput?.value && contentTextarea?.value) {
                      handleImport('text', {
                        title: titleInput.value,
                        content: contentTextarea.value
                      });
                    }
                  }}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Knowledge Item
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setImportModal({ isOpen: false, type: 'file', data: null })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Knowledge Hub</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-gray-200">
          <nav className="space-y-1">
            {[
              { id: 'browse', label: 'Browse', icon: BookOpen },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'import', label: 'Import', icon: Upload },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Categories</h3>
            <button
              onClick={() => setSelectedCategory('')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-1">
            {renderCategoryTree(categories)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'browse' && 'Browse Knowledge'}
                {activeTab === 'search' && 'Search Results'}
                {activeTab === 'analytics' && 'Analytics & Insights'}
                {activeTab === 'import' && 'Import Content'}
                {activeTab === 'settings' && 'Settings'}
              </h2>
              {totalItems > 0 && (
                <span className="text-sm text-gray-500">
                  {totalItems} items
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedItems.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} selected
                  </span>
                  <button
                    onClick={() => handleBulkOperation('delete')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setImportModal({ isOpen: true, type: 'file', data: null })}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              
              <button
                onClick={onCreateNew}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {knowledgeItems.map(item => renderKnowledgeItem(item))}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {searchQuery && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Showing results for: <strong>{searchQuery}</strong>
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {knowledgeItems.map(item => renderKnowledgeItem(item))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && renderAnalytics()}

          {activeTab === 'import' && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <Upload className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">File Upload</h3>
                  <p className="text-gray-600 mb-4">
                    Upload documents, PDFs, and other files to extract knowledge
                  </p>
                  <button
                    onClick={() => setImportModal({ isOpen: true, type: 'file', data: null })}
                    className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Files
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg border">
                  <Globe className="w-12 h-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">URL Import</h3>
                  <p className="text-gray-600 mb-4">
                    Import content from websites and online documentation
                  </p>
                  <button
                    onClick={() => setImportModal({ isOpen: true, type: 'url', data: null })}
                    className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Import from URL
                  </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg border">
                  <FileText className="w-12 h-12 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manual Entry</h3>
                  <p className="text-gray-600 mb-4">
                    Create knowledge items manually with rich text editor
                  </p>
                  <button
                    onClick={() => setImportModal({ isOpen: true, type: 'text', data: null })}
                    className="w-full bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Manual Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </div>
            </div>
          )}

          {!loading && knowledgeItems.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No knowledge items found
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by importing content or creating new knowledge items
              </p>
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Knowledge Item</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {renderImportModal()}
      </AnimatePresence>
    </div>
  );
}