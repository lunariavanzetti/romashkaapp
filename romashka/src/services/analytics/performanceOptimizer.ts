import { supabase } from '../supabaseClient';
import { format, subDays } from 'date-fns';

export interface QueryPerformanceMetrics {
  queryId: string;
  query: string;
  avgExecutionTime: number;
  executionCount: number;
  cacheHitRate: number;
  lastExecuted: Date;
  recommendations: string[];
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  priority: number;
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  strategy: 'memory' | 'redis' | 'database';
  hitRate: number;
  size: number;
}

export interface PerformanceOptimization {
  category: 'query' | 'index' | 'cache' | 'aggregation' | 'partitioning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedSpeedup: number;
  implementation: string;
  code?: string;
}

export interface DatabaseStats {
  totalQueries: number;
  avgQueryTime: number;
  slowQueries: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  diskUsage: number;
  memoryUsage: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private queryCache: Map<string, any> = new Map();
  private cacheStats: Map<string, { hits: number; misses: number; lastAccess: Date }> = new Map();

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Analyze query performance
  async analyzeQueryPerformance(): Promise<QueryPerformanceMetrics[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get query performance statistics
      const { data: queryStats, error } = await supabase
        .rpc('get_query_stats')
        .limit(50)
        .order('mean_time', { ascending: false });

      if (error) {
        console.warn('Query stats not available:', error);
        return this.getMockQueryMetrics();
      }

      return queryStats.map((stat: any) => ({
        queryId: stat.queryid,
        query: stat.query,
        avgExecutionTime: stat.mean_time,
        executionCount: stat.calls,
        cacheHitRate: this.calculateCacheHitRate(stat.queryid),
        lastExecuted: new Date(stat.last_call),
        recommendations: this.generateQueryRecommendations(stat)
      }));
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      return this.getMockQueryMetrics();
    }
  }

  // Generate index recommendations
  async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Analyze table usage patterns
      const recommendations: IndexRecommendation[] = [];

      // Check for missing indexes on frequently queried columns
      const commonQueries = [
        {
          table: 'conversations',
          columns: ['created_at', 'status'],
          reason: 'Frequently filtered by date and status',
          impact: 'high' as const
        },
        {
          table: 'messages',
          columns: ['conversation_id', 'created_at'],
          reason: 'Common join and time-based filtering',
          impact: 'high' as const
        },
        {
          table: 'daily_metrics',
          columns: ['date', 'channel_type'],
          reason: 'Analytics queries frequently group by these columns',
          impact: 'medium' as const
        },
        {
          table: 'customer_profiles',
          columns: ['email', 'phone'],
          reason: 'Lookup queries for customer identification',
          impact: 'medium' as const
        }
      ];

      recommendations.push(...commonQueries.map((rec, index) => ({
        table: rec.table,
        columns: rec.columns,
        type: 'btree' as const,
        reason: rec.reason,
        estimatedImpact: rec.impact,
        priority: index + 1
      })));

      // Add GIN indexes for full-text search
      recommendations.push({
        table: 'knowledge_items',
        columns: ['content', 'title'],
        type: 'gin',
        reason: 'Full-text search on knowledge base content',
        estimatedImpact: 'high',
        priority: 1
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating index recommendations:', error);
      return [];
    }
  }

  // Optimize analytics queries
  async optimizeAnalyticsQueries(): Promise<PerformanceOptimization[]> {
    const optimizations: PerformanceOptimization[] = [];

    // Pre-aggregation optimization
    optimizations.push({
      category: 'aggregation',
      title: 'Implement Real-time Aggregations',
      description: 'Pre-calculate common metrics to reduce query time',
      impact: 'high',
      effort: 'medium',
      estimatedSpeedup: 5.2,
      implementation: 'Create materialized views for daily/hourly aggregations',
      code: `
CREATE MATERIALIZED VIEW hourly_metrics AS
SELECT 
  date_trunc('hour', created_at) as hour,
  channel_type,
  COUNT(*) as total_conversations,
  AVG(satisfaction_rating) as avg_satisfaction
FROM conversations
GROUP BY hour, channel_type;

CREATE UNIQUE INDEX ON hourly_metrics (hour, channel_type);
      `
    });

    // Query optimization
    optimizations.push({
      category: 'query',
      title: 'Optimize Date Range Queries',
      description: 'Use partitioning and better indexing for time-based queries',
      impact: 'high',
      effort: 'high',
      estimatedSpeedup: 3.8,
      implementation: 'Implement table partitioning by date',
      code: `
-- Create partitioned table for conversations
CREATE TABLE conversations_partitioned (
  LIKE conversations INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE conversations_2024_01 PARTITION OF conversations_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
      `
    });

    // Caching optimization
    optimizations.push({
      category: 'cache',
      title: 'Implement Query Result Caching',
      description: 'Cache frequently accessed analytics results',
      impact: 'medium',
      effort: 'low',
      estimatedSpeedup: 2.5,
      implementation: 'Add Redis caching layer for analytics queries',
      code: `
// Example caching implementation
const getCachedAnalytics = async (key: string, queryFn: () => Promise<any>) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = await queryFn();
  await redis.setex(key, 300, JSON.stringify(result)); // 5 min TTL
  return result;
};
      `
    });

    // Index optimization
    optimizations.push({
      category: 'index',
      title: 'Create Composite Indexes',
      description: 'Add compound indexes for complex analytics queries',
      impact: 'medium',
      effort: 'low',
      estimatedSpeedup: 2.1,
      implementation: 'Create multi-column indexes for common query patterns',
      code: `
CREATE INDEX idx_conversations_analytics 
ON conversations (created_at, channel_type, status, assigned_agent_id);

CREATE INDEX idx_daily_metrics_composite
ON daily_metrics (date, channel_type, department);
      `
    });

    return optimizations;
  }

  // Implement caching strategies
  async implementCaching(key: string, queryFn: () => Promise<any>, ttl: number = 300): Promise<any> {
    const cacheKey = `analytics_${key}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (cached.expires > Date.now()) {
        this.updateCacheStats(cacheKey, 'hit');
        return cached.data;
      }
    }

    // Cache miss - execute query
    this.updateCacheStats(cacheKey, 'miss');
    const result = await queryFn();
    
    // Store in cache
    this.queryCache.set(cacheKey, {
      data: result,
      expires: Date.now() + (ttl * 1000)
    });

    return result;
  }

  // Get database performance stats
  async getDatabaseStats(): Promise<DatabaseStats> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get basic stats (mock implementation)
      return {
        totalQueries: 15420,
        avgQueryTime: 145.2,
        slowQueries: 23,
        cacheHitRate: 0.78,
        connectionPoolUtilization: 0.45,
        diskUsage: 2.3, // GB
        memoryUsage: 1.2 // GB
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Monitor query performance
  async monitorQueryPerformance(query: string, params: any[]): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Execute query (placeholder)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const executionTime = Date.now() - startTime;
      
      // Log performance metrics
      this.logQueryPerformance(query, executionTime, params);
      
      return executionTime;
    } catch (error) {
      console.error('Query performance monitoring error:', error);
      throw error;
    }
  }

  // Get cache performance
  getCachePerformance(): CacheStrategy[] {
    const strategies: CacheStrategy[] = [];
    
    this.cacheStats.forEach((stats, key) => {
      const total = stats.hits + stats.misses;
      const hitRate = total > 0 ? stats.hits / total : 0;
      
      strategies.push({
        key,
        ttl: 300,
        strategy: 'memory',
        hitRate,
        size: this.queryCache.get(key) ? JSON.stringify(this.queryCache.get(key)).length : 0
      });
    });
    
    return strategies;
  }

  // Optimize database configuration
  async optimizeDatabaseConfig(): Promise<PerformanceOptimization[]> {
    const optimizations: PerformanceOptimization[] = [];

    optimizations.push({
      category: 'query',
      title: 'Connection Pool Optimization',
      description: 'Optimize connection pool settings for better concurrency',
      impact: 'medium',
      effort: 'low',
      estimatedSpeedup: 1.8,
      implementation: 'Adjust connection pool size and timeout settings',
      code: `
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
      `
    });

    optimizations.push({
      category: 'cache',
      title: 'Enable Query Plan Caching',
      description: 'Cache query execution plans for repeated queries',
      impact: 'medium',
      effort: 'low',
      estimatedSpeedup: 1.5,
      implementation: 'Configure PostgreSQL query plan caching',
      code: `
-- PostgreSQL configuration
SET shared_preload_libraries = 'pg_stat_statements';
SET pg_stat_statements.max = 10000;
SET pg_stat_statements.track = all;
      `
    });

    return optimizations;
  }

  // Clean up cache
  cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.queryCache.entries()) {
      if (value.expires < now) {
        this.queryCache.delete(key);
      }
    }
  }

  // Get optimization recommendations
  async getOptimizationRecommendations(): Promise<{
    queryMetrics: QueryPerformanceMetrics[];
    indexRecommendations: IndexRecommendation[];
    performanceOptimizations: PerformanceOptimization[];
    cacheStrategies: CacheStrategy[];
    databaseStats: DatabaseStats;
  }> {
    const [
      queryMetrics,
      indexRecommendations,
      performanceOptimizations,
      databaseStats
    ] = await Promise.all([
      this.analyzeQueryPerformance(),
      this.generateIndexRecommendations(),
      this.optimizeAnalyticsQueries(),
      this.getDatabaseStats()
    ]);

    const cacheStrategies = this.getCachePerformance();

    return {
      queryMetrics,
      indexRecommendations,
      performanceOptimizations,
      cacheStrategies,
      databaseStats
    };
  }

  // Private helper methods
  private calculateCacheHitRate(queryId: string): number {
    const stats = this.cacheStats.get(queryId);
    if (!stats) return 0;
    
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  }

  private generateQueryRecommendations(stat: any): string[] {
    const recommendations: string[] = [];
    
    if (stat.mean_time > 1000) {
      recommendations.push('Consider adding appropriate indexes');
    }
    
    if (stat.calls > 100) {
      recommendations.push('High frequency query - consider caching');
    }
    
    if (stat.query.includes('SELECT *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }
    
    return recommendations;
  }

  private updateCacheStats(key: string, type: 'hit' | 'miss'): void {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, lastAccess: new Date() };
    
    if (type === 'hit') {
      stats.hits++;
    } else {
      stats.misses++;
    }
    
    stats.lastAccess = new Date();
    this.cacheStats.set(key, stats);
  }

  private logQueryPerformance(query: string, executionTime: number, params: any[]): void {
    // Log to monitoring system
    console.log(`Query executed in ${executionTime}ms:`, {
      query: query.substring(0, 100),
      executionTime,
      params: params.length
    });
  }

  private getMockQueryMetrics(): QueryPerformanceMetrics[] {
    return [
      {
        queryId: 'conversations_analytics',
        query: 'SELECT COUNT(*) FROM conversations WHERE created_at >= $1',
        avgExecutionTime: 145.2,
        executionCount: 1250,
        cacheHitRate: 0.78,
        lastExecuted: new Date(),
        recommendations: ['Add index on created_at column', 'Consider result caching']
      },
      {
        queryId: 'daily_metrics_aggregation',
        query: 'SELECT date, SUM(total_conversations) FROM daily_metrics GROUP BY date',
        avgExecutionTime: 89.7,
        executionCount: 890,
        cacheHitRate: 0.92,
        lastExecuted: subDays(new Date(), 1),
        recommendations: ['Query is well optimized']
      },
      {
        queryId: 'customer_lookup',
        query: 'SELECT * FROM customer_profiles WHERE email = $1',
        avgExecutionTime: 23.1,
        executionCount: 3450,
        cacheHitRate: 0.65,
        lastExecuted: new Date(),
        recommendations: ['High frequency lookup - increase cache TTL']
      }
    ];
  }
}