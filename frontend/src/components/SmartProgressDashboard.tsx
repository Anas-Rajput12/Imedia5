/**
 * SMART Progress Dashboard Component
 * 
 * Displays quantified student progress with clear status indicators:
 * - Secure (80-100%)
 * - Developing (50-79%)
 * - At Risk (0-49%)
 * 
 * Shows:
 * - Mastery % (0-100)
 * - Attempts count
 * - Error tags
 * - Last practiced date
 * - Confidence signal
 * - Trend (improving/stable/declining)
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  Activity,
  Target,
  Brain,
  Shield,
} from 'lucide-react';
import smartAiTeacherService, { ProgressDashboardResponse } from '@/services/smartAiTeacher.service';

interface SmartProgressDashboardProps {
  studentId: string;
  compact?: boolean;
}

interface TopicProgress {
  topic_id: string;
  topic_name: string;
  subject: string;
  mastery_percent: number;
  status: 'secure' | 'developing' | 'at_risk';
  attempts: number;
  last_practiced: string | null;
  error_tags: string[];
  confidence_signal: number;
  trend: 'improving' | 'stable' | 'declining';
}

export default function SmartProgressDashboard({
  studentId,
  compact = false,
}: SmartProgressDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ProgressDashboardResponse['dashboard'] | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'secure' | 'developing' | 'at_risk'>('all');

  useEffect(() => {
    loadProgress();
  }, [studentId]);

  const loadProgress = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await smartAiTeacherService.getProgressDashboard(studentId);
      setDashboard(response.dashboard);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        No progress data available yet. Start learning to track your progress!
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'developing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'at_risk':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle className="w-5 h-5" />;
      case 'developing':
        return <AlertTriangle className="w-5 h-5" />;
      case 'at_risk':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMasteryColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMasteryBgColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-600';
    if (percent >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const filteredTopics =
    selectedStatus === 'all'
      ? dashboard.topics
      : dashboard.topics.filter((t) => t.status === selectedStatus);

  // Compact view
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Secure</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{dashboard.summary.secure_count}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">Developing</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{dashboard.summary.developing_count}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-red-50 rounded-lg border border-red-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">At Risk</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{dashboard.summary.at_risk_count}</p>
          </motion.div>
        </div>

        {/* Overall Mastery */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Overall Mastery
            </h3>
            <span className={`text-2xl font-bold ${getMasteryColor(dashboard.summary.overall_mastery)}`}>
              {dashboard.summary.overall_mastery}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${getMasteryBgColor(dashboard.summary.overall_mastery)}`}
              style={{ width: `${dashboard.summary.overall_mastery}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Progress Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Track your learning journey</p>
        </div>
        <button
          onClick={loadProgress}
          className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
              80-100%
            </span>
          </div>
          <p className="text-3xl font-bold text-green-700">{dashboard.summary.secure_count}</p>
          <p className="text-sm text-green-600 mt-1">Secure Topics</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300"
        >
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
              50-79%
            </span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{dashboard.summary.developing_count}</p>
          <p className="text-sm text-yellow-600 mt-1">Developing Topics</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-300"
        >
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded-full">
              0-49%
            </span>
          </div>
          <p className="text-3xl font-bold text-red-700">{dashboard.summary.at_risk_count}</p>
          <p className="text-sm text-red-600 mt-1">At Risk Topics</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300"
        >
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{dashboard.summary.total_topics}</p>
          <p className="text-sm text-blue-600 mt-1">Total Topics</p>
        </motion.div>
      </div>

      {/* Overall Mastery Progress */}
      <div className="p-6 bg-white rounded-xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Overall Mastery
          </h3>
          <span className={`text-3xl font-bold ${getMasteryColor(dashboard.summary.overall_mastery)}`}>
            {dashboard.summary.overall_mastery}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getMasteryBgColor(dashboard.summary.overall_mastery)}`}
            style={{ width: `${dashboard.summary.overall_mastery}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'secure', 'developing', 'at_risk'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedStatus === status
                ? status === 'secure'
                  ? 'bg-green-600 text-white'
                  : status === 'developing'
                  ? 'bg-yellow-600 text-white'
                  : status === 'at_risk'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 text-sm opacity-80">
                ({dashboard.topics.filter((t) => t.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Topics ({filteredTopics.length})
        </h3>

        {filteredTopics.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No topics in this category yet.</p>
          </div>
        ) : (
          filteredTopics.map((topic, index) => (
            <motion.div
              key={topic.topic_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white rounded-lg border-2 hover:shadow-md transition-shadow"
              style={{ borderColor: topic.status === 'secure' ? '#86efac' : topic.status === 'developing' ? '#fde047' : '#fca5a5' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getStatusColor(topic.status)}`}>
                    {getStatusIcon(topic.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{topic.topic_name}</h4>
                    <p className="text-sm text-gray-500">{topic.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getMasteryColor(topic.mastery_percent)}`}>
                      {topic.mastery_percent}%
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{topic.status}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all ${getMasteryBgColor(topic.mastery_percent)}`}
                  style={{ width: `${topic.mastery_percent}%` }}
                />
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  <span>{topic.attempts} attempts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {topic.last_practiced
                      ? new Date(topic.last_practiced).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(topic.trend)}
                  <span className="capitalize">{topic.trend}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span>Confidence: {(topic.confidence_signal * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Error Tags */}
              {topic.error_tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topic.error_tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
