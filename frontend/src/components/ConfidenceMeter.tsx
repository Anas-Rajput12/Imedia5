'use client'

import { Smile, Meh, Frown, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ConfidenceMeterProps {
  confidence_signal: number  // 0.0 to 1.0
  trend?: 'improving' | 'declining' | 'stable'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ConfidenceMeter({
  confidence_signal,
  trend = 'stable',
  showLabel = true,
  size = 'md',
}: ConfidenceMeterProps) {
  // Normalize to 0-100
  const percentage = Math.round(confidence_signal * 100)

  // Determine emoji and color based on confidence
  const getConfidenceState = () => {
    if (confidence_signal >= 0.7) {
      return {
        emoji: '',
        icon: Smile,
        label: 'Confident',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        barColor: 'bg-green-500',
      }
    } else if (confidence_signal >= 0.4) {
      return {
        emoji: '',
        icon: Meh,
        label: 'Unsure',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        barColor: 'bg-amber-500',
      }
    } else {
      return {
        emoji: '',
        icon: Frown,
        label: 'Struggling',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        barColor: 'bg-red-500',
      }
    }
  }

  const state = getConfidenceState()
  const IconComponent = state.icon

  const sizeClasses = {
    sm: {
      container: 'p-3',
      emoji: 'text-2xl',
      percentage: 'text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'p-4',
      emoji: 'text-4xl',
      percentage: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'p-6',
      emoji: 'text-6xl',
      percentage: 'text-4xl',
      label: 'text-base',
    },
  }

  return (
    <div className={`${sizeClasses[size].container} bg-white rounded-xl shadow-lg border-2 ${state.borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        {/* Emoji Icon */}
        <div className={`${sizeClasses[size].emoji}`}>
          {state.emoji}
        </div>

        {/* Percentage and Trend */}
        <div className="flex items-center gap-2">
          <span className={`font-bold ${state.color} ${sizeClasses[size].percentage}`}>
            {percentage}%
          </span>
          
          {/* Trend Indicator */}
          <div className={`flex items-center gap-1 ${
            trend === 'improving' ? 'text-green-600' :
            trend === 'declining' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {trend === 'improving' && <TrendingUp size={16} />}
            {trend === 'declining' && <TrendingDown size={16} />}
            {trend === 'stable' && <Minus size={16} />}
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${state.barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className={`font-semibold ${state.color} ${sizeClasses[size].label}`}>
            {state.label}
          </p>
        </div>
      )}
    </div>
  )
}
