import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Upload, User, X, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { personalityService } from '../../../../services/personalityService';
import { PersonalityFormData } from '../../../../types/personality';

interface PersonalityBasicSettingsProps {
  formData: PersonalityFormData;
  updateFormData: (updates: Partial<PersonalityFormData>) => void;
  userId?: string;
}

export default function PersonalityBasicSettings({ 
  formData, 
  updateFormData, 
  userId 
}: PersonalityBasicSettingsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ bot_name: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const avatarUrl = await personalityService.uploadPersonalityAvatar(userId, file);
      updateFormData({ avatar_url: avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    updateFormData({ avatar_url: undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            Basic Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Configure your AI assistant's basic identity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bot Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Bot Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.bot_name}
              onChange={handleNameChange}
              placeholder="Enter bot name"
              className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-primary-teal focus:border-transparent
                         placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={100}
            />
            <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This is how your AI assistant will introduce itself to customers
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Avatar
          </label>
          <div className="flex items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative">
              {formData.avatar_url ? (
                <div className="relative group">
                  <img
                    src={formData.avatar_url}
                    alt="Bot Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 
                             text-white rounded-full flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 
                               flex items-center justify-center border-2 border-gray-300 dark:border-gray-500">
                  <User className="w-8 h-8 text-gray-400 dark:text-gray-300" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload Avatar'}
                  </Button>
                </label>
                {formData.avatar_url && (
                  <Button
                    onClick={handleRemoveAvatar}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {uploadError}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload a square image (max 5MB). Recommended: 200x200px
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Character Count */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Bot name will be used in AI responses and chat interfaces</span>
        <span>{formData.bot_name.length}/100</span>
      </div>
    </motion.div>
  );
}