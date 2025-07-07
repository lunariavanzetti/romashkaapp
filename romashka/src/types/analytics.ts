// Analytics and Reporting System Types

export interface MetricEvent {
  type: string;
  value: number;
  dimensions: Record<string, any>;
  timestamp: Date;
  conversationId?: string;
  userId?: string;
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions: string[];
  filters: Record<string, any>;
  timeRange: TimeRange;
  granularity: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

export interface AnalyticsResult {
  data: any[];
  summary: Record<string, number>;
  trends: TrendPoint[];
  metadata: {
    totalRecords: number;
    queryTime: number;
    cached: boolean;
  };
}

export interface TrendPoint {
  timestamp: Date;
  value: number;
  change: number;
  changePercent: number;
}

export interface RankingResult {
  rank: number;
  name: string;
  value: number;
  change: number;
  metadata: Record<string, any>;
}

export interface ComparisonResult {
  base: AnalyticsResult;
  comparison: AnalyticsResult;
  difference: Record<string, number>;
  significance: Record<string, boolean>;
}

export interface Anomaly {
  metric: string;
  timestamp: Date;
  expectedValue: number;
  actualValue: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'alert';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data: Record<string, any>;
  createdAt: Date;
}

// Real-time Analytics Types
export interface LiveMetrics {
  activeConversations: number;
  avgResponseTime: number;
  satisfactionScore: number;
  aiResolutionRate: number;
  agentProductivity: number;
  channelActivity: ChannelActivity[];
  lastUpdated: Date;
}

export interface ConversationSummary {
  id: string;
  customerName: string;
  channel: string;
  status: string;
  duration: number;
  satisfaction?: number;
  agentName?: string;
}

export interface AgentMetrics {
  id: string;
  name: string;
  activeConversations: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  productivity: number;
}

export interface ChannelActivity {
  channel: string;
  activeConversations: number;
  avgResponseTime: number;
  satisfactionScore: number;
  volume: number;
}

export interface SLAStatus {
  conversationId: string;
  slaType: string;
  targetTime: number;
  actualTime: number;
  status: 'on_track' | 'at_risk' | 'breached';
  remainingTime: number;
}

// AI Analytics Types
export interface AIAnalytics {
  confidenceDistribution: ConfidenceRange[];
  accuracyTrends: AccuracyPoint[];
  handoffReasons: HandoffReason[];
  knowledgeGaps: KnowledgeGap[];
  improvementSuggestions: Suggestion[];
  learningProgress: LearningMetric[];
}

export interface ConfidenceRange {
  range: string;
  count: number;
  percentage: number;
}

export interface AccuracyPoint {
  timestamp: Date;
  accuracy: number;
  sampleSize: number;
}

export interface HandoffReason {
  reason: string;
  count: number;
  percentage: number;
  avgResolutionTime: number;
}

export interface KnowledgeGap {
  topic: string;
  frequency: number;
  impact: number;
  suggestedContent: string;
}

export interface Suggestion {
  type: 'training' | 'content' | 'process';
  title: string;
  description: string;
  impact: number;
  effort: number;
}

export interface LearningMetric {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  timeframe: string;
}

// Customer Journey Analytics Types
export interface CustomerJourney {
  touchpoints: Touchpoint[];
  conversionFunnel: FunnelStep[];
  satisfactionJourney: SatisfactionPoint[];
  channelPreferences: ChannelPreference[];
  retentionMetrics: RetentionMetric[];
}

export interface Touchpoint {
  timestamp: Date;
  channel: string;
  interaction: string;
  outcome: string;
  satisfaction?: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface SatisfactionPoint {
  timestamp: Date;
  score: number;
  touchpoint: string;
  channel: string;
}

export interface ChannelPreference {
  channel: string;
  usageCount: number;
  satisfactionScore: number;
  responseTime: number;
}

export interface RetentionMetric {
  period: string;
  retentionRate: number;
  churnRate: number;
  reactivationRate: number;
}

export interface ChurnRisk {
  customerId: string;
  riskScore: number;
  factors: string[];
  predictedChurnDate: Date;
  recommendations: string[];
}

// Business Impact Analytics Types
export interface BusinessImpact {
  costSavings: CostSaving[];
  revenueAttribution: RevenueMetric[];
  productivityGains: ProductivityMetric[];
  customerRetention: RetentionMetric[];
  marketInsights: MarketInsight[];
}

export interface CostSaving {
  category: string;
  amount: number;
  period: string;
  description: string;
  roi: number;
}

export interface RevenueMetric {
  source: string;
  amount: number;
  attribution: number;
  period: string;
}

export interface ProductivityMetric {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  timeframe: string;
}

export interface MarketInsight {
  insight: string;
  confidence: number;
  data: Record<string, any>;
  actionable: boolean;
}

export interface ROIMetric {
  investment: number;
  return: number;
  roi: number;
  paybackPeriod: number;
  breakevenDate: Date;
}

// Dashboard and Widget Types
export interface DashboardConfig {
  id: string;
  name: string;
  isDefault: boolean;
  layout: WidgetLayout[];
  filters: DashboardFilters;
  refreshInterval: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetLayout {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}

export type WidgetType = 
  | 'kpi' 
  | 'line-chart' 
  | 'bar-chart' 
  | 'pie-chart' 
  | 'funnel-chart' 
  | 'heatmap' 
  | 'gauge' 
  | 'table';

export interface WidgetConfig {
  title: string;
  metric?: string;
  chartType?: string;
  dataSource?: string;
  refreshInterval?: number;
  thresholds?: Threshold[];
  [key: string]: any;
}

export interface Threshold {
  value: number;
  color: string;
  label: string;
}

export interface DashboardFilters {
  timeRange: string;
  channels: string[];
  departments: string[];
  agents: string[];
  [key: string]: any;
}

// Report Types
export interface ReportConfig {
  type: 'performance' | 'satisfaction' | 'ai_analytics' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  data: any;
  template?: string;
  branding?: BrandingConfig;
}

export interface BrandingConfig {
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  companyName: string;
  contactInfo: string;
}

export interface ScheduledReportConfig {
  name: string;
  description: string;
  reportType: string;
  scheduleCron: string;
  recipients: string[];
  filters: Record<string, any>;
  format: string;
  isActive: boolean;
}

// Alert Types
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  timeWindow: number;
  channels: string[];
  recipients: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  metricValue: number;
  thresholdValue: number;
  sentChannels: string[];
  sentRecipients: string[];
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  triggeredAt: Date;
  metricValue: number;
  thresholdValue: number;
  sentChannels: string[];
  sentRecipients: string[];
}

// Export Types
export interface ExportJob {
  id: string;
  userId: string;
  name: string;
  type: 'conversations' | 'analytics' | 'customers';
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportConfig {
  type: string;
  filters: Record<string, any>;
  format: string;
  includeHeaders: boolean;
  dateFormat: string;
}

export interface ExportResult {
  id: string;
  status: string;
  fileUrl?: string;
  errorMessage?: string;
}

// Time Range Types
export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export type Granularity = 'hour' | 'day' | 'week' | 'month';

// Performance Types
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  cacheHitRate: number;
}

// Custom Analytics Types
export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MetricDefinition {
  name: string;
  description: string;
  type: 'count' | 'sum' | 'average' | 'percentage' | 'custom';
  source: string;
  aggregation: string;
  filters: Record<string, any>;
} 