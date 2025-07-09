import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Users, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Save,
  Play,
  Clock,
  Mail,
  Share2,
  Copy,
  Eye,
  Trash2,
  Plus,
  Layout,
  Database,
  FileImage,
  FileSpreadsheet,
  Palette,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { supabase } from '../../services/supabaseClient';
import type { ReportConfig, ScheduledReportConfig, BrandingConfig } from '../../types/analytics';

interface ReportSection {
  id: string;
  type: 'header' | 'kpi' | 'chart' | 'table' | 'text' | 'spacer';
  title?: string;
  config: Record<string, any>;
  position: number;
}

interface ReportBuilderProps {
  onSave?: (config: ReportConfig) => void;
  onCancel?: () => void;
  className?: string;
}

const DATA_SOURCES = [
  { id: 'conversations', label: 'Conversations', icon: MessageCircle },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'satisfaction', label: 'Satisfaction', icon: '😊' },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'channels', label: 'Channels', icon: Share2 }
];

const REPORT_TEMPLATES = [
  {
    id: 'performance',
    name: 'Performance Report',
    description: 'Agent and system performance metrics',
    sections: [
      { type: 'header', title: 'Performance Summary' },
      { type: 'kpi', title: 'Key Metrics' },
      { type: 'chart', title: 'Response Time Trends' },
      { type: 'table', title: 'Agent Performance' }
    ]
  },
  {
    id: 'satisfaction',
    name: 'Customer Satisfaction',
    description: 'Customer satisfaction analysis',
    sections: [
      { type: 'header', title: 'Customer Satisfaction Report' },
      { type: 'kpi', title: 'Overall Satisfaction' },
      { type: 'chart', title: 'Satisfaction Trends' },
      { type: 'chart', title: 'Satisfaction by Channel' }
    ]
  },
  {
    id: 'ai-performance',
    name: 'AI Performance',
    description: 'AI system performance and accuracy',
    sections: [
      { type: 'header', title: 'AI Performance Analysis' },
      { type: 'kpi', title: 'AI Metrics' },
      { type: 'chart', title: 'Accuracy Trends' },
      { type: 'table', title: 'Knowledge Gap Analysis' }
    ]
  },
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level business metrics',
    sections: [
      { type: 'header', title: 'Executive Summary' },
      { type: 'kpi', title: 'Business Impact' },
      { type: 'chart', title: 'Growth Trends' },
      { type: 'text', title: 'Key Insights' }
    ]
  }
];

