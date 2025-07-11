import React, { useState, useRef } from 'react';
import { Upload, Download, Eye, Trash2, FileText, Image, Video, Music, File } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface FileShareItem {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  conversation_id: string;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

interface FileShareManagerProps {
  conversationId: string;
  onFileUploaded?: (file: FileShareItem) => void;
}

export const FileShareManager: React.FC<FileShareManagerProps> = ({
  conversationId,
  onFileUploaded
}) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileShareItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileShareItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select(`
          *,
          profiles:uploaded_by(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data?.map((file: any) => ({
        ...file,
        uploader_name: file.profiles?.full_name
      })) || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  React.useEffect(() => {
    if (conversationId) {
      loadFiles();
    }
  }, [conversationId]);

  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles.length || !user?.id) return;

    setUploading(true);
    const uploadedFiles: FileShareItem[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `attachments/${conversationId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Save file record
        const { data: fileRecord, error: dbError } = await supabase
          .from('file_attachments')
          .insert({
            conversation_id: conversationId,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user.id
          })
          .select(`
            *,
            profiles:uploaded_by(full_name)
          `)
          .single();

        if (dbError) throw dbError;

        const processedFile = {
          ...fileRecord,
          uploader_name: fileRecord.profiles?.full_name
        };

        uploadedFiles.push(processedFile);
        onFileUploaded?.(processedFile);
      }

      // Refresh file list
      await loadFiles();

    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: FileShareItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const deleteFile = async (file: FileShareItem) => {
    if (!confirm(`Are you sure you want to delete ${file.filename}?`)) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('chat-attachments')
        .remove([file.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      // Refresh file list
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const previewFileContent = async (file: FileShareItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(file.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      setPreviewFile({ ...file, file_path: data.signedUrl });
    } catch (error) {
      console.error('Error creating preview URL:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music size={16} className="text-green-500" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText size={16} className="text-red-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canDeleteFile = (file: FileShareItem) => {
    return user?.id === file.uploaded_by;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Shared Files
          </h3>
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="p-4">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No files shared yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload files to share with the customer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.mime_type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {file.filename}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{file.uploader_name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(file.mime_type.startsWith('image/') || 
                    file.mime_type.startsWith('video/') || 
                    file.mime_type.includes('pdf')) && (
                    <Button
                      variant="ghost"
                      onClick={() => previewFileContent(file)}
                      title="Preview"
                    >
                      <Eye size={14} />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    onClick={() => downloadFile(file)}
                    title="Download"
                  >
                    <Download size={14} />
                  </Button>

                  {canDeleteFile(file) && (
                    <Button
                      variant="ghost"
                      onClick={() => deleteFile(file)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
      />

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewFile(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{previewFile.filename}</h3>
              <Button variant="ghost" onClick={() => setPreviewFile(null)}>
                ×
              </Button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-auto">
              {previewFile.mime_type.startsWith('image/') ? (
                <img
                  src={previewFile.file_path}
                  alt={previewFile.filename}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : previewFile.mime_type.startsWith('video/') ? (
                <video
                  src={previewFile.file_path}
                  controls
                  className="max-w-full h-auto rounded-lg"
                />
              ) : previewFile.mime_type.includes('pdf') ? (
                <iframe
                  src={previewFile.file_path}
                  className="w-full h-[500px] rounded-lg"
                  title={previewFile.filename}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Preview not available for this file type</p>
                  <Button
                    variant="primary"
                    onClick={() => downloadFile(previewFile)}
                    className="mt-4"
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};