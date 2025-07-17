// Training System TypeScript Types

export interface TrainingData {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  content: any;
  processed_at?: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  quality_score?: number;
  category?: string;
  record_count: number;
  valid_records: number;
  invalid_records: number;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface TrainingJob {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  openai_job_id?: string;
  training_data_ids: string[];
  model_config: ModelConfig;
  results: TrainingResults;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelConfig {
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  model_type?: string;
  temperature?: number;
  max_tokens?: number;
  fine_tuning_params?: Record<string, any>;
}

export interface TrainingResults {
  accuracy_improvement?: number;
  processed_records?: number;
  errors?: number;
  training_loss?: number;
  validation_loss?: number;
  final_accuracy?: number;
  training_time?: number;
  model_id?: string;
}

export interface PerformanceMetric {
  id: string;
  user_id: string;
  metric_type: string;
  metric_value: number;
  measurement_date: string;
  training_job_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  training_job_id: string;
  session_data: Record<string, any>;
  status: 'active' | 'paused' | 'completed' | 'error';
  progress_data: ProgressData;
  created_at: string;
  updated_at: string;
}

export interface ProgressData {
  current_step?: string;
  steps_completed?: number;
  total_steps?: number;
  current_epoch?: number;
  total_epochs?: number;
  loss_history?: number[];
  accuracy_history?: number[];
}

export interface TrainingFileUpload {
  id: string;
  user_id: string;
  training_data_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  upload_status: 'pending' | 'uploading' | 'completed' | 'error';
  upload_progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationQualityRating {
  id: string;
  user_id: string;
  conversation_data: any;
  user_message: string;
  ai_response: string;
  quality_rating: number; // 1-5
  accuracy_score?: number;
  relevance_score?: number;
  helpfulness_score?: number;
  category?: string;
  tags: string[];
  notes?: string;
  created_at: string;
}

export interface TrainingInsight {
  id: string;
  user_id: string;
  insight_type: string;
  insight_title: string;
  insight_description: string;
  confidence_score?: number;
  supporting_data: Record<string, any>;
  status: 'active' | 'applied' | 'dismissed';
  created_at: string;
  applied_at?: string;
}

// Dashboard-specific types
export interface TrainingDashboardStats {
  total_datasets: number;
  total_conversations: number;
  average_accuracy: number;
  active_trainings: number;
  last_training?: string;
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'training' | 'insight' | 'error';
  message: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

// File upload types
export interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: FileProcessingResult;
}

export interface FileProcessingResult {
  conversation_count: number;
  valid_records: number;
  invalid_records: number;
  categories: string[];
  quality_indicators?: QualityIndicators;
}

export interface QualityIndicators {
  avg_message_length: number;
  response_completeness: number;
  conversation_coherence: number;
  sentiment_distribution: Record<string, number>;
}

// Training configuration types
export interface TrainingConfiguration {
  name: string;
  description?: string;
  selected_datasets: string[];
  model_config: ModelConfig;
  training_params: TrainingParams;
  validation_config?: ValidationConfig;
}

export interface TrainingParams {
  max_training_time?: number; // minutes
  early_stopping?: boolean;
  checkpoint_frequency?: number;
  validation_split?: number;
  data_augmentation?: boolean;
}

export interface ValidationConfig {
  test_size?: number;
  validation_method?: 'holdout' | 'cross_validation';
  metrics?: string[];
}

// Analytics types
export interface PerformanceAnalytics {
  accuracy_trend: MetricTrend[];
  satisfaction_trend: MetricTrend[];
  training_effectiveness: TrainingEffectiveness;
  failure_analysis: FailureAnalysis;
  improvement_opportunities: ImprovementOpportunity[];
}

export interface MetricTrend {
  date: string;
  value: number;
  confidence?: number;
}

export interface TrainingEffectiveness {
  before_metrics: MetricSummary;
  after_metrics: MetricSummary;
  improvement_percentage: number;
  statistical_significance: number;
}

export interface MetricSummary {
  accuracy: number;
  response_time: number;
  user_satisfaction: number;
  confidence_score: number;
}

export interface FailureAnalysis {
  common_patterns: FailurePattern[];
  error_categories: ErrorCategory[];
  suggested_fixes: SuggestedFix[];
}

export interface FailurePattern {
  pattern: string;
  frequency: number;
  impact_score: number;
  examples: string[];
}

export interface ErrorCategory {
  category: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high';
}

export interface SuggestedFix {
  issue: string;
  solution: string;
  effort_level: 'low' | 'medium' | 'high';
  expected_impact: number;
}

export interface ImprovementOpportunity {
  title: string;
  description: string;
  potential_impact: number;
  implementation_effort: number;
  priority: 'low' | 'medium' | 'high';
  action_items: string[];
}

// Scenario testing types
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  input_message: string;
  expected_response?: string;
  context?: Record<string, any>;
  tags: string[];
  created_at: string;
}

export interface ScenarioTestResult {
  scenario_id: string;
  test_timestamp: string;
  model_response: string;
  response_time: number;
  quality_scores: QualityScores;
  passed: boolean;
  issues: string[];
}

export interface QualityScores {
  accuracy: number;
  relevance: number;
  completeness: number;
  clarity: number;
  helpfulness: number;
  overall: number;
}

// OpenAI Integration types
export interface OpenAITrainingJob {
  id: string;
  object: string;
  created_at: number;
  finished_at?: number;
  model: string;
  organization_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  training_file: string;
  validation_file?: string;
  result_files?: string[];
  trained_tokens?: number;
  error?: {
    code: string;
    message: string;
    param?: string;
  };
}

export interface OpenAIFile {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status?: string;
}

// API Response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Form types
export interface TrainingJobForm {
  name: string;
  description: string;
  selectedDatasets: string[];
  modelConfig: {
    learningRate: number;
    epochs: number;
    batchSize: number;
    modelType: string;
  };
}

export interface FileUploadForm {
  files: File[];
  category?: string;
  tags?: string[];
  description?: string;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

// Export all types
export type {
  // Main entities
  TrainingData,
  TrainingJob,
  PerformanceMetric,
  TrainingSession,
  TrainingFileUpload,
  ConversationQualityRating,
  TrainingInsight,
  
  // Configuration
  ModelConfig,
  TrainingResults,
  ProgressData,
  TrainingConfiguration,
  TrainingParams,
  ValidationConfig,
  
  // Dashboard
  TrainingDashboardStats,
  RecentActivity,
  
  // File handling
  FileUploadItem,
  FileProcessingResult,
  QualityIndicators,
  
  // Analytics
  PerformanceAnalytics,
  MetricTrend,
  TrainingEffectiveness,
  MetricSummary,
  FailureAnalysis,
  FailurePattern,
  ErrorCategory,
  SuggestedFix,
  ImprovementOpportunity,
  
  // Testing
  TestScenario,
  ScenarioTestResult,
  QualityScores,
  
  // OpenAI
  OpenAITrainingJob,
  OpenAIFile,
  
  // API
  APIResponse,
  PaginatedResponse,
  
  // Forms
  TrainingJobForm,
  FileUploadForm,
  
  // Charts
  ChartDataPoint,
  ChartSeries
};