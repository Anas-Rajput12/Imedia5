'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Lightbulb, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  AlertCircle,
  Video,
  HelpCircle,
  RefreshCw,
  Upload,
  PenTool,
  MessageSquare
} from 'lucide-react'
import ChatInput from '@/components/common/ChatInput'
import AvatarTeacher from '@/components/AvatarTeacher'
import Whiteboard from '@/components/Whiteboard'
import WhiteboardKid from '@/components/WhiteboardKid'
import LessonBoard from '@/components/LessonBoard'
import TeachingStepIndicator from '@/components/TeachingStepIndicator'
import DiagnosticQuiz from '@/components/DiagnosticQuiz'
import TopicSelector from '@/components/TopicSelector'
import YearGroupSelector from '@/components/YearGroupSelector'
import ExamBoardSelector from '@/components/ExamBoardSelector'
import TutorTypeSelector from '@/components/TutorTypeSelector'
import * as ragService from '@/services/ragService'
import * as smartAiTeacherService from '@/services/smartAiTeacher.service'

// ==================== TYPES & INTERFACES ====================

interface Message {
  id: string
  sender: 'student' | 'teacher'
  text: string
  timestamp?: Date
  type?: 'text' | 'file' | 'voice'
  fileUrl?: string
  fileName?: string
  voiceDuration?: string
}

type TeachingStep = 
  | 'tutor_selection'
  | 'topic_selection'
  | 'diagnostic'
  | 'lesson'
  | 'student_attempt'
  | 'feedback'
  | 'mastery_check'
  | 'progress_dashboard'

type TutorType = 'maths' | 'science' | 'homework'

interface TutorConfig {
  id: TutorType
  name: string
  tutorName: string
  icon: any
  color: string
  gradient: string
  bgColor: string
  description: string
  features: string[]
  teachingStyle: string
}

// ==================== MAIN COMPONENT ====================

