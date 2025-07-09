import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { FileText, User, MessageCircle, CheckCircle, Clock, AlertCircle, Send, Edit, Trash2, Plus, Eye, Calendar, Target, Users, Bell, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import type { KnowledgeItem, WorkflowStage, WorkflowComment, WorkflowChecklistItem } from '../../types/knowledge';

interface ContentWorkflowProps {
  onItemSelect?: (item: KnowledgeItem) => void;
  onClose?: () => void;
}

interface WorkflowColumn {
  id: string;
  title: string;
  color: string;
  items: KnowledgeItem[];
  allowedRoles: string[];
  autoActions: string[];
  maxItems?: number;
  description?: string;
}

interface WorkflowUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email: string;
}

const defaultColumns: WorkflowColumn[] = [
  {
    id: 'draft',
    title: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    items: [],
    allowedRoles: ['editor', 'admin'],
    autoActions: [],
    description: 'Content being written and edited'
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-yellow-100 text-yellow-800',
    items: [],
    allowedRoles: ['reviewer', 'admin'],
    autoActions: ['assign_reviewer', 'send_notification'],
    description: 'Content awaiting review and feedback'
  },
  {
    id: 'approved',
    title: 'Approved',
    color: 'bg-green-100 text-green-800',
    items: [],
    allowedRoles: ['admin'],
    autoActions: ['update_status', 'notify_author'],
    description: 'Content approved and ready for publication'
  },
  {
    id: 'published',
    title: 'Published',
    color: 'bg-blue-100 text-blue-800',
    items: [],
    allowedRoles: ['admin'],
    autoActions: ['publish_content', 'update_search_index'],
    description: 'Content live and accessible to users'
  },
  {
    id: 'archived',
    title: 'Archived',
    color: 'bg-red-100 text-red-800',
    items: [],
    allowedRoles: ['admin'],
    autoActions: ['remove_from_search'],
    description: 'Content no longer active'
  }
];

