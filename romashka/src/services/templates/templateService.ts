import { supabase } from '../supabaseClient';
import { 
  ResponseTemplate, 
  TemplateCategory, 
  TemplateVariable, 
  TemplateSearchParams, 
  TemplateSearchResult,
  TemplateUsage,
  TemplateAnalytics,
  TemplateValidation,
  TemplatePreview,
  TemplateShareSettings,
  TemplateImportExport,
  TemplateLibrary
} from '../../types/responseTemplates';
import { TemplateEngine } from './templateEngine';
import { VariableService } from './variableService';

export class TemplateService {
  private templateEngine: TemplateEngine;
  private variableService: VariableService;

  constructor() {
    this.templateEngine = new TemplateEngine();
    this.variableService = new VariableService();
  }

  // Template CRUD Operations
  async createTemplate(template: Partial<ResponseTemplate>): Promise<ResponseTemplate> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const templateData = {
        ...template,
        user_id: user.id,
        created_by: user.id,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('response_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate> {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('response_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async getTemplate(id: string): Promise<ResponseTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select(`
          *,
          category:template_categories(*),
          usage:template_usage(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  async getTemplates(filters?: {
    category?: string;
    tags?: string[];
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ResponseTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('response_templates')
        .select(`
          *,
          category:template_categories(*)
        `)
        .or(`user_id.eq.${user.id},${user.id}=ANY(shared_with)`);

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  // Template Search
  async searchTemplates(params: TemplateSearchParams): Promise<TemplateSearchResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('search_templates', {
        search_query: params.query,
        user_id: user.id,
        category_id: params.category,
        tags: params.tags,
        language: params.language,
        limit_count: params.limit || 20,
        offset_count: params.page ? (params.page - 1) * (params.limit || 20) : 0
      });

      if (error) throw error;

      // Get facets for filtering
      const facets = await this.getSearchFacets(user.id);

      return {
        templates: data || [],
        total_count: data?.length || 0,
        page: params.page || 1,
        limit: params.limit || 20,
        facets
      };
    } catch (error) {
      console.error('Error searching templates:', error);
      throw error;
    }
  }

  private async getSearchFacets(userId: string) {
    try {
      const { data: categories } = await supabase
        .from('template_categories')
        .select('name, count:response_templates(count)')
        .order('name');

      const { data: tags } = await supabase
        .from('response_templates')
        .select('tags')
        .eq('user_id', userId);

      const { data: languages } = await supabase
        .from('response_templates')
        .select('language, count(*)')
        .eq('user_id', userId)
        .group('language');

      const tagCounts = this.aggregateTagCounts(tags || []);

      return {
        categories: categories || [],
        tags: tagCounts,
        languages: languages || [],
        created_by: []
      };
    } catch (error) {
      console.error('Error getting search facets:', error);
      return { categories: [], tags: [], languages: [], created_by: [] };
    }
  }

  private aggregateTagCounts(templateTags: any[]): Array<{ name: string; count: number }> {
    const tagCounts: Record<string, number> = {};
    
    templateTags.forEach(({ tags }) => {
      if (tags) {
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts).map(([name, count]) => ({ name, count }));
  }

  // Template Categories
  async getCategories(): Promise<TemplateCategory[]> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async createCategory(category: Partial<TemplateCategory>): Promise<TemplateCategory> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory> {
    try {
      const { data, error } = await supabase
        .from('template_categories')
        .update(updates)
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
        .from('template_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Template Variables
  async getVariables(): Promise<TemplateVariable[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('template_variables')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching variables:', error);
      throw error;
    }
  }

  async createVariable(variable: Partial<TemplateVariable>): Promise<TemplateVariable> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const variableData = {
        ...variable,
        user_id: user.id,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('template_variables')
        .insert([variableData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating variable:', error);
      throw error;
    }
  }

  async updateVariable(id: string, updates: Partial<TemplateVariable>): Promise<TemplateVariable> {
    try {
      const { data, error } = await supabase
        .from('template_variables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating variable:', error);
      throw error;
    }
  }

  async deleteVariable(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_variables')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting variable:', error);
      throw error;
    }
  }

  // Template Usage Tracking
  async trackUsage(usage: Partial<TemplateUsage>): Promise<TemplateUsage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const usageData = {
        ...usage,
        user_id: user.id,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('template_usage')
        .insert([usageData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking usage:', error);
      throw error;
    }
  }

  async getUsageAnalytics(templateId: string): Promise<TemplateAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('template_analytics')
        .select('*')
        .eq('template_id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      throw error;
    }
  }

  // Template Validation
  async validateTemplate(template: Partial<ResponseTemplate>): Promise<TemplateValidation> {
    try {
      const validation = this.templateEngine.validate(template.content?.raw_text || '');
      
      // Additional business logic validation
      const errors = [...validation.errors];
      const warnings = [...validation.warnings];

      // Check for required fields
      if (!template.name) {
        errors.push({
          type: 'syntax',
          message: 'Template name is required',
          location: { line: 0, column: 0 },
          severity: 'error'
        });
      }

      if (!template.content?.raw_text) {
        errors.push({
          type: 'syntax',
          message: 'Template content is required',
          location: { line: 0, column: 0 },
          severity: 'error'
        });
      }

      // Check for variable consistency
      if (template.variables && template.content?.raw_text) {
        const templateVariables = this.extractVariables(template.content.raw_text);
        const definedVariables = template.variables.map(v => v.name);
        
        const missingVariables = templateVariables.filter(v => !definedVariables.includes(v));
        const unusedVariables = definedVariables.filter(v => !templateVariables.includes(v));

        missingVariables.forEach(variable => {
          errors.push({
            type: 'variable',
            message: `Variable ${variable} is used but not defined`,
            location: { line: 0, column: 0 },
            severity: 'error'
          });
        });

        unusedVariables.forEach(variable => {
          warnings.push({
            type: 'best_practice',
            message: `Variable ${variable} is defined but not used`,
            recommendation: 'Remove unused variables to improve performance'
          });
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions: validation.suggestions
      };
    } catch (error) {
      console.error('Error validating template:', error);
      throw error;
    }
  }

  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  // Template Preview
  async previewTemplate(
    templateId: string, 
    variableValues: Record<string, any>
  ): Promise<TemplatePreview> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const renderedContent = this.templateEngine.render(
        this.templateEngine.parse(template.content.raw_text),
        variableValues
      );

      const preview: TemplatePreview = {
        rendered_content: renderedContent,
        variable_values: variableValues,
        media_preview: template.media_attachments.map(media => ({
          id: media.id,
          type: media.type,
          url: media.url,
          dimensions: media.type === 'image' ? { width: 0, height: 0 } : undefined
        })),
        estimated_read_time: this.calculateReadTime(renderedContent),
        character_count: renderedContent.length,
        word_count: renderedContent.split(/\s+/).length,
        readability_score: this.calculateReadabilityScore(renderedContent)
      };

      return preview;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability score based on sentence and word length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Simple score: lower is better (easier to read)
    const score = Math.max(0, 100 - (avgSentenceLength * 2) - (avgWordLength * 3));
    return Math.round(score);
  }

  // Template Sharing
  async shareTemplate(templateId: string, settings: Partial<TemplateShareSettings>): Promise<TemplateShareSettings> {
    try {
      const shareData = {
        ...settings,
        template_id: templateId,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('template_share_settings')
        .insert([shareData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sharing template:', error);
      throw error;
    }
  }

  async getSharedTemplates(): Promise<ResponseTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('response_templates')
        .select(`
          *,
          category:template_categories(*)
        `)
        .contains('shared_with', [user.id])
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared templates:', error);
      throw error;
    }
  }

  // Template Import/Export
  async exportTemplates(templateIds: string[]): Promise<TemplateImportExport> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: templates, error } = await supabase
        .from('response_templates')
        .select(`
          *,
          category:template_categories(*)
        `)
        .in('id', templateIds)
        .eq('user_id', user.id);

      if (error) throw error;

      const categories = [...new Set(templates?.map(t => t.category?.name).filter(Boolean))];

      return {
        format: 'json',
        templates: templates || [],
        metadata: {
          exported_by: user.id,
          exported_at: new Date().toISOString(),
          version: '1.0.0',
          total_templates: templates?.length || 0,
          categories
        }
      };
    } catch (error) {
      console.error('Error exporting templates:', error);
      throw error;
    }
  }

  async importTemplates(importData: TemplateImportExport): Promise<ResponseTemplate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const templatesToImport = importData.templates.map(template => ({
        ...template,
        id: crypto.randomUUID(),
        user_id: user.id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('response_templates')
        .insert(templatesToImport)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error importing templates:', error);
      throw error;
    }
  }

  // Template Libraries
  async getTemplateLibraries(): Promise<TemplateLibrary[]> {
    try {
      const { data, error } = await supabase
        .from('template_libraries')
        .select('*')
        .eq('shared', true)
        .order('download_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching template libraries:', error);
      throw error;
    }
  }

  async createTemplateLibrary(library: Partial<TemplateLibrary>): Promise<TemplateLibrary> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const libraryData = {
        ...library,
        created_by: user.id,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('template_libraries')
        .insert([libraryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template library:', error);
      throw error;
    }
  }

  // Template Duplication
  async duplicateTemplate(templateId: string, newName?: string): Promise<ResponseTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const duplicatedTemplate = {
        ...template,
        id: crypto.randomUUID(),
        name: newName || `${template.name} (Copy)`,
        parent_template_id: templateId,
        usage_count: 0,
        effectiveness_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('response_templates')
        .insert([duplicatedTemplate])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }

  // Template Versioning
  async createTemplateVersion(templateId: string, changes: Partial<ResponseTemplate>): Promise<ResponseTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) throw new Error('Template not found');

      const versionedTemplate = {
        ...template,
        ...changes,
        id: crypto.randomUUID(),
        parent_template_id: templateId,
        version: template.version + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('response_templates')
        .insert([versionedTemplate])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template version:', error);
      throw error;
    }
  }

  async getTemplateVersions(templateId: string): Promise<ResponseTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select('*')
        .or(`id.eq.${templateId},parent_template_id.eq.${templateId}`)
        .order('version', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching template versions:', error);
      throw error;
    }
  }

  // Template Performance
  async getTemplatePerformance(templateId: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('template_performance_metrics')
        .select('*')
        .eq('template_id', templateId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching template performance:', error);
      throw error;
    }
  }

  // Batch Operations
  async batchUpdateTemplates(updates: Array<{ id: string; changes: Partial<ResponseTemplate> }>): Promise<ResponseTemplate[]> {
    try {
      const results: ResponseTemplate[] = [];
      
      for (const update of updates) {
        const result = await this.updateTemplate(update.id, update.changes);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error batch updating templates:', error);
      throw error;
    }
  }

  async batchDeleteTemplates(templateIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('response_templates')
        .delete()
        .in('id', templateIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error batch deleting templates:', error);
      throw error;
    }
  }
}

export const templateService = new TemplateService();