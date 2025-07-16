import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabaseClient';

interface DebugInfo {
  authUser: any;
  profile: any;
  error: any;
  timestamp: string;
}

export default function DebugOnboarding() {
  const { user } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEverything = async () => {
      try {
        console.log('🔍 Debug: Checking everything...');
        
        // Get current auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        console.log('Auth user:', authUser);
        
        // Get profile
        const { data: profile, error: profileError } = authUser ? await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single() : { data: null, error: 'No auth user' };
        
        console.log('Profile:', profile);
        
        setDebugInfo({
          authUser,
          profile,
          error: authError || profileError,
          timestamp: new Date().toISOString()
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({
          authUser: null,
          profile: null,
          error: error,
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }
    };

    checkEverything();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔍 Debug Onboarding</h1>
          <p>Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug Onboarding</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Time</h2>
          <p className="font-mono text-sm">{debugInfo?.timestamp}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Store User</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Auth User</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo?.authUser, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo?.profile, null, 2)}
          </pre>
        </div>

        {debugInfo?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Error</h2>
            <pre className="bg-red-100 p-4 rounded text-sm overflow-auto text-red-700">
              {JSON.stringify(debugInfo.error, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Analysis</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Auth User Exists:</strong> {debugInfo?.authUser ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Profile Exists:</strong> {debugInfo?.profile ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Onboarding Completed:</strong> {debugInfo?.profile?.onboarding_completed ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID Match:</strong> {debugInfo?.authUser?.id === debugInfo?.profile?.id ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}