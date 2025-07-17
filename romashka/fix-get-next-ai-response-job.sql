-- Fix for get_next_ai_response_job function
-- This fixes the GROUP BY clause error
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_next_ai_response_job()
RETURNS TABLE (
    job_id UUID,
    conversation_id UUID,
    message_id UUID,
    user_message TEXT,
    conversation_context JSONB,
    customer_profile JSONB,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH next_job AS (
        SELECT 
            arq.id,
            arq.conversation_id,
            arq.message_id,
            arq.user_message,
            arq.priority
        FROM ai_response_queue arq
        WHERE arq.status = 'pending'
            AND arq.process_after <= NOW()
            AND arq.retry_count < arq.max_retries
        ORDER BY arq.priority ASC, arq.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    SELECT 
        nj.id,
        nj.conversation_id,
        nj.message_id,
        nj.user_message,
        -- Get conversation context
        jsonb_build_object(
            'channel_type', c.channel_type,
            'language', c.language,
            'priority', c.priority,
            'department', c.department,
            'intent', c.intent,
            'sentiment', c.sentiment,
            'message_count', c.message_count,
            'recent_messages', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'content', m.content,
                        'sender_type', m.sender_type,
                        'created_at', m.created_at
                    ) ORDER BY m.created_at DESC
                )
                FROM (
                    SELECT m.id, m.content, m.sender_type, m.created_at
                    FROM messages m
                    WHERE m.conversation_id = nj.conversation_id
                    ORDER BY m.created_at DESC
                    LIMIT 10
                ) m
            )
        ),
        -- Get customer profile
        jsonb_build_object(
            'id', cp.id,
            'name', cp.name,
            'email', cp.email,
            'phone', cp.phone,
            'total_conversations', cp.total_conversations,
            'satisfaction_rating', cp.satisfaction_rating,
            'preferences', cp.preferences
        ),
        nj.priority
    FROM next_job nj
    JOIN conversations c ON c.id = nj.conversation_id
    LEFT JOIN customer_profiles cp ON cp.id = c.customer_id;
    
    -- Update the job status to 'processing'
    UPDATE ai_response_queue 
    SET status = 'processing',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = (
        SELECT job_id FROM get_next_ai_response_job() LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'get_next_ai_response_job function has been fixed!' as status;