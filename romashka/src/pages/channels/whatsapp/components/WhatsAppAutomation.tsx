import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Search,
  Filter,
  Settings,
  AlertCircle,
  Users,
  MessageSquare,
  Calendar,
  Target
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  type: 'welcome' | 'out_of_hours' | 'keyword_trigger' | 'escalation' | 'follow_up';
  conditions: {
    keywords?: string[];
    businessHours?: boolean;
    customerType?: string;
    messageCount?: number;
    timeWithoutResponse?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  action: {
    type: 'send_message' | 'assign_agent' | 'add_tag' | 'schedule_followup' | 'escalate';
    message?: string;
    templateName?: string;
    agentId?: string;
    tags?: string[];
    delay?: number;
  };
  isActive: boolean;
  priority: number;
  usageCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppAutomationProps {
  channelId: string;
}

const WhatsAppAutomation: React.FC<WhatsAppAutomationProps> = ({ channelId }) => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    loadAutomationRules();
  }, [channelId]);

  const loadAutomationRules = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would come from API
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Welcome New Customers',
          type: 'welcome',
          conditions: {
            customerType: 'new'
          },
          action: {
            type: 'send_message',
            templateName: 'welcome_message'
          },
          isActive: true,
          priority: 1,
          usageCount: 145,
          lastTriggered: '2024-01-16T10:30:00Z',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Out of Hours Response',
          type: 'out_of_hours',
          conditions: {
            businessHours: false
          },
          action: {
            type: 'send_message',
            message: 'Thank you for your message. We are currently out of office. Our business hours are 9 AM to 5 PM, Monday to Friday. We will get back to you as soon as possible.'
          },
          isActive: true,
          priority: 2,
          usageCount: 89,
          lastTriggered: '2024-01-16T08:15:00Z',
          createdAt: '2024-01-14T15:45:00Z',
          updatedAt: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          name: 'Pricing Inquiry Handler',
          type: 'keyword_trigger',
          conditions: {
            keywords: ['price', 'pricing', 'cost', 'how much']
          },
          action: {
            type: 'send_message',
            message: 'I can help you with pricing information! Here are our current plans:\n\n• Basic Plan: $29/month\n• Pro Plan: $79/month\n• Enterprise: Custom pricing\n\nWould you like more details about any of these plans?'
          },
          isActive: true,
          priority: 3,
          usageCount: 34,
          lastTriggered: '2024-01-16T09:45:00Z',
          createdAt: '2024-01-13T12:20:00Z',
          updatedAt: '2024-01-13T12:20:00Z'
        },
        {
          id: '4',
          name: 'Support Escalation',
          type: 'escalation',
          conditions: {
            keywords: ['bug', 'error', 'broken', 'not working'],
            messageCount: 3
          },
          action: {
            type: 'assign_agent',
            agentId: 'agent_123'
          },
          isActive: true,
          priority: 4,
          usageCount: 12,
          lastTriggered: '2024-01-15T16:20:00Z',
          createdAt: '2024-01-12T14:10:00Z',
          updatedAt: '2024-01-12T14:10:00Z'
        },
        {
          id: '5',
          name: 'Follow-up Reminder',
          type: 'follow_up',
          conditions: {
            timeWithoutResponse: 3600 // 1 hour
          },
          action: {
            type: 'send_message',
            message: 'Hi! I noticed you haven\'t responded to my previous message. Is there anything else I can help you with?'
          },
          isActive: false,
          priority: 5,
          usageCount: 7,
          lastTriggered: '2024-01-14T11:30:00Z',
          createdAt: '2024-01-11T09:00:00Z',
          updatedAt: '2024-01-11T09:00:00Z'
        }
      ];

      setRules(mockRules);
    } catch (error) {
      console.error('Failed to load automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.action.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || rule.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rule.isActive) ||
                         (statusFilter === 'inactive' && !rule.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: AutomationRule['type']) => {
    const colors = {
      welcome: 'bg-green-100 text-green-800',
      out_of_hours: 'bg-blue-100 text-blue-800',
      keyword_trigger: 'bg-purple-100 text-purple-800',
      escalation: 'bg-red-100 text-red-800',
      follow_up: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge variant="outline" className={colors[type]}>
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'assign_agent':
        return <Users className="w-4 h-4" />;
      case 'add_tag':
        return <Target className="w-4 h-4" />;
      case 'schedule_followup':
        return <Calendar className="w-4 h-4" />;
      case 'escalate':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      ));
      // In real implementation, this would call the API
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      // In real implementation, this would call the API
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const CreateRuleDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Automation Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input id="rule-name" placeholder="e.g., Welcome New Customers" />
            </div>
            <div>
              <Label htmlFor="rule-type">Rule Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="out_of_hours">Out of Hours</SelectItem>
                  <SelectItem value="keyword_trigger">Keyword Trigger</SelectItem>
                  <SelectItem value="escalation">Escalation</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="rule-keywords">Keywords (comma-separated)</Label>
            <Input id="rule-keywords" placeholder="e.g., price, pricing, cost" />
          </div>
          
          <div>
            <Label htmlFor="rule-action">Action Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_message">Send Message</SelectItem>
                <SelectItem value="assign_agent">Assign Agent</SelectItem>
                <SelectItem value="add_tag">Add Tag</SelectItem>
                <SelectItem value="schedule_followup">Schedule Follow-up</SelectItem>
                <SelectItem value="escalate">Escalate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="rule-message">Message</Label>
            <Textarea
              id="rule-message"
              placeholder="Enter the message to send when this rule is triggered"
              rows={4}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="rule-active" />
            <Label htmlFor="rule-active">Active</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Rule
            </Button>
          </div>
        </div>
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
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Automation Rules</h2>
              <p className="text-gray-600">Manage your automated responses and workflows</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Rule
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
                      placeholder="Search rules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="out_of_hours">Out of Hours</SelectItem>
                      <SelectItem value="keyword_trigger">Keyword Trigger</SelectItem>
                      <SelectItem value="escalation">Escalation</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules List */}
          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        {getTypeBadge(rule.type)}
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Priority: {rule.priority} • Used {rule.usageCount} times
                        {rule.lastTriggered && ` • Last triggered: ${new Date(rule.lastTriggered).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Conditions */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Conditions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.conditions.keywords && (
                          <Badge variant="outline" className="text-xs">
                            Keywords: {rule.conditions.keywords.join(', ')}
                          </Badge>
                        )}
                        {rule.conditions.businessHours !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Business Hours: {rule.conditions.businessHours ? 'Yes' : 'No'}
                          </Badge>
                        )}
                        {rule.conditions.customerType && (
                          <Badge variant="outline" className="text-xs">
                            Customer Type: {rule.conditions.customerType}
                          </Badge>
                        )}
                        {rule.conditions.messageCount && (
                          <Badge variant="outline" className="text-xs">
                            Message Count: {rule.conditions.messageCount}
                          </Badge>
                        )}
                        {rule.conditions.timeWithoutResponse && (
                          <Badge variant="outline" className="text-xs">
                            No Response: {rule.conditions.timeWithoutResponse}s
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Action */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Action:</h4>
                      <div className="flex items-center gap-2">
                        {getActionIcon(rule.action.type)}
                        <span className="text-sm">
                          {rule.action.type.replace('_', ' ').charAt(0).toUpperCase() + rule.action.type.replace('_', ' ').slice(1)}
                        </span>
                        {rule.action.message && (
                          <span className="text-sm text-gray-600">
                            - {rule.action.message.substring(0, 100)}...
                          </span>
                        )}
                        {rule.action.templateName && (
                          <Badge variant="outline" className="text-xs">
                            Template: {rule.action.templateName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRules.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Automation Rules Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'No rules match your current filters.'
                    : 'You haven\'t created any automation rules yet.'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {rules.reduce((sum, rule) => sum + rule.usageCount, 0)}
                  </div>
                  <div className="text-sm text-blue-600">Total Triggers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {rules.filter(rule => rule.isActive).length}
                  </div>
                  <div className="text-sm text-green-600">Active Rules</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {rules.length > 0 ? Math.round(rules.reduce((sum, rule) => sum + rule.usageCount, 0) / rules.length) : 0}
                  </div>
                  <div className="text-sm text-yellow-600">Avg Usage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-gray-600">{getTypeBadge(rule.type)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{rule.usageCount}</div>
                      <div className="text-sm text-gray-600">triggers</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateRuleDialog />
    </div>
  );
};

export default WhatsAppAutomation;