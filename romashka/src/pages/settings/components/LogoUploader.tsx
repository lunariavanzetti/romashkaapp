import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import { supabase } from '../../../lib/supabase';

interface LogoUploaderProps {
  currentLogo: {
    light: string;
    dark: string;
    favicon: string;
  };
  onLogoUpload: (logoUrls: { light: string; dark: string; favicon: string }) => void;
}

export default function LogoUploader({ currentLogo, onLogoUpload }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please upload a PNG, JPG, SVG, or WebP image file'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      };
    }

    return { valid: true };
  };

  const generateLogoVariants = async (file: File): Promise<{ light: string; dark: string; favicon: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/logos/logo-${Date.now()}.${fileExt}`;

    // Upload main logo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(uploadData.path);

    const logoUrl = urlData.publicUrl;

    // For now, use the same image for all variants
    // In a production app, you might want to generate optimized variants
    return {
      light: logoUrl,
      dark: logoUrl,
      favicon: logoUrl
    };
  };

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('idle');
      setErrorMessage('');

      const logoUrls = await generateLogoVariants(file);
      onLogoUpload(logoUrls);
      
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onLogoUpload({
      light: '',
      dark: '',
      favicon: ''
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const hasLogo = currentLogo.light || currentLogo.dark;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-primary-teal bg-primary-teal/5'
            : hasLogo
            ? 'border-gray-200 dark:border-gray-700'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-teal hover:bg-primary-teal/5'
        } ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        onClick={!uploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-teal mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Uploading logo...
            </p>
          </div>
        ) : hasLogo ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={currentLogo.light}
                alt="Current logo"
                className="h-16 w-auto max-w-[200px] object-contain"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Click to replace logo
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, SVG up to 5MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary-teal/10 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-primary-teal" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Upload your logo
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG, SVG up to 5MB
            </p>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-md"
          >
            <CheckCircle className="w-3 h-3" />
            Uploaded
          </motion.div>
        )}

        {uploadStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 text-xs rounded-md"
          >
            <AlertCircle className="w-3 h-3" />
            Failed
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      {uploadStatus === 'error' && errorMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </motion.div>
      )}

      {/* Logo Guidelines */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>Logo Guidelines:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Use a transparent background (PNG) for best results</li>
          <li>Recommended size: 200x60px or similar aspect ratio</li>
          <li>SVG format provides the best scalability</li>
          <li>High contrast logos work better across themes</li>
        </ul>
      </div>
    </div>
  );
}