'use client'

import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'

interface ErrorAnalysisChartProps {
  errors: ErrorCategory[]
  title?: string
  showRemediation?: boolean
}

interface ErrorCategory {
  error_category: string
  error_name: string
  occurrence_count: number
  trend?: 'increasing' | 'decreasing' | 'stable'
  remediation_strategy?: string
  last_occurrence?: string
}

export default function ErrorAnalysisChart({
  errors,
  title = 'Areas for Improvement',
  showRemediation = true,
}: ErrorAnalysisChartProps) {
  if (errors.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-xl">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No errors recorded yet. Keep practicing!</p>
      </div>
    )
  }

  const totalErrors = errors.reduce((sum, err) => sum + err.occurrence_count, 0)

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <AlertCircle size={24} className="text-red-600" />
        {title}
      </h2>

      {/* Error Bars */}
      <div className="space-y-4 mb-6">
        {errors.map((error, index) => {
          const percentage = (error.occurrence_count / totalErrors) * 100
          const trend = error.trend || 'stable'

          return (
            <div key={index} className="space-y-2">
              {/* Error Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-gray-800">{error.error_name}</span>
                  <span className="text-xs text-gray-500 capitalize">({error.error_category})</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Trend Indicator */}
                  <div className="flex items-center gap-1">
                    {trend === 'increasing' && (
                      <TrendingUp size={16} className="text-red-600" />
                    )}
                    {trend === 'decreasing' && (
                      <TrendingDown size={16} className="text-green-600" />
                    )}
                    {trend === 'stable' && (
                      <Minus size={16} className="text-gray-600" />
                    )}
                  </div>
                  
                  {/* Count Badge */}
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                    {error.occurrence_count}x
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getErrorColor(error.error_category)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Remediation Strategy */}
              {showRemediation && error.remediation_strategy && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> {error.remediation_strategy}
                  </p>
                </div>
              )}

              {/* Last Occurrence */}
              {error.last_occurrence && (
                <p className="text-xs text-gray-500">
                  Last occurred: {new Date(error.last_occurrence).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total Errors:</span>
          <span className="text-lg font-bold text-gray-900">{totalErrors}</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Focus on the areas above to improve your accuracy. Practice makes perfect! 
        </p>
      </div>
    </div>
  )
}

function getErrorColor(category: string): string {
  const colors: Record<string, string> = {
    arithmetic: 'bg-red-500',
    method: 'bg-orange-500',
    misconception: 'bg-amber-500',
    careless: 'bg-yellow-500',
  }
  return colors[category] || 'bg-red-500'
}
