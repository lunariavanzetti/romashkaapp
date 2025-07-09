import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, File, Image, AlertCircle, CheckCircle, X, Download, Eye, Settings, Play, Pause, Trash2, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../services/supabaseClient';
import type { ContentImport, ImportSettings, ValidationResult } from '../../types/knowledge';

interface ContentImportProps {
  onImportComplete?: (results: any) => void;
  onClose?: () => void;
}

interface FileUpload {
  file: File;
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  preview?: string;
  validationResults?: ValidationResult[];
  extractedContent?: any;
  error?: string;
}

const defaultSettings: ImportSettings = {
  auto_categorize: true,
  extract_images: true,
  maintain_formatting: true,
  detect_language: true,
  generate_tags: true,
  split_large_content: true,
  max_content_length: 5000,
  quality_threshold: 0.6,
  merge_similar_content: true,
  enable_ocr: false,
  custom_processors: [],
  metadata_extraction: true,
  content_validation: true,
  duplicate_detection: true,
  ai_enhancement: true,
  translation_enabled: false,
  target_languages: ['en'],
  workflow_stage: 'draft',
  assigned_reviewers: [],
  notification_settings: {
    email_notifications: true,
    slack_notifications: false,
    in_app_notifications: true,
    recipients: [],
    notification_types: ['completion', 'error'],
    frequency: 'immediate',
    quiet_hours: { start: '22:00', end: '08:00' },
    escalation_rules: []
  }
};

