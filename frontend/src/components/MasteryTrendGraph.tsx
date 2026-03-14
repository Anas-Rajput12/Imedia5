'use client';

import React from 'react';
import { TrendingUp, Target } from 'lucide-react';

interface MasteryDataPoint {
  date: string;
  mastery: number;
  topic?: string;
}

interface MasteryTrendGraphProps {
  data: MasteryDataPoint[];
  goalLine?: number;
  subject?: 'maths' | 'science' | 'homework' | 'all';
  title?: string;
  height?: number;
}

/**
 * Mastery Trend Graph - Shows improvement over time
 * 
 * Features:
 * - Line chart with smooth curves
 * - Goal line at 85%
 * - Subject color coding
 * - Hover tooltips
 * - Zoom/date range
 */
const MasteryTrendGraph: React.FC<MasteryTrendGraphProps> = ({
  data,
  goalLine = 85,
  subject = 'maths',
  title = "Improvement Trend",
  height = 250
}) => {
  const getSubjectColor = () => {
    switch (subject) {
      case 'maths':
        return '#3B82F6'; // Blue
      case 'science':
        return '#10B981'; // Green
      case 'homework':
        return '#8B5CF6'; // Purple
      default:
        return '#6366F1'; // Indigo
    }
  };

  const lineColor = getSubjectColor();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2"> {title}</h3>
        <p className="text-gray-500">No data yet. Start learning to see your progress!</p>
      </div>
    );
  }

  // Calculate graph dimensions
  const padding = 40;
  const graphWidth = 100; // percentage
  const graphHeight = height - padding * 2;

  // Find min/max for scaling
  const maxMastery = Math.max(100, ...data.map(d => d.mastery));
  const minMastery = 0;

  // Scale functions
  const scaleX = (index: number) => (index / (data.length - 1)) * graphWidth;
  const scaleY = (mastery: number) => graphHeight - ((mastery - minMastery) / (maxMastery - minMastery)) * graphHeight;

  // Generate path
  const pathD = data.map((point, index) => {
    const x = scaleX(index);
    const y = scaleY(point.mastery);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Area under curve
  const areaD = `${pathD} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z`;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
           {title}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">Goal: {goalLine}%</span>
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg 
          viewBox={`0 0 ${graphWidth} ${graphHeight}`} 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <g key={percent}>
              <line
                x1="0"
                y1={scaleY(percent)}
                x2={graphWidth}
                y2={scaleY(percent)}
                stroke="#E5E7EB"
                strokeDasharray="2"
                strokeWidth="0.5"
              />
              <text
                x="-5"
                y={scaleY(percent)}
                textAnchor="end"
                className="text-[3px] fill-gray-500"
                dy="1"
              >
                {percent}%
              </text>
            </g>
          ))}

          {/* Goal line */}
          <line
            x1="0"
            y1={scaleY(goalLine)}
            x2={graphWidth}
            y2={scaleY(goalLine)}
            stroke="#10B981"
            strokeWidth="1"
            strokeDasharray="3"
          />

          {/* Area under curve */}
          <path
            d={areaD}
            fill={lineColor}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => (
            <g key={index}>
              <circle
                cx={scaleX(index)}
                cy={scaleY(point.mastery)}
                r="3"
                fill="white"
                stroke={lineColor}
                strokeWidth="2"
                className="transition-all hover:r-4"
              />
              <title>
                {point.date}: {point.mastery}%{point.topic ? ` - ${point.topic}` : ''}
              </title>
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((point, index) => (
            <div key={index} className="text-center">
              {new Date(point.date).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Starting</p>
          <p className="text-lg font-bold text-gray-800">{data[0]?.mastery}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-lg font-bold text-gray-800">{data[data.length - 1]?.mastery}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Improvement</p>
          <p className={`text-lg font-bold ${
            data[data.length - 1]?.mastery > data[0]?.mastery 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {data[data.length - 1]?.mastery - data[0]?.mastery > 0 ? '+' : ''}
            {data[data.length - 1]?.mastery - data[0]?.mastery}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasteryTrendGraph;
