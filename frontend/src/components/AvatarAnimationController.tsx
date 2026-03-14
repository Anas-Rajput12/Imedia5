'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AvatarAnimationProps {
  currentState?: 'explaining' | 'writing' | 'pointing' | 'listening' | 'idle' | 'celebrating'
  ageGroup?: '5-7' | '8-10' | '11-14'
  subject?: 'maths' | 'science' | 'homework'
  enableIdleAnimations?: boolean
  enableMicroExpressions?: boolean
  onGestureComplete?: (gesture: string) => void
}

/**
 * EnhancedAvatarAnimations - Natural gestures, idle movements, and micro-expressions
 * 
 * Features:
 * - Contextual gestures based on teaching state
 * - Natural idle animations (breathing, blinking, subtle movements)
 * - Age-appropriate friendly appearance
 * - Smooth transitions between states
 * - Micro-expressions for emotional connection
 */
const AvatarAnimationController: React.FC<AvatarAnimationProps> = ({
  currentState = 'idle',
  ageGroup = '8-10',
  subject = 'maths',
  enableIdleAnimations = true,
  enableMicroExpressions = true,
  onGestureComplete,
}) => {
  const [activeGesture, setActiveGesture] = useState<string | null>(null)
  const [gestureQueue, setGestureQueue] = useState<Array<{name: string, duration: number}>>([])
  const [facialExpression, setFacialExpression] = useState('neutral')
  const [eyeBlink, setEyeBlink] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState(0)
  const [lastGestureTime, setLastGestureTime] = useState(Date.now())

  // Natural gesture library for each state
  const gestureLibrary = {
    explaining: [
      { name: 'open_palm_right', duration: 2000, frequency: 0.3, weight: 1 },
      { name: 'open_palm_left', duration: 2000, frequency: 0.3, weight: 1 },
      { name: 'counting_fingers', duration: 1500, frequency: 0.2, weight: 1 },
      { name: 'gentle_wave', duration: 1000, frequency: 0.25, weight: 1 },
      { name: 'emphasis_point', duration: 800, frequency: 0.25, weight: 1 },
      { name: 'both_hands_open', duration: 1800, frequency: 0.2, weight: 1 },
    ],
    listening: [
      { name: 'head_tilt_right', duration: 1000, frequency: 0.4, weight: 1 },
      { name: 'head_tilt_left', duration: 1000, frequency: 0.4, weight: 1 },
      { name: 'nod_slowly', duration: 2000, frequency: 0.3, weight: 1 },
      { name: 'attentive_lean', duration: 1500, frequency: 0.3, weight: 1 },
      { name: 'hand_on_chin', duration: 2000, frequency: 0.2, weight: 1 },
    ],
    writing: [
      { name: 'right_hand_write', duration: 3000, frequency: 1.0, weight: 1 },
      { name: 'look_at_board', duration: 2000, frequency: 1.0, weight: 1 },
      { name: 'pause_and_think', duration: 1500, frequency: 0.3, weight: 1 },
    ],
    pointing: [
      { name: 'point_right_index', duration: 1500, frequency: 0.5, weight: 1 },
      { name: 'point_left_index', duration: 1500, frequency: 0.5, weight: 1 },
      { name: 'sweep_gesture', duration: 2000, frequency: 0.3, weight: 1 },
      { name: 'circle_point', duration: 1800, frequency: 0.3, weight: 1 },
    ],
    celebrating: [
      { name: 'both_hands_up', duration: 2000, frequency: 1.0, weight: 1 },
      { name: 'clapping', duration: 1500, frequency: 1.0, weight: 1 },
      { name: 'thumbs_up', duration: 1500, frequency: 0.8, weight: 1 },
      { name: 'excited_jump', duration: 1000, frequency: 0.5, weight: 1 },
    ],
    idle: [
      { name: 'natural_breath', duration: 3000, frequency: 1.0, weight: 1 },
      { name: 'slight_shift_right', duration: 5000, frequency: 0.5, weight: 1 },
      { name: 'slight_shift_left', duration: 5000, frequency: 0.5, weight: 1 },
      { name: 'adjust_glasses', duration: 1500, frequency: 0.1, weight: 1 },
      { name: 'hair_tuck', duration: 1200, frequency: 0.15, weight: 1 },
    ],
  }

  // Facial expressions for each state
  const expressionMap = {
    explaining: 'engaged',
    listening: 'attentive',
    writing: 'focused',
    pointing: 'enthusiastic',
    celebrating: 'joyful',
    idle: 'calm',
  }

  // Age-appropriate avatar features
  const ageFeatures = {
    '5-7': {
      eyeSize: 'large',
      headSize: 1.15,
      smileIntensity: 0.9,
      colors: 'bright',
      accessories: ['colorful_clip', 'fun_watch'],
      features: 'softer,round,friendly',
    },
    '8-10': {
      eyeSize: 'medium-large',
      headSize: 1.05,
      smileIntensity: 0.7,
      colors: 'vibrant',
      accessories: ['backpack', 'pencil_behind_ear'],
      features: 'balanced,approachable',
    },
    '11-14': {
      eyeSize: 'medium',
      headSize: 1.0,
      smileIntensity: 0.5,
      colors: 'natural',
      accessories: ['glasses', 'watch'],
      features: 'mature,confident',
    },
  }

  const features = ageFeatures[ageGroup]

  // Trigger random natural gestures
  useEffect(() => {
    if (!enableIdleAnimations) return

    const currentGestures = gestureLibrary[currentState] || gestureLibrary.idle
    
    const triggerGesture = () => {
      const now = Date.now()
      const timeSinceLastGesture = now - lastGestureTime
      
      // Don't trigger too frequently
      if (timeSinceLastGesture < 3000) {
        scheduleNextGesture()
        return
      }

      // Weighted random selection
      const gesture = weightedRandomGesture(currentGestures)
      
      if (gesture && Math.random() < gesture.frequency) {
        executeGesture(gesture)
        setLastGestureTime(now)
      } else {
        scheduleNextGesture()
      }
    }

    const scheduleNextGesture = () => {
      const nextCheck = Math.random() * 4000 + 2000 // 2-6 seconds
      const timer = setTimeout(triggerGesture, nextCheck)
      return () => clearTimeout(timer)
    }

    const cleanup = scheduleNextGesture()
    return cleanup
  }, [currentState, enableIdleAnimations, lastGestureTime])

  // Natural blinking
  useEffect(() => {
    if (!enableMicroExpressions) return

    const blinkInterval = setInterval(() => {
      setEyeBlink(true)
      setTimeout(() => setEyeBlink(false), 150)
    }, 4000 + Math.random() * 2000) // 4-6 seconds

    return () => clearInterval(blinkInterval)
  }, [enableMicroExpressions])

  // Natural breathing animation
  useEffect(() => {
    if (!enableIdleAnimations) return

    const breathe = () => {
      setBreathingPhase(prev => (prev + 1) % 100)
    }

    const breathInterval = setInterval(breathe, 60) // ~3 second breath cycle
    return () => clearInterval(breathInterval)
  }, [enableIdleAnimations])

  // Update facial expression based on state
  useEffect(() => {
    setFacialExpression(expressionMap[currentState] || 'neutral')
  }, [currentState])

  // Weighted random gesture selection
  const weightedRandomGesture = (gestures: any[]) => {
    const totalWeight = gestures.reduce((sum, g) => sum + g.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const gesture of gestures) {
      if (random < gesture.weight) {
        return gesture
      }
      random -= gesture.weight
    }
    
    return gestures[0]
  }

  // Execute gesture
  const executeGesture = (gesture: {name: string, duration: number}) => {
    setActiveGesture(gesture.name)
    
    setTimeout(() => {
      setActiveGesture(null)
      onGestureComplete?.(gesture.name)
    }, gesture.duration)
  }

  // Calculate breathing scale
  const breathingScale = 1 + Math.sin(breathingPhase * 0.0628) * 0.02 // 2% scale variation

  return (
    <div className="avatar-animation-controller relative">
      {/* Avatar container with smooth transitions */}
      <motion.div
        className="avatar-container relative"
        animate={{
          scale: breathingScale,
          y: Math.sin(breathingPhase * 0.0628) * 3, // 3px vertical breathing
        }}
        transition={{
          duration: 0.1,
          ease: "linear",
        }}
        style={{
          transformOrigin: 'bottom center',
        }}
      >
        {/* Head */}
        <motion.div
          className="avatar-head relative"
          animate={{
            scale: features.headSize,
            rotate: activeGesture?.includes('tilt') ? 
              (activeGesture.includes('right') ? 5 : -5) : 0,
          }}
          transition={{
            duration: activeGesture ? 0.3 : 1,
            ease: "easeInOut",
          }}
        >
          {/* Face */}
          <div className="face relative bg-gradient-to-b from-peach-200 to-peach-300 rounded-full">
            {/* Eyes */}
            <div className="eyes flex justify-center gap-4 mt-8">
              <motion.div
                className="eye w-6 h-6 bg-white rounded-full relative overflow-hidden"
                animate={{
                  scaleY: eyeBlink ? 0.1 : 1,
                }}
                transition={{
                  duration: 0.1,
                }}
              >
                <div className="pupil w-3 h-3 bg-gray-800 rounded-full absolute bottom-1 left-1.5" />
              </motion.div>
              <motion.div
                className="eye w-6 h-6 bg-white rounded-full relative overflow-hidden"
                animate={{
                  scaleY: eyeBlink ? 0.1 : 1,
                }}
                transition={{
                  duration: 0.1,
                }}
              >
                <div className="pupil w-3 h-3 bg-gray-800 rounded-full absolute bottom-1 left-1.5" />
              </motion.div>
            </div>

            {/* Eyebrows */}
            <motion.div
              className="eyebrows absolute top-6 flex justify-center gap-6"
              animate={{
                y: facialExpression === 'surprised' ? -2 : 0,
                rotate: activeGesture?.includes('tilt') ? 
                  (activeGesture.includes('right') ? -3 : 3) : 0,
              }}
            >
              <div className="eyebrow w-4 h-1.5 bg-gray-700 rounded-full" />
              <div className="eyebrow w-4 h-1.5 bg-gray-700 rounded-full" />
            </motion.div>

            {/* Smile */}
            <motion.div
              className="mouth absolute bottom-6 left-1/2 transform -translate-x-1/2"
              animate={{
                scale: 1 + (facialExpression === 'joyful' ? 0.2 : 0),
                y: facialExpression === 'joyful' ? -2 : 0,
              }}
            >
              <motion.div
                className="w-8 h-4 border-b-4 border-red-400 rounded-b-full"
                style={{
                  borderBottomWidth: 4 + (facialExpression === 'joyful' ? 2 : 0),
                }}
              />
            </motion.div>

            {/* Cheeks */}
            {facialExpression === 'joyful' && (
              <>
                <motion.div
                  className="cheek absolute bottom-8 left-4 w-4 h-3 bg-pink-300 rounded-full opacity-60"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
                <motion.div
                  className="cheek absolute bottom-8 right-4 w-4 h-3 bg-pink-300 rounded-full opacity-60"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              </>
            )}
          </div>

          {/* Hair */}
          <div className="hair absolute -top-4 left-0 right-0 h-16 bg-gradient-to-b from-gray-800 to-gray-700 rounded-t-full" />
        </motion.div>

        {/* Body */}
        <motion.div
          className="avatar-body relative mt-2"
          animate={{
            scale: breathingScale,
            rotate: activeGesture?.includes('shift') ? 
              (activeGesture.includes('right') ? 3 : -3) : 0,
          }}
        >
          <div className="torso bg-blue-500 rounded-2xl h-32 w-40" />
          
          {/* Arms */}
          <AnimatePresence>
            {activeGesture && (
              <>
                {activeGesture.includes('open_palm') && (
                  <motion.div
                    className="arm-gesture absolute"
                    initial={{ rotate: 0, y: 0 }}
                    animate={{ 
                      rotate: activeGesture.includes('right') ? -45 : 45,
                      y: -20,
                    }}
                    exit={{ rotate: 0, y: 0 }}
                  >
                    <div className="arm bg-blue-500 w-12 h-32 rounded-full" />
                    <div className="hand bg-peach-300 w-8 h-8 rounded-full absolute -bottom-4 left-2" />
                  </motion.div>
                )}

                {activeGesture === 'thumbs_up' && (
                  <motion.div
                    className="arm-gesture absolute right-0"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: -90 }}
                    exit={{ rotate: 0 }}
                  >
                    <div className="arm bg-blue-500 w-12 h-32 rounded-full" />
                    <div className="hand bg-peach-300 w-8 h-8 rounded-full absolute -bottom-4 left-2" />
                    <motion.div
                      className="thumb bg-peach-300 w-3 h-6 rounded absolute -top-2 left-6"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: -20 }}
                    />
                  </motion.div>
                )}

                {activeGesture === 'clapping' && (
                  <motion.div
                    className="hands-clapping absolute"
                    animate={{
                      x: [-30, 30, -30],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                    }}
                  >
                    <div className="hand-left bg-peach-300 w-10 h-10 rounded-full" />
                    <div className="hand-right bg-peach-300 w-10 h-10 rounded-full ml-8" />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* State indicator (for debugging) */}
      <div className="state-indicator absolute top-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        {currentState} {activeGesture && `→ ${activeGesture}`}
      </div>
    </div>
  )
}

/**
 * useAvatarState - Hook to manage avatar state transitions
 */
const useAvatarState = () => {
  const [state, setState] = useState<'explaining' | 'writing' | 'pointing' | 'listening' | 'idle' | 'celebrating'>('idle')
  const [transitioning, setTransitioning] = useState(false)

  const transitionTo = async (newState: typeof state) => {
    if (state === newState || transitioning) return
    
    setTransitioning(true)
    
    // Smooth transition
    setState('idle') // Brief neutral state
    await new Promise(resolve => setTimeout(resolve, 200))
    setState(newState)
    
    await new Promise(resolve => setTimeout(resolve, 300))
    setTransitioning(false)
  }

  return {
    currentState: state,
    transitioning,
    transitionTo,
    setTo: setState,
  }
}

export { AvatarAnimationController, useAvatarState }
