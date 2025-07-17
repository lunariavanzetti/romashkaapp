// Test script to verify integration
import { enhancedRealtimeMessagingService } from './src/services/messaging/realTimeMessaging';

async function testIntegration() {
  console.log('🧪 Testing Real-Time Messaging Integration...');
  
  try {
    // Test 1: Create a conversation
    console.log('📝 Test 1: Creating conversation...');
    const conversation = await enhancedRealtimeMessagingService.createConversation(
      'test-integration@example.com',
      'website',
      'Testing the enhanced messaging system'
    );
    console.log('✅ Conversation created:', conversation.id);
    
    // Test 2: Send a message
    console.log('💬 Test 2: Sending message...');
    const response = await enhancedRealtimeMessagingService.sendMessage(
      'Hello, this is a test message!',
      conversation.id
    );
    console.log('✅ Message sent, AI response:', response);
    
    // Test 3: Get performance metrics
    console.log('📊 Test 3: Getting performance metrics...');
    const metrics = await enhancedRealtimeMessagingService.getPerformanceMetrics(60);
    console.log('✅ Performance metrics:', metrics);
    
    console.log('🎉 All tests passed! Integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testIntegration();
