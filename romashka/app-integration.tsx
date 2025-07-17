// Add this to your src/App.tsx file

import { useEffect } from 'react';
import { aiResponseProcessor } from './services/ai/aiResponseProcessor';

// Add this inside your main App component
useEffect(() => {
  // Start AI response processor
  aiResponseProcessor.start();
  
  // Cleanup on unmount
  return () => {
    aiResponseProcessor.stop();
  };
}, []);

// Add this to monitor processor status (optional)
useEffect(() => {
  const interval = setInterval(() => {
    const status = aiResponseProcessor.getStatus();
    console.log('AI Processor Status:', status);
  }, 10000); // Check every 10 seconds

  return () => clearInterval(interval);
}, []);
