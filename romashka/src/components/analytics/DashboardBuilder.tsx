import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Plus, 
  Settings, 
  Save, 
  Eye, 
  Share2, 
  Download, 
  Grid, 
  Smartphone, 
  Tablet, 
  Monitor,
  Filter,
  Calendar,
  Copy,
  Trash2,
  Edit,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Table
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { supabase } from '../../services/supabaseClient';
import type { DashboardConfig, WidgetLayout, WidgetType, WidgetConfig } from '../../types/analytics';

// Widget Templates
const WIDGET_TEMPLATES = {
  kpi: {
    type: 'kpi' as WidgetType,
    icon: Target,
    label: 'KPI Card',
    defaultConfig: {
      title: 'New KPI',
      metric: 'activeConversations',
      format: 'number',
      showTrend: true,
      colorScheme: 'primary'
    },
    defaultSize: { w: 3, h: 2 }
  },
  'line-chart': {
    type: 'line-chart' as WidgetType,
    icon: LineChart,
    label: 'Line Chart',
    defaultConfig: {
      title: 'Trend Chart',
      metric: 'satisfactionScore',
      showLegend: true,
      smoothLine: true,
      colorScheme: 'primary'
    },
    defaultSize: { w: 6, h: 4 }
  },
  'bar-chart': {
    type: 'bar-chart' as WidgetType,
    icon: BarChart3,
    label: 'Bar Chart',
    defaultConfig: {
      title: 'Comparison Chart',
      metric: 'conversationsByChannel',
      dimension: 'channel',
      showLegend: true,
      colorScheme: 'primary'
    },
    defaultSize: { w: 6, h: 4 }
  },
  'pie-chart': {
    type: 'pie-chart' as WidgetType,
    icon: PieChart,
    label: 'Pie Chart',
    defaultConfig: {
      title: 'Distribution Chart',
      metric: 'resolutionByType',
      showLegend: true,
      showLabels: true,
      colorScheme: 'primary'
    },
    defaultSize: { w: 4, h: 4 }
  },
  gauge: {
    type: 'gauge' as WidgetType,
    icon: Activity,
    label: 'Gauge Chart',
    defaultConfig: {
      title: 'Performance Gauge',
      metric: 'satisfactionScore',
      min: 0,
      max: 5,
      thresholds: [
        { value: 3, color: '#ef4444', label: 'Poor' },
        { value: 4, color: '#f59e0b', label: 'Good' },
        { value: 5, color: '#10b981', label: 'Excellent' }
      ]
    },
    defaultSize: { w: 3, h: 3 }
  },
  table: {
    type: 'table' as WidgetType,
    icon: Table,
    label: 'Data Table',
    defaultConfig: {
      title: 'Data Table',
      dataSource: 'conversations',
      columns: [
        { key: 'customer', label: 'Customer' },
        { key: 'channel', label: 'Channel' },
        { key: 'status', label: 'Status' }
      ],
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    defaultSize: { w: 8, h: 6 }
  }
};

const DASHBOARD_TEMPLATES = [
  {
    id: 'overview',
    name: 'Overview Dashboard',
    description: 'Key performance metrics and trends',
    layout: [
      { id: 'active-conversations', type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 } },
      { id: 'satisfaction-score', type: 'gauge', position: { x: 3, y: 0, w: 3, h: 2 } },
      { id: 'ai-resolution-rate', type: 'kpi', position: { x: 6, y: 0, w: 3, h: 2 } },
      { id: 'response-time-trend', type: 'line-chart', position: { x: 0, y: 2, w: 6, h: 4 } },
      { id: 'channel-distribution', type: 'pie-chart', position: { x: 6, y: 2, w: 3, h: 4 } }
    ]
  },
  {
    id: 'performance',
    name: 'Agent Performance',
    description: 'Agent productivity and quality metrics',
    layout: [
      { id: 'agent-productivity', type: 'bar-chart', position: { x: 0, y: 0, w: 6, h: 4 } },
      { id: 'response-time-gauge', type: 'gauge', position: { x: 6, y: 0, w: 3, h: 4 } },
      { id: 'top-agents', type: 'table', position: { x: 0, y: 4, w: 9, h: 4 } }
    ]
  },
  {
    id: 'ai-analytics',
    name: 'AI Analytics',
    description: 'AI performance and accuracy metrics',
    layout: [
      { id: 'ai-accuracy', type: 'gauge', position: { x: 0, y: 0, w: 3, h: 3 } },
      { id: 'confidence-trend', type: 'line-chart', position: { x: 3, y: 0, w: 6, h: 3 } },
      { id: 'handoff-reasons', type: 'pie-chart', position: { x: 0, y: 3, w: 4, h: 3 } },
      { id: 'knowledge-gaps', type: 'table', position: { x: 4, y: 3, w: 5, h: 3 } }
    ]
  }
];

