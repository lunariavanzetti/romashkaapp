import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Database, 
  MessageSquare, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

import { Button } from '../../../components/ui';

interface FileUploaderProps {
  onUpload: (files: File[], dataType: 'conversations' | 'faq' | 'knowledge') => void;
  supportedTypes: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  onClose?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  supportedTypes,
  maxFiles = 10,
  maxFileSize = 50,
  onClose
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dataType, setDataType] = useState<'conversations' | 'faq' | 'knowledge'>('conversations');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = ['.csv', '.json', '.txt', '.xlsx', '.pdf'];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedExtensions.includes(extension)) {
      return `Unsupported file type. Supported types: ${supportedExtensions.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < selectedFiles.length && currentFileCount + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];
      const validation = validateFile(file);

      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: validation ? 'error' : 'pending',
        error: validation || undefined
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    const validFiles = files.filter(f => f.status !== 'error');
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Simulate upload progress
      for (const fileData of validFiles) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Simulate progressive upload
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setFiles(prev => prev.map(f => 
            f.id === fileData.id 
              ? { ...f, progress }
              : f
          ));
        }

        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));
      }

      // Call the upload callback
      onUpload(validFiles.map(f => f.file), dataType);
      
      // Reset files after successful upload
      setFiles([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
      case 'xlsx':
        return <Database className="w-5 h-5 text-green-500" />;
      case 'json':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'conversations':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'faq':
        return <HelpCircle className="w-5 h-5 text-green-500" />;
      case 'knowledge':
        return <Database className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDataTypeDescription = (type: string) => {
    switch (type) {
      case 'conversations':
        return 'Upload conversation transcripts, chat logs, or customer interaction data';
      case 'faq':
        return 'Upload FAQ documents, Q&A pairs, or help documentation';
      case 'knowledge':
        return 'Upload knowledge base articles, product documentation, or training materials';
      default:
        return 'Select a data type';
    }
  };

  const validFiles = files.filter(f => f.status !== 'error');
  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Data Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Select Data Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['conversations', 'faq', 'knowledge'].map((type) => (
            <button
              key={type}
              onClick={() => setDataType(type as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dataType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getDataTypeIcon(type)}
                <div className="text-left">
                  <div className="font-medium capitalize">{type}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getDataTypeDescription(type)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
          {files.length > 0 && (
            <span className="text-sm text-gray-500">
              {files.length} / {maxFiles} files
            </span>
          )}
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h4>
          <p className="text-gray-600 mb-4">
            Supported formats: {supportedExtensions.join(', ')}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Maximum file size: {maxFileSize}MB • Maximum files: {maxFiles}
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="mx-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedExtensions.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-lg font-semibold text-gray-900">Selected Files</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileData) => (
                <motion.div
                  key={fileData.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(fileData.file.name)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileData.file.name}
                        </p>
                        {fileData.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {fileData.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {fileData.status === 'uploading' && (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileData.status === 'error' && fileData.error && (
                          <p className="text-xs text-red-500">{fileData.error}</p>
                        )}
                      </div>
                      {fileData.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${fileData.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {fileData.progress}% uploaded
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {fileData.status !== 'uploading' && (
                    <Button
                      onClick={() => removeFile(fileData.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress Summary */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-900">
              Uploading files...
            </span>
          </div>
          <div className="text-sm text-blue-700">
            {completedFiles.length} of {validFiles.length} files completed
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {validFiles.length > 0 && (
            <span>
              {validFiles.length} valid file{validFiles.length !== 1 ? 's' : ''} ready for upload
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={validFiles.length === 0 || isUploading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {validFiles.length} File{validFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Guidelines</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Conversations:</strong> CSV/JSON files with customer interactions</li>
          <li>• <strong>FAQ:</strong> Structured Q&A documents or help articles</li>
          <li>• <strong>Knowledge:</strong> Product docs, manuals, or training materials</li>
          <li>• Files should be properly formatted and contain relevant training data</li>
          <li>• Large files will be processed in batches to optimize training</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;