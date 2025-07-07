import React, { useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background, addEdge, useNodesState, useEdgesState } from 'react-flow-renderer';
import { Box, Typography, Button } from '@mui/material';
import type { Connection } from 'react-flow-renderer';
import type { Edge } from 'react-flow-renderer';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Ask for email' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'If email provided' }, position: { x: 400, y: 100 } },
  { id: '4', type: 'output', data: { label: 'End' }, position: { x: 250, y: 200 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'Next' },
  { id: 'e2-3', source: '2', target: '3', label: 'If yes' },
  { id: 'e3-4', source: '3', target: '4', label: 'End' },
];

export default function FlowBuilder() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)), [setEdges]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, height: { xs: 'calc(100vh - 120px)', md: '80vh' } }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Conversation Flow Builder</Typography>
      <Box sx={{ height: { xs: '60vh', md: '70vh' }, borderRadius: 3, border: '1px solid #eee', overflow: 'auto', mb: 2 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </Box>
      <Button variant="contained" color="primary" sx={{ minWidth: 44, minHeight: 44 }}>Save Flow</Button>
      <Button variant="outlined" sx={{ ml: 2, minWidth: 44, minHeight: 44 }}>Load Template</Button>
    </Box>
  );
} 