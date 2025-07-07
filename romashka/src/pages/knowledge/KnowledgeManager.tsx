import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, Download, Plus, Filter, BarChart3, Edit, Trash2, Eye } from 'lucide-react';
import { contentIngestionService, type KnowledgeItem } from '../../services/contentIngestion';
import { knowledgeRetrieval } from '../../services/knowledgeRetrieval';
import { supabase } from '../../services/supabaseClient';

interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  order_index: number;
}

interface KnowledgeManagerProps {
  onEditItem?: (item: KnowledgeItem) => void;
  onCreateNew?: () => void;
}

export default function KnowledgeManager({ onEditItem, onCreateNew }: KnowledgeManagerProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'file' | 'manual'>('manual');
  const [uploadData, setUploadData] = useState({ url: '', content: '', title: '' });

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      setLoading(true);

      // Fetch knowledge items
      const { data: itemsData, error: itemsError } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (categoriesError) throw categoriesError;

      setItems(itemsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching knowledge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await contentIngestionService.processFile(file);
      }
      await fetchKnowledgeData();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleURLUpload = async () => {
    if (!uploadData.url) return;

    setUploading(true);
    try {
      await contentIngestionService.processURL(uploadData.url);
      await fetchKnowledgeData();
      setShowUploadModal(false);
      setUploadData({ url: '', content: '', title: '' });
    } catch (error) {
      console.error('Error uploading URL:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleManualUpload = async () => {
    if (!uploadData.content || !uploadData.title) return;

    setUploading(true);
    try {
      await contentIngestionService.processManualContent(uploadData.content, uploadData.title);
      await fetchKnowledgeData();
      setShowUploadModal(false);
      setUploadData({ url: '', content: '', title: '' });
    } catch (error) {
      console.error('Error uploading manual content:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .update({ status: 'archived' })
        .eq('id', itemId);

      if (error) throw error;
      await fetchKnowledgeData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEditItem = (item: KnowledgeItem) => {
    onEditItem?.(item);
  };

  const handleCreateNew = () => {
    onCreateNew?.();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 transition-colors"
        >
          <Plus size={20} />
          Add Content
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter size={20} />
              Filter
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-primary-pink">{items.length}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-primary-green">
            {items.filter(item => item.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Items</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-primary-purple">
            {Math.round(items.reduce((sum, item) => sum + item.usage_count, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Usage</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-bold text-primary-orange">
            {Math.round(items.reduce((sum, item) => sum + item.effectiveness_score, 0) / items.length * 100)}%
          </div>
          <div className="text-sm text-gray-600">Avg Effectiveness</div>
        </div>
      </div>

      {/* Knowledge Items */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Knowledge Items</h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download size={16} />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <BarChart3 size={16} />
              Analytics
            </motion.button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedCategory !== 'all' ? 'No items match your filters' : 'No knowledge items found'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Usage: {item.usage_count}</span>
                      <span>Effectiveness: {Math.round(item.effectiveness_score * 100)}%</span>
                      <span>Language: {item.language}</span>
                      <span>Source: {item.source_type}</span>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-semibold mb-4">Add Knowledge Content</h3>
            
            <div className="flex gap-2 mb-4">
              {(['url', 'file', 'manual'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setUploadType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    uploadType === type
                      ? 'bg-primary-pink text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {uploadType === 'url' && (
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="Enter URL..."
                  value={uploadData.url}
                  onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleURLUpload}
                    disabled={uploading || !uploadData.url}
                    className="flex-1 py-2 px-4 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Import URL'}
                  </button>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {uploadType === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-sm text-gray-600 mb-2">Drop files here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-primary-pink hover:text-primary-pink/80">
                    Choose Files
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {uploadType === 'manual' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title..."
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                />
                <textarea
                  placeholder="Content..."
                  value={uploadData.content}
                  onChange={(e) => setUploadData({ ...uploadData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleManualUpload}
                    disabled={uploading || !uploadData.content || !uploadData.title}
                    className="flex-1 py-2 px-4 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : 'Add Content'}
                  </button>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
} 