export default function ContentImport({ onImportComplete, onClose }: ContentImportProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [settings, setSettings] = useState<ImportSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create_new'>('skip');

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/xml': ['.xml'],
      'text/markdown': ['.md'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 20,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
      const newFiles: FileUpload[] = acceptedFiles.map((file: File) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'queued',
        progress: 0
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Process files immediately for preview
      newFiles.forEach(fileUpload => {
        processFilePreview(fileUpload);
      });
    }, [])
  });

  const processFilePreview = async (fileUpload: FileUpload) => {
    try {
      if (fileUpload.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          ));
        };
        reader.readAsDataURL(fileUpload.file);
      } else if (fileUpload.file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFiles(prev => prev.map(f => 
            f.id === fileUpload.id 
              ? { ...f, preview: content.substring(0, 500) + '...' }
              : f
          ));
        };
        reader.readAsText(fileUpload.file);
      }
    } catch (error) {
      console.error('Error processing file preview:', error);
    }
  };

  const validateFile = async (fileUpload: FileUpload): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];
    
    // File size validation
    if (fileUpload.file.size > 50 * 1024 * 1024) {
      results.push({
        field: 'file_size',
        type: 'error',
        message: 'File size exceeds 50MB limit',
        severity: 'high',
        auto_fixable: false
      });
    }
    
    // File type validation
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/html', 'text/csv', 'application/json', 'text/xml', 'text/markdown'];
    if (!allowedTypes.includes(fileUpload.file.type) && !fileUpload.file.type.startsWith('image/')) {
      results.push({
        field: 'file_type',
        type: 'error',
        message: 'Unsupported file type',
        severity: 'high',
        auto_fixable: false
      });
    }
    
    // Content validation (for text files)
    if (fileUpload.file.type === 'text/plain' && fileUpload.file.size < 100) {
      results.push({
        field: 'content_length',
        type: 'warning',
        message: 'File appears to be very short',
        severity: 'medium',
        auto_fixable: false
      });
    }
    
    return results;
  };

  const processFile = async (fileUpload: FileUpload): Promise<void> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'processing', progress: 0 }
          : f
      ));

      // Validate file
      const validationResults = await validateFile(fileUpload);
      
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, validationResults, progress: 20 }
          : f
      ));

      // Check for blocking errors
      const blockingErrors = validationResults.filter(r => r.type === 'error');
      if (blockingErrors.length > 0) {
        throw new Error(blockingErrors[0].message);
      }

      // Upload file to storage
      const fileExt = fileUpload.file.name.split('.').pop();
      const fileName = `${fileUpload.id}.${fileExt}`;
      const filePath = `content-imports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('knowledge-assets')
        .upload(filePath, fileUpload.file);

      if (uploadError) throw uploadError;

      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, progress: 40 }
          : f
      ));

      // Process file content based on type
      let extractedContent: any = {};
      
      if (fileUpload.file.type === 'application/pdf') {
        extractedContent = await processPDF(fileUpload.file);
      } else if (fileUpload.file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedContent = await processDOCX(fileUpload.file);
      } else if (fileUpload.file.type === 'text/plain') {
        extractedContent = await processText(fileUpload.file);
      } else if (fileUpload.file.type === 'text/html') {
        extractedContent = await processHTML(fileUpload.file);
      } else if (fileUpload.file.type === 'text/csv') {
        extractedContent = await processCSV(fileUpload.file);
      } else if (fileUpload.file.type === 'application/json') {
        extractedContent = await processJSON(fileUpload.file);
      }

      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, progress: 80, extractedContent }
          : f
      ));

      // Save to database
      const { error: dbError } = await supabase
        .from('content_imports')
        .insert({
          batch_id: batchId,
          filename: fileUpload.file.name,
          file_type: getFileType(fileUpload.file.type),
          file_size: fileUpload.file.size,
          status: 'completed',
          progress: 100,
          extracted_items: extractedContent.items?.length || 1,
          successful_imports: extractedContent.items?.length || 1,
          failed_imports: 0,
          preview_content: extractedContent.preview,
          import_settings: settings,
          validation_results: validationResults,
          duplicate_handling: duplicateHandling
        });

      if (dbError) throw dbError;

      // Create knowledge items
      if (extractedContent.items) {
        for (const item of extractedContent.items) {
          await supabase
            .from('knowledge_items')
            .insert({
              title: item.title,
              content: item.content,
              tags: item.tags || [],
              language: item.language || 'en',
              status: settings.workflow_stage as any,
              source_type: 'file',
              confidence_score: item.confidence || 0.8,
              version: 1,
              created_by: 'current_user',
              updated_by: 'current_user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              effectiveness_score: 0,
              helpful_count: 0,
              not_helpful_count: 0,
              usage_count: 0,
              import_batch_id: batchId
            });
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ));

         } catch (error) {
       console.error('Error processing file:', error);
       const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
       setFiles(prev => prev.map(f => 
         f.id === fileUpload.id 
           ? { ...f, status: 'failed', error: errorMessage }
           : f
       ));
     }
  };

  const processPDF = async (file: File): Promise<any> => {
    // This would use pdf-parse library
    // For now, return mock data
    return {
      items: [{
        title: file.name.replace('.pdf', ''),
        content: 'Extracted PDF content would appear here...',
        tags: ['pdf', 'document'],
        language: 'en',
        confidence: 0.8
      }],
      preview: 'PDF content preview...'
    };
  };

  const processDOCX = async (file: File): Promise<any> => {
    // This would use mammoth library
    // For now, return mock data
    return {
      items: [{
        title: file.name.replace('.docx', ''),
        content: 'Extracted DOCX content would appear here...',
        tags: ['docx', 'document'],
        language: 'en',
        confidence: 0.8
      }],
      preview: 'DOCX content preview...'
    };
  };

  const processText = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve({
          items: [{
            title: file.name.replace('.txt', ''),
            content: content,
            tags: ['text', 'document'],
            language: 'en',
            confidence: 0.9
          }],
          preview: content.substring(0, 500)
        });
      };
      reader.readAsText(file);
    });
  };

  const processHTML = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Strip HTML tags for preview
        const textContent = content.replace(/<[^>]*>/g, '');
        resolve({
          items: [{
            title: file.name.replace('.html', ''),
            content: textContent,
            tags: ['html', 'web'],
            language: 'en',
            confidence: 0.7
          }],
          preview: textContent.substring(0, 500)
        });
      };
      reader.readAsText(file);
    });
  };

  const processCSV = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0]?.split(',') || [];
        const items = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            title: values[0] || `Row ${index + 1}`,
            content: values.slice(1).join(', '),
            tags: ['csv', 'data'],
            language: 'en',
            confidence: 0.6
          };
        });
        
        resolve({
          items,
          preview: `CSV with ${headers.length} columns and ${items.length} rows`
        });
      };
      reader.readAsText(file);
    });
  };

  const processJSON = async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          const items = Array.isArray(data) ? data.map((item, index) => ({
            title: item.title || item.name || `Item ${index + 1}`,
            content: JSON.stringify(item, null, 2),
            tags: ['json', 'data'],
            language: 'en',
            confidence: 0.7
          })) : [{
            title: file.name.replace('.json', ''),
            content: JSON.stringify(data, null, 2),
            tags: ['json', 'data'],
            language: 'en',
            confidence: 0.7
          }];
          
          resolve({
            items,
            preview: `JSON data with ${items.length} items`
          });
        } catch (error) {
          resolve({
            items: [{
              title: file.name.replace('.json', ''),
              content: 'Invalid JSON content',
              tags: ['json', 'error'],
              language: 'en',
              confidence: 0.3
            }],
            preview: 'Invalid JSON format'
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const getFileType = (mimeType: string): 'pdf' | 'docx' | 'txt' | 'html' | 'csv' | 'json' | 'xml' | 'md' => {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (mimeType === 'text/plain') return 'txt';
    if (mimeType === 'text/html') return 'html';
    if (mimeType === 'text/csv') return 'csv';
    if (mimeType === 'application/json') return 'json';
    if (mimeType === 'text/xml') return 'xml';
    if (mimeType === 'text/markdown') return 'md';
    return 'txt';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="text-red-500" size={20} />;
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileText className="text-blue-500" size={20} />;
    if (mimeType.startsWith('image/')) return <Image className="text-green-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    const newBatchId = `batch_${Date.now()}`;
    setBatchId(newBatchId);
    
    try {
      for (const file of files) {
        if (file.status === 'queued') {
          await processFile(file);
        }
      }
      
      setOverallProgress(100);
      onImportComplete?.(files);
    } catch (error) {
      console.error('Error during batch processing:', error);
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setOverallProgress(0);
    setBatchId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-gray-500';
      case 'processing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Upload size={16} />;
      case 'processing': return <RefreshCw size={16} className="animate-spin" />;
      case 'completed': return <CheckCircle size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Upload size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Upload className="text-primary-pink" size={24} />
          <h2 className="text-xl font-semibold">Content Import</h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings size={16} />
            Settings
          </motion.button>
          {files.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 size={16} />
              Clear All
            </motion.button>
          )}
          {files.length > 0 && !processing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 transition-colors"
            >
              <Play size={16} />
              Start Import
            </motion.button>
          )}
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
              Close
            </motion.button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Import Settings */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 rounded-lg p-4 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">Import Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Auto-categorize content</label>
                  <input
                    type="checkbox"
                    checked={settings.auto_categorize}
                    onChange={(e) => setSettings({...settings, auto_categorize: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Extract images</label>
                  <input
                    type="checkbox"
                    checked={settings.extract_images}
                    onChange={(e) => setSettings({...settings, extract_images: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Maintain formatting</label>
                  <input
                    type="checkbox"
                    checked={settings.maintain_formatting}
                    onChange={(e) => setSettings({...settings, maintain_formatting: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Detect language</label>
                  <input
                    type="checkbox"
                    checked={settings.detect_language}
                    onChange={(e) => setSettings({...settings, detect_language: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Generate tags</label>
                  <input
                    type="checkbox"
                    checked={settings.generate_tags}
                    onChange={(e) => setSettings({...settings, generate_tags: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">AI enhancement</label>
                  <input
                    type="checkbox"
                    checked={settings.ai_enhancement}
                    onChange={(e) => setSettings({...settings, ai_enhancement: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Duplicate detection</label>
                  <input
                    type="checkbox"
                    checked={settings.duplicate_detection}
                    onChange={(e) => setSettings({...settings, duplicate_detection: e.target.checked})}
                    className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duplicate handling</label>
                  <select
                    value={duplicateHandling}
                    onChange={(e) => setDuplicateHandling(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                  >
                    <option value="skip">Skip duplicates</option>
                    <option value="update">Update existing</option>
                    <option value="create_new">Create new version</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-primary-pink bg-primary-pink/10'
              : 'border-gray-300 hover:border-primary-pink hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragActive ? 'Drop the files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, DOCX, TXT, HTML, CSV, JSON, XML, MD and images
          </p>
          <p className="text-xs text-gray-400">
            Maximum file size: 50MB • Maximum files: 20
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Files ({files.length})</h3>
              {processing && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.file.type)}
                      <div>
                        <div className="font-medium">{file.file.name}</div>
                        <div className="text-sm text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${getStatusColor(file.status)}`}>
                        {getStatusIcon(file.status)}
                        <span className="text-sm font-medium capitalize">{file.status}</span>
                      </div>
                      {file.preview && (
                        <button
                          onClick={() => setShowPreview(file.id)}
                          className="p-1 text-gray-500 hover:text-primary-pink transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {file.status === 'queued' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {file.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-pink h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {file.error && (
                    <div className="mt-2 text-sm text-red-600">
                      {file.error}
                    </div>
                  )}
                  
                  {file.validationResults && file.validationResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {file.validationResults.map((result, index) => (
                        <div key={index} className={`text-xs flex items-center gap-1 ${
                          result.type === 'error' ? 'text-red-600' :
                          result.type === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {result.type === 'error' && <AlertCircle size={12} />}
                          {result.type === 'warning' && <AlertCircle size={12} />}
                          {result.type === 'info' && <AlertCircle size={12} />}
                          {result.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">File Preview</h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                {(() => {
                  const file = files.find(f => f.id === showPreview);
                  if (!file) return null;
                  
                  if (file.file.type.startsWith('image/')) {
                    return <img src={file.preview} alt="Preview" className="max-w-full h-auto" />;
                  }
                  
                  return (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {file.preview}
                    </pre>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}