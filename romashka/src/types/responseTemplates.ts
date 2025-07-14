// Response Templates System Types
export interface ResponseTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  content: TemplateContent;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  media_attachments: MediaAttachment[];
  usage_count: number;
  effectiveness_score: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  shared_with: string[];
  active: boolean;
  version: number;
  parent_template_id?: string;
  tags: string[];
  language: string;
  ai_training_data: AITrainingData;
}

export interface TemplateContent {
  raw_text: string;
  formatted_html: string;
  markdown?: string;
  text_blocks: TextBlock[];
  structure: ContentStructure;
}

export interface TextBlock {
  id: string;
  type: 'text' | 'variable' | 'condition' | 'media';
  content: string;
  position: number;
  formatting: TextFormatting;
}

export interface TextFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color?: string;
  background_color?: string;
  font_size?: number;
  font_family?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  list_type?: 'bullet' | 'number' | 'none';
}

export interface ContentStructure {
  greeting: boolean;
  body: boolean;
  call_to_action: boolean;
  signature: boolean;
  custom_sections: CustomSection[];
}

export interface CustomSection {
  id: string;
  name: string;
  content: string;
  position: number;
  required: boolean;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'email' | 'phone' | 'url' | 'custom';
  default_value?: string;
  description: string;
  validation_rules: ValidationRule[];
  source: 'manual' | 'customer_data' | 'conversation_context' | 'system' | 'external_api';
  source_config?: VariableSourceConfig;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiselect types
  format?: string; // For date/number types
  created_at: string;
  updated_at: string;
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range' | 'custom';
  value: string | number;
  message: string;
}

export interface VariableSourceConfig {
  field_path: string;
  fallback_value?: string;
  transformation?: 'uppercase' | 'lowercase' | 'capitalize' | 'date_format' | 'currency' | 'custom';
  api_endpoint?: string;
  api_params?: Record<string, string>;
  cache_duration?: number;
}

export interface TemplateCondition {
  id: string;
  condition_type: 'if' | 'elseif' | 'else';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in';
  value: any;
  content: string;
  nested_conditions?: TemplateCondition[];
  logic_operator?: 'and' | 'or';
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file' | 'link';
  url: string;
  name: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
  alt_text?: string;
  position: number;
  created_at: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parent_id?: string;
  sort_order: number;
  permissions: CategoryPermissions;
  created_at: string;
  updated_at: string;
}

export interface CategoryPermissions {
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  restricted_to_roles?: string[];
}

export interface AITrainingData {
  success_rate: number;
  customer_satisfaction: number;
  response_time_improvement: number;
  engagement_metrics: EngagementMetrics;
  sentiment_analysis: SentimentAnalysis;
  learning_insights: LearningInsight[];
  performance_trends: PerformanceTrend[];
  last_analyzed: string;
  training_samples: TrainingSample[];
}

export interface EngagementMetrics {
  open_rate: number;
  click_through_rate: number;
  response_rate: number;
  conversion_rate: number;
  average_session_duration: number;
  bounce_rate: number;
}

export interface SentimentAnalysis {
  positive_sentiment: number;
  negative_sentiment: number;
  neutral_sentiment: number;
  emotion_distribution: Record<string, number>;
  confidence_score: number;
}

export interface LearningInsight {
  id: string;
  type: 'performance' | 'optimization' | 'pattern' | 'anomaly';
  description: string;
  impact_score: number;
  confidence: number;
  recommendations: string[];
  data_source: string;
  created_at: string;
}

export interface PerformanceTrend {
  date: string;
  usage_count: number;
  success_rate: number;
  customer_satisfaction: number;
  response_time: number;
  conversion_rate: number;
}

export interface TrainingSample {
  id: string;
  conversation_id: string;
  template_id: string;
  customer_response: string;
  outcome: 'positive' | 'negative' | 'neutral';
  context: ConversationContext;
  feedback_score?: number;
  created_at: string;
}

export interface ConversationContext {
  customer_id: string;
  customer_type: 'new' | 'returning' | 'premium' | 'vip';
  conversation_stage: 'initial' | 'ongoing' | 'resolution' | 'follow_up';
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'chat' | 'email' | 'whatsapp' | 'sms' | 'social';
  previous_interactions: number;
  customer_data: Record<string, any>;
}

