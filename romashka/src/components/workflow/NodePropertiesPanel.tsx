import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedInput } from '../ui';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { WorkflowNode } from '../../types/workflow';

interface NodePropertiesPanelProps {
  selectedNode: WorkflowNode | null;
  onNodeUpdate: (node: WorkflowNode | null) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  onNodeUpdate
}) => {
  const { updateNode, deleteNode } = useWorkflowStore();

  const handleUpdateNode = (field: string, value: any) => {
    if (!selectedNode) return;

    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [field]: value
      }
    };

    updateNode(selectedNode.id, updatedNode);
    onNodeUpdate(updatedNode);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    deleteNode(selectedNode.id);
    onNodeUpdate(null);
  };

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-xl font-bold text-white mb-2">Properties</h2>
          <p className="text-white/60 text-sm">Select a node to edit its properties</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/40">
            <div className="text-4xl mb-2">📋</div>
            <p>No node selected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">Node Properties</h2>
          <button
            onClick={handleDeleteNode}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-lg
            ${selectedNode.type === 'start' ? 'bg-gradient-to-r from-green-500 to-green-600' :
              selectedNode.type === 'message' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              selectedNode.type === 'input' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
              selectedNode.type === 'condition' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
              selectedNode.type === 'action' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            }
          `}>
            {selectedNode.type === 'start' ? '▶️' :
             selectedNode.type === 'message' ? '💬' :
             selectedNode.type === 'input' ? '📝' :
             selectedNode.type === 'condition' ? '🔀' :
             selectedNode.type === 'action' ? '⚡' : '⏹️'}
          </div>
          <span className="text-white font-medium capitalize">{selectedNode.type} Node</span>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatedInput
            label="Label"
            value={selectedNode.data.label}
            onChange={(e) => handleUpdateNode('label', e.target.value)}
            placeholder="Node label"
          />
        </motion.div>

        {/* Node-specific properties */}
        {selectedNode.type === 'message' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-white/80 text-sm font-medium mb-2">Message</label>
            <textarea
              value={selectedNode.data.message || ''}
              onChange={(e) => handleUpdateNode('message', e.target.value)}
              placeholder="Enter the message to send to the user..."
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-primary-pink focus:outline-none resize-none"
              rows={4}
            />
          </motion.div>
        )}

        {selectedNode.type === 'input' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-white/80 text-sm font-medium mb-2">Input Type</label>
              <select
                value={selectedNode.data.inputType || 'email'}
                onChange={(e) => handleUpdateNode('inputType', e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary-pink focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="company">Company</option>
                <option value="message">Message</option>
              </select>
            </motion.div>

                         <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <AnimatedInput
                 label="Input Label"
                 value={selectedNode.data.inputLabel || ''}
                 onChange={(e) => handleUpdateNode('inputLabel', e.target.value)}
                 placeholder="Label for the input field"
               />
             </motion.div>
          </>
        )}

        {selectedNode.type === 'condition' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-white/80 text-sm font-medium mb-2">Condition</label>
            <textarea
              value={selectedNode.data.condition || ''}
              onChange={(e) => handleUpdateNode('condition', e.target.value)}
              placeholder="Enter condition (e.g., email_provided, user_type === 'premium')"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-primary-pink focus:outline-none resize-none"
              rows={3}
            />
            <p className="text-white/40 text-xs mt-1">
              Examples: email_provided, user_type === 'premium', message_contains('help')
            </p>
          </motion.div>
        )}

        {selectedNode.type === 'action' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-white/80 text-sm font-medium mb-2">Action</label>
            <select
              value={selectedNode.data.action || 'save_email'}
              onChange={(e) => handleUpdateNode('action', e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-primary-pink focus:outline-none"
            >
              <option value="save_email">Save Email</option>
              <option value="create_ticket">Create Support Ticket</option>
              <option value="notify_agent">Notify Human Agent</option>
              <option value="save_conversation">Save Conversation</option>
            </select>
          </motion.div>
        )}

        {selectedNode.type === 'end' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-white/80 text-sm font-medium mb-2">End Message</label>
            <textarea
              value={selectedNode.data.message || ''}
              onChange={(e) => handleUpdateNode('message', e.target.value)}
              placeholder="Final message to send before ending conversation"
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-primary-pink focus:outline-none resize-none"
              rows={3}
            />
          </motion.div>
        )}

        {/* Position info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4 border-t border-white/20"
        >
          <h3 className="text-white/60 text-sm font-medium mb-2">Position</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
            <div>X: {Math.round(selectedNode.position.x)}</div>
            <div>Y: {Math.round(selectedNode.position.y)}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 