'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Target, 
  BookOpen, 
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Trophy,
  Medal,
  Zap
} from 'lucide-react'

interface ProgressDashboardProps {
  studentId: string
  studentName?: string
  subject?: 'maths' | 'science' | 'homework' | 'all'
  showWeakAreas?: boolean
  showTrends?: boolean
  showAchievements?: boolean
  compact?: boolean
}

interface TopicProgress {
  topic_id: string
  topic_name: string
  mastery_percent: number
  status: 'secure' | 'developing' | 'at_risk'
  trend: 'improving' | 'stable' | 'declining'
  attempts_count: number
  last_practiced: string
  streak_days: number
}

interface WeakArea {
  topic_id: string
  topic_name: string
  weakness_score: number
  severity: 'high' | 'medium' | 'low'
  signals: string[]
  recommendations: string[]
}

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  date_earned: string
  category: 'mastery' | 'streak' | 'performance' | 'milestone'
}

/**
 * EnhancedProgressDashboard - Visual progress tracking with mastery, weak areas, and achievements
 * 
 * Features:
 * - Overall mastery percentage with circular progress
 * - Topic-by-topic breakdown with status badges
 * - Weak areas with recommendations
 * - Progress trends over time
 * - Achievement badges and milestones
 * - Color-coded status (Green/Amber/Red)
 */
