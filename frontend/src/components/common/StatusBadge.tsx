'use client'

interface StatusBadgeProps {
  status: 'secure' | 'developing' | 'at_risk' | 'completed' | 'in_progress'
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'secure':
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          label: 'Secure',
          icon: ''
        }
      case 'developing':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Developing',
          icon: '↑'
        }
      case 'at_risk':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          label: 'At Risk',
          icon: ''
        }
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Completed',
          icon: ''
        }
      case 'in_progress':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          label: 'In Progress',
          icon: '→'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          label: 'Unknown',
          icon: '?'
        }
    }
  }

  const config = getStatusConfig(status)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
