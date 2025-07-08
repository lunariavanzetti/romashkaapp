-- ROMASHKA Database Functions & Triggers
-- Custom functions and triggers for data consistency and automation

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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, company_name, website_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'companyName',
    NEW.raw_user_meta_data->>'websiteUrl',
    NEW.email
  );
  
  -- Create default agent availability record
  INSERT INTO agent_availability (agent_id, is_online, status)
  VALUES (NEW.id, false, 'offline');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate UUID v4
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to get current timestamp
CREATE OR REPLACE FUNCTION get_current_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to validate phone format
CREATE OR REPLACE FUNCTION validate_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN phone ~* '^[+]?[0-9\s\-\(\)]+$';
END;
$$ LANGUAGE plpgsql;

-- Function to sanitize input
CREATE OR REPLACE FUNCTION sanitize_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(REGEXP_REPLACE(input_text, '[<>\"''\0\n\r\t]', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CONVERSATION MANAGEMENT FUNCTIONS
-- ================================

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    message_count = (
      SELECT COUNT(*) 
      FROM messages 
      WHERE conversation_id = NEW.conversation_id
    ),
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign conversations to agents
CREATE OR REPLACE FUNCTION auto_assign_conversation()
RETURNS TRIGGER AS $$
DECLARE
  agent_id UUID;
  assignment_algorithm TEXT;
BEGIN
  -- Get assignment algorithm from settings
  SELECT setting_value::TEXT INTO assignment_algorithm
  FROM system_settings 
  WHERE setting_key = 'auto_assignment_algorithm';
  
  -- Only auto-assign if enabled and no agent is already assigned
  IF NEW.assigned_agent_id IS NULL THEN
    -- Round robin assignment
    IF assignment_algorithm = 'round_robin' THEN
      SELECT p.id INTO agent_id
      FROM profiles p
      JOIN agent_availability aa ON p.id = aa.agent_id
      WHERE p.role = 'agent' 
      AND aa.is_online = true 
      AND aa.status = 'available'
      AND aa.current_chat_count < aa.max_concurrent_chats
      ORDER BY aa.last_activity ASC
      LIMIT 1;
    
    -- Least loaded assignment
    ELSIF assignment_algorithm = 'least_loaded' THEN
      SELECT p.id INTO agent_id
      FROM profiles p
      JOIN agent_availability aa ON p.id = aa.agent_id
      WHERE p.role = 'agent' 
      AND aa.is_online = true 
      AND aa.status = 'available'
      AND aa.current_chat_count < aa.max_concurrent_chats
      ORDER BY aa.current_chat_count ASC, aa.last_activity ASC
      LIMIT 1;
    END IF;
    
    -- Update conversation with assigned agent
    IF agent_id IS NOT NULL THEN
      NEW.assigned_agent_id = agent_id;
      
      -- Update agent's current chat count
      UPDATE agent_availability 
      SET current_chat_count = current_chat_count + 1
      WHERE agent_id = agent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update agent current chat count
CREATE OR REPLACE FUNCTION update_agent_chat_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the agent's current chat count
  UPDATE agent_availability 
  SET current_chat_count = (
    SELECT COUNT(*) 
    FROM conversations 
    WHERE assigned_agent_id = COALESCE(NEW.assigned_agent_id, OLD.assigned_agent_id)
    AND status = 'active'
  )
  WHERE agent_id = COALESCE(NEW.assigned_agent_id, OLD.assigned_agent_id);
  
  -- If this is an assignment change, update both agents
  IF (TG_OP = 'UPDATE' AND OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id) THEN
    -- Update old agent's count
    IF OLD.assigned_agent_id IS NOT NULL THEN
      UPDATE agent_availability 
      SET current_chat_count = (
        SELECT COUNT(*) 
        FROM conversations 
        WHERE assigned_agent_id = OLD.assigned_agent_id
        AND status = 'active'
      )
      WHERE agent_id = OLD.assigned_agent_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-close inactive conversations
CREATE OR REPLACE FUNCTION auto_close_inactive_conversations()
RETURNS VOID AS $$
DECLARE
  close_timeout INTEGER;
BEGIN
  -- Get timeout setting
  SELECT setting_value::INTEGER INTO close_timeout
  FROM system_settings 
  WHERE setting_key = 'conversation_auto_close_time';
  
  -- Close conversations that have been inactive
  UPDATE conversations 
  SET 
    status = 'closed',
    resolved_at = NOW()
  WHERE status = 'active' 
  AND last_message_at < NOW() - INTERVAL '1 second' * close_timeout;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- AGENT MANAGEMENT FUNCTIONS
-- ================================

-- Function to update agent activity
CREATE OR REPLACE FUNCTION update_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update agent's last activity when they send a message
  IF NEW.sender_type = 'agent' AND NEW.sender_id IS NOT NULL THEN
    UPDATE agent_availability 
    SET last_activity = NOW()
    WHERE agent_id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set agent status based on activity
CREATE OR REPLACE FUNCTION auto_update_agent_status()
RETURNS VOID AS $$
DECLARE
  away_timeout INTEGER;
BEGIN
  -- Get away timeout setting
  SELECT setting_value::INTEGER INTO away_timeout
  FROM system_settings 
  WHERE setting_key = 'agent_auto_away_time';
  
  -- Set agents to away if they've been inactive
  UPDATE agent_availability 
  SET status = 'away'
  WHERE is_online = true 
  AND status = 'available'
  AND last_activity < NOW() - INTERVAL '1 second' * away_timeout;
END;
$$ LANGUAGE plpgsql;

-- Function to update canned response usage count
CREATE OR REPLACE FUNCTION update_canned_response_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the message content matches any canned response shortcut
  UPDATE canned_responses 
  SET usage_count = usage_count + 1
  WHERE shortcut IS NOT NULL 
  AND NEW.content LIKE '%' || shortcut || '%';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- KNOWLEDGE MANAGEMENT FUNCTIONS
-- ================================

-- Function to update knowledge item effectiveness
CREATE OR REPLACE FUNCTION update_knowledge_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE knowledge_items 
  SET 
    effectiveness_score = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0.5
        ELSE (COUNT(*) FILTER (WHERE was_helpful = true)::DECIMAL / COUNT(*))
      END
      FROM knowledge_analytics 
      WHERE knowledge_item_id = NEW.knowledge_item_id
    ),
    usage_count = (
      SELECT COUNT(*) 
      FROM knowledge_analytics 
      WHERE knowledge_item_id = NEW.knowledge_item_id
    )
  WHERE id = NEW.knowledge_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create knowledge version on update
CREATE OR REPLACE FUNCTION create_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content changed
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
      'Updated content',
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
  search_query TEXT,
  search_language VARCHAR(10) DEFAULT 'en',
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category VARCHAR(255),
  confidence_score DECIMAL,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ki.id,
    ki.title,
    ki.content,
    kc.name as category,
    ki.confidence_score,
    similarity(ki.content, search_query) as similarity
  FROM knowledge_items ki
  LEFT JOIN knowledge_categories kc ON ki.category_id = kc.id
  WHERE ki.status = 'active'
  AND ki.language = search_language
  AND (
    ki.content ILIKE '%' || search_query || '%'
    OR ki.title ILIKE '%' || search_query || '%'
    OR similarity(ki.content, search_query) > 0.3
  )
  ORDER BY similarity DESC, ki.effectiveness_score DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- ANALYTICS FUNCTIONS
-- ================================

-- Function to create conversation analytics on new conversation
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
CREATE OR REPLACE FUNCTION update_conversation_analytics_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_analytics 
  SET 
    total_messages = total_messages + 1,
    customer_messages = customer_messages + CASE WHEN NEW.sender_type = 'user' THEN 1 ELSE 0 END,
    ai_messages = ai_messages + CASE WHEN NEW.sender_type = 'ai' THEN 1 ELSE 0 END,
    agent_messages = agent_messages + CASE WHEN NEW.sender_type = 'agent' THEN 1 ELSE 0 END,
    first_response_at = CASE 
      WHEN first_response_at IS NULL AND NEW.sender_type IN ('ai', 'agent') THEN NEW.created_at
      ELSE first_response_at
    END,
    updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update analytics on conversation resolution
CREATE OR REPLACE FUNCTION update_conversation_analytics_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to resolved
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    UPDATE conversation_analytics 
    SET 
      resolved_at = NEW.resolved_at,
      total_duration_seconds = EXTRACT(EPOCH FROM (NEW.resolved_at - started_at))::INTEGER,
      resolved_by = CASE 
        WHEN NEW.assigned_agent_id IS NOT NULL THEN 'agent'
        WHEN ai_messages > 0 THEN 'ai'
        ELSE 'abandoned'
      END,
      customer_satisfaction = NEW.satisfaction_score,
      updated_at = NOW()
    WHERE conversation_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_metrics (
    date,
    channel_type,
    department,
    agent_id,
    total_conversations,
    ai_resolved_conversations,
    human_resolved_conversations,
    abandoned_conversations,
    avg_first_response_time_seconds,
    avg_resolution_time_seconds,
    total_ratings,
    avg_satisfaction_score,
    ai_confidence_avg,
    handoff_rate
  )
  SELECT 
    target_date,
    c.channel_type,
    c.department,
    c.assigned_agent_id,
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'ai') as ai_resolved_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'agent') as human_resolved_conversations,
    COUNT(*) FILTER (WHERE ca.resolved_by = 'abandoned') as abandoned_conversations,
    AVG(EXTRACT(EPOCH FROM (ca.first_response_at - ca.started_at)))::INTEGER as avg_first_response_time_seconds,
    AVG(ca.total_duration_seconds) as avg_resolution_time_seconds,
    COUNT(*) FILTER (WHERE c.satisfaction_score IS NOT NULL) as total_ratings,
    AVG(c.satisfaction_score) as avg_satisfaction_score,
    AVG(c.ai_confidence) as ai_confidence_avg,
    (COUNT(*) FILTER (WHERE ca.handoff_count > 0)::DECIMAL / COUNT(*)) as handoff_rate
  FROM conversations c
  LEFT JOIN conversation_analytics ca ON c.id = ca.conversation_id
  WHERE DATE(c.created_at) = target_date
  GROUP BY c.channel_type, c.department, c.assigned_agent_id
  ON CONFLICT (date, channel_type, department, agent_id) 
  DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    ai_resolved_conversations = EXCLUDED.ai_resolved_conversations,
    human_resolved_conversations = EXCLUDED.human_resolved_conversations,
    abandoned_conversations = EXCLUDED.abandoned_conversations,
    avg_first_response_time_seconds = EXCLUDED.avg_first_response_time_seconds,
    avg_resolution_time_seconds = EXCLUDED.avg_resolution_time_seconds,
    total_ratings = EXCLUDED.total_ratings,
    avg_satisfaction_score = EXCLUDED.avg_satisfaction_score,
    ai_confidence_avg = EXCLUDED.ai_confidence_avg,
    handoff_rate = EXCLUDED.handoff_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired realtime metrics
