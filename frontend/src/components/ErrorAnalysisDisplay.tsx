'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter,
  Calendar,
  BookOpen,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ErrorTag {
  error_code: string;
  error_name: string;
  count: number;
  last_seen: string;
  corrected?: boolean;
  corrected_at?: string;
}

interface ErrorAnalysis {
  topic_id: string;
  topic_name: string;
  subject: string;
  total_errors: number;
  error_tags: ErrorTag[];
  error_rate: number;
  improvement_trend: 'improving' | 'stable' | 'declining';
}

interface ErrorAnalysisDisplayProps {
  studentId: string;
  compact?: boolean;
}

export default function ErrorAnalysisDisplay({
  studentId,
  compact = false,
}: ErrorAnalysisDisplayProps) {
  const [errorData, setErrorData] = useState<ErrorAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchErrorData();
  }, [studentId]);

  const fetchErrorData = async () => {
    try {
      // In production, this would call a dedicated error analysis endpoint
      // For now, we'll fetch from mastery endpoint and extract error data
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/teaching/mastery/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        // Transform mastery data into error analysis format
        const errorAnalysis = transformMasteryToErrorAnalysis(data.summary);
        setErrorData(errorAnalysis);
      }
    } catch (error) {
      console.error('Error fetching error data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformMasteryToErrorAnalysis = (summary: any): ErrorAnalysis[] => {
    // This is a placeholder transformation
    // In production, you'd have a dedicated error analysis endpoint
    const allTopics = [
      ...(summary.secure || []),
      ...(summary.developing || []),
      ...(summary.at_risk || []),
    ];

    return allTopics
      .filter((topic: any) => topic.error_tags && topic.error_tags.length > 0)
      .map((topic: any) => ({
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        subject: topic.subject,
        total_errors: topic.error_tags.reduce((sum: number, tag: any) => sum + (tag.count || 1), 0),
        error_tags: topic.error_tags,
        error_rate: Math.round((topic.error_tags.length / (topic.attempts_count || 1)) * 100),
        improvement_trend: topic.status === 'secure' ? 'improving' : topic.status === 'at_risk' ? 'declining' : 'stable',
      }));
  };

  const getErrorTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      arithmetic: 'text-red-600 bg-red-50 border-red-200',
      method: 'text-orange-600 bg-orange-50 border-orange-200',
      misconception: 'text-purple-600 bg-purple-50 border-purple-200',
      careless: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      sign: 'text-blue-600 bg-blue-50 border-blue-200',
      place_value: 'text-green-600 bg-green-50 border-green-200',
      fraction: 'text-pink-600 bg-pink-50 border-pink-200',
      algebra: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    };
    return colors[type] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'arithmetic':
        return <BarChart3 className="w-4 h-4" />;
      case 'method':
        return <Target className="w-4 h-4" />;
      case 'misconception':
        return <Lightbulb className="w-4 h-4" />;
      case 'careless':
        return <AlertCircle className="w-4 h-4" />;
      case 'sign':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTotalErrors = () => {
    return errorData.reduce((sum, topic) => sum + topic.total_errors, 0);
  };

  const getMostCommonErrors = () => {
    const errorCounts: Record<string, number> = {};

    errorData.forEach(topic => {
      topic.error_tags.forEach((tag: ErrorTag) => {
        const key = tag.error_code || tag.error_name;
        errorCounts[key] = (errorCounts[key] || 0) + (tag.count || 1);
      });
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compact View
  if (compact) {
    const mostCommon = getMostCommonErrors();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Error Analysis
        </h3>

        <div className="space-y-3">
          {/* Total Errors */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Errors</span>
            <span className="text-lg font-bold text-gray-900">{getTotalErrors()}</span>
          </div>

          {/* Most Common Errors */}
          {mostCommon.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Most Common</p>
              <div className="space-y-1">
                {mostCommon.slice(0, 3).map(([errorName, count], index) => (
                  <div key={errorName} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 capitalize">{errorName.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full View
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Error Analysis
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track and understand common mistakes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={errorTypeFilter}
              onChange={(e) => setErrorTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Error Types</option>
              <option value="arithmetic">Arithmetic</option>
              <option value="method">Method</option>
              <option value="misconception">Misconception</option>
              <option value="careless">Careless</option>
              <option value="sign">Sign</option>
              <option value="fraction">Fraction</option>
              <option value="algebra">Algebra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Errors</p>
          <p className="text-3xl font-bold text-red-600">{getTotalErrors()}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Topics with Errors</p>
          <p className="text-3xl font-bold text-orange-600">{errorData.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Corrected</p>
          <p className="text-3xl font-bold text-green-600">
            {errorData.reduce((sum, topic) => sum + topic.error_tags.filter((t: any) => t.corrected).length, 0)}
          </p>
        </div>
      </div>

      {/* Most Common Errors */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Most Common Errors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {getMostCommonErrors().map(([errorName, count], index) => (
            <div
              key={errorName}
              className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-red-600">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900 capitalize">
                  {errorName.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-red-600">{count} occurrences</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error by Topic */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Errors by Topic</h4>
        <div className="space-y-3">
          {errorData.map((topic) => (
            <ErrorTopicCard
              key={topic.topic_id}
              topic={topic}
              isExpanded={selectedTopic === topic.topic_id}
              onToggle={() => setSelectedTopic(selectedTopic === topic.topic_id ? null : topic.topic_id)}
              getErrorTypeColor={getErrorTypeColor}
              getErrorTypeIcon={getErrorTypeIcon}
            />
          ))}
        </div>

        {errorData.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">No errors detected! Great work!</p>
            <p className="text-sm mt-1">Keep practicing to maintain this perfect record.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Error Topic Card Component
function ErrorTopicCard({
  topic,
  isExpanded,
  onToggle,
  getErrorTypeColor,
  getErrorTypeIcon,
}: {
  topic: ErrorAnalysis;
  isExpanded: boolean;
  onToggle: () => void;
  getErrorTypeColor: (type: string) => string;
  getErrorTypeIcon: (type: string) => React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Card Header */}
      <div
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900">{topic.topic_name}</h5>
              <p className="text-sm text-gray-500">
                {topic.total_errors} errors • {topic.error_rate}% error rate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {topic.improvement_trend === 'improving' && (
              <TrendingUp className="w-5 h-5 text-green-600" />
            )}
            {topic.improvement_trend === 'declining' && (
              <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 border-t border-gray-200"
        >
          <h6 className="font-semibold text-gray-900 mb-3 text-sm">Error Breakdown</h6>
          <div className="space-y-2">
            {topic.error_tags.map((tag: ErrorTag, index: number) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getErrorTypeColor(tag.error_code)}`}
              >
                <div className="flex items-center gap-2">
                  {getErrorTypeIcon(tag.error_code)}
                  <div>
                    <p className="font-medium text-sm">{tag.error_name || tag.error_code}</p>
                    <p className="text-xs opacity-75">
                      Last seen: {new Date(tag.last_seen).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{tag.count || 1}x</span>
                  {tag.corrected && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Remediation Tips */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Study Tips</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Review the worked examples for this topic</li>
                  <li>• Practice with similar problems</li>
                  <li>• Focus on understanding the method, not just the answer</li>
                  <li>• Ask for help if you're stuck on the same error type</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
