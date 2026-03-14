'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedWhiteboardProps {
  content: string[]  // Lines of content to write
  writingSpeed?: number  // Characters per second
  highlightColor?: string
  tutorType?: 'maths' | 'science' | 'homework'
  showHandAnimation?: boolean
  autoStart?: boolean
  onComplete?: () => void
}

interface HighlightProps {
  text: string;
  color?: string;
  delay?: number;
  duration?: number;
}

interface VisualExplanationProps {
  type: 'step-highlight' | 'color-code' | 'arrow-point' | 'box-emphasis' | 'underline';
  targetElement?: string;
  explanation?: string;
  position?: { x: number; y: number };
  children?: React.ReactNode;
}

/**
 * AnimatedWhiteboard - Displays content with character-by-character writing animation
 */
const AnimatedWhiteboard: React.FC<AnimatedWhiteboardProps> = ({
  content,
  writingSpeed = 50,
  highlightColor = '#FFD700',
  tutorType = 'maths',
  showHandAnimation = true,
  autoStart = true,
  onComplete,
}) => {
  const [displayedContent, setDisplayedContent] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [isWriting, setIsWriting] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Subject-specific colors
  const subjectColors = {
    maths: { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#06B6D4' },
    science: { primary: '#10B981', secondary: '#34D399', accent: '#06B6D4' },
    homework: { primary: '#EC4899', secondary: '#F472B6', accent: '#A855F7' },
  }

  const colors = subjectColors[tutorType]

  // Start writing animation
  const startWriting = () => {
    setDisplayedContent([])
    setCurrentLine(0)
    setCurrentChar(0)
    setIsWriting(true)
    setHasCompleted(false)
  }

  // Stop writing
  const stopWriting = () => {
    setIsWriting(false)
  }

  // Skip to end
  const skipToEnd = () => {
    setDisplayedContent(content)
    setCurrentLine(content.length)
    setCurrentChar(0)
    setIsWriting(false)
    setHasCompleted(true)
    onComplete?.()
  }

  // Animate writing character by character
  useEffect(() => {
    if (autoStart && !isWriting && !hasCompleted) {
      startWriting()
    }
  }, [autoStart, content])

  useEffect(() => {
    if (isWriting && currentLine < content.length) {
      const line = content[currentLine]
      
      if (currentChar < line.length) {
        // Write next character
        const timer = setTimeout(() => {
          setDisplayedContent(prev => {
            const newContent = [...prev]
            if (!newContent[currentLine]) {
              newContent[currentLine] = ''
            }
            newContent[currentLine] = line.substring(0, currentChar + 1)
            return newContent
          })
          setCurrentChar(prev => prev + 1)
        }, 1000 / writingSpeed)
        
        return () => clearTimeout(timer)
      } else {
        // Line complete, move to next with small pause
        const timer = setTimeout(() => {
          setCurrentLine(prev => prev + 1)
          setCurrentChar(0)
        }, 500)
        
        return () => clearTimeout(timer)
      }
    } else if (isWriting && currentLine >= content.length) {
      // All content written
      setIsWriting(false)
      setHasCompleted(true)
      onComplete?.()
    }
  }, [isWriting, currentLine, currentChar, content, writingSpeed, onComplete])

  // Calculate hand position
  const getHandPosition = () => {
    if (currentLine >= content.length || !displayedContent[currentLine]) {
      return { x: 50, y: 100 }
    }
    
    const lineHeight = 40
    const charWidth = 12
    const x = 50 + (displayedContent[currentLine]?.length || 0) * charWidth
    const y = 80 + currentLine * lineHeight
    
    return { x, y }
  }

  const handPos = getHandPosition()

  return (
    <div className="animated-whiteboard relative bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200">
      {/* Header */}
      <div className={`bg-gradient-to-r from-${tutorType === 'maths' ? 'blue' : tutorType === 'science' ? 'green' : 'pink'}-500 to-${tutorType === 'maths' ? 'indigo' : tutorType === 'science' ? 'emerald' : 'purple'}-500 text-white px-6 py-3`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span></span> Animated Lesson Board
          </h3>
          <div className="flex gap-2">
            {!isWriting && !hasCompleted && (
              <button
                onClick={startWriting}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
              >
                 Start
              </button>
            )}
            {isWriting && (
              <>
                <button
                  onClick={stopWriting}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                   Pause
                </button>
                <button
                  onClick={skipToEnd}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
                >
                   Skip
                </button>
              </>
            )}
            {hasCompleted && (
              <button
                onClick={startWriting}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
              >
                 Replay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div ref={canvasRef} className="p-8 min-h-[400px] relative">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Written content */}
        <div className="relative z-10 space-y-2 font-mono text-lg">
          {displayedContent.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              <span className="text-gray-800">{line}</span>
              {i === currentLine && isWriting && (
                <motion.span
                  className="w-0.5 h-6 bg-blue-500 ml-0.5"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Animated hand */}
        {showHandAnimation && isWriting && (
          <motion.div
            className="absolute z-20 text-4xl pointer-events-none"
            animate={{
              x: handPos.x,
              y: handPos.y,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 28,
            }}
            style={{
              filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))'
            }}
          >
            
          </motion.div>
        )}

        {/* Progress indicator */}
        <div className="absolute bottom-4 left-0 right-0 px-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Progress:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r from-${tutorType === 'maths' ? 'blue' : tutorType === 'science' ? 'green' : 'pink'}-500 to-${tutorType === 'maths' ? 'indigo' : tutorType === 'science' ? 'emerald' : 'purple'}-500`}
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentLine / content.length) * 100)}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span>{Math.round((currentLine / content.length) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Completion celebration */}
      <AnimatePresence>
        {hasCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-6xl mb-4"
              >
                
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Lesson Complete!
              </h3>
              <p className="text-gray-600">Great job following along!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Highlight - Animated text highlighting component
 */
const Highlight: React.FC<HighlightProps> = ({
  text,
  color = '#FFD700',
  delay = 0,
  duration = 1000,
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsHighlighted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <span className="relative inline-block">
      <motion.span
        className="absolute inset-0"
        initial={{ backgroundColor: 'transparent' }}
        animate={{ backgroundColor: isHighlighted ? color : 'transparent' }}
        transition={{ duration: duration / 1000 }}
        style={{ borderRadius: '4px', zIndex: 0 }}
      />
      <span className="relative z-10">{text}</span>
    </span>
  )
}

/**
 * VisualExplanation - Shows visual explanations with different styles
 */
const VisualExplanation: React.FC<VisualExplanationProps> = ({
  type,
  targetElement,
  explanation,
  position,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  switch (type) {
    case 'step-highlight':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
          className="step-highlight-overlay absolute inset-0 pointer-events-none z-20"
        >
          <div className="absolute inset-4 border-4 border-yellow-400 rounded-xl bg-yellow-100/30 animate-pulse" />
          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border-2 border-yellow-400"
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl"></span>
                <p className="text-gray-800 font-medium">{explanation}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )

    case 'color-code':
      return (
        <div className="color-coded-elements inline-flex gap-1">
          {React.Children.map(children, (child, i) => (
            <motion.div
              key={i}
              initial={{ backgroundColor: '#fff' }}
              animate={{ 
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5]
              }}
              transition={{ 
                delay: i * 0.3,
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 2
              }}
              className="px-3 py-2 rounded-lg font-bold text-white"
            >
              {child}
            </motion.div>
          ))}
        </div>
      )

    case 'arrow-point':
      return (
        <svg className="arrow-overlay absolute inset-0 pointer-events-none z-20" style={{ left: position?.x || 0, top: position?.y || 0 }}>
          <motion.path
            d="M0,0 Q50,25 100,50"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            stroke="#EF4444"
            strokeWidth="4"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
            </marker>
          </defs>
          {explanation && (
            <motion.text
              x="110"
              y="50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm font-bold fill-gray-800"
            >
              {explanation}
            </motion.text>
          )}
        </svg>
      )

    case 'box-emphasis':
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block relative"
        >
          <motion.div
            className="absolute -inset-2 border-4 border-blue-500 rounded-lg"
            animate={{
              boxShadow: [
                '0 0 10px rgba(59, 130, 246, 0.5)',
                '0 0 20px rgba(59, 130, 246, 0.8)',
                '0 0 10px rgba(59, 130, 246, 0.5)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="relative z-10">{children}</div>
          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap"
            >
              {explanation}
            </motion.div>
          )}
        </motion.div>
      )

    case 'underline':
      return (
        <div className="inline-block relative">
          {children}
          <motion.svg
            className="absolute -bottom-2 left-0 right-0 h-4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <path
              d="M0,10 Q50,20 100,10"
              stroke="#10B981"
              strokeWidth="3"
              fill="none"
            />
          </motion.svg>
          {explanation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-8 left-0 text-xs text-green-600 font-medium"
            >
              {explanation}
            </motion.div>
          )}
        </div>
      )

    default:
      return <>{children}</>
  }
}

/**
 * StepByStepSolver - Shows math problem solving step-by-step
 */
interface StepByStepSolverProps {
  problem: string;
  steps: string[];
  tutorType?: 'maths' | 'science' | 'homework';
  autoPlay?: boolean;
  stepDelay?: number; // ms between steps
}

const StepByStepSolver: React.FC<StepByStepSolverProps> = ({
  problem,
  steps,
  tutorType = 'maths',
  autoPlay = true,
  stepDelay = 2000,
}) => {
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        if (currentStep >= steps.length - 1) {
          setIsPlaying(false)
        }
      }, stepDelay)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentStep, steps.length, stepDelay])

  const handlePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(-1)
    }
    setIsPlaying(true)
  }

  const handlePause = () => setIsPlaying(false)
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1))

  return (
    <div className="step-by-step-solver bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      {/* Problem */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Problem:</h3>
        <div className="text-2xl font-bold text-gray-800 font-mono">
          {problem}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: i <= currentStep ? 1 : 0.3,
              x: i <= currentStep ? 0 : -20,
              scale: i === currentStep ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              i === currentStep
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : i < currentStep
                ? 'bg-green-50 border-green-400'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                i === currentStep
                  ? 'bg-blue-500 text-white'
                  : i < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {i < currentStep ? '' : i + 1}
              </div>
              <div className="flex-1">
                <p className={`font-mono ${
                  i === currentStep ? 'text-gray-900 font-semibold' : 'text-gray-600'
                }`}>
                  {step}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStep < 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
             Back
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep >= steps.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next 
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
            >
               Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              {currentStep >= steps.length - 1 ? ' Replay' : ' Play'}
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          Step {Math.max(0, currentStep + 1)} of {steps.length}
        </div>
      </div>
    </div>
  )
}

export { AnimatedWhiteboard, Highlight, VisualExplanation, StepByStepSolver }
