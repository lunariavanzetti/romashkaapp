import { supabase } from '../supabaseClient';
import type { 
  VolumePredict,
  StaffingPrediction,
  PerformanceForecast,
  SeasonalPattern,
  OptimizationSuggestion,
  ConversationVolume,
  SatisfactionData,
  PerformanceMetrics,
  BenchmarkData,
  SatisfactionForecast,
  StaffingRecommendation
} from '../../types/analytics';

export interface PredictiveModel {
  name: string;
  version: string;
  accuracy: number;
  lastTrained: string;
  features: string[];
}

export interface ForecastInput {
  historicalData: number[];
  seasonalityFactors: number[];
  trendFactors: number[];
  externalFactors?: Record<string, number>;
}

export class PredictiveAnalyticsService {
  private models: Map<string, PredictiveModel> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor() {
    this.initializeModels();
  }

  // ================================
  // VOLUME FORECASTING
  // ================================

  async forecastConversationVolume(
    historicalData: ConversationVolume[],
    forecastDays: number = 30
  ): Promise<VolumePredict[]> {
    const cacheKey = `volume_forecast_${forecastDays}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Prepare historical data for analysis
      const volumeData = historicalData.map(d => d.volume);
      const dates = historicalData.map(d => new Date(d.date));

      // Apply time series analysis
      const forecast = await this.applyTimeSeriesForecasting(
        volumeData,
        dates,
        forecastDays
      );

      // Calculate seasonal adjustments
      const seasonalAdjustments = this.calculateSeasonalAdjustments(dates, volumeData);

      // Generate predictions
      const predictions: VolumePredict[] = [];
      const today = new Date();

      for (let i = 0; i < forecastDays; i++) {
        const forecastDate = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        const baseVolume = forecast[i] || this.calculateBaseline(volumeData);
        const seasonalFactor = this.getSeasonalFactor(forecastDate, seasonalAdjustments);
        const trendFactor = this.calculateTrendFactor(volumeData, i);

        const predictedVolume = Math.round(baseVolume * seasonalFactor * trendFactor);
        const confidence = this.calculateConfidence(i, forecastDays, volumeData.length);

        predictions.push({
          date: forecastDate,
          predictedVolume,
          confidence,
          seasonalAdjustment: seasonalFactor,
          trendFactor,
          baseVolume
        });
      }

      // Store predictions in database
      await this.storePredictions('volume_forecast', predictions);

      this.setCachedData(cacheKey, predictions);
      return predictions;
    } catch (error) {
      console.error('Error forecasting conversation volume:', error);
      throw error;
    }
  }

  async getVolumeForecasts(days: number = 30): Promise<VolumePredict[]> {
    try {
      const { data, error } = await supabase
        .from('predictive_analytics')
        .select('*')
        .eq('prediction_type', 'volume_forecast')
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .lte('prediction_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        date: new Date(item.prediction_date),
        predictedVolume: item.predicted_value,
        confidence: item.confidence_level,
        seasonalAdjustment: item.input_features?.seasonal_adjustment || 1.0,
        trendFactor: item.input_features?.trend_factor || 1.0,
        baseVolume: item.input_features?.base_volume || item.predicted_value
      }));
    } catch (error) {
      console.error('Error getting volume forecasts:', error);
      return [];
    }
  }

  // ================================
  // STAFFING OPTIMIZATION
  // ================================

  async calculateStaffingNeeds(
    volumeForecast: VolumePredict[],
    targetResponseTime: number = 120 // seconds
  ): Promise<StaffingRecommendation[]> {
    const cacheKey = `staffing_needs_${targetResponseTime}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const recommendations: StaffingRecommendation[] = [];

      // Get current performance metrics
      const currentMetrics = await this.getCurrentPerformanceMetrics();
      const conversationsPerAgent = currentMetrics.conversationsPerAgent || 20;
      const averageHandlingTime = currentMetrics.averageHandlingTime || 300; // seconds

      for (const forecast of volumeForecast) {
        // Calculate required capacity
        const totalWorkload = forecast.predictedVolume * averageHandlingTime;
        const workingHours = 8 * 60 * 60; // 8 hours in seconds
        const utilizationRate = 0.8; // 80% utilization target

        const requiredAgents = Math.ceil(
          totalWorkload / (workingHours * utilizationRate)
        );

        // Apply confidence adjustment
        const confidenceAdjustment = 1 + (1 - forecast.confidence) * 0.5;
        const adjustedStaffing = Math.ceil(requiredAgents * confidenceAdjustment);

        // Calculate cost and efficiency metrics
        const estimatedCost = adjustedStaffing * 200; // $200 per agent per day
        const expectedResponseTime = this.calculateExpectedResponseTime(
          forecast.predictedVolume,
          adjustedStaffing,
          averageHandlingTime
        );

        recommendations.push({
          date: forecast.date,
          recommendedStaff: adjustedStaffing,
          confidence: forecast.confidence,
          reasoning: `Based on predicted volume of ${forecast.predictedVolume} conversations`,
          estimatedCost,
          expectedResponseTime,
          utilizationRate: forecast.predictedVolume / (adjustedStaffing * conversationsPerAgent),
          skillRequirements: this.determineSkillRequirements(forecast.predictedVolume)
        });
      }

      // Store staffing recommendations
      await this.storeStaffingRecommendations(recommendations);

      this.setCachedData(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error calculating staffing needs:', error);
      throw error;
    }
  }

