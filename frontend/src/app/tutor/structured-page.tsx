/**
 * Structured AI Tutor Page
 * 
 * Implements mandatory 7-step teaching loop:
 * 1. Confirm year group + topic (Curriculum Lock via Qdrant)
 * 2. Diagnostic micro-check (1-3 questions via OpenRouter)
 * 3. Teach in small chunk (OpenRouter + Qdrant context)
 * 4. Guided example (OpenRouter generated worked examples)
 * 5. Student attempt (evaluation via OpenRouter)
 * 6. Feedback with personalisation (trigger-based: 2 incorrect, 3 failed)
 * 7. Mastery check before moving on (80% pass threshold)
 * 
 * Backend: Qdrant (curriculum) + OpenRouter (content generation)
 * Anti-Chat-Drift: Cannot skip steps
 * Curriculum Lock: Only teaches approved content with >0.7 confidence
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { AlertCircle, BookOpen, CheckCircle, XCircle } from 'lucide-react'
import ChatInput from '@/components/common/ChatInput'
import AvatarTeacher from '@/components/AvatarTeacher'
import LessonBoard from '@/components/LessonBoard'
import DiagnosticQuiz from '@/components/DiagnosticQuiz'
import MasteryCheck from '@/components/MasteryCheck'
import * as ragService from '@/services/ragService'
import * as structuredTeachingService from '@/services/structuredTeaching.service'

// ==================== TYPES ====================

interface Message {
  id: string
  sender: 'student' | 'teacher'
  text: string
  timestamp?: Date
}

type TeachingStep = 
  | 'topic_selection'
  | 'diagnostic'
  | 'teach_chunk'
  | 'guided_example'
  | 'student_attempt'
  | 'feedback'
  | 'mastery_check'
  | 'complete'

// ==================== TUTOR CONFIG ====================

const tutorConfigs = {
  maths: {
    name: 'Prof. Mathew',
    icon: '📐',
    color: 'text-blue-600',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    bgColor: 'bg-blue-50',
    subject: 'Mathematics',
    description: 'Step-by-Step Working • Exam-board approved methods',
  },
  science: {
    name: 'Dr. Science',
    icon: '🔬',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    subject: 'Science',
    description: 'Question-Led • Video-Supported • Interactive',
  },
  homework: {
    name: 'Teacher Alex',
    icon: '📚',
    color: 'text-purple-600',
    gradient: 'from-purple-500 via-pink-500 to-rose-600',
    bgColor: 'bg-purple-50',
    subject: 'Homework Help',
    description: 'Guided Support • Anti-Cheating • Method-First',
  },
}

// ==================== MAIN COMPONENT ====================

export default function StructuredTutorPage() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const type = searchParams.get('type') || 'maths'
  const currentTutor = tutorConfigs[type as keyof typeof tutorConfigs] || tutorConfigs.maths

  // ==================== STATE: CURRICULUM (STEP 1) ====================
  
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableTopics, setAvailableTopics] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [curriculumLoading, setCurriculumLoading] = useState(false)
  const [curriculumLockStatus, setCurriculumLockStatus] = useState<any>(null)

  // ==================== STATE: TEACHING FLOW ====================

  const [currentStep, setCurrentStep] = useState<TeachingStep>('topic_selection')
  const [sessionId, setSessionId] = useState<string>('')
  const [chat, setChat] = useState<Message[]>([])
  const [boardText, setBoardText] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')

  // ==================== STATE: DIAGNOSTIC (STEP 2) ====================

  const [diagnosticQuestions, setDiagnosticQuestions] = useState<any[]>([])
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0)
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(false)

  // ==================== STATE: TEACHING (STEP 3-4) ====================

  const [teachingChunk, setTeachingChunk] = useState<any>(null)
  const [workedExample, setWorkedExample] = useState<any>(null)

  // ==================== STATE: PRACTICE (STEP 5-6) ====================

  const [currentAnswer, setCurrentAnswer] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [feedback, setFeedback] = useState<any>(null)
  const [personalisationTrigger, setPersonalisationTrigger] = useState<any>(null)

  // ==================== STATE: MASTERY (STEP 7) ====================

  const [masteryQuestions, setMasteryQuestions] = useState<any[]>([])
  const [masteryPassed, setMasteryPassed] = useState(false)
  const [showMasteryCheck, setShowMasteryCheck] = useState(false)

  // ==================== STATE: UI ====================

  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ==================== LIFECYCLE: LOAD CURRICULUM ====================

  useEffect(() => {
    loadYears()
  }, [type])

  useEffect(() => {
    if (selectedYear) {
      loadTopics(selectedYear)
    }
  }, [selectedYear, type])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // ==================== CURRICULUM LOADING (Qdrant) ====================

  async function loadYears() {
    setCurriculumLoading(true)
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'
      const years = await ragService.getYears(subject)
      setAvailableYears(years)
    } catch (error) {
      console.error('Error loading years:', error)
      setAvailableYears([])
    } finally {
      setCurriculumLoading(false)
    }
  }

  async function loadTopics(year: string) {
    setCurriculumLoading(true)
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'
      const topics = await ragService.getTopics(subject, year)
      setAvailableTopics(topics)
    } catch (error) {
      console.error('Error loading topics:', error)
      setAvailableTopics([])
    } finally {
      setCurriculumLoading(false)
    }
  }

  // ==================== STEP 1: SELECT TOPIC + CURRICULUM LOCK ====================

  async function handleTopicSelect(topic: string) {
    setIsLoading(true)
    setError(null)

    try {
      setSelectedTopic(topic)
      setLessonTopic(topic)
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'

      // START SESSION (includes curriculum lock validation)
      const result = await structuredTeachingService.startSession(topic, type, selectedYear)

      if (!result) {
        setError('Failed to start session. Please try again.')
        return
      }

      // Check curriculum lock
      if (!result.curriculum_lock.locked) {
        setCurriculumLockStatus(result.curriculum_lock)
        setError(result.curriculum_lock.message || 'Curriculum validation failed')
        return
      }

      // Curriculum locked successfully
      setSessionId(result.session_id)
      setDiagnosticQuestions(result.diagnostic_questions)
      
      // Welcome message
      const welcomeMsg: Message = {
        id: 'welcome',
        sender: 'teacher',
        text: result.welcome_message,
        type: 'text',
      }
      setChat([welcomeMsg])
      speakText(result.welcome_message)

      // Update board
      setBoardText(`${subject.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 ${topic}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nStep 1: Diagnostic Check\n\nLet's see what you already know!`)

      // MOVE TO STEP 2: DIAGNOSTIC
      setCurrentStep('diagnostic')
      setShowDiagnosticQuiz(true)
    } catch (error) {
      console.error('Error starting session:', error)
      setError('Failed to start session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== STEP 2: SUBMIT DIAGNOSTIC ====================

  async function handleDiagnosticSubmit(answers: Record<string, string>) {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const result = await structuredTeachingService.submitDiagnostic(
        sessionId,
        Object.entries(answers).map(([question, answer]) => ({ question, answer }))
      )

      if (!result) {
        setError('Failed to submit diagnostic.')
        return
      }

      setDiagnosticScore(result.diagnostic_score)
      setTeachingChunk(result.teaching_chunk)

      // Feedback message
      const feedbackMsg: Message = {
        id: `diagnostic_feedback_${Date.now()}`,
        sender: 'teacher',
        text: result.message,
        type: 'text',
      }
      setChat(prev => [...prev, feedbackMsg])
      speakText(result.message)

      // MOVE TO STEP 3: TEACH CHUNK
      setCurrentStep('teach_chunk')
      setShowDiagnosticQuiz(false)
      displayTeachingChunk(result.teaching_chunk)
    } catch (error) {
      console.error('Error submitting diagnostic:', error)
      setError('Failed to submit diagnostic.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== STEP 3: DISPLAY TEACHING CHUNK ====================

  function displayTeachingChunk(chunk: any) {
    let boardContent = `${type.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${chunk.title}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    
    boardContent += `${chunk.content}\n\n`
    boardContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    if (chunk.key_points?.length > 0) {
      boardContent += `**Key Points:**\n`
      chunk.key_points.forEach((point: string, idx: number) => {
        boardContent += `${idx + 1}. ${point}\n`
      })
      boardContent += `\n`
    }

    if (chunk.analogies?.length > 0) {
      boardContent += `\n💡 **Think of it like:**\n`
      chunk.analogies.forEach((analogy: string) => {
        boardContent += `• ${analogy}\n`
      })
    }

    boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"Take your time to understand this."\n"Ask me if you're confused!"`

    setBoardText(boardContent)

    // Auto-prompt for worked example
    setTimeout(() => {
      const promptMsg: Message = {
        id: `example_prompt_${Date.now()}`,
        sender: 'teacher',
        text: `Great! Now let's look at a **worked example** to see how this works in practice...`,
        type: 'text',
      }
      setChat(prev => [...prev, promptMsg])
      speakText(promptMsg.text)

      // MOVE TO STEP 4: GUIDED EXAMPLE
      setTimeout(() => getWorkedExample(), 2000)
    }, 2000)
  }

  // ==================== STEP 4: GET WORKED EXAMPLE ====================

  async function getWorkedExample() {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const result = await structuredTeachingService.getWorkedExample(sessionId)

      if (!result) {
        setError('Failed to load example.')
        return
      }

      setWorkedExample(result.worked_example)
      displayWorkedExample(result.worked_example)

      // Prompt student to attempt
      setTimeout(() => {
        const attemptMsg: Message = {
          id: `attempt_prompt_${Date.now()}`,
          sender: 'teacher',
          text: `Now it's **your turn**! \n\nTry solving a similar problem yourself. Show all your working!`,
          type: 'text',
        }
        setChat(prev => [...prev, attemptMsg])
        speakText(attemptMsg.text)

        // MOVE TO STEP 5: STUDENT ATTEMPT
        setCurrentStep('student_attempt')
      }, 3000)
    } catch (error) {
      console.error('Error getting worked example:', error)
      setError('Failed to load example.')
    } finally {
      setIsLoading(false)
    }
  }

  function displayWorkedExample(example: any) {
    let boardContent = `${type.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nWORKED EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    boardContent += `**Problem:**\n${example.problem}\n\n`
    boardContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    if (example.steps?.length > 0) {
      example.steps.forEach((step: string, idx: number) => {
        boardContent += `**Step ${idx + 1}:**\n${step}\n\n`
      })
    }

    if (type !== 'homework' && example.final_answer) {
      boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Final Answer:** ${example.final_answer}\n\n`
    }

    if (example.method_notes) {
      boardContent += `\n📝 **Method Notes:**\n${example.method_notes}\n`
    }

    if (example.exam_tips?.length > 0) {
      boardContent += `\n⭐ **Exam Tips:**\n`
      example.exam_tips.forEach((tip: string) => {
        boardContent += `• ${tip}\n`
      })
    }

    setBoardText(boardContent)
  }

  // ==================== STEP 5: SUBMIT STUDENT ATTEMPT ====================

  async function handleSubmitAttempt() {
    if (!sessionId || !currentAnswer.trim()) return

    setIsLoading(true)
    try {
      const result = await structuredTeachingService.submitAttempt(sessionId, currentAnswer)

      if (!result) {
        setError('Failed to submit answer.')
        return
      }

      setFeedback(result.feedback)
      setAttemptCount(prev => prev + 1)

      // Show feedback message
      const feedbackMsg: Message = {
        id: `feedback_${Date.now()}`,
        sender: 'teacher',
        text: result.feedback.message,
        type: 'text',
      }
      setChat(prev => [...prev, feedbackMsg])
      speakText(result.feedback.message)

      // PERSONALISATION ENGINE: Check triggers
      if (result.personalisation) {
        setPersonalisationTrigger(result.personalisation)

        // Show visual analogy if triggered
        if (result.personalisation.visual_analogy) {
          const analogyMsg: Message = {
            id: `analogy_${Date.now()}`,
            sender: 'teacher',
            text: `💡 ${result.personalisation.visual_analogy}`,
            type: 'text',
          }
          setChat(prev => [...prev, analogyMsg])
        }

        // Show scaffolded steps if triggered
        if (result.personalisation.scaffolded_steps) {
          const scaffoldMsg: Message = {
            id: `scaffold_${Date.now()}`,
            sender: 'teacher',
            text: `Let me break this down:\n\n${result.personalisation.scaffolded_steps.join('\n')}`,
            type: 'text',
          }
          setChat(prev => [...prev, scaffoldMsg])
        }
      }

      // MOVE TO STEP 6: FEEDBACK
      setCurrentStep('feedback')

      // Auto-proceed to mastery if correct
      if (result.feedback.is_correct || result.next_step === 'mastery_check') {
        setTimeout(() => generateMasteryCheck(), 2000)
      }
    } catch (error) {
      console.error('Error submitting attempt:', error)
      setError('Failed to submit answer.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== STEP 7: GENERATE MASTERY CHECK ====================

  async function generateMasteryCheck() {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const result = await structuredTeachingService.generateMasteryCheck(sessionId)

      if (!result) {
        setError('Failed to load quiz.')
        return
      }

      setMasteryQuestions(result.mastery_check.questions)
      setShowMasteryCheck(true)

      const masteryMsg: Message = {
        id: `mastery_${Date.now()}`,
        sender: 'teacher',
        text: `Great work! Now let's check your understanding with a quick quiz.\n\nPass mark: ${result.mastery_check.pass_threshold}%`,
        type: 'text',
      }
      setChat(prev => [...prev, masteryMsg])
      speakText(masteryMsg.text)

      // Update board
      setBoardText(`${type.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nMASTERY CHECK\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAnswer these questions to show you understand **${selectedTopic}**.\n\nPass mark: ${result.mastery_check.pass_threshold}%\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nGood luck! You've got this!`)

      // MOVE TO STEP 7: MASTERY CHECK
      setCurrentStep('mastery_check')
    } catch (error) {
      console.error('Error generating mastery check:', error)
      setError('Failed to load quiz.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== STEP 7: SUBMIT MASTERY ====================

  async function handleMasterySubmit(answers: Record<string, string>) {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const result = await structuredTeachingService.submitMastery(
        sessionId,
        Object.entries(answers).map(([question, answer]) => ({ question, answer }))
      )

      if (!result) {
        setError('Failed to submit quiz.')
        return
      }

      setMasteryPassed(result.mastery_passed)

      const completionMsg: Message = {
        id: `complete_${Date.now()}`,
        sender: 'teacher',
        text: result.next_steps,
        type: 'text',
      }
      setChat(prev => [...prev, completionMsg])
      speakText(result.next_steps)

      // MOVE TO COMPLETE
      setCurrentStep('complete')
      setShowMasteryCheck(false)
    } catch (error) {
      console.error('Error submitting mastery:', error)
      setError('Failed to submit quiz.')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== UTILITY: SPEAK TEXT ====================

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ')
      )
      utterance.rate = 1.0
      utterance.pitch = 1.0
      
      const voices = window.speechSynthesis.getVoices()
      const voiceType = type === 'science' ? 'female' : 'male'
      
      if (voiceType === 'female') {
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'))
        if (femaleVoice) utterance.voice = femaleVoice
      } else {
        const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'))
        if (maleVoice) utterance.voice = maleVoice
      }

      utterance.onend = () => setIsSpeaking(false)
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  // ==================== RENDER: STEP INDICATOR ====================

  function renderStepIndicator() {
    const steps = [
      { id: 'topic_selection', label: 'Topic', icon: '📚' },
      { id: 'diagnostic', label: 'Check', icon: '📝' },
      { id: 'teach_chunk', label: 'Learn', icon: '📖' },
      { id: 'guided_example', label: 'Example', icon: '💡' },
      { id: 'student_attempt', label: 'Practice', icon: '✏️' },
      { id: 'feedback', label: 'Feedback', icon: '💬' },
      { id: 'mastery_check', label: 'Mastery', icon: '✅' },
    ]

    const currentStepIndex = steps.findIndex(s => s.id === currentStep)

    return (
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex-1 min-w-[60px] h-12 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  idx === currentStepIndex
                    ? `bg-gradient-to-r ${currentTutor.gradient} text-white shadow-lg scale-105`
                    : idx < currentStepIndex
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
              >
                <span className="text-xl">{step.icon}</span>
                <span className="text-xs font-bold hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==================== RENDER: MAIN UI ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-sm"
              >
                ← Dashboard
              </Link>
              
              <div className={`px-4 py-2 rounded-xl ${currentTutor.bgColor} border-2 border-blue-200`}>
                <h1 className={`text-lg font-bold ${currentTutor.color}`}>
                  {currentTutor.name}
                </h1>
              </div>

              {lessonTopic && (
                <div className="px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                  <span className="text-sm font-semibold">{lessonTopic}</span>
                </div>
              )}
            </div>

            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border-2 border-red-200"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* STEP INDICATOR */}
      {renderStepIndicator()}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden max-w-[1920px] mx-auto w-full">
        
        {/* LEFT: LESSON BOARD */}
        <div className="flex-1 min-w-[500px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          <LessonBoard
            tutorType={type as 'maths' | 'science' | 'homework'}
            currentSlide={0}
            totalSlides={1}
            onNextSlide={() => {}}
            onPrevSlide={() => {}}
            boardText={boardText}
            lessonTitle={lessonTopic}
            lessonContent=""
          />
        </div>

        {/* CENTER: AVATAR */}
        <div className="w-[28%] min-w-[300px] flex flex-col gap-3">
          <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
            <div className={`p-4 rounded-t-2xl bg-gradient-to-r ${currentTutor.gradient} text-white`}>
              <h3 className="font-bold text-lg">{currentTutor.name}</h3>
              <p className="text-xs opacity-90">{currentTutor.subject}</p>
            </div>
            <AvatarTeacher
              key={type}
              speaking={isSpeaking}
              audioLevel={isSpeaking ? 0.6 : 0}
              avatarType={type as 'maths' | 'science' | 'homework'}
              isExplaining={true}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2">
            <button className="p-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 rounded-xl font-bold text-xs">
              🤔 Stuck
            </button>
            <button className="p-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 rounded-xl font-bold text-xs">
              🔁 Repeat
            </button>
            <button className="p-3 bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 rounded-xl font-bold text-xs">
              🙋 Help
            </button>
          </div>
        </div>

        {/* RIGHT: CHAT */}
        <div className="w-full lg:w-[42%] min-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className={`p-4 bg-gradient-to-r ${currentTutor.gradient} text-white`}>
            <h3 className="font-bold">Chat with {currentTutor.name}</h3>
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 ? (
              <div className="text-center p-6">
                <div className="text-4xl mb-3">{currentTutor.icon}</div>
                <p className="text-sm text-gray-600">Select a topic to start learning!</p>
              </div>
            ) : (
              chat.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-md text-sm ${
                    msg.sender === 'student'
                      ? `bg-gradient-to-r ${currentTutor.gradient} text-white`
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* DIAGNOSTIC QUIZ */}
          {showDiagnosticQuiz && diagnosticQuestions.length > 0 && (
            <DiagnosticQuiz
              questions={diagnosticQuestions}
              onSubmit={handleDiagnosticSubmit}
              isLoading={isLoading}
            />
          )}

          {/* MASTERY CHECK */}
          {showMasteryCheck && masteryQuestions.length > 0 && (
            <MasteryCheck
              questions={masteryQuestions}
              onSubmit={handleMasterySubmit}
              isLoading={isLoading}
            />
          )}

          {/* CHAT INPUT (student_attempt step) */}
          {currentStep === 'student_attempt' && (
            <div className="p-4 border-t border-gray-200">
              <ChatInput
                onSend={(text) => {
                  setCurrentAnswer(text)
                  const userMsg: Message = {
                    id: `user_${Date.now()}`,
                    sender: 'student',
                    text,
                    type: 'text',
                  }
                  setChat(prev => [...prev, userMsg])
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitAttempt()
                  }
                }}
                disabled={isLoading}
                placeholder="Type your answer here..."
              />
            </div>
          )}
        </div>
      </div>

      {/* TOPIC SELECTION MODAL (STEP 1) */}
      {currentStep === 'topic_selection' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-8 rounded-t-3xl bg-gradient-to-r ${currentTutor.gradient} text-white`}>
              <h1 className="text-3xl font-bold">Welcome to {currentTutor.name}'s Class!</h1>
              <p className="mt-2 opacity-90">Select your year group and topic to begin</p>
            </div>

            <div className="p-8">
              {/* Year Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Select Year Group
                </h2>

                {curriculumLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading year groups from Qdrant...</p>
                  </div>
                ) : availableYears.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`py-4 rounded-xl font-bold text-lg transition-all ${
                          selectedYear === year
                            ? `bg-gradient-to-r ${currentTutor.gradient} text-white shadow-xl scale-105`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Year {year}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                    <p>No year groups available</p>
                  </div>
                )}
              </div>

              {/* Topic Selection */}
              {selectedYear && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                    Select Topic
                  </h2>

                  {curriculumLoading ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading topics from Qdrant...</p>
                    </div>
                  ) : availableTopics.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {availableTopics.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTopicSelect(topic.topic)}
                          className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        >
                          <h3 className="font-bold text-gray-800">{topic.topic}</h3>
                          <p className="text-xs text-gray-500 mt-1">📚 {topic.source_file}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                      <p>No topics available for Year {selectedYear}</p>
                    </div>
                  )}
                </div>
              )}

              {/* CURRICULUM LOCK ERROR */}
              {error && curriculumLockStatus && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800">🔒 Curriculum Lock Error</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                      {curriculumLockStatus.clarifying_question && (
                        <p className="text-xs text-red-500 mt-2">💡 {curriculumLockStatus.clarifying_question}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* GENERAL ERROR */}
              {error && !curriculumLockStatus && (
                <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800">Error</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