export default function EnhancedTutorPage() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // ==================== STATE MANAGEMENT ====================
  
  // Flow State
  const [currentStep, setCurrentStep] = useState<TeachingStep>('tutor_selection')
  const [selectedTutorType, setSelectedTutorType] = useState<TutorType>('maths')
  const [sessionId, setSessionId] = useState<string>('')
  const [studentName, setStudentName] = useState('')

  // Curriculum State (Qdrant)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableTopics, setAvailableTopics] = useState<ragService.CurriculumTopic[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedExamBoard, setSelectedExamBoard] = useState<string>('General')
  const [curriculumLoading, setCurriculumLoading] = useState(false)
  const [topicValidationError, setTopicValidationError] = useState<string>('')

  // SMART Teaching Flow State
  const [smartTeachingActive, setSmartTeachingActive] = useState(false)
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<smartAiTeacherService.DiagnosticQuestion[]>([])
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({})
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0)
  const [teachingChunk, setTeachingChunk] = useState<smartAiTeacherService.TeachingChunk | null>(null)
  const [workedExample, setWorkedExample] = useState<smartAiTeacherService.WorkedExample | null>(null)
  const [masteryQuestions, setMasteryQuestions] = useState<smartAiTeacherService.DiagnosticQuestion[]>([])
  const [masteryAnswers, setMasteryAnswers] = useState<Record<string, string>>({})
  const [masteryPassed, setMasteryPassed] = useState<boolean>(false)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [feedback, setFeedback] = useState<smartAiTeacherService.Feedback | null>(null)
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(false)
  const [showMasteryCheck, setShowMasteryCheck] = useState(false)
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3)
  const [progressData, setProgressData] = useState<smartAiTeacherService.ProgressDashboardResponse | null>(null)

  // Chat & Board State
  const [chat, setChat] = useState<Message[]>([])
  const [boardText, setBoardText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showSafeguardingAlert, setShowSafeguardingAlert] = useState(false)
  const [safeguardingMessage, setSafeguardingMessage] = useState('')

  // ==================== TUTOR CONFIGURATION ====================

  const tutorConfigs: TutorConfig[] = [
    {
      id: 'maths',
      name: 'Maths',
      tutorName: 'Prof. Mathew',
      icon: BookOpen,
      color: 'text-blue-600',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'bg-blue-50',
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
      description: 'Anti-Cheating • Guided Support • I help you learn, not cheat. Scaffolded learning with similar examples. You solve your own homework!',
      features: ['Guided Help', 'Similar Examples', 'Scaffolded Learning'],
      teachingStyle: 'Guided Support'
    }
  ]

  const currentTutor = tutorConfigs.find(t => t.id === selectedTutorType) || tutorConfigs[0]

  // ==================== LIFECYCLE EFFECTS ====================

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  useEffect(() => {
    if (user) {
      setStudentName(user.fullName || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'Student')
    }
  }, [user])

  // Load years when tutor type changes
  useEffect(() => {
    const subjectMap: Record<TutorType, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    }
    const subject = subjectMap[selectedTutorType]
    loadYears(subject)
  }, [selectedTutorType])

  // Load topics when year changes
  useEffect(() => {
    if (selectedYear) {
      const subjectMap: Record<TutorType, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[selectedTutorType]
      loadTopics(subject, selectedYear)
    }
  }, [selectedYear, selectedTutorType])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // ==================== CURRICULUM LOADING ====================

  async function loadYears(subject: string) {
    setCurriculumLoading(true)
    try {
      const years = await ragService.getYears(subject)
      setAvailableYears(years)
      setSelectedYear('') // Reset year selection
      setSelectedTopic('') // Reset topic selection
    } catch (error) {
      console.error('Error loading years:', error)
      setAvailableYears([])
    } finally {
      setCurriculumLoading(false)
    }
  }

  async function loadTopics(subject: string, keyStage: string) {
    setCurriculumLoading(true)
    try {
      const topics = await ragService.getTopics(subject, keyStage)
      setAvailableTopics(topics)
      setSelectedTopic('') // Reset topic selection
      setTopicValidationError('')
    } catch (error) {
      console.error('Error loading topics:', error)
      setAvailableTopics([])
    } finally {
      setCurriculumLoading(false)
    }
  }

  // ==================== FLOW NAVIGATION ====================

  const handleTutorSelect = (type: TutorType) => {
    setSelectedTutorType(type)
  }

  const handleStartWithTutor = () => {
    setCurrentStep('topic_selection')
  }

  const handleValidateAndProceed = async () => {
    if (!selectedYear) {
      setTopicValidationError('Please select a year group first.')
      return
    }
    if (!selectedTopic) {
      setTopicValidationError('Please select a valid topic.')
      return
    }

    // Validate topic exists in Qdrant
    setTopicValidationError('')
    setIsLoading(true)
    
    try {
      const subjectMap: Record<TutorType, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[selectedTutorType]
      
      // Try to fetch topic content to validate
      await ragService.getTopicContent(subject, selectedTopic, selectedYear)
      
      // Valid topic - proceed to diagnostic
      initializeSmartTeaching()
    } catch (error) {
      setTopicValidationError('This topic is not available. Please select a different topic.')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeSmartTeaching = async () => {
    try {
      setSmartTeachingActive(true)
      setIsLoading(true)

      const subjectMap: Record<TutorType, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[selectedTutorType]

      // Call SMART teaching API
      const result = await smartAiTeacherService.startSession(
        selectedTopic,
        selectedTutorType,
        selectedYear
      )

      if (result.success) {
        setSessionId(result.session_id)
        setDiagnosticQuestions(result.diagnostic_questions)

        // Welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          sender: 'teacher',
          text: result.welcome_message,
          type: 'text',
        }
        setChat([welcomeMessage])
        speakText(result.welcome_message)

        // Update board
        const boardIntro = `${subject.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n ${selectedTopic}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${currentTutor.description}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n Step 1: Diagnostic Check\n\nLet's see what you already know!`
        setBoardText(boardIntro)

        // Show diagnostic quiz
        setShowDiagnosticQuiz(true)
        setCurrentStep('diagnostic')
      }
    } catch (error) {
      console.error('Error starting SMART teaching session:', error)
      // Fallback message
      const fallbackMessage: Message = {
        id: 'welcome',
        sender: 'teacher',
        text: `Hello ${studentName}! Let's learn **${selectedTopic}** together!`,
        type: 'text',
      }
      setChat([fallbackMessage])
      setSmartTeachingActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiagnosticComplete = async (results: any[]) => {
    if (!sessionId) return

    try {
      setIsLoading(true)

      // Calculate score
      const correctCount = results.filter(r => r.is_correct).length
      const score = Math.round((correctCount / results.length) * 100)
      setDiagnosticScore(score)

      // Format answers for API
      const answers = results.map(r => ({
        question: r.question_id,
        answer: r.student_answer,
      }))

      const result = await smartAiTeacherService.submitDiagnostic(
        sessionId,
        answers,
        selectedTopic,
        selectedTutorType,
        selectedYear
      )

      if (result.success) {
        setShowDiagnosticQuiz(false)
        setTeachingChunk(result.teaching_chunk)
        setDiagnosticAnswers(answers.reduce((acc, a) => ({ ...acc, [a.question]: a.answer }), {}))

        // Feedback message
        const feedbackMessage: Message = {
          id: `diagnostic_feedback_${Date.now()}`,
          sender: 'teacher',
          text: result.message,
          type: 'text',
        }
        setChat(prev => [...prev, feedbackMessage])
        speakText(result.message)

        // Move to lesson step
        setCurrentStep('lesson')
        displayTeachingChunk(result.teaching_chunk)
      }
    } catch (error) {
      console.error('Error submitting diagnostic:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayTeachingChunk = (chunk: smartAiTeacherService.TeachingChunk) => {
    let boardContent = `${selectedTutorType.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n ${chunk.title}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    boardContent += `${chunk.content}\n\n`
    boardContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    if (chunk.key_points && chunk.key_points.length > 0) {
      boardContent += `**Key Points:**\n`
      chunk.key_points.forEach((point, idx) => {
        boardContent += `${idx + 1}. ${point}\n`
      })
      boardContent += `\n`
    }

    if (chunk.analogies && chunk.analogies.length > 0) {
      boardContent += `\n💡 **Think of it like:**\n`
      chunk.analogies.forEach(analogy => {
        boardContent += `• ${analogy}\n`
      })
    }

    if (chunk.visual_description) {
      boardContent += `\n👁️ **Visualise:**\n${chunk.visual_description}\n`
    }

    if (chunk.video_suggestion && selectedTutorType === 'science') {
      boardContent += `\n🎥 **Video Available:** ${chunk.video_suggestion.title}\n`
    }

    boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n "Take your time to understand this."\n "Ask me if you're confused!"`

    setBoardText(boardContent)

    // Prompt for worked example
    setTimeout(() => {
      const exampleMessage: Message = {
        id: `example_prompt_${Date.now()}`,
        sender: 'teacher',
        text: selectedTutorType === 'homework' 
          ? `Great! Now let's look at a **similar example** to help you understand the approach...`
          : `Great! Now let's look at a **worked example** to see how this works in practice...`,
        type: 'text',
      }
      setChat(prev => [...prev, exampleMessage])
      speakText(exampleMessage.text)
      
      // Auto-get worked example after delay
      setTimeout(() => getWorkedExample(), 2000)
    }, 2000)
  }

  const getWorkedExample = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)

      const result = await smartAiTeacherService.getWorkedExample(
        sessionId,
        selectedTopic,
        selectedTutorType,
        selectedYear
      )

      if (result.success) {
        setWorkedExample(result.worked_example)
        displayWorkedExample(result.worked_example)

        // Prompt student to attempt
        setTimeout(() => {
          const attemptMessage: Message = {
            id: `attempt_prompt_${Date.now()}`,
            sender: 'teacher',
            text: selectedTutorType === 'homework'
              ? `Now it's **your turn**! \n\nTry solving a similar problem yourself. I'll guide you with hints if you need help!`
              : `Now it's **your turn**! \n\nTry solving a similar problem yourself. Show all your working out!`,
            type: 'text',
          }
          setChat(prev => [...prev, attemptMessage])
          speakText(attemptMessage.text)
          setCurrentStep('student_attempt')
        }, 3000)
      }
    } catch (error) {
      console.error('Error getting worked example:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayWorkedExample = (example: smartAiTeacherService.WorkedExample) => {
    let boardContent = `${selectedTutorType.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n WORKED EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    boardContent += `**Problem:**\n${example.problem}\n\n`
    boardContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    if (example.steps && example.steps.length > 0) {
      example.steps.forEach((step, idx) => {
        boardContent += `**Step ${idx + 1}:**\n${step}\n\n`
      })
    }

    // Homework tutor NEVER shows final answer
    if (selectedTutorType !== 'homework') {
      boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Final Answer:** ${example.final_answer}\n\n`
    }

    if (example.method_notes) {
      boardContent += `\n📝 **Method Notes:**\n${example.method_notes}\n`
    }

    if (example.exam_tips && example.exam_tips.length > 0) {
      boardContent += `\n⭐ **Exam Tips:**\n`
      example.exam_tips.forEach(tip => {
        boardContent += `• ${tip}\n`
      })
    }

    setBoardText(boardContent)
  }

  const handleSubmitAttempt = async () => {
    if (!sessionId || !currentAnswer.trim()) return

    try {
      setIsLoading(true)
      setAttemptCount(prev => prev + 1)

      const result = await smartAiTeacherService.submitAttempt(
        sessionId,
        currentAnswer,
        selectedTopic,
        selectedTutorType,
        selectedYear,
        attemptCount
      )

      if (result.success) {
        setFeedback(result.feedback)

        // Show feedback message
        const feedbackMessage: Message = {
          id: `feedback_${Date.now()}`,
          sender: 'teacher',
          text: result.feedback.message,
          type: 'text',
        }
        setChat(prev => [...prev, feedbackMessage])
        speakText(result.feedback.message)

        // Handle personalisation
        if (result.personalisation) {
          if (result.personalisation.visual_analogy) {
            const analogyMessage: Message = {
              id: `analogy_${Date.now()}`,
              sender: 'teacher',
              text: `💡 ${result.personalisation.visual_analogy}`,
              type: 'text',
            }
            setChat(prev => [...prev, analogyMessage])
          }

          if (result.personalisation.scaffolded_steps) {
            const scaffoldMessage: Message = {
              id: `scaffold_${Date.now()}`,
              sender: 'teacher',
              text: `Let me break this down into smaller steps:\n\n${result.personalisation.scaffolded_steps.join('\n')}`,
              type: 'text',
            }
            setChat(prev => [...prev, scaffoldMessage])
          }
        }

        // Handle safeguarding
        if (result.safeguarding) {
          setSafeguardingMessage(result.safeguarding.response + '\n\n' + result.safeguarding.trusted_adult_prompt)
          setShowSafeguardingAlert(true)
        }

        // Handle integrity violation (homework cheat attempt)
        if (result.integrity_violation) {
          const integrityMessage: Message = {
            id: `integrity_${Date.now()}`,
            sender: 'teacher',
            text: result.integrity_violation.response,
            type: 'text',
          }
          setChat(prev => [...prev, integrityMessage])

          // Show similar example instead
          if (result.similar_example) {
            displayWorkedExample(result.similar_example)
          }
        }

        // Next step
        if (result.next_step === 'mastery_check') {
          setTimeout(() => generateMasteryCheck(), 2000)
        } else {
          setCurrentAnswer('')
          setCurrentStep('feedback')
        }
      }
    } catch (error) {
      console.error('Error submitting attempt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMasteryCheck = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)

      const result = await smartAiTeacherService.generateMasteryCheck(
        sessionId,
        selectedTopic,
        selectedTutorType,
        selectedYear
      )

      if (result.success) {
        setMasteryQuestions(result.mastery_check.questions)
        setShowMasteryCheck(true)
        setCurrentStep('mastery_check')

        const masteryMessage: Message = {
          id: `mastery_${Date.now()}`,
          sender: 'teacher',
          text: `Great work! Now let's check your understanding with a quick quiz.\n\n${result.mastery_check.instructions}`,
          type: 'text',
        }
        setChat(prev => [...prev, masteryMessage])
        speakText(masteryMessage.text)

        // Update board
        const boardContent = `${selectedTutorType.toUpperCase()} • Year ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n MASTERY CHECK\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAnswer these questions to show you understand **${selectedTopic}**.\n\nPass mark: ${result.mastery_check.pass_threshold}%\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n Good luck! You've got this!`
        setBoardText(boardContent)
      }
    } catch (error) {
      console.error('Error generating mastery check:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMasteryComplete = async (results: any[]) => {
    if (!sessionId) return

    try {
      setIsLoading(true)

      // Calculate mastery
      const correctCount = results.filter(r => r.is_correct).length
      const masteryPercent = Math.round((correctCount / results.length) * 100)
      const passed = masteryPercent >= 70 // 70% pass threshold
      setMasteryPassed(passed)

      // Complete session
      const result = await smartAiTeacherService.completeSession(
        sessionId,
        passed,
        selectedTopic,
        selectedTutorType
      )

      if (result.success) {
        setShowMasteryCheck(false)
        
        const completionMessage: Message = {
          id: `complete_${Date.now()}`,
          sender: 'teacher',
          text: result.next_steps,
          type: 'text',
        }
        setChat(prev => [...prev, completionMessage])
        speakText(result.next_steps)

        // Load progress dashboard
        await loadProgressDashboard()

        // Move to progress dashboard
        setCurrentStep('progress_dashboard')
        setSmartTeachingActive(false)
      }
    } catch (error) {
      console.error('Error completing session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProgressDashboard = async () => {
    try {
      const userId = user?.id || 'anonymous'
      const dashboard = await smartAiTeacherService.getProgressDashboard(userId)
      setProgressData(dashboard)
    } catch (error) {
      console.error('Error loading progress dashboard:', error)
    }
  }

  const handleRetryAttempt = () => {
    setCurrentAnswer('')
    setCurrentStep('student_attempt')
    setShowHint(false)
  }

  const handleViewHint = () => {
    setShowHint(true)
    if (feedback?.scaffolded_steps && feedback.scaffolded_steps.length > 0) {
      const hintMessage: Message = {
        id: `hint_${Date.now()}`,
        sender: 'teacher',
        text: `💡 **Hint:** ${feedback.scaffolded_steps[0]}`,
        type: 'text',
      }
      setChat(prev => [...prev, hintMessage])
    }
  }

  const handleSeeCorrectedWorking = () => {
    if (workedExample) {
      displayWorkedExample(workedExample)
    }
  }

  const handleStartNewTopic = () => {
    // Reset state
    setCurrentStep('tutor_selection')
    setSessionId('')
    setSmartTeachingActive(false)
    setShowDiagnosticQuiz(false)
    setShowMasteryCheck(false)
    setTeachingChunk(null)
    setWorkedExample(null)
    setFeedback(null)
    setChat([])
    setBoardText('')
    setSelectedTopic('')
    setSelectedYear('')
  }

  // ==================== UTILITIES ====================

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      speechSynthesis.speak(utterance)
    }
  }

  const getStepNumber = (): number => {
    const stepMap: Record<TeachingStep, number> = {
      'tutor_selection': 0,
      'topic_selection': 1,
      'diagnostic': 2,
      'lesson': 3,
      'student_attempt': 4,
      'feedback': 5,
      'mastery_check': 6,
      'progress_dashboard': 7,
    }
    return stepMap[currentStep] || 0
  }

  const getStepName = (): string => {
    const stepMap: Record<TeachingStep, string> = {
      'tutor_selection': 'Tutor Select',
      'topic_selection': 'Topic Setup',
      'diagnostic': 'Diagnostic',
      'lesson': 'Lesson',
      'student_attempt': 'Practice',
      'feedback': 'Feedback',
      'mastery_check': 'Mastery Check',
      'progress_dashboard': 'Progress',
    }
    return stepMap[currentStep] || 'Unknown'
  }

  // ==================== RENDER HELPERS ====================

  const renderTutorSelection = () => (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Choose Your AI Tutor
        </h1>
        <p className="text-lg text-gray-600">
          Select a specialist tutor to help you learn
        </p>
      </motion.div>

      {/* Tutor Cards */}
      <TutorTypeSelector
        selectedType={selectedTutorType}
        onSelectType={handleTutorSelect}
      />

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-8"
      >
        <button
          onClick={handleStartWithTutor}
          className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${currentTutor.gradient} text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
        >
          Start Learning with {currentTutor.tutorName}
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 text-center"
        >
          <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Personalized Learning</h3>
          <p className="text-sm text-gray-600">Adapts to your level and learning style</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 text-center"
        >
          <TrendingUp className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Track Progress</h3>
          <p className="text-sm text-gray-600">See your mastery grow over time</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-6 text-center"
        >
          <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Smart Feedback</h3>
          <p className="text-sm text-gray-600">Get instant, personalized feedback</p>
        </motion.div>
      </div>
    </div>
  )

  const renderTopicSelection = () => (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select Your Learning Topic
        </h1>
        <p className="text-lg text-gray-600">
          Learning with {currentTutor.tutorName}
        </p>
      </motion.div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Selection Cards */}
      <div className="space-y-6">
        {/* Year Group Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <YearGroupSelector
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            availableYears={availableYears}
          />
        </motion.div>

        {/* Exam Board Selector (for Maths Year 10+) */}
        {selectedTutorType === 'maths' && selectedYear && parseInt(selectedYear) >= 10 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ExamBoardSelector
              selectedBoard={selectedExamBoard}
              onSelect={setSelectedExamBoard}
              yearGroup={selectedYear}
            />
          </motion.div>
        )}

        {/* Topic Selector */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Select Topic from Qdrant
            </h3>

            {curriculumLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading topics...</p>
              </div>
            ) : availableTopics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No topics available for this year group.</p>
                <p className="text-sm mt-2">Please select a different year.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableTopics.map((topicData) => (
                  <motion.button
                    key={topicData.topic}
                    onClick={() => setSelectedTopic(topicData.topic)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTopic === topicData.topic
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{topicData.topic}</h4>
                        <p className="text-sm text-gray-600">
                          {topicData.chunk_count} lessons available
                        </p>
                      </div>
                      {selectedTopic === topicData.topic && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Validation Error */}
        {topicValidationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Validation Error</p>
              <p className="text-sm text-red-700">{topicValidationError}</p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setCurrentStep('tutor_selection')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleValidateAndProceed}
            disabled={isLoading || !selectedYear || !selectedTopic}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {isLoading ? 'Validating...' : 'Start Lesson →'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderDiagnostic = () => (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Diagnostic Quiz */}
      <AnimatePresence>
        {showDiagnosticQuiz && diagnosticQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DiagnosticQuiz
              questions={diagnosticQuestions as any}
              onComplete={handleDiagnosticComplete}
              topicName={selectedTopic}
              yearGroup={selectedYear}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Analyzing your answers...</p>
        </div>
      )}
    </div>
  )

  const renderLesson = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar & Chat */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar Teacher */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <AvatarTeacher
              isSpeaking={isSpeaking}
              isWriting={false}
              isPointing={false}
              mode="explaining"
            />
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl shadow-lg p-4 h-96 overflow-y-auto">
            <div className="space-y-4">
              {chat.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl ${
                      message.sender === 'student'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Right: Whiteboard/Lesson Board */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
            <LessonBoard
              tutorType={selectedTutorType}
              currentSlide={1}
              totalSlides={1}
              onNextSlide={() => {}}
              onPrevSlide={() => {}}
              boardText={boardText}
              lessonTitle={selectedTopic}
              lessonContent={teachingChunk?.title || ''}
            />
          </div>
        </div>
      </div>

      {/* Video Modal (Science) */}
      {showVideoModal && teachingChunk?.video_suggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {teachingChunk.video_suggestion.title}
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-xl mb-4">
              {/* Placeholder for video - integrate YouTube/YoutubePlayer component */}
              <div className="flex items-center justify-center h-full text-gray-500">
                <Video className="w-16 h-16" />
                <span className="ml-3">Video Player</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {teachingChunk.video_suggestion.description}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium">
                📝 {teachingChunk.video_suggestion.pausePrompt}
              </p>
            </div>
            <button
              onClick={() => {
                setShowVideoModal(false)
                // Add resume question to chat
                const resumeMessage: Message = {
                  id: `resume_${Date.now()}`,
                  sender: 'teacher',
                  text: teachingChunk.video_suggestion?.resumeQuestion || 'Great! Now that you\'ve watched the video, let\'s continue...',
                  type: 'text',
                }
                setChat(prev => [...prev, resumeMessage])
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              I've Taken Notes - Continue Lesson
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderStudentAttempt = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar & Chat */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar Teacher */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <AvatarTeacher
              isSpeaking={isSpeaking}
              isWriting={false}
              isPointing={false}
              mode="explaining"
            />
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl shadow-lg p-4 h-64 overflow-y-auto">
            <div className="space-y-4">
              {chat.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl ${
                      message.sender === 'student'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleViewHint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              View Hint
            </button>
            {selectedTutorType !== 'homework' && (
              <button
                onClick={handleSeeCorrectedWorking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                See Corrected Working
              </button>
            )}
          </div>
        </div>

        {/* Right: Working Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PenTool className="w-6 h-6 text-blue-600" />
              Your Turn to Solve
            </h3>

            {/* Problem Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="font-semibold text-blue-900 mb-2">Problem:</p>
              <p className="text-gray-800">{workedExample?.problem || 'Solve the problem based on the worked example.'}</p>
            </div>

            {/* Answer Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer:
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={selectedTutorType === 'maths' 
                  ? 'Type your solution here. Show all your working...'
                  : selectedTutorType === 'science'
                  ? 'Explain your answer in detail...'
                  : 'Try solving this step by step...'
                }
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                rows={6}
              />
            </div>

            {/* Upload Working (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or upload your working (optional):
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, PDF</p>
              </div>
            </div>

            {/* Confidence Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How confident are you?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidenceLevel(level)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      confidenceLevel === level
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {confidenceLevel === 1 && 'Not confident at all'}
                {confidenceLevel === 2 && 'Somewhat unsure'}
                {confidenceLevel === 3 && 'Moderately confident'}
                {confidenceLevel === 4 && 'Very confident'}
                {confidenceLevel === 5 && 'Extremely confident'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitAttempt}
              disabled={isLoading || !currentAnswer.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Submitting...' : 'Submit Answer'}
            </button>

            {/* Hint Display */}
            {showHint && feedback?.scaffolded_steps && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4"
              >
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Hints:
                </h4>
                <ol className="space-y-2">
                  {feedback.scaffolded_steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-amber-900 flex items-start gap-2">
                      <span className="font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderFeedback = () => (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Feedback Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        {/* Feedback Header */}
        <div className="flex items-center gap-4 mb-6">
          {feedback?.is_correct ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-amber-600" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {feedback?.is_correct ? 'Excellent Work!' : 'Let\'s Learn From This'}
            </h2>
            <p className="text-gray-600">
              {feedback?.is_correct ? 'You\'ve got it right!' : 'Mistakes help us learn'}
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        <div className={`p-6 rounded-xl mb-6 ${
          feedback?.is_correct 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-amber-50 border-2 border-amber-200'
        }`}>
          <p className="text-lg text-gray-800 leading-relaxed">
            {feedback?.message}
          </p>
        </div>

        {/* Error Analysis (if incorrect) */}
        {!feedback?.is_correct && feedback?.error_type && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              What Went Wrong:
            </h3>
            <p className="text-blue-800 mb-4">
              It looks like you made an <strong>{feedback.error_type}</strong> error.
            </p>
            {feedback?.error_type === 'arithmetic' && (
              <p className="text-sm text-blue-700">Double-check your calculations step by step.</p>
            )}
            {feedback?.error_type === 'method' && (
              <p className="text-sm text-blue-700">Let's review the correct method for this type of problem.</p>
            )}
            {feedback?.error_type === 'misconception' && (
              <p className="text-sm text-blue-700">There's a common misunderstanding here. Let me explain...</p>
            )}
            {feedback?.error_type === 'careless' && (
              <p className="text-sm text-blue-700">You know this! Just need to be more careful next time.</p>
            )}
          </div>
        )}

        {/* Encouragement */}
        {feedback?.encouragement && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-purple-800 font-medium">
              ⭐ {feedback.encouragement}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleRetryAttempt}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={handleViewHint}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-100 text-amber-800 font-semibold rounded-xl hover:bg-amber-200 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            View Hint
          </button>
          {selectedTutorType !== 'homework' && (
            <button
              onClick={handleSeeCorrectedWorking}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              See Solution
            </button>
          )}
        </div>

        {/* Next Step Prompt */}
        {feedback?.is_correct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-lg text-gray-700 mb-4">Ready to check your mastery?</p>
            <button
              onClick={generateMasteryCheck}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              Continue to Mastery Check →
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )

  const renderMasteryCheck = () => (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <TeachingStepIndicator currentStep={getStepNumber()} totalSteps={7} />
      </div>

      {/* Mastery Quiz */}
      <AnimatePresence>
        {showMasteryCheck && masteryQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DiagnosticQuiz
              questions={masteryQuestions as any}
              onComplete={handleMasteryComplete}
              topicName={selectedTopic}
              yearGroup={selectedYear}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Calculating your mastery level...</p>
        </div>
      )}
    </div>
  )

  const renderProgressDashboard = () => (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Celebration for passing */}
      {masteryPassed && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Simple CSS confetti alternative */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * windowSize.width, rotate: 0 }}
              animate={{ 
                y: windowSize.height + 20, 
                x: Math.random() * windowSize.width,
                rotate: 360 
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                delay: Math.random() * 2 
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          {masteryPassed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Topic Mastered!</h1>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Keep Practicing!</h1>
            </>
          )}
        </div>
        <p className="text-xl text-gray-600">
          {masteryPassed 
            ? `Congratulations! You've mastered ${selectedTopic}!` 
            : `You're making progress! Let's review ${selectedTopic} and try again.`}
        </p>
      </motion.div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Mastery Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 text-center"
        >
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {masteryPassed ? '🎉' : '📚'}
          </div>
          <p className="text-sm text-gray-600 mb-1">Session Status</p>
          <p className="text-lg font-bold text-gray-900">
            {masteryPassed ? 'Completed' : 'In Progress'}
          </p>
        </motion.div>

        {/* Attempts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 text-center"
        >
          <div className="text-5xl font-bold text-emerald-600 mb-2">
            {attemptCount}
          </div>
          <p className="text-sm text-gray-600 mb-1">Practice Attempts</p>
          <p className="text-lg font-bold text-gray-900">
            {attemptCount === 1 ? 'First try!' : 'Great persistence!'}
          </p>
        </motion.div>

        {/* Confidence */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 text-center"
        >
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {['😕', '🤔', '😐', '😊', '🤩'][confidenceLevel - 1]}
          </div>
          <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
          <p className="text-lg font-bold text-gray-900">
            {confidenceLevel}/5
          </p>
        </motion.div>
      </div>

      {/* Overall Progress Dashboard */}
      {progressData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Overall Progress</h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {progressData.dashboard.summary.secure_count}
              </p>
              <p className="text-sm text-green-700">Secure Topics</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {progressData.dashboard.summary.developing_count}
              </p>
              <p className="text-sm text-yellow-700">Developing</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">
                {progressData.dashboard.summary.at_risk_count}
              </p>
              <p className="text-sm text-red-700">Needs Practice</p>
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {progressData.dashboard.topics.slice(0, 5).map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{topic.topic_name}</p>
                  <p className="text-sm text-gray-600">{topic.subject}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{topic.mastery_percent}%</p>
                    <p className="text-xs text-gray-600 capitalize">{topic.status}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    topic.status === 'secure' ? 'bg-green-500' :
                    topic.status === 'developing' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleStartNewTopic}
          className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Start New Topic
        </button>
        <Link
          href="/progress"
          className="flex-1 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold text-lg rounded-2xl hover:bg-gray-50 transition-all text-center"
        >
          View Full Progress
        </Link>
      </div>
    </div>
  )

  // ==================== SAFEGUARDING ALERT MODAL ====================

  const renderSafeguardingAlert = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Important Notice</h2>
        </div>

        <p className="text-gray-800 mb-6 leading-relaxed">
          {safeguardingMessage}
        </p>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Remember:</strong> Your wellbeing is important. If you're struggling, please talk to a trusted adult.
          </p>
        </div>

        <button
          onClick={() => {
            setShowSafeguardingAlert(false)
            // Continue with lesson
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          I Understand - Continue Learning
        </button>
      </motion.div>
    </div>
  )

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentTutor.gradient} flex items-center justify-center`}>
                <currentTutor.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{currentTutor.tutorName}</p>
                <p className="text-xs text-gray-600">{currentTutor.name} Tutor</p>
              </div>
            </Link>

            {currentStep !== 'tutor_selection' && currentStep !== 'topic_selection' && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{studentName}</p>
                  <p className="text-xs text-gray-600">Year {selectedYear}</p>
                </div>
                <button
                  onClick={handleStartNewTopic}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Exit Lesson
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'tutor_selection' && (
            <motion.div
              key="tutor_selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTutorSelection()}
            </motion.div>
          )}

          {currentStep === 'topic_selection' && (
            <motion.div
              key="topic_selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTopicSelection()}
            </motion.div>
          )}

          {currentStep === 'diagnostic' && (
            <motion.div
              key="diagnostic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderDiagnostic()}
            </motion.div>
          )}

          {currentStep === 'lesson' && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderLesson()}
            </motion.div>
          )}

          {currentStep === 'student_attempt' && (
            <motion.div
              key="student_attempt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderStudentAttempt()}
            </motion.div>
          )}

          {currentStep === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderFeedback()}
            </motion.div>
          )}

          {currentStep === 'mastery_check' && (
            <motion.div
              key="mastery_check"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderMasteryCheck()}
            </motion.div>
          )}

          {currentStep === 'progress_dashboard' && (
            <motion.div
              key="progress_dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderProgressDashboard()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Safeguarding Alert Modal */}
      {showSafeguardingAlert && renderSafeguardingAlert()}
    </div>
  )
}
