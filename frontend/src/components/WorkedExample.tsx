'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface WorkedExampleStep {
  step: number;
  text: string;
  equation?: string;
  highlight?: boolean;
}

interface WorkedExampleProps {
  problem: string;
  steps: WorkedExampleStep[];
  subject?: 'maths' | 'science' | 'general';
  showAnimation?: boolean;
  onComplete?: () => void;
}

/**
 * Worked Example Display - Shows step-by-step solutions with animation
 * 
 * Features:
 * - Step-by-step reveal animation
 * - Highlighted key operations
 * - Method explanation
 * - Digital whiteboard style
 */
const WorkedExample: React.FC<WorkedExampleProps> = ({
  problem,
  steps,
  subject = 'maths',
  showAnimation = true,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (showAnimation && steps.length > 0) {
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length) {
            clearInterval(timer);
            setIsComplete(true);
            onComplete?.();
            return prev;
          }
          return prev + 1;
        });
      }, 2000); // 2 seconds per step

      return () => clearInterval(timer);
    }
  }, [steps.length, showAnimation, onComplete]);

  const getSubjectColor = () => {
    switch (subject) {
      case 'maths':
        return 'from-blue-500 to-indigo-600';
      case 'science':
        return 'from-emerald-500 to-green-600';
      default:
        return 'from-purple-500 to-pink-600';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getSubjectColor()} text-white p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5" />
          <h3 className="text-lg font-bold">Worked Example</h3>
        </div>
        <p className="text-white/90 font-mono text-sm bg-black/20 p-2 rounded">
          {problem}
        </p>
      </div>

      {/* Steps */}
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`transition-all duration-500 ${
                index < currentStep 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-4 hidden'
              }`}
            >
              <div className={`flex items-start gap-3 p-3 rounded-lg ${
                index === currentStep - 1 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : index < currentStep - 1
                  ? 'bg-gray-50 border border-gray-200'
                  : ''
              }`}>
                {/* Step Number */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-2">{step.text}</p>
                  
                  {step.equation && (
                    <p className={`font-mono text-base sm:text-lg p-2 rounded ${
                      step.highlight 
                        ? 'bg-yellow-100 border-l-4 border-yellow-400 text-blue-700' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {step.equation}
                    </p>
                  )}
                </div>

                {/* Step Indicator */}
                {index === currentStep - 1 && (
                  <ChevronRight className="w-5 h-5 text-blue-500 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-semibold mb-2">
               Example Complete!
            </p>
            <p className="text-sm text-green-700">
              Now it's your turn to try a similar problem. You've got this! 
            </p>
          </div>
        )}

        {/* Progress Indicator */}
        {!isComplete && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <span className="font-medium">{currentStep}/{steps.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkedExample;
