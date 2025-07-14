import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Play, Pause, Square, TrendingUp, Users, Target, Clock, 
  Plus, Edit, Trash2, Eye, CheckCircle, AlertCircle, Brain
} from 'lucide-react';

import { abTestingEngine } from '../../services/ai/training/abTestingEngine';
import type { ABTest, ABTestVariant, PersonalityConfig, ConversationFlowConfig } from '../../services/ai/training/abTestingEngine';

interface ABTestManagerProps {
  onTestCreated?: (test: ABTest) => void;
  onTestStarted?: (testId: string) => void;
  onTestCompleted?: (testId: string) => void;
}

const ABTestManager: React.FC<ABTestManagerProps> = ({
  onTestCreated,
  onTestStarted,
  onTestCompleted
}) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    type: 'response_style',
    variants: [],
    metrics: ['conversion_rate', 'customer_satisfaction'],
    hypothesis: '',
    successCriteria: '',
    channels: ['web', 'whatsapp']
  });

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const activeTests = await abTestingEngine.getActiveTests();
      setTests(activeTests);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    try {
      const test = await abTestingEngine.createTest(newTest);
      setTests([...tests, test]);
      setShowCreateDialog(false);
      setNewTest({
        name: '',
        description: '',
        type: 'response_style',
        variants: [],
        metrics: ['conversion_rate', 'customer_satisfaction'],
        hypothesis: '',
        successCriteria: '',
        channels: ['web', 'whatsapp']
      });
      if (onTestCreated) onTestCreated(test);
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const startTest = async (testId: string) => {
    try {
      await abTestingEngine.startTest(testId);
      await loadTests();
      if (onTestStarted) onTestStarted(testId);
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const completeTest = async (testId: string) => {
    try {
      await abTestingEngine.completeTest(testId);
      await loadTests();
      if (onTestCompleted) onTestCompleted(testId);
    } catch (error) {
      console.error('Error completing test:', error);
    }
  };

  const createPersonalityTest = async () => {
    const personalities: PersonalityConfig[] = [
      {
        name: 'Professional',
        tone: 'professional',
        formality: 'formal',
        responseLength: 'balanced',
        emoticons: false,
        personalizations: false,
        proactiveOffers: false,
        escalationEagerness: 'medium'
      },
      {
        name: 'Friendly',
        tone: 'friendly',
        formality: 'informal',
        responseLength: 'balanced',
        emoticons: true,
        personalizations: true,
        proactiveOffers: true,
        escalationEagerness: 'low'
      },
      {
        name: 'Empathetic',
        tone: 'empathetic',
        formality: 'neutral',
        responseLength: 'detailed',
        emoticons: false,
        personalizations: true,
        proactiveOffers: true,
        escalationEagerness: 'low'
      }
    ];

    try {
      const test = await abTestingEngine.createPersonalityTest(
        'AI Personality Comparison',
        personalities
      );
      setTests([...tests, test]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating personality test:', error);
    }
  };

  const createConversationFlowTest = async () => {
    const flows: ConversationFlowConfig[] = [
      {
        name: 'Direct Approach',
        greetingStyle: 'immediate',
        questionGathering: 'sequential',
        resolutionApproach: 'direct',
        followUpPattern: 'none',
        escalationTriggers: ['frustrated', 'complex_issue'],
        maxTurns: 10
      },
      {
        name: 'Consultative Approach',
        greetingStyle: 'warm',
        questionGathering: 'batched',
        resolutionApproach: 'consultative',
        followUpPattern: 'immediate',
        escalationTriggers: ['frustrated', 'unresolved'],
        maxTurns: 15
      },
      {
        name: 'Collaborative Approach',
        greetingStyle: 'professional',
        questionGathering: 'adaptive',
        resolutionApproach: 'collaborative',
        followUpPattern: 'scheduled',
        escalationTriggers: ['complex_issue', 'unresolved'],
        maxTurns: 20
      }
    ];

    try {
      const test = await abTestingEngine.createConversationFlowTest(
        'Conversation Flow Optimization',
        flows
      );
      setTests([...tests, test]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating conversation flow test:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B Test Manager</h2>
          <p className="text-gray-600">Create and manage AI optimization tests</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create Test</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-name">Test Name</Label>
                  <Input
                    id="test-name"
                    value={newTest.name}
                    onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                    placeholder="Enter test name"
                  />
                </div>
                <div>
                  <Label htmlFor="test-description">Description</Label>
                  <Textarea
                    id="test-description"
                    value={newTest.description}
                    onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                    placeholder="Describe what you're testing"
                  />
                </div>
                <div>
                  <Label htmlFor="test-type">Test Type</Label>
                  <Select 
                    value={newTest.type} 
                    onValueChange={(value) => setNewTest({...newTest, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="response_style">Response Style</SelectItem>
                      <SelectItem value="personality">Personality</SelectItem>
                      <SelectItem value="conversation_flow">Conversation Flow</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="escalation_rule">Escalation Rule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="test-hypothesis">Hypothesis</Label>
                  <Textarea
                    id="test-hypothesis"
                    value={newTest.hypothesis}
                    onChange={(e) => setNewTest({...newTest, hypothesis: e.target.value})}
                    placeholder="What do you expect to happen?"
                  />
                </div>
                <div>
                  <Label htmlFor="success-criteria">Success Criteria</Label>
                  <Textarea
                    id="success-criteria"
                    value={newTest.successCriteria}
                    onChange={(e) => setNewTest({...newTest, successCriteria: e.target.value})}
                    placeholder="How will you measure success?"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTest} disabled={!newTest.name}>
                    Create Test
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={createPersonalityTest}>
            <Brain className="w-4 h-4 mr-2" />
            Quick Personality Test
          </Button>
          <Button variant="outline" onClick={createConversationFlowTest}>
            <Target className="w-4 h-4 mr-2" />
            Quick Flow Test
          </Button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{test.type}</Badge>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs text-white ${getStatusColor(test.status)}`}>
                    {getStatusIcon(test.status)}
                    <span>{test.status}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Test Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{test.variants?.length || 0}</div>
                    <div className="text-xs text-gray-500">Variants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(test.trafficAllocation * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">Traffic</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {Math.ceil((new Date(test.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) || 0}
                    </div>
                    <div className="text-xs text-gray-500">Days Left</div>
                  </div>
                </div>

                {/* Variant Performance */}
                {test.variants && test.variants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Variant Performance</h4>
                    {test.variants.map((variant, index) => (
                      <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{variant.name}</span>
                          {variant.isControl && <Badge variant="outline" className="text-xs">Control</Badge>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {variant.metrics?.conversionRate?.toFixed(1) || 0}%
                          </span>
                          <Progress 
                            value={variant.metrics?.conversionRate || 0} 
                            className="w-16 h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    {test.status === 'draft' && (
                      <Button size="sm" onClick={() => startTest(test.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {test.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => completeTest(test.id)}>
                        <Square className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedTest(test)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(test.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No A/B Tests</h3>
              <p className="text-gray-600 mb-4">Create your first test to start optimizing AI performance</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Details Modal */}
      {selectedTest && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedTest.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Test Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {selectedTest.type}</div>
                    <div><strong>Status:</strong> {selectedTest.status}</div>
                    <div><strong>Channels:</strong> {selectedTest.channels.join(', ')}</div>
                    <div><strong>Traffic:</strong> {(selectedTest.trafficAllocation * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Metrics</h4>
                  <div className="space-y-1 text-sm">
                    {selectedTest.metrics.map((metric, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Hypothesis</h4>
                <p className="text-sm text-gray-600">{selectedTest.hypothesis}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Success Criteria</h4>
                <p className="text-sm text-gray-600">{selectedTest.successCriteria}</p>
              </div>

              {selectedTest.variants && selectedTest.variants.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Variant Performance</h4>
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={selectedTest.variants}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="metrics.conversionRate" fill="#8884d8" name="Conversion Rate" />
                        <Bar dataKey="metrics.customerSatisfaction" fill="#82ca9d" name="Satisfaction" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ABTestManager;