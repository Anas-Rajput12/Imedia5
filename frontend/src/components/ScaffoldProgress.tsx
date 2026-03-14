'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';

interface ScaffoldProgressProps {
  currentStep: number;
  totalSteps?: number;
  stepNames?: string[];
}

export default function ScaffoldProgress({
  currentStep,
  totalSteps = 5,
  stepNames = [
    'Break Down',
    'Similar Example',
    'Guided Attempt',
    'Feedback',
    'Return to Original',
  ],
}: ScaffoldProgressProps) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-amber-800"> Guided Support Steps</span>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {stepNames.map((stepName, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepName} className="flex-1 flex flex-col items-center">
              {/* Step Indicator */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg scale-110'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{stepNumber}</span>
                )}
              </motion.div>
              
              {/* Step Name */}
              <span className={`text-xs mt-2 text-center font-medium ${
                isCurrent ? 'text-amber-800' : 'text-gray-500'
              }`}>
                {stepName}
              </span>
              
              {/* Connector Line */}
              {index < stepNames.length - 1 && (
                <div className="absolute w-full h-0.5 bg-gray-200 -z-10" style={{
                  left: '50%',
                  top: '20px',
                }} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <p className="text-xs text-amber-700 mt-2 text-center">
        Step {currentStep} of {totalSteps} • {Math.round((currentStep / totalSteps) * 100)}% complete
      </p>
    </div>
  );
}