interface DashboardBuilderProps {
  initialConfig?: DashboardConfig;
  onSave?: (config: DashboardConfig) => void;
  onCancel?: () => void;
  className?: string;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialConfig,
  onSave,
  onCancel,
  className
}) => {
  const [config, setConfig] = useState<DashboardConfig>(
    initialConfig || {
      id: '',
      name: 'New Dashboard',
      isDefault: false,
      layout: [],
      filters: {
        timeRange: '7d',
        channels: ['all'],
        departments: ['all'],
        agents: ['all']
      },
      refreshInterval: 300,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  const gridCols = useMemo(() => {
    switch (viewMode) {
      case 'mobile': return 4;
      case 'tablet': return 8;
      default: return 12;
    }
  }, [viewMode]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'widget-palette' && destination.droppableId === 'dashboard-grid') {
      // Adding new widget from palette
      const widgetType = result.draggableId as WidgetType;
      const template = WIDGET_TEMPLATES[widgetType];
      
      if (template) {
        const newWidget: WidgetLayout = {
          id: `widget-${Date.now()}`,
          type: widgetType,
          position: { 
            x: Math.floor(destination.index % gridCols), 
            y: Math.floor(destination.index / gridCols), 
            ...template.defaultSize 
          },
          config: { ...template.defaultConfig }
        };

        setConfig(prev => ({
          ...prev,
          layout: [...prev.layout, newWidget]
        }));
      }
    } else if (source.droppableId === 'dashboard-grid' && destination.droppableId === 'dashboard-grid') {
      // Reordering widgets
      const newLayout = [...config.layout];
      const [removed] = newLayout.splice(source.index, 1);
      
      // Calculate new position
      const newPosition = {
        ...removed.position,
        x: Math.floor(destination.index % gridCols),
        y: Math.floor(destination.index / gridCols)
      };
      
      newLayout.splice(destination.index, 0, { ...removed, position: newPosition });
      
      setConfig(prev => ({
        ...prev,
        layout: newLayout
      }));
    }
  }, [config.layout, gridCols]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetLayout>) => {
    setConfig(prev => ({
      ...prev,
      layout: prev.layout.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    }));
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setConfig(prev => ({
      ...prev,
      layout: prev.layout.filter(widget => widget.id !== widgetId)
    }));
    setSelectedWidget(null);
    setShowConfigPanel(false);
  }, []);

  const cloneWidget = useCallback((widgetId: string) => {
    const widget = config.layout.find(w => w.id === widgetId);
    if (widget) {
      const newWidget: WidgetLayout = {
        ...widget,
        id: `widget-${Date.now()}`,
        position: { 
          ...widget.position, 
          x: Math.min(widget.position.x + 1, gridCols - widget.position.w) 
        },
        config: { ...widget.config, title: `${widget.config.title} Copy` }
      };
      
      setConfig(prev => ({
        ...prev,
        layout: [...prev.layout, newWidget]
      }));
    }
  }, [config.layout, gridCols]);

  const applyTemplate = useCallback((templateId: string) => {
    const template = DASHBOARD_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const newLayout = template.layout.map((widget, index) => ({
        ...widget,
        id: `widget-${Date.now()}-${index}`,
        config: WIDGET_TEMPLATES[widget.type].defaultConfig
      }));
      
      setConfig(prev => ({
        ...prev,
        layout: newLayout
      }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!config.name.trim()) {
      alert('Please enter a dashboard name');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      onSave?.(data);
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert('Failed to save dashboard. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [config, onSave]);

  const exportDashboard = useCallback(async (format: 'pdf' | 'png') => {
    // Implementation for dashboard export
    console.log('Exporting dashboard as:', format);
  }, []);

  const shareDashboard = useCallback(() => {
    // Implementation for dashboard sharing
    console.log('Sharing dashboard');
  }, []);

  return (
    <div className={cn('flex h-screen bg-gray-50', className)}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Widget Palette */}
        <AnimatePresence>
          {showWidgetPanel && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-80 bg-white border-r border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Widget Palette</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <Droppable droppableId="widget-palette" isDropDisabled={true}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-2">
                      {Object.entries(WIDGET_TEMPLATES).map(([type, template], index) => (
                        <Draggable key={type} draggableId={type} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50',
                                snapshot.isDragging && 'shadow-lg'
                              )}
                            >
                              <div className="flex items-center space-x-3">
                                <template.icon className="w-5 h-5 text-gray-500" />
                                <div>
                                  <div className="font-medium text-gray-900">{template.label}</div>
                                  <div className="text-sm text-gray-500">
                                    {template.defaultSize.w} × {template.defaultSize.h}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {/* Dashboard Templates */}
                <div className="p-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Templates</h3>
                  <div className="space-y-2">
                    {DASHBOARD_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id)}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Dashboard Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                  placeholder="Dashboard Name"
                />
                <Badge variant={config.isPublic ? 'success' : 'secondary'}>
                  {config.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={cn(
                      'p-1 rounded',
                      viewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-500'
                    )}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('tablet')}
                    className={cn(
                      'p-1 rounded',
                      viewMode === 'tablet' ? 'bg-white shadow' : 'text-gray-500'
                    )}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={cn(
                      'p-1 rounded',
                      viewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-500'
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
                
                <Button
                  variant={isPreviewMode ? 'primary' : 'outline'}
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => exportDashboard('pdf')}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={shareDashboard}
                  className="flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <Droppable droppableId="dashboard-grid">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    'grid gap-4 min-h-full',
                    viewMode === 'desktop' && 'grid-cols-12',
                    viewMode === 'tablet' && 'grid-cols-8',
                    viewMode === 'mobile' && 'grid-cols-4'
                  )}
                >
                  {config.layout.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            gridColumn: `span ${widget.position.w}`,
                            gridRow: `span ${widget.position.h}`
                          }}
                          className={cn(
                            'bg-white rounded-lg border border-gray-200 shadow-sm',
                            snapshot.isDragging && 'shadow-lg',
                            selectedWidget === widget.id && 'ring-2 ring-blue-500'
                          )}
                          onClick={() => {
                            setSelectedWidget(widget.id);
                            setShowConfigPanel(true);
                          }}
                        >
                          <div className="p-4 h-full relative group">
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cloneWidget(widget.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWidget(widget.id);
                                    setShowConfigPanel(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteWidget(widget.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="w-2 h-2 bg-gray-400 rounded-full cursor-move" />
                              </div>
                            </div>
                            
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-gray-400 mb-2">
                                  {React.createElement(WIDGET_TEMPLATES[widget.type].icon, { className: "w-8 h-8 mx-auto" })}
                                </div>
                                <div className="font-medium text-gray-900">{widget.config.title}</div>
                                <div className="text-sm text-gray-500">{WIDGET_TEMPLATES[widget.type].label}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>

        {/* Widget Configuration Panel */}
        <AnimatePresence>
          {showConfigPanel && selectedWidget && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-white border-l border-gray-200 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Widget Settings</h2>
                <button
                  onClick={() => setShowConfigPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <WidgetConfigPanel
                  widget={config.layout.find(w => w.id === selectedWidget)!}
                  onUpdate={(updates) => updateWidget(selectedWidget, updates)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DragDropContext>
    </div>
  );
};

// Widget Configuration Panel Component
const WidgetConfigPanel: React.FC<{
  widget: WidgetLayout;
  onUpdate: (updates: Partial<WidgetLayout>) => void;
}> = ({ widget, onUpdate }) => {
  const updateConfig = useCallback((key: string, value: any) => {
    onUpdate({
      config: { ...widget.config, [key]: value }
    });
  }, [widget.config, onUpdate]);

  const updatePosition = useCallback((key: string, value: number) => {
    onUpdate({
      position: { ...widget.position, [key]: value }
    });
  }, [widget.position, onUpdate]);

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Basic Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={widget.config.title}
              onChange={(e) => updateConfig('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {widget.config.metric && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metric
              </label>
              <select
                value={widget.config.metric}
                onChange={(e) => updateConfig('metric', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activeConversations">Active Conversations</option>
                <option value="satisfactionScore">Satisfaction Score</option>
                <option value="aiResolutionRate">AI Resolution Rate</option>
                <option value="avgResponseTime">Average Response Time</option>
                <option value="agentProductivity">Agent Productivity</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Position & Size</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              value={widget.position.w}
              onChange={(e) => updatePosition('w', parseInt(e.target.value))}
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              value={widget.position.h}
              onChange={(e) => updatePosition('h', parseInt(e.target.value))}
              min="1"
              max="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Widget-specific Settings */}
      {widget.type === 'gauge' && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Gauge Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={widget.config.min || 0}
                onChange={(e) => updateConfig('min', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={widget.config.max || 100}
                onChange={(e) => updateConfig('max', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Display Options */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Display Options</h3>
        <div className="space-y-3">
          {widget.config.showLegend !== undefined && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={widget.config.showLegend}
                onChange={(e) => updateConfig('showLegend', e.target.checked)}
                className="mr-2"
              />
              Show Legend
            </label>
          )}
          
          {widget.config.showTrend !== undefined && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={widget.config.showTrend}
                onChange={(e) => updateConfig('showTrend', e.target.checked)}
                className="mr-2"
              />
              Show Trend
            </label>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Scheme
            </label>
            <select
              value={widget.config.colorScheme || 'primary'}
              onChange={(e) => updateConfig('colorScheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;