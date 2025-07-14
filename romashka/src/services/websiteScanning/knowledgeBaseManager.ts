import { supabase } from '../supabaseClient';
import { openaiService } from '../openaiService';
import { contentImporter } from './contentImporter';
import { enhancedWebsiteScanner } from './enhancedWebsiteScanner';
import type { KnowledgeItem } from '../contentIngestion';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  order_index: number;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  children?: KnowledgeCategory[];
  item_count?: number;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category_name?: string;
  tags: string[];
  relevance_score: number;
  usage_count: number;
  effectiveness_score: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSearchFilters {
  category_id?: string;
  tags?: string[];
  source_type?: string;
  status?: string;
  min_relevance?: number;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface KnowledgeAnalytics {
  total_items: number;
  active_items: number;
  categories_count: number;
  most_viewed_items: KnowledgeSearchResult[];
  top_categories: {
    name: string;
    count: number;
    usage: number;
  }[];
  search_trends: {
    query: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  quality_metrics: {
    average_effectiveness: number;
    high_quality_percentage: number;
    items_needing_review: number;
  };
}

export interface KnowledgeRelationship {
  id: string;
  parent_item_id: string;
  child_item_id: string;
  relationship_type: 'related' | 'depends_on' | 'references' | 'follows';
  strength: number;
  created_by?: string;
  created_at: string;
}

export interface KnowledgeVersion {
  id: string;
  knowledge_item_id: string;
  version_number: number;
  title: string;
  content: string;
  summary?: string;
  changes_description?: string;
  created_by?: string;
  created_at: string;
}

export interface KnowledgeSuggestion {
  id: string;
  knowledge_item_id: string;
  suggestion_type: 'related_content' | 'tag' | 'category' | 'improvement';
  suggestion_text: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export class KnowledgeBaseManager {
  
  // Category Management
  async getCategories(includeHierarchy = true): Promise<KnowledgeCategory[]> {
    try {
      if (includeHierarchy) {
        const { data, error } = await supabase
          .rpc('get_knowledge_category_hierarchy');
        
        if (error) throw error;
        return this.buildCategoryTree(data);
      } else {
        const { data, error } = await supabase
          .from('knowledge_categories')
          .select('*')
          .order('order_index');
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(category: Partial<KnowledgeCategory>): Promise<KnowledgeCategory> {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert({
          name: category.name,
          description: category.description,
          parent_id: category.parent_id,
          order_index: category.order_index || 0,
          color: category.color || '#3B82F6',
          icon: category.icon || 'folder'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<KnowledgeCategory>): Promise<KnowledgeCategory> {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async reorderCategories(categoryOrders: { id: string; order_index: number }[]): Promise<void> {
    try {
      const updates = categoryOrders.map(({ id, order_index }) => 
        supabase
          .from('knowledge_categories')
          .update({ order_index })
          .eq('id', id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }

  // Knowledge Item Management
  async getKnowledgeItems(
    filters: KnowledgeSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ items: KnowledgeSearchResult[]; total: number }> {
    try {
      let query = supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name)
        `)
        .eq('status', filters.status || 'active')
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.source_type) {
        query = query.eq('source_type', filters.source_type);
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      // Get total count
      const { count } = await query.clone().select('*', { count: 'exact', head: true });

      // Apply pagination
      const offset = (page - 1) * limit;
      const { data, error } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const items = data.map(item => ({
        ...item,
        category_name: item.knowledge_categories?.name,
        relevance_score: 1.0 // Default relevance for non-search queries
      }));

      return { items, total: count || 0 };
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
      throw error;
    }
  }

  async getKnowledgeItem(id: string): Promise<KnowledgeItem | null> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name),
          knowledge_versions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Track analytics
      await this.trackAnalytics(id, 'view');

      return data;
    } catch (error) {
      console.error('Error fetching knowledge item:', error);
      throw error;
    }
  }

  async createKnowledgeItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    try {
      const { data, error } = await supabase
        .from('knowledge_items')
        .insert({
          title: item.title,
          content: item.content,
          summary: item.summary,
          category_id: item.category_id,
          source_type: item.source_type || 'manual',
          source_url: item.source_url,
          file_path: item.file_path,
          tags: item.tags || [],
          status: item.status || 'active',
          confidence_score: item.confidence_score || 0.8,
          language: item.language || 'en',
          metadata: item.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await this.createVersion(data.id, data, 'Initial version');

      return data;
    } catch (error) {
      console.error('Error creating knowledge item:', error);
      throw error;
    }
  }

  async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>, changesDescription?: string): Promise<KnowledgeItem> {
    try {
      // Get current item for version tracking
      const currentItem = await this.getKnowledgeItem(id);
      if (!currentItem) throw new Error('Knowledge item not found');

      const { data, error } = await supabase
        .from('knowledge_items')
        .update({
          ...updates,
          version: currentItem.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create new version
      await this.createVersion(id, data, changesDescription || 'Updated content');

      return data;
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      throw error;
    }
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    try {
      // Track analytics
      await this.trackAnalytics(id, 'delete');

      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      throw error;
    }
  }

  async bulkUpdateKnowledgeItems(
    itemIds: string[],
    updates: Partial<KnowledgeItem>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk updating knowledge items:', error);
      throw error;
    }
  }

  // Search and Filtering
  async searchKnowledge(
    query: string,
    filters: KnowledgeSearchFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ items: KnowledgeSearchResult[]; total: number }> {
    try {
      // Track search
      await this.trackSearch(query);

      // Use semantic search function
      const { data, error } = await supabase
        .rpc('semantic_search_knowledge', {
          query,
          limit_count: limit,
          min_relevance: filters.min_relevance || 0.1
        });

      if (error) throw error;

      let results = data || [];

      // Apply additional filters
      if (filters.category_id) {
        const { data: categoryData } = await supabase
          .from('knowledge_categories')
          .select('name')
          .eq('id', filters.category_id)
          .single();

        if (categoryData) {
          results = results.filter(item => item.category_name === categoryData.name);
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        const { data: taggedItems } = await supabase
          .from('knowledge_items')
          .select('id')
          .contains('tags', filters.tags);

        const taggedIds = taggedItems?.map(item => item.id) || [];
        results = results.filter(item => taggedIds.includes(item.id));
      }

      // Track analytics for clicked items
      results.forEach(item => {
        this.trackAnalytics(item.id, 'search', query, item.relevance_score);
      });

      return { items: results, total: results.length };
    } catch (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }
  }

  async getRecommendedContent(itemId: string, limit = 5): Promise<KnowledgeSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_related_knowledge_items', {
          item_id: itemId,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recommended content:', error);
      throw error;
    }
  }

  // Version Control
  async getVersionHistory(itemId: string): Promise<KnowledgeVersion[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_versions')
        .select('*')
        .eq('knowledge_item_id', itemId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  async restoreVersion(itemId: string, versionId: string): Promise<KnowledgeItem> {
    try {
      // Get the version to restore
      const { data: version, error: versionError } = await supabase
        .from('knowledge_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update the knowledge item
      const updates = {
        title: version.title,
        content: version.content,
        summary: version.summary
      };

      return await this.updateKnowledgeItem(itemId, updates, `Restored to version ${version.version_number}`);
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }

  private async createVersion(itemId: string, item: KnowledgeItem, changesDescription: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('knowledge_versions')
        .insert({
          knowledge_item_id: itemId,
          version_number: item.version,
          title: item.title,
          content: item.content,
          summary: item.summary,
          changes_description: changesDescription
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating version:', error);
    }
  }

  // Analytics and Tracking
  async trackAnalytics(
    itemId: string,
    eventType: string,
    query?: string,
    relevanceScore?: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .rpc('track_knowledge_analytics', {
          item_id: itemId,
          event: eventType,
          user_id: user?.id,
          query,
          relevance: relevanceScore
        });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }

  async trackSearch(query: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('knowledge_search_history')
        .insert({
          user_id: user?.id,
          query,
          search_type: 'full_text'
        });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  async getAnalytics(): Promise<KnowledgeAnalytics> {
    try {
      // Get basic stats
      const { data: stats } = await supabase
        .from('knowledge_item_stats')
        .select('*');

      const totalItems = stats?.length || 0;
      const activeItems = stats?.filter(item => item.status === 'active').length || 0;

      // Get categories count
      const { count: categoriesCount } = await supabase
        .from('knowledge_categories')
        .select('*', { count: 'exact', head: true });

      // Get most viewed items
      const { data: mostViewed } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('status', 'active')
        .order('usage_count', { ascending: false })
        .limit(10);

      // Get top categories
      const { data: topCategories } = await supabase
        .from('knowledge_items')
        .select(`
          category_id,
          knowledge_categories(name),
          usage_count
        `)
        .eq('status', 'active')
        .not('category_id', 'is', null);

      const categoryStats = this.aggregateCategoryStats(topCategories);

      // Get search trends
      const { data: searchTrends } = await supabase
        .from('knowledge_search_history')
        .select('query')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const trends = this.calculateSearchTrends(searchTrends);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(stats);

      return {
        total_items: totalItems,
        active_items: activeItems,
        categories_count: categoriesCount || 0,
        most_viewed_items: mostViewed || [],
        top_categories: categoryStats,
        search_trends: trends,
        quality_metrics: qualityMetrics
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // AI-Powered Features
  async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `Generate a concise summary of the following content in 2-3 sentences:\n\n${content.substring(0, 2000)}`;
      const summary = await openaiService.generateResponse(prompt, { maxTokens: 150 });
      return summary.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  async extractKeywords(content: string): Promise<string[]> {
    try {
      const prompt = `Extract 5-10 relevant keywords from this content. Return only the keywords separated by commas:\n\n${content.substring(0, 1000)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 100 });
      return response.split(',').map(keyword => keyword.trim()).filter(k => k.length > 0);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }

  async generateFAQ(content: string): Promise<Array<{ question: string; answer: string }>> {
    try {
      const prompt = `Generate 3-5 frequently asked questions and answers based on this content. Format as JSON array with question and answer fields:\n\n${content.substring(0, 1500)}`;
      const response = await openaiService.generateResponse(prompt, { maxTokens: 400 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating FAQ:', error);
      return [];
    }
  }

  async suggestImprovements(itemId: string): Promise<KnowledgeSuggestion[]> {
    try {
      const item = await this.getKnowledgeItem(itemId);
      if (!item) return [];

      const suggestions: KnowledgeSuggestion[] = [];

      // AI-powered content improvement suggestions
      const prompt = `Analyze this content and suggest 3 specific improvements:\n\n${item.content.substring(0, 1000)}`;
      const aiSuggestions = await openaiService.generateResponse(prompt, { maxTokens: 200 });

      const improvementSuggestions = aiSuggestions.split('\n').filter(s => s.trim().length > 0);

      for (const suggestion of improvementSuggestions) {
        suggestions.push({
          id: '', // Will be generated by database
          knowledge_item_id: itemId,
          suggestion_type: 'improvement',
          suggestion_text: suggestion,
          confidence_score: 0.7,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      // Save suggestions to database
      if (suggestions.length > 0) {
        await supabase
          .from('knowledge_auto_suggestions')
          .insert(suggestions);
      }

      return suggestions;
    } catch (error) {
      console.error('Error suggesting improvements:', error);
      return [];
    }
  }

  async identifyKnowledgeGaps(): Promise<string[]> {
    try {
      // Get search queries with no results
      const { data: failedSearches } = await supabase
        .from('knowledge_search_history')
        .select('query')
        .eq('results_count', 0)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get most common failed queries
      const queryMap = new Map<string, number>();
      failedSearches?.forEach(search => {
        const count = queryMap.get(search.query) || 0;
        queryMap.set(search.query, count + 1);
      });

      const gaps = Array.from(queryMap.entries())
        .filter(([_, count]) => count >= 3) // Only queries that failed 3+ times
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query]) => query);

      return gaps;
    } catch (error) {
      console.error('Error identifying knowledge gaps:', error);
      return [];
    }
  }

  // Content Organization
  async createRelationship(
    parentId: string,
    childId: string,
    type: 'related' | 'depends_on' | 'references' | 'follows',
    strength = 0.5
  ): Promise<KnowledgeRelationship> {
    try {
      const { data, error } = await supabase
        .from('knowledge_relationships')
        .insert({
          parent_item_id: parentId,
          child_item_id: childId,
          relationship_type: type,
          strength
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  }

  async getRelationships(itemId: string): Promise<KnowledgeRelationship[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_relationships')
        .select('*')
        .or(`parent_item_id.eq.${itemId},child_item_id.eq.${itemId}`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting relationships:', error);
      throw error;
    }
  }

  async submitFeedback(
    itemId: string,
    feedbackType: 'helpful' | 'not_helpful' | 'outdated' | 'incorrect' | 'incomplete',
    rating?: number,
    comment?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('knowledge_feedback')
        .insert({
          knowledge_item_id: itemId,
          user_id: user?.id,
          feedback_type: feedbackType,
          rating,
          comment
        });

      // Update effectiveness score
      await supabase.rpc('calculate_knowledge_effectiveness', { item_id: itemId });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Helper methods
  private buildCategoryTree(categories: any[]): KnowledgeCategory[] {
    const categoryMap = new Map<string, KnowledgeCategory>();
    const rootCategories: KnowledgeCategory[] = [];

    // Create category objects
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: []
      });
    });

    // Build tree structure
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  private aggregateCategoryStats(data: any[]): Array<{ name: string; count: number; usage: number }> {
    const categoryMap = new Map<string, { count: number; usage: number }>();

    data?.forEach(item => {
      const categoryName = item.knowledge_categories?.name || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { count: 0, usage: 0 };
      categoryMap.set(categoryName, {
        count: existing.count + 1,
        usage: existing.usage + (item.usage_count || 0)
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateSearchTrends(searchData: any[]): Array<{ query: string; count: number; trend: 'up' | 'down' | 'stable' }> {
    const queryMap = new Map<string, number>();
    
    searchData?.forEach(search => {
      const count = queryMap.get(search.query) || 0;
      queryMap.set(search.query, count + 1);
    });

    return Array.from(queryMap.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({
        query,
        count,
        trend: 'stable' as const // Would need historical data to calculate actual trends
      }));
  }

  private calculateQualityMetrics(stats: any[]): {
    average_effectiveness: number;
    high_quality_percentage: number;
    items_needing_review: number;
  } {
    if (!stats || stats.length === 0) {
      return {
        average_effectiveness: 0,
        high_quality_percentage: 0,
        items_needing_review: 0
      };
    }

    const activeItems = stats.filter(item => item.status === 'active');
    const totalEffectiveness = activeItems.reduce((sum, item) => sum + (item.effectiveness_score || 0), 0);
    const averageEffectiveness = totalEffectiveness / activeItems.length;

    const highQualityItems = activeItems.filter(item => (item.effectiveness_score || 0) >= 0.7);
    const highQualityPercentage = (highQualityItems.length / activeItems.length) * 100;

    const itemsNeedingReview = activeItems.filter(item => 
      (item.effectiveness_score || 0) < 0.5 || 
      (item.feedback_count || 0) > 0 && (item.average_rating || 0) < 3
    ).length;

    return {
      average_effectiveness: averageEffectiveness,
      high_quality_percentage: highQualityPercentage,
      items_needing_review: itemsNeedingReview
    };
  }
}

// Export singleton instance
export const knowledgeBaseManager = new KnowledgeBaseManager();