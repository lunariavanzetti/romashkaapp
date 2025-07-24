import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  PlusIcon, 
  PlayIcon, 
  StopIcon, 
  SaveIcon,
  TrashIcon,
  CogIcon,
  DocumentDuplicateIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { WorkflowNode as WorkflowNodeType, WorkflowConnection, Workflow, WorkflowTemplate } from '../../types/workflow';
import { workflowTemplates } from '../../services/workflows/workflowTemplates';
import WorkflowNodeComponent from './WorkflowNodeComponent';
import WorkflowEdgeComponent from './WorkflowEdgeComponent';
import NodeConfigPanel from './NodeConfigPanel';
import TriggerConfigPanel from './TriggerConfigPanel';
import WorkflowTestPanel from './WorkflowTestPanel';

// Custom node types
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

// Custom edge types
const edgeTypes: EdgeTypes = {
  workflowEdge: WorkflowEdgeComponent,
};

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onTest?: (workflow: Workflow) => void;
  readonly?: boolean;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflow,
  onSave,
  onTest,
  readonly = false
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize workflow from props
  useEffect(() => {
    if (workflow) {
      const flowNodes = workflow.nodes.map(node => ({
        id: node.id,
        type: 'workflowNode',
        position: node.position,
        data: {
          ...node.data,
          nodeType: node.type,
          onEdit: () => handleNodeEdit(node.id),
          onDelete: () => handleNodeDelete(node.id),
          readonly
        },
      }));

      const flowEdges = workflow.connections.map(conn => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        label: conn.label,
        type: 'workflowEdge',
        data: {
          onEdit: () => handleEdgeEdit(conn.id),
          onDelete: () => handleEdgeDelete(conn.id),
          readonly
        }
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
    }
  }, [workflow, readonly]);

  const onConnect = useCallback((params: Connection) => {
    if (readonly) return;
    
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'workflowEdge',
      data: {
        onEdit: () => handleEdgeEdit(`edge-${Date.now()}`),
        onDelete: () => handleEdgeDelete(`edge-${Date.now()}`),
        readonly: false
      }
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [readonly]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (readonly) return;
      
      event.preventDefault();

      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const nodeType = event.dataTransfer.getData('application/reactflow');

        if (!nodeType) return;

        const position = project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: 'workflowNode',
          position,
          data: {
            label: getNodeTypeLabel(nodeType),
            nodeType,
            onEdit: () => handleNodeEdit(`node-${Date.now()}`),
            onDelete: () => handleNodeDelete(`node-${Date.now()}`),
            readonly: false
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [project, readonly]
  );

  const handleNodeEdit = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setShowNodePanel(true);
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    if (readonly) return;
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  };

  const handleEdgeEdit = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      setSelectedEdge(edge);
      // Could open edge configuration panel here
    }
  };

  const handleEdgeDelete = (edgeId: string) => {
    if (readonly) return;
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
  };

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    setShowNodePanel(false);
    setSelectedNode(null);
  };

  const validateWorkflow = (): string[] => {
    const errors: string[] = [];
    
    // Check for start node
    const startNodes = nodes.filter(n => n.data.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have at least one start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node');
    }

    // Check for end node
    const endNodes = nodes.filter(n => n.data.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one end node');
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(n => 
      n.data.nodeType !== 'start' && 
      n.data.nodeType !== 'end' && 
      !connectedNodeIds.has(n.id)
    );

    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} nodes are not connected to the workflow`);
    }

    // Check condition nodes have both true and false paths
    const conditionNodes = nodes.filter(n => n.data.nodeType === 'condition');
    conditionNodes.forEach(node => {
      const outgoingEdges = edges.filter(e => e.source === node.id);
      if (outgoingEdges.length < 2) {
        errors.push(`Condition node "${node.data.label}" must have both true and false paths`);
      }
    });

    return errors;
  };

  const handleSave = () => {
    const errors = validateWorkflow();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const workflowData: Workflow = {
      id: workflow?.id || `workflow-${Date.now()}`,
      user_id: workflow?.user_id || 'current-user',
      name: workflowName,
      description: workflowDescription,
      trigger_type: 'manual', // This would be set in trigger config
      trigger_conditions: workflow?.trigger_conditions || {
        type: 'manual',
        conditions: [],
        settings: {}
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: node.data
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label
      })),
      is_active: workflow?.is_active || false,
      execution_count: workflow?.execution_count || 0,
      success_count: workflow?.success_count || 0,
      failure_count: workflow?.failure_count || 0,
      created_at: workflow?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSave(workflowData);
  };

  const handleTest = () => {
    if (!onTest) return;
    
    const errors = validateWorkflow();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsExecuting(true);
    const workflowData: Workflow = {
      id: workflow?.id || `test-workflow-${Date.now()}`,
      user_id: 'current-user',
      name: workflowName,
      description: workflowDescription,
      trigger_type: 'manual',
      trigger_conditions: {
        type: 'manual',
        conditions: [],
        settings: {}
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: node.data
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label
      })),
      is_active: true,
      execution_count: 0,
      success_count: 0,
      failure_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onTest(workflowData);
    
    // Simulate test execution
    setTimeout(() => {
      setIsExecuting(false);
      setShowTestPanel(true);
    }, 2000);
  };

  const loadTemplate = (template: WorkflowTemplate) => {
    const flowNodes = template.nodes.map(node => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position,
      data: {
        ...node.data,
        nodeType: node.type,
        onEdit: () => handleNodeEdit(node.id),
        onDelete: () => handleNodeDelete(node.id),
        readonly: false
      },
    }));

    const flowEdges = template.connections.map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      label: conn.label,
      type: 'workflowEdge',
      data: {
        onEdit: () => handleEdgeEdit(conn.id),
        onDelete: () => handleEdgeDelete(conn.id),
        readonly: false
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setShowTemplateLibrary(false);
  };

  const getNodeTypeLabel = (nodeType: string): string => {
    const labels: { [key: string]: string } = {
      start: 'Start',
      end: 'End',
      action: 'Action',
      condition: 'Condition',
      message: 'Message',
      input: 'Input'
    };
    return labels[nodeType] || nodeType;
  };

  const clearWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName('New Workflow');
    setWorkflowDescription('');
    setValidationErrors([]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Workflow Name"
              disabled={readonly}
            />
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="block mt-1 text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Add a description..."
              disabled={readonly}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            {!readonly && (
              <>
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Templates
                </button>
                
                <button
                  onClick={clearWorkflow}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Clear
                </button>

                <button
                  onClick={() => setShowTriggerPanel(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  Triggers
                </button>
              </>
            )}

            {onTest && (
              <button
                onClick={handleTest}
                disabled={isExecuting}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isExecuting ? (
                  <StopIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4 mr-2" />
                )}
                {isExecuting ? 'Testing...' : 'Test'}
              </button>
            )}

            {!readonly && (
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save
              </button>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-700">
              <strong>Validation Errors:</strong>
              <ul className="mt-1 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        {!readonly && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Node Types</h3>
            <div className="space-y-2">
              {[
                { type: 'start', label: 'Start', icon: '🚀', color: 'bg-green-100 text-green-800' },
                { type: 'action', label: 'Action', icon: '⚡', color: 'bg-blue-100 text-blue-800' },
                { type: 'condition', label: 'Condition', icon: '❓', color: 'bg-yellow-100 text-yellow-800' },
                { type: 'message', label: 'Message', icon: '💬', color: 'bg-purple-100 text-purple-800' },
                { type: 'input', label: 'Input', icon: '📝', color: 'bg-orange-100 text-orange-800' },
                { type: 'end', label: 'End', icon: '🏁', color: 'bg-red-100 text-red-800' }
              ].map((nodeType) => (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/reactflow', nodeType.type);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`flex items-center p-3 rounded-lg cursor-move hover:shadow-md transition-shadow ${nodeType.color}`}
                >
                  <span className="text-lg mr-3">{nodeType.icon}</span>
                  <span className="text-sm font-medium">{nodeType.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            <Panel position="top-right">
              <div className="bg-white rounded-lg shadow-lg p-4 space-y-2">
                <div className="text-sm text-gray-600">
                  Nodes: {nodes.length} | Edges: {edges.length}
                </div>
                {readonly && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Read-only mode
                  </div>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Panel */}
      {showNodePanel && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => {
            setShowNodePanel(false);
            setSelectedNode(null);
          }}
        />
      )}

      {/* Trigger Configuration Panel */}
      {showTriggerPanel && (
        <TriggerConfigPanel
          workflow={workflow}
          onClose={() => setShowTriggerPanel(false)}
          onUpdate={(triggerConfig) => {
            // Handle trigger configuration update
            console.log('Trigger config updated:', triggerConfig);
            setShowTriggerPanel(false);
          }}
        />
      )}

      {/* Test Results Panel */}
      {showTestPanel && (
        <WorkflowTestPanel
          workflow={workflow}
          onClose={() => setShowTestPanel(false)}
        />
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Workflow Templates</h3>
                  <button
                    onClick={() => setShowTemplateLibrary(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.complexity_level === 'beginner' ? 'bg-green-100 text-green-800' :
                          template.complexity_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {template.complexity_level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component with ReactFlowProvider
const WorkflowBuilderWrapper: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderWrapper;