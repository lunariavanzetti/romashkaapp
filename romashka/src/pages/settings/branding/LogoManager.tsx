import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Eye, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { BrandConfig } from './BrandSettings';

interface LogoManagerProps {
  config: BrandConfig;
  onConfigUpdate: (updates: Partial<BrandConfig>) => void;
}

interface LogoVariant {
  id: keyof BrandConfig['logos'];
  label: string;
  description: string;
  recommendedSize: string;
  aspectRatio: string;
}

const logoVariants: LogoVariant[] = [
  {
    id: 'primary',
    label: 'Primary Logo',
    description: 'Main logo for headers and branding',
    recommendedSize: '200x60px',
    aspectRatio: 'Wide (3:1 or 4:1)'
  },
  {
    id: 'light',
    label: 'Light Mode Logo',
    description: 'Logo for light backgrounds',
    recommendedSize: '200x60px',
    aspectRatio: 'Wide (3:1 or 4:1)'
  },
  {
    id: 'dark',
    label: 'Dark Mode Logo',
    description: 'Logo for dark backgrounds',
    recommendedSize: '200x60px',
    aspectRatio: 'Wide (3:1 or 4:1)'
  },
  {
    id: 'favicon',
    label: 'Favicon',
    description: 'Small icon for browser tabs',
    recommendedSize: '32x32px',
    aspectRatio: 'Square (1:1)'
  }
];

export default function LogoManager({ config, onConfigUpdate }: LogoManagerProps) {
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(variantId);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], variantId);
    }
  }, []);

  const handleFileUpload = async (file: File, variantId: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(variantId);

    try {
      // Create a data URL for preview (in real app, upload to Supabase Storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        onConfigUpdate({
          logos: {
            ...config.logos,
            [variantId]: dataUrl
          }
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, variantId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, variantId);
    }
  };

  const removeLogo = (variantId: string) => {
    onConfigUpdate({
      logos: {
        ...config.logos,
        [variantId]: ''
      }
    });
  };

  const downloadLogo = (variantId: string) => {
    const logoUrl = config.logos[variantId];
    if (logoUrl) {
      const link = document.createElement('a');
      link.href = logoUrl;
      link.download = `${config.companyName}-${variantId}-logo`;
      link.click();
    }
  };

  const renderLogoCard = (variant: LogoVariant) => {
    const logoUrl = config.logos[variant.id];
    const isUploading = uploading === variant.id;
    const isDragging = dragActive === variant.id;

    return (
      <div 
        key={variant.id}
        className={`
          relative bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed transition-all
          ${isDragging 
            ? 'border-primary-teal bg-primary-teal/5' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
        onDragEnter={(e) => handleDragIn(e, variant.id)}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e, variant.id)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg">{variant.label}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{variant.description}</p>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadLogo(variant.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-teal transition-colors"
                  title="Download logo"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => removeLogo(variant.id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove logo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Logo Preview or Upload Area */}
          {logoUrl ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[120px]">
                <img
                  src={logoUrl}
                  alt={`${variant.label} preview`}
                  className="max-w-full max-h-24 object-contain"
                />
              </div>
              
              {/* Replace Button */}
              <div className="flex items-center justify-center">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-primary-teal-dark transition-colors">
                  <Upload size={16} />
                  Replace Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileInputChange(e, variant.id)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Area */}
              <div className={`
                border-2 border-dashed rounded-lg p-8 text-center min-h-[120px] flex flex-col items-center justify-center transition-all
                ${isUploading 
                  ? 'border-primary-teal bg-primary-teal/5' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}>
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-teal"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-2">
                      <ImageIcon className="text-gray-400" size={32} />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag and drop your logo here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        or click to select
                      </p>
                    </div>
                    
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-primary-teal-dark transition-colors">
                      <Upload size={16} />
                      Select File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileInputChange(e, variant.id)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Size: {variant.recommendedSize}</li>
                  <li>• Aspect ratio: {variant.aspectRatio}</li>
                  <li>• Format: PNG, SVG, or JPG</li>
                  <li>• Max file size: 5MB</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Logo Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload and manage your brand logos for different contexts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {logoVariants.map(renderLogoCard)}
      </div>

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">💡 Pro Tips:</h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Use SVG format for best quality and scalability</li>
          <li>• Ensure logos work on both light and dark backgrounds</li>
          <li>• Keep file sizes small for faster loading</li>
          <li>• Test logos at different sizes to ensure readability</li>
        </ul>
      </div>
    </div>
  );
}