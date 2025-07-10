# ROMASHKA Database Infrastructure

> Complete database schema and infrastructure for ROMASHKA - A comprehensive customer support platform with AI-powered chat, multi-channel communication, and advanced analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Migration Guide](#migration-guide)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Performance Optimization](#performance-optimization)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

ROMASHKA is a modern customer support platform that combines AI-powered chatbots, live agent support, and multi-channel communication capabilities. This repository contains the complete database infrastructure designed to support:

- **100K+ conversations** with optimal performance
- **Multi-channel communication** (WhatsApp, Email, SMS, Website)
- **AI-powered assistance** with knowledge base integration
- **Real-time analytics** and reporting
- **Workflow automation** and agent management
- **Enterprise-grade security** with Row Level Security (RLS)

## 🚀 Quick Start

### Prerequisites

- PostgreSQL 14+ or Supabase
- Node.js 18+ (for verification script)
- Database administration access

### Installation

1. **Clone or download the schema files**
   ```bash
   git clone <repository-url>
   cd romashka
   ```

2. **Run the complete schema**
   ```sql
   -- Option 1: Master Schema (All-in-one)
   \i master-schema.sql
   
   -- Option 2: Migration approach
   \i migrations/001_complete_schema.sql
   ```

3. **Add functions and triggers**
   ```sql
   \i db-functions.sql
   ```

4. **Add seed data (optional)**
   ```sql
   \i seed-data.sql
   ```

5. **Verify installation**
   ```bash
   npm install pg
   node verify-schema.js
   ```

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ROMASHKA Database Architecture            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   User Mgmt     │  │   Conversations │  │   Knowledge     │ │
│  │                 │  │                 │  │   Management    │ │
│  │ • profiles      │  │ • conversations │  │ • knowledge_*   │ │
│  │ • agent_avail   │  │ • messages      │  │ • categories    │ │
│  │ • customer_*    │  │ • notes         │  │ • analytics     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Analytics     │  │   Integrations  │  │   Workflows     │ │
│  │                 │  │                 │  │                 │ │
│  │ • daily_metrics │  │ • channels      │  │ • workflows     │ │
│  │ • conversation_ │  │ • webhooks      │  │ • automations   │ │
│  │   analytics     │  │ • sync_jobs     │  │ • triggers      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **Multi-tenancy**: Full RLS support for secure data isolation
- **Real-time**: Triggers and functions for live updates
- **Scalable**: Optimized indexes for 100K+ conversations
- **Extensible**: JSONB fields for flexible data storage
- **Auditable**: Complete audit trail with change tracking

## 📊 Database Schema

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `profiles` | User accounts (agents, admins) | → `auth.users` |
| `customer_profiles` | Customer information | ← `conversations` |
| `conversations` | Chat conversations | → `customer_profiles`, `profiles` |
| `messages` | Individual messages | → `conversations`, `profiles` |
| `knowledge_items` | Knowledge base content | → `knowledge_categories` |
| `agent_availability` | Agent status tracking | → `profiles` |

### Analytics Tables

| Table | Purpose | Key Metrics |
|-------|---------|-------------|
| `conversation_analytics` | Per-conversation metrics | Response time, resolution rate |
| `daily_metrics` | Daily aggregated data | Volume, satisfaction, performance |
| `realtime_metrics` | Live dashboard data | Active conversations, queue size |

### Integration Tables

| Table | Purpose | Supported Channels |
|-------|---------|-------------------|
| `communication_channels` | Channel configurations | WhatsApp, Email, SMS, Website |
| `webhook_events` | Incoming webhook data | All channels |
| `message_delivery_tracking` | Delivery status | All channels |

## 🔧 Installation

### Method 1: Complete Schema (Recommended)

```bash
# For PostgreSQL
psql -U username -d database_name -f master-schema.sql

# For Supabase
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy and paste master-schema.sql
# 3. Run the script
```

### Method 2: Migration Approach

```bash
# Run migrations in order
psql -U username -d database_name -f migrations/001_complete_schema.sql

# Add additional functions
psql -U username -d database_name -f db-functions.sql

# Optional: Add seed data
psql -U username -d database_name -f seed-data.sql
```

### Method 3: Step-by-Step

1. **Create Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

2. **Create Tables**
   ```sql
   -- Run table creation in dependency order
   \i master-schema.sql
   ```

3. **Add Indexes**
   ```sql
   -- Indexes are included in master-schema.sql
   -- Or run manually for specific needs
   ```

4. **Setup RLS**
   ```sql
   -- RLS policies are included in master-schema.sql
   -- Customize based on your security requirements
   ```

## 📈 Migration Guide

### From Existing Database

If you have an existing database, follow these steps:

1. **Backup Current Database**
   ```bash
   pg_dump -U username database_name > backup.sql
   ```

2. **Check Current Schema**
   ```bash
   node verify-schema.js
   ```

3. **Apply Missing Components**
   ```sql
   -- Only add missing tables/columns
   -- The migration script checks for existing structures
   ```

4. **Verify Migration**
   ```bash
   node verify-schema.js
   ```

### Migration Rollback

```sql
-- Rollback migration if needed
DROP TABLE IF EXISTS schema_migrations;
-- Then restore from backup
```

## ⚙️ Configuration

### Environment Variables

```env
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=romashka
DB_USER=postgres
DB_PASSWORD=your_password

# For Supabase
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Settings

```sql
-- Recommended PostgreSQL settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install pg  # For verification script
```

### 2. Database Setup

```bash
# Create database
createdb romashka

# Run schema
psql -d romashka -f master-schema.sql

# Add functions
psql -d romashka -f db-functions.sql

# Add seed data
psql -d romashka -f seed-data.sql
```

### 3. Verify Installation

```bash
node verify-schema.js
```

### 4. Test Queries

```sql
-- Test basic functionality
SELECT * FROM system_settings WHERE setting_key = 'platform_name';
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM knowledge_items;
```

## 🚀 Performance Optimization

### Indexes

The schema includes optimized indexes for:

- **Conversation queries**: `idx_conversations_status_created_at`
- **Message lookups**: `idx_messages_conversation_created`
- **Customer searches**: `idx_customer_profiles_email`
- **Full-text search**: `idx_knowledge_items_content_trgm`

### Query Optimization

```sql
-- Use these patterns for optimal performance

-- Conversation listing (paginated)
SELECT * FROM conversations 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- Message history
SELECT * FROM messages 
WHERE conversation_id = $1 
ORDER BY created_at ASC;

-- Knowledge search
SELECT * FROM knowledge_items 
WHERE content ILIKE '%query%' 
OR title ILIKE '%query%'
ORDER BY effectiveness_score DESC;
```

### Performance Monitoring

```sql
-- Enable query statistics
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

```sql
-- Example policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated access to conversations" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');
```

### Data Encryption

- **Credentials**: Stored in encrypted JSONB fields
- **PII**: Use application-level encryption for sensitive data
- **Audit Trail**: Complete change tracking in `audit_logs`

### Access Control

```sql
-- Create roles
CREATE ROLE romashka_agent;
CREATE ROLE romashka_admin;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON conversations TO romashka_agent;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO romashka_admin;
```

## 🔧 Troubleshooting

### Common Issues

1. **Missing Extensions**
   ```sql
   -- Install required extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

2. **Permission Errors**
   ```sql
   -- Grant necessary permissions
   GRANT USAGE ON SCHEMA public TO your_user;
   GRANT CREATE ON SCHEMA public TO your_user;
   ```

3. **Foreign Key Violations**
   ```sql
   -- Check referential integrity
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE contype = 'f' AND NOT convalidated;
   ```

### Verification Script Issues

```bash
# Install dependencies
npm install pg

# Set environment variables
export DB_HOST=localhost
export DB_NAME=romashka
export DB_USER=postgres
export DB_PASSWORD=your_password

# Run verification
node verify-schema.js
```

### Performance Issues

1. **Slow Queries**
   ```sql
   -- Analyze slow queries
   EXPLAIN ANALYZE SELECT * FROM conversations WHERE status = 'active';
   ```

2. **Missing Indexes**
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;
   ```

## 📋 Maintenance

### Regular Tasks

1. **Update Statistics**
   ```sql
   ANALYZE;
   ```

2. **Vacuum Tables**
   ```sql
   VACUUM ANALYZE;
   ```

3. **Clean Expired Data**
   ```sql
   SELECT cleanup_expired_metrics();
   ```

4. **Backup Database**
   ```bash
   pg_dump -U username database_name > backup_$(date +%Y%m%d).sql
   ```

### Monitoring

```sql
-- System health check
SELECT 'ROMASHKA Database Health Check' as status;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check active connections
SELECT COUNT(*) as active_connections FROM pg_stat_activity;
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
3. **Test your changes thoroughly**
4. **Submit a pull request**

### Development Guidelines

- Follow PostgreSQL best practices
- Include comprehensive tests
- Document all changes
- Maintain backward compatibility

### Testing

```bash
# Run schema verification
node verify-schema.js

# Test specific functionality
psql -d romashka -c "SELECT test_function();"
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [ROMASHKA API Documentation](../api/README.md)
- [Frontend Integration Guide](../frontend/README.md)

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

For support and questions:

- 📧 Email: support@romashka.com
- 💬 Discord: [ROMASHKA Community](https://discord.gg/romashka)
- 🐛 Issues: [GitHub Issues](https://github.com/romashka/issues)

---

**Built with ❤️ by the ROMASHKA Team**
