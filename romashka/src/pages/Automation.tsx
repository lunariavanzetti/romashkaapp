import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '../components/ui';
import { WorkflowCanvas } from '../components/workflow/WorkflowCanvas';
import { NodePalette } from '../components/workflow/NodePalette';
import { NodePropertiesPanel } from '../components/workflow/NodePropertiesPanel';
import { WorkflowToolbar } from '../components/workflow/WorkflowToolbar';
import { useWorkflowStore } from '../stores/workflowStore';
import type { WorkflowNode } from '../types/workflow';

export default function Automation() {
  const { 
    selectedNode, 
    setSelectedNode, 
    saveWorkflow, 
    isLoading, 
    currentWorkflow 
  } = useWorkflowStore();

  const handleNodeSelect = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Toolbar */}
        <WorkflowToolbar 
          onSave={saveWorkflow}
          isLoading={isLoading}
          workflowName={currentWorkflow?.name || 'Untitled Workflow'}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Node Palette */}
          <motion.div
            className="w-80 bg-glassDark/80 backdrop-blur-glass border-r border-white/20"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <NodePalette />
          </motion.div>

          {/* Center Canvas */}
          <div className="flex-1 relative">
            <WorkflowCanvas onNodeSelect={handleNodeSelect} />
          </div>

          {/* Right Sidebar - Properties Panel */}
          <motion.div
            className="w-80 bg-glassDark/80 backdrop-blur-glass border-l border-white/20"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <NodePropertiesPanel 
              selectedNode={selectedNode}
              onNodeUpdate={setSelectedNode}
            />
          </motion.div>
        </div>

        {/* Status Bar */}
        <div className="h-12 bg-glassDark/60 backdrop-blur-glass border-t border-white/20 flex items-center justify-between px-6 text-white/60 text-sm">
          <div className="flex items-center space-x-4">
            <span>Status: {isLoading ? 'Saving...' : 'Ready'}</span>
            <span>Last saved: {currentWorkflow?.updated_at ? new Date(currentWorkflow.updated_at).toLocaleTimeString() : 'Never'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Nodes: {currentWorkflow?.nodes?.length || 0}</span>
            <span>Connections: {currentWorkflow?.connections?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 