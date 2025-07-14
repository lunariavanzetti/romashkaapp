import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  Target,
  MousePointer,
  Clock,
  Scroll,
  Users,
  AlertCircle,
  CheckCircle,
  Settings,
  Copy,
  Play,
  Pause
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { BehaviorTrigger, TRIGGER_TEMPLATES } from '../../../types/behaviorTriggers';
import { supabase } from '../../../lib/supabase';

export default function BehaviorTriggersSettings() {
  const [triggers, setTriggers] = useState<BehaviorTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrigger, setSelectedTrigger] = useState<BehaviorTrigger | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadTriggers();
    loadAnalytics();
  }, []);

  const loadTriggers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('behavior_triggers')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error loading triggers:', error);
        return;
      }

      setTriggers(data || []);
    } catch (error) {
      console.error('Error loading triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_trigger_performance_metrics', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error loading analytics:', error);
        return;
      }

      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const toggleTrigger = async (triggerId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('behavior_triggers')
        .update({ active: !active })
        .eq('id', triggerId);

      if (error) {
        console.error('Error toggling trigger:', error);
        return;
      }

      setTriggers(prev => 
        prev.map(trigger => 
          trigger.id === triggerId 
            ? { ...trigger, active: !trigger.active }
            : trigger
        )
      );
    } catch (error) {
      console.error('Error toggling trigger:', error);
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) return;

    try {
      const { error } = await supabase
        .from('behavior_triggers')
        .delete()
        .eq('id', triggerId);

      if (error) {
        console.error('Error deleting trigger:', error);
        return;
      }

      setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId));
    } catch (error) {
      console.error('Error deleting trigger:', error);
    }
  };

  const createTriggerFromTemplate = async (template: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const triggerData = {
        user_id: user.id,
        name: template.name,
        description: template.description,
        trigger_type: template.trigger_type,
        conditions: template.conditions,
        actions: template.actions,
        targeting: {
          pages: { include: [], exclude: [] },
          devices: ['desktop', 'tablet', 'mobile'],
          visitor_type: 'both'
        },
        analytics: {
          total_triggers: 0,
          total_conversions: 0,
          conversion_rate: 0,
          avg_engagement_time: 0,
          last_triggered: null,
          performance_by_page: {}
        }
      };

      const { data, error } = await supabase
        .from('behavior_triggers')
        .insert(triggerData)
        .select()
        .single();

      if (error) {
        console.error('Error creating trigger:', error);
        return;
      }

      setTriggers(prev => [...prev, data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating trigger:', error);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'exit_intent':
        return <MousePointer className="w-5 h-5" />;
      case 'time_on_page':
        return <Clock className="w-5 h-5" />;
      case 'scroll_depth':
        return <Scroll className="w-5 h-5" />;
      case 'return_visitor':
        return <Users className="w-5 h-5" />;
      case 'inactivity':
        return <Pause className="w-5 h-5" />;
      case 'form_abandonment':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'show_popup':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'start_chat':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'send_notification':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'show_discount':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading behavior triggers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-primary-teal" />
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                Behavior Triggers
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Automatically engage visitors based on their behavior patterns
            </p>
          </div>
          
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Trigger
          </Button>
        </div>

        {/* Analytics Summary */}
        {analytics && analytics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Triggers</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {analytics.reduce((sum: number, a: any) => sum + (a.total_triggers || 0), 0)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Conversions</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {analytics.reduce((sum: number, a: any) => sum + (a.total_conversions || 0), 0)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Conversion Rate</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {(analytics.reduce((sum: number, a: any) => sum + (a.conversion_rate || 0), 0) / analytics.length).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Revenue</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    ${analytics.reduce((sum: number, a: any) => sum + (a.revenue || 0), 0).toFixed(2)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Triggers List */}
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Triggers ({triggers.filter(t => t.active).length})
          </h3>
        </div>

        <div className="p-6">
          {triggers.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No triggers configured</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create your first behavior trigger to start engaging visitors automatically.
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Trigger
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger) => {
                const triggerAnalytics = analytics?.find((a: any) => a.trigger_id === trigger.id);
                
                return (
                  <div
                    key={trigger.id}
                    className={`p-4 border rounded-lg transition-all ${
                      trigger.active 
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          trigger.active ? 'bg-primary-teal/10 text-primary-teal' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}>
                          {getTriggerIcon(trigger.trigger_type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{trigger.name}</h4>
                            <Badge className={trigger.active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}>
                              {trigger.active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {trigger.trigger_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {trigger.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {trigger.conditions.length} condition{trigger.conditions.length !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              {trigger.actions.length} action{trigger.actions.length !== 1 ? 's' : ''}
                            </div>
                            {triggerAnalytics && (
                              <>
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="w-4 h-4" />
                                  {triggerAnalytics.total_triggers} triggers
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  {triggerAnalytics.conversion_rate}% conversion
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {trigger.actions.map((action, index) => (
                              <Badge key={index} className={getActionTypeColor(action.type)} variant="secondary">
                                {action.type.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTrigger(trigger.id, trigger.active)}
                          title={trigger.active ? 'Deactivate' : 'Activate'}
                        >
                          {trigger.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTrigger(trigger)}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTrigger(trigger.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Behavior Trigger</h3>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Choose from our pre-built templates or create a custom trigger.
              </p>
              
              {TRIGGER_TEMPLATES.map((template) => (
                <div key={template.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary-teal/10 rounded-lg flex items-center justify-center">
                        {getTriggerIcon(template.trigger_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {template.trigger_type.replace('_', ' ')}
                          </Badge>
                          {template.actions.map((action, index) => (
                            <Badge key={index} className={getActionTypeColor(action.type)} variant="secondary">
                              {action.type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => createTriggerFromTemplate(template)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}