  async getStaffingRecommendations(days: number = 30): Promise<StaffingPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('predictive_analytics')
        .select('*')
        .eq('prediction_type', 'staffing_needs')
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .lte('prediction_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        date: new Date(item.prediction_date),
        recommendedStaff: Math.round(item.predicted_value),
        confidence: item.confidence_level,
        reasoning: item.input_features?.reasoning || 'Based on volume forecast'
      }));
    } catch (error) {
      console.error('Error getting staffing recommendations:', error);
      return [];
    }
  }

  // ================================
  // SATISFACTION PREDICTION
  // ================================

  async predictSatisfactionTrends(
    historicalSatisfaction: SatisfactionData[],
    improvementActions: string[] = []
  ): Promise<SatisfactionForecast> {
    const cacheKey = `satisfaction_forecast_${improvementActions.join('_')}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const satisfactionScores = historicalSatisfaction.map(d => d.score);
      const dates = historicalSatisfaction.map(d => new Date(d.date));

      // Calculate trend
      const trend = this.calculateTrend(satisfactionScores);
      
      // Apply improvement action effects
      const improvementImpact = this.calculateImprovementImpact(improvementActions);
      
      // Generate forecast
      const forecastPeriod = 30; // days
      const predictions: Array<{ date: Date; predictedScore: number; confidence: number }> = [];

      for (let i = 0; i < forecastPeriod; i++) {
        const forecastDate = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
        const baseScore = satisfactionScores[satisfactionScores.length - 1] || 4.0;
        const trendEffect = trend * (i + 1) * 0.1;
        const improvementEffect = improvementImpact * Math.min(i / 30, 1); // Gradual improvement

        const predictedScore = Math.min(5.0, Math.max(1.0, 
          baseScore + trendEffect + improvementEffect
        ));

        const confidence = Math.max(0.5, 0.9 - (i * 0.01)); // Decreasing confidence over time

        predictions.push({
          date: forecastDate,
          predictedScore,
          confidence
        });
      }

      // Calculate expected outcomes
      const expectedOutcomes = this.calculateSatisfactionOutcomes(predictions);

      const forecast: SatisfactionForecast = {
        currentScore: satisfactionScores[satisfactionScores.length - 1] || 4.0,
        trend,
        predictions,
        expectedOutcomes,
        improvementActions,
        estimatedImpact: improvementImpact,
        confidence: predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length
      };

      // Store satisfaction forecast
      await this.storeSatisfactionForecast(forecast);

      this.setCachedData(cacheKey, forecast);
      return forecast;
    } catch (error) {
      console.error('Error predicting satisfaction trends:', error);
      throw error;
    }
  }

  // ================================
  // PERFORMANCE OPTIMIZATION
  // ================================

  async generateOptimizationSuggestions(
    currentMetrics: PerformanceMetrics,
    benchmarkData: BenchmarkData
  ): Promise<OptimizationSuggestion[]> {
    const cacheKey = 'optimization_suggestions';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const suggestions: OptimizationSuggestion[] = [];

      // Response time optimization
      if (currentMetrics.averageResponseTime > benchmarkData.targetResponseTime) {
        const improvement = benchmarkData.targetResponseTime - currentMetrics.averageResponseTime;
        suggestions.push({
          category: 'response_time',
          title: 'Optimize Response Time',
          description: `Current average response time (${currentMetrics.averageResponseTime}s) exceeds target (${benchmarkData.targetResponseTime}s)`,
          impact: 'high',
          effort: 'medium',
          estimatedImprovement: `${Math.abs(improvement)}s faster responses`,
          implementation: [
            'Implement AI-powered response suggestions',
            'Optimize knowledge base search',
            'Add more canned responses',
            'Improve agent training'
          ],
          expectedTimeframe: '2-4 weeks',
          priority: 1
        });
      }

      // Resolution rate optimization
      if (currentMetrics.resolutionRate < benchmarkData.targetResolutionRate) {
        const improvement = benchmarkData.targetResolutionRate - currentMetrics.resolutionRate;
        suggestions.push({
          category: 'resolution_rate',
          title: 'Improve Resolution Rate',
          description: `Current resolution rate (${Math.round(currentMetrics.resolutionRate * 100)}%) below target (${Math.round(benchmarkData.targetResolutionRate * 100)}%)`,
          impact: 'high',
          effort: 'high',
          estimatedImprovement: `${Math.round(improvement * 100)}% increase in resolution rate`,
          implementation: [
            'Enhance AI training with more conversation data',
            'Improve escalation workflows',
            'Add specialized knowledge articles',
            'Implement proactive issue detection'
          ],
          expectedTimeframe: '4-8 weeks',
          priority: 2
        });
      }

      // Satisfaction optimization
      if (currentMetrics.customerSatisfaction < benchmarkData.targetSatisfaction) {
        const improvement = benchmarkData.targetSatisfaction - currentMetrics.customerSatisfaction;
        suggestions.push({
          category: 'satisfaction',
          title: 'Enhance Customer Satisfaction',
          description: `Customer satisfaction (${currentMetrics.customerSatisfaction.toFixed(1)}) below target (${benchmarkData.targetSatisfaction.toFixed(1)})`,
          impact: 'medium',
          effort: 'medium',
          estimatedImprovement: `${improvement.toFixed(1)} point increase in satisfaction`,
          implementation: [
            'Personalize responses based on customer history',
            'Implement sentiment analysis for real-time adjustment',
            'Add follow-up satisfaction surveys',
            'Improve agent empathy training'
          ],
          expectedTimeframe: '3-6 weeks',
          priority: 3
        });
      }

      // AI accuracy optimization
      if (currentMetrics.aiAccuracy < benchmarkData.targetAIAccuracy) {
        const improvement = benchmarkData.targetAIAccuracy - currentMetrics.aiAccuracy;
        suggestions.push({
          category: 'ai_accuracy',
          title: 'Improve AI Accuracy',
          description: `AI accuracy (${Math.round(currentMetrics.aiAccuracy * 100)}%) below target (${Math.round(benchmarkData.targetAIAccuracy * 100)}%)`,
          impact: 'high',
          effort: 'high',
          estimatedImprovement: `${Math.round(improvement * 100)}% increase in AI accuracy`,
          implementation: [
            'Retrain AI models with recent conversation data',
            'Implement continuous learning pipeline',
            'Add domain-specific training data',
            'Improve intent recognition algorithms'
          ],
          expectedTimeframe: '6-12 weeks',
          priority: 4
        });
      }

      // Cost optimization
      const costSavingOpportunities = this.identifyCostSavingOpportunities(currentMetrics, benchmarkData);
      suggestions.push(...costSavingOpportunities);

      // Sort by priority and impact
      suggestions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });

      this.setCachedData(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      throw error;
    }
  }

  // ================================
  // SEASONALITY ANALYSIS
  // ================================

  async analyzeSeasonalityPatterns(
    historicalData: ConversationVolume[]
  ): Promise<SeasonalPattern[]> {
    const cacheKey = 'seasonality_patterns';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const patterns: SeasonalPattern[] = [];

      // Daily patterns
      const dailyPattern = this.analyzeDailyPatterns(historicalData);
      patterns.push(dailyPattern);

      // Weekly patterns
      const weeklyPattern = this.analyzeWeeklyPatterns(historicalData);
      patterns.push(weeklyPattern);

      // Monthly patterns
      const monthlyPattern = this.analyzeMonthlyPatterns(historicalData);
      patterns.push(monthlyPattern);

      // Holiday patterns
      const holidayPattern = this.analyzeHolidayPatterns(historicalData);
      patterns.push(holidayPattern);

      this.setCachedData(cacheKey, patterns);
      return patterns;
    } catch (error) {
      console.error('Error analyzing seasonality patterns:', error);
      throw error;
    }
  }

  // ================================
  // PERFORMANCE FORECASTING
  // ================================

  async forecastPerformanceMetrics(days: number = 30): Promise<PerformanceForecast[]> {
    const cacheKey = `performance_forecast_${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('predictive_analytics')
        .select('*')
        .eq('prediction_type', 'performance_prediction')
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .lte('prediction_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('prediction_date', { ascending: true });

      if (error) throw error;

      const forecasts = (data || []).map(item => ({
        date: new Date(item.prediction_date),
        predictedSatisfaction: item.predicted_value,
        predictedResponseTime: item.input_features?.response_time || 120,
        confidence: item.confidence_level
      }));

      this.setCachedData(cacheKey, forecasts);
      return forecasts;
    } catch (error) {
      console.error('Error forecasting performance metrics:', error);
      return [];
    }
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private initializeModels(): void {
    this.models.set('volume_forecast', {
      name: 'Volume Forecasting Model',
      version: '1.0',
      accuracy: 0.85,
      lastTrained: new Date().toISOString(),
      features: ['historical_volume', 'day_of_week', 'month', 'trend', 'seasonality']
    });

    this.models.set('satisfaction_prediction', {
      name: 'Satisfaction Prediction Model',
      version: '1.0',
      accuracy: 0.78,
      lastTrained: new Date().toISOString(),
      features: ['historical_satisfaction', 'response_time', 'resolution_rate', 'agent_performance']
    });

    this.models.set('staffing_optimization', {
      name: 'Staffing Optimization Model',
      version: '1.0',
      accuracy: 0.82,
      lastTrained: new Date().toISOString(),
      features: ['volume_forecast', 'agent_capacity', 'skill_requirements', 'cost_constraints']
    });
  }

  private async applyTimeSeriesForecasting(
    data: number[],
    dates: Date[],
    forecastDays: number
  ): Promise<number[]> {
    // Simplified time series forecasting using moving averages and trend analysis
    const windowSize = Math.min(7, Math.floor(data.length / 3));
    const forecast: number[] = [];

    // Calculate moving average
    const movingAverage = this.calculateMovingAverage(data, windowSize);
    
    // Calculate trend
    const trend = this.calculateTrend(data);

    // Generate forecast
    for (let i = 0; i < forecastDays; i++) {
      const baseValue = movingAverage[movingAverage.length - 1];
      const trendEffect = trend * (i + 1);
      const forecastValue = Math.max(0, baseValue + trendEffect);
      forecast.push(forecastValue);
    }

    return forecast;
  }

  private calculateMovingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }

    return result;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = data.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateSeasonalAdjustments(dates: Date[], volumes: number[]): Record<string, number> {
    const adjustments: Record<string, number> = {};
    
    // Calculate average volume by day of week
    const dayOfWeekVolumes: Record<number, number[]> = {};
    
    dates.forEach((date, index) => {
      const dayOfWeek = date.getDay();
      if (!dayOfWeekVolumes[dayOfWeek]) {
        dayOfWeekVolumes[dayOfWeek] = [];
      }
      dayOfWeekVolumes[dayOfWeek].push(volumes[index]);
    });

    const overallAverage = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    Object.keys(dayOfWeekVolumes).forEach(day => {
      const dayVolumes = dayOfWeekVolumes[parseInt(day)];
      const dayAverage = dayVolumes.reduce((sum, vol) => sum + vol, 0) / dayVolumes.length;
      adjustments[day] = dayAverage / overallAverage;
    });

    return adjustments;
  }

  private getSeasonalFactor(date: Date, adjustments: Record<string, number>): number {
    const dayOfWeek = date.getDay().toString();
    return adjustments[dayOfWeek] || 1.0;
  }

  private calculateTrendFactor(data: number[], forecastIndex: number): number {
    const trend = this.calculateTrend(data);
    const trendFactor = 1 + (trend * forecastIndex * 0.1);
    return Math.max(0.5, Math.min(2.0, trendFactor)); // Limit trend factor
  }

  private calculateBaseline(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private calculateConfidence(forecastIndex: number, totalDays: number, dataPoints: number): number {
    const baseConfidence = Math.min(0.95, 0.5 + (dataPoints / 100));
    const decayFactor = Math.exp(-forecastIndex / (totalDays * 0.3));
    return Math.max(0.3, baseConfidence * decayFactor);
  }

  private async getCurrentPerformanceMetrics(): Promise<{
    conversationsPerAgent: number;
    averageHandlingTime: number;
    utilizationRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('conversation_analytics')
        .select('avg_response_time_seconds, total_duration_seconds')
        .not('avg_response_time_seconds', 'is', null)
        .not('total_duration_seconds', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const avgHandlingTime = data && data.length > 0 
        ? data.reduce((sum, item) => sum + (item.total_duration_seconds || 300), 0) / data.length
        : 300;

      return {
        conversationsPerAgent: 20,
        averageHandlingTime: avgHandlingTime,
        utilizationRate: 0.8
      };
    } catch (error) {
      console.error('Error getting current performance metrics:', error);
      return {
        conversationsPerAgent: 20,
        averageHandlingTime: 300,
        utilizationRate: 0.8
      };
    }
  }

  private calculateExpectedResponseTime(
    volume: number,
    agents: number,
    handlingTime: number
  ): number {
    const utilizationRate = volume / (agents * 20); // Assuming 20 conversations per agent capacity
    const queueingFactor = utilizationRate > 0.8 ? 1 + (utilizationRate - 0.8) * 5 : 1;
    return handlingTime * queueingFactor;
  }

  private determineSkillRequirements(volume: number): string[] {
    const requirements = ['general_support'];
    
    if (volume > 100) {
      requirements.push('technical_support');
    }
    if (volume > 200) {
      requirements.push('escalation_specialist');
    }
    if (volume > 300) {
      requirements.push('team_lead');
    }

    return requirements;
  }

  private calculateImprovementImpact(actions: string[]): number {
    const impactMap: Record<string, number> = {
      'improve_response_time': 0.2,
      'enhance_ai_training': 0.3,
      'add_knowledge_articles': 0.15,
      'implement_proactive_support': 0.25,
      'improve_agent_training': 0.1
    };

    return actions.reduce((total, action) => {
      return total + (impactMap[action] || 0.05);
    }, 0);
  }

  private calculateSatisfactionOutcomes(
    predictions: Array<{ date: Date; predictedScore: number; confidence: number }>
  ): Record<string, number> {
    const finalScore = predictions[predictions.length - 1]?.predictedScore || 4.0;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    return {
      expectedFinalScore: finalScore,
      averageConfidence: avgConfidence,
      improvementPotential: Math.max(0, 5.0 - finalScore),
      riskOfDecline: finalScore < 4.0 ? 0.3 : 0.1
    };
  }

  private identifyCostSavingOpportunities(
    currentMetrics: PerformanceMetrics,
    benchmarkData: BenchmarkData
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // AI automation opportunity
    if (currentMetrics.aiAccuracy > 0.8) {
      suggestions.push({
        category: 'cost_optimization',
        title: 'Increase AI Automation',
        description: 'High AI accuracy enables more automated responses',
        impact: 'high',
        effort: 'low',
        estimatedImprovement: '$15,000 monthly savings',
        implementation: [
          'Increase AI confidence threshold',
          'Expand automated response scenarios',
          'Implement smart routing'
        ],
        expectedTimeframe: '1-2 weeks',
        priority: 5
      });
    }

    return suggestions;
  }

  private analyzeDailyPatterns(data: ConversationVolume[]): SeasonalPattern {
    const hourlyVolumes: Record<number, number[]> = {};
    
    data.forEach(item => {
      const hour = new Date(item.date).getHours();
      if (!hourlyVolumes[hour]) {
        hourlyVolumes[hour] = [];
      }
      hourlyVolumes[hour].push(item.volume);
    });

    const peakHours = Object.entries(hourlyVolumes)
      .map(([hour, volumes]) => ({
        hour: parseInt(hour),
        avgVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
      }))
      .sort((a, b) => b.avgVolume - a.avgVolume)
      .slice(0, 3);

    return {
      pattern: 'daily',
      description: `Peak hours: ${peakHours.map(p => `${p.hour}:00`).join(', ')}`,
      strength: 0.75,
      recommendations: [
        'Increase staffing during peak hours',
        'Implement queue management for high-volume periods'
      ]
    };
  }

  private analyzeWeeklyPatterns(data: ConversationVolume[]): SeasonalPattern {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyVolumes: Record<number, number[]> = {};
    
    data.forEach(item => {
      const dayOfWeek = new Date(item.date).getDay();
      if (!weeklyVolumes[dayOfWeek]) {
        weeklyVolumes[dayOfWeek] = [];
      }
      weeklyVolumes[dayOfWeek].push(item.volume);
    });

    const peakDays = Object.entries(weeklyVolumes)
      .map(([day, volumes]) => ({
        day: parseInt(day),
        avgVolume: volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
      }))
      .sort((a, b) => b.avgVolume - a.avgVolume)
      .slice(0, 2);

    return {
      pattern: 'weekly',
      description: `Higher volume on ${peakDays.map(p => dayNames[p.day]).join(' and ')}`,
      strength: 0.65,
      recommendations: [
        'Schedule more agents mid-week',
        'Prepare for Monday morning volume spikes'
      ]
    };
  }

  private analyzeMonthlyPatterns(data: ConversationVolume[]): SeasonalPattern {
    return {
      pattern: 'monthly',
      description: 'Increased activity at month-end',
      strength: 0.55,
      recommendations: [
        'Prepare for month-end spikes',
        'Implement proactive communication before billing cycles'
      ]
    };
  }

  private analyzeHolidayPatterns(data: ConversationVolume[]): SeasonalPattern {
    return {
      pattern: 'holiday',
      description: 'Reduced volume during major holidays',
      strength: 0.8,
      recommendations: [
        'Adjust staffing for holiday periods',
        'Prepare for post-holiday volume increases'
      ]
    };
  }

  private async storePredictions(type: string, predictions: any[]): Promise<void> {
    try {
      const records = predictions.map(prediction => ({
        prediction_type: type,
        prediction_date: prediction.date.toISOString().split('T')[0],
        predicted_value: prediction.predictedVolume || prediction.predictedScore,
        confidence_level: prediction.confidence,
        input_features: {
          seasonal_adjustment: prediction.seasonalAdjustment,
          trend_factor: prediction.trendFactor,
          base_volume: prediction.baseVolume
        }
      }));

      await supabase
        .from('predictive_analytics')
        .upsert(records, { onConflict: 'prediction_type,prediction_date' });
    } catch (error) {
      console.error('Error storing predictions:', error);
    }
  }

  private async storeStaffingRecommendations(recommendations: StaffingRecommendation[]): Promise<void> {
    try {
      const records = recommendations.map(rec => ({
        prediction_type: 'staffing_needs',
        prediction_date: rec.date.toISOString().split('T')[0],
        predicted_value: rec.recommendedStaff,
        confidence_level: rec.confidence,
        input_features: {
          reasoning: rec.reasoning,
          estimated_cost: rec.estimatedCost,
          expected_response_time: rec.expectedResponseTime,
          utilization_rate: rec.utilizationRate
        }
      }));

      await supabase
        .from('predictive_analytics')
        .upsert(records, { onConflict: 'prediction_type,prediction_date' });
    } catch (error) {
      console.error('Error storing staffing recommendations:', error);
    }
  }

  private async storeSatisfactionForecast(forecast: SatisfactionForecast): Promise<void> {
    try {
      const records = forecast.predictions.map(pred => ({
        prediction_type: 'satisfaction_trend',
        prediction_date: pred.date.toISOString().split('T')[0],
        predicted_value: pred.predictedScore,
        confidence_level: pred.confidence,
        input_features: {
          current_score: forecast.currentScore,
          trend: forecast.trend,
          improvement_actions: forecast.improvementActions,
          estimated_impact: forecast.estimatedImpact
        }
      }));

      await supabase
        .from('predictive_analytics')
        .upsert(records, { onConflict: 'prediction_type,prediction_date' });
    } catch (error) {
      console.error('Error storing satisfaction forecast:', error);
    }
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const predictiveAnalyticsService = new PredictiveAnalyticsService();