export interface TemplateUsage {
  id: string;
  template_id: string;
  user_id: string;
  conversation_id: string;
  variables_used: Record<string, string>;
  effectiveness_score: number;
  customer_feedback?: CustomerFeedback;
  response_time: number;
  created_at: string;
}

export interface CustomerFeedback {
  rating: number;
  comment?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  helpful: boolean;
  follow_up_needed: boolean;
}

export interface TemplateAnalytics {
  template_id: string;
  usage_stats: UsageStats;
  performance_metrics: PerformanceMetrics;
  optimization_suggestions: OptimizationSuggestion[];
  a_b_test_results?: ABTestResults;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  total_uses: number;
  unique_users: number;
  usage_by_channel: Record<string, number>;
  usage_by_time: Record<string, number>;
  peak_usage_times: string[];
  geographic_distribution: Record<string, number>;
}

export interface PerformanceMetrics {
  average_response_time: number;
  success_rate: number;
  customer_satisfaction: number;
  conversion_rate: number;
  error_rate: number;
  bounce_rate: number;
  engagement_metrics: EngagementMetrics;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'content' | 'structure' | 'variables' | 'timing' | 'targeting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expected_improvement: number;
  implementation_effort: 'low' | 'medium' | 'high';
  data_confidence: number;
  suggested_changes: string[];
  created_at: string;
}

export interface ABTestResults {
  test_id: string;
  variant_a: TemplateVariant;
  variant_b: TemplateVariant;
  winner?: 'a' | 'b' | 'inconclusive';
  confidence_level: number;
  statistical_significance: boolean;
  test_duration: number;
  sample_size: number;
  metrics_compared: string[];
  created_at: string;
  ended_at?: string;
}

export interface TemplateVariant {
  id: string;
  name: string;
  template_id: string;
  changes: TemplateChange[];
  performance: PerformanceMetrics;
  traffic_allocation: number;
}

export interface TemplateChange {
  field: string;
  old_value: string;
  new_value: string;
  change_type: 'content' | 'variable' | 'condition' | 'formatting';
}

export interface TemplatePreview {
  rendered_content: string;
  variable_values: Record<string, string>;
  media_preview: MediaPreview[];
  estimated_read_time: number;
  character_count: number;
  word_count: number;
  readability_score: number;
}

export interface MediaPreview {
  id: string;
  type: string;
  url: string;
  dimensions?: { width: number; height: number };
  duration?: number;
}

export interface TemplateShareSettings {
  template_id: string;
  share_type: 'public' | 'team' | 'specific_users' | 'external';
  shared_with: string[];
  permissions: SharePermissions;
  expiry_date?: string;
  password_protected: boolean;
  password?: string;
  created_at: string;
}

export interface SharePermissions {
  can_view: boolean;
  can_use: boolean;
  can_edit: boolean;
  can_copy: boolean;
  can_reshare: boolean;
}

export interface TemplateLibrary {
  id: string;
  name: string;
  description: string;
  templates: ResponseTemplate[];
  categories: TemplateCategory[];
  tags: string[];
  created_by: string;
  shared: boolean;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateImportExport {
  format: 'json' | 'csv' | 'xlsx' | 'zip';
  templates: ResponseTemplate[];
  metadata: {
    exported_by: string;
    exported_at: string;
    version: string;
    total_templates: number;
    categories: string[];
  };
}

export interface TemplateSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  language?: string;
  effectiveness_min?: number;
  created_by?: string;
  date_range?: {
    start: string;
    end: string;
  };
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'usage_count' | 'effectiveness_score';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TemplateSearchResult {
  templates: ResponseTemplate[];
  total_count: number;
  page: number;
  limit: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
    languages: Array<{ name: string; count: number }>;
    created_by: Array<{ name: string; count: number }>;
  };
}

