import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface WorkflowEdgeData {
  onEdit?: () => void;
  onDelete?: () => void;
  readonly?: boolean;
}

const WorkflowEdgeComponent: React.FC<EdgeProps<WorkflowEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  label,
  labelStyle = {},
  labelShowBg = true,
  labelBgStyle = {},
  labelBgPadding = [8, 4],
  labelBgBorderRadius = 2,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation();
    data?.onEdit?.();
  };

  const onDeleteClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    data?.onDelete?.();
  };

  // Determine edge color based on source handle
  const getEdgeColor = () => {
    if (selected) return '#6366f1'; // indigo-500
    return '#6b7280'; // gray-500
  };

  // Determine label background color based on connection type
  const getLabelBgColor = () => {
    if (label?.toLowerCase().includes('true') || label?.toLowerCase().includes('yes')) {
      return '#dcfce7'; // green-100
    }
    if (label?.toLowerCase().includes('false') || label?.toLowerCase().includes('no')) {
      return '#fee2e2'; // red-100
    }
    return '#f3f4f6'; // gray-100
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: getEdgeColor(),
          strokeWidth: selected ? 3 : 2,
          fill: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        onClick={(event) => onEdgeClick(event, id)}
      />
      
      {/* Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: getLabelBgColor(),
                padding: `${labelBgPadding[1]}px ${labelBgPadding[0]}px`,
                borderRadius: labelBgBorderRadius,
                border: selected ? '2px solid #6366f1' : '1px solid #d1d5db',
                ...labelBgStyle,
              }}
              className={`flex items-center space-x-2 ${selected ? 'shadow-lg' : 'shadow-sm'}`}
            >
              <span
                style={{
                  color: '#374151',
                  fontWeight: 500,
                  ...labelStyle,
                }}
              >
                {label}
              </span>
              
              {/* Delete button for edge */}
              {!data?.readonly && selected && data?.onDelete && (
                <button
                  onClick={onDeleteClick}
                  className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Delete connection"
                >
                  <TrashIcon className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Selection indicator */}
      {selected && !label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {!data?.readonly && data?.onDelete && (
              <button
                onClick={onDeleteClick}
                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                title="Delete connection"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default WorkflowEdgeComponent;