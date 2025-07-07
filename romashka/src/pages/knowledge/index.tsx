import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, BarChart3, Settings, ArrowLeft, Globe } from 'lucide-react';
import KnowledgeManager from './KnowledgeManager';
import ContentEditor from '../../components/knowledge/ContentEditor';
import KnowledgeAnalytics from '../../components/knowledge/KnowledgeAnalytics';
import { UrlScanner } from './UrlScanner';
import type { KnowledgeItem } from '../../services/contentIngestion';

type ViewMode = 'manager' | 'editor' | 'analytics' | 'scanner';

export default function KnowledgeBase() {
  const [viewMode, setViewMode] = useState<ViewMode>('manager');
  const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>(undefined);

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setEditingItem(undefined);
    setViewMode('editor');
  };

  const handleSaveItem = (item: KnowledgeItem) => {
    setEditingItem(undefined);
    setViewMode('manager');
  };

  const handleCancelEdit = () => {
    setEditingItem(undefined);
    setViewMode('manager');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'manager':
        return <KnowledgeManager onEditItem={handleEditItem} onCreateNew={handleCreateNew} />;
      case 'editor':
        return (
          <ContentEditor
            item={editingItem}
            onSave={handleSaveItem}
            onCancel={handleCancelEdit}
          />
        );
      case 'analytics':
        return <KnowledgeAnalytics />;
      case 'scanner':
        return <UrlScanner onScanComplete={(result) => {
          console.log('Scan completed:', result);
          // You can handle the scan completion here
        }} />;
      default:
        return <KnowledgeManager onEditItem={handleEditItem} onCreateNew={handleCreateNew} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-pink/10 via-white to-primary-purple/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {viewMode !== 'manager' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('manager')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back
                </motion.button>
              )}
              <div className="flex items-center gap-3">
                <BookOpen className="text-primary-pink" size={28} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
                  <p className="text-sm text-gray-600">
                    {viewMode === 'manager' && 'Manage your knowledge content'}
                    {viewMode === 'editor' && (editingItem ? 'Edit knowledge item' : 'Create new knowledge item')}
                    {viewMode === 'analytics' && 'Knowledge analytics and insights'}
                    {viewMode === 'scanner' && 'Scan websites for content extraction'}
                  </p>
                </div>
              </div>
            </div>

            {viewMode === 'manager' && (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('scanner')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Globe size={20} />
                  URL Scanner
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('analytics')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <BarChart3 size={20} />
                  Analytics
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 transition-colors"
                >
                  <Plus size={20} />
                  Add Content
                </motion.button>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          {viewMode === 'manager' && (
            <div className="flex gap-1 mt-4">
              <button
                onClick={() => setViewMode('manager')}
                className="px-4 py-2 text-sm font-medium text-primary-pink border-b-2 border-primary-pink"
              >
                Content Manager
              </button>
              <button
                onClick={() => setViewMode('scanner')}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                URL Scanner
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Analytics
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
} 