const EnhancedProgressDashboard: React.FC<ProgressDashboardProps> = ({
  studentId,
  studentName = 'Student',
  subject = 'all',
  showWeakAreas = true,
  showTrends = true,
  showAchievements = true,
  compact = false,
}) => {
  // Mock data (in production, fetch from API)
  const [overallMastery, setOverallMastery] = useState(72)
  const [topics, setTopics] = useState<TopicProgress[]>([
    {
      topic_id: 'm1',
      topic_name: 'Addition & Subtraction',
      mastery_percent: 85,
      status: 'secure',
      trend: 'improving',
      attempts_count: 15,
      last_practiced: '2026-02-25',
      streak_days: 5,
    },
    {
      topic_id: 'm2',
      topic_name: 'Multiplication Tables',
      mastery_percent: 68,
      status: 'developing',
      trend: 'stable',
      attempts_count: 22,
      last_practiced: '2026-02-24',
      streak_days: 3,
    },
    {
      topic_id: 'm3',
      topic_name: 'Fractions',
      mastery_percent: 45,
      status: 'at_risk',
      trend: 'declining',
      attempts_count: 18,
      last_practiced: '2026-02-23',
      streak_days: 0,
    },
    {
      topic_id: 'm4',
      topic_name: 'Geometry Basics',
      mastery_percent: 78,
      status: 'developing',
      trend: 'improving',
      attempts_count: 12,
      last_practiced: '2026-02-25',
      streak_days: 4,
    },
  ])

  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([
    {
      topic_id: 'm3',
      topic_name: 'Fractions',
      weakness_score: 75,
      severity: 'high',
      signals: ['low_mastery', 'multiple_attempts', 'declining_trend'],
      recommendations: [
        'Review foundational concepts with visual aids',
        'Practice with fraction bars and circles',
        'Start with simple fractions (1/2, 1/4) before complex ones'
      ]
    },
    {
      topic_id: 'm2',
      topic_name: 'Multiplication Tables',
      weakness_score: 45,
      severity: 'medium',
      signals: ['slow_response', 'hint_dependent'],
      recommendations: [
        'Build fluency through timed practice drills',
        'Use multiplication songs and rhymes',
        'Practice 2-3 tables at a time'
      ]
    },
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'a1',
      icon: '',
      title: 'First Mastery!',
      description: 'Mastered your first topic',
      date_earned: '2026-02-20',
      category: 'mastery',
    },
    {
      id: 'a2',
      icon: '',
      title: 'Week Warrior',
      description: '7-day learning streak',
      date_earned: '2026-02-22',
      category: 'streak',
    },
    {
      id: 'a3',
      icon: '',
      title: 'Persistent Learner',
      description: 'Completed 50 practice attempts',
      date_earned: '2026-02-24',
      category: 'milestone',
    },
    {
      id: 'a4',
      icon: '',
      title: 'Quick Learner',
      description: '90%+ on 5 questions in a row',
      date_earned: '2026-02-25',
      category: 'performance',
    },
  ])

  // Status badge colors
  const statusColors = {
    secure: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: CheckCircle,
    },
    developing: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: AlertCircle,
    },
    at_risk: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      icon: AlertCircle,
    },
  }

  // Trend icons and colors
  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-600' },
    stable: { icon: Minus, color: 'text-gray-600' },
    declining: { icon: TrendingDown, color: 'text-red-600' },
  }

  return (
    <div className="enhanced-progress-dashboard max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="dashboard-header mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {studentName}'s Progress Dashboard
        </h2>
        <p className="text-gray-600">
          Track your learning journey and celebrate your achievements! 
        </p>
      </div>

      {/* Overall Mastery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Mastery Circle */}
        <div className="md:col-span-1">
          <MasteryCircle mastery={overallMastery} />
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Topics Learned"
            value={topics.length.toString()}
            color="blue"
          />
          <StatCard
            icon={Target}
            label="Secure Topics"
            value={topics.filter(t => t.status === 'secure').length.toString()}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Current Streak"
            value={`${Math.max(...topics.map(t => t.streak_days))} days`}
            color="orange"
          />
          <StatCard
            icon={Trophy}
            label="Achievements"
            value={achievements.length.toString()}
            color="purple"
          />
        </div>
      </div>

      {/* Topic Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Topic Mastery
          </h3>
          <div className="flex gap-2 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Secure
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              Developing
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              At Risk
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => (
            <TopicCard
              key={topic.topic_id}
              topic={topic}
              statusColors={statusColors}
              trendConfig={trendConfig}
            />
          ))}
        </div>
      </div>

      {/* Weak Areas */}
      {showWeakAreas && weakAreas.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            Areas Needing Attention
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {weakAreas.map(area => (
              <WeakAreaCard key={area.topic_id} area={area} />
            ))}
          </div>
        </div>
      )}

      {/* Progress Trend */}
      {showTrends && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Progress Over Time
          </h3>
          <ProgressTrendChart />
        </div>
      )}

      {/* Achievements */}
      {showAchievements && achievements.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * MasteryCircle - Circular progress indicator for overall mastery
 */
const MasteryCircle: React.FC<{ mastery: number }> = ({ mastery }) => {
  const circumference = 2 * Math.PI * 45 // r=45
  const strokeDashoffset = circumference - (mastery / 100) * circumference

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 85) return '#22C55E' // Green
    if (mastery >= 50) return '#F59E0B' // Amber
    return '#EF4444' // Red
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
      <h4 className="text-lg font-semibold text-gray-700 mb-4">Overall Mastery</h4>
      
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="45"
            stroke="#E5E7EB"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r="45"
            stroke={getMasteryColor(mastery)}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-4xl font-bold"
              style={{ color: getMasteryColor(mastery) }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {mastery}%
            </motion.div>
            <div className="text-sm text-gray-600 mt-1">
              {mastery >= 85 ? 'Excellent!' : mastery >= 50 ? 'Good Progress' : 'Keep Practicing'}
            </div>
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${
        mastery >= 85 ? 'bg-green-100 text-green-800' :
        mastery >= 50 ? 'bg-amber-100 text-amber-800' :
        'bg-red-100 text-red-800'
      }`}>
        {mastery >= 85 ? '🟢 Secure' : mastery >= 50 ? '🟡 Developing' : ' At Risk'}
      </div>
    </div>
  )
}

/**
 * StatCard - Small stat display card
 */
const StatCard: React.FC<{
  icon: any
  label: string
  value: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}> = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

/**
 * TopicCard - Individual topic progress card
 */
const TopicCard: React.FC<{
  topic: TopicProgress
  statusColors: any
  trendConfig: any
}> = ({ topic, statusColors, trendConfig }) => {
  const StatusIcon = statusColors[topic.status].icon
  const TrendIcon = trendConfig[topic.trend].icon

  return (
    <motion.div
      className={`bg-white rounded-xl shadow p-4 border-2 ${statusColors[topic.status].border}`}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{topic.topic_name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[topic.status].bg} ${statusColors[topic.status].text}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {topic.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={`flex items-center gap-1 ${trendConfig[topic.trend].color}`}>
          <TrendIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Mastery bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Mastery</span>
          <span className="font-semibold">{topic.mastery_percent}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              topic.mastery_percent >= 85 ? 'bg-green-500' :
              topic.mastery_percent >= 50 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${topic.mastery_percent}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex justify-between text-xs text-gray-600 pt-3 border-t">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {topic.attempts_count} attempts
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {topic.streak_days} day streak
        </span>
      </div>
    </motion.div>
  )
}

/**
 * WeakAreaCard - Card showing weak area with recommendations
 */
const WeakAreaCard: React.FC<{ area: WeakArea }> = ({ area }) => {
  const severityColors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-amber-100 border-amber-300 text-amber-800',
    low: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  }

  return (
    <motion.div
      className={`bg-white rounded-xl shadow p-5 border-2 ${severityColors[area.severity]}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg">{area.topic_name}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span>Weakness Score: {area.weakness_score}/100</span>
            <span className="px-2 py-1 rounded-full bg-white/50 text-xs font-medium">
              {area.severity.toUpperCase()}
            </span>
          </div>
        </div>
        <AlertCircle className="w-8 h-8 opacity-50" />
      </div>

      {/* Signals */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Detected Issues:</div>
        <div className="flex flex-wrap gap-1">
          {area.signals.map((signal, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-white rounded-full border border-gray-300"
            >
              {signal.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="text-xs text-gray-600 mb-2 font-medium">Recommendations:</div>
        <ul className="space-y-1">
          {area.recommendations.map((rec, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="text-green-600 mt-0.5"></span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

/**
 * ProgressTrendChart - Simple line chart showing progress over time
 */
const ProgressTrendChart: React.FC = () => {
  // Mock trend data
  const data = [
    { date: 'Feb 1', score: 55 },
    { date: 'Feb 8', score: 62 },
    { date: 'Feb 15', score: 68 },
    { date: 'Feb 22', score: 72 },
    { date: 'Feb 25', score: 75 },
  ]

  const maxScore = 100
  const chartHeight = 200
  const chartWidth = 600

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartWidth,
    y: chartHeight - (d.score / maxScore) * chartHeight,
  }))

  const pathD = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(score => (
          <g key={score}>
            <line
              x1="0"
              y1={chartHeight - (score / maxScore) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - (score / maxScore) * chartHeight}
              stroke="#E5E7EB"
              strokeDasharray="4"
            />
            <text
              x="-10"
              y={chartHeight - (score / maxScore) * chartHeight + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {score}
            </text>
          </g>
        ))}

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#3B82F6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
            <text
              x={p.x}
              y={chartHeight + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {data[i].date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/**
 * AchievementBadge - Badge showing earned achievement
 */
const AchievementBadge: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl shadow p-4 text-center border-2 border-yellow-300"
      whileHover={{ scale: 1.05, rotate: 5 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="text-4xl mb-2">{achievement.icon}</div>
      <div className="font-bold text-gray-800 text-sm">{achievement.title}</div>
      <div className="text-xs text-gray-600 mt-1">{achievement.description}</div>
      <div className="text-xs text-gray-400 mt-2">
        {new Date(achievement.date_earned).toLocaleDateString()}
      </div>
    </motion.div>
  )
}

export { EnhancedProgressDashboard }
