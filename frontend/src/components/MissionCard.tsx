'use client'

import { Target, CheckCircle, Award } from 'lucide-react'

interface Mission {
  mission_id: string
  mission_type: string
  title: string
  description: string
  xp_reward: number
  progress_current: number
  progress_target: number
  is_completed: boolean
}

interface MissionCardProps {
  mission: Mission
  onClaim?: (missionId: string) => void
}

export default function MissionCard({ mission, onClaim }: MissionCardProps) {
  const progress = Math.min(
    Math.round((mission.progress_current / mission.progress_target) * 100),
    100
  )

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'fix_weak_spot':
        return <Target className="w-6 h-6" />
      case 'spaced_review':
        return <CheckCircle className="w-6 h-6" />
      case 'confidence_boost':
        return <Award className="w-6 h-6" />
      default:
        return <Target className="w-6 h-6" />
    }
  }

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        mission.is_completed
          ? 'bg-green-50 border-green-300 text-green-800'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`p-2 rounded-full ${
            mission.is_completed
              ? 'bg-green-200 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {getMissionIcon(mission.mission_type)}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold mb-1">{mission.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{mission.description}</p>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span className="font-medium">
                {mission.progress_current}/{mission.progress_target}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`${
                  mission.is_completed ? 'bg-green-500' : 'bg-blue-500'
                } h-full rounded-full transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">
              +{mission.xp_reward} XP
            </span>

            {mission.is_completed ? (
              <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Completed
              </span>
            ) : (
              <span className="text-xs text-gray-500">In Progress</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
