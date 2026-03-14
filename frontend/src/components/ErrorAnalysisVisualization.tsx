'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ErrorTag {
  error_code: string
  error_name: string
  error_category: 'arithmetic' | 'method' | 'misconception' | 'careless' | 'algebra'
  occurrence_count: number
  trend: 'increasing' | 'decreasing' | 'stable'
  last_occurrence: string
  remediation_strategy: string
}

interface ErrorAnalysisProps {
  errors: ErrorTag[]
  limit?: number
}

export default function ErrorAnalysisVisualization({ errors, limit = 5 }: ErrorAnalysisProps) {
  const [expandedError, setExpandedError] = useState<string | null>(null)

  // Sort by occurrence count
  const sortedErrors = [...errors].sort((a, b) => b.occurrence_count - a.occurrence_count)
  const displayErrors = limit ? sortedErrors.slice(0, limit) : sortedErrors

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'arithmetic':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'method':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'misconception':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'careless':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'algebra':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'arithmetic':
        return ''
      case 'method':
        return ''
      case 'misconception':
        return ''
      case 'careless':
        return ''
      case 'algebra':
        return ''
      default:
        return ''
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Error Analysis
        </h3>
        <span className="text-sm text-gray-500">
          Top {displayErrors.length} recurring errors
        </span>
      </div>

      {displayErrors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
          <p>No recurring errors detected. Great work!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayErrors.map((error) => (
            <div
              key={error.error_code}
              className={`border rounded-lg transition-all ${
                expandedError === error.error_code
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedError(expandedError === error.error_code ? null : error.error_code)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getCategoryIcon(error.error_category)}</span>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{error.error_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(error.error_category)}`}>
                          {error.error_category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Occurred {error.occurrence_count} time{error.occurrence_count !== 1 ? 's' : ''}
                        {error.last_occurrence && ` • Last: ${new Date(error.last_occurrence).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getTrendIcon(error.trend)}
                    <span className={`text-sm font-medium ${
                      error.trend === 'increasing' ? 'text-red-600' :
                      error.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {error.trend.charAt(0).toUpperCase() + error.trend.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {expandedError === error.error_code && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                  <div className="bg-white rounded p-3 text-sm">
                    <h5 className="font-medium text-gray-900 mb-2">How to fix this:</h5>
                    <p className="text-gray-700">{error.remediation_strategy}</p>
                    
                    <div className="mt-3 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600 text-xs">
                        Practice this skill with targeted exercises to reduce this error
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {errors.length > limit && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpandedError(null)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all {errors.length} errors
          </button>
        </div>
      )}
    </div>
  )
}
