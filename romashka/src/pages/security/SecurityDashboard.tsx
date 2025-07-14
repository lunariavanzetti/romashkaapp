import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Users, Key, Lock, FileText, Clock, TrendingUp } from 'lucide-react';
import { complianceService } from '../../services/security/complianceService';
import { auditService } from '../../services/security/auditService';
import { securityService } from '../../services/security/securityService';
import type { ComplianceDashboard, SecurityIncident, SecurityMetrics } from '../../types/security';

const SecurityDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'incidents' | 'audit'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, incidentsData, metricsData] = await Promise.all([
        complianceService.getComplianceDashboard(),
        complianceService.getSecurityIncidents({ status: 'open' }),
        getSecurityMetrics()
      ]);

      setDashboard(dashboardData);
      setIncidents(incidentsData.data || []);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityMetrics = async (): Promise<SecurityMetrics> => {
    // This would typically fetch real metrics from your analytics service
    return {
      total_logins: 1247,
      failed_logins: 23,
      active_sessions: 89,
      blocked_ips: 12,
      security_incidents: 3,
      compliance_score: dashboard?.overall_score || 85,
      last_updated: new Date().toISOString()
    };
  };

  const runComplianceChecks = async () => {
    try {
      setLoading(true);
      await complianceService.runAllComplianceChecks();
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run compliance checks');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              Security & Compliance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor security posture and compliance status across all systems
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runComplianceChecks}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Run Compliance Checks
            </button>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'compliance', label: 'Compliance', icon: Shield },
            { id: 'incidents', label: 'Security Incidents', icon: AlertTriangle },
            { id: 'audit', label: 'Audit Trail', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overall Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Overall Security Status</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceStatusColor(dashboard?.compliance_status || 'unknown')}`}>
                {dashboard?.compliance_status?.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{dashboard?.overall_score || 0}%</div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{dashboard?.automated_fixes || 0}</div>
                <div className="text-sm text-gray-600">Auto-remediated Issues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{dashboard?.pending_reviews || 0}</div>
                <div className="text-sm text-gray-600">Pending Reviews</div>
              </div>
            </div>
          </div>

          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Logins</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics?.total_logins || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed Logins</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics?.failed_logins || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics?.active_sessions || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Blocked IPs</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics?.blocked_ips || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Security Incidents</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics?.security_incidents || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Key className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">API Keys Active</dt>
                    <dd className="text-lg font-medium text-gray-900">--</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard && Object.entries(dashboard.categories).map(([category, score]) => (
              <div key={category} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {category.replace('_', ' ')} Compliance
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(score.status)}`}>
                    {score.status.toUpperCase()}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Score</span>
                    <span className="text-sm font-medium">{score.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        score.score >= 80 ? 'bg-green-500' :
                        score.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score.score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Issues:</span>
                    <span className="font-medium">{score.issues}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Last checked: {new Date(score.last_checked).toLocaleString()}
                  </div>
                </div>
                {score.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {score.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Next Assessment */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Last Assessment:</span>
                <p className="font-medium">{dashboard?.last_assessment ? new Date(dashboard.last_assessment).toLocaleString() : 'Never'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Next Assessment:</span>
                <p className="font-medium">{dashboard?.next_assessment ? new Date(dashboard.next_assessment).toLocaleString() : 'Not scheduled'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-6">
          {/* Recent Incidents */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Security Incidents</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {incidents.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No open security incidents</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="text-sm font-medium text-gray-900">{incident.title}</h4>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                            {incident.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Type: {incident.incident_type} • Status: {incident.status} • 
                          Detected: {new Date(incident.detected_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {incident.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h3>
            <p className="text-gray-600">
              Comprehensive audit trail functionality is available in the dedicated audit section.
              This includes user activity monitoring, data access logs, and compliance reporting.
            </p>
            <div className="mt-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                View Full Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;