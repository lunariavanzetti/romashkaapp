import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Hash, TrendingUp, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string;
  category: string;
  language: string;
  usage_count: number;
  created_by: string;
  is_public: boolean;
  created_at: string;
}

interface CannedResponsesProps {
  onSelectResponse: (content: string) => void;
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string;
  companyName?: string;
  isVisible: boolean;
  onClose: () => void;
}

export const CannedResponses: React.FC<CannedResponsesProps> = ({
  onSelectResponse,
  customerName = '',
  customerEmail = '',
  orderNumber = '',
  companyName = 'Our Company',
  isVisible,
  onClose
}) => {
  const { user } = useAuthStore();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', 'General', 'Sales', 'Support', 'Billing', 'Technical'];

  useEffect(() => {
    if (isVisible) {
      loadCannedResponses();
      searchInputRef.current?.focus();
    }
  }, [isVisible, user?.id]);

  const loadCannedResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error loading canned responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const substituteVariables = (content: string): string => {
    return content
      .replace(/\{customer_name\}/g, customerName || 'there')
      .replace(/\{customer_email\}/g, customerEmail || 'your email')
      .replace(/\{order_number\}/g, orderNumber || '[order number]')
      .replace(/\{company_name\}/g, companyName)
      .replace(/\{agent_name\}/g, user?.full_name || 'Our team')
      .replace(/\{date\}/g, new Date().toLocaleDateString())
      .replace(/\{time\}/g, new Date().toLocaleTimeString());
  };

  const handleSelectResponse = async (response: CannedResponse) => {
    try {
      // Substitute variables in content
      const substitutedContent = substituteVariables(response.content);
      
      // Update usage count
      await supabase
        .from('canned_responses')
        .update({ usage_count: response.usage_count + 1 })
        .eq('id', response.id);

      onSelectResponse(substitutedContent);
      onClose();
    } catch (error) {
      console.error('Error using canned response:', error);
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    try {
      const substitutedContent = substituteVariables(content);
      await navigator.clipboard.writeText(substitutedContent);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.shortcut.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || response.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Canned Responses
            </h2>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} className="mr-2" />
                New Response
              </Button>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search responses or shortcuts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <Hash size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No responses match your search' : 'No canned responses available'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredResponses.map((response) => (
                <div
                  key={response.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer group"
                  onClick={() => handleSelectResponse(response)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {response.title}
                        </h3>
                        <span className="text-xs bg-primary-pink text-white px-2 py-1 rounded">
                          {response.shortcut}
                        </span>
                        <span className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {response.category}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                        {substituteVariables(response.content)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp size={12} />
                          Used {response.usage_count} times
                        </span>
                        <span>
                          {response.language.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          copyToClipboard(response.content, response.id);
                        }}
                      >
                        {copiedId === response.id ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                      {response.created_by === user?.id && (
                        <Button
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setEditingResponse(response);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variable Help */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Available Variables:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{'{customer_name}'} → {customerName || 'there'}</span>
            <span>{'{customer_email}'} → {customerEmail || 'email'}</span>
            <span>{'{order_number}'} → {orderNumber || '[order#]'}</span>
            <span>{'{company_name}'} → {companyName}</span>
            <span>{'{agent_name}'} → {user?.full_name || 'Agent'}</span>
            <span>{'{date}'} → {new Date().toLocaleDateString()}</span>
            <span>{'{time}'} → {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateResponseModal
        isVisible={showCreateModal || !!editingResponse}
        onClose={() => {
          setShowCreateModal(false);
          setEditingResponse(null);
        }}
        onSave={loadCannedResponses}
        editingResponse={editingResponse}
      />
    </div>
  );
};

// Create Response Modal Component
interface CreateResponseModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingResponse?: CannedResponse | null;
}

const CreateResponseModal: React.FC<CreateResponseModalProps> = ({
  isVisible,
  onClose,
  onSave,
  editingResponse
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: 'General',
    language: 'en',
    is_public: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingResponse) {
      setFormData({
        title: editingResponse.title,
        content: editingResponse.content,
        shortcut: editingResponse.shortcut,
        category: editingResponse.category,
        language: editingResponse.language,
        is_public: editingResponse.is_public
      });
    } else {
      setFormData({
        title: '',
        content: '',
        shortcut: '',
        category: 'General',
        language: 'en',
        is_public: true
      });
    }
  }, [editingResponse, isVisible]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (editingResponse) {
        const { error } = await supabase
          .from('canned_responses')
          .update(formData)
          .eq('id', editingResponse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('canned_responses')
          .insert({
            ...formData,
            created_by: user?.id
          });
        if (error) throw error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving response:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">
          {editingResponse ? 'Edit Response' : 'Create New Response'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
              placeholder="Response title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Shortcut</label>
            <input
              type="text"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
              placeholder="/greeting"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="General">General</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink h-32"
              placeholder="Response content with {variables}"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_public" className="text-sm">Make this response public for all agents</label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.content}
            className="flex-1"
          >
            {saving ? 'Saving...' : (editingResponse ? 'Update' : 'Create')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};