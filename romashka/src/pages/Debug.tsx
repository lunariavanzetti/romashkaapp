import React from 'react';
import { useAuthStore } from '../stores/authStore';

export default function Debug() {
  const { user, loading, error } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Authentication State:</h2>
          <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          <p><strong>Error:</strong> {error || 'none'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'undefined'}</p>
          <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'undefined'}</p>
          <p><strong>NODE_ENV:</strong> {import.meta.env.NODE_ENV || 'undefined'}</p>
          <p><strong>MODE:</strong> {import.meta.env.MODE || 'undefined'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Current URL:</h2>
          <p>{window.location.href}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Local Storage:</h2>
          <pre className="text-xs overflow-auto">
            {Object.keys(localStorage).map(key => 
              `${key}: ${localStorage.getItem(key)}\n`
            ).join('')}
          </pre>
        </div>
      </div>
    </div>
  );
}