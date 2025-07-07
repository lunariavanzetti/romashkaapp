import React from 'react';
import { motion } from 'framer-motion';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { NodeType, NodeTypeConfig } from '../../types/workflow';

const nodeTypes: NodeTypeConfig[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Conversation trigger',
    icon: '▶️',
    color: 'from-green-500 to-green-600',
    inputs: 0,
    outputs: 1,
    canHaveMultipleOutputs: false
  },
  {
    type: 'message',
    label: 'Message',
    description: 'AI sends a message',
    icon: '💬',
    color: 'from-blue-500 to-blue-600',
    inputs: 1,
    outputs: 1,
    canHaveMultipleOutputs: false
  },
  {
    type: 'input',
    label: 'Input',
    description: 'Ask user for information',
    icon: '📝',
    color: 'from-yellow-500 to-yellow-600',
    inputs: 1,
    outputs: 1,
    canHaveMultipleOutputs: false
  },
  {
    type: 'condition',
    label: 'Condition',
    description: 'If/else branching',
    icon: '🔀',
    color: 'from-purple-500 to-purple-600',
    inputs: 1,
    outputs: 2,
    canHaveMultipleOutputs: true
  },
  {
    type: 'action',
    label: 'Action',
    description: 'Save data, create ticket',
    icon: '⚡',
    color: 'from-orange-500 to-orange-600',
    inputs: 1,
    outputs: 1,
    canHaveMultipleOutputs: false
  },
  {
    type: 'end',
    label: 'End',
    description: 'Conversation completion',
    icon: '⏹️',
    color: 'from-red-500 to-red-600',
    inputs: 1,
    outputs: 0,
    canHaveMultipleOutputs: false
  }
];

export const NodePalette: React.FC = () => {
  const { addNode } = useWorkflowStore();

  const handleNodeDragStart = (e: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType }));
  };

  const handleAddNode = (nodeType: NodeType) => {
    // Add node at center of canvas (approximate)
    addNode(nodeType, { x: 400, y: 300 });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <h2 className="text-xl font-bold text-white mb-2">Node Palette</h2>
        <p className="text-white/60 text-sm">Drag nodes to the canvas or click to add</p>
      </div>

      {/* Node Types */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {nodeTypes.map((nodeType, index) => (
          <motion.div
            key={nodeType.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="group cursor-pointer"
              draggable
              onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleNodeDragStart(e, nodeType.type)}
              onClick={() => handleAddNode(nodeType.type)}
            >
            <div className={`
              p-4 rounded-xl border-2 border-white/20 bg-glassDark/40
              group-hover:border-white/40 group-hover:bg-glassDark/60
              transition-all duration-300 group-hover:scale-105
            `}>
              <div className="flex items-center space-x-3">
                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-lg bg-gradient-to-r ${nodeType.color}
                  flex items-center justify-center text-2xl
                  shadow-lg group-hover:shadow-xl transition-shadow
                `}>
                  {nodeType.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-white/90">
                    {nodeType.label}
                  </h3>
                  <p className="text-white/60 text-sm group-hover:text-white/70">
                    {nodeType.description}
                  </p>
                  
                  {/* Connection info */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-white/40">
                      {nodeType.inputs} in • {nodeType.outputs} out
                    </span>
                    {nodeType.canHaveMultipleOutputs && (
                      <span className="text-xs text-purple-400">Multiple paths</span>
                    )}
                  </div>
                                 </div>
               </div>
             </div>
           </div>
         </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <div className="text-center text-white/40 text-sm">
          <p>💡 Tip: Connect nodes by dragging from output to input</p>
        </div>
      </div>
    </div>
  );
}; 