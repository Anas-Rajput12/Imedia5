'use client';

import React from 'react';

interface TeachingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepNames?: string[];
  tutorType?: string;
}

/**
 * Teaching Step Indicator - Shows progress through the 7-step teaching loop
 * 
 * Features:
 * - Visual progress bar
 * - Completed steps (green)
 * - Current step (blue, highlighted)
 * - Pending steps (grey)
 * - Step names on hover
 */
const TeachingStepIndicator: React.FC<TeachingStepIndicatorProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  stepNames = [
    'Confirm',
    'Diagnostic',
    'Teach',
    'Example',
    'Attempt',
    'Feedback',
    'Mastery'
  ],
  tutorType = 'maths'
}) => {
  const getStepColor = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      return 'bg-green-500 border-green-600 text-white';
    }
    if (stepIndex === currentStep - 1) {
      return 'bg-blue-600 border-blue-700 text-white animate-pulse';
    }
    return 'bg-gray-200 border-gray-300 text-gray-500';
  };

  const getStepIcon = (stepIndex: number) => {
    const icons = ['', '', '', '', '', '', ''];
    return icons[stepIndex] || '';
  };

  const tutorColors: Record<string, string> = {
    maths: 'from-blue-500 to-indigo-600',
    science: 'from-emerald-500 to-green-600',
    homework: 'from-purple-500 to-pink-600'
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Teaching Steps:</span>
            <span className={`text-xs font-bold bg-gradient-to-r ${tutorColors[tutorType]} text-white px-2 py-0.5 rounded-full`}>
              Step {currentStep}/{totalSteps}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {completedSteps.length === totalSteps ? (
              <span className="text-green-600 font-semibold"> Session Complete!</span>
            ) : (
              <span>Progress: {Math.round((completedSteps.length / totalSteps) * 100)}%</span>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`flex-1 flex flex-col items-center gap-1 transition-all duration-300 ${
                index === currentStep - 1 ? 'scale-110' : ''
              }`}
            >
              {/* Step Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-xs sm:text-lg font-bold transition-all duration-300 ${getStepColor(index)}`}
                title={stepNames[index]}
              >
                {getStepIcon(index)}
              </div>

              {/* Step Name (shown on larger screens) */}
              <span className={`text-[10px] sm:text-xs font-medium text-center hidden md:block ${
                index === currentStep - 1 ? 'text-blue-600 font-bold' : 'text-gray-500'
              }`}>
                {stepNames[index]}
              </span>

              {/* Connector Line (except for last step) */}
              {index < totalSteps - 1 && (
                <div className="absolute h-0.5 w-full bg-gray-200 -z-10" style={{ 
                  left: '50%',
                  background: completedSteps.includes(index + 1) ? '#22C55E' : '#E5E7EB'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Description */}
        <div className="mt-3 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Current:</span>{' '}
            {stepNames[currentStep - 1] || 'Getting started...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeachingStepIndicator;
