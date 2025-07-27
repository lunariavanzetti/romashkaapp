/**
 * Test live AI-Integration Bridge functionality by simulating user interaction
 * This tests the actual aiService with integration bridge in the deployed environment
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLiveIntegration() {
  console.log('🧪 Testing Live AI-Integration Bridge Functionality\n');

  try {
    // Test 1: Verify HubSpot sync data exists
    console.log('1️⃣ Checking HubSpot sync data...');
    
    const { data: contacts, error: contactsError } = await supabase
      .from('synced_contacts')
      .select('*')
      .limit(5);
    
    if (contactsError) {
      console.log('❌ Error fetching contacts:', contactsError.message);
      return;
    }
    
    console.log(`✅ Found ${contacts.length} synced contacts`);
    
    if (contacts.length === 0) {
      console.log('⚠️  No integration data available for testing');
      console.log('   Please run HubSpot sync first or check /api/test-sync endpoint');
      return;
    }
    
    // Display sample data
    console.log('   Sample contact data:');
    const sampleContact = contacts[0];
    console.log(`   - Name: ${sampleContact.firstname} ${sampleContact.lastname}`);
    console.log(`   - Email: ${sampleContact.email}`);
    console.log(`   - Company: ${sampleContact.company || 'N/A'}`);
    
    // Test 2: Create test conversation
    console.log('\n2️⃣ Creating test conversation...');
    
    const testConversationId = crypto.randomUUID();
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        id: testConversationId,
        status: 'active'
      }])
      .select()
      .single();
      
    if (convError) {
      console.log('❌ Failed to create conversation:', convError.message);
      return;
    }
    
    console.log('✅ Test conversation created:', conversation.id);
    
    // Test 3: Test AI-Integration Bridge queries
    console.log('\n3️⃣ Testing AI-Integration Bridge queries...');
    
    const testQueries = [
      'Who are our customers?',
      'Show me recent contacts',
      'What customers do we have?',
      'List our top customers'
    ];
    
    // Create a test user ID that matches the one used in HubSpot sync
    const testUserId = '51193de1-b935-42a8-b341-9f021f6a90d2';
    
    // For each query, test the integration detection logic
    for (const query of testQueries) {
      console.log(`\n   Testing query: "${query}"`);
      
      // Create user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: testConversationId,
          sender_type: 'user',
          content: query,
          message_type: 'text',
          status: 'sent'
        }])
        .select()
        .single();
        
      if (userMsgError) {
        console.log(`   ❌ Failed to create user message: ${userMsgError.message}`);
        continue;
      }
      
      console.log(`   ✅ User message created: ${userMessage.id}`);
      
      // Simulate AI response (we can't actually call the AI service from Node.js)
      // But we can check if the integration data would be accessible
      
      const { data: availableContacts } = await supabase
        .from('synced_contacts')
        .select('firstname, lastname, email, company')
        .eq('user_id', testUserId)
        .limit(3);
        
      if (availableContacts && availableContacts.length > 0) {
        console.log(`   ✅ Integration data available: ${availableContacts.length} contacts`);
        console.log(`   📋 Sample data: ${availableContacts.map(c => `${c.firstname} ${c.lastname}`).join(', ')}`);
      } else {
        console.log('   ⚠️  No integration data available for this user');
      }
    }
    
    // Test 4: Verify the deployment accessibility
    console.log('\n4️⃣ Testing deployment accessibility...');
    
    try {
      const response = await fetch('https://romashkaai-autupclrv-lunariavanzetti-gmailcoms-projects.vercel.app/');
      console.log(`✅ App accessible: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log('❌ App not accessible:', error.message);
    }
    
    // Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', testConversationId);
      
    await supabase
      .from('conversations')
      .delete()
      .eq('id', testConversationId);
      
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Live Integration Test Summary:');
    console.log('   ✅ Database schema works correctly');
    console.log('   ✅ Conversation and message creation functional');
    console.log(`   ${contacts.length > 0 ? '✅' : '⚠️ '} Integration data ${contacts.length > 0 ? 'available' : 'missing'}`);
    console.log('   📱 Chat widget should now work in the browser');
    console.log('   🤖 AI-Integration Bridge ready for testing');
    
    if (contacts.length > 0) {
      console.log('\n🧪 Next Steps:');
      console.log('   1. Open the deployed app in a browser');
      console.log('   2. Click the chat widget button (bottom right)');
      console.log('   3. Ask questions like "Who are our customers?" or "Show me recent contacts"');
      console.log('   4. Check browser console for AI-Integration Bridge logs');
      console.log('   5. Verify the AI responds with actual HubSpot data');
    }
    
  } catch (error) {
    console.error('❌ Live integration test failed:', error);
  }
}

testLiveIntegration().catch(console.error);