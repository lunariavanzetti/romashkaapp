import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Clock, Tag, FileText, Edit, Save, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  location?: string;
  timezone?: string;
  language: string;
  tags: string[];
  custom_fields: Record<string, any>;
  total_conversations: number;
  avg_satisfaction?: number;
  last_interaction?: string;
  created_at: string;
}

interface ConversationNote {
  id: string;
  conversation_id: string;
  agent_id: string;
  note: string;
  is_internal: boolean;
  created_at: string;
  agent_name?: string;
}

interface CustomerProfileProps {
  customerId: string;
  conversationId: string;
  isVisible: boolean;
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customerId,
  conversationId,
  isVisible,
  onClose
}) => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<CustomerProfile | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isVisible && customerId) {
      loadCustomerData();
    }
  }, [isVisible, customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // Load customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading customer profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
        setEditedProfile(profileData);
      }

      // Load conversation history
      const { data: historyData, error: historyError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          priority,
          created_at,
          updated_at,
          customer_satisfaction,
          resolution_time_seconds,
          messages:messages(count)
        `)
        .eq('user_email', profile?.email || '')
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error loading conversation history:', historyError);
      } else {
        setConversationHistory(historyData || []);
      }

      // Load conversation notes
      const { data: notesData, error: notesError } = await supabase
        .from('conversation_notes')
        .select(`
          *,
          profiles:agent_id(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error loading notes:', notesError);
      } else {
        setNotes(notesData?.map((note: any) => ({
          ...note,
          agent_name: note.profiles?.full_name
        })) || []);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile || !user?.id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('customer_profiles')
        .upsert({
          ...editedProfile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user?.id) return;

    try {
      const { error } = await supabase
        .from('conversation_notes')
        .insert({
          conversation_id: conversationId,
          agent_id: user.id,
          note: newNote.trim(),
          is_internal: true
        });

      if (error) throw error;

      setNewNote('');
      loadCustomerData();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !editedProfile) return;

    const updatedProfile = {
      ...editedProfile,
      tags: [...editedProfile.tags, newTag.trim()]
    };

    setEditedProfile(updatedProfile);
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!editedProfile) return;

    const updatedProfile = {
      ...editedProfile,
      tags: editedProfile.tags.filter(tag => tag !== tagToRemove)
    };

    setEditedProfile(updatedProfile);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Profile
            </h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="primary" onClick={saveProfile} disabled={saving}>
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    <X size={16} />
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-pink"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Profile Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User size={20} className="mr-2" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.name || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{profile?.name || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedProfile?.email || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white flex items-center">
                          <Mail size={16} className="mr-2" />
                          {profile?.email || 'N/A'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedProfile?.phone || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white flex items-center">
                          <Phone size={16} className="mr-2" />
                          {profile?.phone || 'N/A'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Company</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.company || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, company: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">{profile?.company || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile?.location || ''}
                          onChange={(e) => setEditedProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white flex items-center">
                          <MapPin size={16} className="mr-2" />
                          {profile?.location || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Tag size={20} className="mr-2" />
                    Tags
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editedProfile?.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-pink text-white"
                      >
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        placeholder="Add new tag"
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink"
                      />
                      <Button variant="primary" onClick={addTag}>
                        <Plus size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                      <p className="text-xl font-bold text-primary-pink">{profile?.total_conversations || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Satisfaction</p>
                      <p className="text-xl font-bold text-primary-green">
                        {profile?.avg_satisfaction ? `${profile.avg_satisfaction.toFixed(1)}/5` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Interaction</p>
                      <p className="text-sm text-gray-900 dark:text-white flex items-center">
                        <Clock size={14} className="mr-1" />
                        {profile?.last_interaction ? formatTimeAgo(profile.last_interaction) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customer Since</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation History & Notes */}
              <div className="space-y-6">
                {/* Conversation History */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Recent Conversations</h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {conversationHistory.length === 0 ? (
                      <p className="text-gray-500 text-sm">No conversation history available</p>
                    ) : (
                      conversationHistory.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="bg-white dark:bg-gray-600 rounded-lg p-3 border"
                        >
                          <div className="flex justify-between items-start mb-2">
                                                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                             conversation.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                             conversation.status === 'escalated' ? 'bg-orange-100 text-orange-800' :
                             conversation.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-gray-100 text-gray-800'
                           }`}>
                              {conversation.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(conversation.created_at)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{conversation.messages?.[0]?.count || 0} messages</span>
                            {conversation.customer_satisfaction && (
                              <span className="text-sm font-medium">
                                ⭐ {conversation.customer_satisfaction}/5
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Conversation Notes */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText size={20} className="mr-2" />
                    Conversation Notes
                  </h3>

                  {/* Add Note */}
                  <div className="mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this conversation..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-pink h-20"
                    />
                    <div className="flex justify-end mt-2">
                      <Button variant="primary" onClick={addNote} disabled={!newNote.trim()}>
                        Add Note
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {notes.length === 0 ? (
                      <p className="text-gray-500 text-sm">No notes for this conversation</p>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white dark:bg-gray-600 rounded-lg p-3 border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium">{note.agent_name || 'Agent'}</span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(note.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{note.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};