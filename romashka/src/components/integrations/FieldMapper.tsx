import React, { useState, useCallback, useMemo } from 'react';
import type { FieldMapping } from '../../types/integrations';

interface Field {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'array' | 'object';
  required: boolean;
  description?: string;
  example?: string;
}

interface FieldMapperProps {
  sourceFields: Field[];
  targetFields: Field[];
  existingMappings?: FieldMapping[];
  sourceEntity: string;
  targetEntity: string;
  onMappingsChange: (mappings: FieldMapping[]) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

interface DragState {
  isDragging: boolean;
  draggedField?: Field;
  draggedFrom?: 'source' | 'target';
}

interface TransformationRule {
  type: 'none' | 'format' | 'default' | 'concat' | 'split' | 'map' | 'custom';
  params?: Record<string, any>;
  customScript?: string;
}

export default function FieldMapper({
  sourceFields,
  targetFields,
  existingMappings = [],
  sourceEntity,
  targetEntity,
  onMappingsChange,
  onValidationChange
}: FieldMapperProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(existingMappings);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false });
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateMappings = useCallback((newMappings: FieldMapping[]) => {
    setMappings(newMappings);
    onMappingsChange(newMappings);
    
    // Validate mappings
    const errors = validateMappings(newMappings);
    setValidationErrors(errors);
    onValidationChange?.(errors.length === 0, errors);
  }, [onMappingsChange, onValidationChange]);

  const handleDragStart = useCallback((field: Field, from: 'source' | 'target') => {
    setDragState({
      isDragging: true,
      draggedField: field,
      draggedFrom: from
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({ isDragging: false });
  }, []);

  const handleDrop = useCallback((targetField: Field, dropZone: 'source' | 'target') => {
    const { draggedField, draggedFrom } = dragState;
    
    if (!draggedField || !draggedFrom) return;

    // Only allow source to target mapping
    if (draggedFrom === 'source' && dropZone === 'target') {
      const newMapping: FieldMapping = {
        id: `${draggedField.id}-${targetField.id}`,
        integration_id: '', // Will be set by parent
        source_entity: sourceEntity,
        target_entity: targetEntity,
        source_field: draggedField.name,
        target_field: targetField.name,
        transformation_rule: JSON.stringify({ type: 'none' }),
        is_required: targetField.required,
        created_at: new Date().toISOString()
      };

      // Remove any existing mapping for this target field
      const filteredMappings = mappings.filter(m => m.target_field !== targetField.name);
      updateMappings([...filteredMappings, newMapping]);
    }

    setDragState({ isDragging: false });
  }, [dragState, mappings, sourceEntity, targetEntity, updateMappings]);

  const removeMapping = useCallback((mappingId: string) => {
    updateMappings(mappings.filter(m => m.id !== mappingId));
  }, [mappings, updateMappings]);

  const updateTransformation = useCallback((mappingId: string, rule: TransformationRule) => {
    updateMappings(
      mappings.map(m => 
        m.id === mappingId 
          ? { ...m, transformation_rule: JSON.stringify(rule) }
          : m
      )
    );
  }, [mappings, updateMappings]);

  const getMappingForTarget = useCallback((targetFieldName: string) => {
    return mappings.find(m => m.target_field === targetFieldName);
  }, [mappings]);

  const getMappingForSource = useCallback((sourceFieldName: string) => {
    return mappings.find(m => m.source_field === sourceFieldName);
  }, [mappings]);

  const validateMappings = useCallback((mappingsToValidate: FieldMapping[]): string[] => {
    const errors: string[] = [];
    
    // Check required target fields are mapped
    const requiredTargetFields = targetFields.filter(f => f.required);
    const mappedTargetFields = new Set(mappingsToValidate.map(m => m.target_field));
    
    for (const field of requiredTargetFields) {
      if (!mappedTargetFields.has(field.name)) {
        errors.push(`Required field "${field.name}" is not mapped`);
      }
    }

    // Check for type compatibility
    for (const mapping of mappingsToValidate) {
      const sourceField = sourceFields.find(f => f.name === mapping.source_field);
      const targetField = targetFields.find(f => f.name === mapping.target_field);
      
      if (sourceField && targetField) {
        if (!areTypesCompatible(sourceField.type, targetField.type)) {
          const rule = JSON.parse(mapping.transformation_rule || '{}') as TransformationRule;
          if (rule.type === 'none') {
            errors.push(`Type mismatch: ${sourceField.name} (${sourceField.type}) → ${targetField.name} (${targetField.type})`);
          }
        }
      }
    }

    return errors;
  }, [sourceFields, targetFields]);

  const areTypesCompatible = (sourceType: string, targetType: string): boolean => {
    if (sourceType === targetType) return true;
    
    const compatibilityMap: Record<string, string[]> = {
      'string': ['email', 'phone', 'date'],
      'number': ['string'],
      'boolean': ['string'],
      'date': ['string'],
      'email': ['string'],
      'phone': ['string']
    };
    
    return compatibilityMap[sourceType]?.includes(targetType) ?? false;
  };

  const mappedSourceFields = useMemo(() => 
    new Set(mappings.map(m => m.source_field)),
    [mappings]
  );

  const mappedTargetFields = useMemo(() => 
    new Set(mappings.map(m => m.target_field)),
    [mappings]
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Field Mapping
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Map fields from {sourceEntity} to {targetEntity}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Validation Errors
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mapping Area */}
      <div className="flex-1 flex">
        {/* Source Fields */}
        <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Source Fields ({sourceEntity})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Drag fields to map them
            </p>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {sourceFields.map(field => (
              <FieldItem
                key={field.id}
                field={field}
                side="source"
                isMapped={mappedSourceFields.has(field.name)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* Mapping Connections */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mb-4">
            Drag from source to target to create mappings
          </div>
          
          {/* Active Mappings */}
          <div className="space-y-2">
            {mappings.map(mapping => {
              const sourceField = sourceFields.find(f => f.name === mapping.source_field);
              const targetField = targetFields.find(f => f.name === mapping.target_field);
              
              return (
                <MappingConnection
                  key={mapping.id}
                  mapping={mapping}
                  sourceField={sourceField}
                  targetField={targetField}
                  isSelected={selectedMapping === mapping.id}
                  onSelect={() => setSelectedMapping(mapping.id)}
                  onRemove={() => removeMapping(mapping.id)}
                  onUpdateTransformation={(rule) => updateTransformation(mapping.id, rule)}
                />
              );
            })}
          </div>
        </div>

        {/* Target Fields */}
        <div className="w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Target Fields ({targetEntity})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Drop source fields here
            </p>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {targetFields.map(field => (
              <FieldItem
                key={field.id}
                field={field}
                side="target"
                isMapped={mappedTargetFields.has(field.name)}
                onDrop={handleDrop}
                dragState={dragState}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="h-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Mapping Preview</h3>
          </div>
          <div className="p-4 overflow-auto">
            <MappingPreview mappings={mappings} sourceFields={sourceFields} targetFields={targetFields} />
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldItemProps {
  field: Field;
  side: 'source' | 'target';
  isMapped: boolean;
  onDragStart?: (field: Field, from: 'source' | 'target') => void;
  onDragEnd?: () => void;
  onDrop?: (field: Field, dropZone: 'source' | 'target') => void;
  dragState?: DragState;
}

function FieldItem({ field, side, isMapped, onDragStart, onDragEnd, onDrop, dragState }: FieldItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(field, side);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (side === 'target' && dragState?.draggedFrom === 'source') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(field, side);
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      string: '📝',
      number: '🔢',
      boolean: '✅',
      date: '📅',
      email: '📧',
      phone: '📞',
      array: '📋',
      object: '📦'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      number: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      boolean: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      date: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      email: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      phone: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      array: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      object: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[type as keyof typeof colors] || colors.string;
  };

  return (
    <div
      draggable={side === 'source'}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${isMapped 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
        }
        ${side === 'source' ? 'cursor-grab active:cursor-grabbing' : ''}
        ${side === 'target' && dragState?.isDragging && dragState.draggedFrom === 'source' 
          ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
          : ''
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{getTypeIcon(field.type)}</span>
            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(field.type)}`}>
              {field.type}
            </span>
            {isMapped && (
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Mapped
              </span>
            )}
          </div>
          
          {field.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {field.description}
            </p>
          )}
          
          {field.example && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Example: {field.example}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface MappingConnectionProps {
  mapping: FieldMapping;
  sourceField?: Field;
  targetField?: Field;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdateTransformation: (rule: TransformationRule) => void;
}

function MappingConnection({ 
  mapping, 
  sourceField, 
  targetField, 
  isSelected, 
  onSelect, 
  onRemove, 
  onUpdateTransformation 
}: MappingConnectionProps) {
  const rule = useMemo(() => {
    try {
      return JSON.parse(mapping.transformation_rule || '{}') as TransformationRule;
    } catch {
      return { type: 'none' } as TransformationRule;
    }
  }, [mapping.transformation_rule]);

  if (!sourceField || !targetField) return null;

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-600' 
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {sourceField.name}
            </span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {targetField.name}
            </span>
          </div>
          
          {rule.type !== 'none' && (
            <div className="mt-1">
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                Transform: {rule.type}
              </span>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface MappingPreviewProps {
  mappings: FieldMapping[];
  sourceFields: Field[];
  targetFields: Field[];
}

function MappingPreview({ mappings, sourceFields, targetFields }: MappingPreviewProps) {
  const sampleData = useMemo(() => {
    const sample: Record<string, any> = {};
    
    for (const field of sourceFields) {
      switch (field.type) {
        case 'string':
          sample[field.name] = field.example || 'Sample text';
          break;
        case 'number':
          sample[field.name] = 123;
          break;
        case 'boolean':
          sample[field.name] = true;
          break;
        case 'date':
          sample[field.name] = new Date().toISOString();
          break;
        case 'email':
          sample[field.name] = 'user@example.com';
          break;
        case 'phone':
          sample[field.name] = '+1234567890';
          break;
        case 'array':
          sample[field.name] = ['item1', 'item2'];
          break;
        case 'object':
          sample[field.name] = { key: 'value' };
          break;
      }
    }
    
    return sample;
  }, [sourceFields]);

  const transformedData = useMemo(() => {
    const result: Record<string, any> = {};
    
    for (const mapping of mappings) {
      const sourceValue = sampleData[mapping.source_field];
      let transformedValue = sourceValue;
      
      try {
        const rule = JSON.parse(mapping.transformation_rule || '{}') as TransformationRule;
        
        switch (rule.type) {
          case 'format':
            if (rule.params?.format && typeof sourceValue === 'string') {
              transformedValue = sourceValue.toUpperCase(); // Example transformation
            }
            break;
          case 'default':
            transformedValue = sourceValue || rule.params?.defaultValue;
            break;
          case 'concat':
            if (rule.params?.fields && Array.isArray(rule.params.fields)) {
              transformedValue = rule.params.fields.map((f: string) => sampleData[f]).join(rule.params.separator || ' ');
            }
            break;
        }
      } catch {
        // Use original value if transformation fails
      }
      
      result[mapping.target_field] = transformedValue;
    }
    
    return result;
  }, [mappings, sampleData]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Source Data</h4>
        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
          {JSON.stringify(sampleData, null, 2)}
        </pre>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Mapped Result</h4>
        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
          {JSON.stringify(transformedData, null, 2)}
        </pre>
      </div>
    </div>
  );
}