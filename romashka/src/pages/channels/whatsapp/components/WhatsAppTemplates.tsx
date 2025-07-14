import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Search,
  Filter,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: 'utility' | 'marketing' | 'authentication';
  status: 'pending' | 'approved' | 'rejected';
  externalTemplateId?: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    format?: 'text' | 'media' | 'location' | 'document';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: Array<{
      type: 'quick_reply' | 'url' | 'phone_number';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
  approvalNotes?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppTemplatesProps {
  channelId: string;
}

const WhatsAppTemplates: React.FC<WhatsAppTemplatesProps> = ({ channelId }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    loadTemplates();
  }, [channelId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would come from API
      const mockTemplates: WhatsAppTemplate[] = [
        {
          id: '1',
          name: 'welcome_message',
          language: 'en',
          category: 'utility',
          status: 'approved',
          externalTemplateId: 'template_001',
          components: [
            {
              type: 'header',
              format: 'text',
              text: 'Welcome to {{1}}!'
            },
            {
              type: 'body',
              text: 'Hi {{1}}, welcome to ROMASHKA! We\'re excited to help you with your queries. Feel free to ask us anything.',
              example: {
                body_text: [['John', 'ROMASHKA']]
              }
            },
            {
              type: 'footer',
              text: 'Best regards, ROMASHKA Team'
            },
            {
              type: 'button',
              buttons: [
                {
                  type: 'quick_reply',
                  text: 'Get Started'
                }
              ]
            }
          ],
          usageCount: 145,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'order_confirmation',
          language: 'en',
          category: 'utility',
          status: 'approved',
          externalTemplateId: 'template_002',
          components: [
            {
              type: 'header',
              format: 'text',
              text: 'Order Confirmation #{{1}}'
            },
            {
              type: 'body',
              text: 'Thank you for your order! Your order #{{1}} has been confirmed and will be processed shortly.\n\nOrder Details:\n- Product: {{2}}\n- Quantity: {{3}}\n- Total: ${{4}}\n\nYou will receive a shipping notification once your order is dispatched.',
              example: {
                body_text: [['12345', 'Premium Package', '2', '99.99']]
              }
            },
            {
              type: 'footer',
              text: 'Track your order anytime'
            },
            {
              type: 'button',
              buttons: [
                {
                  type: 'url',
                  text: 'Track Order',
                  url: 'https://example.com/track/{{1}}'
                }
              ]
            }
          ],
          usageCount: 89,
          createdAt: '2024-01-14T15:45:00Z',
          updatedAt: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          name: 'appointment_reminder',
          language: 'en',
          category: 'utility',
          status: 'pending',
          components: [
            {
              type: 'header',
              format: 'text',
              text: 'Appointment Reminder'
            },
            {
              type: 'body',
              text: 'Hi {{1}}, this is a reminder that you have an appointment scheduled for {{2}} at {{3}}.\n\nPlease confirm your attendance or reschedule if needed.',
              example: {
                body_text: [['John', 'January 20, 2024', '2:00 PM']]
              }
            },
            {
              type: 'button',
              buttons: [
                {
                  type: 'quick_reply',
                  text: 'Confirm'
                },
                {
                  type: 'quick_reply',
                  text: 'Reschedule'
                }
              ]
            }
          ],
          usageCount: 0,
          createdAt: '2024-01-16T09:15:00Z',
          updatedAt: '2024-01-16T09:15:00Z'
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.components.some(comp => 
                           comp.text?.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: WhatsAppTemplate['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: WhatsAppTemplate['category']) => {
    const colors = {
      utility: 'bg-blue-100 text-blue-800',
      marketing: 'bg-purple-100 text-purple-800',
      authentication: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge variant="outline" className={colors[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      // In real implementation, this would call the API
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: WhatsAppTemplate) => {
    try {
      const duplicated = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name}_copy`,
        status: 'pending' as const,
        externalTemplateId: undefined,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTemplates(prev => [duplicated, ...prev]);
      // In real implementation, this would call the API
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleSendTest = async (template: WhatsAppTemplate) => {
    try {
      // In real implementation, this would send a test message
      console.log('Sending test message for template:', template.name);
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  const renderTemplatePreview = (template: WhatsAppTemplate) => {
    return (
      <div className="border rounded-lg p-4 bg-gray-50 max-w-md">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          {template.components.map((component, index) => (
            <div key={index} className="mb-3 last:mb-0">
              {component.type === 'header' && (
                <div className="font-semibold text-lg text-gray-900 mb-2">
                  {component.text?.replace(/\{\{(\d+)\}\}/g, (match, num) => `[Parameter ${num}]`)}
                </div>
              )}
              
              {component.type === 'body' && (
                <div className="text-gray-700 text-sm leading-relaxed mb-3">
                  {component.text?.replace(/\{\{(\d+)\}\}/g, (match, num) => `[Parameter ${num}]`)}
                </div>
              )}
              
              {component.type === 'footer' && (
                <div className="text-gray-500 text-xs mt-2">
                  {component.text}
                </div>
              )}
              
              {component.type === 'button' && component.buttons && (
                <div className="space-y-1 mt-3">
                  {component.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      className="w-full p-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-blue-600"
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CreateTemplateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input id="template-name" placeholder="e.g., welcome_message" />
            </div>
            <div>
              <Label htmlFor="template-language">Language</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="template-category">Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="template-header">Header (Optional)</Label>
            <Input id="template-header" placeholder="Template header text" />
          </div>
          
          <div>
            <Label htmlFor="template-body">Body Text *</Label>
            <Textarea
              id="template-body"
              placeholder="Enter your message body. Use {{1}}, {{2}}, etc. for variables."
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="template-footer">Footer (Optional)</Label>
            <Input id="template-footer" placeholder="Footer text" />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const PreviewDialog = () => (
    <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
        </DialogHeader>
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Name:</strong> {selectedTemplate.name}</p>
              <p><strong>Language:</strong> {selectedTemplate.language}</p>
              <p><strong>Category:</strong> {selectedTemplate.category}</p>
              <p><strong>Status:</strong> {selectedTemplate.status}</p>
            </div>
            
            {renderTemplatePreview(selectedTemplate)}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
              <Button onClick={() => handleSendTest(selectedTemplate)}>
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Templates</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
              <p className="text-gray-600">Manage your WhatsApp message templates</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(template.status)}
                        {getCategoryBadge(template.category)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <p><strong>Language:</strong> {template.language}</p>
                      <p><strong>Usage:</strong> {template.usageCount} times</p>
                    </div>
                    
                    {template.approvalNotes && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {template.approvalNotes}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      
                      {template.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendTest(template)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No templates match your current filters.'
                    : 'You haven\'t created any templates yet.'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Use the form below to create a new WhatsApp message template. 
                Templates need to be approved by Meta before they can be used.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                  <div className="text-sm text-blue-600">Total Templates</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {templates.filter(t => t.status === 'approved').length}
                  </div>
                  <div className="text-sm text-green-600">Approved</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                  </div>
                  <div className="text-sm text-yellow-600">Total Usage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTemplateDialog />
      <PreviewDialog />
    </div>
  );
};

export default WhatsAppTemplates;