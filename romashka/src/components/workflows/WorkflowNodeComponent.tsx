import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  PlayIcon,
  StopIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface WorkflowNodeData {
  label: string;
  nodeType: 'start' | 'end' | 'action' | 'condition' | 'message' | 'input';
  description?: string;
  config?: any;
  onEdit?: () => void;
  onDelete?: () => void;
  readonly?: boolean;
}

const WorkflowNodeComponent: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const getNodeIcon = () => {
    switch (data.nodeType) {
      case 'start':
        return <PlayIcon className="h-5 w-5" />;
      case 'end':
        return <StopIcon className="h-5 w-5" />;
      case 'action':
        return <BoltIcon className="h-5 w-5" />;
      case 'condition':
        return <QuestionMarkCircleIcon className="h-5 w-5" />;
      case 'message':
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
      case 'input':
        return <PencilIcon className="h-5 w-5" />;
      default:
        return <CogIcon className="h-5 w-5" />;
    }
  };

  const getNodeColor = () => {
    switch (data.nodeType) {
      case 'start':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'end':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'action':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'condition':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'message':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'input':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const shouldShowLeftHandle = () => {
    return data.nodeType !== 'start';
  };

  const shouldShowRightHandle = () => {
    return data.nodeType !== 'end';
  };

  const shouldShowMultipleOutputs = () => {
    return data.nodeType === 'condition';
  };

  return (
    <div className={`relative px-4 py-3 shadow-lg rounded-lg border-2 min-w-[150px] ${getNodeColor()} ${
      selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
    }`}>
      {/* Input Handle */}
      {shouldShowLeftHandle() && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          {getNodeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs opacity-75 truncate">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Indicator */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
      )}

      {/* Action Buttons */}
      {!data.readonly && (
        <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {data.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit?.();
              }}
              className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
              title="Edit node"
            >
              <CogIcon className="h-3 w-3 text-gray-600" />
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.();
              }}
              className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50"
              title="Delete node"
            >
              <TrashIcon className="h-3 w-3 text-red-600" />
            </button>
          )}
        </div>
      )}

      {/* Output Handles */}
      {shouldShowRightHandle() && (
        <>
          {shouldShowMultipleOutputs() ? (
            <>
              {/* True/Success Output */}
              <Handle
                type="source"
                position={Position.Right}
                id="true"
                style={{ top: '30%' }}
                className="w-3 h-3 !bg-green-500 !border-2 !border-white"
              />
              {/* False/Failure Output */}
              <Handle
                type="source"
                position={Position.Right}
                id="false"
                style={{ top: '70%' }}
                className="w-3 h-3 !bg-red-500 !border-2 !border-white"
              />
            </>
          ) : (
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
            />
          )}
        </>
      )}

      {/* Node Type Badge */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 shadow-sm">
          {data.nodeType}
        </span>
      </div>
    </div>
  );
};

export default WorkflowNodeComponent;