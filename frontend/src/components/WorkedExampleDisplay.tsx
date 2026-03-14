'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Lightbulb, AlertTriangle, BookOpen } from 'lucide-react'

interface WorkedStep {
  step_number: number
  working: string
  explanation: string
  key_point?: boolean
  common_mistake?: string
  tip?: string
  exam_tip?: string
}

interface WorkedExampleProps {
  title: string
  problem: string
  steps: WorkedStep[]
  method_name?: string
  exam_board?: string
  showAnimation?: boolean
}

export default function WorkedExampleDisplay({
  title,
  problem,
  steps,
  method_name = 'Standard Method',
  exam_board = 'AQA',
  showAnimation = false
}: WorkedExampleProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showAllSteps, setShowAllSteps] = useState(false)

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleShowAll = () => {
    setShowAllSteps(!showAllSteps)
    if (!showAllSteps) {
      setCurrentStep(steps.length - 1)
    } else {
      setCurrentStep(0)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {title}
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Method: {method_name} • Exam Board: {exam_board}
            </p>
          </div>
          <button
            onClick={handleShowAll}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
          >
            {showAllSteps ? 'Show Step-by-Step' : 'Show All Steps'}
          </button>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-amber-50 border-b-2 border-amber-200 p-4">
        <p className="text-lg font-semibold text-gray-800">
          Problem: <span className="text-amber-700 font-mono">{problem}</span>
        </p>
      </div>

      {/* Steps Display */}
      <div className="p-6">
        {showAllSteps ? (
          // Show all steps at once
          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepCard
                key={step.step_number}
                step={step}
                isActive={true}
                isCompleted={true}
                showAll={true}
              />
            ))}
          </div>
        ) : (
          // Show one step at a time with animation
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-blue-500 scale-125'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Current step */}
            <StepCard
              step={steps[currentStep]}
              isActive={true}
              isCompleted={false}
              showAll={false}
            />

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous Step
              </button>

              <span className="text-sm text-gray-600 font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>

              <button
                onClick={handleNextStep}
                disabled={currentStep === steps.length - 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === steps.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next Step →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Key Points Summary */}
      <div className="bg-green-50 border-t-2 border-green-200 p-4">
        <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4" />
          Key Points to Remember:
        </h4>
        <ul className="space-y-1">
          {steps.filter(s => s.key_point).map((step, index) => (
            <li key={index} className="text-sm text-green-700 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{step.explanation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface StepCardProps {
  step: WorkedStep
  isActive: boolean
  isCompleted: boolean
  showAll: boolean
}

function StepCard({ step, isActive, isCompleted, showAll }: StepCardProps) {
  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        isActive
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : isCompleted
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Step number indicator */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
            isCompleted
              ? 'bg-green-500 text-white'
              : isActive
              ? 'bg-blue-500 text-white animate-pulse'
              : 'bg-gray-300 text-gray-600'
          }`}
        >
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.step_number}
        </div>

        {/* Step content */}
        <div className="flex-1">
          {/* Working */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
              Working:
            </p>
            <p className="text-lg font-mono text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
              {step.working}
            </p>
          </div>

          {/* Explanation */}
          <div className="mb-2">
            <p className="text-sm text-gray-700">{step.explanation}</p>
          </div>

          {/* Special notes */}
          {step.common_mistake && (
            <div className="mt-2 flex items-start gap-2 text-red-700 bg-red-50 px-3 py-2 rounded">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Common mistake:</span> {step.common_mistake}
              </p>
            </div>
          )}

          {step.tip && (
            <div className="mt-2 flex items-start gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Tip:</span> {step.tip}
              </p>
            </div>
          )}

          {step.exam_tip && (
            <div className="mt-2 flex items-start gap-2 text-purple-700 bg-purple-50 px-3 py-2 rounded">
              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Exam tip:</span> {step.exam_tip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
