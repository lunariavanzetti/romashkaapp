import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  RotateCcw, 
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { 
  LeadScoringConfig, 
  LeadScoringCriteria, 
  DEFAULT_LEAD_SCORING_CRITERIA,
  DEFAULT_ROUTING_RULES 
} from '../../../types/leadScoring';
import { leadScoringEngine } from '../../../services/leadScoring/leadScoringEngine';

export default function LeadScoringSettings() {
  const [config, setConfig] = useState<LeadScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingCriteria, setEditingCriteria] = useState<LeadScoringCriteria | null>(null);
  const [previewScore, setPreviewScore] = useState<any>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      await leadScoringEngine.initialize();
      const loadedConfig = leadScoringEngine.getConfiguration();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading lead scoring configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setSaveStatus('idle');
      
      await leadScoringEngine.updateConfiguration(config);
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultConfig: LeadScoringConfig = {
      rules: [{
        id: 'default_rule',
        name: 'Default Lead Scoring Rule',
        criteria: DEFAULT_LEAD_SCORING_CRITERIA,
        routing_rules: DEFAULT_ROUTING_RULES,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }],
      default_criteria: DEFAULT_LEAD_SCORING_CRITERIA,
      scoring_settings: {
        auto_score_enabled: true,
        require_manual_review: false,
        score_threshold_consultation: 70,
        score_threshold_nurture: 40,
        score_expiry_days: 30
      }
    };
    setConfig(defaultConfig);
  };

  const updateCriteria = (criteriaId: string, updates: Partial<LeadScoringCriteria>) => {
    if (!config) return;

    setConfig(prev => ({
      ...prev!,
      rules: prev!.rules.map(rule => ({
        ...rule,
        criteria: rule.criteria.map(criterion =>
          criterion.id === criteriaId ? { ...criterion, ...updates } : criterion
        )
      }))
    }));
  };

  const updateSettings = (settingKey: string, value: any) => {
    if (!config) return;

    setConfig(prev => ({
      ...prev!,
      scoring_settings: {
        ...prev!.scoring_settings,
        [settingKey]: value
      }
    }));
  };

  const getRoutingColor = (action: string) => {
    switch (action) {
      case 'immediate_consultation':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'nurture_sequence':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'resource_sharing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'manual_review':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const simulateScore = () => {
    // Simulate a lead score with sample data
    const sampleData = {
      budget: 5000,
      company_size: '50-100',
      timeline: '1_month',
      decision_maker: 'marketing_director',
      pain_points: 'customer_support',
      industry: 'saas'
    };

    if (!config?.rules[0]) return;

    let totalScore = 0;
    let maxScore = 0;
    const breakdown: any[] = [];

    config.rules[0].criteria.forEach(criterion => {
      const value = sampleData[criterion.id as keyof typeof sampleData];
      let points = 0;
      const maxPoints = criterion.weight;

      if (value !== undefined && criterion.options) {
        const option = criterion.options.find(opt => opt.value === value);
        if (option) {
          points = Math.round((option.points / 100) * criterion.weight);
        }
      }

      totalScore += points;
      maxScore += maxPoints;
      breakdown.push({
        name: criterion.name,
        points,
        maxPoints,
        value
      });
    });

    setPreviewScore({
      total: totalScore,
      maxTotal: maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      breakdown
    });
  };

  if (loading) {
    return (
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading lead scoring settings...</span>
        </div>
      </div>
    );
  }

  const activeRule = config?.rules.find(rule => rule.active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-8 border border-white/20 backdrop-blur-glass">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-primary-teal" />
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                Lead Scoring System
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Automatically score and route leads based on qualification criteria
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Saved successfully</span>
              </motion.div>
            )}
            
            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-600"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Save failed</span>
              </motion.div>
            )}

            <Button variant="ghost" onClick={simulateScore}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Test Scoring
            </Button>
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Auto-Scoring Enabled</span>
              <p className="text-sm text-gray-600 dark:text-gray-300">Automatically score leads during conversations</p>
            </div>
            <input
              type="checkbox"
              checked={config?.scoring_settings.auto_score_enabled || false}
              onChange={(e) => updateSettings('auto_score_enabled', e.target.checked)}
              className="w-4 h-4 text-primary-teal focus:ring-primary-teal border-gray-300 rounded"
            />
          </label>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Consultation Threshold
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={config?.scoring_settings.score_threshold_consultation || 70}
              onChange={(e) => updateSettings('score_threshold_consultation', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nurture Threshold
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={config?.scoring_settings.score_threshold_nurture || 40}
              onChange={(e) => updateSettings('score_threshold_nurture', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Scoring Criteria */}
        <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Scoring Criteria
          </h3>
          
          <div className="space-y-4">
            {activeRule?.criteria.map((criterion) => (
              <div key={criterion.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{criterion.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {criterion.weight} points
                    </span>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={criterion.weight}
                    onChange={(e) => updateCriteria(criterion.id, { weight: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {criterion.options?.slice(0, 3).map((option, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{option.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round((option.points / 100) * criterion.weight)} pts
                      </span>
                    </div>
                  ))}
                  {criterion.options && criterion.options.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{criterion.options.length - 3} more options
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Routing Rules */}
        <div className="space-y-6">
          {/* Score Preview */}
          {previewScore && (
            <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Score Preview
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary-teal">
                  {previewScore.total}/{previewScore.maxTotal}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {previewScore.percentage}% Score
                </div>
              </div>

              <div className="space-y-2">
                {previewScore.breakdown.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                    <span className="font-medium">{item.points}/{item.maxPoints}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routing Configuration */}
          <div className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Routing Rules
            </h3>
            
            <div className="space-y-3">
              {activeRule?.routing_rules.map((rule, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rule.min_score}-{rule.max_score} points
                      </span>
                      <Badge className={getRoutingColor(rule.action)} variant="secondary">
                        {rule.action.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {rule.action === 'immediate_consultation' && <Award className="w-4 h-4 text-red-500" />}
                    {rule.action === 'nurture_sequence' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {rule.action === 'resource_sharing' && <Users className="w-4 h-4 text-blue-500" />}
                    {rule.action === 'manual_review' && <AlertCircle className="w-4 h-4 text-gray-500" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={handleReset} disabled={saving}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={simulateScore} disabled={saving}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Preview Scoring
          </Button>
          
          <Button variant="primary" onClick={handleSave} disabled={saving} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}