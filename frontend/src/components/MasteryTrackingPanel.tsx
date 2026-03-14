'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Flame,
  Zap,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface MasteryTopic {
  topic_id: string;
  topic_name: string;
  subject: string;
  mastery_percent: number;
  attempts: number;
  error_tags: string[];
  last_practiced: string;
  status: 'secure' | 'developing' | 'at_risk';
}

interface MasteryData {
  secure: MasteryTopic[];
  developing: MasteryTopic[];
  at_risk: MasteryTopic[];
  total_topics: number;
  average_mastery: number;
}

interface MasteryTrackingPanelProps {
  studentId: string;
  compact?: boolean;
}

export default function MasteryTrackingPanel({
  studentId,
  compact = false,
}: MasteryTrackingPanelProps) {
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<MasteryTopic | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'secure' | 'developing' | 'at_risk'>('all');

  useEffect(() => {
    fetchMasteryData();
  }, [studentId]);

  const fetchMasteryData = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/teaching/mastery/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setMasteryData(data.summary);
      }
    } catch (error) {
      console.error('Error fetching mastery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        return <RefreshCw className="w-5 h-5" />;
      case 'at_risk':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 85) return 'text-green-600';
    if (mastery >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMasteryGradient = (mastery: number) => {
    if (mastery >= 85) return 'from-green-500 to-emerald-600';
    if (mastery >= 50) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const filteredTopics = () => {
    if (!masteryData) return [];

    const allTopics = [
      ...masteryData.secure,
      ...masteryData.developing,
      ...masteryData.at_risk,
    ];

    if (activeTab === 'all') return allTopics;
    return masteryData[activeTab] || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!masteryData) {
    return (
      <div className="text-center p-8 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No mastery data yet. Start learning to track your progress!</p>
        <Link
          href="/tutor?type=maths"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Start Learning →
        </Link>
      </div>
    );
  }

  // Compact View
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Mastery Overview
          </h3>
          <span className="text-sm text-gray-500">
            {masteryData.total_topics} topics
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Secure */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700">{masteryData.secure.length}</p>
            <p className="text-xs text-green-600">Secure</p>
          </div>

          {/* Developing */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <RefreshCw className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{masteryData.developing.length}</p>
            <p className="text-xs text-yellow-600">Developing</p>
          </div>

          {/* At Risk */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-700">{masteryData.at_risk.length}</p>
            <p className="text-xs text-red-600">At Risk</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average Mastery</span>
            <span className={`text-lg font-bold ${getMasteryColor(masteryData.average_mastery)}`}>
              {masteryData.average_mastery}%
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getMasteryGradient(masteryData.average_mastery)} rounded-full transition-all duration-500`}
              style={{ width: `${masteryData.average_mastery}%` }}
            />
          </div>
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
              <Target className="w-6 h-6 text-blue-600" />
              Topic Mastery Tracking
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track your progress across all topics
            </p>
          </div>
          <button
            onClick={fetchMasteryData}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Total Topics</p>
          <p className="text-3xl font-bold text-gray-900">{masteryData.total_topics}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Average Mastery</p>
          <p className={`text-3xl font-bold ${getMasteryColor(masteryData.average_mastery)}`}>
            {masteryData.average_mastery}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Secure Topics</p>
          <p className="text-3xl font-bold text-green-600">{masteryData.secure.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Needs Practice</p>
          <p className="text-3xl font-bold text-red-600">{masteryData.at_risk.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['all', 'secure', 'developing', 'at_risk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'all' ? 'All Topics' : tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {tab !== 'all' && masteryData && (
              <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs">
                {masteryData[tab]?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="divide-y divide-gray-200">
        <AnimatePresence>
          {filteredTopics().map((topic) => (
            <motion.div
              key={topic.topic_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => setSelectedTopic(topic)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getStatusColor(topic.status)}`}>
                    {getStatusIcon(topic.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{topic.topic_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 capitalize">{topic.subject}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {topic.attempts} attempts
                      </span>
                      {topic.error_tags && topic.error_tags.length > 0 && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {topic.error_tags.length} errors
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Mastery Circle */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle
                        className="text-gray-200"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="transparent"
                        r="14"
                        cx="18"
                        cy="18"
                      />
                      <circle
                        className={getMasteryColor(topic.mastery_percent)}
                        strokeWidth="3"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * topic.mastery_percent) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="14"
                        cx="18"
                        cy="18"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-bold ${getMasteryColor(topic.mastery_percent)}`}>
                        {topic.mastery_percent}%
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTopics().length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No topics in this category yet. Keep learning!</p>
          </div>
        )}
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onStartPractice={() => {
            window.location.href = `/tutor?type=${selectedTopic.subject}`;
          }}
        />
      )}
    </div>
  );
}

// Topic Detail Modal Component
function TopicDetailModal({
  topic,
  onClose,
  onStartPractice,
}: {
  topic: MasteryTopic;
  onClose: () => void;
  onStartPractice: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{topic.topic_name}</h3>
              <p className="text-sm text-gray-500 mt-1 capitalize">{topic.subject}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 rotate-90" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mastery Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mastery Level</span>
            <span className={`text-2xl font-bold ${getMasteryColor(topic.mastery_percent)}`}>
              {topic.mastery_percent}%
            </span>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(topic.status)}`}>
            {getStatusIcon(topic.status)}
            <span className="ml-2 capitalize">{topic.status.replace('_', ' ')}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Attempts</p>
              <p className="text-xl font-bold text-gray-900">{topic.attempts}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Last Practiced</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(topic.last_practiced).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Error Tags */}
          {topic.error_tags && topic.error_tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Common Errors
              </h4>
              <div className="flex flex-wrap gap-2">
                {topic.error_tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Recommended Action
            </h4>
            <p className="text-sm text-blue-700">
              {topic.mastery_percent >= 85
                ? "Great job! This topic is secure. Consider reviewing it weekly to maintain your mastery."
                : topic.mastery_percent >= 50
                ? "You're making progress! Practice more problems to reach secure level."
                : "This topic needs attention. Let's practice with some targeted exercises."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={onStartPractice}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Practice Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
