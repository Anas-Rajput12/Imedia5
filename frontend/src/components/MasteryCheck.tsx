/**
 * Mastery Check Component
 * 
 * Step 7 of teaching flow: Mastery check (80% pass threshold)
 * Assesses understanding before moving to next topic
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send } from 'lucide-react'

interface DiagnosticQuestion {
  id: string
  question: string
  correct_answer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface MasteryCheckProps {
  questions: DiagnosticQuestion[]
  onSubmit: (answers: Record<string, string>) => void
  isLoading: boolean
}

export default function MasteryCheck({
  questions,
  onSubmit,
  isLoading,
}: MasteryCheckProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    if (Object.keys(answers).length === 0) return
    onSubmit(answers)
  }

  const allAnswered = questions.every(q => answers[q.id]?.trim())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-4 border-blue-300 shadow-lg"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">📝</span>
          <div>
            <h4 className="font-bold text-blue-800 text-lg">Diagnostic Check</h4>
            <p className="text-xs text-blue-600">Let's see what you understand!</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
          <span className="font-bold">💡 Tip:</span>
          <span>Answer honestly - this helps me teach you better!</span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto p-2">
        {questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <p className="text-sm font-bold text-gray-800 flex-1">
                {q.question}
              </p>
            </div>
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Type your answer here... Take your time!"
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows={3}
            />
            {answers[q.id] && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Answer recorded!</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !allAnswered}
        className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
          allAnswered && !isLoading
            ? `bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Submitting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            Submit Answers
          </span>
        )}
      </button>
    </motion.div>
  )
}