const SECTION_TYPES = [
  { id: 'header', label: 'Header', icon: Layout, description: 'Report title and header' },
  { id: 'kpi', label: 'KPI Cards', icon: BarChart3, description: 'Key performance indicators' },
  { id: 'chart', label: 'Chart', icon: BarChart3, description: 'Data visualization' },
  { id: 'table', label: 'Table', icon: Database, description: 'Data table' },
  { id: 'text', label: 'Text', icon: FileText, description: 'Custom text content' },
  { id: 'spacer', label: 'Spacer', icon: '—', description: 'Spacing element' }
];

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onSave,
  onCancel,
  className
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'custom',
    format: 'pdf',
    data: {
      title: 'New Report',
      description: '',
      sections: []
    },
    template: '',
    branding: {
      logo: '',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981'
      },
      companyName: '',
      contactInfo: ''
    }
  });

  const [activeTab, setActiveTab] = useState<'design' | 'data' | 'schedule' | 'preview'>('design');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [filters, setFilters] = useState({
    timeRange: { start: '', end: '' },
    channels: [],
    departments: [],
    agents: []
  });

  const [scheduleConfig, setScheduleConfig] = useState<ScheduledReportConfig>({
    name: '',
    description: '',
    reportType: 'custom',
    scheduleCron: '',
    recipients: [],
    filters: {},
    format: 'pdf',
    isActive: false
  });

  const addSection = useCallback((type: string) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type: type as any,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      config: {},
      position: reportConfig.data.sections.length
    };

    setReportConfig(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sections: [...prev.data.sections, newSection]
      }
    }));
  }, [reportConfig.data.sections]);

  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReportConfig(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sections: prev.data.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        )
      }
    }));
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setReportConfig(prev => ({
      ...prev,
      data: {
        ...prev.data,
        sections: prev.data.sections.filter(section => section.id !== sectionId)
      }
    }));
    setSelectedSection(null);
  }, []);

  const reorderSections = useCallback((startIndex: number, endIndex: number) => {
    setReportConfig(prev => {
      const newSections = [...prev.data.sections];
      const [removed] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, removed);
      
      return {
        ...prev,
        data: {
          ...prev.data,
          sections: newSections.map((section, index) => ({
            ...section,
            position: index
          }))
        }
      };
    });
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const sections = template.sections.map((section: any, index: number) => ({
        id: `section-${Date.now()}-${index}`,
        type: section.type,
        title: section.title,
        config: {},
        position: index
      }));

      setReportConfig(prev => ({
        ...prev,
        data: {
          ...prev.data,
          title: template.name,
          description: template.description,
          sections
        }
      }));
    }
    setShowTemplates(false);
  }, []);

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Call report generation service
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: reportConfig,
          filters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportConfig.data.title}.${reportConfig.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [reportConfig, filters]);

  const saveReport = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('report_configs')
        .insert([{
          name: reportConfig.data.title,
          config: reportConfig,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      onSave?.(reportConfig);
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report. Please try again.');
    }
  }, [reportConfig, onSave]);

  const previewReport = useCallback(async () => {
    // Implementation for report preview
    console.log('Previewing report:', reportConfig);
  }, [reportConfig]);

  return (
    <div className={cn('flex h-screen bg-gray-50', className)}>
      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Choose Report Template</h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REPORT_TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="space-y-1">
                                           {template.sections.map((section: any, index: number) => (
                       <div key={index} className="flex items-center space-x-2">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <span className="text-sm text-gray-700">{section.title}</span>
                       </div>
                     ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={reportConfig.data.title}
                onChange={(e) => setReportConfig(prev => ({
                  ...prev,
                  data: { ...prev.data, title: e.target.value }
                }))}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Report Name"
              />
              <Badge variant="secondary">{reportConfig.type}</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="flex items-center space-x-2"
              >
                <Layout className="w-4 h-4" />
                <span>Templates</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={previewReport}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={generateReport}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
              </Button>
              
              <Button
                onClick={saveReport}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {(['design', 'data', 'schedule', 'preview'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 font-medium transition-colors whitespace-nowrap',
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'design' && (
            <div className="flex h-full">
              {/* Section Builder */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {reportConfig.data.sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300',
                        selectedSection === section.id && 'border-blue-500 ring-2 ring-blue-200'
                      )}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            {React.createElement(
                              SECTION_TYPES.find(t => t.id === section.type)?.icon || FileText,
                              { className: 'w-4 h-4' }
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{section.title}</h3>
                            <p className="text-sm text-gray-500">
                              {SECTION_TYPES.find(t => t.id === section.type)?.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (index > 0) reorderSections(index, index - 1);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (index < reportConfig.data.sections.length - 1) {
                                reorderSections(index, index + 1);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            disabled={index === reportConfig.data.sections.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSection(section.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add Section Button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {SECTION_TYPES.map(sectionType => (
                        <button
                          key={sectionType.id}
                          onClick={() => addSection(sectionType.id)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center"
                        >
                          <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                            {React.createElement(sectionType.icon, { className: 'w-4 h-4' })}
                          </div>
                          <div className="font-medium text-gray-900 text-sm">{sectionType.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Configuration Panel */}
              {selectedSection && (
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">Section Settings</h2>
                  </div>
                                     <div className="flex-1 overflow-y-auto p-4">
                     <SectionConfigPanel
                       section={reportConfig.data.sections.find((s: ReportSection) => s.id === selectedSection)!}
                       onUpdate={(updates) => updateSection(selectedSection, updates)}
                     />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="p-6">
              <DataSourcePanel 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-6">
              <SchedulePanel 
                config={scheduleConfig}
                onConfigChange={setScheduleConfig}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-6">
              <ReportPreview 
                config={reportConfig}
                filters={filters}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Section Configuration Panel Component
const SectionConfigPanel: React.FC<{
  section: ReportSection;
  onUpdate: (updates: Partial<ReportSection>) => void;
}> = ({ section, onUpdate }) => {
  const updateConfig = useCallback((key: string, value: any) => {
    onUpdate({
      config: { ...section.config, [key]: value }
    });
  }, [section.config, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {section.type === 'kpi' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metrics to Display
          </label>
          <div className="space-y-2">
            {['Active Conversations', 'Response Time', 'Satisfaction Score', 'AI Resolution Rate'].map(metric => (
              <label key={metric} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={section.config.metrics?.includes(metric)}
                  onChange={(e) => {
                    const currentMetrics = section.config.metrics || [];
                                         const newMetrics = e.target.checked
                       ? [...currentMetrics, metric]
                       : currentMetrics.filter((m: string) => m !== metric);
                    updateConfig('metrics', newMetrics);
                  }}
                />
                {metric}
              </label>
            ))}
          </div>
        </div>
      )}

      {section.type === 'chart' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <select
              value={section.config.chartType || 'line'}
              onChange={(e) => updateConfig('chartType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Source
            </label>
            <select
              value={section.config.dataSource || 'conversations'}
              onChange={(e) => updateConfig('dataSource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATA_SOURCES.map(source => (
                <option key={source.id} value={source.id}>{source.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {section.type === 'table' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table Columns
          </label>
          <div className="space-y-2">
            {['Customer', 'Channel', 'Status', 'Agent', 'Duration', 'Satisfaction'].map(column => (
              <label key={column} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={section.config.columns?.includes(column)}
                  onChange={(e) => {
                    const currentColumns = section.config.columns || [];
                                         const newColumns = e.target.checked
                       ? [...currentColumns, column]
                       : currentColumns.filter((c: string) => c !== column);
                    updateConfig('columns', newColumns);
                  }}
                />
                {column}
              </label>
            ))}
          </div>
        </div>
      )}

      {section.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={section.config.content || ''}
            onChange={(e) => updateConfig('content', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your text content here..."
          />
        </div>
      )}
    </div>
  );
};

// Data Source Panel Component
const DataSourcePanel: React.FC<{
  filters: any;
  onFiltersChange: (filters: any) => void;
}> = ({ filters, onFiltersChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.timeRange.start}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  timeRange: { ...filters.timeRange, start: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.timeRange.end}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  timeRange: { ...filters.timeRange, end: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channels
            </label>
            <div className="space-y-2">
              {['Email', 'Chat', 'Phone', 'WhatsApp', 'Telegram'].map(channel => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={filters.channels.includes(channel)}
                    onChange={(e) => {
                                             const newChannels = e.target.checked
                         ? [...filters.channels, channel]
                         : filters.channels.filter((c: string) => c !== channel);
                      onFiltersChange({ ...filters, channels: newChannels });
                    }}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATA_SOURCES.map(source => (
            <div key={source.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  {React.createElement(source.icon, { className: 'w-4 h-4' })}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{source.label}</h4>
                  <p className="text-sm text-gray-500">Available</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Schedule Panel Component
const SchedulePanel: React.FC<{
  config: ScheduledReportConfig;
  onConfigChange: (config: ScheduledReportConfig) => void;
}> = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Report</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Weekly Performance Report"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule
            </label>
            <select
              value={config.scheduleCron}
              onChange={(e) => onConfigChange({ ...config, scheduleCron: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select schedule...</option>
              <option value="0 9 * * 1">Weekly (Monday 9 AM)</option>
              <option value="0 9 * * *">Daily (9 AM)</option>
              <option value="0 9 1 * *">Monthly (1st day, 9 AM)</option>
              <option value="0 9 1 1,4,7,10 *">Quarterly (1st day, 9 AM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            <textarea
              value={config.recipients.join(', ')}
              onChange={(e) => onConfigChange({ 
                ...config, 
                recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user1@company.com, user2@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <select
              value={config.format}
              onChange={(e) => onConfigChange({ ...config, format: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => onConfigChange({ ...config, isActive: e.target.checked })}
                className="mr-2"
              />
              Enable scheduled reports
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Report Preview Component
const ReportPreview: React.FC<{
  config: ReportConfig;
  filters: any;
}> = ({ config, filters }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.data.title}</h1>
        {config.data.description && (
          <p className="text-gray-600">{config.data.description}</p>
        )}
      </div>

             <div className="space-y-8">
         {config.data.sections.map((section: ReportSection) => (
           <div key={section.id} className="border-b border-gray-200 pb-6 last:border-b-0">
             <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
             
             <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
               <div className="text-sm">
                 {section.type === 'kpi' && 'KPI Cards will appear here'}
                 {section.type === 'chart' && `${section.config.chartType || 'Line'} Chart will appear here`}
                 {section.type === 'table' && 'Data Table will appear here'}
                 {section.type === 'text' && (section.config.content || 'Text content will appear here')}
                 {section.type === 'spacer' && 'Spacer'}
               </div>
             </div>
           </div>
         ))}
       </div>

      {config.data.sections.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No sections added yet. Go to Design tab to add content.</p>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;