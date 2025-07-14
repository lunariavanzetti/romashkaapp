import { supabase } from '../../supabaseClient';
import { openaiService } from '../../openaiService';
import { aiTrainingService } from './aiTrainingService';
import type { ConversationAnalysis, TrainingData } from './aiTrainingService';

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  confidence: number;
  category: 'faq' | 'issue' | 'request' | 'complaint';
  suggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeUpdate {
  id: string;
  source: 'conversation' | 'feedback' | 'pattern';
  contentType: 'faq' | 'policy' | 'procedure' | 'template';
  title: string;
  content: string;
  confidence: number;
  approved: boolean;
  category: string;
  tags: string[];
  createdAt: Date;
}

export interface ModelUpdate {
  id: string;
  updateType: 'fine-tuning' | 'prompt-optimization' | 'knowledge-injection';
  description: string;
  data: any;
  performance: {
    before: number;
    after: number;
    improvement: number;
  };
  appliedAt: Date;
  status: 'pending' | 'applied' | 'failed' | 'rolled-back';
}

export interface LearningMetrics {
  totalPatterns: number;
  newPatternsToday: number;
  knowledgeUpdates: number;
  modelUpdates: number;
  averageConfidence: number;
  learningVelocity: number;
  improvementRate: number;
}

export class ContinuousLearningEngine {
  private static instance: ContinuousLearningEngine;
  private isLearning = false;
  private learningInterval: NodeJS.Timer | null = null;

  private constructor() {}

  static getInstance(): ContinuousLearningEngine {
    if (!ContinuousLearningEngine.instance) {
      ContinuousLearningEngine.instance = new ContinuousLearningEngine();
    }
    return ContinuousLearningEngine.instance;
  }

