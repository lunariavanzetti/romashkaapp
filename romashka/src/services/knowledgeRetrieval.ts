import { supabase } from './supabaseClient';
import type { KnowledgeItem } from './contentIngestion';

export interface KnowledgeQuery {
  query: string;
  language: string;
  context?: any;
  maxResults: number;
}

export interface KnowledgeMatch {
  item: KnowledgeItem;
  relevance_score: number;
  match_reason: string;
}

export interface ConversationContext {
  conversation_id: string;
  user_id: string;
  previous_messages: string[];
  current_intent?: string;
  business_context?: any;
}

export class KnowledgeRetrieval {
  async searchKnowledge(query: KnowledgeQuery): Promise<KnowledgeMatch[]> {
    try {
      // Search in knowledge items
      const { data: items, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name)
        `)
        .eq('status', 'active')
        .eq('language', query.language)
        .or(`title.ilike.%${query.query}%,content.ilike.%${query.query}%`)
        .order('usage_count', { ascending: false })
        .limit(query.maxResults);

      if (error) throw error;

      // Calculate relevance scores and create matches
      const matches: KnowledgeMatch[] = items.map(item => ({
        item,
        relevance_score: this.calculateRelevanceScore(query.query, item),
        match_reason: this.getMatchReason(query.query, item)
      }));

      // Sort by relevance score
      return matches.sort((a, b) => b.relevance_score - a.relevance_score);
    } catch (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }
  }

  async getRelevantContent(intent: string, context: ConversationContext): Promise<KnowledgeItem[]> {
    try {
      // Get knowledge items based on intent and context
      const { data: items, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name)
        `)
        .eq('status', 'active')
        .or(`title.ilike.%${intent}%,content.ilike.%${intent}%`)
        .order('effectiveness_score', { ascending: false })
        .limit(5);

      if (error) throw error;

      return items || [];
    } catch (error) {
      console.error('Error getting relevant content:', error);
      return [];
    }
  }

  async updateUsageStats(itemId: string, wasHelpful: boolean): Promise<void> {
    try {
      // Update usage count
      const { error: usageError } = await supabase
        .from('knowledge_items')
        .update({
          usage_count: supabase.rpc('increment', { row_id: itemId, column_name: 'usage_count' })
        })
        .eq('id', itemId);

      if (usageError) throw usageError;

      // Update helpful count
      const { error: helpfulError } = await supabase
        .from('knowledge_items')
        .update({
          helpful_count: supabase.rpc('increment', { 
            row_id: itemId, 
            column_name: wasHelpful ? 'helpful_count' : 'not_helpful_count' 
          })
        })
        .eq('id', itemId);

      if (helpfulError) throw helpfulError;

      // Update effectiveness score
      await this.updateEffectivenessScore(itemId);
    } catch (error) {
      console.error('Error updating usage stats:', error);
    }
  }

  async recordFeedback(itemId: string, conversationId: string, wasHelpful: boolean, feedbackText?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_analytics')
        .insert({
          knowledge_item_id: itemId,
          conversation_id: conversationId,
          was_helpful: wasHelpful,
          feedback_text: feedbackText
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  async getKnowledgeAnalytics(itemId?: string): Promise<any> {
    try {
      let query = supabase
        .from('knowledge_analytics')
        .select(`
          *,
          knowledge_items(title, category_id),
          conversations(id)
        `);

      if (itemId) {
        query = query.eq('knowledge_item_id', itemId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return this.processAnalyticsData(data);
    } catch (error) {
      console.error('Error getting knowledge analytics:', error);
      return null;
    }
  }

  async getSuggestedImprovements(): Promise<any[]> {
    try {
      // Get knowledge items with low effectiveness scores
      const { data: items, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .lt('effectiveness_score', 0.5)
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      return items.map(item => ({
        item,
        suggestion: this.generateImprovementSuggestion(item)
      }));
    } catch (error) {
      console.error('Error getting suggested improvements:', error);
      return [];
    }
  }

  private calculateRelevanceScore(query: string, item: KnowledgeItem): number {
    const queryLower = query.toLowerCase();
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();

    let score = 0;

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    }

    // Content match
    if (contentLower.includes(queryLower)) {
      score += 0.3;
    }

    // Tag match
    if (item.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 0.2;
    }

    // Usage count bonus
    score += Math.min(item.usage_count / 100, 0.1);

    // Effectiveness score bonus
    score += item.effectiveness_score * 0.1;

    return Math.min(score, 1.0);
  }

  private getMatchReason(query: string, item: KnowledgeItem): string {
    const queryLower = query.toLowerCase();
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();

    if (titleLower.includes(queryLower)) {
      return 'Title match';
    } else if (contentLower.includes(queryLower)) {
      return 'Content match';
    } else if (item.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      return 'Tag match';
    } else {
      return 'Related content';
    }
  }

  private async updateEffectivenessScore(itemId: string): Promise<void> {
    try {
      // Get helpful and total usage counts
      const { data: item, error: itemError } = await supabase
        .from('knowledge_items')
        .select('helpful_count, usage_count')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      if (item.usage_count > 0) {
        const effectivenessScore = item.helpful_count / item.usage_count;

        const { error: updateError } = await supabase
          .from('knowledge_items')
          .update({ effectiveness_score: effectivenessScore })
          .eq('id', itemId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating effectiveness score:', error);
    }
  }

  private processAnalyticsData(data: any[]): any {
    const totalUsage = data.length;
    const helpfulCount = data.filter(d => d.was_helpful).length;
    const helpfulRate = totalUsage > 0 ? helpfulCount / totalUsage : 0;

    return {
      totalUsage,
      helpfulCount,
      helpfulRate,
      feedback: data.filter(d => d.feedback_text).map(d => d.feedback_text)
    };
  }

  private generateImprovementSuggestion(item: KnowledgeItem): string {
    if (item.effectiveness_score < 0.3) {
      return 'Consider rewriting this content to be more helpful';
    } else if (item.effectiveness_score < 0.5) {
      return 'Add more specific examples or details';
    } else {
      return 'Content is performing well, consider expanding coverage';
    }
  }
}

export const knowledgeRetrieval = new KnowledgeRetrieval(); 