// AI Training Integration Types
export interface AITrainingSession {
  id: string;
  type: 'conversation_analysis' | 'template_optimization' | 'performance_tracking' | 'knowledge_update';
  status: 'queued' | 'running' | 'completed' | 'failed';
  data_sources: string[];
  parameters: Record<string, any>;
  results: AITrainingResults;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface AITrainingResults {
  insights: LearningInsight[];
  optimizations: OptimizationSuggestion[];
  knowledge_updates: KnowledgeUpdate[];
  performance_improvements: PerformanceImprovement[];
  confidence_score: number;
  processing_time: number;
}

export interface KnowledgeUpdate {
  id: string;
  type: 'new_pattern' | 'updated_response' | 'improved_variable' | 'better_condition';
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  data_source: string;
  recommended_action: string;
  created_at: string;
}

export interface PerformanceImprovement {
  metric: string;
  before: number;
  after: number;
  improvement_percentage: number;
  confidence: number;
  sample_size: number;
}

// Template Editor Types
export interface EditorState {
  content: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  media: MediaAttachment[];
  preview_mode: boolean;
  selected_block?: string;
  cursor_position: number;
  history: EditorHistory[];
  current_history_index: number;
}

export interface EditorHistory {
  id: string;
  action: 'insert' | 'delete' | 'format' | 'variable' | 'condition' | 'media';
  content: string;
  timestamp: string;
}

export interface EditorTool {
  id: string;
  name: string;
  icon: string;
  category: 'format' | 'insert' | 'variable' | 'condition' | 'media';
  action: string;
  shortcut?: string;
  enabled: boolean;
}

export interface VariableSuggestion {
  name: string;
  type: string;
  description: string;
  example_value: string;
  source: string;
  confidence: number;
  usage_frequency: number;
}

export interface TemplateValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: 'syntax' | 'variable' | 'condition' | 'media' | 'formatting';
  message: string;
  location: { line: number; column: number };
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'performance' | 'accessibility' | 'best_practice' | 'compatibility';
  message: string;
  recommendation: string;
}

export interface ValidationSuggestion {
  type: 'optimization' | 'enhancement' | 'alternative';
  description: string;
  impact: 'low' | 'medium' | 'high';
  auto_fixable: boolean;
}

// Template Engine Types
export interface TemplateEngine {
  parse(template: string): ParsedTemplate;
  render(template: ParsedTemplate, variables: Record<string, any>): string;
  validate(template: string): TemplateValidation;
  optimize(template: string): OptimizedTemplate;
}

export interface ParsedTemplate {
  blocks: TemplateBlock[];
  variables: string[];
  conditions: TemplateCondition[];
  media: MediaAttachment[];
  metadata: TemplateMetadata;
}

export interface TemplateBlock {
  type: 'text' | 'variable' | 'condition' | 'media' | 'loop';
  content: string;
  position: { start: number; end: number };
  attributes: Record<string, any>;
}

export interface TemplateMetadata {
  version: string;
  created_at: string;
  parsed_at: string;
  complexity_score: number;
  estimated_render_time: number;
}

export interface OptimizedTemplate {
  original: string;
  optimized: string;
  improvements: TemplateImprovement[];
  performance_gain: number;
}

export interface TemplateImprovement {
  type: 'structure' | 'content' | 'variables' | 'conditions' | 'media';
  description: string;
  impact: number;
  applied: boolean;
}

// Collaboration Types
export interface TemplateCollaboration {
  template_id: string;
  collaborators: Collaborator[];
  permissions: CollaborationPermissions;
  activity_log: CollaborationActivity[];
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  permissions: CollaboratorPermissions;
  joined_at: string;
  last_active: string;
}

export interface CollaboratorPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_export: boolean;
  can_manage_collaborators: boolean;
}

export interface CollaborationPermissions {
  require_approval: boolean;
  allow_anonymous_suggestions: boolean;
  lock_template: boolean;
  enable_comments: boolean;
  enable_suggestions: boolean;
}

export interface CollaborationActivity {
  id: string;
  user_id: string;
  action: 'created' | 'edited' | 'deleted' | 'shared' | 'commented' | 'suggested';
  description: string;
  changes?: TemplateChange[];
  timestamp: string;
}

// Real-time Collaboration Types
export interface RealtimeEdit {
  id: string;
  template_id: string;
  user_id: string;
  operation: 'insert' | 'delete' | 'retain';
  position: number;
  content: string;
  timestamp: string;
}

export interface CursorPosition {
  user_id: string;
  position: number;
  selection?: { start: number; end: number };
  timestamp: string;
}

export interface TemplateComment {
  id: string;
  template_id: string;
  user_id: string;
  content: string;
  position: number;
  resolved: boolean;
  replies: TemplateComment[];
  created_at: string;
  updated_at: string;
}

export interface TemplateSuggestion {
  id: string;
  template_id: string;
  user_id: string;
  type: 'content' | 'structure' | 'variable' | 'condition';
  description: string;
  proposed_changes: TemplateChange[];
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  created_at: string;
  reviewed_at?: string;
}