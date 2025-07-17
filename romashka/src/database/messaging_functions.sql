-- ROMASHKA Real-Time Messaging Database Functions
-- These functions support the Agent 1 requirements for real-time messaging

-- ================================
-- FUNCTION: create_conversation
-- Creates a new conversation with customer and initial message
-- ================================
CREATE OR REPLACE FUNCTION create_conversation(
    customer_identifier TEXT,
    channel_type TEXT,
    initial_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    customer_id UUID;
    customer_name TEXT;
    customer_email TEXT;
    customer_phone TEXT;
BEGIN
    -- Determine customer data based on identifier format
    IF customer_identifier LIKE '%@%' THEN
        -- Email format
        customer_email := customer_identifier;
        customer_name := split_part(customer_identifier, '@', 1);
        customer_phone := NULL;
    ELSE
        -- Phone format
        customer_phone := customer_identifier;
        customer_name := customer_identifier;
        customer_email := NULL;
    END IF;

    -- Find or create customer profile
    SELECT id INTO customer_id
    FROM customer_profiles
    WHERE (email = customer_email AND customer_email IS NOT NULL)
       OR (phone = customer_phone AND customer_phone IS NOT NULL);

    IF customer_id IS NULL THEN
        -- Create new customer profile
        INSERT INTO customer_profiles (
            name, email, phone, status, created_at, updated_at
        ) VALUES (
            customer_name, customer_email, customer_phone, 'active', NOW(), NOW()
        ) RETURNING id INTO customer_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (
        customer_id,
        customer_name,
        user_name,
        user_email,
        customer_phone,
        status,
        priority,
        channel_type,
        language,
        department,
        created_at,
        updated_at,
        last_message_at,
        last_message,
        message_count
    ) VALUES (
        customer_id,
        customer_name,
        customer_name,
        customer_email,
        customer_phone,
        'active',
        'normal',
        channel_type,
        'en',
        'general',
        NOW(),
        NOW(),
        NOW(),
        COALESCE(initial_message, ''),
        0
    ) RETURNING id INTO conversation_id;

    -- Insert initial message if provided
    IF initial_message IS NOT NULL THEN
        INSERT INTO messages (
            conversation_id,
            sender_type,
            content,
            channel_type,
            message_type,
            delivery_status,
            created_at,
            updated_at
        ) VALUES (
            conversation_id,
            'user',
            initial_message,
            channel_type,
            'text',
            'sent',
            NOW(),
            NOW()
        );

        -- Update conversation message count
        UPDATE conversations
        SET message_count = 1,
            last_message = initial_message,
            last_message_at = NOW(),
            updated_at = NOW()
        WHERE id = conversation_id;
    END IF;

    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION: handle_new_message
-- Trigger function for new message processing
-- ================================
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
    conversation_record RECORD;
    ai_response TEXT;
    should_generate_ai_response BOOLEAN := FALSE;
BEGIN
    -- Update conversation metadata
    UPDATE conversations
    SET
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- Get conversation details for AI response logic
    SELECT * INTO conversation_record
    FROM conversations
    WHERE id = NEW.conversation_id;

    -- Determine if AI response should be generated
    IF NEW.sender_type = 'user' THEN
        -- Generate AI response for user messages
        -- Check if conversation is still active and not assigned to human agent
        IF conversation_record.status = 'active' AND 
           (conversation_record.assigned_agent_id IS NULL OR 
            conversation_record.ai_confidence > 0.7) THEN
            should_generate_ai_response := TRUE;
        END IF;
    END IF;

    -- Store metrics for performance monitoring
    INSERT INTO realtime_metrics (
        metric_name,
        metric_value,
        dimensions,
        timestamp,
        expires_at
    ) VALUES (
        'message_received',
        1,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'sender_type', NEW.sender_type,
            'channel_type', NEW.channel_type,
            'message_length', length(NEW.content)
        ),
        NOW(),
        NOW() + INTERVAL '1 hour'
    );

    -- Log conversation activity
    INSERT INTO conversation_analytics (
        conversation_id,
        started_at,
        total_messages,
        customer_messages,
        ai_messages,
        agent_messages
    ) VALUES (
        NEW.conversation_id,
        conversation_record.created_at,
        1,
        CASE WHEN NEW.sender_type = 'user' THEN 1 ELSE 0 END,
        CASE WHEN NEW.sender_type = 'ai' THEN 1 ELSE 0 END,
        CASE WHEN NEW.sender_type = 'agent' THEN 1 ELSE 0 END
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
        total_messages = conversation_analytics.total_messages + 1,
        customer_messages = conversation_analytics.customer_messages + 
            CASE WHEN NEW.sender_type = 'user' THEN 1 ELSE 0 END,
        ai_messages = conversation_analytics.ai_messages + 
            CASE WHEN NEW.sender_type = 'ai' THEN 1 ELSE 0 END,
        agent_messages = conversation_analytics.agent_messages + 
            CASE WHEN NEW.sender_type = 'agent' THEN 1 ELSE 0 END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION: generate_ai_response
-- Placeholder for AI response generation
-- ================================
CREATE OR REPLACE FUNCTION generate_ai_response(
    conversation_id UUID,
    user_message TEXT,
    context JSONB DEFAULT '{}'
) RETURNS TABLE (
    response TEXT,
    confidence DECIMAL(3,2),
    requires_human BOOLEAN,
    response_time INTEGER,
    intent TEXT,
    sentiment TEXT
) AS $$
BEGIN
    -- This is a placeholder function that would integrate with AI service
    -- In production, this would call the actual AI service
    
    -- For now, return a simple response
    RETURN QUERY SELECT
        'Thank you for your message. I''m processing your request and will get back to you shortly.' as response,
        0.8::DECIMAL(3,2) as confidence,
        FALSE as requires_human,
        1500 as response_time,
        'general_inquiry' as intent,
        'neutral' as sentiment;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION: update_conversation_metrics
-- Updates conversation performance metrics
-- ================================
CREATE OR REPLACE FUNCTION update_conversation_metrics(
    conversation_id UUID,
    response_time INTEGER,
    ai_confidence DECIMAL(3,2),
    requires_human BOOLEAN
) RETURNS VOID AS $$
BEGIN
    -- Update conversation AI confidence
    UPDATE conversations
    SET
        ai_confidence = ai_confidence,
        updated_at = NOW()
    WHERE id = conversation_id;

    -- Store performance metrics
    INSERT INTO realtime_metrics (
        metric_name,
        metric_value,
        dimensions,
        timestamp,
        expires_at
    ) VALUES (
        'ai_response_time',
        response_time,
        jsonb_build_object(
            'conversation_id', conversation_id,
            'ai_confidence', ai_confidence,
            'requires_human', requires_human
        ),
        NOW(),
        NOW() + INTERVAL '1 hour'
    );

    -- Update conversation analytics
    UPDATE conversation_analytics
    SET
        ai_accuracy_score = ai_confidence,
        handoff_count = handoff_count + CASE WHEN requires_human THEN 1 ELSE 0 END
    WHERE conversation_id = conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION: get_conversation_context
-- Gets context for AI response generation
-- ================================
CREATE OR REPLACE FUNCTION get_conversation_context(
    conversation_id UUID
) RETURNS JSONB AS $$
DECLARE
    context JSONB;
    conversation_record RECORD;
    recent_messages JSONB;
    customer_profile JSONB;
BEGIN
    -- Get conversation details
    SELECT * INTO conversation_record
    FROM conversations
    WHERE id = conversation_id;

    -- Get recent messages (last 10)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'sender_type', sender_type,
            'content', content,
            'created_at', created_at,
            'confidence_score', confidence_score,
            'intent_detected', intent_detected
        )
    ) INTO recent_messages
    FROM (
        SELECT *
        FROM messages
        WHERE conversation_id = conversation_id
        ORDER BY created_at DESC
        LIMIT 10
    ) recent;

    -- Get customer profile
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'email', email,
        'phone', phone,
        'total_conversations', total_conversations,
        'avg_satisfaction', avg_satisfaction,
        'tags', tags
    ) INTO customer_profile
    FROM customer_profiles
    WHERE id = conversation_record.customer_id;

    -- Build context object
    context := jsonb_build_object(
        'conversation_id', conversation_id,
        'customer_profile', customer_profile,
        'channel_type', conversation_record.channel_type,
        'language', conversation_record.language,
        'department', conversation_record.department,
        'priority', conversation_record.priority,
        'sentiment', conversation_record.sentiment,
        'intent', conversation_record.intent,
        'recent_messages', recent_messages,
        'business_context', conversation_record.business_context
    );

    RETURN context;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION: cleanup_expired_metrics
-- Cleanup old performance metrics
-- ================================
CREATE OR REPLACE FUNCTION cleanup_expired_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM realtime_metrics
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS
-- ================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_handle_new_message ON messages;

-- Create trigger for new message processing
CREATE TRIGGER trigger_handle_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();

-- ================================
-- PERFORMANCE INDEXES
-- ================================

-- Indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_type 
    ON messages(sender_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_status 
    ON conversations(customer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_channel_active 
    ON conversations(channel_type, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_realtime_metrics_expires 
    ON realtime_metrics(expires_at, metric_name);

-- ================================
-- SCHEDULED CLEANUP
-- ================================

-- This would be run periodically to clean up old metrics
-- SELECT cleanup_expired_metrics();