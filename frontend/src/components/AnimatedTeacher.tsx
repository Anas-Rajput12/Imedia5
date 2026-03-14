'use client'

import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'

interface AnimatedTeacherProps {
  tutorType: 'maths' | 'science' | 'homework'
  isSpeaking: boolean
  emotion?: 'happy' | 'neutral' | 'thinking' | 'explaining'
}

// Teacher avatar configurations with Lottie animations
const teacherAvatars = {
  maths: {
    name: 'Prof. Mathew',
    color: 'from-blue-500 to-indigo-600',
    icon: '',
  },
  science: {
    name: 'Dr. Science',
    color: 'from-green-500 to-emerald-600',
    icon: '',
  },
  homework: {
    name: 'Teacher Alex',
    color: 'from-purple-500 to-pink-600',
    icon: '',
  },
}

// Emotion-based animation states
const emotionStates = {
  happy: { eyes: '', mouth: 'smile', hand: 'wave' },
  neutral: { eyes: '', mouth: 'normal', hand: 'rest' },
  thinking: { eyes: '', mouth: 'closed', hand: 'chin' },
  explaining: { eyes: '', mouth: 'talking', hand: 'point' },
}

export default function AnimatedTeacher({ 
  tutorType, 
  isSpeaking, 
  emotion = 'neutral' 
}: AnimatedTeacherProps) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion)
  const [isBlinking, setIsBlinking] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(false)
  
  const teacher = teacherAvatars[tutorType]
  const emotionState = emotionStates[currentEmotion]

  // Auto-blink every 3-5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 200)
    }, 4000)
    
    return () => clearInterval(blinkInterval)
  }, [])

  // Mouth movement when speaking
  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setMouthOpen(prev => !prev)
      }, 150)
      
      return () => clearInterval(mouthInterval)
    } else {
      setMouthOpen(false)
    }
  }, [isSpeaking])

  // Update emotion based on context
  useEffect(() => {
    setCurrentEmotion(emotion)
  }, [emotion])

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border-4 border-gray-200">
      {/* Teacher Avatar Container */}
      <div className={`relative w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br ${teacher.color} rounded-full overflow-hidden shadow-2xl border-4 border-white`}>
        
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Animated Teacher Face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          
          {/* Hair */}
          <div className="absolute top-0 w-40 h-20 bg-gray-800 rounded-t-full"></div>
          
          {/* Face */}
          <div className="relative top-4 w-32 h-36 bg-amber-200 rounded-full shadow-inner">
            
            {/* Eyes */}
            <div className="absolute top-10 left-6 flex gap-8">
              <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-700 ${isBlinking ? 'scale-y-10' : ''} transition-transform duration-100`}>
                <div className={`w-4 h-4 bg-gray-800 rounded-full ${isBlinking ? 'hidden' : ''}`}></div>
              </div>
              <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-700 ${isBlinking ? 'scale-y-10' : ''} transition-transform duration-100`}>
                <div className={`w-4 h-4 bg-gray-800 rounded-full ${isBlinking ? 'hidden' : ''}`}></div>
              </div>
            </div>
            
            {/* Eyebrows */}
            <div className="absolute top-7 left-5 flex gap-9">
              <div className={`w-10 h-2 bg-gray-700 rounded-full ${currentEmotion === 'thinking' ? '-rotate-12' : ''}`}></div>
              <div className={`w-10 h-2 bg-gray-700 rounded-full ${currentEmotion === 'thinking' ? 'rotate-12' : ''}`}></div>
            </div>
            
            {/* Nose */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-300 rounded-full opacity-50"></div>
            
            {/* Mouth */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              {currentEmotion === 'happy' || (isSpeaking && mouthOpen) ? (
                <div className="w-12 h-8 bg-red-400 rounded-b-full border-2 border-gray-700 flex items-center justify-center">
                  <div className="w-8 h-4 bg-red-600 rounded-b-full"></div>
                </div>
              ) : currentEmotion === 'thinking' ? (
                <div className="w-6 h-3 bg-gray-400 rounded-full"></div>
              ) : (
                <div className="w-8 h-2 bg-red-300 rounded-full border-2 border-gray-700"></div>
              )}
            </div>
            
            {/* Cheeks */}
            <div className="absolute top-24 left-4 w-6 h-4 bg-pink-300 rounded-full opacity-60"></div>
            <div className="absolute top-24 right-4 w-6 h-4 bg-pink-300 rounded-full opacity-60"></div>
          </div>
          
          {/* Body/Shoulders */}
          <div className="absolute bottom-0 w-44 h-20 bg-gradient-to-b from-blue-600 to-blue-800 rounded-b-full">
            {/* Tie */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-12 bg-red-500 clip-tie"></div>
          </div>
        </div>
        
        {/* Subject Icon Badge */}
        <div className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-gray-300">
          {teacher.icon}
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
        )}
      </div>
      
      {/* Teacher Name Tag */}
      <div className="mt-4 px-6 py-2 bg-white rounded-full shadow-md border-2 border-gray-200">
        <span className="text-lg font-bold text-gray-800">{teacher.name}</span>
        <span className="ml-2 text-xl">{teacher.icon}</span>
      </div>
      
      {/* Emotion Status */}
      <div className="mt-2 px-4 py-1 bg-gray-100 rounded-full">
        <span className="text-sm text-gray-600">
          {currentEmotion === 'happy' && ' Happy to help!'}
          {currentEmotion === 'neutral' && ' Ready to teach!'}
          {currentEmotion === 'thinking' && ' Let me think...'}
          {currentEmotion === 'explaining' && ' Explaining...'}
        </span>
      </div>
      
      {/* Animation Controls (for demo) */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setCurrentEmotion('happy')}
          className={`px-3 py-1 rounded-full text-sm ${currentEmotion === 'happy' ? 'bg-yellow-400' : 'bg-gray-200'}`}
        >
           Happy
        </button>
        <button
          onClick={() => setCurrentEmotion('thinking')}
          className={`px-3 py-1 rounded-full text-sm ${currentEmotion === 'thinking' ? 'bg-yellow-400' : 'bg-gray-200'}`}
        >
           Thinking
        </button>
        <button
          onClick={() => setCurrentEmotion('explaining')}
          className={`px-3 py-1 rounded-full text-sm ${currentEmotion === 'explaining' ? 'bg-yellow-400' : 'bg-gray-200'}`}
        >
           Explaining
        </button>
      </div>
    </div>
  )
}
