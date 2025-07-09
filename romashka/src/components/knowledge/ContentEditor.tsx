import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, History, Tag, Globe, Edit3, X, Bold, Italic, Underline, Link, Image, Table, List, Code, Undo, Redo, Upload, Users, MessageCircle, Clock, FileText, Sparkles } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapUnderline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import TiptapTable from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import { useDropzone } from 'react-dropzone';
import { useHotkeys } from 'react-hotkeys-hook';
import { supabase } from '../../services/supabaseClient';
import type { KnowledgeItem, ContentTemplate, WorkflowStage } from '../../types/knowledge';

interface ContentEditorProps {
  item?: KnowledgeItem;
  onSave?: (item: KnowledgeItem) => void;
  onCancel?: () => void;
  collaborative?: boolean;
  template?: ContentTemplate;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  cursor_position?: number;
  last_seen?: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' }
];

export default function ContentEditor({ item, onSave, onCancel, collaborative = false, template }: ContentEditorProps) {
  const [title, setTitle] = useState(item?.title || template?.name || '');
  const [content, setContent] = useState(item?.content || template?.content || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || template?.category_id || '');
  const [tags, setTags] = useState<string[]>(item?.tags || template?.tags || []);
  const [language, setLanguage] = useState(item?.language || template?.default_language || 'en');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived' | 'pending_review'>(item?.status || 'draft');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(item?.priority || 'medium');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>(item?.workflow_stage || {
    stage: 'draft',
    comments: [],
    checklist: []
  });
  const [newTag, setNewTag] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(template || null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [translationTabs, setTranslationTabs] = useState<string[]>([language]);
  const [currentTranslationTab, setCurrentTranslationTab] = useState(language);
  const [translations, setTranslations] = useState<Record<string, { title: string; content: string }>>({});
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);

  const autoSaveRef = useRef<NodeJS.Timeout>();
  const editorRef = useRef<any>(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-pink underline'
        }
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      TiptapTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300'
        }
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({
        multicolor: true
      }),
      Typography,
      Placeholder.configure({
        placeholder: 'Start writing your knowledge content...'
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      
      // Update word count and read time
      const text = editor.getText();
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
      setReadTime(Math.ceil(words / 200)); // Assuming 200 words per minute
      
      // Trigger auto-save
      if (autoSaveEnabled) {
        clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
          handleAutoSave();
        }, 2000);
      }
    }
  });

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    onDrop: useCallback((acceptedFiles) => {
      acceptedFiles.forEach(file => {
        handleFileUpload(file);
      });
    }, [])
  });

  // Keyboard shortcuts
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    handleSave();
  });
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    editor?.commands.undo();
  });
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    editor?.commands.redo();
  });
  useHotkeys('ctrl+b', (e) => {
    e.preventDefault();
    editor?.commands.toggleBold();
  });
  useHotkeys('ctrl+i', (e) => {
    e.preventDefault();
    editor?.commands.toggleItalic();
  });

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
    if (item?.id) {
      fetchVersions(item.id);
      if (collaborative) {
        fetchCollaborators(item.id);
      }
    }
    generateAiSuggestions();
  }, [item?.id, collaborative]);

  useEffect(() => {
    // Calculate quality score based on content
    calculateQualityScore();
  }, [content, title, tags, wordCount]);

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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchVersions = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_versions')
        .select('*')
        .eq('item_id', itemId)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchCollaborators = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_collaborators')
        .select(`
          *,
          profiles(id, name, avatar_url)
        `)
        .eq('knowledge_item_id', itemId)
        .eq('is_active', true);

      if (error) throw error;
      setCollaborators(data?.map(c => ({
        id: c.profiles.id,
        name: c.profiles.name,
        avatar: c.profiles.avatar_url,
        cursor_position: c.cursor_position,
        last_seen: c.last_seen
      })) || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const generateAiSuggestions = async () => {
    if (!content || content.length < 100) return;

    try {
      // This would integrate with an AI service
      const suggestions = [
        'Consider adding more specific examples',
        'Include relevant links to related content',
        'Add a summary section at the beginning',
        'Break down complex concepts into bullet points',
        'Include visual elements like diagrams or charts'
      ];
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const calculateQualityScore = () => {
    let score = 0;
    
    // Title quality (20%)
    if (title.length > 10 && title.length < 100) score += 20;
    else if (title.length > 0) score += 10;
    
    // Content quality (30%)
    if (wordCount > 100) score += 30;
    else if (wordCount > 50) score += 20;
    else if (wordCount > 10) score += 10;
    
    // Tags quality (15%)
    if (tags.length >= 3) score += 15;
    else if (tags.length >= 1) score += 10;
    
    // Category quality (10%)
    if (categoryId) score += 10;
    
    // Structure quality (25%)
    const hasHeaders = content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>');
    const hasLists = content.includes('<ul>') || content.includes('<ol>');
    const hasLinks = content.includes('<a href');
    
    if (hasHeaders) score += 10;
    if (hasLists) score += 8;
    if (hasLinks) score += 7;
    
    setQualityScore(Math.min(score, 100));
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `content-uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('knowledge-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('knowledge-assets')
        .getPublicUrl(filePath);

      if (file.type.startsWith('image/')) {
        editor?.commands.setImage({ src: publicUrl });
      } else {
        editor?.commands.insertContent(`<a href="${publicUrl}" target="_blank">${file.name}</a>`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setContent(template.content);
    editor?.commands.setContent(template.content);
    setTags([...template.tags]);
    if (template.category_id) {
      setCategoryId(template.category_id);
    }
    setShowTemplates(false);
  };

  const handleAddTranslation = (langCode: string) => {
    if (!translationTabs.includes(langCode)) {
      setTranslationTabs([...translationTabs, langCode]);
      setTranslations({
        ...translations,
        [langCode]: { title: '', content: '' }
      });
    }
  };

  const handleAutoSave = async () => {
    if (!item?.id || !autoSaveEnabled) return;
    
    try {
      await supabase
        .from('knowledge_items')
        .update({
          title: title.trim(),
          content: content.trim(),
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const itemData = {
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId || null,
        tags,
        language: currentTranslationTab,
        status,
        priority,
        updated_at: new Date().toISOString(),
        word_count: wordCount,
        read_time: readTime,
        quality_score: qualityScore,
        workflow_stage: workflowStage,
        ai_suggestions: aiSuggestions
      };

      if (item?.id) {
        // Update existing item
        const { data, error } = await supabase
          .from('knowledge_items')
          .update(itemData)
          .eq('id', item.id)
          .select()
          .single();

        if (error) throw error;
        
        // Save version
        await supabase
          .from('knowledge_versions')
          .insert({
            item_id: item.id,
            content: content.trim(),
            title: title.trim(),
            tags,
            version: (versions.length || 0) + 1,
            author: 'current_user', // Replace with actual user
            changes_description: 'Content updated',
            created_at: new Date().toISOString()
          });

        onSave?.(data);
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('knowledge_items')
          .insert({
            ...itemData,
            source_type: 'manual',
            confidence_score: 1.0,
            version: 1,
            created_by: 'current_user', // Replace with actual user
            updated_by: 'current_user',
            created_at: new Date().toISOString(),
            effectiveness_score: 0,
            helpful_count: 0,
            not_helpful_count: 0,
            usage_count: 0
          })
          .select()
          .single();

        if (error) throw error;
        onSave?.(data);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSaving(false);
    }
  };

  const MenuBar = () => {
    if (!editor) return null;

    return (
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => editor.commands.toggleBold()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.commands.toggleItalic()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.commands.toggleUnderline()}
          className={`p-2 rounded ${editor.isActive('underline') ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          <Underline size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor.commands.toggleHeading({ level: 1 })}
          className={`p-2 rounded text-sm font-medium ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          H1
        </button>
        <button
          onClick={() => editor.commands.toggleHeading({ level: 2 })}
          className={`p-2 rounded text-sm font-medium ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          H2
        </button>
        <button
          onClick={() => editor.commands.toggleBulletList()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.commands.toggleCodeBlock()}
          className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-primary-pink text-white' : 'text-gray-700 hover:bg-gray-200'}`}
        >
          <Code size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          onClick={() => editor.commands.undo()}
          className="p-2 rounded text-gray-700 hover:bg-gray-200"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.commands.redo()}
          className="p-2 rounded text-gray-700 hover:bg-gray-200"
        >
          <Redo size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <div {...getRootProps()} className="inline-block">
          <input {...getInputProps()} />
          <button className="p-2 rounded text-gray-700 hover:bg-gray-200">
            <Upload size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Edit3 className="text-primary-pink" size={24} />
          <h2 className="text-xl font-semibold">
            {item ? 'Edit Knowledge Item' : 'Create New Knowledge Item'}
          </h2>
          {collaborative && (
            <div className="flex items-center gap-2">
              <Users className="text-primary-green" size={16} />
              <span className="text-sm text-gray-600">{collaborators.length} collaborators</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={14} />
            <span>{wordCount} words • {readTime} min read</span>
            {lastSaved && (
              <span className="text-green-600">
                • Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FileText size={16} />
              Templates
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAiSuggestions(!showAiSuggestions)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Sparkles size={16} />
              AI Suggestions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye size={16} />
              Preview
            </motion.button>
            {item && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <History size={16} />
                History
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
                Cancel
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Translation Tabs */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 bg-gray-50">
        <Globe className="text-gray-500" size={16} />
        <div className="flex items-center gap-2">
          {translationTabs.map(lang => (
            <button
              key={lang}
              onClick={() => setCurrentTranslationTab(lang)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                currentTranslationTab === lang
                  ? 'bg-primary-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {languages.find(l => l.code === lang)?.name || lang}
            </button>
          ))}
          <select
            onChange={(e) => handleAddTranslation(e.target.value)}
            value=""
            className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg border-none"
          >
            <option value="">Add Language</option>
            {languages.filter(l => !translationTabs.includes(l.code)).map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter knowledge item title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <MenuBar />
                <div className={`min-h-[400px] ${isDragActive ? 'bg-blue-50 border-blue-300' : ''}`}>
                  <EditorContent 
                    editor={editor}
                    className="prose max-w-none p-4 min-h-[400px] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quality Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Content Quality</span>
                <span className={`text-sm font-bold ${
                  qualityScore >= 80 ? 'text-green-600' :
                  qualityScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {qualityScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    qualityScore >= 80 ? 'bg-green-500' :
                    qualityScore >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>

            {/* AI Suggestions */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 rounded-lg p-4 border border-blue-200"
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={16} />
                  AI Suggestions
                </h3>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Preview */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="prose max-w-none">
                  <h4 className="text-xl font-bold mb-2">{title}</h4>
                  <div 
                    className="content-preview"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Publishing</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 transition-colors"
                  >
                    <Tag size={16} />
                  </motion.button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-save Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Auto-save</label>
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-pink focus:ring-offset-2 ${
                  autoSaveEnabled ? 'bg-primary-pink' : 'bg-gray-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoSaveEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Templates */}
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <h3 className="text-sm font-semibold mb-3">Content Templates</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-gray-500 text-xs">{template.description}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Version History */}
            {showHistory && versions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <h3 className="text-sm font-semibold mb-3">Version History</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {versions.map(version => (
                    <div key={version.id} className="text-xs text-gray-600 p-2 bg-white rounded border">
                      <div className="font-medium">Version {version.version}</div>
                      <div>{new Date(version.created_at).toLocaleDateString()}</div>
                      {version.changes_description && (
                        <div className="text-gray-500 mt-1">{version.changes_description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Collaborators */}
            {collaborative && collaborators.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Active Collaborators</h3>
                <div className="space-y-2">
                  {collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-pink rounded-full flex items-center justify-center text-white text-xs">
                        {collaborator.name.charAt(0)}
                      </div>
                      <span className="text-sm">{collaborator.name}</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 