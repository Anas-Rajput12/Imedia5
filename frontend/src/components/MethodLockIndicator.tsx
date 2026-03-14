'use client'

import { Lock, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react'

interface MethodLockIndicatorProps {
  exam_board: string
  topic: string
  method_name: string
  is_enforced?: boolean
  showDetails?: boolean
}

export default function MethodLockIndicator({
  exam_board,
  topic,
  method_name,
  is_enforced = true,
  showDetails = true,
}: MethodLockIndicatorProps) {
  const methodDetails = getMethodDetails(exam_board, topic, method_name)

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 ${
      is_enforced ? 'border-blue-300' : 'border-amber-300'
    } p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {is_enforced ? (
            <Lock size={20} className="text-blue-600" />
          ) : (
            <AlertTriangle size={20} className="text-amber-600" />
          )}
          <h3 className="font-bold text-gray-800">
            {is_enforced ? 'Method Lock Active' : 'Alternative Method'}
          </h3>
        </div>
        
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
          {exam_board}
        </span>
      </div>

      {/* Method Info */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <BookOpen size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Topic:</p>
            <p className="font-semibold text-gray-800">{topic}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Approved Method:</p>
            <p className="font-semibold text-gray-800">{method_name}</p>
          </div>
        </div>
      </div>

      {/* Detailed Steps */}
      {showDetails && methodDetails && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 text-sm">Method Steps:</h4>
          <ol className="space-y-2">
            {methodDetails.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </span>
                <span className="text-gray-700 flex-1">{step}</span>
              </li>
            ))}
          </ol>

          {/* Key Points */}
          {methodDetails.key_points && methodDetails.key_points.length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
              <h5 className="font-bold text-amber-800 mb-2 text-xs">Key Points to Remember:</h5>
              <ul className="space-y-1">
                {methodDetails.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-amber-700">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Example */}
          {methodDetails.example && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Example:</strong> {methodDetails.example}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Enforcement Notice */}
      {!is_enforced && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
          <p className="text-xs text-amber-800">
            <AlertTriangle size={12} className="inline mr-1" />
            This method is not the exam-board approved method. Make sure to learn the approved method for your exams!
          </p>
        </div>
      )}

      {/* Exam Board Notice */}
      {is_enforced && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
          <p className="text-xs text-green-800 font-medium">
             This is the {exam_board} approved method for exams
          </p>
        </div>
      )}
    </div>
  )
}

function getMethodDetails(
  exam_board: string,
  topic: string,
  method_name: string
): { steps: string[]; key_points: string[]; example: string } | null {
  // In production, retrieve from MethodLockEnforcer service
  // For now, return placeholder based on common methods
  
  const methods: Record<string, any> = {
    'factorising': {
      steps: [
        'Write in form ax² + bx + c = 0',
        'Find two numbers that multiply to give ac and add to give b',
        'Split the middle term using these numbers',
        'Factorise by grouping',
        'Set each factor to zero and solve',
      ],
      key_points: [
        'Always check by expanding brackets',
        'Write final answer as x = value1 or x = value2',
      ],
      example: 'x² + 5x + 6 = (x + 2)(x + 3)',
    },
    'quadratic_formula': {
      steps: [
        'Identify a, b, and c from ax² + bx + c = 0',
        'Substitute into formula: x = (-b ± √(b² - 4ac)) / 2a',
        'Calculate the discriminant: b² - 4ac',
        'Calculate both solutions (plus and minus)',
        'Simplify if possible',
      ],
      key_points: [
        'Formula is provided in exam',
        'Use when factorising is difficult',
        'Check by substituting back',
      ],
      example: 'For 2x² + 5x - 3 = 0: a=2, b=5, c=-3',
    },
    'elimination': {
      steps: [
        'Align equations with like terms in columns',
        'Multiply one or both equations to match coefficients',
        'Add or subtract to eliminate one variable',
        'Solve for remaining variable',
        'Substitute back to find other variable',
        'Check in both original equations',
      ],
      key_points: [
        'Same signs? Subtract. Different signs? Add.',
        'Always check in both equations',
      ],
      example: '2x + y = 7 and x - y = 2 → Add: 3x = 9 → x = 3',
    },
    'common_denominator': {
      steps: [
        'Find lowest common multiple (LCM) of denominators',
        'Convert each fraction to equivalent with common denominator',
        'Add or subtract numerators only',
        'Keep denominator the same',
        'Simplify if possible',
      ],
      key_points: [
        'Never add denominators',
        'Always simplify final answer',
      ],
      example: '2/3 + 1/4 = 8/12 + 3/12 = 11/12',
    },
  }

  return methods[method_name] || null
}