export default function ContentWorkflow({ onItemSelect, onClose }: ContentWorkflowProps) {
  const [columns, setColumns] = useState<WorkflowColumn[]>(defaultColumns);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState<WorkflowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assignedTo: '',
    priority: '',
    dueDate: '',
    author: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    inReview: 0,
    overdue: 0,
    approved: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    fetchWorkflowData();
    fetchUsers();
  }, []);

  const fetchWorkflowData = async () => {
    try {
      setLoading(true);
      const { data: items, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories(name),
          profiles!knowledge_items_created_by_fkey(name, avatar_url)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

             // Group items by workflow stage
       const groupedItems = items.reduce((acc: Record<string, KnowledgeItem[]>, item: KnowledgeItem) => {
         const stage = item.workflow_stage?.stage || 'draft';
         if (!acc[stage]) acc[stage] = [];
         acc[stage].push(item);
         return acc;
       }, {});

      // Update columns with items
      const updatedColumns = columns.map(column => ({
        ...column,
        items: groupedItems[column.id] || []
      }));

      setColumns(updatedColumns);

      // Update statistics
      const totalItems = items.length;
      const inReview = items.filter(item => item.workflow_stage?.stage === 'review').length;
      const overdue = items.filter(item => {
        const dueDate = item.workflow_stage?.due_date;
        return dueDate && new Date(dueDate) < new Date();
      }).length;
      const approved = items.filter(item => item.workflow_stage?.stage === 'approved').length;

      setStatistics({
        totalItems,
        inReview,
        overdue,
        approved,
        avgProcessingTime: 2.5 // This would be calculated from actual data
      });

    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url, email')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = columns.find(col => col.id === source.droppableId);
      if (!column) return;

      const newItems = Array.from(column.items);
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);

      const newColumns = columns.map(col =>
        col.id === source.droppableId
          ? { ...col, items: newItems }
          : col
      );

      setColumns(newColumns);
    } else {
      // Moving between columns
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);
      
      if (!sourceColumn || !destColumn) return;

      const sourceItems = Array.from(sourceColumn.items);
      const destItems = Array.from(destColumn.items);
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, items: sourceItems };
        } else if (col.id === destination.droppableId) {
          return { ...col, items: destItems };
        }
        return col;
      });

      setColumns(newColumns);

      // Update database
      try {
        await supabase
          .from('knowledge_items')
          .update({
            workflow_stage: {
              ...movedItem.workflow_stage,
              stage: destination.droppableId,
              stage_history: [
                ...(movedItem.workflow_stage?.stage_history || []),
                {
                  stage: destination.droppableId,
                  entered_at: new Date().toISOString(),
                  user_id: 'current_user',
                  user_name: 'Current User',
                  automated: false
                }
              ]
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', draggableId);

        // Execute auto actions
        await executeAutoActions(destColumn.autoActions, movedItem);
      } catch (error) {
        console.error('Error updating workflow stage:', error);
        // Revert the UI change
        setColumns(columns);
      }
    }
  };

  const executeAutoActions = async (actions: string[], item: KnowledgeItem) => {
    for (const action of actions) {
      try {
        switch (action) {
          case 'assign_reviewer':
            // Auto-assign a reviewer
            break;
          case 'send_notification':
            // Send notification to relevant users
            break;
          case 'update_status':
            // Update item status
            break;
          case 'notify_author':
            // Notify the author
            break;
          case 'publish_content':
            // Publish the content
            break;
          case 'update_search_index':
            // Update search index
            break;
          case 'remove_from_search':
            // Remove from search index
            break;
        }
      } catch (error) {
        console.error(`Error executing auto action ${action}:`, error);
      }
    }
  };

  const handleItemClick = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedItem) return;

    try {
      const comment: WorkflowComment = {
        id: Date.now().toString(),
        user_id: 'current_user',
        user_name: 'Current User',
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        type: 'comment'
      };

             const updatedWorkflowStage: WorkflowStage = {
         stage: selectedItem.workflow_stage?.stage || 'draft',
         ...selectedItem.workflow_stage,
         comments: [...(selectedItem.workflow_stage?.comments || []), comment]
       };

      await supabase
        .from('knowledge_items')
        .update({
          workflow_stage: updatedWorkflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      setSelectedItem({
        ...selectedItem,
        workflow_stage: updatedWorkflowStage
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleChecklistToggle = async (itemId: string, checklistItemId: string) => {
    if (!selectedItem) return;

    try {
      const updatedChecklist = selectedItem.workflow_stage?.checklist?.map(item =>
        item.id === checklistItemId
          ? { ...item, completed: !item.completed, completed_at: new Date().toISOString() }
          : item
      ) || [];

             const updatedWorkflowStage: WorkflowStage = {
         stage: selectedItem.workflow_stage?.stage || 'draft',
         ...selectedItem.workflow_stage,
         checklist: updatedChecklist
       };

      await supabase
        .from('knowledge_items')
        .update({
          workflow_stage: updatedWorkflowStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      setSelectedItem({
        ...selectedItem,
        workflow_stage: updatedWorkflowStage
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const getItemPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getOverdueStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600' };
    if (diffDays <= 1) return { status: 'due-soon', color: 'text-yellow-600' };
    return { status: 'on-time', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileText className="text-primary-pink" size={24} />
          <h2 className="text-xl font-semibold">Content Workflow</h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Target size={16} />
            Filters
          </motion.button>
          {onClose && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </motion.button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-800">{statistics.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-800">{statistics.inReview}</div>
            <div className="text-sm text-yellow-600">In Review</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-800">{statistics.overdue}</div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">{statistics.approved}</div>
            <div className="text-sm text-green-600">Approved</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">{statistics.avgProcessingTime}d</div>
            <div className="text-sm text-blue-600">Avg Processing</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 border-b border-gray-200 bg-gray-50"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <select
                value={filters.dueDate}
                onChange={(e) => setFilters({...filters, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              >
                <option value="">All Items</option>
                <option value="overdue">Overdue</option>
                <option value="due-today">Due Today</option>
                <option value="due-week">Due This Week</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <select
                value={filters.author}
                onChange={(e) => setFilters({...filters, author: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
              >
                <option value="">All Authors</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Workflow Board */}
      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {columns.map((column) => (
              <div key={column.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{column.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${column.color}`}>
                    {column.items.length}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-4">{column.description}</p>
                
                                 <Droppable droppableId={column.id}>
                   {(provided: any, snapshot: any) => (
                     <div
                       {...provided.droppableProps}
                       ref={provided.innerRef}
                       className={`min-h-[400px] ${
                         snapshot.isDraggingOver ? 'bg-blue-50' : ''
                       }`}
                     >
                       {column.items.map((item, index) => (
                         <Draggable
                           key={item.id}
                           draggableId={item.id}
                           index={index}
                         >
                           {(provided: any, snapshot: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-3 mb-3 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                                getItemPriorityColor(item.priority || 'medium')
                              } ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
                              onClick={() => handleItemClick(item)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-800 line-clamp-2">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-1 ml-2">
                                  {item.workflow_stage?.comments && item.workflow_stage.comments.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <MessageCircle size={12} />
                                      {item.workflow_stage.comments.length}
                                    </div>
                                  )}
                                  {(() => {
                                    const overdueStatus = getOverdueStatus(item.workflow_stage?.due_date);
                                    return overdueStatus && (
                                      <Clock size={12} className={overdueStatus.color} />
                                    );
                                  })()}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <User size={12} />
                                  {item.created_by}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(item.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                              
                              {item.workflow_stage?.checklist && (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-primary-pink h-1 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${(item.workflow_stage.checklist.filter(c => c.completed).length / item.workflow_stage.checklist.length) * 100}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Item Details Modal */}
      {showItemDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
              <button
                onClick={() => setShowItemDetails(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Item Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      columns.find(c => c.id === selectedItem.workflow_stage?.stage)?.color
                    }`}>
                      {selectedItem.workflow_stage?.stage || 'draft'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedItem.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedItem.priority || 'medium'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Author:</span>
                    <span className="ml-2">{selectedItem.created_by}</span>
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <span className="ml-2">{new Date(selectedItem.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              {selectedItem.workflow_stage?.checklist && selectedItem.workflow_stage.checklist.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Checklist</h4>
                  <div className="space-y-2">
                    {selectedItem.workflow_stage.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(selectedItem.id, item.id)}
                          className="rounded border-gray-300 text-primary-pink focus:ring-primary-pink"
                        />
                        <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h4 className="font-medium mb-2">Comments</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedItem.workflow_stage?.comments?.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
                
                {/* Add Comment */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-pink focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}