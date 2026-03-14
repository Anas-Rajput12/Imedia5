'use client'

import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: 'book' | 'clock' | 'award' | 'trend'
  trend?: string
  trendValue?: number
  color?: 'blue' | 'green' | 'purple' | 'amber'
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'blue'
}: StatCardProps) {
  const iconConfig = {
    book: { icon: BookOpen, emoji: '' },
    clock: { icon: Clock, emoji: '' },
    award: { icon: Award, emoji: '' },
    trend: { icon: TrendingUp, emoji: '' }
  }

  const colorConfig = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600'
  }

  const IconComponent = iconConfig[icon].icon

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorConfig[color]} flex items-center justify-center text-white shadow-lg`}>
          <IconComponent className="w-7 h-7" />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${
            trendValue && trendValue > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trendValue && trendValue > 0 ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  )
}
