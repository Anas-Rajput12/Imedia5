'use client'

import { motion } from 'framer-motion'
import { BookOpen, Lightbulb, FileText, CheckCircle, Shield, Zap } from 'lucide-react'

interface TutorType {
  id: string
  name: string
  tutorName: string
  icon: any
  color: string
  gradient: string
  bgColor: string
  borderColor: string
  description: string
  features: string[]
  teachingStyle: string
}

interface TutorTypeSelectorProps {
  selectedType: string
  onSelectType: (type: string) => void
}

export default function TutorTypeSelector({
  selectedType,
  onSelectType
}: TutorTypeSelectorProps) {
  const tutorTypes: TutorType[] = [
    {
      id: 'maths',
      name: 'Maths',
      tutorName: 'Prof. Mathew',
      icon: BookOpen,
      color: 'text-blue-600',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Step-by-Step Working • UK Curriculum • Exam-board approved methods (AQA/Edexcel/OCR). Live worked examples with full method showing.',
      features: ['Live Worked Examples', 'Method Lock', 'Error Detection'],
      teachingStyle: 'Step-by-Step Working'
    },
    {
      id: 'science',
      name: 'Science',
      tutorName: 'Dr. Science',
      icon: Lightbulb,
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 via-green-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      description: 'Question-Led • Video-Supported • Physics, Chemistry & Biology. Interactive concepts with "why" and "how" questions throughout.',
      features: ['Concept-Based', 'Video Integration', 'Interactive Questions'],
      teachingStyle: 'Question-Led'
    },
    {
      id: 'homework',
      name: 'Homework',
      tutorName: 'Teacher Alex',
      icon: FileText,
      color: 'text-purple-600',
      gradient: 'from-purple-500 via-pink-500 to-rose-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Anti-Cheating • Guided Support • I help you learn, not cheat. Scaffolded learning with similar examples. You solve your own homework!',
      features: ['Guided Help', 'Similar Examples', 'Scaffolded Learning'],
      teachingStyle: 'Guided Support'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {tutorTypes.map((tutor) => {
        const IconComponent = tutor.icon
        const isSelected = selectedType === tutor.id
        
        return (
          <motion.div
            key={tutor.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectType(tutor.id)}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              isSelected
                ? `${tutor.borderColor} ${tutor.bgColor} shadow-xl ring-2 ring-offset-2 ${tutor.color.replace('text-', 'ring-')}`
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Selected Badge */}
            {isSelected && (
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${tutor.gradient} text-white text-xs font-bold rounded-full shadow-lg`}>
                ✓ Selected
              </div>
            )}

            <div className="text-center">
              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${tutor.gradient} flex items-center justify-center shadow-lg`}>
                <IconComponent className="w-10 h-10 text-white" />
              </div>

              {/* Tutor Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {tutor.tutorName}
              </h3>

              {/* Subject */}
              <p className={`text-sm font-semibold ${tutor.color} mb-3`}>
                {tutor.name} with {tutor.tutorName}
              </p>

              {/* Teaching Style Badge */}
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${tutor.bgColor} ${tutor.color} mb-4`}>
                <Zap className="w-3 h-3" />
                {tutor.teachingStyle}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {tutor.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {tutor.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-center gap-2 text-xs font-medium text-gray-700">
                    <CheckCircle className={`w-3.5 h-3.5 ${tutor.color}`} />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Stats (Placeholder for future) */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>0 sessions</span>
                <span>•</span>
                <span>0 messages</span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
