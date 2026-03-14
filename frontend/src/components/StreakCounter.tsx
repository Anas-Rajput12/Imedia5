'use client'

import { Flame, Trophy, Zap } from 'lucide-react'

interface StreakCounterProps {
  currentStreak: number
  bestStreak: number
  xpToday: number
  dailyGoal: number
}

export default function StreakCounter({
  currentStreak,
  bestStreak,
  xpToday,
  dailyGoal
}: StreakCounterProps) {
  const xpProgress = Math.min((xpToday / dailyGoal) * 100, 100)

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-full">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{currentStreak}</h3>
            <p className="text-sm opacity-90">Day Streak</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium">Best: {bestStreak} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">{xpToday}/{dailyGoal} XP</span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Daily Goal Progress</span>
          <span>{Math.round(xpProgress)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-yellow-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        {xpToday >= dailyGoal && (
          <p className="text-xs mt-2 text-center font-semibold animate-pulse">
             Daily goal achieved! Keep it up!
          </p>
        )}
      </div>
    </div>
  )
}
