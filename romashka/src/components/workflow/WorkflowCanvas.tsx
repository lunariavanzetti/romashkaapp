import React from 'react';
import { motion } from 'framer-motion';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { WorkflowNode } from '../../types/workflow';

interface WorkflowCanvasProps {
  onNodeSelect: (node: WorkflowNode | null) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ onNodeSelect }) => {
  const { currentWorkflow, addNode } = useWorkflowStore();

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect any selected node when clicking on canvas
    onNodeSelect(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/reactflow'));
      if (data.type) {
        addNode(data.type, position);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="w-full h-full relative bg-gradient-to-br from-slate-800/50 to-slate-900/50"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      {/* Nodes */}
      {currentWorkflow?.nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute cursor-pointer"
          style={{
            left: node.position.x,
            top: node.position.y,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.stopPropagation();
            onNodeSelect(node);
          }}
        >
          <div className={`
            p-4 rounded-xl border-2 min-w-32
            ${node.type === 'start' ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/50' :
              node.type === 'message' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/50' :
              node.type === 'input' ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50' :
              node.type === 'condition' ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-500/50' :
              node.type === 'action' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/50' :
              'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50'
            }
            backdrop-blur-sm hover:scale-105 transition-all duration-200
          `}>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {node.type === 'start' ? '▶️' :
                 node.type === 'message' ? '💬' :
                 node.type === 'input' ? '📝' :
                 node.type === 'condition' ? '🔀' :
                 node.type === 'action' ? '⚡' : '⏹️'}
              </div>
              <h3 className="font-semibold text-white text-sm">{node.data.label}</h3>
              {node.data.message && (
                <p className="text-white/60 text-xs mt-1 truncate">{node.data.message}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Connections */}
      {currentWorkflow?.connections.map((connection) => {
        const sourceNode = currentWorkflow.nodes.find(n => n.id === connection.source);
        const targetNode = currentWorkflow.nodes.find(n => n.id === connection.target);
        
        if (!sourceNode || !targetNode) return null;

        const startX = sourceNode.position.x + 128; // Approximate node width
        const startY = sourceNode.position.y + 40;  // Approximate node height/2
        const endX = targetNode.position.x;
        const endY = targetNode.position.y + 40;

        return (
          <svg
            key={connection.id}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: -1 }}
          >
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="rgba(255,255,255,0.3)"
                />
              </marker>
            </defs>
          </svg>
        );
      })}

      {/* Empty State */}
      {(!currentWorkflow || currentWorkflow.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Build Your Workflow</h3>
            <p className="text-white/60 mb-4">Drag nodes from the palette to get started</p>
            <div className="text-white/40 text-sm">
              <p>💡 Start with a "Start" node, then add "Message" and "Input" nodes</p>
              <p>🔗 Connect them by dragging from output to input</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 