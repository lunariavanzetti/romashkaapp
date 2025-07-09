export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source_type: 'url' | 'file' | 'manual';
  confidence_score: number;
  usage_count: number;
  last_updated: Date;
  // Enhanced properties
  category_id?: string;
  language: string;
  status: 'active' | 'draft' | 'archived' | 'pending_review';
  effectiveness_score: number;
  helpful_count: number;
  not_helpful_count: number;
  version: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  metadata?: Record<string, any>;
  search_keywords?: string[];
  embedding_vector?: number[];
  content_hash?: string;
  word_count?: number;
  read_time?: number;
  linked_items?: string[];
  priority?: 'low' | 'medium' | 'high';
  scheduled_publish_at?: string;
  expires_at?: string;
  seo_title?: string;
  seo_description?: string;
  content_template_id?: string;
  workflow_stage?: WorkflowStage;
  collaboration_data?: CollaborationData;
  quality_score?: number;
  ai_suggestions?: string[];
  translation_status?: Record<string, 'pending' | 'in_progress' | 'completed'>;
  parent_id?: string; // For translations
  source_url?: string;
  import_batch_id?: string;
  performance_metrics?: PerformanceMetrics;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  order: number;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  path?: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
  avg_effectiveness?: number;
  usage_count?: number;
  permissions?: CategoryPermissions;
  metadata?: Record<string, any>;
  seo_enabled?: boolean;
  template_id?: string;
}

export interface KnowledgeVersion {
  id: string;
  item_id: string;
  content: string;
  created_at: Date;
  author: string;
  version: number;
  title?: string;
  changes_description?: string;
  diff_html?: string;
  diff_data?: any;
  tags?: string[];
  metadata?: Record<string, any>;
  restored_from?: string;
  is_major_version?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  size_bytes?: number;
  character_count?: number;
  ai_summary?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category_id?: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  is_public: boolean;
  template_type: 'faq' | 'article' | 'guide' | 'policy' | 'custom';
  preview_image?: string;
  default_language: string;
  supported_languages: string[];
  variables?: TemplateVariable[];
  sections?: TemplateSection[];
  metadata?: Record<string, any>;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  description?: string;
  required: boolean;
  default_value?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  type: 'header' | 'paragraph' | 'list' | 'table' | 'code' | 'image';
  metadata?: Record<string, any>;
}

export interface WorkflowStage {
  stage: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  assigned_to?: string;
  due_date?: string;
  comments?: WorkflowComment[];
  attachments?: string[];
  checklist?: WorkflowChecklistItem[];
  approval_required?: boolean;
  auto_publish?: boolean;
  stage_history?: StageHistory[];
}

export interface WorkflowComment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  type: 'comment' | 'suggestion' | 'approval' | 'rejection';
  resolved?: boolean;
  resolved_by?: string;
  resolved_at?: string;
  position?: { start: number; end: number };
  thread_id?: string;
  attachments?: string[];
  mentions?: string[];
}

export interface WorkflowChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
  completed_by?: string;
  completed_at?: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface StageHistory {
  stage: string;
  entered_at: string;
  exited_at?: string;
  user_id: string;
  user_name: string;
  notes?: string;
  duration?: number;
  automated?: boolean;
}

export interface CollaborationData {
  active_users?: string[];
  last_collaboration?: string;
  collaboration_session_id?: string;
  cursor_positions?: Record<string, { user: string; position: number; timestamp: string }>;
  real_time_changes?: boolean;
  conflict_resolution?: 'manual' | 'automatic';
  sync_status?: 'synced' | 'syncing' | 'conflict' | 'offline';
}

export interface PerformanceMetrics {
  views: number;
  unique_views: number;
  avg_read_time: number;
  bounce_rate: number;
  search_ranking: number;
  click_through_rate: number;
  conversion_rate: number;
  user_satisfaction: number;
  engagement_score: number;
  last_accessed: string;
  access_patterns: AccessPattern[];
  geographic_distribution: Record<string, number>;
  device_breakdown: Record<string, number>;
  referrer_sources: Record<string, number>;
}

export interface AccessPattern {
  timestamp: string;
  user_id?: string;
  session_id: string;
  duration: number;
  actions: string[];
  entry_point: string;
  exit_point: string;
  device_type: string;
  location?: string;
  referrer?: string;
}

export interface CategoryPermissions {
  read: string[];
  write: string[];
  admin: string[];
  inherit_from_parent: boolean;
  public_readable: boolean;
  public_writable: boolean;
  role_based_access: Record<string, string[]>;
}

export interface KnowledgeAnalytics {
  id: string;
  knowledge_item_id: string;
  conversation_id?: string;
  user_id?: string;
  event_type: 'view' | 'search' | 'helpful' | 'not_helpful' | 'share' | 'download' | 'edit';
  was_helpful?: boolean;
  feedback_text?: string;
  search_query?: string;
  created_at: string;
  session_id?: string;
  metadata?: Record<string, any>;
  response_time?: number;
  accuracy_score?: number;
  relevance_score?: number;
  user_satisfaction?: number;
  context_data?: any;
  ai_confidence?: number;
  improvement_suggestions?: string[];
  usage_context?: 'chatbot' | 'search' | 'browse' | 'api' | 'embed';
  geographic_location?: string;
  device_type?: string;
  platform?: string;
  language?: string;
  translation_accuracy?: number;
}

