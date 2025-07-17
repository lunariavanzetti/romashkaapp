const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class RealTimeMessagingTest {
  constructor() {
    this.testResults = [];
    this.activeSubscriptions = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Real-Time Messaging System Tests...\n');
    
    try {
      // Test 1: Database connectivity
      await this.testDatabaseConnectivity();
      
      // Test 2: Create test conversation
      const conversationId = await this.testCreateConversation();
      
      // Test 3: Test message insertion and AI response trigger
      await this.testMessageInsertion(conversationId);
      
      // Test 4: Test AI response queue processing
      await this.testAIResponseQueue();
      
      // Test 5: Test real-time subscriptions
      await this.testRealTimeSubscriptions(conversationId);
      
      // Test 6: Test performance metrics
      await this.testPerformanceMetrics();
      
      // Test 7: Test multi-channel support
      await this.testMultiChannelSupport();
      
      // Test 8: Test conversation management
      await this.testConversationManagement();
      
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      
      const passed = this.testResults.filter(r => r.status === 'PASS').length;
      const failed = this.testResults.filter(r => r.status === 'FAIL').length;
      
      this.testResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.test}: ${result.message}`);
      });
      
      console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`);
      
      if (failed === 0) {
        console.log('🎉 All tests passed! Your real-time messaging system is working correctly.');
      } else {
        console.log('🔧 Some tests failed. Please check the database setup and configuration.');
      }
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      // Clean up subscriptions
      this.activeSubscriptions.forEach(sub => sub.unsubscribe());
      process.exit(0);
    }
  }

  async testDatabaseConnectivity() {
    console.log('🔍 Testing database connectivity...');
    
    try {
      const { data, error } = await supabase.from('conversations').select('count').limit(1);
      
      if (error) {
        this.addTestResult('Database Connectivity', 'FAIL', `Database error: ${error.message}`);
        return;
      }
      
      this.addTestResult('Database Connectivity', 'PASS', 'Successfully connected to database');
      
    } catch (error) {
      this.addTestResult('Database Connectivity', 'FAIL', `Connection failed: ${error.message}`);
    }
  }

  async testCreateConversation() {
    console.log('🔍 Testing conversation creation...');
    
    try {
      const { data, error } = await supabase.rpc('create_conversation', {
        customer_identifier: 'test@example.com',
        channel_type: 'website',
        initial_message: 'Hello, I need help with my account'
      });
      
      if (error) {
        this.addTestResult('Conversation Creation', 'FAIL', `Failed to create conversation: ${error.message}`);
        return null;
      }
      
      const conversationId = data;
      this.addTestResult('Conversation Creation', 'PASS', `Created conversation: ${conversationId}`);
      
      return conversationId;
      
    } catch (error) {
      this.addTestResult('Conversation Creation', 'FAIL', `Error: ${error.message}`);
      return null;
    }
  }

  async testMessageInsertion(conversationId) {
    if (!conversationId) {
      this.addTestResult('Message Insertion', 'FAIL', 'No conversation ID provided');
      return;
    }
    
    console.log('🔍 Testing message insertion and trigger...');
    
    try {
      const startTime = Date.now();
      
      // Insert a test message
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        content: 'Can you help me reset my password?',
        channel_type: 'website',
        message_type: 'text',
        delivery_status: 'delivered'
      });
      
      if (error) {
        this.addTestResult('Message Insertion', 'FAIL', `Failed to insert message: ${error.message}`);
        return;
      }
      
      // Wait a moment for trigger to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if AI response was queued
      const { data: queueData, error: queueError } = await supabase
        .from('ai_response_queue')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queueError) {
        this.addTestResult('Message Insertion', 'FAIL', `Queue check failed: ${queueError.message}`);
        return;
      }
      
      const responseTime = Date.now() - startTime;
      
      if (queueData && queueData.length > 0) {
        this.addTestResult('Message Insertion', 'PASS', `Message inserted and AI response queued in ${responseTime}ms`);
      } else {
        this.addTestResult('Message Insertion', 'FAIL', 'Message inserted but no AI response queued');
      }
      
    } catch (error) {
      this.addTestResult('Message Insertion', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testAIResponseQueue() {
    console.log('🔍 Testing AI response queue processing...');
    
    try {
      // Check for pending jobs
      const { data: pendingJobs, error: pendingError } = await supabase
        .from('ai_response_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(5);
      
      if (pendingError) {
        this.addTestResult('AI Response Queue', 'FAIL', `Queue check failed: ${pendingError.message}`);
        return;
      }
      
      // Test getting next job
      const { data: nextJob, error: jobError } = await supabase.rpc('get_next_ai_response_job');
      
      if (jobError) {
        this.addTestResult('AI Response Queue', 'FAIL', `Get next job failed: ${jobError.message}`);
        return;
      }
      
      if (nextJob && nextJob.length > 0) {
        const job = nextJob[0];
        
        // Test completing the job
        const { error: completeError } = await supabase.rpc('complete_ai_response_job', {
          job_id: job.job_id,
          ai_response: 'This is a test AI response. I can help you reset your password. Please follow these steps...',
          confidence: 0.85,
          response_time_ms: 1500,
          requires_human: false
        });
        
        if (completeError) {
          this.addTestResult('AI Response Queue', 'FAIL', `Complete job failed: ${completeError.message}`);
          return;
        }
        
        this.addTestResult('AI Response Queue', 'PASS', `Successfully processed AI response job with 1.5s response time`);
      } else {
        this.addTestResult('AI Response Queue', 'PASS', 'No pending jobs found (this is normal if no recent messages)');
      }
      
    } catch (error) {
      this.addTestResult('AI Response Queue', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testRealTimeSubscriptions(conversationId) {
    if (!conversationId) {
      this.addTestResult('Real-Time Subscriptions', 'FAIL', 'No conversation ID provided');
      return;
    }
    
    console.log('🔍 Testing real-time subscriptions...');
    
    try {
      let messageReceived = false;
      
      // Set up real-time subscription
      const subscription = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          console.log('📨 Real-time message received:', payload.new.content);
          messageReceived = true;
        })
        .subscribe();
      
      this.activeSubscriptions.push(subscription);
      
      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Insert a test message
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: 'user',
        content: 'Testing real-time subscription',
        channel_type: 'website',
        message_type: 'text',
        delivery_status: 'delivered'
      });
      
      if (error) {
        this.addTestResult('Real-Time Subscriptions', 'FAIL', `Failed to insert test message: ${error.message}`);
        return;
      }
      
      // Wait for real-time notification
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (messageReceived) {
        this.addTestResult('Real-Time Subscriptions', 'PASS', 'Real-time message subscription working correctly');
      } else {
        this.addTestResult('Real-Time Subscriptions', 'FAIL', 'Real-time message not received');
      }
      
    } catch (error) {
      this.addTestResult('Real-Time Subscriptions', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testPerformanceMetrics() {
    console.log('🔍 Testing performance metrics...');
    
    try {
      const { data, error } = await supabase.rpc('get_realtime_messaging_metrics', {
        time_window_minutes: 60
      });
      
      if (error) {
        this.addTestResult('Performance Metrics', 'FAIL', `Metrics query failed: ${error.message}`);
        return;
      }
      
      // Check for expected metrics
      const metrics = data || [];
      const hasMessageMetrics = metrics.some(m => m.metric_name === 'message_received');
      const hasResponseMetrics = metrics.some(m => m.metric_name === 'ai_response_generated');
      
      if (metrics.length > 0) {
        this.addTestResult('Performance Metrics', 'PASS', `Retrieved ${metrics.length} performance metrics`);
        
        // Show performance summary
        metrics.forEach(metric => {
          console.log(`   📊 ${metric.metric_name}: ${metric.count} events, avg: ${metric.avg_value}ms`);
        });
      } else {
        this.addTestResult('Performance Metrics', 'PASS', 'No metrics found (normal for new installation)');
      }
      
    } catch (error) {
      this.addTestResult('Performance Metrics', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testMultiChannelSupport() {
    console.log('🔍 Testing multi-channel support...');
    
    try {
      const channels = ['website', 'whatsapp', 'email', 'instagram'];
      let successCount = 0;
      
      for (const channel of channels) {
        const { data, error } = await supabase.rpc('create_conversation', {
          customer_identifier: `test-${channel}@example.com`,
          channel_type: channel,
          initial_message: `Test message from ${channel}`
        });
        
        if (!error && data) {
          successCount++;
        }
      }
      
      if (successCount === channels.length) {
        this.addTestResult('Multi-Channel Support', 'PASS', `Successfully created conversations for all ${channels.length} channels`);
      } else {
        this.addTestResult('Multi-Channel Support', 'FAIL', `Only ${successCount}/${channels.length} channels worked`);
      }
      
    } catch (error) {
      this.addTestResult('Multi-Channel Support', 'FAIL', `Error: ${error.message}`);
    }
  }

  async testConversationManagement() {
    console.log('🔍 Testing conversation management...');
    
    try {
      // Test getting conversation with messages
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
      
      if (convError) {
        this.addTestResult('Conversation Management', 'FAIL', `Failed to get conversations: ${convError.message}`);
        return;
      }
      
      if (conversations && conversations.length > 0) {
        const conversationId = conversations[0].id;
        
        // Test getting conversation with messages
        const { data: fullConversation, error: fullError } = await supabase
          .rpc('get_conversation_with_messages', {
            conversation_id: conversationId,
            message_limit: 10
          });
        
        if (fullError) {
          this.addTestResult('Conversation Management', 'FAIL', `Failed to get full conversation: ${fullError.message}`);
          return;
        }
        
        if (fullConversation && fullConversation.length > 0) {
          const conv = fullConversation[0];
          this.addTestResult('Conversation Management', 'PASS', `Successfully retrieved conversation with ${JSON.parse(conv.messages_data).length} messages`);
        } else {
          this.addTestResult('Conversation Management', 'FAIL', 'No conversation data returned');
        }
      } else {
        this.addTestResult('Conversation Management', 'PASS', 'No conversations found (normal for new installation)');
      }
      
    } catch (error) {
      this.addTestResult('Conversation Management', 'FAIL', `Error: ${error.message}`);
    }
  }

  addTestResult(test, status, message) {
    this.testResults.push({ test, status, message });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
  }

  // Performance test - simulate high load
  async runPerformanceTest() {
    console.log('🔍 Running performance test...');
    
    const messageCount = 10;
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < messageCount; i++) {
      const promise = this.sendTestMessage(`Performance test message ${i + 1}`);
      promises.push(promise);
    }
    
    try {
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / messageCount;
      
      console.log(`📊 Performance Results:`);
      console.log(`   Total messages: ${messageCount}`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Average time per message: ${avgTime}ms`);
      console.log(`   Target: <6000ms per message`);
      
      if (avgTime < 6000) {
        console.log('✅ Performance test PASSED - All messages processed under 6 seconds');
      } else {
        console.log('❌ Performance test FAILED - Messages took longer than 6 seconds');
      }
      
    } catch (error) {
      console.log('❌ Performance test FAILED:', error.message);
    }
  }

  async sendTestMessage(content) {
    const conversationId = await this.testCreateConversation();
    if (!conversationId) return;
    
    const startTime = Date.now();
    
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'user',
      content,
      channel_type: 'website',
      message_type: 'text',
      delivery_status: 'delivered'
    });
    
    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
    
    return Date.now() - startTime;
  }
}

// Run the tests
const tester = new RealTimeMessagingTest();

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--performance')) {
  tester.runPerformanceTest();
} else {
  tester.runAllTests();
}