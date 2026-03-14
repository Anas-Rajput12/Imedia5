'use client'

import { Clock, TrendingUp, AlertCircle } from 'lucide-react'

interface RecommendedLesson {
  topic_id: string
  topic_name: string
  subject: string
  year_group: string
  mastery_percent: number
  goal_mastery: number
  last_activity: string
  struggled_with: string
  time_needed: number
  reason: string
}

interface RecommendedLessonCardProps {
  lesson: RecommendedLesson
  onStartLesson: (topicId: string) => void
}

export default function RecommendedLessonCard({
  lesson,
  onStartLesson
}: RecommendedLessonCardProps) {
  const progress = Math.min(
    Math.round((lesson.mastery_percent / lesson.goal_mastery) * 100),
    100
  )

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Recommended for You</h3>
          <p className="text-sm opacity-90">{lesson.reason}</p>
        </div>
        <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
          Year {lesson.year_group}
        </div>
      </div>

      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{lesson.topic_name}</h4>
            <p className="text-sm opacity-90 capitalize">{lesson.subject}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>{lesson.time_needed} min</span>
            </div>
            <p className="text-xs opacity-75">Last practiced {timeAgo(lesson.last_activity)}</p>
          </div>
        </div>

        {/* Progress to Goal */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Current Mastery</span>
            <span className="font-bold">{lesson.mastery_percent}% / {lesson.goal_mastery}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {lesson.struggled_with && (
          <div className="flex items-start gap-2 text-xs bg-white/10 rounded p-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Focus area: {lesson.struggled_with}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onStartLesson(lesson.topic_id)}
        className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-5 h-5" />
        Start This Lesson
      </button>
    </div>
  )
}
