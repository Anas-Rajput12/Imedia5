'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Flame, 
  Target,
  RefreshCw,
  Calendar,
  Star
} from 'lucide-react'
import ErrorAnalysisChart from '@/components/ErrorAnalysisChart'
import ConfidenceMeter from '@/components/ConfidenceMeter'

interface TopicProgress {
  topic_id: string
  topic_name: string
  subject: string
  year_level: number
  mastery_percent: number
  status: 'secure' | 'developing' | 'at_risk'
  attempts_count: number
  last_practiced: string | null
  streak_days: number
  confidence_signal: number
}

interface ErrorAnalysis {
  error_code: string
  error_name: string
  error_category: string
  occurrence_count: number
  trend?: 'increasing' | 'decreasing' | 'stable'
  remediation_strategy: string
  last_occurrence: string
}

interface LearningStreak {
  current_streak: number
  best_streak: number
  total_days: number
  last_practice: string | null
}

interface StudentSummary {
  student_id: string
  total_topics: number
  secure_topics: number
  developing_topics: number
  at_risk_topics: number
  overall_mastery: number
  current_streak: number
  best_streak: number
  total_xp: number
  recent_activity: any[]
}

interface ProgressDashboard {
  student_id: string
  summary: StudentSummary
  topics: TopicProgress[]
  error_analysis: ErrorAnalysis[]
  learning_streak: LearningStreak
  recommendations: string[]
}

