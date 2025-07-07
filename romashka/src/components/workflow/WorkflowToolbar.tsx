import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui';

interface WorkflowToolbarProps {
  onSave: () => Promise<void>;
  isLoading: boolean;
  workflowName: string;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onSave,
  isLoading,
  workflowName
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    {
      name: 'Lead Capture',
      description: 'Collect visitor information and qualify leads',
      category: 'Sales'
    },
    {
      name: 'Customer Support',
      description: 'Handle common support questions',
      category: 'Support'
    },
    {
      name: 'Product Recommendations',
      description: 'Suggest products based on customer needs',
      category: 'E-commerce'
    }
  ];

  return (
    <div className="h-16 bg-glassDark/80 backdrop-blur-glass border-b border-white/20 flex items-center justify-between px-6">
      {/* Left side - Workflow name and status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white/60 text-sm">Active</span>
        </div>
        
        <div className="h-6 w-px bg-white/20"></div>
        
        <h1 className="text-xl font-bold text-white">{workflowName}</h1>
      </div>

      {/* Center - Action buttons */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Templates
        </Button>

        <Button
          variant="ghost"
          className="px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Test
        </Button>

        <Button
          variant="ghost"
          className="px-4 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Deploy
        </Button>
      </div>

      {/* Right side - Save button */}
      <div className="flex items-center space-x-3">
        <Button
          variant="primary"
          onClick={onSave}
          loading={isLoading}
          className="px-6 py-2"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Templates dropdown */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-glassDark/95 backdrop-blur-glass rounded-xl border border-white/20 shadow-xl p-4 min-w-80">
              <h3 className="text-lg font-semibold text-white mb-3">Workflow Templates</h3>
              <div className="space-y-2">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.name}
                    className="p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">{template.name}</h4>
                        <p className="text-white/60 text-sm">{template.description}</p>
                      </div>
                      <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 