/**
 * Human Agent Dashboard
 * Real-time dashboard for managing customer escalations and live chat
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Activity,
  User
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { HumanAgentService, HumanAgent, EscalationRequest } from '../../services/humanAgentService';
import { useAuth } from '../../hooks/useAuth';

interface AgentStats {
  totalEscalations: number;
  resolvedEscalations: number;
  pendingEscalations: number;
  activeEscalations: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

export default function HumanAgentDashboard() {
  const [agents, setAgents] = useState<HumanAgent[]>([]);
  const [escalations, setEscalations] = useState<EscalationRequest[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'escalations' | 'agents'>('overview');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agentsData, escalationsData, statsData] = await Promise.all([
        HumanAgentService.getHumanAgents(),
        HumanAgentService.getEscalationRequests(),
        HumanAgentService.getAgentMetrics()
      ]);

      setAgents(agentsData);
      setEscalations(escalationsData);
      setAgentStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAssignEscalation = async (escalationId: string, agentId: string) => {
    try {
      await HumanAgentService.assignEscalation(escalationId, agentId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning escalation:', error);
    }
  };

  const handleResolveEscalation = async (escalationId: string) => {
    try {
      await HumanAgentService.resolveEscalation(escalationId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error resolving escalation:', error);
    }
  };

  const handleUpdateAgentStatus = async (agentId: string, status: HumanAgent['status']) => {
    try {
      await HumanAgentService.updateAgentStatus(agentId, status);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  const getStatusIcon = (status: HumanAgent['status']) => {
    switch (status) {
      case 'available': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'busy': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'away': return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case 'offline': return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getEscalationStatusColor = (status: EscalationRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-button rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary-deep-blue dark:text-white">
                Human Agent Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage customer escalations and agent assignments
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
            { id: 'agents', label: 'Agents', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-primary-deep-blue dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Escalations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {agentStats?.totalEscalations || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Resolution Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(agentStats?.resolutionRate || 0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {agentStats?.averageResolutionTime || 0}m
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Agents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {agents.filter(a => a.status !== 'offline').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Escalations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Escalations</h3>
            <div className="space-y-3">
              {escalations.slice(0, 5).map((escalation) => (
                <div key={escalation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getEscalationStatusColor(escalation.status)}`}>
                      {escalation.status}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {escalation.escalation_reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(escalation.created_at)}
                      </p>
                    </div>
                  </div>
                  {escalation.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Escalations Tab */}
      {selectedTab === 'escalations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white/20 backdrop-blur-glass overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Escalations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Customer Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Assigned Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {escalations.map((escalation) => (
                  <tr key={escalation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEscalationStatusColor(escalation.status)}`}>
                        {escalation.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {escalation.escalation_reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {escalation.customer_message}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {escalation.assigned_agent_id ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Agent {escalation.assigned_agent_id.slice(0, 8)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(escalation.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      {escalation.status === 'pending' && (
                        <select
                          onChange={(e) => handleAssignEscalation(escalation.id, e.target.value)}
                          className="text-xs px-2 py-1 border rounded"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to...</option>
                          {agents.filter(a => a.status === 'available').map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                          ))}
                        </select>
                      )}
                      {escalation.status === 'assigned' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveEscalation(escalation.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Agents Tab */}
      {selectedTab === 'agents' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-white/20 backdrop-blur-glass"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(agent.status)}
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 capitalize">
                    {agent.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Assigned Chats</span>
                  <span className="text-gray-900 dark:text-white">{agent.assigned_conversations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Last Active</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(agent.last_active).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <select
                  value={agent.status}
                  onChange={(e) => handleUpdateAgentStatus(agent.id, e.target.value as HumanAgent['status'])}
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}