export default function ProgressPage() {
  const { user } = useUser()
  const [dashboard, setDashboard] = useState<ProgressDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'secure' | 'developing' | 'at_risk'>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchProgress()
  }, [user, refreshKey])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from real API
      const response = await fetch(
        `http://localhost:8000/api/progress/${user?.id || 'student_123'}/dashboard`
      )
      
      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
        setError(null)
      } else {
        // Use mock data for demonstration
        setDashboard(getMockDashboard())
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
      // Use mock data as fallback
      setDashboard(getMockDashboard())
      setError('Using demo data - API not available')
    } finally {
      setLoading(false)
    }
  }

  const getMockDashboard = (): ProgressDashboard => ({
    student_id: user?.id || 'student_123',
    summary: {
      student_id: user?.id || 'student_123',
      total_topics: 12,
      secure_topics: 4,
      developing_topics: 5,
      at_risk_topics: 3,
      overall_mastery: 67,
      current_streak: 5,
      best_streak: 12,
      total_xp: 2450,
      recent_activity: [
        { 
          topic: 'Algebraic Expressions', 
          mastery_score: 85, 
          date: new Date().toISOString(),
          completed: true 
        },
        { 
          topic: 'Linear Equations', 
          mastery_score: 72, 
          date: new Date(Date.now() - 86400000).toISOString(),
          completed: true 
        },
        { 
          topic: 'Cell Biology', 
          mastery_score: 45, 
          date: new Date(Date.now() - 172800000).toISOString(),
          completed: false 
        },
      ],
    },
    topics: [
      {
        topic_id: 'm7-1',
        topic_name: 'Algebraic Expressions',
        subject: 'Mathematics',
        year_level: 7,
        mastery_percent: 85,
        status: 'secure',
        attempts_count: 15,
        last_practiced: new Date().toISOString(),
        streak_days: 5,
        confidence_signal: 0.8,
      },
      {
        topic_id: 'm7-2',
        topic_name: 'Linear Equations',
        subject: 'Mathematics',
        year_level: 7,
        mastery_percent: 72,
        status: 'developing',
        attempts_count: 12,
        last_practiced: new Date(Date.now() - 86400000).toISOString(),
        streak_days: 3,
        confidence_signal: 0.6,
      },
      {
        topic_id: 's7-1',
        topic_name: 'Cell Biology',
        subject: 'Science',
        year_level: 7,
        mastery_percent: 45,
        status: 'at_risk',
        attempts_count: 8,
        last_practiced: new Date(Date.now() - 172800000).toISOString(),
        streak_days: 0,
        confidence_signal: 0.3,
      },
      {
        topic_id: 'm8-1',
        topic_name: 'Pythagoras Theorem',
        subject: 'Mathematics',
        year_level: 8,
        mastery_percent: 90,
        status: 'secure',
        attempts_count: 20,
        last_practiced: new Date().toISOString(),
        streak_days: 7,
        confidence_signal: 0.9,
      },
      {
        topic_id: 's8-1',
        topic_name: 'Forces and Motion',
        subject: 'Science',
        year_level: 8,
        mastery_percent: 68,
        status: 'developing',
        attempts_count: 10,
        last_practiced: new Date(Date.now() - 259200000).toISOString(),
        streak_days: 2,
        confidence_signal: 0.5,
      },
    ],
    error_analysis: [
      {
        error_code: 'SIGN_ERROR',
        error_name: 'Sign Mistakes',
        error_category: 'arithmetic',
        occurrence_count: 8,
        trend: 'decreasing',
        remediation_strategy: 'Double-check positive/negative signs. Use brackets to avoid confusion.',
        last_occurrence: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        error_code: 'DISTRIBUTIVE_PROPERTY',
        error_name: 'Expanding Brackets',
        error_category: 'misconception',
        occurrence_count: 6,
        trend: 'stable',
        remediation_strategy: 'Remember: a(b + c) = ab + ac. Multiply everything inside the bracket.',
        last_occurrence: new Date().toISOString(),
      },
      {
        error_code: 'FRACTION_ADD_DIFF_DENOM',
        error_name: 'Adding Fractions',
        error_category: 'misconception',
        occurrence_count: 5,
        trend: 'increasing',
        remediation_strategy: 'Find common denominator first. Never add denominators directly.',
        last_occurrence: new Date().toISOString(),
      },
      {
        error_code: 'COPY_ERROR',
        error_name: 'Copying Mistakes',
        error_category: 'careless',
        occurrence_count: 4,
        trend: 'decreasing',
        remediation_strategy: 'Write neatly. Check each step before moving on.',
        last_occurrence: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        error_code: 'WRONG_METHOD',
        error_name: 'Incorrect Method',
        error_category: 'method',
        occurrence_count: 3,
        trend: 'stable',
        remediation_strategy: 'Review the exam-board approved method. Follow step-by-step.',
        last_occurrence: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
    learning_streak: {
      current_streak: 5,
      best_streak: 12,
      total_days: 45,
      last_practice: new Date().toISOString(),
    },
    recommendations: [
      'Practice Cell Biology - needs attention',
      'Great work on Algebraic Expressions! Keep it up!',
      'Review expanding brackets to reduce errors',
      'You\'re on a 5-day streak - aim for 7 days!',
      'Try Pythagoras Theorem - you\'re ready for it',
    ],
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'developing':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'at_risk':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <CheckCircle size={16} className="text-green-600" />
      case 'developing':
        return <TrendingUp size={16} className="text-amber-600" />
      case 'at_risk':
        return <AlertCircle size={16} className="text-red-600" />
      default:
        return null
    }
  }

  const getMasteryBarColor = (mastery: number) => {
    if (mastery >= 85) return 'bg-green-500'
    if (mastery >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const filteredTopics = filter === 'all'
    ? dashboard?.topics || []
    : dashboard?.topics.filter(t => t.status === filter) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
                 Your Learning Progress
              </h1>
              <p className="text-gray-600">Track your mastery, streaks, and areas for improvement</p>
            </div>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              <p className="text-amber-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Overall Mastery */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target size={24} className="text-purple-600" />
              </div>
              <span className="text-3xl font-black text-purple-600">
                {dashboard?.summary.overall_mastery || 0}%
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Overall Mastery</h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${dashboard?.summary.overall_mastery || 0}%` }}
              />
            </div>
          </div>

          {/* Learning Streak */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Flame size={24} className="text-orange-600" />
              </div>
              <span className="text-3xl font-black text-orange-600">
                {dashboard?.summary.current_streak || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Day Streak </h3>
            <p className="text-xs text-gray-500">
              Best: {dashboard?.summary.best_streak || 0} days
            </p>
          </div>

          {/* Topics Secure */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <span className="text-3xl font-black text-green-600">
                {dashboard?.summary.secure_topics || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Topics Mastered</h3>
            <p className="text-xs text-gray-500">
              {dashboard?.summary.developing_topics || 0} developing
            </p>
          </div>

          {/* Total XP */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Award size={24} className="text-blue-600" />
              </div>
              <span className="text-3xl font-black text-blue-600">
                {dashboard?.summary.total_xp || 0}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total XP Earned</h3>
            <p className="text-xs text-gray-500">Keep learning to earn more!</p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Confidence Level</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ConfidenceMeter
              confidence_signal={0.75}
              trend="improving"
              size="lg"
              showLabel={true}
            />
            <ConfidenceMeter
              confidence_signal={0.5}
              trend="stable"
              size="lg"
              showLabel={true}
            />
            <ConfidenceMeter
              confidence_signal={0.3}
              trend="declining"
              size="lg"
              showLabel={true}
            />
          </div>
        </div>

        {/* Recommendations */}
        {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              Personalized Recommendations
            </h2>
            <div className="space-y-3">
              {dashboard.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 flex-1">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={24} className="text-purple-600" />
              Topic Progress
            </h2>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({dashboard?.topics.length || 0})
              </button>
              <button
                onClick={() => setFilter('secure')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === 'secure'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🟢 Secure ({dashboard?.summary.secure_topics || 0})
              </button>
              <button
                onClick={() => setFilter('developing')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === 'developing'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🟡 Developing ({dashboard?.summary.developing_topics || 0})
              </button>
              <button
                onClick={() => setFilter('at_risk')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === 'at_risk'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                 At Risk ({dashboard?.summary.at_risk_topics || 0})
              </button>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.topic_id}
                className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${getStatusColor(topic.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-1">{topic.topic_name}</h3>
                    <p className="text-xs opacity-75">Year {topic.year_level} • {topic.subject}</p>
                  </div>
                  {getStatusIcon(topic.status)}
                </div>

                {/* Mastery Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold">Mastery</span>
                    <span className="font-bold">{topic.mastery_percent}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getMasteryBarColor(topic.mastery_percent)}`}
                      style={{ width: `${topic.mastery_percent}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs opacity-75">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {topic.attempts_count} attempts
                  </span>
                  {topic.streak_days > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame size={12} />
                      {topic.streak_days} days
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTopics.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No topics found with this filter</p>
            </div>
          )}
        </div>

        {/* Error Analysis */}
        {dashboard?.error_analysis && dashboard.error_analysis.length > 0 && (
          <div className="mb-8">
            <ErrorAnalysisChart
              errors={dashboard.error_analysis}
              title="Areas for Improvement"
              showRemediation={true}
            />
          </div>
        )}

        {/* Recent Activity */}
        {dashboard?.summary.recent_activity && dashboard.summary.recent_activity.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock size={24} className="text-blue-600" />
              Recent Activity
            </h2>

            <div className="space-y-3">
              {dashboard.summary.recent_activity.slice(0, 5).map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    activity.completed ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {activity.topic}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  {activity.mastery_score && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activity.mastery_score >= 80
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {activity.mastery_score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
