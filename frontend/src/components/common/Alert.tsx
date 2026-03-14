'use client'

import { XCircle, AlertCircle, Info, CheckCircle } from 'lucide-react'

interface AlertProps {
  type: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message: string
  onClose?: () => void
  showIcon?: boolean
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  showIcon = true
}: AlertProps) {
  const getConfig = (type: string) => {
    switch (type) {
      case 'error':
        return {
          color: 'bg-red-50 border-red-200 text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-500" />
        }
      case 'warning':
        return {
          color: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />
        }
      case 'info':
        return {
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500" />
        }
      case 'success':
        return {
          color: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />
        }
      default:
        return {
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <Info className="w-5 h-5 text-gray-500" />
        }
    }
  }

  const config = getConfig(type)

  return (
    <div className={`p-4 rounded-lg border ${config.color}`}>
      <div className="flex items-start gap-3">
        {showIcon && <div className="flex-shrink-0">{config.icon}</div>}
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
