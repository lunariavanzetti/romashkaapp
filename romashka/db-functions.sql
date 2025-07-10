-- ROMASHKA Database Functions & Triggers
-- Automated database behaviors for data consistency
-- Version: 1.0.0

-- ================================
-- UTILITY FUNCTIONS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate random UUID
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired metrics
CREATE OR REPLACE FUNCTION cleanup_expired_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM realtime_metrics WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CONVERSATION MANAGEMENT FUNCTIONS
-- ================================

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations 
        SET message_count = message_count + 1,
            last_message_at = NEW.created_at,
            last_message = LEFT(NEW.content, 200)
        WHERE id = NEW.conversation_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE conversations 
        SET message_count = GREATEST(message_count - 1, 0)
        WHERE id = OLD.conversation_id;
        
        -- Update last_message and last_message_at
        UPDATE conversations 
        SET last_message = (
            SELECT LEFT(content, 200) 
            FROM messages 
            WHERE conversation_id = OLD.conversation_id 
            ORDER BY created_at DESC 
            LIMIT 1
        ),
        last_message_at = (
            SELECT created_at 
            FROM messages 
            WHERE conversation_id = OLD.conversation_id 
            ORDER BY created_at DESC 
            LIMIT 1
        )
        WHERE id = OLD.conversation_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign conversations to available agents
CREATE OR REPLACE FUNCTION auto_assign_conversation()
RETURNS TRIGGER AS $$
DECLARE
    available_agent_id UUID;
BEGIN
    -- Only auto-assign if no agent is assigned and conversation is active
    IF NEW.assigned_agent_id IS NULL AND NEW.status = 'active' THEN
        -- Find an available agent with lowest current chat count
        SELECT agent_id INTO available_agent_id
        FROM agent_availability
        WHERE is_online = true 
        AND status = 'available'
        AND current_chat_count < max_concurrent_chats
        ORDER BY current_chat_count ASC, last_activity DESC
        LIMIT 1;
        
        IF available_agent_id IS NOT NULL THEN
            NEW.assigned_agent_id = available_agent_id;
            
            -- Update agent's current chat count
            UPDATE agent_availability
            SET current_chat_count = current_chat_count + 1
            WHERE agent_id = available_agent_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update agent chat count on conversation status change
CREATE OR REPLACE FUNCTION update_agent_chat_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle conversation closure
    IF OLD.status IN ('active', 'escalated') AND NEW.status IN ('resolved', 'closed') THEN
        IF OLD.assigned_agent_id IS NOT NULL THEN
            UPDATE agent_availability
            SET current_chat_count = GREATEST(current_chat_count - 1, 0)
            WHERE agent_id = OLD.assigned_agent_id;
        END IF;
    END IF;
    
    -- Handle conversation reopening
    IF OLD.status IN ('resolved', 'closed') AND NEW.status IN ('active', 'escalated') THEN
        IF NEW.assigned_agent_id IS NOT NULL THEN
            UPDATE agent_availability
            SET current_chat_count = current_chat_count + 1
            WHERE agent_id = NEW.assigned_agent_id;
        END IF;
    END IF;
    
    -- Handle agent transfer
    IF OLD.assigned_agent_id IS NOT NULL AND NEW.assigned_agent_id IS NOT NULL 
       AND OLD.assigned_agent_id != NEW.assigned_agent_id THEN
        -- Decrease count for old agent
        UPDATE agent_availability
        SET current_chat_count = GREATEST(current_chat_count - 1, 0)
        WHERE agent_id = OLD.assigned_agent_id;
        
        -- Increase count for new agent
        UPDATE agent_availability
        SET current_chat_count = current_chat_count + 1
        WHERE agent_id = NEW.assigned_agent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer profile statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customer_profiles
        SET total_conversations = total_conversations + 1,
            last_interaction = NEW.created_at
        WHERE id = NEW.customer_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Update satisfaction score if changed
        IF OLD.satisfaction_score IS NULL AND NEW.satisfaction_score IS NOT NULL THEN
            UPDATE customer_profiles
            SET avg_satisfaction = (
                SELECT AVG(satisfaction_score)
                FROM conversations
                WHERE customer_id = NEW.customer_id
                AND satisfaction_score IS NOT NULL
            )
            WHERE id = NEW.customer_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- KNOWLEDGE MANAGEMENT FUNCTIONS
-- ================================

-- Function to update knowledge item usage statistics
CREATE OR REPLACE FUNCTION update_knowledge_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE knowledge_items
        SET usage_count = usage_count + 1
        WHERE id = NEW.knowledge_item_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate knowledge item effectiveness
