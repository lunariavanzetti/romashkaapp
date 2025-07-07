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
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  order: number;
}

export interface KnowledgeVersion {
  id: string;
  item_id: string;
  content: string;
  created_at: Date;
  author: string;
} 