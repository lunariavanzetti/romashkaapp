/**
 * Test script to verify chat widget and AI-Integration Bridge functionality
 * This tests the core functionality without needing the browser
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChatFunctionality() {
  console.log('🧪 Starting Chat Widget & AI-Integration Bridge Tests\n');

  try {
    // Test 1: Check database tables exist
    console.log('1️⃣ Testing database schema...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('count(*)')
      .limit(1);
    
    if (convError) {
      console.log('❌ Conversations table error:', convError.message);
    } else {
      console.log('✅ Conversations table accessible');
    }

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('count(*)')
      .limit(1);
      
    if (msgError) {
      console.log('❌ Messages table error:', msgError.message);
    } else {
      console.log('✅ Messages table accessible');
    }

    // Test 2: Check synced integration data
    console.log('\n2️⃣ Testing integration data availability...');
    
    const { data: contacts, error: contactsError } = await supabase
      .from('synced_contacts')
      .select('*')
      .limit(5);
    
    if (contactsError) {
      console.log('❌ Synced contacts error:', contactsError.message);
    } else {
      console.log(`✅ Found ${contacts.length} synced contacts`);
      if (contacts.length > 0) {
        console.log('   Sample contact:', contacts[0].name || contacts[0].firstname);
      }
    }

    const { data: deals, error: dealsError } = await supabase
      .from('synced_deals')
      .select('*')
      .limit(5);
      
    if (dealsError) {
      console.log('❌ Synced deals error:', dealsError.message);
    } else {
      console.log(`✅ Found ${deals.length} synced deals`);
      if (deals.length > 0) {
        console.log('   Sample deal:', deals[0].dealname || deals[0].name);
      }
    }

    // Test 3: Create a test conversation
    console.log('\n3️⃣ Testing conversation creation...');
    
    const testConversationId = crypto.randomUUID();
    
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert([{
        id: testConversationId,
        status: 'active'
        // Note: only id and status columns available in current schema
      }])
      .select()
      .single();
      
    if (createError) {
      console.log('❌ Conversation creation error:', createError.message);
    } else {
      console.log('✅ Test conversation created:', newConv.id);
    }

    // Test 4: Create a test message
    console.log('\n4️⃣ Testing message creation...');
    
    const { data: newMsg, error: msgCreateError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: testConversationId,
        sender_type: 'user',
        content: 'Test message for AI-Integration Bridge',
        message_type: 'text',
        status: 'sent'
        // Note: metadata not available in current schema
      }])
      .select()
      .single();
      
    if (msgCreateError) {
      console.log('❌ Message creation error:', msgCreateError.message);
    } else {
      console.log('✅ Test message created:', newMsg.id);
    }

    // Test 5: Test AI-Integration Bridge query detection
    console.log('\n5️⃣ Testing AI-Integration Bridge...');
    
    try {
      // Import the AI service (this should work in Node.js)
      const { AIService } = await import('./src/services/aiService.js');
      console.log('✅ AI Service imported successfully');
      
      // Create a mock user object
      const mockUser = {
        id: '51193de1-b935-42a8-b341-9f021f6a90d2' // The actual user ID from previous tests
      };
      
      const aiService = new AIService();
      const testQueries = [
        'Who are our top customers?',
        'What deals are in progress?',
        'Show me recent contacts',
        'What is our return policy?' // Non-integration query
      ];
      
      for (const query of testQueries) {
        console.log(`   Testing: "${query}"`);
        try {
          const response = await aiService.generateResponse(query, [], 'en', mockUser);
          console.log(`   ✅ Response: ${response ? response.substring(0, 100) + '...' : 'No response'}`);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
      
    } catch (importError) {
      console.log('❌ Could not import AI Service:', importError.message);
      console.log('   This is expected in Node.js due to browser-specific imports');
    }

    // Cleanup
    console.log('\n6️⃣ Cleaning up test data...');
    
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', testConversationId);
      
    await supabase
      .from('conversations')
      .delete()
      .eq('id', testConversationId);
      
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Chat Widget & AI-Integration Bridge Tests Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testChatFunctionality().catch(console.error);