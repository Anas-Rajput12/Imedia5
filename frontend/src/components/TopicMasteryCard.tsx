'use client'

import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

interface TopicMasteryCardProps {
  topic_id: string
  topic_name: string
  subject: string
  mastery_percent: number
  attempts: number
  last_practiced: string
  status: 'secure' | 'developing' | 'at_risk'
  onClick?: () => void
}

export default function TopicMasteryCard({
  topic_id,
  topic_name,
  subject,
  mastery_percent,
  attempts,
  last_practiced,
  status,
  onClick
}: TopicMasteryCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'secure':
        return {
          color: 'text-green-800 bg-green-100 border-green-300',
          progressColor: 'bg-green-500',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: 'Secure'
        }
      case 'developing':
        return {
          color: 'text-amber-800 bg-amber-100 border-amber-300',
          progressColor: 'bg-amber-500',
          icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
          label: 'Developing'
        }
      case 'at_risk':
        return {
          color: 'text-red-800 bg-red-100 border-red-300',
          progressColor: 'bg-red-500',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          label: 'At Risk'
        }
      default:
        return {
          color: 'text-gray-800 bg-gray-100 border-gray-300',
          progressColor: 'bg-gray-500',
          icon: null,
          label: 'Unknown'
        }
    }
  }

  const config = getStatusConfig(status)

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
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${config.color}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {config.icon}
          <div className="flex-1">
            <h4 className="font-semibold">{topic_name}</h4>
            <p className="text-xs opacity-75 capitalize">{subject}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs opacity-75">{config.label}</span>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Mastery</span>
          <span className="font-bold">{mastery_percent}%</span>
        </div>
        <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className={`${config.progressColor} h-full rounded-full transition-all duration-500`}
            style={{ width: `${mastery_percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs opacity-75">
        <span>{attempts} attempts</span>
        <span>Practiced {timeAgo(last_practiced)}</span>
      </div>
    </div>
  )
}