  /**
   * Start continuous learning process
   */
  async startLearning(): Promise<void> {
    if (this.isLearning) return;

    this.isLearning = true;
    console.log('Starting continuous learning engine...');

    // Run initial learning cycle
    await this.runLearningCycle();

    // Set up periodic learning
    this.learningInterval = setInterval(async () => {
      await this.runLearningCycle();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Stop continuous learning process
   */
  stopLearning(): void {
    this.isLearning = false;
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
    }
    console.log('Stopped continuous learning engine');
  }

  /**
   * Run a complete learning cycle
   */
  private async runLearningCycle(): Promise<void> {
    try {
      console.log('Running learning cycle...');

      // 1. Identify new patterns
      await this.identifyPatterns();

      // 2. Update knowledge base
      await this.updateKnowledgeBase();

      // 3. Optimize prompts and responses
      await this.optimizePrompts();

      // 4. Update model based on learnings
      await this.updateModel();

      // 5. Generate insights
      await this.generateInsights();

      console.log('Learning cycle completed successfully');
    } catch (error) {
      console.error('Error in learning cycle:', error);
    }
  }

  /**
   * Identify patterns from recent conversations
   */
  async identifyPatterns(): Promise<LearningPattern[]> {
    try {
      // Get recent conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          conversation_analyses (*)
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract patterns using AI
      const patternPrompt = `
        Analyze these conversations to identify patterns:
        
        ${conversations?.slice(0, 50).map(c => `
          Conversation: ${c.id}
          Messages: ${c.messages?.map((m: any) => m.content).join(' | ')}
          Status: ${c.status}
          Channel: ${c.channel}
        `).join('\n')}
        
        Identify patterns in:
        - Frequently asked questions
        - Common issues or complaints
        - Successful resolution patterns
        - Escalation triggers
        
        Return JSON array with:
        - pattern: Description of the pattern
        - frequency: How often it appears
        - confidence: Confidence in pattern (0-100)
        - category: faq/issue/request/complaint
        - suggestions: Array of improvement suggestions
      `;

      const patternAnalysis = await openaiService.generateResponse({
        messages: [{ role: 'user', content: patternPrompt }],
        temperature: 0.1,
        maxTokens: 2000
      });

      let patterns: LearningPattern[];
      try {
        patterns = JSON.parse(patternAnalysis.content);
      } catch {
        patterns = [];
      }

      // Store patterns
      for (const pattern of patterns) {
        await supabase
          .from('learning_patterns')
          .upsert({
            pattern: pattern.pattern,
            frequency: pattern.frequency,
            confidence: pattern.confidence,
            category: pattern.category,
            suggestions: pattern.suggestions,
            updated_at: new Date().toISOString()
          });
      }

      return patterns;
    } catch (error) {
      console.error('Error identifying patterns:', error);
      return [];
    }
  }

  /**
   * Update knowledge base from conversations
   */
  async updateKnowledgeBase(): Promise<KnowledgeUpdate[]> {
    try {
      // Get successful conversations with high ratings
      const { data: successfulConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (*),
          customer_ratings (*)
        `)
        .eq('status', 'resolved')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter high-rated conversations
      const highRatedConversations = successfulConversations?.filter(c => 
        c.customer_ratings?.[0]?.rating >= 4
      ).slice(0, 20);

      if (!highRatedConversations?.length) return [];

      // Generate knowledge updates
      const knowledgePrompt = `
        Extract knowledge from these successful conversations:
        
        ${highRatedConversations.map(c => `
          Conversation: ${c.id}
          Messages: ${c.messages?.map((m: any) => m.content).join(' | ')}
          Rating: ${c.customer_ratings?.[0]?.rating}/5
        `).join('\n')}
        
        Generate knowledge updates for:
        - New FAQ entries
        - Policy clarifications
        - Procedure improvements
        - Template optimizations
        
        Return JSON array with:
        - contentType: faq/policy/procedure/template
        - title: Clear title
        - content: Detailed content
        - confidence: Confidence score (0-100)
        - category: Category classification
        - tags: Array of relevant tags
      `;

      const knowledgeAnalysis = await openaiService.generateResponse({
        messages: [{ role: 'user', content: knowledgePrompt }],
        temperature: 0.2,
        maxTokens: 2000
      });

      let updates: KnowledgeUpdate[];
      try {
        updates = JSON.parse(knowledgeAnalysis.content);
      } catch {
        updates = [];
      }

      // Store knowledge updates
      for (const update of updates) {
        await supabase
          .from('knowledge_updates')
          .insert({
            source: 'conversation',
            content_type: update.contentType,
            title: update.title,
            content: update.content,
            confidence: update.confidence,
            approved: update.confidence > 80, // Auto-approve high confidence updates
            category: update.category,
            tags: update.tags,
            created_at: new Date().toISOString()
          });
      }

      return updates;
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      return [];
    }
  }

  /**
   * Optimize prompts based on successful interactions
   */
  async optimizePrompts(): Promise<void> {
    try {
      // Get high-performing conversation analyses
      const { data: analyses, error } = await supabase
        .from('conversation_analyses')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze successful patterns
      const optimizationPrompt = `
        Analyze these conversation analyses to optimize AI prompts:
        
        ${analyses?.map(a => `
          Analysis: ${JSON.stringify(a.analysis)}
          Success Factors: ${a.analysis?.successFactors?.join(', ')}
          Confidence: ${a.analysis?.confidenceScore}
        `).join('\n')}
        
        Generate prompt optimizations for:
        - Better response generation
        - Improved sentiment detection
        - Enhanced intent recognition
        - More accurate knowledge retrieval
        
        Return JSON with optimization recommendations.
      `;

      const optimizations = await openaiService.generateResponse({
        messages: [{ role: 'user', content: optimizationPrompt }],
        temperature: 0.1,
        maxTokens: 1000
      });

      // Store optimizations
      await supabase
        .from('prompt_optimizations')
        .insert({
          optimizations: optimizations.content,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error optimizing prompts:', error);
    }
  }

  /**
   * Update model based on learning
   */
  async updateModel(): Promise<ModelUpdate[]> {
    try {
      const updates: ModelUpdate[] = [];

      // Get recent learning data
      const performance = await aiTrainingService.monitorPerformance();
      
      // Check if model needs updates
      if (performance.aiResolutionRate.trend === 'down' || 
          performance.customerSatisfaction.trend === 'down') {
        
        // Generate model update
        const updatePrompt = `
          Based on this performance data, suggest model updates:
          
          Performance: ${JSON.stringify(performance)}
          
          Suggest specific improvements for:
          - Response accuracy
          - Knowledge utilization
          - Customer satisfaction
          - Resolution rate
          
          Return JSON with update recommendations.
        `;

        const updateSuggestions = await openaiService.generateResponse({
          messages: [{ role: 'user', content: updatePrompt }],
          temperature: 0.1,
          maxTokens: 1000
        });

        const modelUpdate: ModelUpdate = {
          id: crypto.randomUUID(),
          updateType: 'prompt-optimization',
          description: 'Performance-based model optimization',
          data: updateSuggestions.content,
          performance: {
            before: performance.aiResolutionRate.current,
            after: 0, // Will be measured after application
            improvement: 0
          },
          appliedAt: new Date(),
          status: 'pending'
        };

        // Store update
        await supabase
          .from('model_updates')
          .insert({
            update_type: modelUpdate.updateType,
            description: modelUpdate.description,
            data: modelUpdate.data,
            performance_before: modelUpdate.performance.before,
            applied_at: modelUpdate.appliedAt.toISOString(),
            status: modelUpdate.status
          });

        updates.push(modelUpdate);
      }

      return updates;
    } catch (error) {
      console.error('Error updating model:', error);
      return [];
    }
  }

  /**
   * Generate insights from learning data
   */
  async generateInsights(): Promise<void> {
    try {
      // Get learning metrics
      const metrics = await this.getLearningMetrics();

      // Generate insights
      const insightPrompt = `
        Generate insights from learning metrics:
        
        Metrics: ${JSON.stringify(metrics)}
        
        Provide insights on:
        - Learning velocity and trends
        - Knowledge gaps being filled
        - Model performance improvements
        - Areas needing attention
        
        Return actionable insights.
      `;

      const insights = await openaiService.generateResponse({
        messages: [{ role: 'user', content: insightPrompt }],
        temperature: 0.2,
        maxTokens: 1000
      });

      // Store insights
      await supabase
        .from('learning_insights')
        .insert({
          insights: insights.content,
          metrics: metrics,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }

  /**
   * Get learning metrics
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [patternsResult, updatesResult, modelUpdatesResult] = await Promise.all([
        supabase.from('learning_patterns').select('*'),
        supabase.from('knowledge_updates').select('*'),
        supabase.from('model_updates').select('*')
      ]);

      const patterns = patternsResult.data || [];
      const updates = updatesResult.data || [];
      const modelUpdates = modelUpdatesResult.data || [];

      const todayPatterns = patterns.filter(p => 
        p.created_at.startsWith(today)
      ).length;

      const avgConfidence = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
        : 0;

      return {
        totalPatterns: patterns.length,
        newPatternsToday: todayPatterns,
        knowledgeUpdates: updates.length,
        modelUpdates: modelUpdates.length,
        averageConfidence: avgConfidence,
        learningVelocity: todayPatterns / 24, // patterns per hour
        improvementRate: this.calculateImprovementRate(modelUpdates)
      };

    } catch (error) {
      console.error('Error getting learning metrics:', error);
      return {
        totalPatterns: 0,
        newPatternsToday: 0,
        knowledgeUpdates: 0,
        modelUpdates: 0,
        averageConfidence: 0,
        learningVelocity: 0,
        improvementRate: 0
      };
    }
  }

  /**
   * Process real-time learning from new conversation
   */
  async processConversationLearning(conversationId: string): Promise<void> {
    try {
      // Analyze conversation
      const analysis = await aiTrainingService.analyzeConversation(conversationId);

      // Extract immediate learning opportunities
      if (analysis.confidenceScore > 80) {
        // High confidence - extract knowledge
        await this.extractKnowledgeFromConversation(conversationId, analysis);
      }

      if (analysis.knowledgeGaps.length > 0) {
        // Identify knowledge gaps
        await this.recordKnowledgeGaps(conversationId, analysis.knowledgeGaps);
      }

      // Update patterns
      await this.updatePatternsFromConversation(conversationId, analysis);

    } catch (error) {
      console.error('Error processing conversation learning:', error);
    }
  }

  private async extractKnowledgeFromConversation(conversationId: string, analysis: ConversationAnalysis): Promise<void> {
    // Extract knowledge from successful high-confidence conversations
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*, messages (*)')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) return;

    const extractPrompt = `
      Extract actionable knowledge from this successful conversation:
      
      Messages: ${conversation.messages?.map((m: any) => m.content).join(' | ')}
      Analysis: ${JSON.stringify(analysis)}
      
      Generate knowledge entries that could help future conversations.
      Return JSON with title, content, and category.
    `;

    const knowledge = await openaiService.generateResponse({
      messages: [{ role: 'user', content: extractPrompt }],
      temperature: 0.1,
      maxTokens: 500
    });

    // Store extracted knowledge
    await supabase
      .from('knowledge_updates')
      .insert({
        source: 'conversation',
        content_type: 'faq',
        title: 'Auto-extracted Knowledge',
        content: knowledge.content,
        confidence: analysis.confidenceScore,
        approved: false,
        category: 'general',
        tags: ['auto-extracted'],
        created_at: new Date().toISOString()
      });
  }

  private async recordKnowledgeGaps(conversationId: string, gaps: string[]): Promise<void> {
    for (const gap of gaps) {
      await supabase
        .from('knowledge_gaps')
        .upsert({
          topic: gap,
          frequency: 1,
          confidence: 75,
          suggested_content: `Address: ${gap}`,
          priority: 'medium',
          created_at: new Date().toISOString()
        });
    }
  }

  private async updatePatternsFromConversation(conversationId: string, analysis: ConversationAnalysis): Promise<void> {
    for (const pattern of analysis.patternMatches) {
      await supabase
        .from('learning_patterns')
        .upsert({
          pattern: pattern,
          frequency: 1,
          confidence: analysis.confidenceScore,
          category: 'general',
          suggestions: analysis.improvementSuggestions,
          updated_at: new Date().toISOString()
        });
    }
  }

  private calculateImprovementRate(modelUpdates: any[]): number {
    if (modelUpdates.length === 0) return 0;

    const successfulUpdates = modelUpdates.filter(u => u.status === 'applied');
    const totalImprovement = successfulUpdates.reduce((sum, u) => 
      sum + (u.performance_after - u.performance_before), 0
    );

    return totalImprovement / successfulUpdates.length || 0;
  }
}

export const continuousLearningEngine = ContinuousLearningEngine.getInstance();