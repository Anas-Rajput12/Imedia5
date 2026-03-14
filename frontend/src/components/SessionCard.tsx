'use client'

import { BookOpen, Clock, TrendingUp, Award } from 'lucide-react'

interface SessionCardProps {
  session_id: string
  tutor_type: string
  topic: string | null
  last_activity: string
  message_count: number
  onClick?: () => void
}

export default function SessionCard({
  session_id,
  tutor_type,
  topic,
  last_activity,
  message_count,
  onClick
}: SessionCardProps) {
  const getTutorIcon = (type: string) => {
    switch (type) {
      case 'maths':
        return ''
      case 'science':
        return ''
      case 'homework':
        return ''
      default:
        return ''
    }
  }

  const getTutorColor = (type: string) => {
    switch (type) {
      case 'maths':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'science':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'homework':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

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
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${getTutorColor(tutor_type)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getTutorIcon(tutor_type)}</span>
          <div>
            <h4 className="font-semibold text-gray-900 capitalize">{tutor_type}</h4>
            <p className="text-sm text-gray-600 truncate max-w-[200px]">
              {topic || 'General Session'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(last_activity)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <BookOpen className="w-3 h-3" />
            <span>{message_count} messages</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Session ID: {session_id.slice(0, 8)}...</span>
        <span className="font-medium">Click to view →</span>
      </div>
    </div>
  )
}
