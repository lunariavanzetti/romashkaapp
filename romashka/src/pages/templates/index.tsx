import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Star,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Sparkles,
  RefreshCw,
  BarChart3,
  Settings,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Target,
  Brain
} from 'lucide-react';

import { Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { TemplateService } from '../../services/templates/templateService';
import { AITrainingService } from '../../services/templates/aiTrainingService';
import { supabase } from '../../services/supabaseClient';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: any[];
  usageCount: number;
  effectivenessScore: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isActive: boolean;
}

interface TemplateAnalytics {
  totalTemplates: number;
  activeTemplates: number;
  averageEffectiveness: number;
  totalUsage: number;
  topPerformingTemplate: string;
  recentOptimizations: number;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics>({
    totalTemplates: 0,
    activeTemplates: 0,
    averageEffectiveness: 0,
    totalUsage: 0,
    topPerformingTemplate: '',
    recentOptimizations: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    category: 'support',
    content: '',
    variables: [],
    language: 'en',
    tags: []
  });

  const templateService = new TemplateService();
  const aiTrainingService = new AITrainingService();

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'greetings', name: 'Greetings', count: templates.filter(t => t.category === 'greetings').length },
    { id: 'support', name: 'Support', count: templates.filter(t => t.category === 'support').length },
    { id: 'sales', name: 'Sales', count: templates.filter(t => t.category === 'sales').length },
    { id: 'closing', name: 'Closing', count: templates.filter(t => t.category === 'closing').length }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load templates from database
      const { data: templatesData, error } = await supabase
        .from('response_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading templates:', error);
        // Fall back to mock data if database not available
      }

      // Use database data if available, otherwise mock data
      let loadedTemplates: Template[] = [];
      
      if (templatesData && templatesData.length > 0) {
        loadedTemplates = templatesData.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          category: t.category,
          content: t.content,
          variables: t.variables || [],
          usageCount: t.usage_count || 0,
          effectivenessScore: t.effectiveness_score || 0,
          language: t.language,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          tags: t.tags || [],
          isActive: t.is_active
        }));
      } else {
        // Mock data for demo/testing
        loadedTemplates = [
        {
          id: '1',
          name: 'Welcome Message',
          description: 'Standard greeting for new customers',
          category: 'greetings',
          content: 'Hello {customer_name}! Welcome to our platform. How can I help you today?',
          variables: [{ name: 'customer_name', type: 'text', required: true }],
          usageCount: 156,
          effectivenessScore: 94.2,
          language: 'en',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          tags: ['welcome', 'greeting', 'new-customer'],
          isActive: true
        },
        {
          id: '2',
          name: 'Technical Support',
          description: 'Initial response for technical issues',
          category: 'support',
          content: 'I understand you\'re experiencing {issue_type}. Let me help you resolve this quickly. Can you provide more details about when this started?',
          variables: [{ name: 'issue_type', type: 'text', required: true }],
          usageCount: 89,
          effectivenessScore: 87.5,
          language: 'en',
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-14T14:20:00Z',
          tags: ['technical', 'support', 'troubleshooting'],
          isActive: true
        },
        {
          id: '3',
          name: 'Order Status Inquiry',
          description: 'Response for order status questions',
          category: 'support',
          content: 'Hi {customer_name}! Your order {order_id} is currently {order_status}. Expected delivery: {delivery_date}. Track your order: {tracking_link}',
          variables: [
            { name: 'customer_name', type: 'text', required: true },
            { name: 'order_id', type: 'text', required: true },
            { name: 'order_status', type: 'select', required: true },
            { name: 'delivery_date', type: 'date', required: false },
            { name: 'tracking_link', type: 'text', required: false }
          ],
          usageCount: 234,
          effectivenessScore: 91.8,
          language: 'en',
          createdAt: '2024-01-13T09:15:00Z',
          updatedAt: '2024-01-13T09:15:00Z',
          tags: ['order', 'status', 'shipping'],
          isActive: true
        }
      ];

      }

      setTemplates(loadedTemplates);

      // Load analytics
      const mockAnalytics: TemplateAnalytics = {
        totalTemplates: loadedTemplates.length,
        activeTemplates: loadedTemplates.filter(t => t.isActive).length,
        averageEffectiveness: loadedTemplates.length > 0 ? loadedTemplates.reduce((sum, t) => sum + t.effectivenessScore, 0) / loadedTemplates.length : 0,
        totalUsage: loadedTemplates.reduce((sum, t) => sum + t.usageCount, 0),
        topPerformingTemplate: loadedTemplates.sort((a, b) => b.effectivenessScore - a.effectivenessScore)[0]?.name || '',
        recentOptimizations: 5
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleOptimizeTemplate = async (templateId: string) => {
    try {
      // In a real implementation, this would call the AI optimization service
      console.log('Optimizing template:', templateId);
      // Mock optimization result
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, effectivenessScore: Math.min(100, t.effectivenessScore + 2.5) }
          : t
      ));
    } catch (error) {
      console.error('Error optimizing template:', error);
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const duplicatedTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      alert('✅ Template duplicated successfully!');
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      alert('❌ Please fill in at least the template name and content.');
      return;
    }

    if (!user) {
      alert('❌ Please sign in to create templates.');
      return;
    }

    try {
      const templateData = {
        user_id: user.id.toString(),
        name: newTemplate.name!,
        description: newTemplate.description || '',
        category: newTemplate.category || 'support',
        content: newTemplate.content!,
        variables: extractVariablesFromContent(newTemplate.content!),
        usage_count: 0,
        effectiveness_score: 0,
        language: newTemplate.language || 'en',
        tags: newTemplate.tags || [],
        is_active: true
      };

      const { data, error } = await supabase
        .from('response_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        alert('❌ Failed to create template. Please try again.');
        return;
      }

      // Convert database record to UI format
      const template: Template = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        content: data.content,
        variables: data.variables || [],
        usageCount: data.usage_count || 0,
        effectivenessScore: data.effectiveness_score || 0,
        language: data.language,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        tags: data.tags || [],
        isActive: data.is_active
      };

      setTemplates(prev => [template, ...prev]);
      setNewTemplate({
        name: '',
        description: '',
        category: 'support',
        content: '',
        variables: [],
        language: 'en',
        tags: []
      });
      setShowCreateModal(false);
      alert('✅ Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Failed to create template. Please try again.');
    }
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplate = {
      ...editingTemplate,
      variables: extractVariablesFromContent(editingTemplate.content),
      updatedAt: new Date().toISOString()
    };

    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    ));
    setEditingTemplate(null);
    alert('✅ Template updated successfully!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      alert('✅ Template deleted successfully!');
    }
  };

  const extractVariablesFromContent = (content: string) => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];
      if (!variables.find(v => v.name === variableName)) {
        variables.push({
          name: variableName,
          type: 'text',
          required: true
        });
      }
    }
    
    return variables;
  };

  const addTagToNewTemplate = (tag: string) => {
    if (tag && !newTemplate.tags?.includes(tag)) {
      setNewTemplate(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTagFromNewTemplate = (tagToRemove: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const renderTemplateCard = (template: Template) => (
    <motion.div
      key={template.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">
              {template.effectivenessScore.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-800 line-clamp-2">
            {template.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">{template.usageCount} uses</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(template.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {template.variables.map((variable, index) => (
            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
              {variable.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={() => setSelectedTemplate(template)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button
          onClick={() => handleOptimizeTemplate(template.id)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Optimize
        </Button>
        <Button
          onClick={() => setEditingTemplate(template)}
          variant="outline"
          size="sm"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => handleDuplicateTemplate(template.id)}
          variant="outline"
          size="sm"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => handleDeleteTemplate(template.id)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Response Templates</h1>
                  <p className="text-sm text-gray-600">
                    Create, manage, and optimize AI-powered response templates
        </p>
                </div>
              </div>
      </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                variant="outline"
                className="text-gray-600 hover:text-gray-900"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
              Create Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTemplates}</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {analytics.activeTemplates} active templates
            </div>
          </div>

        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Effectiveness</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageEffectiveness.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Average across all templates
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalUsage}</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Times templates were used
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Optimizations</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.recentOptimizations}</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Recent improvements made
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-3" />
            <span className="text-gray-600">Loading templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredTemplates.map(template => renderTemplateCard(template))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Template</h3>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Welcome Message"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newTemplate.category || 'support'}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="greetings">Greetings</option>
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                    <option value="closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Content *</label>
                <textarea
                  value={newTemplate.content || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                  placeholder="Template content with variables in {variable_name} format"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Use {"{"} {"}"} to define variables. Example: "Hello {"{"}"customer_name"{"}"}"!"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTemplate.tags?.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTagFromNewTemplate(tag)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addTagToNewTemplate(input.value.trim());
                        input.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('new-tag') as HTMLInputElement;
                      if (input.value.trim()) {
                        addTagToNewTemplate(input.value.trim());
                        input.value = '';
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {newTemplate.content && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detected Variables</h4>
                  <div className="space-y-2">
                    {extractVariablesFromContent(newTemplate.content).map((variable, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-900">{variable.name}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {variable.type}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          Required
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
              <Button
                onClick={() => setEditingTemplate(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="greetings">Greetings</option>
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                    <option value="closing">Closing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Content *</label>
                <textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-none"
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Variables</h4>
                <div className="space-y-2">
                  {extractVariablesFromContent(editingTemplate.content).map((variable, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">{variable.name}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {variable.type}
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        Required
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                <Button
                  onClick={() => setEditingTemplate(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTemplate}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Template Details</h3>
              <Button
                onClick={() => setSelectedTemplate(null)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h4>
                <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                    {selectedTemplate.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    Used {selectedTemplate.usageCount} times
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedTemplate.effectivenessScore.toFixed(1)}% effective
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Template Content</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedTemplate.content}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Variables ({selectedTemplate.variables.length})</h4>
                <div className="space-y-2">
                  {selectedTemplate.variables.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">{variable.name}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {variable.type}
                      </span>
                      {variable.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => {
                    setEditingTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Template
                </Button>
                <Button
                  onClick={() => handleOptimizeTemplate(selectedTemplate.id)}
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize with AI
                </Button>
                <Button
                  onClick={() => handleDuplicateTemplate(selectedTemplate.id)}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}