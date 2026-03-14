'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TrendingUp, Award, Calendar } from 'lucide-react'

interface MasteryDataPoint {
  date: string
  topic_name: string
  mastery_percent: number
  topic_id: string
}

interface ProgressTrendGraphProps {
  data: MasteryDataPoint[]
  topicFilter?: string
  daysToShow?: number
}

export default function ProgressTrendGraph({ data, topicFilter, daysToShow = 30 }: ProgressTrendGraphProps) {
  // Filter and process data
  const filteredData = topicFilter
    ? data.filter(d => d.topic_id === topicFilter)
    : data

  // Group by date and calculate average mastery
  const groupedByDate = filteredData.reduce((acc, curr) => {
    const dateKey = new Date(curr.date).toLocaleDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        average_mastery: 0,
        topics_count: 0,
        total_mastery: 0
      }
    }
    acc[dateKey].total_mastery += curr.mastery_percent
    acc[dateKey].topics_count += 1
    acc[dateKey].average_mastery = Math.round(acc[dateKey].total_mastery / acc[dateKey].topics_count)
    return acc
  }, {} as Record<string, any>)

  const chartData = Object.values(groupedByDate).slice(-daysToShow)

  // Calculate trend statistics
  const getTrendStats = () => {
    if (chartData.length < 2) return null

    const first = chartData[0].average_mastery
    const last = chartData[chartData.length - 1].average_mastery
    const change = last - first
    const percentChange = first > 0 ? ((change / first) * 100).toFixed(1) : '0'

    return {
      change,
      percentChange,
      isPositive: change >= 0,
      startMastery: first,
      endMastery: last
    }
  }

  const trendStats = getTrendStats()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Progress Trend
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Mastery improvement over last {daysToShow} days
          </p>
        </div>

        {trendStats && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            trendStats.isPositive ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <TrendingUp className={`w-5 h-5 ${
              trendStats.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'
            }`} />
            <div>
              <p className={`text-sm font-semibold ${
                trendStats.isPositive ? 'text-green-800' : 'text-red-800'
              }`}>
                {trendStats.isPositive ? '+' : ''}{trendStats.percentChange}%
              </p>
              <p className={`text-xs ${
                trendStats.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendStats.startMastery}% → {trendStats.endMastery}%
              </p>
            </div>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No progress data yet. Start learning to see your trend!</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Mastery %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [`${value}%`, 'Average Mastery']}
              />
              <Area
                type="monotone"
                dataKey="average_mastery"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMastery)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Milestone markers */}
      {trendStats && trendStats.isPositive && trendStats.endMastery >= 85 && (
        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
          <Award className="w-5 h-5" />
          <span className="text-sm font-medium">
             You've reached 85%+ mastery! This topic is now secure.
          </span>
        </div>
      )}
    </div>
  )
}