export interface ContentImport {
  id: string;
  batch_id: string;
  filename: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'html' | 'csv' | 'json' | 'xml' | 'md';
  file_size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  extracted_items: number;
  successful_imports: number;
  failed_imports: number;
  preview_content?: string;
  metadata?: Record<string, any>;
  import_settings?: ImportSettings;
  validation_results?: ValidationResult[];
  duplicate_handling?: 'skip' | 'update' | 'create_new';
  category_mapping?: Record<string, string>;
  tag_mapping?: Record<string, string[]>;
  language_detection?: Record<string, number>;
  quality_assessment?: QualityAssessment;
}

export interface ImportSettings {
  auto_categorize: boolean;
  extract_images: boolean;
  maintain_formatting: boolean;
  detect_language: boolean;
  generate_tags: boolean;
  split_large_content: boolean;
  max_content_length: number;
  quality_threshold: number;
  merge_similar_content: boolean;
  enable_ocr: boolean;
  custom_processors: string[];
  metadata_extraction: boolean;
  content_validation: boolean;
  duplicate_detection: boolean;
  ai_enhancement: boolean;
  translation_enabled: boolean;
  target_languages: string[];
  workflow_stage: string;
  assigned_reviewers: string[];
  notification_settings: NotificationSettings;
}

export interface ValidationResult {
  field: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  line_number?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_fixable: boolean;
  fix_suggestion?: string;
  impact_score?: number;
}

export interface QualityAssessment {
  overall_score: number;
  readability_score: number;
  completeness_score: number;
  accuracy_score: number;
  relevance_score: number;
  uniqueness_score: number;
  structure_score: number;
  language_quality_score: number;
  seo_score: number;
  engagement_potential: number;
  improvement_areas: string[];
  strengths: string[];
  recommendations: string[];
  automated_fixes: AutomatedFix[];
}

export interface AutomatedFix {
  type: 'grammar' | 'spelling' | 'formatting' | 'structure' | 'seo' | 'accessibility';
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  original_text: string;
  suggested_text: string;
  position: { start: number; end: number };
  auto_apply: boolean;
  requires_review: boolean;
}

export interface NotificationSettings {
  email_notifications: boolean;
  slack_notifications: boolean;
  in_app_notifications: boolean;
  recipients: string[];
  notification_types: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
  quiet_hours: { start: string; end: string };
  escalation_rules: EscalationRule[];
}

export interface EscalationRule {
  condition: string;
  delay_hours: number;
  recipients: string[];
  message_template: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  auto_actions: string[];
}

export interface SearchFilters {
  categories: string[];
  tags: string[];
  languages: string[];
  status: string[];
  date_range: { start: string; end: string };
  effectiveness_range: { min: number; max: number };
  usage_range: { min: number; max: number };
  content_type: string[];
  author: string[];
  last_updated: { start: string; end: string };
  has_translations: boolean;
  workflow_stage: string[];
  priority: string[];
  source_type: string[];
  quality_score_range: { min: number; max: number };
  word_count_range: { min: number; max: number };
  read_time_range: { min: number; max: number };
  has_attachments: boolean;
  has_comments: boolean;
  requires_review: boolean;
  expiring_soon: boolean;
  recently_accessed: boolean;
  trending: boolean;
  ai_generated: boolean;
  collaborative: boolean;
  custom_fields: Record<string, any>;
}

export interface SearchResult {
  item: KnowledgeItem;
  relevance_score: number;
  match_reason: string;
  highlights: Highlight[];
  suggestions: string[];
  related_items: KnowledgeItem[];
  search_metadata: {
    query_time: number;
    total_results: number;
    filters_applied: string[];
    search_type: 'keyword' | 'semantic' | 'hybrid';
    ai_enhanced: boolean;
    personalized: boolean;
    context_aware: boolean;
  };
}

export interface Highlight {
  field: 'title' | 'content' | 'tags' | 'category';
  text: string;
  start: number;
  end: number;
  score: number;
  type: 'exact' | 'partial' | 'semantic' | 'fuzzy';
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    last_updated: string;
    graph_version: string;
    algorithms_used: string[];
    confidence_threshold: number;
  };
}

export interface KnowledgeNode {
  id: string;
  type: 'item' | 'category' | 'tag' | 'concept' | 'entity';
  title: string;
  weight: number;
  properties: Record<string, any>;
  coordinates?: { x: number; y: number };
  cluster_id?: string;
  importance_score?: number;
  centrality_score?: number;
  connectivity_score?: number;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: 'related' | 'references' | 'contains' | 'similar' | 'derived_from' | 'translates_to';
  weight: number;
  confidence: number;
  metadata?: Record<string, any>;
  created_at: string;
  last_verified: string;
  auto_generated: boolean;
  bidirectional: boolean;
  strength: number;
  context?: string;
} 