CREATE OR REPLACE FUNCTION cleanup_expired_realtime_metrics()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM realtime_metrics 
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CHANNEL & INTEGRATION FUNCTIONS
-- ================================

-- Function to create message delivery tracking
CREATE OR REPLACE FUNCTION create_message_delivery_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create tracking for non-website channels
  IF NEW.channel_type != 'website' THEN
    INSERT INTO message_delivery_tracking (
      message_id,
      channel_type,
      delivery_status
    ) VALUES (
      NEW.id,
      NEW.channel_type,
      'sent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily message limits
CREATE OR REPLACE FUNCTION reset_daily_message_limits()
RETURNS VOID AS $$
BEGIN
  UPDATE communication_channels 
  SET 
    messages_sent_today = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the message metadata contains template information
  IF NEW.metadata ? 'template_id' THEN
    UPDATE message_templates 
    SET usage_count = usage_count + 1
    WHERE id = (NEW.metadata->>'template_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle webhook event processing
CREATE OR REPLACE FUNCTION process_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment processing attempts
  UPDATE webhook_events 
  SET processing_attempts = processing_attempts + 1
  WHERE id = NEW.id;
  
  -- Log the processing attempt
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    'webhook_processing',
    'webhook_events',
    NEW.id,
    jsonb_build_object(
      'event_type', NEW.event_type,
      'source', NEW.source,
      'attempt', NEW.processing_attempts + 1
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- WORKFLOW FUNCTIONS
-- ================================

-- Function to update workflow statistics
CREATE OR REPLACE FUNCTION update_workflow_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE workflows 
    SET 
      execution_count = execution_count + 1,
      success_count = success_count + 1
    WHERE id = NEW.workflow_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE workflows 
    SET 
      execution_count = execution_count + 1,
      failure_count = failure_count + 1
    WHERE id = NEW.workflow_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to execute workflow
CREATE OR REPLACE FUNCTION execute_workflow(
  workflow_id UUID,
  conversation_id UUID,
  context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  execution_id UUID;
BEGIN
  -- Create workflow execution record
  INSERT INTO workflow_executions (
    workflow_id,
    conversation_id,
    context,
    status
  ) VALUES (
    workflow_id,
    conversation_id,
    context,
    'running'
  ) RETURNING id INTO execution_id;
  
  -- Log workflow execution start
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    'workflow_execution_started',
    'workflow_executions',
    execution_id,
    jsonb_build_object(
      'workflow_id', workflow_id,
      'conversation_id', conversation_id,
      'context', context
    )
  );
  
  RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- UTILITY & WIDGET FUNCTIONS
-- ================================

-- Function to generate widget embed code
CREATE OR REPLACE FUNCTION generate_widget_embed_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.embed_code = format(
    '<script>
      (function(r,o,m,a,s,h,k,a_) {
        r.RomashkaWidget = r.RomashkaWidget || {};
        r.RomashkaWidget.config = %s;
        a = o.createElement(m);
        s = o.getElementsByTagName(m)[0];
        a.async = 1;
        a.src = "https://widget.romashka.com/embed.js";
        s.parentNode.insertBefore(a, s);
      })(window, document, "script");
    </script>',
    NEW.configuration::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update scan job progress
CREATE OR REPLACE FUNCTION update_scan_job_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE website_scan_jobs 
  SET 
    pages_processed = (
      SELECT COUNT(*) 
      FROM extracted_content 
      WHERE scan_job_id = NEW.scan_job_id
    ),
    progress_percentage = CASE 
      WHEN pages_found > 0 THEN 
        (SELECT COUNT(*) * 100 / pages_found FROM extracted_content WHERE scan_job_id = NEW.scan_job_id)
      ELSE 0
    END
  WHERE id = NEW.scan_job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SLA MANAGEMENT FUNCTIONS
-- ================================

-- Function to create SLA tracking for new conversations
CREATE OR REPLACE FUNCTION create_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
  first_response_sla INTEGER;
  resolution_sla INTEGER;
BEGIN
  -- Get SLA settings
  SELECT setting_value::INTEGER INTO first_response_sla
  FROM system_settings 
  WHERE setting_key = 'sla_first_response_seconds';
  
  SELECT setting_value::INTEGER INTO resolution_sla
  FROM system_settings 
  WHERE setting_key = 'sla_resolution_seconds';
  
  -- Create SLA tracking records
  INSERT INTO sla_tracking (conversation_id, sla_type, target_time_seconds) VALUES
  (NEW.id, 'first_response', first_response_sla),
  (NEW.id, 'resolution', resolution_sla);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update SLA tracking
CREATE OR REPLACE FUNCTION update_sla_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update first response SLA
  IF NEW.sender_type IN ('ai', 'agent') THEN
    UPDATE sla_tracking 
    SET 
      actual_time_seconds = EXTRACT(EPOCH FROM (NEW.created_at - (
        SELECT created_at FROM conversations WHERE id = NEW.conversation_id
      )))::INTEGER,
      status = CASE 
        WHEN EXTRACT(EPOCH FROM (NEW.created_at - (
          SELECT created_at FROM conversations WHERE id = NEW.conversation_id
        ))) <= target_time_seconds THEN 'met'
        ELSE 'breached'
      END,
      completed_at = NEW.created_at
    WHERE conversation_id = NEW.conversation_id 
    AND sla_type = 'first_response'
    AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- SCHEDULED JOBS FUNCTIONS
-- ================================

-- Function to run scheduled maintenance tasks
CREATE OR REPLACE FUNCTION run_scheduled_maintenance()
RETURNS VOID AS $$
BEGIN
  -- Auto-close inactive conversations
  PERFORM auto_close_inactive_conversations();
  
  -- Update agent statuses
  PERFORM auto_update_agent_status();
  
  -- Reset daily message limits
  PERFORM reset_daily_message_limits();
  
  -- Aggregate daily metrics for yesterday
  PERFORM aggregate_daily_metrics(CURRENT_DATE - INTERVAL '1 day');
  
  -- Cleanup expired realtime metrics
  DELETE FROM realtime_metrics WHERE expires_at < NOW();
  
  -- Update system status
  UPDATE system_settings 
  SET 
    setting_value = to_jsonb(NOW()::TEXT),
    updated_at = NOW()
  WHERE setting_key = 'last_maintenance_date';
END;
$$ LANGUAGE plpgsql;

-- Function to get system health
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSONB AS $$
DECLARE
  health_data JSONB;
BEGIN
  health_data = jsonb_build_object(
    'timestamp', NOW(),
    'status', 'healthy',
    'database', jsonb_build_object(
      'connected', true,
      'version', version()
    ),
    'tables', jsonb_build_object(
      'conversations', (SELECT COUNT(*) FROM conversations),
      'messages', (SELECT COUNT(*) FROM messages),
      'profiles', (SELECT COUNT(*) FROM profiles),
      'knowledge_items', (SELECT COUNT(*) FROM knowledge_items)
    ),
    'performance', jsonb_build_object(
      'avg_response_time', (
        SELECT AVG(processing_time_ms) 
        FROM messages 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      ),
      'active_conversations', (
        SELECT COUNT(*) 
        FROM conversations 
        WHERE status = 'active'
      ),
      'online_agents', (
        SELECT COUNT(*) 
        FROM agent_availability 
        WHERE is_online = true
      )
    )
  );
  
  RETURN health_data;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- CLEANUP FUNCTIONS
-- ================================

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
DECLARE
  conversation_retention INTEGER;
  audit_retention INTEGER;
  backup_retention INTEGER;
BEGIN
  -- Get retention settings
  SELECT setting_value::INTEGER INTO conversation_retention
  FROM system_settings 
  WHERE setting_key = 'conversation_history_retention';
  
  SELECT setting_value::INTEGER INTO audit_retention
  FROM system_settings 
  WHERE setting_key = 'audit_log_retention_days';
  
  SELECT setting_value::INTEGER INTO backup_retention
  FROM system_settings 
  WHERE setting_key = 'backup_retention_days';
  
  -- Cleanup old conversations
  DELETE FROM conversations 
  WHERE created_at < NOW() - INTERVAL '1 day' * conversation_retention;
  
  -- Cleanup old audit logs
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * audit_retention;
  
  -- Cleanup old webhook events
  DELETE FROM webhook_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Cleanup old export jobs
  DELETE FROM export_jobs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Cleanup old realtime metrics
  DELETE FROM realtime_metrics 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to backup critical data
CREATE OR REPLACE FUNCTION backup_critical_data()
RETURNS JSONB AS $$
DECLARE
  backup_data JSONB;
BEGIN
  backup_data = jsonb_build_object(
    'timestamp', NOW(),
    'version', '1.0.0',
    'system_settings', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'key', setting_key,
          'value', setting_value,
          'description', description
        )
      ) FROM system_settings
    ),
    'statistics', jsonb_build_object(
      'total_conversations', (SELECT COUNT(*) FROM conversations),
      'total_messages', (SELECT COUNT(*) FROM messages),
      'total_users', (SELECT COUNT(*) FROM profiles),
      'total_knowledge_items', (SELECT COUNT(*) FROM knowledge_items),
      'backup_date', NOW()
    )
  );
  
  RETURN backup_data;
END;
$$ LANGUAGE plpgsql;

-- Database functions setup complete
SELECT 'ROMASHKA Database Functions Setup Complete!' as status;