'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Mail,
  Phone,
  Shield,
  Flag
} from 'lucide-react';

interface Student {
  student_id: string;
  name: string;
  email: string;
  year_group: string;
  average_mastery: number;
  total_sessions: number;
  integrity_flags: number;
  safeguarding_alerts: number;
  last_active: string;
}

interface SafeguardingAlert {
  log_id: string;
  student_id: string;
  student_name: string;
  concern_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  status: 'new' | 'escalated' | 'resolved';
  requires_follow_up: boolean;
}

interface IntegrityFlag {
  attempt_id: string;
  student_id: string;
  student_name: string;
  topic: string;
  timestamp: string;
  request_type: string;
  acted_on_help: boolean;
}

export default function TeacherDashboardPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'safeguarding' | 'integrity'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [safeguardingAlerts, setSafeguardingAlerts] = useState<SafeguardingAlert[]>([]);
  const [integrityFlags, setIntegrityFlags] = useState<IntegrityFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user) return;

      try {
        // Fetch class progress
        const progressResponse = await fetch('http://localhost:8000/api/teacher/class/main/progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          // Transform data for display
          setStudents(progressData.top_performers?.map((p: any) => ({
            student_id: p.student_id,
            name: `Student ${p.student_id.slice(-4)}`,
            email: `${p.student_id}@clerk.com`,
            year_group: '7',
            average_mastery: p.average_mastery,
            total_sessions: Math.floor(Math.random() * 20) + 5,
            integrity_flags: 0,
            safeguarding_alerts: 0,
            last_active: new Date().toISOString(),
          })) || []);
        }

        // Fetch safeguarding alerts
        const safeguardingResponse = await fetch('http://localhost:8000/api/teacher/safeguarding/alerts');
        if (safeguardingResponse.ok) {
          const safeguardingData = await safeguardingResponse.json();
          setSafeguardingAlerts(safeguardingData.alerts || []);
        }

        // Fetch integrity flags
        const integrityResponse = await fetch('http://localhost:8000/api/teacher/integrity/flags');
        if (integrityResponse.ok) {
          const integrityData = await integrityResponse.json();
          setIntegrityFlags(integrityData.recent_flags || []);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherData();
  }, [user]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = yearFilter === 'all' || student.year_group === yearFilter;
    return matchesSearch && matchesYear;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-700';
      case 'escalated': return 'bg-orange-100 text-orange-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in as a teacher</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-sm text-gray-500">Monitor student progress and safeguarding</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                ← Student View
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'safeguarding', label: 'Safeguarding', icon: Shield, badge: safeguardingAlerts.filter(a => a.status !== 'resolved').length },
              { id: 'integrity', label: 'Integrity Flags', icon: Flag, badge: integrityFlags.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Mastery</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.length > 0
                        ? Math.round(students.reduce((sum, s) => sum + s.average_mastery, 0) / students.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Safeguarding Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {safeguardingAlerts.filter(a => a.status !== 'resolved').length}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Flag className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Integrity Flags</p>
                    <p className="text-2xl font-bold text-gray-900">{integrityFlags.length}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Safeguarding Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Recent Safeguarding Alerts
                </h3>
                {safeguardingAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {safeguardingAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.log_id}
                        className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{alert.student_name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm">{alert.concern_type}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No safeguarding alerts</p>
                  </div>
                )}
              </div>

              {/* Integrity Flags */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-600" />
                  Recent Integrity Flags
                </h3>
                {integrityFlags.length > 0 ? (
                  <div className="space-y-3">
                    {integrityFlags.slice(0, 5).map((flag) => (
                      <div
                        key={flag.attempt_id}
                        className="p-4 rounded-lg border border-red-200 bg-red-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{flag.student_name || flag.student_id}</span>
                          <span className="text-xs text-red-600">
                            {new Date(flag.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{flag.topic}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Request: {flag.request_type} • {flag.acted_on_help ? 'Acted on help' : 'Did not act'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No integrity flags</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Filters */}
            <div className="p-4 border-b flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Years</option>
                <option value="5">Year 5</option>
                <option value="6">Year 6</option>
                <option value="7">Year 7</option>
                <option value="8">Year 8</option>
                <option value="9">Year 9</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mastery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">Year {student.year_group}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.average_mastery >= 70 ? 'bg-green-500' :
                                student.average_mastery >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.average_mastery}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{student.average_mastery}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.total_sessions}</td>
                      <td className="px-6 py-4">
                        {student.integrity_flags > 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                            {student.integrity_flags}
                          </span>
                        ) : (
                          <span className="text-green-600"></span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(student.last_active).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Safeguarding Tab */}
        {activeTab === 'safeguarding' && (
          <div className="space-y-4">
            {safeguardingAlerts.map((alert) => (
              <motion.div
                key={alert.log_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5" />
                      <h3 className="text-lg font-bold">{alert.concern_type}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Student:</span>
                        <span className="ml-2 font-medium">{alert.student_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {alert.requires_follow_up && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Requires follow-up action</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50">
                      View Details
                    </button>
                    {alert.status !== 'resolved' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {safeguardingAlerts.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Safeguarding Alerts</h3>
                <p className="text-gray-500">All clear! No safeguarding concerns to address.</p>
              </div>
            )}
          </div>
        )}

        {/* Integrity Tab */}
        {activeTab === 'integrity' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">Academic Integrity Flags</h3>
              <p className="text-sm text-gray-500 mt-1">Students requesting answers instead of learning</p>
            </div>
            <div className="divide-y divide-gray-200">
              {integrityFlags.map((flag) => (
                <div key={flag.attempt_id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Flag className="w-5 h-5 text-red-600" />
                        <span className="font-semibold">{flag.student_name || flag.student_id}</span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          {flag.request_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Topic: {flag.topic}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(flag.timestamp).toLocaleString()} •{' '}
                        {flag.acted_on_help ? 'Student acted on help provided' : 'Student did not act on help'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
                        Review
                      </button>
                      <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {integrityFlags.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Integrity Flags</h3>
                <p className="text-gray-500">Great! No academic dishonesty detected.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
