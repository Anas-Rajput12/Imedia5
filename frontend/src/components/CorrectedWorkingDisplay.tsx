/**
 * Corrected Working Display Component - Shows student's working with error corrections.
 */

'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';

interface WorkingStep {
  stepNumber: number;
  studentWorking: string;
  isCorrect: boolean;
  errorType?: 'method' | 'arithmetic' | 'misconception';
  correction?: string;
  explanation?: string;
}

interface CorrectedWorkingDisplayProps {
  question: string;
  correctAnswer: string;
  studentWorking: WorkingStep[];
  overallFeedback?: string;
}

export default function CorrectedWorkingDisplay({
  question,
  correctAnswer,
  studentWorking,
  overallFeedback,
}: CorrectedWorkingDisplayProps) {
  const totalSteps = studentWorking.length;
  const correctSteps = studentWorking.filter(s => s.isCorrect).length;
  const errorSteps = studentWorking.filter(s => !s.isCorrect);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3">
          <Edit3 className="w-6 h-6" />
          <div>
            <h3 className="font-bold text-lg">Working Analysis</h3>
            <p className="text-sm text-blue-100">
              {correctSteps}/{totalSteps} steps correct
            </p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-4 bg-gray-50 border-b">
        <p className="font-semibold text-gray-900 mb-2">Question:</p>
        <p className="text-gray-700">{question}</p>
      </div>

      {/* Step-by-Step Analysis */}
      <div className="p-4 space-y-4">
        {studentWorking.map((step, index) => (
          <motion.div
            key={step.stepNumber}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-xl border-2 p-4 ${
              step.isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Step Number & Status */}
              <div className="flex-shrink-0">
                {step.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-700">Step {step.stepNumber}</span>
                  {!step.isCorrect && step.errorType && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      step.errorType === 'method' ? 'bg-orange-100 text-orange-700' :
                      step.errorType === 'arithmetic' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {step.errorType.charAt(0).toUpperCase() + step.errorType.slice(1)} Error
                    </span>
                  )}
                </div>

                {/* Student Working */}
                <div className={`p-3 rounded-lg mb-3 ${
                  step.isCorrect ? 'bg-white' : 'bg-white line-through text-gray-500'
                }`}>
                  <p className="text-sm font-mono">{step.studentWorking}</p>
                </div>

                {/* Correction */}
                {!step.isCorrect && step.correction && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800 text-sm">Correct Method:</span>
                    </div>
                    <p className="text-sm font-mono text-green-900">{step.correction}</p>
                  </motion.div>
                )}

                {/* Explanation */}
                {!step.isCorrect && step.explanation && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <p className="text-sm text-amber-800">
                      <strong>Let's fix this step together:</strong> {step.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Feedback */}
      {overallFeedback && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Teacher's Feedback</h4>
              <p className="text-sm text-blue-800">{overallFeedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Correct Answer Summary */}
      <div className="p-4 bg-gray-50 border-t">
        <p className="font-semibold text-gray-900 mb-2">Correct Answer:</p>
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <p className="font-mono text-lg text-gray-900">{correctAnswer}</p>
        </div>
      </div>
    </div>
  );
}
