'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ErrorTag {
  tag: string;
  count: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  color?: string;
}

interface ErrorTagCloudProps {
  errors: ErrorTag[];
  title?: string;
  maxTags?: number;
}

/**
 * Error Tag Cloud - Visualizes student error patterns
 * 
 * Features:
 * - Tag size = frequency
 * - Color by error type
 * - Trend indicators
 * - Clickable for details
 */
const ErrorTagCloud: React.FC<ErrorTagCloudProps> = ({
  errors,
  title = "Error Analysis",
  maxTags = 10
}) => {
  const getErrorColor = (tag: string) => {
    const colors: Record<string, string> = {
      'Arithmetic': 'bg-red-100 text-red-800 border-red-300',
      'Method': 'bg-amber-100 text-amber-800 border-amber-300',
      'Misconception': 'bg-orange-100 text-orange-800 border-orange-300',
      'Careless': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Conceptual': 'bg-purple-100 text-purple-800 border-purple-300',
    };
    
    // Find matching color or default
    for (const [key, color] of Object.entries(colors)) {
      if (tag.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-3 h-3 text-green-500" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const sortedErrors = [...errors]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTags);

  const maxSize = Math.max(...sortedErrors.map(e => e.count));
  const minSize = Math.min(...sortedErrors.map(e => e.count));

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
         {title}
      </h3>

      {sortedErrors.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No errors recorded yet. Keep practicing! 
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedErrors.map((error, index) => {
            const size = minSize === maxSize 
              ? 'text-sm' 
              : error.count >= maxSize * 0.8 
                ? 'text-lg' 
                : error.count >= maxSize * 0.5 
                  ? 'text-base' 
                  : 'text-sm';
            
            return (
              <div
                key={index}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 ${getErrorColor(error.tag)} ${size} font-medium transition-transform hover:scale-105 cursor-pointer`}
                title={`${error.count} occurrences - ${error.trend || 'stable'} trend`}
              >
                <span>{error.tag}</span>
                <span className="text-xs opacity-75">({error.count})</span>
                {getTrendIcon(error.trend)}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Error Types:</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
            Arithmetic
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded" />
            Method
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded" />
            Misconception
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded" />
            Conceptual
          </span>
        </div>
      </div>
    </div>
  );
};

export default ErrorTagCloud;