CREATE OR REPLACE FUNCTION calculate_knowledge_effectiveness()
RETURNS TRIGGER AS $$
DECLARE
    total_usage INTEGER;
    helpful_usage INTEGER;
    effectiveness DECIMAL(3,2);
BEGIN
    -- Get usage statistics for the knowledge item
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN was_helpful = true THEN 1 END) as helpful
    INTO total_usage, helpful_usage
    FROM knowledge_analytics
    WHERE knowledge_item_id = NEW.knowledge_item_id;
    
    -- Calculate effectiveness score
    IF total_usage > 0 THEN
        effectiveness = (helpful_usage::DECIMAL / total_usage::DECIMAL);
    ELSE
        effectiveness = 0.5;
    END IF;
    
    -- Update knowledge item
    UPDATE knowledge_items
    SET effectiveness_score = effectiveness
    WHERE id = NEW.knowledge_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create knowledge version on content update
CREATE OR REPLACE FUNCTION create_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content actually changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        INSERT INTO knowledge_versions (
            knowledge_item_id,
            version,
            content,
            changes_description,
            created_by
        ) VALUES (
            NEW.id,
            NEW.version,
            NEW.content,
            'Auto-created version from content update',
            NEW.updated_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ANALYTICS FUNCTIONS
-- ================================

-- Function to create conversation analytics record
CREATE OR REPLACE FUNCTION create_conversation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO conversation_analytics (
        conversation_id,
        started_at,
        total_messages,
        customer_messages,
        ai_messages,
        agent_messages
    ) VALUES (
        NEW.id,
        NEW.created_at,
        0,
        0,
        0,
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation analytics on message
CREATE OR REPLACE FUNCTION update_conversation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversation_analytics
        SET total_messages = total_messages + 1,
            customer_messages = CASE WHEN NEW.sender_type = 'user' THEN customer_messages + 1 ELSE customer_messages END,
            ai_messages = CASE WHEN NEW.sender_type = 'ai' THEN ai_messages + 1 ELSE ai_messages END,
            agent_messages = CASE WHEN NEW.sender_type = 'agent' THEN agent_messages + 1 ELSE agent_messages END
        WHERE conversation_id = NEW.conversation_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE conversation_analytics
        SET total_messages = GREATEST(total_messages - 1, 0),
            customer_messages = CASE WHEN OLD.sender_type = 'user' THEN GREATEST(customer_messages - 1, 0) ELSE customer_messages END,
            ai_messages = CASE WHEN OLD.sender_type = 'ai' THEN GREATEST(ai_messages - 1, 0) ELSE ai_messages END,
            agent_messages = CASE WHEN OLD.sender_type = 'agent' THEN GREATEST(agent_messages - 1, 0) ELSE agent_messages END
        WHERE conversation_id = OLD.conversation_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize conversation analytics on resolution
CREATE OR REPLACE FUNCTION finalize_conversation_analytics()
RETURNS TRIGGER AS $$
DECLARE
    first_response_time INTEGER;
    total_duration INTEGER;
    resolution_type VARCHAR(50);
    resolved_by VARCHAR(20);
BEGIN
    -- Only process when conversation is resolved
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        -- Calculate first response time
        SELECT EXTRACT(EPOCH FROM (created_at - NEW.created_at))::INTEGER
        INTO first_response_time
        FROM messages
        WHERE conversation_id = NEW.id
        AND sender_type IN ('ai', 'agent')
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Calculate total duration
        total_duration = EXTRACT(EPOCH FROM (NOW() - NEW.created_at))::INTEGER;
        
        -- Determine resolution type and who resolved it
        resolution_type = CASE 
            WHEN NEW.status = 'resolved' THEN 'solved'
            WHEN NEW.status = 'closed' THEN 'closed'
            ELSE 'other'
        END;
        
        resolved_by = CASE
            WHEN NEW.assigned_agent_id IS NOT NULL THEN 'agent'
            ELSE 'ai'
        END;
        
        -- Update conversation analytics
        UPDATE conversation_analytics
        SET 
            resolved_at = NOW(),
            total_duration_seconds = total_duration,
            resolved_by = resolved_by,
            resolution_type = resolution_type,
            customer_satisfaction = NEW.satisfaction_score,
            updated_at = NOW()
        WHERE conversation_id = NEW.id;
        
        -- Update resolution time in conversations table
        UPDATE conversations
        SET resolution_time_seconds = total_duration,
            resolved_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CANNED RESPONSES FUNCTIONS
-- ================================

-- Function to track canned response usage
CREATE OR REPLACE FUNCTION track_canned_response_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called when a canned response is used
    -- Implementation depends on how canned responses are tracked in messages
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- AUDIT LOGGING FUNCTIONS
-- ================================

-- Function to log data changes
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes_json JSONB;
BEGIN
    -- Create changes JSON for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        changes_json = jsonb_build_object(
            'before', row_to_json(OLD),
            'after', row_to_json(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        changes_json = jsonb_build_object(
            'after', row_to_json(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        changes_json = jsonb_build_object(
            'before', row_to_json(OLD)
        );
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        changes,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        changes_json,
        NOW()
    );
    
    RETURN CASE TG_OP
        WHEN 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- WEBHOOK FUNCTIONS
-- ================================

-- Function to process webhook events
CREATE OR REPLACE FUNCTION process_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark event as processed
    NEW.processed = true;
    NEW.processed_at = NOW();
    
    -- Additional webhook processing logic would go here
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- METRICS FUNCTIONS
-- ================================

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics()
RETURNS void AS $$
DECLARE
    metric_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Aggregate conversation metrics by channel and agent
    INSERT INTO daily_metrics (
        date,
        channel_type,
        agent_id,
        total_conversations,
        ai_resolved_conversations,
        human_resolved_conversations,
        avg_first_response_time_seconds,
        avg_resolution_time_seconds,
        avg_satisfaction_score
    )
    SELECT
        metric_date,
        c.channel_type,
        c.assigned_agent_id,
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN c.assigned_agent_id IS NULL THEN 1 END) as ai_resolved,
        COUNT(CASE WHEN c.assigned_agent_id IS NOT NULL THEN 1 END) as human_resolved,
        AVG(EXTRACT(EPOCH FROM (first_response.created_at - c.created_at)))::INTEGER as avg_first_response,
        AVG(c.resolution_time_seconds) as avg_resolution,
        AVG(c.satisfaction_score) as avg_satisfaction
    FROM conversations c
    LEFT JOIN (
        SELECT 
            conversation_id,
            MIN(created_at) as created_at
        FROM messages
        WHERE sender_type IN ('ai', 'agent')
        GROUP BY conversation_id
    ) first_response ON c.id = first_response.conversation_id
    WHERE DATE(c.created_at) = metric_date
    GROUP BY c.channel_type, c.assigned_agent_id
    ON CONFLICT (date, channel_type, department, agent_id) DO UPDATE SET
        total_conversations = EXCLUDED.total_conversations,
        ai_resolved_conversations = EXCLUDED.ai_resolved_conversations,
        human_resolved_conversations = EXCLUDED.human_resolved_conversations,
        avg_first_response_time_seconds = EXCLUDED.avg_first_response_time_seconds,
        avg_resolution_time_seconds = EXCLUDED.avg_resolution_time_seconds,
        avg_satisfaction_score = EXCLUDED.avg_satisfaction_score;
        
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS
-- ================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_availability_updated_at
    BEFORE UPDATE ON agent_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canned_responses_updated_at
    BEFORE UPDATE ON canned_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conversation management triggers
CREATE TRIGGER trigger_update_conversation_message_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

CREATE TRIGGER trigger_auto_assign_conversation
    BEFORE INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_conversation();

CREATE TRIGGER trigger_update_agent_chat_count
    AFTER UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_chat_count();

CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Knowledge management triggers
CREATE TRIGGER trigger_update_knowledge_usage
    AFTER INSERT ON knowledge_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_usage();

CREATE TRIGGER trigger_calculate_knowledge_effectiveness
    AFTER INSERT OR UPDATE ON knowledge_analytics
    FOR EACH ROW
    EXECUTE FUNCTION calculate_knowledge_effectiveness();

CREATE TRIGGER trigger_create_knowledge_version
    AFTER UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION create_knowledge_version();

-- Analytics triggers
CREATE TRIGGER trigger_create_conversation_analytics
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_analytics();

CREATE TRIGGER trigger_update_conversation_analytics
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_analytics();

CREATE TRIGGER trigger_finalize_conversation_analytics
    AFTER UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION finalize_conversation_analytics();

-- Audit logging triggers (optional - can be enabled for specific tables)
-- CREATE TRIGGER trigger_audit_profiles
--     AFTER INSERT OR UPDATE OR DELETE ON profiles
--     FOR EACH ROW
--     EXECUTE FUNCTION log_data_changes();

-- CREATE TRIGGER trigger_audit_conversations
--     AFTER INSERT OR UPDATE OR DELETE ON conversations
--     FOR EACH ROW
--     EXECUTE FUNCTION log_data_changes();

-- Success message
SELECT 'Database functions and triggers created successfully!' as status;