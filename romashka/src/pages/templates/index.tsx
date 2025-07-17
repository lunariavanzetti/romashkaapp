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
      
      // Load templates (mock data for now)
      const mockTemplates: Template[] = [
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

      setTemplates(mockTemplates);

      // Load analytics
      const mockAnalytics: TemplateAnalytics = {
        totalTemplates: mockTemplates.length,
        activeTemplates: mockTemplates.filter(t => t.isActive).length,
        averageEffectiveness: mockTemplates.reduce((sum, t) => sum + t.effectivenessScore, 0) / mockTemplates.length,
        totalUsage: mockTemplates.reduce((sum, t) => sum + t.usageCount, 0),
        topPerformingTemplate: mockTemplates.sort((a, b) => b.effectivenessScore - a.effectivenessScore)[0]?.name || '',
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
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTemplates(prev => [newTemplate, ...prev]);
    }
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
          onClick={() => handleDuplicateTemplate(template.id)}
          variant="outline"
          size="sm"
        >
          <Copy className="w-4 h-4" />
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
                <h4 className="font-medium text-gray-900 mb-2">Variables</h4>
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

              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => handleOptimizeTemplate(selectedTemplate.id)}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
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