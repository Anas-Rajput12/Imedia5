'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import ChatInput from '@/components/common/ChatInput'
import AvatarTeacher from '@/components/AvatarTeacher'
import Whiteboard from '@/components/Whiteboard'
import WhiteboardKid from '@/components/WhiteboardKid'
import LessonBoard from '@/components/LessonBoard'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import TeachingStepIndicator from '@/components/TeachingStepIndicator'
import ProgressDashboard from '@/components/ProgressDashboard'
import SupportButtons from '@/components/SupportButtons'
import * as ragService from '@/services/ragService'
import { useSmartTeachingFlow } from '@/hooks/useSmartTeachingFlow'
import smartAiTeacherService, {
  type DiagnosticQuestion,
  type WorkedExample as ServiceWorkedExample,
  type TeachingChunk,
  type Feedback as SmartFeedback   // ✅ rename
} from '@/services/smartAiTeacher.service'
import stepByStepTeachingService, {
  type TeachingStep,
  type WorkedExample,
  type PracticeQuestion,
  type EvaluationResult
} from '@/services/stepByStepTeaching.service'
import enhancedTeachingService, {
  type ConceptExplanation,
  type WorkedExample as EnhancedWorkedExample,
  type PracticeQuestion as EnhancedPracticeQuestion,
  type Feedback,
  type MistakeRecord,
  type StudentProgress
} from '@/services/enhancedTeaching.service'
import useLiveVoice from '@/hooks/useLiveVoice'

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

interface Topic {
  id: string
  name: string
  description: string
  lessons: string[]
}

interface ClassTopics {
  [key: string]: Topic[]
}

export default function TutorPage() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const type = searchParams.get('type') || 'maths'
  const [sessionId, setSessionId] = useState<string>('')

  // LIVE VOICE STREAMING
  const playAIResponse = useCallback((blob: Blob) => {
    console.log('🔊 [LIVE VOICE] Playing AI response...')
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()
  }, [])

  const { startVoice, stopVoice, isStreaming } = useLiveVoice(
    async () => {
      // This is called when user STARTS speaking (push-to-talk)
      console.log('🎤 [VOICE] User started speaking...');
      setAvatarTeachingMode('listening');
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'

      const topicContent = await ragService.getTopicContent(
        subject,
        selectedQdrantTopic || lessonTopic,
        selectedYear || `Year ${selectedClass}`
      )

      const contextChunks = topicContent.documents?.flatMap((d: any) => d.chunks || []) || []
      const context = contextChunks.slice(0, 2).map((c: any) => c.content).join('\n\n')

      return {
        topic: selectedQdrantTopic || lessonTopic,
        subject,
        year: selectedYear || `Year ${selectedClass}`,
        context: context || 'No context available',
      }
    },
    async (transcript: string) => {
      // This is called when user STOPS speaking (has transcript)
      console.log('🎤 [VOICE] User stopped speaking, transcript:', transcript);
      
      // Check teaching phase to determine how to handle
      if (teachingPhase === 'concept') {
        // Student is asking a question about the topic
        console.log('[VOICE] Handling student question...');
        await handleVoiceQuestion(transcript);
      } else if (teachingPhase === 'practice') {
        // Student is answering a practice question
        console.log('[VOICE] Handling student answer...');
        await handleVoiceAnswer(transcript);
      } else {
        // Default: treat as question
        console.log('[VOICE] Handling as default question...');
        await handleVoiceQuestion(transcript);
      }
    }
  )

  const tutorData: Record<
  string,
  {
    name: string
    color: string
    gradient: string
    icon: string
    bgColor: string
    image: string
    subject: string
    description: string
  }
> = {
  maths: {
    name: 'Prof. Mathew',
    color: 'text-blue-600',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    icon: '',
    bgColor: 'bg-blue-50',
    image:
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
    subject: 'Mathematics',
    description: 'Algebra, Geometry, Calculus & Problem Solving',
  },
  science: {
    name: 'Dr. Science',
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    icon: '',
    bgColor: 'bg-emerald-50',
    image:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    subject: 'Science',
    description: 'Physics, Chemistry & Biology Explained Clearly',
  },
  homework: {
    name: 'Teacher Alex',
    color: 'text-purple-600',
    gradient: 'from-purple-500 via-pink-500 to-rose-600',
    icon: '',
    bgColor: 'bg-purple-50',
    image:
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600',
    subject: 'Homework Help',
    description: 'Assignment Support & Exam Preparation',
  },
}

  const currentTutor = tutorData[type] || tutorData.maths

  // Curriculum selection state (from Qdrant)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableTopics, setAvailableTopics] = useState<ragService.CurriculumTopic[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedQdrantTopic, setSelectedQdrantTopic] = useState<string>('')
  const [curriculumLoading, setCurriculumLoading] = useState(false)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [showTopicOnBoard, setShowTopicOnBoard] = useState(false)
  const [topicError, setTopicError] = useState<string | null>(null)

  const [boardText, setBoardText] = useState('')
  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [lessonTopic, setLessonTopic] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [studentName, setStudentName] = useState('')
  const [showClassModal, setShowClassModal] = useState(true)
  // Year 5-9 ONLY as specified
  const [selectedClass, setSelectedClass] = useState<string>('7')
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [teachingMode, setTeachingMode] = useState<'explaining' | 'questioning' | 'practicing'>('explaining')
  const [studentUnderstanding, setStudentUnderstanding] = useState<'confused' | 'okay' | 'confident'>('okay')
  const [currentLessonSection, setCurrentLessonSection] = useState(0)
  const [isSectionComplete, setIsSectionComplete] = useState(false)
  const [lessonSections, setLessonSections] = useState<string[]>([])
  const [avatarTeachingMode, setAvatarTeachingMode] = useState<'explaining' | 'writing' | 'pointing' | 'idle' | 'listening'>('idle')
  const [isAvatarWriting, setIsAvatarWriting] = useState(false)
  const [isAvatarPointing, setIsAvatarPointing] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showHint, setShowHint] = useState(false)

  // SMART AI Teacher - 4 Layer Architecture State
  const [curriculumLockStatus, setCurriculumLockStatus] = useState<{
    locked: boolean
    topicExists: boolean
    confidence: number
    message?: string
  } | null>(null)
  const [safeguardingAlert, setSafeguardingAlert] = useState<{
    detected: boolean
    type: 'emotional_distress' | 'self_harm' | 'harmful_topic'
    severity: 'low' | 'medium' | 'high' | 'critical'
    response: string
    trustedAdultPrompt: string
  } | null>(null)
  const [examIntegrityViolation, setExamIntegrityViolation] = useState<{
    detected: boolean
    type: 'direct_answer_request' | 'homework_cheat'
    response: string
  } | null>(null)
  const [personalisationMode, setPersonalisationMode] = useState<'standard' | 'simplify' | 'challenge' | 'scaffold'>('standard')
  const [incorrectAttempts, setIncorrectAttempts] = useState(0)
  const [progressMetrics, setProgressMetrics] = useState<{
    mastery_percent: number
    attempts_count: number
    status: 'secure' | 'developing' | 'at_risk'
  } | null>(null)

  // SMART Teaching Flow State
  const [smartSessionId, setSmartSessionId] = useState<string>('')
  const [smartTeachingActive, setSmartTeachingActive] = useState(false)
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([])
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({})
  const [teachingChunk, setTeachingChunk] = useState<TeachingChunk | null>(null)
  const [workedExample, setWorkedExample] = useState<ServiceWorkedExample | null>(null)
  const [masteryQuestions, setMasteryQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [attemptCount, setAttemptCount] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showDiagnosticQuiz, setShowDiagnosticQuiz] = useState(false)
  const [showMasteryCheck, setShowMasteryCheck] = useState(false)
  const [confidenceLevel, setConfidenceLevel] = useState<number>(3) // 1-5 scale

  // Step-by-Step Teaching State
  const [currentTeachingStep, setCurrentTeachingStep] = useState<number>(1)  // 1=Concept, 2=Example, 3=Practice, 4=Feedback
  const [currentExplanation, setCurrentExplanation] = useState<TeachingStep | null>(null)
  const [currentWorkedExample, setCurrentWorkedExample] = useState<WorkedExample | null>(null)
  const [currentPracticeQuestion, setCurrentPracticeQuestion] = useState<PracticeQuestion | null>(null)
  const [studentLevel, setStudentLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [recentMistakes, setRecentMistakes] = useState<Array<{
    topic: string;
    mistakeType: string;
    timestamp: Date;
  }>>([])
  const [showSupportButtons, setShowSupportButtons] = useState(false)

  // ENHANCED STEP-BY-STEP TEACHING STATE
  const [teachingPhase, setTeachingPhase] = useState<'concept' | 'example' | 'practice' | 'feedback' | 'complete'>('concept')
  const [conceptExplanation, setConceptExplanation] = useState<ConceptExplanation | null>(null)
  const [enhancedWorkedExample, setEnhancedWorkedExample] = useState<EnhancedWorkedExample | null>(null)
  const [currentExampleStep, setCurrentExampleStep] = useState<number>(0)
  const [enhancedPracticeQuestion, setEnhancedPracticeQuestion] = useState<EnhancedPracticeQuestion | null>(null)
  const [studentAnswer, setStudentAnswer] = useState('')
  const [enhancedAttemptCount, setEnhancedAttemptCount] = useState(0)
  const [enhancedFeedback, setEnhancedFeedback] = useState<Feedback | null>(null)
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null)
  const [highlightedParts, setHighlightedParts] = useState<Array<{
    text: string;
    color: string;
    description: string;
  }>>([])

  const teachingSteps = [
    { id: 1, name: 'Intro', icon: '' },
    { id: 2, name: 'Teach', icon: '' },
    { id: 3, name: 'Example', icon: '' },
    { id: 4, name: 'Practice', icon: '' },
    { id: 5, name: 'Check', icon: '' },
  ]

  useEffect(() => {
    if (user) {
      setStudentName(user.fullName || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'Student')
    }
  }, [user])

  // Load years when component mounts (based on tutor type)
  useEffect(() => {
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    }
    const subject = subjectMap[type] || 'Maths'
    console.log('Loading years for subject:', subject)
    setCurriculumLoading(true)
    loadYears(subject).finally(() => {
      setCurriculumLoading(false)
    })
  }, [type])

  // Load topics when year changes
  useEffect(() => {
    if (selectedYear && type) {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'
      console.log('useEffect: Loading topics for:', subject, selectedYear)
      loadTopics(subject, selectedYear)
    }
  }, [selectedYear, type])

  async function loadYears(subject: string) {
    console.log('loadYears called with:', subject)
    try {
      // Map tutor type to subject for Qdrant
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const qdrantSubject = subjectMap[subject] || subject
      
      console.log('Loading key stages from backend for:', qdrantSubject)
      
      // Get key stages directly from backend API (Qdrant)
      const keyStages = await ragService.getYears(qdrantSubject)
      console.log('Key stages loaded from Qdrant:', keyStages)

      // Set available key stages from Qdrant - NO FILTERING, NO FALLBACK
      setAvailableYears(keyStages)
    } catch (error) {
      console.error('Error loading key stages from Qdrant:', error)
      // No fallback - show empty array
      setAvailableYears([])
    }
  }

  async function loadTopics(subject: string, keyStage: string) {
    console.log('loadTopics called with:', subject, keyStage)
    setTopicsLoading(true)
    setTopicError(null)

    // Map tutor type to subject for Qdrant
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    }
    const qdrantSubject = subjectMap[subject] || subject

    try {
      // Fetch topics from Qdrant via backend API - use keyStage directly
      const topics = await ragService.getTopics(qdrantSubject, keyStage)
      console.log('Topics from Qdrant:', topics)

      if (topics.length > 0) {
        // Qdrant se topics mile
        setAvailableTopics(topics)
        setTopicError(null)
      } else {
        // No topics for this key stage
        console.log('No topics found in Qdrant for this key stage')
        setTopicError(`No topics found for ${keyStage} ${qdrantSubject} in Qdrant database.`)
        setAvailableTopics([])
      }
    } catch (error) {
      console.error('Error loading topics from Qdrant:', error)
      setTopicError('Failed to connect to curriculum database. Please ensure backend is running.')
      setAvailableTopics([])
    } finally {
      setTopicsLoading(false)
    }
  }

  async function loadTopicContent(topic: string, subject: string, keyStage: string) {
    try {
      console.log('[QDRANT] Loading BRIEF content for:', topic);

      const content = await ragService.getTopicContent(subject, topic, keyStage)

      console.log('[QDRANT] Loaded content:', content);
      console.log('[QDRANT] Number of documents:', content.documents?.length || 0);

      // Show ONLY BRIEF content - first 2 chunks maximum (NOT full PDF)
      let boardContent = ''

      // Take ONLY first 2 chunks for brief display
      if (content.documents && content.documents.length > 0) {
        const firstDoc = content.documents[0];
        if (firstDoc.chunks && firstDoc.chunks.length > 0) {
          // LIMIT to first 2 chunks only for BRIEF introduction
          const briefChunks = firstDoc.chunks.slice(0, 2);
          
          briefChunks.forEach((chunk, chunkIdx) => {
            console.log(`[QDRANT] Adding brief chunk ${chunkIdx + 1} (${chunk.content?.length || 0} chars)`);
            boardContent += `${chunk.content}\n\n`
          });
          
          // Add note that this is brief introduction
          boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 This is a BRIEF introduction.\n\n💡 AI Teacher will explain step-by-step...\n\n⏭️ Worked example coming next!`
        }
      } else {
        console.warn('[QDRANT] No documents found');
        boardContent = `No content available for this topic.`
      }

      console.log('[QDRANT] BRIEF board content length:', boardContent.length);
      console.log('[QDRANT] Setting board text...');

      setBoardText(boardContent)
      setLessonTopic(topic)
      setShowTopicOnBoard(true)
      setTopicError(null)

      console.log('[QDRANT] ✅ BRIEF content displayed (NOT full PDF)!');
      console.log('[QDRANT] Total characters:', boardContent.length);

      // Note: Voice narration will happen in teaching flow
      console.log('[VOICE] Content loaded - will be spoken by avatar in teaching flow');

      // Return the content so it can be used immediately
      return boardContent;

    } catch (error) {
      console.error('[QDRANT] Error loading topic content:', error)
      setTopicError(`This topic "${topic}" is not mentioned in your course curriculum.`)
      setBoardText(`No content available for this topic.`)
      return `No content available for this topic.`;
    }
  }

  /**
   * CURRICULUM LOCK CHECK - Layer 1: Retrieval Layer
   * Validates topic exists in Qdrant with confidence > 0.7
   */
  async function checkCurriculumLock(topicId: string, subject: string, yearGroup: string): Promise<{
    locked: boolean
    topicExists: boolean
    confidence: number
    message?: string
    clarifyingQuestion?: string
  }> {
    try {
      if (!topicId || topicId.trim() === '') {
        return {
          locked: false,
          topicExists: false,
          confidence: 0,
          message: "I need to know which topic you'd like to learn about.",
        }
      }

      // Check if topic exists in Qdrant
      const content = await ragService.getTopicContent(subject, topicId, yearGroup)
      
      const topicExists = content.documents && content.documents.length > 0
      const hasContent = content.documents.some((doc: any) => doc.chunks && doc.chunks.length > 0)

      if (!topicExists) {
        return {
          locked: false,
          topicExists: false,
          confidence: 0,
          message: `I couldn't find "${topicId}" in our curriculum.`,
        }
      }

      if (!hasContent) {
        return {
          locked: false,
          topicExists: true,
          confidence: 0,
          message: `I found "${topicId}" but don't have enough content to teach it properly.`,
        }
      }

      // Calculate confidence from similarity scores
      const allChunks = content.documents.flatMap((doc: any) => doc.chunks || [])
      const avgConfidence = allChunks.length > 0
        ? allChunks.reduce((sum: number, chunk: any) => sum + (chunk.similarity_score || 0), 0) / allChunks.length
        : 0

      // Always return locked: true if we have content (ignore confidence threshold)
      return {
        locked: true,  // Always proceed if content exists
        topicExists: true,
        confidence: avgConfidence,
        message: 'Curriculum verified. Ready to teach with approved content.'
      }
    } catch (error) {
      console.error('Curriculum lock check failed:', error)
      return {
        locked: true,  // Continue even on error
        topicExists: false,
        confidence: 0,
        message: "Continuing with lesson..."
      }
    }
  }

  /**
   * SAFEGUARDING CHECK - Layer 4: Safety Layer
   * Detects emotional distress, self-harm, harmful topics
   */
  function checkSafeguarding(message: string): {
    detected: boolean
    type: 'emotional_distress' | 'self_harm' | 'harmful_topic' | null
    severity: 'low' | 'medium' | 'high' | 'critical'
    response: string
    trustedAdultPrompt: string
    escalate: boolean
  } | null {
    const lowerMsg = message.toLowerCase()

    // Self-harm detection (CRITICAL)
    const selfHarmKeywords = ['hurt myself', 'self-harm', 'suicide', 'kill myself', 'end it all', 'better off dead']
    for (const keyword of selfHarmKeywords) {
      if (lowerMsg.includes(keyword)) {
        return {
          detected: true,
          type: 'self_harm',
          severity: 'critical',
          response: 'I hear that you\'re really struggling right now, and I want you to know that your wellbeing is the most important thing. You matter, and there are people who care about you.',
          trustedAdultPrompt: 'Please talk to a trusted adult about how you\'re feeling - a parent, teacher, school counsellor, or call Childline at 0800 1111. They are there to listen and support you.',
          escalate: true
        }
      }
    }

    // Emotional distress detection
    const distressKeywords = ["i'm stupid", "i hate myself", "i'm worthless", "nobody cares", "i can't do anything right", "i'm useless", "i'm a failure"]
    for (const keyword of distressKeywords) {
      if (lowerMsg.includes(keyword)) {
        return {
          detected: true,
          type: 'emotional_distress',
          severity: 'high',
          response: 'I can see this is really frustrating you, and that\'s completely okay. Learning challenging things can feel overwhelming sometimes. But please know that struggling with schoolwork doesn\'t define your worth.',
          trustedAdultPrompt: 'When you\'re feeling this way, it helps to talk to someone you trust - a parent, teacher, or friend. They care about you and want to support you.',
          escalate: false
        }
      }
    }

    return null
  }

  /**
   * EXAM INTEGRITY CHECK - Layer 4: Safety Layer
   * Detects cheating attempts and provides hints instead of answers
   */
  function checkExamIntegrity(message: string): {
    detected: boolean
    type: 'direct_answer_request' | 'homework_cheat'
    response: string
    hint: string
  } | null {
    const lowerMsg = message.toLowerCase()

    // Direct answer requests
    const directAnswerPatterns = ['what\'s the answer', 'what is the answer', 'give me the answer', 'just tell me the answer', 'what should i write', 'can you give me', 'just give']
    for (const pattern of directAnswerPatterns) {
      if (lowerMsg.includes(pattern)) {
        return {
          detected: true,
          type: 'direct_answer_request',
          response: 'I understand you want the answer, but I\'m here to help you learn, not to do the work for you. When you figure it out yourself, you\'re building skills that will help you in exams.',
          hint: 'Let me give you a hint instead...'
        }
      }
    }

    // Homework cheating
    const homeworkPatterns = ['this is my homework', 'do my homework', 'homework due tomorrow', 'teacher will check this', 'this is for marks']
    for (const pattern of homeworkPatterns) {
      if (lowerMsg.includes(pattern)) {
        return {
          detected: true,
          type: 'homework_cheat',
          response: 'I understand this is for your homework, and I\'m happy to help you learn! But the best way I can help is by showing you how to approach similar problems, so you can solve it yourself.',
          hint: 'Let\'s break down what the question is asking...'
        }
      }
    }

    return null
  }

  /**
   * PERSONALISATION ENGINE - Layer 3: Personalisation
   * Trigger-based adaptation: 2 incorrect → simplify, 3 failed → escalate
   */
  function checkPersonalisationTriggers(attempts: number, consecutiveIncorrect: number, lastAttemptCorrect: boolean): {
    triggered: boolean
    adaptation: 'simplify' | 'challenge' | 'scaffold' | 'visual_analogy'
    message: string
  } {
    // 3 failed attempts → Scaffold
    if (attempts >= 3 && !lastAttemptCorrect) {
      return {
        triggered: true,
        adaptation: 'scaffold',
        message: 'I can see this is challenging. Let me break this down into smaller, manageable steps for you.'
      }
    }

    // 2 incorrect attempts → Simplify + Visual Analogy
    if (consecutiveIncorrect >= 2 && !lastAttemptCorrect) {
      return {
        triggered: true,
        adaptation: 'visual_analogy',
        message: 'Let me show you this in a different way with a visual analogy to help understanding.'
      }
    }

    return { triggered: false, adaptation: 'simplify', message: '' }
  }

  useEffect(() => {
    // Load voices immediately
    window.speechSynthesis.getVoices()
    console.log('Initial voices count:', window.speechSynthesis.getVoices().length)
    
    // Set up voice change listener
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log(' Voices loaded:', voices.length, 'voices')
        console.log('Voice names:', voices.map(v => `${v.name} (${v.lang})`).join(', '))
      }
    }
    
    // Fallback: try to load voices after a delay
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        console.warn(' No voices loaded after timeout')
      } else {
        console.log(' Voices available after timeout:', voices.length)
      }
    }, 1000)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  useEffect(() => {
    if (isSpeaking) {
      const mouthInterval = setInterval(() => {
        setBoardText(prev => prev + ' ')
      }, 200)
      return () => clearInterval(mouthInterval)
    }
  }, [isSpeaking])

  /**
   * Speak text with Browser TTS ONLY (Google TTS removed - 403 errors)
   */
  const speakText = async (text: string, skipQueue = false): Promise<void> => {
    if (!text || text.trim() === '') {
      console.log('⚠️ No text to speak');
      return;
    }

    console.log('🔊 Speaking:', text.substring(0, 50) + '...');

    try {
      // Use Browser TTS ONLY (FREE, no API key needed, no 403 errors)
      await speakWithBrowserTTS(text, type === 'science' ? 'female' : 'male');
    } catch (error) {
      console.error('❌ TTS error:', error);
      setIsSpeaking(false);
      setAudioLevel(0);
    }
  };

  // Browser Text-to-Speech fallback function
  const speakWithBrowserTTS = async (text: string, voiceType: 'male' | 'female' = 'male') => {
    console.log('🔊 Using browser TTS for text:', text.substring(0, 50) + '...');
    console.log('🔊 Voice type:', voiceType);

    // Set speaking state for lip-sync
    setIsSpeaking(true);

    // Create a promise that resolves when speech ends
    return new Promise<void>((resolve) => {
      // Simulate realistic audio levels for lip-sync (word-by-word patterns)
      const audioInterval = setInterval(() => {
        // Generate realistic speech patterns
        const baseLevel = 0.45 + Math.random() * 0.35;  // Base volume
        const emphasis = Math.random() > 0.65 ? 0.25 : 0;  // Emphasis on important words
        const pause = Math.random() > 0.88 ? 0.15 : 0;  // Natural pauses
        setAudioLevel(baseLevel + emphasis - pause);
      }, 75);  // Update every 75ms for smooth animation

      // Clean text for speech (remove markdown, emojis, etc.)
      const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#+\s/g, '')
        .replace(/⭐/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(cleanText)

      // Configure voice settings
      utterance.rate = 0.95 // Slightly slower for clarity
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = 'en-US'

      // When speech ends, cleanup and resolve
      utterance.onend = () => {
        console.log('✅ Browser TTS speech ended')
        setIsSpeaking(false)
        setAudioLevel(0)
        clearInterval(audioInterval)
        resolve() // Resolve the promise when speech completes
      }

      utterance.onerror = (event) => {
        console.error('❌ Browser TTS error:', event)
        setIsSpeaking(false)
        setAudioLevel(0)
        clearInterval(audioInterval)
        resolve() // Still resolve on error
      }

      // Wait for voices to load if needed
      let voices = window.speechSynthesis.getVoices()

      if (voices.length === 0) {
        console.log('⏳ Waiting for voices to load...')
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices()
          console.log('✅ Voices loaded:', voices.length)
          
          // Select voice and speak
          selectVoiceAndSpeak(utterance, voices, voiceType)
        }
        // Timeout after 1 second if voices don't load
        setTimeout(() => {
          voices = window.speechSynthesis.getVoices()
          console.log('⏰ Voice timeout, using available voices:', voices.length)
          selectVoiceAndSpeak(utterance, voices, voiceType)
        }, 1000)
      } else {
        // Voices already loaded, speak immediately
        selectVoiceAndSpeak(utterance, voices, voiceType)
      }
    });
  }

  // Helper function to select voice and speak
  const selectVoiceAndSpeak = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[], voiceType: 'male' | 'female') => {
    // Prefer English voices
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'))
    console.log('🎤 Available English voices:', englishVoices.map(v => v.name).join(', '))

    // Select voice based on voiceType parameter
    if (voiceType === 'female') {
      // Try to find a female voice for Science teacher
      const femaleVoice = englishVoices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('jenny') ||
        voice.name.toLowerCase().includes('aria')
      )
      if (femaleVoice) {
        utterance.voice = femaleVoice
        console.log('✅ Selected female voice:', femaleVoice.name)
      }
    } else {
      // Try to find a male voice for Math/Homework teachers
      const maleVoice = englishVoices.find(voice =>
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('boy') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('james') ||
        voice.name.toLowerCase().includes('guy') ||
        voice.name.toLowerCase().includes('daniel')
      )
      if (maleVoice) {
        utterance.voice = maleVoice
        console.log('✅ Selected male voice:', maleVoice.name)
      }
    }

    // If no preferred voice found, use first English voice
    if (!utterance.voice && englishVoices.length > 0) {
      utterance.voice = englishVoices[0]
      console.log('🎤 Using default voice:', englishVoices[0].name)
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)
    console.log('🔊 Speech started, waiting for completion...')
  }

  const startLesson = (topic: Topic) => {
    setSessionId(`session_${Date.now()}`)
    setLessonTopic(topic.name)
    setLessonDescription(topic.description)
    setSelectedTopic(topic)
    setShowClassModal(false)
    setCurrentStep(1)
    setTeachingMode('explaining')
    setAvatarTeachingMode('idle')

    // Use ENHANCED step-by-step teaching (not full PDF dump)
    startEnhancedTeaching(topic)
  }

  /**
   * STEP-BY-STEP TEACHING FLOW
   * Like a real human teacher - not showing full PDF immediately
   */

  /**
   * Step 1: Explain Concept
   */
  const explainConceptStepByStep = async (topic: string, step: number = 1) => {
    console.log('[STEP TEACHING] Step 1: Explaining concept...', topic);
    
    try {
      setCurrentTeachingStep(1);
      setShowSupportButtons(true);
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Get explanation from backend
      const explanation = await stepByStepTeachingService.getExplanation(
        topic,
        step,
        studentLevel,
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[STEP TEACHING] Explanation received:', explanation);
      setCurrentExplanation(explanation);

      // Display on board
      const boardContent = `📖 ${explanation.title}

━━━━━━━━━━━━━━━━━━━━━━━━━━

${explanation.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Key Points:**
${explanation.keyPoints.map(p => `• ${p}`).join('\n')}

${explanation.analogy ? `💡 **Think of it like:**\n${explanation.analogy}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Step ${step}: Concept Explained

⏭️ Next: Worked Example`;

      setBoardText(boardContent);
      setLessonTopic(topic);

      // Speak explanation
      await speakText(explanation.content);

      // Check understanding
      if (explanation.checkQuestion) {
        const checkMessage: Message = {
          id: `check_${Date.now()}`,
          sender: 'teacher',
          text: `Quick check: ${explanation.checkQuestion}\n\nType your answer below!`,
          type: 'text',
        };
        setChat(prev => [...prev, checkMessage]);
        await speakText(checkMessage.text);
      }

    } catch (error) {
      console.error('[STEP TEACHING] Error explaining concept:', error);
      // Fallback to simple explanation
      const fallbackBoard = `📖 ${topic}

Let me explain the basic concept...

**Key Ideas:**
• This is an important topic in ${type}
• We'll learn step-by-step
• Ask me if you're confused!

💡 Take your time to understand this.`;

      setBoardText(fallbackBoard);
      await speakText(`Let me explain ${topic}. ${fallbackBoard}`);
    }
  };

  /**
   * Step 2: Show Worked Example
   */
  const showWorkedExampleStepByStep = async (topic: string) => {
    console.log('[STEP TEACHING] Step 2: Showing worked example...', topic);
    
    try {
      setCurrentTeachingStep(2);
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Get worked example from backend
      const example = await stepByStepTeachingService.getWorkedExample(
        topic,
        'medium',
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[STEP TEACHING] Worked example received:', example);
      setCurrentWorkedExample(example);

      // Show question first
      setBoardText(`📝 Worked Example

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question:**
${example.question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Watch carefully as I solve this step-by-step...`);

      const introMessage: Message = {
        id: `example_intro_${Date.now()}`,
        sender: 'teacher',
        text: `Now let me show you an example. Watch carefully as I solve this step-by-step.`,
        type: 'text',
      };
      setChat(prev => [...prev, introMessage]);
      await speakText(introMessage.text);

      // Solve step-by-step
      for (let i = 0; i < example.steps.length; i++) {
        const step = example.steps[i];
        
        const stepBoard = `📝 Worked Example

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Question:** ${example.question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Step ${step.stepNumber}:**
${step.text}

${step.explanation ? `**Why:** ${step.explanation}` : ''}

${step.highlight ? `🎯 **Focus on:** ${step.highlight}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Step ${i + 1} of ${example.steps.length}`;

        setBoardText(stepBoard);
        
        // Speak step
        await speakText(step.text);
        if (step.explanation) {
          await speakText(step.explanation);
        }
        
        // Pause between steps
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Show solution
      const solutionBoard = `📝 Worked Example

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Solution:** ${example.solution}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Common Mistakes to Avoid:**
${example.commonMistakes.map(m => `• ${m}`).join('\n')}

${example.checkMethod ? `**Check Your Answer:** ${example.checkMethod}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Example Complete!

⏭️ Next: Your Turn to Practice`;

      setBoardText(solutionBoard);

      const solutionMessage: Message = {
        id: `solution_${Date.now()}`,
        sender: 'teacher',
        text: `The answer is ${example.solution}. Remember to avoid these common mistakes: ${example.commonMistakes.join(', ')}.`,
        type: 'text',
      };
      setChat(prev => [...prev, solutionMessage]);
      await speakText(solutionMessage.text);

      // Move to practice
      setTimeout(() => {
        givePracticeQuestionStepByStep(topic);
      }, 3000);

    } catch (error) {
      console.error('[STEP TEACHING] Error showing worked example:', error);
      // Fallback
      setBoardText(`📝 Worked Example

Let me show you how to solve a problem step-by-step...

**Step 1:** Read the question carefully
**Step 2:** Identify what you need to find
**Step 3:** Use the appropriate method
**Step 4:** Check your answer

✅ Now it's your turn to try!`);
      
      setTimeout(() => {
        givePracticeQuestionStepByStep(topic);
      }, 2000);
    }
  };

  /**
   * Step 3: Give Practice Question
   */
  const givePracticeQuestionStepByStep = async (topic: string) => {
    console.log('[STEP TEACHING] Step 3: Giving practice question...', topic);
    
    try {
      setCurrentTeachingStep(3);
      setShowSupportButtons(true);
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Get practice question from backend
      const practice = await stepByStepTeachingService.getPracticeQuestion(
        topic,
        'medium',
        studentLevel,
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[STEP TEACHING] Practice question received:', practice);
      setCurrentPracticeQuestion(practice);

      // Display question
      const questionBoard = `✏️ Your Turn!

━━━━━━━━━━━━━━━━━━━━━━━━━━

${practice.question}

${practice.data ? `**Data:**\n${practice.data}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Marks:** ${practice.marks}

💡 ${practice.hint || 'Take your time and show all your working!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Type your answer in the chat below!`;

      setBoardText(questionBoard);

      const questionMessage: Message = {
        id: `practice_${Date.now()}`,
        sender: 'teacher',
        text: `Now it's your turn! Try this question. ${practice.hint || 'Take your time and show all your working!'}`,
        type: 'text',
      };
      setChat(prev => [...prev, questionMessage]);
      await speakText(questionMessage.text);

    } catch (error) {
      console.error('[STEP TEACHING] Error giving practice question:', error);
      // Fallback
      setBoardText(`✏️ Your Turn!

Try to solve a problem on your own...

Show all your working and think step-by-step!

💡 You can do this!`);
    }
  };

  /**
   * Step 4: Evaluate Student Answer & Explain Mistakes
   */
  const evaluateStudentAnswerStepByStep = async (studentAnswer: string) => {
    console.log('[STEP TEACHING] Step 4: Evaluating student answer...', studentAnswer);
    
    try {
      setCurrentTeachingStep(4);
      
      if (!currentPracticeQuestion) {
        console.error('[STEP TEACHING] No practice question to evaluate against');
        return;
      }

      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Evaluate answer using backend
      const evaluation = await stepByStepTeachingService.evaluateAnswer(
        selectedQdrantTopic || lessonTopic,
        currentPracticeQuestion.question,
        studentAnswer,
        undefined,  // Let AI determine correct answer
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[STEP TEACHING] Evaluation received:', evaluation);

      // Track mistake if wrong
      if (!evaluation.isCorrect) {
        setRecentMistakes(prev => [...prev, {
          topic: selectedQdrantTopic || lessonTopic,
          mistakeType: evaluation.mistakeType || 'unknown',
          timestamp: new Date(),
        }]);
      }

      // Show feedback
      if (evaluation.isCorrect) {
        // CORRECT ANSWER
        const correctBoard = `✅ Excellent!

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Correct Answer!**

${evaluation.encouragement}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 Well done! You've understood this concept.

⏭️ Ready for the next topic?`;

        setBoardText(correctBoard);

        const correctMessage: Message = {
          id: `correct_${Date.now()}`,
          sender: 'teacher',
          text: `Excellent! ${evaluation.encouragement} You've mastered this!`,
          type: 'text',
        };
        setChat(prev => [...prev, correctMessage]);
        await speakText(correctMessage.text);

        // Move to next topic or complete
        setTimeout(() => {
          completeStepByStepLesson();
        }, 3000);

      } else {
        // WRONG ANSWER - Explain mistake
        const wrongBoard = `🤔 Let's Learn From This

━━━━━━━━━━━━━━━━━━━━━━━━━━

${evaluation.feedback}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Mistake:** ${evaluation.highlightedError || 'Let me explain...'}

**Correct Method:**
${evaluation.correctMethod || 'Let me show you...'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Don't worry! Mistakes help us learn.

🔄 Let me give you a similar question to try...`;

        setBoardText(wrongBoard);

        const wrongMessage: Message = {
          id: `wrong_${Date.now()}`,
          sender: 'teacher',
          text: `${evaluation.feedback} ${evaluation.highlightedError || ''} ${evaluation.correctMethod || ''} Don't worry, let me show you the correct method and give you another question to try.`,
          type: 'text',
        };
        setChat(prev => [...prev, wrongMessage]);
        await speakText(wrongMessage.text);

        // Show correct method step-by-step
        await new Promise(resolve => setTimeout(resolve, 2000));
        await showCorrectMethodStepByStep(evaluation.correctMethod || '');

        // Give similar question (easier)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await giveSimilarQuestionAfterMistake();
      }

    } catch (error) {
      console.error('[STEP TEACHING] Error evaluating answer:', error);
      // Fallback - be encouraging
      const fallbackMessage: Message = {
        id: `fallback_${Date.now()}`,
        sender: 'teacher',
        text: `Good effort! Let me explain the correct approach and give you another question to try.`,
        type: 'text',
      };
      setChat(prev => [...prev, fallbackMessage]);
      await speakText(fallbackMessage.text);
      
      setTimeout(() => {
        giveSimilarQuestionAfterMistake();
      }, 2000);
    }
  };

  /**
   * Show Correct Method Step-by-Step
   */
  const showCorrectMethodStepByStep = async (correctMethod: string) => {
    console.log('[STEP TEACHING] Showing correct method...');
    
    const methodBoard = `📝 Correct Method

━━━━━━━━━━━━━━━━━━━━━━━━━━

${correctMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Watch how to solve it correctly...`;

    setBoardText(methodBoard);
    await speakText(`Let me show you the correct method. ${correctMethod}`);
  };

  /**
   * Give Similar Question After Mistake
   */
  const giveSimilarQuestionAfterMistake = async () => {
    console.log('[STEP TEACHING] Giving similar question after mistake...');
    
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Get easier question
      const similarPractice = await stepByStepTeachingService.getPracticeQuestion(
        selectedQdrantTopic || lessonTopic,
        'easy',  // Easier after mistake
        'beginner',  // Beginner level
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      const similarBoard = `🔄 Similar Question

━━━━━━━━━━━━━━━━━━━━━━━━━━

${similarPractice.question}

${similarPractice.hint ? `💡 **Hint:** ${similarPractice.hint}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Take your time and apply what you just learned!`;

      setBoardText(similarBoard);
      setCurrentPracticeQuestion(similarPractice);

      const similarMessage: Message = {
        id: `similar_${Date.now()}`,
        sender: 'teacher',
        text: `Try this similar question. Take your time and think step-by-step!`,
        type: 'text',
      };
      setChat(prev => [...prev, similarMessage]);
      await speakText(similarMessage.text);

    } catch (error) {
      console.error('[STEP TEACHING] Error giving similar question:', error);
    }
  };

  /**
   * Complete Step-by-Step Lesson
   */
  const completeStepByStepLesson = async () => {
    console.log('[STEP TEACHING] Completing lesson...');
    
    const completionBoard = `🎉 Lesson Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Today You Learned:**
• ${selectedQdrantTopic || lessonTopic}

**Progress:**
• Concepts understood ✅
• Examples practiced ✅
• Questions attempted ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 Great work! Ready for the next topic?`;

    setBoardText(completionBoard);

    const completionMessage: Message = {
      id: `complete_${Date.now()}`,
      sender: 'teacher',
      text: `Excellent work today! You've learned about ${selectedQdrantTopic || lessonTopic}. Ready to move to the next topic?`,
      type: 'text',
    };
    setChat(prev => [...prev, completionMessage]);
    await speakText(completionMessage.text);

    // Reset for next topic
    setShowSupportButtons(false);
    setCurrentTeachingStep(1);
  };

  /**
   * Support Button Handlers
   */
  const handleExplainSimpler = async () => {
    console.log('[SUPPORT] clicked');
    
    // Temporarily set to beginner level
    const previousLevel = studentLevel;
    setStudentLevel('beginner');
    
    // Re-explain current step at beginner level
    if (selectedQdrantTopic || lessonTopic) {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const simplerExplanation = await stepByStepTeachingService.getExplanation(
        selectedQdrantTopic || lessonTopic,
        currentTeachingStep,
        'beginner',
        subject,
        selectedYear || `Year ${selectedClass}`
      );

      setBoardText(`🎯 Simpler Explanation

━━━━━━━━━━━━━━━━━━━━━━━━━━

${simplerExplanation.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━

${simplerExplanation.analogy ? `💡 **Analogy:** ${simplerExplanation.analogy}` : ''}`);

      await speakText(`Let me explain it more simply. ${simplerExplanation.content}`);
    }

    // Restore previous level
    setStudentLevel(previousLevel);
  };

  const handleShowStepByStep = async () => {
    console.log('[SUPPORT] Show step-by-step clicked');
    
    if (currentWorkedExample) {
      // Re-show worked example step-by-step
      for (let i = 0; i < currentWorkedExample.steps.length; i++) {
        const step = currentWorkedExample.steps[i];
        
        setBoardText(`Step ${step.stepNumber}: ${step.text}

${step.explanation || ''}

${step.highlight ? `🎯 Focus: ${step.highlight}` : ''}`);

        await speakText(step.text);
        if (step.explanation) {
          await speakText(step.explanation);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } else if (selectedQdrantTopic || lessonTopic) {
      // Generate new step-by-step
      await showWorkedExampleStepByStep(selectedQdrantTopic || lessonTopic);
    }
  };

  const handleGiveSimilar = async () => {
    console.log('[SUPPORT] Give similar question clicked');

    if (selectedQdrantTopic || lessonTopic) {
      await giveSimilarQuestionAfterMistake();
    }
  };

  // ==================== ENHANCED STEP-BY-STEP TEACHING FLOW ====================

  /**
   * START ENHANCED TEACHING
   * Initiates the step-by-step flow: concept → example → practice → feedback
   * NO FULL PDF - Only brief explanation, then example, then practice
   */
  const startEnhancedTeaching = async (topic: Topic) => {
    console.log('[ENHANCED TEACHING] Starting for topic:', topic.name);
    
    setSessionId(`session_${Date.now()}`);
    setLessonTopic(topic.name);
    setLessonDescription(topic.description);
    setSelectedTopic(topic);
    setShowClassModal(false);
    setCurrentStep(1);
    setTeachingPhase('concept');
    setEnhancedAttemptCount(0);
    setRecentMistakes([]);
    setShowSupportButtons(true);

    // Load student progress if available
    if (user?.id) {
      const progress = await enhancedTeachingService.getStudentProgress({
        studentId: user.id,
        topicId: topic.name,
      });
      if (progress.success && progress.data) {
        setStudentProgress(progress.data);
      }
    }

    // DO NOT load full PDF content - start with brief concept explanation
    console.log('[ENHANCED TEACHING] Starting with BRIEF concept (NO full PDF)');
    await explainConcept(topic.name);
  };

  /**
   * PHASE 1: Explain Concept (Briefly!) - NO FULL PDF
   */
  const explainConcept = async (topic: string) => {
    console.log('[ENHANCED TEACHING] Phase 1: Explaining concept...', topic);
    setTeachingPhase('concept');
    setIsLoading(true);

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.getConceptExplanation({
        topicId: topic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        studentLevel,
      });

      if (result.success && result.data) {
        const explanation = result.data;
        setConceptExplanation(explanation);

        // Display ONLY brief concept on board (NOT full PDF)
        const boardContent = buildConceptBoard(explanation);
        setBoardText(boardContent);

        // Set highlighted parts for visual display
        setHighlightedParts(explanation.keyParts.map((part, idx) => ({
          text: part.label,
          color: ['bg-blue-200', 'bg-green-200', 'bg-yellow-200'][idx % 3],
          description: part.description,
        })));

        // Speak introduction
        await speakText(explanation.spokenIntroduction);

        // Add check question to chat
        const checkMessage: Message = {
          id: `check_${Date.now()}`,
          sender: 'teacher',
          text: `Quick check: ${explanation.checkQuestion}\n\nType your answer below!`,
          type: 'text',
        };
        setChat(prev => [...prev, checkMessage]);
        await speakText(`Quick check: ${explanation.checkQuestion}`);
        
        // Move to worked example after brief pause (NOT showing full PDF)
        setTimeout(() => {
          console.log('[ENHANCED TEACHING] Moving to Phase 2: Worked Example');
          showEnhancedWorkedExample(topic);
        }, 3000);
        
      } else {
        throw new Error(result.message || 'Failed to get concept explanation');
      }
    } catch (error) {
      console.error('[ENHANCED TEACHING] Error explaining concept:', error);
      // Fallback
      const fallbackBoard = `📖 ${topic}\n\nLet me explain the basic concept...\n\n**Key Ideas:**\n• This is an important topic\n• We'll learn step-by-step\n• Ask if you're confused!\n\n💡 Take your time to understand.`;
      setBoardText(fallbackBoard);
      await speakText(`Let me explain ${topic}.`);
      
      // Move to example
      setTimeout(() => {
        showEnhancedWorkedExample(topic);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * PHASE 2: Show Worked Example (Step-by-Step) - ENHANCED
   */
  const showEnhancedWorkedExample = async (topic: string) => {
    console.log('[ENHANCED TEACHING] Phase 2: Showing worked example...', topic);
    setTeachingPhase('example');
    setCurrentExampleStep(0);
    setIsLoading(true);

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.getWorkedExample({
        topicId: topic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        difficulty: 'medium',
      });

      if (result.success && result.data) {
        const example = result.data;
        setEnhancedWorkedExample(example);

        // Show question first
        setBoardText(`📝 Worked Example\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Question:**\n${example.question}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nWatch carefully as I solve this step-by-step...`);

        const introMessage: Message = {
          id: `example_intro_${Date.now()}`,
          sender: 'teacher',
          text: `Now let me show you an example. Watch carefully as I solve this step-by-step.`,
          type: 'text',
        };
        setChat(prev => [...prev, introMessage]);
        await speakText(introMessage.text);

        // Solve step-by-step
        await showExampleStep(example, 0);
      } else {
        throw new Error(result.message || 'Failed to get worked example');
      }
    } catch (error) {
      console.error('[ENHANCED TEACHING] Error showing worked example:', error);
      setBoardText(`📝 Worked Example\n\nLet me show you how to solve this step-by-step...\n\n✅ Ready for your turn!`);
      setTimeout(() => giveEnhancedPracticeQuestion(topic), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show individual example step
   */
  const showExampleStep = async (example: EnhancedWorkedExample, stepIndex: number) => {
    if (stepIndex >= example.steps.length) {
      // Example complete
      await showExampleComplete(example);
      return;
    }

    setCurrentExampleStep(stepIndex);
    const step = example.steps[stepIndex];

    // Update board with current step highlighted
    const boardContent = `📝 Worked Example - Step ${stepIndex + 1}/${example.totalSteps}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Question:** ${example.question}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Step ${step.stepNumber}:**\n${step.action}\n\n${step.reasoning ? `**Why:** ${step.reasoning}` : ''}\n\n${step.highlight ? `🎯 **Focus on:** ${step.highlight}` : ''}\n\n${step.commonMistake ? `⚠️ **Watch out:** ${step.commonMistake}` : ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nStep ${stepIndex + 1} of ${example.totalSteps}`;

    setBoardText(boardContent);

    // Highlight this step on the board
    setHighlightedParts([{
      text: step.highlight || step.action,
      color: 'bg-yellow-200',
      description: step.reasoning || '',
    }]);

    // Speak the step
    await speakText(step.spokenExplanation || `${step.action}. ${step.reasoning || ''}`);

    // Pause, then next step
    setTimeout(() => {
      showExampleStep(example, stepIndex + 1);
    }, 2500);
  };

  /**
   * Example complete - show solution
   */
  const showExampleComplete = async (example: EnhancedWorkedExample) => {
  const solutionBoard = `📝 Worked Example Complete

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Solution:** ${example.finalAnswer}

━━━━━━━━━━━━━━━━━━━━━━━━━━

**Common Mistakes to Avoid:**
${(example as any).commonMistakes?.map((m: string) => `• ${m}`).join('\n') || 'No common mistakes'}

${example.checkMethod ? `**Check:** ${example.checkMethod}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Example Complete!

⏭️ Next: Your Turn to Practice`;

  setBoardText(solutionBoard);
};

const showSolution = async (example: EnhancedWorkedExample) => {
  const solutionMessage: Message = {
    id: `solution_${Date.now()}`,
    sender: 'teacher',
    text: `The answer is ${example.finalAnswer}. Remember to avoid these common mistakes: ${
      example.commonMistakes?.join(', ') || 'None'
    }.`,
    type: 'text',
  };

  // ✅ inside function
  setChat(prev => [...prev, solutionMessage]);

  await speakText(solutionMessage.text);

  // Move to practice
  setTimeout(() => {
    giveEnhancedPracticeQuestion(lessonTopic);
  }, 3000);
};

  /**
   * PHASE 3: Give Practice Question - ENHANCED
   */
  const giveEnhancedPracticeQuestion = async (topic: string) => {
    console.log('[ENHANCED TEACHING] Phase 3: Giving practice question...', topic);
    setTeachingPhase('practice');
    setIsLoading(true);

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.getPracticeQuestion({
        topicId: topic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        difficulty: enhancedAttemptCount > 0 ? 'easy' : 'medium',
        studentLevel: enhancedAttemptCount > 0 ? 'beginner' : studentLevel,
      });

      if (result.success && result.data) {
        const practice = result.data;
        setEnhancedPracticeQuestion(practice);

        const questionBoard = `✏️ Your Turn!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${practice.question}\n\n${practice.givenData ? `**Data:**\n${practice.givenData}` : ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 ${practice.thinkingHint || 'Take your time and show all your working!'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nType your answer in the chat below!`;

        setBoardText(questionBoard);

        const questionMessage: Message = {
          id: `practice_${Date.now()}`,
          sender: 'teacher',
          text: `Now it's your turn! ${practice.anxietyReducer} ${practice.thinkingHint || 'Take your time!'}`,
          type: 'text',
        };
        setChat(prev => [...prev, questionMessage]);
        await speakText(questionMessage.text);
      } else {
        throw new Error(result.message || 'Failed to get practice question');
      }
    } catch (error) {
      console.error('[ENHANCED TEACHING] Error giving practice question:', error);
      setBoardText(`✏️ Your Turn!\n\nTry to solve this on your own...\n\n💡 You can do this!`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * PHASE 4: Evaluate Student Answer - ENHANCED
   */
  const evaluateStudentAnswer = async (answer: string) => {
    console.log('[ENHANCED TEACHING] Phase 4: Evaluating answer...', answer);
    setTeachingPhase('feedback');
    setStudentAnswer(answer);
    setEnhancedAttemptCount(prev => prev + 1);
    setIsLoading(true);

    try {
      if (!enhancedPracticeQuestion) {
        throw new Error('No practice question to evaluate');
      }

      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.evaluateAnswer({
        topicId: lessonTopic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        question: enhancedPracticeQuestion.question,
        studentAnswer: answer,
        correctAnswer: enhancedPracticeQuestion.correctAnswer,
        attemptNumber: enhancedAttemptCount + 1,
      });

      if (result.success && result.data) {
        const feedbackData = result.data;
        setEnhancedFeedback(feedbackData);

        if (feedbackData.isCorrect) {
          // CORRECT!
          await handleCorrectAnswer(feedbackData);
        } else {
          // WRONG - explain mistake
          await handleIncorrectAnswer(feedbackData);
        }
      } else {
        throw new Error(result.message || 'Failed to evaluate answer');
      }
    } catch (error) {
      console.error('[ENHANCED TEACHING] Error evaluating answer:', error);
      const fallbackMessage: Message = {
        id: `fallback_${Date.now()}`,
        sender: 'teacher',
        text: `Good effort! Let me explain the correct approach.`,
        type: 'text',
      };
      setChat(prev => [...prev, fallbackMessage]);
      await speakText(fallbackMessage.text);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle correct answer
   */
  const handleCorrectAnswer = async (feedbackData: Feedback) => {
    const correctBoard = `✅ Excellent!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Correct Answer!**\n\n${feedbackData.encouragement}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🌟 Well done! You've mastered this!\n\n⏭️ Ready for the next topic?`;

    setBoardText(correctBoard);

    const correctMessage: Message = {
      id: `correct_${Date.now()}`,
      sender: 'teacher',
      text: `Excellent! ${feedbackData.encouragement} You've mastered this!`,
      type: 'text',
    };
    setChat(prev => [...prev, correctMessage]);
    await speakText(correctMessage.text);

    // Complete lesson
    setTimeout(() => {
      completeEnhancedLesson();
    }, 3000);
  };

  /**
   * Handle incorrect answer
   */
  const handleIncorrectAnswer = async (feedbackData: Feedback) => {
    // Track mistake
    if (enhancedPracticeQuestion) {
      const mistake: MistakeRecord = {
        topic: lessonTopic,
        mistakeType: feedbackData.mistakeType || 'method',
        timestamp: new Date(),
        question: enhancedPracticeQuestion.question,
        studentAnswer: studentAnswer,
        explanation: feedbackData.errorExplanation || '',
      };
      setRecentMistakes(prev => [...prev, mistake]);
    }

    const wrongBoard = `🤔 Let's Learn From This\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${feedbackData.specificFeedback}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${feedbackData.errorExplanation ? `**Mistake:** ${feedbackData.errorExplanation}` : ''}\n\n${feedbackData.correctMethod ? `**Correct Method:**\n${feedbackData.correctMethod}` : ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 Don't worry! Mistakes help us learn.\n\n🔄 Let me give you a similar question...`;

    setBoardText(wrongBoard);

    const wrongMessage: Message = {
      id: `wrong_${Date.now()}`,
      sender: 'teacher',
      text: `${feedbackData.encouragement} ${feedbackData.specificFeedback} ${feedbackData.errorExplanation || ''} ${feedbackData.correctMethod ? 'Let me show you the correct method.' : ''}`,
      type: 'text',
    };
    setChat(prev => [...prev, wrongMessage]);
    await speakText(wrongMessage.text);

    // Give similar (easier) question
    setTimeout(() => {
      giveSimilarQuestion();
    }, 2500);
  };

  /**
   * Give similar question after mistake
   */
  const giveSimilarQuestion = async () => {
    console.log('[ENHANCED TEACHING] Giving similar question after mistake...');
    setTeachingPhase('practice');
    setIsLoading(true);

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.getSimilarQuestion({
        topicId: lessonTopic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        originalQuestion: enhancedPracticeQuestion?.question || '',
        strugglePoint: enhancedFeedback?.errorExplanation || 'method',
      });

      if (result.success && result.data) {
        const similar = result.data;
        const similarBoard = `🔄 Similar Question\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${similar.question}\n\n💡 **Hint:** ${similar.hint}\n\n${similar.encouragement}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTake your time and apply what you just learned!`;

        setBoardText(similarBoard);

        const similarMessage: Message = {
          id: `similar_${Date.now()}`,
          sender: 'teacher',
          text: `${similar.encouragement} Try this similar question. ${similar.hint}`,
          type: 'text',
        };
        setChat(prev => [...prev, similarMessage]);
        await speakText(similarMessage.text);

        // Update practice question for next evaluation
        setEnhancedPracticeQuestion({
          question: similar.question,
          givenData: '',
          anxietyReducer: '',
          thinkingHint: similar.hint,
          expectedFormat: 'Show working',
          correctAnswer: similar.correctAnswer,
          markScheme: [],
          commonMistakesToWatch: [],
        });
      }
    } catch (error) {
      console.error('[ENHANCED TEACHING] Error giving similar question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Complete enhanced lesson
   */
  const completeEnhancedLesson = async () => {
    console.log('[ENHANCED TEACHING] Completing lesson...');
    setTeachingPhase('complete');

    const completionBoard = `🎉 Lesson Complete!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Today You Learned:**\n• ${lessonTopic}\n\n**Progress:**\n• Concepts understood ✅\n• Examples practiced ✅\n• Questions attempted ✅\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🌟 Great work! Ready for the next topic?`;

    setBoardText(completionBoard);

    const completionMessage: Message = {
      id: `complete_${Date.now()}`,
      sender: 'teacher',
      text: `Excellent work today! You've learned about ${lessonTopic}. Ready to move to the next topic?`,
      type: 'text',
    };
    setChat(prev => [...prev, completionMessage]);
    await speakText(completionMessage.text);

    setShowSupportButtons(false);
  };

  /**
   * Build concept board with visual highlighting
   */
  const buildConceptBoard = (explanation: ConceptExplanation): string => {
    return `📖 ${explanation.title}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${explanation.bigIdea}\n\n${explanation.analogy ? `💡 **Think of it like:**\n${explanation.analogy}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Key Parts:**\n\n${explanation.keyParts.map((part, idx) => `${idx + 1}. **${part.label}**: ${part.description}\n   → Focus on: ${part.highlight}\n`).join('\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${explanation.whyItMatters ? `**Why this matters:**\n${explanation.whyItMatters}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Concept Explained\n\n⏭️ Next: Worked Example`;
  };

  /**
   * Support Button Handlers - Enhanced Versions
   */
  const handleExplainSimplerEnhanced = async () => {
    console.log('[SUPPORT] Explain simpler clicked (Enhanced)');
    setIsLoading(true);

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const result = await enhancedTeachingService.getSimplifiedExplanation({
        topicId: lessonTopic,
        subject,
        yearGroup: selectedYear || `Year ${selectedClass}`,
        confusionPoint: 'Student needs simpler explanation',
        mistakes: recentMistakes,
      });

      if (result.success && result.data) {
        const simplified = result.data;
        const simplerBoard = `🎯 Simpler Explanation\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${simplified.newAnalogy}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${simplified.simplifiedSteps.map(s => `**Step ${s.step}:** ${s.explanation}\n\n_Imagine: ${s.visual}_\n\n`).join('\n')}\n\n💡 ${simplified.keyInsight}\n\n${simplified.encouragement}`;

        setBoardText(simplerBoard);
        await speakText(`Let me explain it in a different way. ${simplified.newAnalogy}`);
      }
    } catch (error) {
      console.error('[SUPPORT] Error explaining simpler:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowStepByStepEnhanced = async () => {
    console.log('[SUPPORT] Show step-by-step clicked (Enhanced)');
    if (enhancedWorkedExample) {
      await showEnhancedWorkedExample(lessonTopic);
    }
  };

  const handleGiveSimilarQuestionEnhanced = async () => {
    console.log('[SUPPORT] Give similar question clicked (Enhanced)');
    await giveSimilarQuestion();
  };

  /**
   * NATURAL TEACHING FLOW - Real Teacher Experience
   * STEP 1: Brief explanation on board (no interruptions)
   * STEP 2: Teacher speaks explanation with voice
   * STEP 3: Teacher asks "Do you have any questions?" (voice)
   * STEP 4: User asks question via voice (push-to-talk)
   * STEP 5: Teacher answers with voice (real teacher style, not chatbot)
   * STEP 6: Teacher speaks practice question
   * STEP 7: User answers via voice
   * STEP 8: Teacher highlights mistakes and explains
   */
  const initializeSmartTeaching = async (topicName: string) => {
    console.log('[NATURAL TEACHING] Starting for topic:', topicName);

    try {
      setSmartTeachingActive(true);
      setTeachingPhase('concept'); // Start with concept explanation

      // Map tutor type to subject
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // ============================================
      // STEP 1: Load topic content and display BRIEFLY
      // ============================================
      console.log('[NATURAL TEACHING] Step 1: Loading topic content...');
      console.log('[NATURAL TEACHING] Topic:', selectedQdrantTopic || topicName);

      const topicContent = await ragService.getTopicContent(
        subject,
        selectedQdrantTopic || topicName,
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[NATURAL TEACHING] Topic content loaded:', topicContent);
      
      const contextChunks = topicContent.documents?.flatMap((d: any) => d.chunks || []) || [];
      const context = contextChunks.slice(0, 2).map((c: any) => c.content).join('\n\n');
      
      console.log('[NATURAL TEACHING] Context chunks:', contextChunks.length);
      console.log('[NATURAL TEACHING] Context text:', context.substring(0, 100) + '...');

      // Display brief introduction on board (NO interruptions)
      const boardContent = `📖 ${selectedQdrantTopic || topicName}

━━━━━━━━━━━━━━━━━━━━━━━━━━

${context || 'Loading content...'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Listen carefully as I explain this...`;

      console.log('[NATURAL TEACHING] Setting board content...');
      console.log('[NATURAL TEACHING] Board content:', boardContent);
      setBoardText(boardContent);
      setLessonTopic(topicName);
      console.log('[NATURAL TEACHING] ✅ Board content displayed');
      
      // ============================================
      // STEP 2: Teacher SPEAKS the explanation (Voice)
      // ============================================
      console.log('[NATURAL TEACHING] Step 2: Speaking explanation...');
      console.log('[NATURAL TEACHING] Context to explain:', context);

      setAvatarTeachingMode('explaining');

      // Get AI explanation and speak it (ONLY ONCE) - Using TEACHER PERSONA TRAINING DOCUMENT
      console.log('[OPENROUTER] Fetching TEACHER PERSONA explanation...');

      try {
        const explanationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct',
            messages: [
              {
                role: 'system',
                content: `You are a friendly, patient, and supportive UK school teacher teaching a student aged 11-16 (Year 7-11).

YOUR CORE IDENTITY:
✓ You are a REAL CLASSROOM TEACHER, not a chatbot or AI assistant
✓ You explain concepts clearly and step-by-step
✓ You encourage curiosity and critical thinking
✓ You use simple, age-appropriate explanations
✓ You guide students instead of immediately giving answers
✓ You use examples, analogies, and short exercises
✓ You maintain a warm and respectful tone
✓ You NEVER sound robotic or overly technical

YOUR TONE MUST BE:
• Friendly - like a supportive teacher sitting next to them
• Encouraging - celebrate effort and small wins
• Patient - never rush, never make them feel stupid
• Clear - short sentences, simple language, no jargon
• Supportive - "I'm here with you", "Take your time"

NEVER USE:
✗ Robotic tone ("I am an AI...", "As a language model...")
✗ AI-style disclaimers
✗ Long walls of text - break it up
✗ "Obviously" or "Clearly"
✗ Making the student feel stupid

FOLLOW THIS EXACT TEACHING STRUCTURE:

STEP 1 - ACKNOWLEDGE THE STUDENT (1 sentence):
Start with: "Good question!" or "That's excellent thinking!" or "I'm glad you asked that!"

STEP 2 - UNDERSTAND THE STUDENT'S LEVEL (1 question):
Ask: "Have you learned about this before?" or "Do you already know what [concept] means?"

STEP 3 - EXPLAIN THE CONCEPT CLEARLY (2-3 sentences):
• Use simple language - no jargon without explanation
• Use real-life examples from UK students' experience
• Avoid long paragraphs - break information into small sections
• Build understanding gradually

Example: "A fraction shows a part of something. For example, if you cut a pizza into 4 pieces and eat 1 piece, you've eaten 1/4 of the pizza."

STEP 4 - PROVIDE A WORKED EXAMPLE (2-3 sentences):
Show ONE clear example with step-by-step working.
Example: "If 3 apples cost £6, how much does one apple cost? We divide 6 by 3. So one apple costs £2."

STEP 5 - ASK THE STUDENT TO TRY (1 question):
Give them a similar question to practice.
Example: "Now you try this one." or "What do you think the answer would be?"

STEP 6 - ENCOURAGE THE STUDENT (1 sentence):
Provide positive reinforcement.
Example: "Take your time. I'm here to help." or "You've got this!"

CONVERSATIONAL TEACHING PHRASES TO USE:
• "Let's look at this together."
• "Imagine you're cutting a cake..."
• "Here's a trick teachers often use..."
• "This is a common mistake students make..."
• "Think about it this way..."
• "Before we jump to the answer, let's understand the idea."
• "Does that make sense so far?"

UK EDUCATION CONTEXT:
• Use UK spelling: colour, centre, maths, organise, recognise
• Use £ for money examples, not $ or €
• Reference school years (Year 7, Year 8, etc.) not grades
• Use culturally neutral examples familiar to UK students

SOCRATIC QUESTIONING (GUIDE THINKING):
Ask questions that make them think:
• "What do you notice about these numbers?"
• "Why do you think that happens?"
• "What would happen if we changed this value?"

REMEMBER:
- The goal is not to impress them with how much you know.
- The goal is to help THEM understand and feel confident.
- Sound like a REAL CLASSROOM TEACHER, not a chatbot!`
              },
              { 
                role: 'user', 
                content: `Explain this topic to a Year ${selectedClass || '7-9'} student following the teacher persona guidelines:

TOPIC: ${selectedQdrantTopic || topicName}
SUBJECT: ${subject}

CURRICULUM CONTENT:
${context || 'General explanation needed'}

Please provide a brief, clear explanation following the 6-step teaching structure.` 
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!explanationResponse.ok) {
          throw new Error(`OpenRouter API error: ${explanationResponse.status}`);
        }

        const explanationData = await explanationResponse.json();
        const teacherExplanation = explanationData.choices?.[0]?.message?.content || '';

        console.log('[OPENROUTER] ✅ TEACHER PERSONA explanation received:', teacherExplanation.substring(0, 100) + '...');

        // Speak the AI explanation (ONLY ONCE)
        if (teacherExplanation && teacherExplanation.trim().length > 0) {
          console.log('[VOICE] Speaking teacher persona explanation...');
          await speakText(teacherExplanation);
          console.log('[VOICE] ✅ Teacher persona explanation speech COMPLETE!');
        } else {
          // Fallback: Speak board content if AI returns empty
          console.log('[VOICE] AI returned empty, speaking board content...');
          await speakText(`Let me explain ${selectedQdrantTopic || topicName}. ${context}`);
          console.log('[VOICE] ✅ Board content spoken!');
        }

      } catch (error) {
        console.error('[OPENROUTER] Error fetching teacher persona explanation:', error);
        // FALLBACK: Speak board content
        console.log('[VOICE] Error, speaking board content...');
        await speakText(`Let me explain ${selectedQdrantTopic || topicName}. ${context}`);
        console.log('[VOICE] ✅ Board content spoken (fallback)!');
      }

      console.log('[VOICE] ✅ ALL speech COMPLETE!');
      
      // ============================================
      // STEP 3: Teacher asks "Do you have any questions?" (Voice)
      // ONLY shows AFTER explanation fully completes
      // ============================================
      console.log('[NATURAL TEACHING] Step 3: Asking for questions...');
      
      const questionPrompt = "Do you have any questions about what I just explained? You can ask me anything - just click the microphone button and speak!";
      
      const questionMessage: Message = {
        id: 'teacher_question',
        sender: 'teacher',
        text: questionPrompt,
        type: 'text',
      };
      setChat([questionMessage]);
      
      setAvatarTeachingMode('questioning');
      
      // Speak the question and WAIT for it to complete
      console.log('[VOICE] Speaking question prompt...');
      await speakText(questionPrompt);
      console.log('[VOICE] ✅ Question prompt speech COMPLETE!');
      
      console.log('[NATURAL TEACHING] ✅ Waiting for student questions...');
      // Now student can ask questions via voice (push-to-talk button)

    } catch (error) {
      console.error('[NATURAL TEACHING] Error:', error);
      setSmartTeachingActive(false);
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        sender: 'teacher',
        text: "Welcome! Let's start learning about " + topicName + "!",
        type: 'text',
      };
      setChat([errorMessage]);
      await speakText(errorMessage.text);
    }
  }

  /**
   * Handle voice question from student and answer with voice (Real Teacher Style)
   */
  const handleVoiceQuestion = async (question: string) => {
    console.log('[VOICE QUESTION] Student asked:', question);
    
    try {
      setAvatarTeachingMode('listening');
      
      // Add student question to chat (for display only)
      const studentMessage: Message = {
        id: `voice_q_${Date.now()}`,
        sender: 'student',
        text: question,
        type: 'voice',
      };
      setChat(prev => [...prev, studentMessage]);
      
      // Get context from Qdrant
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';
      
      const topicContent = await ragService.getTopicContent(
        subject,
        selectedQdrantTopic || lessonTopic,
        selectedYear || `Year ${selectedClass}`
      );
      
      const context = topicContent.documents?.flatMap((d: any) => d.chunks || [])
        .map((c: any) => c.content).join('\n\n') || '';
      
      // Build teacher response (REAL TEACHER STYLE - not chatbot)
      const teacherPrompt = `You are a friendly UK school teacher sitting next to the student. The student just asked you this question:

STUDENT QUESTION: "${question}"

CURRICULUM CONTENT:
${context || 'Use your general teaching knowledge'}

Answer like a REAL HUMAN TEACHER would:
✓ Speak conversationally (not like a chatbot)
✓ Use "you" and "let me show you"
✓ Explain step-by-step if it's a problem
✓ Use simple analogies from everyday life (£, school, sports, food)
✓ Check understanding: "Does that make sense?"
✓ Be encouraging and supportive
✓ Keep it brief (30-60 seconds to speak)
✓ NEVER say "As an AI..." or "I'm an AI..."

Respond as if you're speaking aloud to the student right now.`;

      const teacherResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct',
          messages: [
            { 
              role: 'system', 
              content: 'You are a friendly, patient UK school teacher. Answer student questions conversationally, like you\'re sitting next to them. Use UK spelling and examples (£, school years). NEVER mention you\'re an AI.'
            },
            { role: 'user', content: teacherPrompt }
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const responseData = await teacherResponse.json();
      const teacherAnswer = responseData.choices?.[0]?.message?.content || "That's a great question! Let me explain...";

      // Display teacher answer on board
      const boardContent = `❓ Your Question: ${question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Teacher's Answer:

${teacherAnswer}

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Does that make sense?`;

      setBoardText(boardContent);
      
      // Add teacher answer to chat
      const teacherMessage: Message = {
        id: `teacher_a_${Date.now()}`,
        sender: 'teacher',
        text: teacherAnswer,
        type: 'voice',
      };
      setChat(prev => [...prev, teacherMessage]);
      
      // SPEAK the answer (Avatar teacher talks)
      console.log('[VOICE] Speaking teacher answer...');
      setAvatarTeachingMode('explaining');
      await speakText(teacherAnswer);
      
      // After answering, ask practice question
      await new Promise(resolve => setTimeout(resolve, 1500));
      await askPracticeQuestion();
      
    } catch (error) {
      console.error('[VOICE QUESTION] Error:', error);
      
      const fallbackAnswer = "That's a really good question! Let me explain what I know about this...";
      
      const fallbackMessage: Message = {
        id: `teacher_fallback_${Date.now()}`,
        sender: 'teacher',
        text: fallbackAnswer,
        type: 'voice',
      };
      setChat(prev => [...prev, fallbackMessage]);
      setBoardText(`❓ Your Question: ${question}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📖 Teacher's Response:\n\n${fallbackAnswer}\n\n💡 Let's explore this together!`);
      
      setAvatarTeachingMode('explaining');
      await speakText(fallbackAnswer);
    }
  }

  /**
   * Ask practice question (Teacher speaks it)
   */
  const askPracticeQuestion = async () => {
    console.log('[PRACTICE] Asking practice question...');
    
    try {
      // Switch to practice phase
      setTeachingPhase('practice');
      
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';
      
      // Generate practice question
      const practicePrompt = `Generate ONE practice question for this topic:

TOPIC: ${selectedQdrantTopic || lessonTopic}
YEAR: ${selectedYear || `Year ${selectedClass}`}
SUBJECT: ${subject}

Format:
- Question text (clear and simple)
- Expected answer (for teacher reference)
- Hint if student gets stuck

Return as JSON:
{
  "question": "Question text",
  "answer": "Expected answer",
  "hint": "Helpful hint"
}`;

      const practiceResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct',
          messages: [
            { role: 'system', content: 'You are a UK school teacher generating practice questions.' },
            { role: 'user', content: practicePrompt }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const practiceData = await practiceResponse.json();
      const practiceContent = practiceData.choices?.[0]?.message?.content || '{}';
      
      // Parse JSON response
      let practiceQuestion;
      try {
        practiceQuestion = JSON.parse(practiceContent.replace(/```json|```/g, '').trim());
      } catch {
        practiceQuestion = {
          question: `Can you explain more about ${selectedQdrantTopic || lessonTopic}?`,
          answer: 'Varies',
          hint: 'Think about what we discussed',
        };
      }
      
      // Display practice question on board
      const boardContent = `✏️ Your Turn!

━━━━━━━━━━━━━━━━━━━━━━━━━━

${practiceQuestion.question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Hint: ${practiceQuestion.hint || 'Think carefully!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Click the microphone and SPEAK your answer!`;

      setBoardText(boardContent);
      
      // Teacher SPEAKS the practice question
      setAvatarTeachingMode('questioning');
      const spokenQuestion = `Now I'd like you to try a question. Listen carefully: ${practiceQuestion.question}. ${practiceQuestion.hint ? 'Hint: ' + practiceQuestion.hint : ''} Click the microphone button and speak your answer!`;
      
      const practiceMessage: Message = {
        id: `practice_q_${Date.now()}`,
        sender: 'teacher',
        text: spokenQuestion,
        type: 'voice',
      };
      setChat(prev => [...prev, practiceMessage]);
      
      await speakText(spokenQuestion);
      
      // Store practice question for evaluation
      ;(window as any).__currentPracticeQuestion = practiceQuestion;
      
      console.log('[PRACTICE] ✅ Question asked, waiting for student answer...');
      
    } catch (error) {
      console.error('[PRACTICE] Error:', error);
      
      const fallbackQuestion = `Can you tell me more about what you've learned about ${selectedQdrantTopic || lessonTopic}?`;
      
      const fallbackMessage: Message = {
        id: `practice_fallback_${Date.now()}`,
        sender: 'teacher',
        text: `Now try this: ${fallbackQuestion} Click the microphone and speak your answer!`,
        type: 'voice',
      };
      setChat(prev => [...prev, fallbackMessage]);
      
      setBoardText(`✏️ Your Turn!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${fallbackQuestion}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎤 Click the microphone and SPEAK your answer!`);
      
      await speakText(fallbackMessage.text);
      
      ;(window as any).__currentPracticeQuestion = { question: fallbackQuestion, answer: 'Varies', hint: '' };
    }
  }

  /**
   * Handle student voice answer and check for mistakes
   */
  const handleVoiceAnswer = async (answer: string) => {
    console.log('[VOICE ANSWER] Student answered:', answer);
    
    try {
      const practiceQuestion = (window as any).__currentPracticeQuestion;
      
      if (!practiceQuestion) {
        console.error('[VOICE ANSWER] No practice question found');
        return;
      }
      
      // Add student answer to chat
      const studentMessage: Message = {
        id: `voice_a_${Date.now()}`,
        sender: 'student',
        text: answer,
        type: 'voice',
      };
      setChat(prev => [...prev, studentMessage]);
      
      // Evaluate answer (check for mistakes)
      const evalPrompt = `You are a UK school teacher evaluating a student's answer.

QUESTION: ${practiceQuestion.question}
EXPECTED ANSWER: ${practiceQuestion.answer}
STUDENT ANSWER: ${answer}

Check if the student understands the concept. Look for:
1. Is the answer correct?
2. If wrong, what is the specific mistake?
3. How would you explain the correct method?

Return as JSON:
{
  "isCorrect": true/false,
  "feedback": "Encouraging feedback",
  "mistake": "Description of mistake if wrong",
  "highlightedError": "Specific error to highlight",
  "correctMethod": "Step-by-step correct method if wrong"
}`;

      const evalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct',
          messages: [
            { role: 'system', content: 'You are a supportive UK school teacher evaluating student answers. Be encouraging but accurate.' },
            { role: 'user', content: evalPrompt }
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      const evalData = await evalResponse.json();
      const evalContent = evalData.choices?.[0]?.message?.content || '{}';
      
      // Parse JSON response
      let evaluation;
      try {
        evaluation = JSON.parse(evalContent.replace(/```json|```/g, '').trim());
      } catch {
        evaluation = {
          isCorrect: false,
          feedback: "Good effort! Let me explain...",
          mistake: "Some misunderstanding",
          highlightedError: "Key concept error",
          correctMethod: "Let me show you the correct way...",
        };
      }
      
      // Display feedback on board
      const boardContent = `${evaluation.isCorrect ? '✅ Excellent!' : '🤔 Let\'s Learn'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

${evaluation.feedback}

${!evaluation.isCorrect ? `
**Mistake:** ${evaluation.highlightedError || 'Let me explain...'}

**Correct Method:**
${evaluation.correctMethod || 'Let me show you...'}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━

${evaluation.isCorrect ? '🌟 Well done! You understand this!' : '💡 Let\'s try another question!'}`;

      setBoardText(boardContent);
      
      // Teacher SPEAKS the feedback
      setAvatarTeachingMode(evaluation.isCorrect ? 'explaining' : 'explaining');
      const spokenFeedback = evaluation.isCorrect 
        ? `${evaluation.feedback} Well done! You really understand ${selectedQdrantTopic || lessonTopic}!`
        : `${evaluation.feedback} ${evaluation.mistake || ''} ${evaluation.correctMethod || 'Let me show you the correct method...'}`;
      
      const feedbackMessage: Message = {
        id: `feedback_${Date.now()}`,
        sender: 'teacher',
        text: spokenFeedback,
        type: 'voice',
      };
      setChat(prev => [...prev, feedbackMessage]);
      
      await speakText(spokenFeedback);
      
      // If wrong, give another chance
      if (!evaluation.isCorrect) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await askPracticeQuestion(); // Ask similar question
      }
      
    } catch (error) {
      console.error('[VOICE ANSWER] Error evaluating:', error);
      
      const fallbackFeedback = "Good effort! Let me explain the correct answer...";
      
      const fallbackMessage: Message = {
        id: `feedback_fallback_${Date.now()}`,
        sender: 'teacher',
        text: fallbackFeedback,
        type: 'voice',
      };
      setChat(prev => [...prev, fallbackMessage]);
      
      setBoardText(`🤔 Let's Learn\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${fallbackFeedback}\n\n💡 Let me explain...`);
      
      await speakText(fallbackFeedback);
    }
  }

  /**
   * Speak lesson content with auto-scroll (normal human speed)
   */
  const speakLessonContent = async (content: string) => {
    console.log('[SPEAK CONTENT] Starting to speak lesson content...');
    console.log('[SPEAK CONTENT] Content length:', content.length);
    console.log('[SPEAK CONTENT] Content preview:', content.substring(0, 200));

    // Split content into sentences for natural pacing
    const sentences = content.split(/[.!?]+\s+/).filter(s => s.trim().length > 20);

    console.log('[SPEAK CONTENT] Total sentences:', sentences.length);
    
    if (sentences.length === 0) {
      console.log('[SPEAK CONTENT] No sentences found, speaking full content...');
      // If no sentences found, speak the full content in chunks
      const chunks = content.match(/.{1,200}/g) || [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`[SPEAK CONTENT] Speaking chunk ${i + 1}/${chunks.length}`);
        await speakText(chunks[i]);
        // No fixed delay - just wait for speech to complete
      }
      return;
    }

    console.log('[SPEAK CONTENT] First sentence:', sentences[0]?.substring(0, 50));

    // Find the lesson board scroll container
    const scrollContainer = document.querySelector('.lesson-content-scroll');
    console.log('[SPEAK CONTENT] Scroll container found:', !!scrollContainer);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      console.log(`[SPEAK CONTENT] Speaking sentence ${i + 1}/${sentences.length}:`, sentence.substring(0, 50));

      // Speak this sentence at normal speed
      await speakText(sentence);

      // Auto-scroll to keep current sentence visible
      if (scrollContainer) {
        const progress = (i + 1) / sentences.length;
        const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        scrollContainer.scrollTop = scrollHeight * progress;
        console.log('[SPEAK CONTENT] Scrolled to:', scrollContainer.scrollTop);
      }

      // No fixed pause - just wait for next iteration
    }

    console.log('[SPEAK CONTENT] Finished speaking all sentences');
  }

  /**
   * Navigate to next page and explain
   */
  const goToNextPage = async () => {
    const pages = (window as any).__currentPages || [];
    let currentIndex = (window as any).__currentPageIndex || 0;
    
    if (currentIndex >= pages.length - 1) {
      // Already on last page - ask for questions
      const endMessage: Message = {
        id: 'end_page',
        sender: 'teacher',
        text: `We're on the last page! **Do you have any questions?** Type them below!`,
        type: 'text',
      };
      setChat(prev => [...prev, endMessage]);
      speakText(endMessage.text);
      return;
    }
    
    currentIndex++;
    ;(window as any).__currentPageIndex = currentIndex;
    const page = pages[currentIndex];
    
    // Display page on whiteboard
    const boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📖 ${selectedQdrantTopic || topicName}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📄 Page ${page.pageNumber} of ${page.totalPages}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${page.content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📚 Source: ${page.source}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nUse ◀ ▶ buttons to navigate`;
    
    setBoardText(boardContent);
    
    // Teacher SPEAKS this page content
    speakText(page.content);
    
    // Update current step
    setCurrentStep(2);
    setTeachingMode('explaining');
  };

  /**
   * Navigate to previous page
   */
  const goToPrevPage = () => {
    const pages = (window as any).__currentPages || [];
    let currentIndex = (window as any).__currentPageIndex || 0;
    
    if (currentIndex <= 0) return;
    
    currentIndex--;
    ;(window as any).__currentPageIndex = currentIndex;
    const page = pages[currentIndex];
    
    const boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📖 ${selectedQdrantTopic || topicName}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📄 Page ${page.pageNumber} of ${page.totalPages}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${page.content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📚 Source: ${page.source}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nUse ◀ ▶ buttons to navigate`;
    
    setBoardText(boardContent);
  };

  /**
   * Submit Diagnostic Answers
   * STEP 5: Evaluate answers and generate teaching chunk
   */
  const submitDiagnosticAnswers = async () => {
    if (!smartSessionId || diagnosticQuestions.length === 0) return;

    try {
      setIsLoading(true);
      setShowDiagnosticQuiz(false);

      // Format answers for API
      const answers = diagnosticQuestions.map(q => ({
        question: q.question,
        answer: diagnosticAnswers[q.id] || '',
      }));

      console.log('[SMART TEACHING] Step 5: Submitting diagnostic answers...');

      const result = await smartAiTeacherService.submitDiagnostic(
        smartSessionId,
        answers,
        selectedQdrantTopic || lessonTopic,
        type,
        selectedYear || `Year ${selectedClass}`
      );

      if (result.success) {
        console.log('[SMART TEACHING] ✅ Diagnostic score:', result.diagnostic_score);

        // Show diagnostic feedback
        const feedbackMessage: Message = {
          id: `diagnostic_feedback_${Date.now()}`,
          sender: 'teacher',
          text: result.message,
          type: 'text',
        };
        setChat(prev => [...prev, feedbackMessage]);
        await speakText(result.message);

        // Display teaching chunk on board
        displayTeachingChunk(result.teaching_chunk);

        // Move to teaching step
        setCurrentStep(2);
        setTeachingMode('explaining');
        setAvatarTeachingMode('explaining');

        // Speak teaching chunk content
        console.log('[SMART TEACHING] Step 6: Teaching chunk...');
        await speakText(result.teaching_chunk.content);

        // After teaching chunk, move to worked example (Step 4)
        setTimeout(async () => {
          console.log('[SMART TEACHING] Step 7: Getting worked example...');
          await getWorkedExampleSmart();
        }, 3000);
      }
    } catch (error) {
      console.error('[SMART TEACHING] Error submitting diagnostic:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        sender: 'teacher',
        text: "There was an error checking your answers. Let's continue with the lesson!",
        type: 'text',
      };
      setChat(prev => [...prev, errorMessage]);
      
      // Continue with teaching anyway
      setShowDiagnosticQuiz(false);
      setCurrentStep(2);
      setTeachingMode('explaining');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Display Teaching Chunk on Board
   */
  const displayTeachingChunk = (chunk: TeachingChunk) => {
    let boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📖 ${chunk.title}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

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

    boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Step 3: Learning Complete\n\n⏭️ Next: Worked Example`

    setBoardText(boardContent)
  }

  /**
   * Get Worked Example
   */
  const getWorkedExampleSmart = async () => {
    if (!smartSessionId) return

    try {
      setIsLoading(true)
      
      const result = await smartAiTeacherService.getWorkedExample(
        smartSessionId,
        selectedQdrantTopic || lessonTopic,
        type,
        selectedYear || `Year ${selectedClass}`
      )

      if (result.success) {
        setWorkedExample(result.worked_example)
        displayWorkedExample(result.worked_example)
        
        // Prompt student to attempt
        setTimeout(() => {
          const attemptMessage: Message = {
            id: `attempt_prompt_${Date.now()}`,
            sender: 'teacher',
            text: `Now it's **your turn**! \n\nTry solving a similar problem yourself. Show all your working out!`,
            type: 'text',
          }
          setChat(prev => [...prev, attemptMessage])
          speakText(attemptMessage.text)
          setAvatarTeachingMode('explaining')
          setCurrentStep(4)
          setTeachingMode('practicing')
        }, 3000)
      }
    } catch (error) {
      console.error('Error getting worked example:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Display Worked Example on Board
   */
  const displayWorkedExample = (example: ServiceWorkedExample) => {
    let boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📝 WORKED EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    boardContent += `**Problem:**\n${example.problem}\n\n`
    boardContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    if (example.steps && example.steps.length > 0) {
      example.steps.forEach((step, idx) => {
        boardContent += `**Step ${idx + 1}:**\n${step}\n\n`
      })
    }

    boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Final Answer:** ${example.final_answer}\n\n`

    if (example.method_notes) {
      boardContent += `\n📝 **Method Notes:**\n${example.method_notes}\n`
    }

    if (example.exam_tips && example.exam_tips.length > 0) {
      boardContent += `\n⭐ **Exam Tips:**\n`
      example.exam_tips.forEach(tip => {
        boardContent += `• ${tip}\n`
      })
    }

    boardContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Step 4: Worked Example Complete\n\n✏️ Step 5: Your Turn!\n\nType your answer below...`

    setBoardText(boardContent)
  }

  /**
   * Submit Student Attempt
   */
  const submitStudentAttempt = async () => {
    if (!smartSessionId || !currentAnswer.trim()) return

    try {
      setIsLoading(true)
      setAttemptCount(prev => prev + 1)
      
      const result = await smartAiTeacherService.submitAttempt(
        smartSessionId,
        currentAnswer,
        selectedQdrantTopic || lessonTopic,
        type,
        selectedYear || `Year ${selectedClass}`,
        attemptCount
      )

      if (result.success) {
        setFeedback(result.feedback)
        
        // Show feedback
        const feedbackMessage: Message = {
          id: `feedback_${Date.now()}`,
          sender: 'teacher',
          text: result.feedback.message,
          type: 'text',
        }
        setChat(prev => [...prev, feedbackMessage])
        
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
          const safeguardingMessage: Message = {
            id: `safeguarding_${Date.now()}`,
            sender: 'teacher',
            text: result.safeguarding.response + '\n\n' + result.safeguarding.trusted_adult_prompt,
            type: 'text',
          }
          setChat(prev => [...prev, safeguardingMessage])
          // Log safeguarding concern
          console.warn('Safeguarding alert:', result.safeguarding)
        }

        // Handle integrity violation
        if (result.integrity_violation) {
          const integrityMessage: Message = {
            id: `integrity_${Date.now()}`,
            sender: 'teacher',
            text: result.integrity_violation.response,
            type: 'text',
          }
          setChat(prev => [...prev, integrityMessage])
          
          // Show similar example instead of answer
          if (result.similar_example) {
            displayWorkedExample(result.similar_example)
          }
        }

        // Update progress
        if (result.progress) {
          console.log('Progress updated:', result.progress)
        }

        // Next step
        if (result.next_step === 'mastery_check') {
          setTimeout(() => {
            generateMasteryCheck()
          }, 2000)
        } else {
          setCurrentAnswer('')
        }
      }
    } catch (error) {
      console.error('Error submitting student attempt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate Mastery Check
   */
  const generateMasteryCheck = async () => {
    if (!smartSessionId) return

    try {
      setIsLoading(true)

      const result = await smartAiTeacherService.generateMasteryCheck(
        smartSessionId,
        selectedQdrantTopic || lessonTopic,
        type,
        selectedYear || `Year ${selectedClass}`
      )

      if (result.success) {
        setMasteryQuestions(result.mastery_check.questions)
        setShowMasteryCheck(true)
        setCurrentStep(5)

        // Step 6: Feedback & Mastery Check introduction
        const masteryMessage: Message = {
          id: `mastery_${Date.now()}`,
          sender: 'teacher',
          text: `Excellent! Now let's check your understanding with ${result.mastery_check.questions.length} quick questions.\n\nYou need ${result.mastery_check.pass_threshold}% to pass. Take your time!`,
          type: 'text',
        }
        setChat(prev => [...prev, masteryMessage])
        speakText(masteryMessage.text)

        // Update board
        const boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 MASTERY CHECK\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nShow what you've learned about **${selectedQdrantTopic || lessonTopic}**!\n\nPass mark: ${result.mastery_check.pass_threshold}%\nQuestions: ${result.mastery_check.questions.length}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Step 6: Feedback Given\n\n🎯 Step 7: Mastery Check\n\nGood luck! You've got this!`
        setBoardText(boardContent)
      }
    } catch (error) {
      console.error('Error generating mastery check:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Complete Teaching Session
   */
  const completeSession = async (masteryPassed: boolean) => {
    if (!smartSessionId) return

    try {
      const result = await smartAiTeacherService.completeSession(
        smartSessionId,
        masteryPassed,
        selectedQdrantTopic || lessonTopic,
        type
      )

      if (result.success) {
        // Step 7: Completion message
        const completionMessage: Message = {
          id: `complete_${Date.now()}`,
          sender: 'teacher',
          text: result.next_steps,
          type: 'text',
        }
        setChat(prev => [...prev, completionMessage])
        speakText(result.next_steps)

        // Reset SMART teaching state
        setSmartTeachingActive(false)
        setSmartSessionId('')
        setShowMasteryCheck(false)

        // Update board with completion status
        const boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n ${masteryPassed ? '🎉 Topic Mastered!' : 'Keep Practicing!'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTopic: ${selectedQdrantTopic || lessonTopic}\n\nStatus: ${masteryPassed ? '✅ SECURE' : '🔄 DEVELOPING'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${result.next_steps}\n\n${masteryPassed ? 'Ready for the next challenge?' : 'Let\'s review and try again.'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ 7-Step Teaching Complete!`
        setBoardText(boardContent)
      }
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const autoTeachTopic = (topic: Topic) => {
    setCurrentStep(2)
    setTeachingMode('explaining')
    
    const sections = topic.lessons.map((lesson, index) => `Section ${index + 1}: ${lesson}`)
    setLessonSections(sections)
    setCurrentLessonSection(0)
    
    teachSection(topic, 0)
  }

  const teachSection = (topic: Topic, sectionIndex: number) => {
    if (sectionIndex >= topic.lessons.length) {
      setTimeout(() => {
        showWorkedExample(topic)
      }, 2000)
      return
    }

    setCurrentLessonSection(sectionIndex)
    setIsSectionComplete(false)
    setTeachingMode('explaining')
    setAvatarTeachingMode('idle') // Look at student while introducing section

    const sectionName = topic.lessons[sectionIndex]
    const sectionContent = getSectionContent(topic, sectionName)

    const boardContent = `${type.toUpperCase()} • Year ${selectedClass}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n Section ${sectionIndex + 1}/${topic.lessons.length}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${sectionName}\n\n${sectionContent.board}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n "Take your time to understand this."\n "Ask me if you're confused!"`

    const teachingMessage: Message = {
      id: `section_${sectionIndex}_${Date.now()}`,
      sender: 'teacher',
      text: `Great! Let's start with **Section ${sectionIndex + 1}**: ${sectionName}\n\n${sectionContent.text}\n\nTake your time to read the board and understand this section. \n\nWhen you're ready, type **"got it"** or ask me a question! `,
      type: 'text',
    }

    setChat(prev => [...prev, teachingMessage])
    setBoardText(boardContent)
    
    // Avatar turns to write on board, then turns back to explain
    setAvatarTeachingMode('writing')
    setIsAvatarWriting(true)
    
    setTimeout(() => {
      setIsAvatarWriting(false)
      setAvatarTeachingMode('pointing') // Point at content while explaining
      
      setTimeout(() => {
        setAvatarTeachingMode('explaining') // Face student and explain
        speakText(teachingMessage.text)
      }, 1000)
    }, 1500)
  }

  const moveToNextSection = (topic: Topic) => {
    const nextSection = currentLessonSection + 1

    if (nextSection >= topic.lessons.length) {
      setIsSectionComplete(true)
      const completionMessage: Message = {
        id: `sections_complete_${Date.now()}`,
        sender: 'teacher',
        text: ` Excellent! You've completed all sections!\n\nNow let's look at a **worked example** to see how everything fits together...`,
        type: 'text',
      }
      setChat(prev => [...prev, completionMessage])
      speakText(completionMessage.text)
      setAvatarTeachingMode('explaining')
      setTimeout(() => {
        showWorkedExample(topic)
      }, 3000)
    } else {
      const nextSectionName = topic.lessons[nextSection]
      const sectionContent = getSectionContent(topic, nextSectionName)

      const boardContent = `${type.toUpperCase()} • Year ${selectedClass}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n Section ${nextSection + 1}/${topic.lessons.length}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${nextSectionName}\n\n${sectionContent.board}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n "Let's continue!"\n "You're doing great!"`

      const nextMessage: Message = {
        id: `section_${nextSection}_${Date.now()}`,
        sender: 'teacher',
        text: `Perfect! Now let's move to **Section ${nextSection + 1}**: ${nextSectionName}\n\n${sectionContent.text}\n\nRead the board carefully. Let me know when you understand! `,
        type: 'text',
      }

      setChat(prev => [...prev, nextMessage])
      setBoardText(boardContent)
      setCurrentLessonSection(nextSection)
      
      // Avatar animation sequence for section transition
      setAvatarTeachingMode('writing')
      setIsAvatarWriting(true)
      
      setTimeout(() => {
        setIsAvatarWriting(false)
        setAvatarTeachingMode('pointing')
        
        setTimeout(() => {
          setAvatarTeachingMode('explaining')
          speakText(nextMessage.text)
        }, 800)
      }, 1200)
    }
  }

  const getSectionContent = (topic: Topic, sectionName: string): { text: string; board: string } => {
    const content: Record<string, { text: string; board: string }> = {
      'One-step equations': {
        text: `**One-step equations** need just ONE operation to solve.\n\n**Example:** x + 5 = 12\n\nTo solve: Subtract 5 from both sides\nx = 12 - 5\nx = 7\n\n**Remember:** Do the opposite operation!`,
        board: `One-Step Equations\n\nx + 5 = 12\n\nSubtract 5:\nx = 12 - 5\nx = 7 \n\nOpposite operation!`,
      },
      'Two-step equations': {
        text: `**Two-step equations** need TWO operations.\n\n**Example:** 2x + 3 = 11\n\nStep 1: Subtract 3\n2x = 8\n\nStep 2: Divide by 2\nx = 4\n\n**Order matters!** Undo addition/subtraction first, then multiplication/division.`,
        board: `Two-Step Equations\n\n2x + 3 = 11\n\nStep 1: -3\n2x = 8\n\nStep 2: ÷2\nx = 4 \n\nOrder matters!`,
      },
      'Plant parts': {
        text: `**Plants have 4 main parts:**\n\n1. **Roots** - absorb water and nutrients\n2. **Stem** - supports the plant\n3. **Leaves** - make food (photosynthesis)\n4. **Flower** - makes seeds\n\nEach part has a special job!`,
        board: `Plant Parts\n\n1. Roots → Water\n2. Stem → Support\n3. Leaves → Food\n4. Flower → Seeds\n\nEach has a job!`,
      },
      'Photosynthesis intro': {
        text: `**Photosynthesis** is how plants make food!\n\n**What plants need:**\n Sunlight\n Water\n Carbon dioxide\n\n**What plants make:**\n Glucose (food)\n Oxygen\n\n**Equation:** CO₂ + H₂O + light → Glucose + O₂`,
        board: `Photosynthesis\n\nNeeds:\n Light\n Water\n CO₂\n\nMakes:\n Glucose\n Oxygen`,
      },
      'Animal cells': {
        text: `**Animal cells have 4 main parts:**\n\n1. **Nucleus** - controls the cell (like a brain)\n2. **Cytoplasm** - jelly where reactions happen\n3. **Cell membrane** - controls what enters/leaves\n4. **Mitochondria** - releases energy\n\nEach part is essential!`,
        board: `Animal Cell\n\n1. Nucleus → Control\n2. Cytoplasm → Reactions\n3. Membrane → Gatekeeper\n4. Mitochondria → Energy`,
      },
    }

    if (content[sectionName]) {
      return content[sectionName]
    }

    return {
      text: `Let's learn about **${sectionName}**.\n\nThis is an important part of understanding **${topic.name}**.\n\nLook at the board for the key points.\n\nTake notes if you need to!`,
      board: `${sectionName}\n\nKey Points:\n\n• Point 1\n• Point 2\n• Point 3\n\nExample:\n\n\n\nRemember this!`,
    }
  }

  const showWorkedExample = (topic: Topic) => {
    setCurrentStep(3)
    setTeachingMode('explaining')
    setAvatarTeachingMode('writing')
    setIsAvatarWriting(true)

    const example = getWorkedExample(topic)
    const exampleMessage: Message = {
      id: `example_${Date.now()}`,
      sender: 'teacher',
      text: `Now let's look at a **worked example**:\n\n${example.text}`,
      type: 'text',
    }

    setChat(prev => [...prev, exampleMessage])
    setBoardText(example.board)
    
    // Avatar writes the example on board, then turns to explain
    setTimeout(() => {
      setIsAvatarWriting(false)
      setAvatarTeachingMode('pointing')
      
      setTimeout(() => {
        setAvatarTeachingMode('explaining')
        speakText(example.text)
      }, 800)
    }, 2000)

    setTimeout(() => {
      givePracticeQuestion(topic)
    }, 8000)
  }

  const getWorkedExample = (topic: Topic): { text: string; board: string } => {
    const examples: Record<string, { text: string; board: string }> = {
      'Linear Equations': {
        text: `Let's solve: **3x + 7 = 22**\n\nStep 1: Subtract 7 from both sides\n3x = 22 - 7\n3x = 15\n\nStep 2: Divide both sides by 3\nx = 15 ÷ 3\nx = 5\n\nCheck: 3(5) + 7 = 15 + 7 = 22 `,
        board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n WORKED EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSolve: 3x + 7 = 22\n\nStep 1: -7\n3x = 15\n\nStep 2: ÷3\nx = 5\n\n Check: 3(5)+7=22`,
      },
      'Pythagoras Theorem': {
        text: `Find the hypotenuse when a=6 and b=8:\n\nc² = 6² + 8²\nc² = 36 + 64\nc² = 100\nc = √100\nc = 10\n\nSo the hypotenuse is 10 units!`,
        board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n WORKED EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\na=6, b=8, find c\n\nc² = 36+64\nc² = 100\nc = 10 `,
      },
    }

    return examples[topic.name] || {
      text: `Here's a worked example...\n\nStep 1: Read the question\nStep 2: Apply the method\nStep 3: Calculate\nStep 4: Check your answer`,
      board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n EXAMPLE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nStep-by-step solution...`,
    }
  }

  const givePracticeQuestion = (topic: Topic) => {
    setCurrentStep(4)
    setTeachingMode('questioning')
    setAvatarTeachingMode('writing')
    setIsAvatarWriting(true)

    const practice = getPracticeQuestion(topic)
    const practiceMessage: Message = {
      id: `practice_${Date.now()}`,
      sender: 'teacher',
      text: `Now it's **your turn**! \n\n${practice.question}\n\nTake your time and show your working. You've got this! `,
      type: 'text',
    }

    setChat(prev => [...prev, practiceMessage])
    setBoardText(practice.board)
    
    // Avatar writes question on board, then faces student
    setTimeout(() => {
      setIsAvatarWriting(false)
      setAvatarTeachingMode('explaining')
      speakText(practice.question)
    }, 1500)
  }

  const getPracticeQuestion = (topic: Topic): { question: string; board: string } => {
    const questions: Record<string, { question: string; board: string }> = {
      'Linear Equations': {
        question: `Solve: **2x + 5 = 17**\n\nShow your working step by step!\n\nHint: What do you do first?`,
        board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n YOUR TURN!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSolve: 2x + 5 = 17\n\n\nWorking:\n\n\n\nAnswer: x = ?`,
      },
      'Pythagoras Theorem': {
        question: `Find the hypotenuse when a=5 and b=12\n\nShow all your working!\n\nHint: Use c² = a² + b²`,
        board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n YOUR TURN!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\na=5, b=12, find c\n\n\nWorking:\n\n\n\nAnswer: c = ?`,
      },
    }

    return questions[topic.name] || {
      question: `Try this practice question...\n\nShow your working!`,
      board: `${type.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n PRACTICE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nYour question here...`,
    }
  }

  /**
   * Detect if student message is a question
   */
  const isStudentQuestion = (message: string): boolean => {
    const lowerMsg = message.toLowerCase();
    
    // Question words
    const questionWords = [
      'what', 'why', 'how', 'when', 'where', 'who', 'which', 'whose', 'whom',
      'can you', 'could you', 'will you', 'would you', 'do you', 'does this',
      'explain', 'tell me', 'show me', 'help me',
      '?', 'kya', 'kaise', 'kyun', 'kab', 'kahan', 'kaun' // Hindi/Urdu question words
    ];
    
    // Check if message contains question indicators
    const hasQuestionWord = questionWords.some(word => lowerMsg.includes(word));
    const hasQuestionMark = lowerMsg.includes('?');
    const isShort = message.length < 150; // Questions are usually short
    
    return (hasQuestionWord || hasQuestionMark) && isShort;
  };

  /**
   * Handle student question - Direct teacher conversation
   * Student asks question → Avatar teacher speaks answer
   * Uses UK Teacher Persona for supportive, step-by-step teaching
   */
  const handleStudentQuestionDirect = async (question: string) => {
    console.log('[STUDENT QUESTION] Received:', question);
    setIsLoading(true);
    setTeachingMode('questioning');

    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      // Add student question to chat
      const studentMessage: Message = {
        id: `student_question_${Date.now()}`,
        sender: 'student',
        text: question,
        type: 'text',
      };
      setChat(prev => [...prev, studentMessage]);

      // Get topic content from Qdrant for context
      const topicContent = await ragService.getTopicContent(
        subject,
        selectedQdrantTopic || lessonTopic,
        selectedYear || `Year ${selectedClass}`
      );

      const contextChunks = topicContent.documents?.flatMap((d: any) => d.chunks || []) || [];
      const context = contextChunks.slice(0, 3).map((c: any) => c.content).join('\n\n');

      // Build teacher response using UK Teacher Persona
      // Follow the 6-step teaching structure from training document
      const teacherPrompt = `You are a friendly, patient UK school teacher sitting next to the student (Year ${selectedClass || '7-9'}).

CURRICULUM CONTENT (use this as your teaching material):
${context || 'No specific curriculum content available - use your general teaching knowledge.'}

STUDENT QUESTION: "${question}"

FOLLOW THIS EXACT TEACHING STRUCTURE:

STEP 1 - ACKNOWLEDGE (1 sentence):
Start with: "Good question!" or "That's excellent thinking!" or "I'm glad you asked that!"

STEP 2 - EXPLAIN SIMPLY (2-3 sentences):
Explain the core idea in simple, everyday language. No jargon!

STEP 3 - REAL-LIFE ANALOGY (2-3 sentences):
"Think of it like..." or "Imagine..." - use UK student life examples (£, school, sports, food)

STEP 4 - WORKED EXAMPLE (3-5 steps):
Show ONE clear example with step-by-step working. Explain WHY for each step.
Use format:
"Let me show you an example...
Step 1: ...
Step 2: ...
Step 3: ...
Notice how..."

STEP 5 - PRACTICE QUESTION:
"Now you try this one..." or "Have a go at this..."
Give a similar question with a hint.

STEP 6 - ENCOURAGEMENT:
"Take your time. I'm here to help." or "You've got this!"

IMPORTANT RULES:
✓ Use UK spelling (colour, centre, maths, organise)
✓ Use £ for money, not $ or €
✓ Sound like a REAL CLASSROOM TEACHER, not a chatbot
✓ NEVER say "As an AI..." or "I'm an AI..."
✓ Use short paragraphs, clear formatting
✓ Be warm, patient, and supportive
✓ Guide the student, don't just dump answers
✓ Check understanding: "Does that make sense?"

Respond as if speaking aloud to the student.`;

      // Call OpenRouter API with UK Teacher Persona
      console.log('[OPENROUTER] Getting teacher persona response...');

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct',
          messages: [
            { 
              role: 'system', 
              content: `You are a friendly, patient, and supportive UK school teacher.
              
YOUR CORE IDENTITY:
✓ You are a REAL CLASSROOM TEACHER, not a chatbot or AI assistant
✓ You explain concepts clearly and step-by-step
✓ You encourage curiosity and critical thinking
✓ You use simple, age-appropriate explanations
✓ You guide students instead of immediately giving answers
✓ You use examples, analogies, and short exercises
✓ You maintain a warm and respectful tone
✓ You NEVER sound robotic or overly technical

YOUR TONE:
• Friendly - like a supportive teacher sitting next to them
• Encouraging - celebrate effort and small wins
• Patient - never rush, never make them feel stupid
• Clear - short sentences, simple language, no jargon
• Supportive - "I'm here with you", "Take your time"

NEVER USE:
✗ Robotic tone ("I am an AI...", "As a language model...")
✗ AI-style disclaimers
✗ Long walls of text - break it up
✗ "Obviously" or "Clearly"
✗ Making the student feel stupid

UK CONTEXT:
• Use UK spelling: colour, centre, maths, organise, recognise
• Use £ for money examples, not $ or €
• Reference school years (Year 7, Year 8, etc.) not grades`
            },
            { role: 'user', content: teacherPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const openRouterData = await openRouterResponse.json();
      const teacherAnswer = openRouterData.choices?.[0]?.message?.content || "That's a great question! Let me explain this step-by-step...";

      console.log('[OPENROUTER] Response received');

      // Display on board with teacher persona formatting
      const boardContent = `❓ Your Question: ${question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Teacher's Explanation:

${teacherAnswer}

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Does that make sense? Try the practice question, or ask me if you need clarification!`;

      setBoardText(boardContent);

      // Add teacher response to chat
      const teacherMessage: Message = {
        id: `teacher_answer_${Date.now()}`,
        sender: 'teacher',
        text: teacherAnswer,
        type: 'text',
      };
      setChat(prev => [...prev, teacherMessage]);

      // AVATAR TEACHER SPEAKS THE ANSWER
      console.log('[AVATAR] Teacher speaking answer...');
      setAvatarTeachingMode('explaining');
      await speakText(teacherAnswer);

    } catch (error) {
      console.error('[STUDENT QUESTION] Error:', error);

      // Fallback response with teacher persona
      const fallbackAnswer = "That's a really good question! I'm here to help you understand this. Let me explain what I know, and then we can work through it together. Can you tell me a bit more about what specifically you're wondering about?";

      const fallbackMessage: Message = {
        id: `teacher_fallback_${Date.now()}`,
        sender: 'teacher',
        text: fallbackAnswer,
        type: 'text',
      };
      setChat(prev => [...prev, fallbackMessage]);
      setBoardText(`❓ Your Question: ${question}

━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 Teacher's Response:

${fallbackAnswer}

💡 Let's explore this together! I'm here with you.`);

      setAvatarTeachingMode('explaining');
      await speakText(fallbackAnswer);
    } finally {
      setIsLoading(false);
      setTeachingMode('explaining');
    }
  };

  const handleSend = async () => {
    console.log('handleSend called, question:', question, 'user:', user);
    if (!question || !question.trim()) {
      console.log('No question to send');
      return;
    }
    if (!user) {
      console.log('No user logged in');
      return;
    }

    const userMessage = question;
    setChat(prev => [...prev, { id: `user_${Date.now()}`, sender: 'student', text: userMessage, type: 'text' }]);
    setQuestion(''); // Clear question immediately after adding to chat
    setIsLoading(true);
    setTeachingMode('questioning');
    console.log('Message sent:', userMessage);

    const lowerMsg = userMessage.toLowerCase();

    // ============================================
    // SMART Teaching Flow - Handle different states
    // ============================================
    if (smartTeachingActive) {
      // If diagnostic quiz is showing, student answers via chat
      if (showDiagnosticQuiz && diagnosticQuestions.length > 0) {
        // Store answer in diagnosticAnswers state
        const currentQuestion = diagnosticQuestions.find(
          q => !diagnosticAnswers[q.id] || diagnosticAnswers[q.id] === ''
        );
        
        if (currentQuestion) {
          setDiagnosticAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: userMessage,
          }));
          
          console.log('[SMART TEACHING] Stored answer for:', currentQuestion.id);
          
          // Check if all questions answered
          const allAnswered = diagnosticQuestions.every(
            q => diagnosticAnswers[q.id] && diagnosticAnswers[q.id].trim() !== ''
          );
          
          if (allAnswered) {
            const confirmMessage: Message = {
              id: 'confirm_submit',
              sender: 'teacher',
              text: 'Great! You\'ve answered all questions. Type "submit" to check your answers!',
              type: 'text',
            };
            setChat(prev => [...prev, confirmMessage]);
            speakText(confirmMessage.text);
          } else {
            const nextQuestion = diagnosticQuestions.find(
              q => !diagnosticAnswers[q.id] || diagnosticAnswers[q.id] === ''
            );
            
            if (nextQuestion) {
              const promptMessage: Message = {
                id: 'prompt_next',
                sender: 'teacher',
                text: `Good! Now answer question ${diagnosticQuestions.indexOf(nextQuestion) + 1}: ${nextQuestion.question}`,
                type: 'text',
              };
              setChat(prev => [...prev, promptMessage]);
              speakText(promptMessage.text);
            }
          }
        }
        
        setIsLoading(false);
        return;
      }

      // If student types "submit" during diagnostic quiz
      if (showDiagnosticQuiz && lowerMsg.includes('submit')) {
        await submitDiagnosticAnswers();
        setIsLoading(false);
        return;
      }

      // If mastery check is showing, handle it separately
      if (showMasteryCheck) {
        setIsLoading(false);
        return;
      }

      // STEP-BY-STEP TEACHING: Check if student is submitting practice answer
      if (currentTeachingStep === 3 && currentPracticeQuestion) {
        console.log('[STEP TEACHING] Student submitting practice answer...');
        await evaluateStudentAnswerStepByStep(userMessage);
        setIsLoading(false);
        return;
      }

      // ENHANCED TEACHING: Check if student is submitting practice answer
      if (teachingPhase === 'practice' && enhancedPracticeQuestion) {
        console.log('[ENHANCED TEACHING] Student submitting practice answer...');
        await evaluateStudentAnswer(userMessage);
        setIsLoading(false);
        return;
      }

      // Check if student is submitting an attempt (Step 4: Practice)
      if (currentStep === 4 && teachingMode === 'practicing') {
        setCurrentAnswer(userMessage);
        await submitStudentAttempt();
        setIsLoading(false);
        return;
      }

      // Handle navigation commands during SMART teaching
      if (lowerMsg.includes('show example') || lowerMsg.includes('worked example')) {
        await getWorkedExampleSmart();
        setIsLoading(false);
        return;
      }

      if (lowerMsg.includes('next') && currentStep === 2 && teachingMode === 'explaining') {
        await getWorkedExampleSmart();
        setIsLoading(false);
        return;
      }
      
      // Handle "ready" for diagnostic micro-check
      if (currentStep === 2 && teachingMode === 'explaining' && !showDiagnosticQuiz &&
          (lowerMsg.includes('ready') || lowerMsg.includes('yes') || lowerMsg.includes('sure'))) {
        // Start diagnostic micro-check
        console.log('[SMART TEACHING] Starting diagnostic micro-check...');
        await startDiagnosticMicroCheck();
        setIsLoading(false);
        return;
      }
    }

    // ============================================
    // Regular teaching flow (fallback)
    // ============================================
    if (selectedTopic && (
      lowerMsg.includes('got it') ||
      lowerMsg.includes('understand') ||
      lowerMsg.includes('ready') ||
      lowerMsg.includes('next') ||
      lowerMsg.includes('continue') ||
      lowerMsg.includes('okay') ||
      lowerMsg.includes('ok')
    ) && currentStep === 2 && teachingMode === 'explaining' && !smartTeachingActive) {
      moveToNextSection(selectedTopic);
      setIsLoading(false);
      return;
    }

    if (lowerMsg.includes("don't understand") || lowerMsg.includes("confused") || lowerMsg.includes("don't get it")) {
      setStudentUnderstanding('confused');
      handleConfusedResponse();
    } else if (lowerMsg.includes("got it") || lowerMsg.includes("makes sense")) {
      setStudentUnderstanding('confident');
      handleConfidentResponse();
    } else if (isStudentQuestion(userMessage)) {
      // DETECT if student is asking a question → Teacher speaks answer
      console.log('[STUDENT QUESTION] Detected question:', userMessage);
      await handleStudentQuestionDirect(userMessage);
      return;
    } else {
      await sendToAI(userMessage);
    }

    setIsLoading(false);
  }

  const handleConfusedResponse = () => {
    const reExplanation = `I understand this might be confusing! Let me explain it **differently**...\n\n${getAlternativeExplanation()}\n\nDoes this make more sense? Feel free to ask if you need more help! `

    const newMessage: Message = {
      id: `reexplain_${Date.now()}`,
      sender: 'teacher',
      text: reExplanation,
      type: 'text',
    }

    setChat(prev => [...prev, newMessage])
    setBoardText(prev => prev + '\n\n' + getAlternativeExplanation())
    
    // Avatar shows empathetic explaining mode
    setAvatarTeachingMode('explaining')
    speakText(reExplanation)
  }

  const getAlternativeExplanation = (): string => {
    const alternatives: Record<string, string> = {
      'Linear Equations': `**Think of it like a puzzle!**\n\nImagine you have a mystery number (x).\n\nThe equation tells you:\n"Double the mystery number, then add 5, and you get 17"\n\nTo find x, we UNDO each step:\n1. Undo "+5" by subtracting 5\n2. Undo "×2" by dividing by 2\n\nThat's it! `,
      'Pythagoras Theorem': `**Visual way to think about it:**\n\nImagine squares on each side of the triangle!\n\nThe two smaller squares (on sides a and b)...\nWhen you add their areas together...\nThey equal the big square (on side c)!\n\nThat's why: a² + b² = c²`,
    }

    return alternatives[lessonTopic] || `Let me try a different approach...\n\nSometimes a concept needs to be explained multiple ways.\n\nThink about it like this:\n- Break it into smaller steps\n- Use a real-world example\n- Draw a diagram if it helps`
  }

  const handleConfidentResponse = () => {
    const encouragement = `Excellent!  I can see you really understand this!\n\nReady for a challenge question? Or shall we move to the mastery check?`

    const newMessage: Message = {
      id: `encourage_${Date.now()}`,
      sender: 'teacher',
      text: encouragement,
      type: 'text',
    }

    setChat(prev => [...prev, newMessage])

    // Avatar shows enthusiastic explaining mode
    setAvatarTeachingMode('explaining')
    speakText(encouragement)
  }

  /**
   * Start Diagnostic Micro-Check (1-3 questions)
   * Uses backend SMART teaching service
   */
  const startDiagnosticMicroCheck = async () => {
    console.log('[SMART TEACHING] Starting diagnostic micro-check...');

    try {
      setCurrentStep(3);
      setTeachingMode('questioning');
      setShowDiagnosticQuiz(true);

      // Get topic content from Qdrant for context
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[type] || 'Maths';

      const topicContent = await ragService.getTopicContent(
        subject,
        selectedQdrantTopic || lessonTopic,
        selectedYear || `Year ${selectedClass}`
      );

      // Generate 1-3 diagnostic questions using backend service
      const questions = await smartAiTeacherService.generateDiagnosticQuestions(
        selectedQdrantTopic || lessonTopic,
        type as 'maths' | 'science' | 'homework',
        selectedYear || `Year ${selectedClass}`
      );

      console.log('[SMART TEACHING] Generated', questions.length, 'diagnostic questions');
      setDiagnosticQuestions(questions);

      // Display questions on board
      const boardContent = `${type.toUpperCase()} • ${selectedYear}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📝 DIAGNOSTIC CHECK\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAnswer these ${questions.length} questions to show your understanding:\n\n${questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Step 3: Diagnostic Micro-Check\n\n⏭️ Next: Your Answers\n\nType your answers in the chat below!`;

      setBoardText(boardContent);

      // Teacher speaks introduction
      const introMessage: Message = {
        id: 'diagnostic_intro',
        sender: 'teacher',
        text: `Great! Let's check your understanding with ${questions.length} quick questions.\n\n${questions.map((q: any, i: number) => `${i + 1}. ${q.question}`).join('\n\n')}\n\nType your answers below. Take your time!`,
        type: 'text',
      };

      setChat(prev => [...prev, introMessage]);
      await speakText(introMessage.text);

    } catch (error) {
      console.error('[SMART TEACHING] Error starting diagnostic:', error);
      // Fallback
      const fallbackQuestions = [
        { id: 'q1', question: `What is the main idea of ${selectedQdrantTopic || lessonTopic}?`, correct_answer: '' }
      ];
      setDiagnosticQuestions(fallbackQuestions);
      setShowDiagnosticQuiz(true);
    }
  }

  const sendToAI = async (message: string) => {
    console.log('sendToAI called with:', message);
    console.log('[REAL TEACHER FLOW] Current step:', currentStep, 'teachingMode:', teachingMode);

    // ==========================================
    // Handle student questions during teaching (Step 2)
    // ==========================================
    if (currentStep === 2 && teachingMode === 'explaining' && !smartTeachingActive) {
      // Student is asking questions about the topic
      console.log('[REAL TEACHER FLOW] Answering student question with OpenRouter + Qdrant...');
      
      try {
        // Get topic content from Qdrant
        const subjectMap: Record<string, string> = {
          'maths': 'Maths',
          'science': 'Biology',
          'homework': 'English',
        }
        const subject = subjectMap[type] || 'Maths'
        
        const topicContent = await ragService.getTopicContent(
          subject,
          selectedQdrantTopic || lessonTopic,
          selectedYear || `Year ${selectedClass}`
        );
        
        // Generate answer using OpenRouter
        const answerPrompt = `You are ${currentTutor.name}, a professional teacher.
A student asks this question about ${selectedQdrantTopic || lessonTopic}:

STUDENT QUESTION: ${message}

TEXTBOOK CONTENT:
${topicContent.documents?.flatMap((d: any) => d.chunks || []).map((c: any) => c.content).join('\n\n') || 'No content available'}

Answer the student's question:
- Use simple, encouraging language
- Reference the textbook content
- If you don't know, say "That's a great question! Let me check..."
- Keep it conversational`;

        const answerResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct',
            messages: [
              { role: 'system', content: 'You are a friendly, professional school teacher.' },
              { role: 'user', content: answerPrompt }
            ],
            max_tokens: 400,
            temperature: 0.7,
          }),
        });

        const answerData = await answerResponse.json();
        const answer = answerData.choices?.[0]?.message?.content || '';
        
        const answerMessage: Message = {
          id: `answer_${Date.now()}`,
          sender: 'teacher',
          text: answer,
          type: 'text',
        }
        
        setChat(prev => [...prev, answerMessage])
        speakText(answerMessage.text)
        
        // After answering, ask if ready for micro-check
        setTimeout(() => {
          const readyCheck = `Great question! 😊 **Are you ready for a quick check** to see if you understand ${selectedQdrantTopic || lessonTopic}? Just type "ready" when you're set!`;
          const readyMessage: Message = {
            id: `ready_check_${Date.now()}`,
            sender: 'teacher',
            text: readyCheck,
            type: 'text',
          }
          setChat(prev => [...prev, readyMessage])
          speakText(readyCheck)
        }, 2000);
        
        return;
        
      } catch (error) {
        console.error('[REAL TEACHER FLOW] Error answering question:', error);
      }
    }

    // ==========================================
    // Handle "ready" for diagnostic micro-check
    // ==========================================
    if (currentStep === 2 && teachingMode === 'explaining' && 
        (message.toLowerCase().includes('ready') || message.toLowerCase().includes('yes') || message.toLowerCase().includes('sure'))) {
      console.log('[REAL TEACHER FLOW] Starting diagnostic micro-check...');
      await startDiagnosticMicroCheck();
      return;
    }

    // ==========================================
    // TOPIC VALIDATION - Check if asking about wrong topic
    // ==========================================
    if (selectedQdrantTopic && availableTopics.length > 0) {
      // Check if message is asking about a different topic
      const messageLower = message.toLowerCase()
      const currentTopicLower = selectedQdrantTopic.toLowerCase()

      // Extract topic keywords from message
      const topicKeywords = ['algebra', 'geometry', 'photosynthesis', 'cells', 'equations', 'fractions', 'percentages']
      const mentionedTopics = topicKeywords.filter(keyword => messageLower.includes(keyword))

      // If user mentions a topic that's not in their year's curriculum
      if (mentionedTopics.length > 0 && !mentionedTopics.some(t => currentTopicLower.includes(t))) {
        const validationResponse: Message = {
          id: `validation_${Date.now()}`,
          sender: 'teacher',
          text: `I notice you're asking about **${mentionedTopics[0]}**, but that topic is not mentioned in your course curriculum for ${selectedYear}.\n\nPlease select the right topic from the available curriculum list, or I can help you with **${selectedQdrantTopic}** instead.\n\nWould you like to:\n1. Continue with ${selectedQdrantTopic}\n2. Go back and select a different topic`,
          type: 'text',
        }
        setChat(prev => [...prev, validationResponse])
        speakText(validationResponse.text)
        return
      }
    }

    // ==========================================
    // LAYER 4: SAFETY LAYER - Safeguarding Check FIRST
    // ==========================================
    const safeguardingCheck = checkSafeguarding(message)
    if (safeguardingCheck && safeguardingCheck.detected) {
      setSafeguardingAlert({
        detected: true,
        type: safeguardingCheck.type,
        severity: safeguardingCheck.severity,
        response: safeguardingCheck.response,
        trustedAdultPrompt: safeguardingCheck.trustedAdultPrompt
      })

      const tutorResponse: Message = {
        id: `safeguarding_${Date.now()}`,
        sender: 'teacher',
        text: `${safeguardingCheck.response}\n\n${safeguardingCheck.trustedAdultPrompt}`,
        type: 'text',
      }

      setChat(prev => [...prev, tutorResponse])
      speakText(safeguardingCheck.response)
      
      if (safeguardingCheck.escalate) {
        console.warn('🚨 SAFEGUARDING ALERT: Immediate escalation required')
        // TODO: Log to backend safeguarding table
      }
      return
    }

    // ==========================================
    // LAYER 4: SAFETY LAYER - Exam Integrity Check
    // ==========================================
    const integrityCheck = checkExamIntegrity(message)
    if (integrityCheck && integrityCheck.detected) {
      setExamIntegrityViolation({
        detected: true,
        type: integrityCheck.type,
        response: integrityCheck.response
      })

      const tutorResponse: Message = {
        id: `integrity_${Date.now()}`,
        sender: 'teacher',
        text: `${integrityCheck.response}\n\n${integrityCheck.hint}`,
        type: 'text',
      }

      setChat(prev => [...prev, tutorResponse])
      speakText(integrityCheck.response)
      
      // Log violation
      console.warn('📝 Exam integrity violation:', integrityCheck.type)
      return
    }

    // ==========================================
    // CURRICULUM LOCK CHECK - Only answer about selected topic
    // ==========================================
    const isAboutCurrentTopic = selectedQdrantTopic && (
      message.toLowerCase().includes(selectedQdrantTopic.toLowerCase()) ||
      message.toLowerCase().includes('this') ||
      message.toLowerCase().includes('current') ||
      message.toLowerCase().includes('present') ||
      message.toLowerCase().includes('slide') ||
      message.toLowerCase().includes('topic') ||
      message.toLowerCase().includes('what') ||
      message.toLowerCase().includes('how') ||
      message.toLowerCase().includes('why') ||
      message.toLowerCase().includes('explain') ||
      message.toLowerCase().includes('tell me')
    )
    
    // If no topic selected or question is not about current topic
    if (!selectedQdrantTopic || !isAboutCurrentTopic) {
      const offTopicResponse = `I understand you're asking about "${message}", but we're currently studying **${selectedQdrantTopic}**.

Let's focus on our current lesson first! Once we complete this topic, you can ask me about other subjects.

Do you have any questions about **${selectedQdrantTopic}**?`

      const tutorResponse: Message = {
        id: `offtopic_${Date.now()}`,
        sender: 'teacher',
        text: offTopicResponse,
        type: 'text',
      }

      setChat(prev => [...prev, tutorResponse])
      speakText(offTopicResponse)
      return // STOP - Don't call RAG API
    }
    // ==========================================
    // END CURRICULUM LOCK CHECK
    // ==========================================
    
    try {
      // Determine subject and key stage based on tutor type and selection
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      }
      const subject = subjectMap[type] || 'Maths'
      const keyStage = selectedYear || `KS${selectedClass}`

      // Use RAG API for document-based responses (OpenRouter)
      const response = await fetch('http://localhost:5000/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          student_id: user!.id,
          subject: subject,
          key_stage: keyStage,
          topic: selectedQdrantTopic,
          restrict_to_topic: true, // STRICT: Only answer about this topic
          conversation_history: chat.slice(-5).map(msg => ({
            role: msg.sender === 'student' ? 'student' : 'tutor',
            content: msg.text,
          })),
        }),
      })

      console.log('RAG response status:', response.status)
      console.log('RAG query:', { question: message, subject, key_stage: keyStage, topic: selectedQdrantTopic })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      console.log('RAG response data:', result)

      // Build structured response from RAG
      let tutorText = '';

      if (result.data && result.data.structured_response) {
        const sr = result.data.structured_response;

        // Check if retrieval found relevant content
        if (result.data.confidence < 0.5 || result.data.flags?.includes('NO_RETRIEVAL') || result.data.flags?.includes('LOW_CONFIDENCE')) {
          // RAG didn't find relevant content - show specific message
          console.log('RAG retrieval failed - no relevant documents found')
          tutorText = `I couldn't find specific information about "${message}" in our study materials.

This might be because:
1. This topic isn't covered in your uploaded documents yet
2. The question uses different words than your documents

Let me explain what I know about **${selectedQdrantTopic}** instead...

${getTopicSpecificHelp(message)}`;
        } else {
          // RAG found good content - use it
          tutorText = `**${sr.introduction}**\n\n${sr.explanation}\n\n${sr.examples ? `**Examples:**\n${sr.examples}\n\n` : ''}${sr.summary ? `**Summary:**\n${sr.summary}` : ''}`;

          // Add sources if available
          if (result.data.sources && result.data.sources.length > 0) {
            tutorText += `\n\n📚 **Sources:** ${result.data.sources.join(', ')}`;
          }
        }
      } else if (result.data && result.data.answer) {
        tutorText = result.data.answer;
      } else {
        tutorText = `Great question! Let me help you with that.\n\n${getTopicSpecificHelp(message)}`;
      }

      const tutorResponse: Message = {
        id: `tutor_${Date.now()}`,
        sender: 'teacher',
        text: tutorText,
        type: 'text',
      }

      setChat(prev => [...prev, tutorResponse])
      speakText(tutorText)

    } catch (error) {
      console.error('RAG chat error:', error)
      // Fallback to regular tutor chat
      try {
        const response = await fetch('http://localhost:5000/api/tutor/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            student_id: user!.id,
            tutor_type: type,
            message: message,
            topic_id: selectedTopic?.id,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const tutorResponse: Message = {
            id: `tutor_${Date.now()}`,
            sender: 'teacher',
            text: result.data.message,
            type: 'text',
          }
          setChat(prev => [...prev, tutorResponse])
          speakText(result.data.message)
          return
        }
      } catch (fallbackError) {
        console.error('Fallback chat error:', fallbackError)
      }

      // Ultimate fallback
      const fallbackResponse: Message = {
        id: `fallback_${Date.now()}`,
        sender: 'teacher',
        text: `Great question! Let me help you with that.\n\n${getTopicSpecificHelp(message)}`,
        type: 'text',
      }
      setChat(prev => [...prev, fallbackResponse])
      speakText(fallbackResponse.text)
    }
  }

  const getTopicSpecificHelp = (question: string): string => {
    return `Think about the key concepts we've covered...\n\n1. What information do you have?\n2. What are you trying to find?\n3. Which method should you use?\n\nShow me your working and I'll give you feedback!`
  }

  // Speech-to-Text for student voice input
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    setIsListening(true)

    recognition.onstart = () => {
      console.log(' Listening...')
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('')

      setQuestion(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
      console.log(' Stopped listening')
    }

    recognition.onerror = (event: any) => {
      console.error(' Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.start()

    // Store recognition instance to stop it later if needed
    ;(window as any).currentRecognition = recognition
  }

  const stopListening = () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop()
      setIsListening(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const fileMessage: Message = {
        id: `file_${Date.now()}`,
        sender: 'student',
        text: ` Attached: ${file.name}`,
        type: 'file',
        fileName: file.name,
      }
      setChat(prev => [...prev, fileMessage])
      
      setTimeout(() => {
        const response: Message = {
          id: `file_response_${Date.now()}`,
          sender: 'teacher',
          text: `Thanks for sharing **${file.name}**! \n\nI can see you've uploaded a file. Let me help you with it!\n\nWhat specific question or part would you like me to explain?`,
          type: 'text',
        }
        setChat(prev => [...prev, response])
        speakText(response.text)
      }, 1000)
    }
  }

  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      const voiceMessage: Message = {
        id: `voice_${Date.now()}`,
        sender: 'student',
        text: ' Voice message',
        type: 'voice',
        voiceDuration: '0:15',
      }
      setChat(prev => [...prev, voiceMessage])
      
      setTimeout(() => {
        const response: Message = {
          id: `voice_response_${Date.now()}`,
          sender: 'teacher',
          text: `I heard your voice message! \n\nThat's a great question. Let me help you with that...`,
          type: 'text',
        }
        setChat(prev => [...prev, response])
        speakText(response.text)
      }, 1000)
    } else {
      setIsRecording(true)
    }
  }

  const handleStepClick = (stepNumber: number) => {
    setCurrentStep(stepNumber)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col">
      {/* SAFEGUARDING BANNER - Layer 4: Safety Layer */}
      {safeguardingAlert?.detected && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-4 ${
          safeguardingAlert.severity === 'critical' 
            ? 'bg-red-600' 
            : safeguardingAlert.severity === 'high'
            ? 'bg-orange-600'
            : 'bg-yellow-600'
        } text-white shadow-lg`}>
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h3 className="font-bold text-lg">Important Message</h3>
                <p className="mt-1">{safeguardingAlert.response}</p>
                <p className="mt-2 text-sm font-semibold bg-white/20 px-3 py-2 rounded inline-block">
                  👥 {safeguardingAlert.trustedAdultPrompt}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSafeguardingAlert(null)}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* EXAM INTEGRITY BANNER - Layer 4: Safety Layer */}
      {examIntegrityViolation?.detected && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-purple-600 text-white shadow-lg">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📝</div>
              <div>
                <h3 className="font-bold text-lg">Learning Integrity</h3>
                <p className="mt-1">{examIntegrityViolation.response}</p>
              </div>
            </div>
            <button
              onClick={() => setExamIntegrityViolation(null)}
              className="text-white/80 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${currentTutor.gradient} px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-5xl">{currentTutor.name}</div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">Welcome to {currentTutor.name}'s Class!</h1>
                  <p className="text-white/90 mt-1 text-sm sm:text-base">Select your year group and topic to begin</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              {/* Year Group Selection - Inside Modal */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Select Your Year Group
                </h2>
                
                {curriculumLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading year groups...</p>
                  </div>
                ) : availableYears.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year)
                          // Don't close modal yet - wait for topic selection
                          // setShowClassModal(false)
                        }}
                        className={`py-4 rounded-xl font-bold text-lg transition-all ${
                          selectedYear === year
                            ? `bg-gradient-to-r ${currentTutor.gradient} text-white shadow-xl scale-105`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No year groups available</p>
                    <p className="text-sm mt-2">Make sure backend is running</p>
                  </div>
                )}
              </div>

              {/* Topic Selection - Shows after year selected */}
              {selectedYear && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Select Your Topic
                  </h2>
                  
                  {/* Type to Search Option */}
                  {/* <div className="mb-6"> */}
                    {/* <div className="relative">
                      <input
                        type="text"
                        placeholder="Type topic name to search (e.g., Algebra, Photosynthesis)..."
                        value={selectedQdrantTopic}
                        onChange={(e) => {
                          setSelectedQdrantTopic(e.target.value)
                          setTopicError(null)
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                      /> */}
                      {/* <button
                        onClick={() => {
                          if (selectedQdrantTopic.trim()) {
                            const subjectMap: Record<string, string> = {
                              'maths': 'Maths',
                              'science': 'Biology',
                              'homework': 'English',
                            }
                            const subject = subjectMap[type] || 'Maths'
                            loadTopicContent(selectedQdrantTopic.trim(), subject, selectedYear)
                            setShowClassModal(false)
                          }
                        }}
                        className="absolute right-2 top-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        Load Topic →
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Type a topic name and click "Load Topic", or select from the list below
                    </p> */}
                  {/* </div> */}
                  
                  {topicsLoading ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Loading topics for {selectedYear}...</p>
                      <p className="text-sm text-gray-500 mt-2">Fetching from Qdrant database</p>
                    </div>
                  ) : topicError ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl border-2 border-red-200">
                      <div className="text-5xl mb-4">⚠️</div>
                      <p className="text-red-800 font-bold text-lg">Curriculum Not Available</p>
                      <p className="text-red-600 mt-2 max-w-md mx-auto">{topicError}</p>
                      <div className="mt-6 flex gap-3 justify-center">
                        <button
                          onClick={() => loadTopics(type, selectedYear)}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                        >
                          🔄 Retry
                        </button>
                        <button
                          onClick={() => {
                            setSelectedYear('')
                            setAvailableTopics([])
                          }}
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                        >
                          ← Change Year
                        </button>
                      </div>
                    </div>
                  ) : availableTopics.length > 0 ? (
                    <div>
                      <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        Available Topics for {selectedYear}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
                        {availableTopics.map((topicItem, idx) => (
                          <button
                            key={idx}
                            onClick={async () => {
                              setSelectedQdrantTopic(topicItem.topic)
                              setTopicError(null)
                              setLessonTopic(topicItem.topic)
                              setLessonDescription(topicItem.topic)

                              const subjectMap: Record<string, string> = {
                                'maths': 'Maths',
                                'science': 'Biology',
                                'homework': 'English',
                              }
                              const subject = subjectMap[type] || 'Maths'

                              // Load and display FULL PDF content immediately
                              console.log('[TOPIC SELECT] Loading content for:', topicItem.topic);
                              const loadedContent = await loadTopicContent(topicItem.topic, subject, selectedYear)
                              console.log('[TOPIC SELECT] Content loaded! Length:', loadedContent.length);

                              // Close modal first
                              setShowClassModal(false)

                              // Wait 2 seconds for content to fully load, then start SMART teaching
                              // Pass the loaded content directly to ensure it's available
                              setTimeout(() => {
                                console.log('[TOPIC SELECT] Starting SMART teaching flow...');
                                console.log('[TOPIC SELECT] boardText state:', boardText?.length || 0);
                                console.log('[TOPIC SELECT] loadedContent:', loadedContent.length);
                                initializeSmartTeaching(topicItem.topic)
                              }, 2000)
                            }}
                            className={`p-4 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                              selectedQdrantTopic === topicItem.topic
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <h3 className="font-bold text-base text-gray-800 group-hover:text-blue-600">
                              {topicItem.topic}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              📚 {topicItem.source_file}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Done Button - Shows after topic selected */}
              {selectedQdrantTopic && (
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600 mb-3">
                    ✓ Topic selected! Starting lesson...
                  </p>
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}

              {/* Current Topic Display */}
              {selectedQdrantTopic && (
                <div className="mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📚 Current Topic</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Selected Topic</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{selectedQdrantTopic}</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {type} • {selectedYear}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl mb-2">📖</div>
                        <p className="text-xs text-gray-500">
                          {availableTopics.find(t => t.topic === selectedQdrantTopic)?.chunk_count || 0} chunks available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all font-semibold text-gray-700 text-xs sm:text-sm shadow-sm">
                <span>←</span>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl ${currentTutor.bgColor} border-2 border-${currentTutor.color.split('-')[1]}-200`}>
                <span className="text-2xl sm:text-3xl">{currentTutor.name}</span>
                <div className="hidden xs:block">
                  <h1 className={`text-sm sm:text-lg font-bold ${currentTutor.color}`}>{currentTutor.name}</h1>
                  <p className="text-xs text-gray-500 hidden md:block">Professional AI Tutor</p>
                </div>
              </div>

              {lessonTopic && (
                <div className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
                  <span className="text-base sm:text-lg"></span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 truncate max-w-[200px]">{lessonTopic}</span>
                </div>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* <div className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r ${currentTutor.gradient} text-white shadow-lg flex items-center gap-2 sm:gap-3`}>
                <span className="text-xl sm:text-2xl"></span>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-90 font-medium hidden xs:block">Step</p>
                  <p className="text-sm sm:text-lg font-bold leading-none">{currentStep}/{teachingSteps.length}</p>
                </div>
              </div> */}

              <Link
  href="/dashboard"
  className="px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-lg bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 font-bold transition-all text-xs sm:text-sm shadow-sm hover:shadow-md"
>
  <span className="hidden sm:inline">Exit</span>
  <span className="sm:hidden"></span>
</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Step-by-Step Year and Topic Selection */}
      

      {/* Teaching Steps Navigation */}
      {/* <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex justify-between gap-1.5 sm:gap-2">
            {teachingSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`flex-1 min-w-[50px] sm:min-w-[80px] h-12 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 ${
                  currentStep === step.id
                    ? `bg-gradient-to-r ${currentTutor.gradient} text-white shadow-lg scale-105 ring-2 ring-${currentTutor.color.split('-')[1]}-300`
                    : step.id < currentStep
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl sm:text-2xl">{step.icon}</span>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold">{step.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div> */}

      {/* Section Progress */}
      {/* {currentStep === 2 && selectedTopic && lessonSections.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-bold text-sm sm:text-base text-gray-800 flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg"></span> <span className="hidden xs:inline">Lesson Sections</span><span className="xs:hidden">Sections</span>
              </h3>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
                {currentLessonSection + 1}/{lessonSections.length}
              </span>
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2">
              {lessonSections.map((section, idx) => (
                <div
                  key={idx}
                  className={`flex-shrink-0 min-w-[100px] sm:min-w-[120px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    idx === currentLessonSection
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : idx < currentLessonSection
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs opacity-75 mb-0.5 sm:mb-1">Sec {idx + 1}</div>
                  <div className="truncate max-w-[80px] sm:max-w-none">{section.replace(`Section ${idx + 1}: `, '')}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2 text-center bg-white/50 rounded-lg py-1">
               Type <strong>"got it"</strong> or <strong>"next"</strong> to continue!
            </p>
          </div>
        </div>
      )} */}

      {/* Main Content - Professional Three-Panel Layout */}
      <div className="h-[calc(100vh-80px)] w-full flex justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">

  <div className="
    w-full
    max-w-[1920px]
    h-full
    flex
    gap-3 sm:gap-4
    p-2 sm:p-3 md:p-4
    overflow-hidden
  ">

    {/* ================= LESSON BOARD (LEFT SIDE) ================= */}
    <div className="
      hidden lg:flex
      w-[50%]
      min-w-[500px]
      h-full
      flex-col
      bg-white
      rounded-2xl
      shadow-2xl
      overflow-hidden
      border-2 border-gray-200
    ">
      <LessonBoard
        tutorType={type as 'maths' | 'science' | 'homework'}
        currentSlide={currentStep}
        totalSlides={teachingSteps.length}
        onNextSlide={goToNextPage}
        onPrevSlide={goToPrevPage}
        boardText={boardText}
        lessonTitle={lessonTopic}
        lessonContent={lessonDescription}
      />
    </div>


    {/* ================= AVATAR (CENTER) ================= */}
    <div className="w-[28%] min-w-[300px] flex flex-col gap-3">
      {/* Avatar Teacher - Pointing at Lesson Board */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200 relative">
        {/* Teacher Name Label - Top of Avatar Box */}
        <div className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${currentTutor.gradient} text-white shadow-xl`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl sm:text-4xl">{currentTutor.icon}</div>
        <div>
          <h3 className="font-bold text-sm sm:text-base">{currentTutor.name}</h3>
          <p className="text-[10px] sm:text-xs opacity-90">{currentTutor.subject}</p>
        </div>
      </div>
    </div>


        <AvatarTeacher
          key={type}
          speaking={isSpeaking}
          audioLevel={audioLevel}
          avatarType={type as 'maths' | 'science' | 'homework'}
          isPointing={false}
          pointDirection="left"
          isHoldingBook={true}
          isExplaining={teachingMode === 'explaining' || avatarTeachingMode === 'explaining'}
          isListening={isListening}
          teachingMode={avatarTeachingMode}
          isWriting={isAvatarWriting}
        />
      </div>

      {/* Action Buttons - Increased Width, Single Line Text */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <button
          onClick={() => {
            setStudentUnderstanding('confused')
            handleConfusedResponse()
          }}
          className="flex flex-col items-center gap-1 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 min-h-[70px]"
          title="Click when you don't understand"
        >
          <span className="text-2xl sm:text-3xl"></span>
          <span className="text-[11px] sm:text-xs font-black text-blue-700 text-center leading-tight whitespace-nowrap">I'm Stuck</span>
        </button>

        <button
          onClick={async () => {
            if (chat.length > 0) {
              const lastMessage = chat[chat.length - 1]

              // Wait if currently speaking
              if (isSpeaking) {
                await new Promise(resolve => {
                  const checkSpeaking = setInterval(() => {
                    if (!isSpeaking) {
                      clearInterval(checkSpeaking)
                      resolve(true)
                    }
                  }, 100)
                })
                await new Promise(resolve => setTimeout(resolve, 500))
              }

              setIsLoading(true)
              await new Promise(resolve => setTimeout(resolve, 500))
              setIsLoading(false)

              const introMessage = `Let me explain that again for you! `
              setChat(prev => [...prev, {
                id: `repeat_intro_${Date.now()}`,
                sender: 'teacher',
                text: introMessage,
                type: 'text'
              }])

              await speakText(introMessage, true)
              await new Promise(resolve => setTimeout(resolve, 1000))
              await speakText(lastMessage.text, true)
            }
          }}
          className="flex flex-col items-center gap-1 p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-300 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 min-h-[70px]"
          title="Click to hear again"
        >
          <span className="text-2xl sm:text-3xl"></span>
          <span className="text-[11px] sm:text-xs font-black text-amber-700 text-center leading-tight whitespace-nowrap">Repeat</span>
        </button>

        <button
          onClick={() => {
            const raiseMessage: Message = {
              id: `raise_${Date.now()}`,
              sender: 'student',
              text: ' Teacher, I need help!',
              type: 'text',
            }
            setChat(prev => [...prev, raiseMessage])

          setTimeout(() => {
            const response: Message = {
              id: `help_${Date.now()}`,
              sender: 'teacher',
              text: `Of course! I'm here to help!  What would you like me to explain?`,
              type: 'text',
            }
            setChat(prev => [...prev, response])
            speakText(response.text)
          }, 1000)
          }}
          className="flex flex-col items-center gap-1 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 min-h-[70px]"
          title="Click to ask for help"
        >
          <span className="text-2xl sm:text-3xl"></span>
          <span className="text-[11px] sm:text-xs font-black text-purple-700 text-center leading-tight whitespace-nowrap">Help Me</span>
        </button>
      </div>
    {/* Teacher Info Card */}
    
  </div>



    {/* ================= CHAT ================= */}
    <div className="
      flex
      w-full
      lg:w-[42%]
      min-w-[420px]
      h-full
      flex-col
      bg-white
      rounded-2xl
      shadow-2xl
      overflow-hidden
      border-2 border-gray-200
    ">

      {/* Chat Header */}
      <div className={`bg-gradient-to-r ${currentTutor.gradient} px-4 py-3 shadow-md`}>
        <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
          <span className="text-lg"></span>
          <span>Chat with {currentTutor.name}</span>
        </h3>
      </div>


      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="
          flex-1
          overflow-y-auto
          p-3 sm:p-4
          space-y-3
          bg-gradient-to-b from-gray-50 to-white
          relative
          z-10
        "
      >

        {/* Welcome Message on Empty Chat */}
        {chat.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-sm">
              <div className="text-4xl mb-3">{currentTutor.icon}</div>
              <h4 className="font-bold text-gray-800 mb-2">Welcome to {currentTutor.name}'s Class!</h4>
              <p className="text-sm text-gray-600">Ask a question or select a topic to start learning!</p>
            </div>
          </div>
        )}

        {chat.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === 'student'
                ? 'justify-end'
                : 'justify-start'
            } ${idx === chat.length - 1 ? 'animate-in slide-in-from-bottom duration-300' : ''}`}
          >
            <div className={`
              px-4 py-2.5
              rounded-2xl
              max-w-[85%]
              sm:max-w-[75%]
              shadow-md
              text-sm sm:text-base
              ${
                msg.sender === 'student'
                  ? `bg-gradient-to-r ${currentTutor.gradient} text-white`
                  : 'bg-white border border-gray-200 text-gray-800'
              }
            `}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.sender === 'student' ? 'text-white/70' : 'text-gray-400'}`}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now'}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

      </div>

      {/* ========== DIAGNOSTIC QUIZ UI ========== */}
      {showDiagnosticQuiz && diagnosticQuestions.length > 0 && (
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
            {diagnosticQuestions.map((q, idx) => (
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
                  value={diagnosticAnswers[q.id] || ''}
                  onChange={(e) => setDiagnosticAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer here... Take your time!"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  rows={3}
                />
                {diagnosticAnswers[q.id] && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Answer recorded!</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <button
            onClick={submitDiagnosticAnswers}
            disabled={isLoading || Object.keys(diagnosticAnswers).length === 0}
            className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
              currentTutor.gradient
            } hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking your answers...
              </span>
            ) : (
              <span>Submit Answers →</span>
            )}
          </button>
        </motion.div>
      )}

      {/* ========== MASTERY CHECK UI ========== */}
      {showMasteryCheck && masteryQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t-4 border-green-300 shadow-lg"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">🎯</span>
              <div>
                <h4 className="font-bold text-green-800 text-lg">Mastery Check</h4>
                <p className="text-xs text-green-600">Show you've mastered this topic!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg">
              <span className="font-bold">⭐</span>
              <span>You need 80% to pass. You've got this!</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            {masteryQuestions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-gray-800 flex-1">
                    {q.question}
                  </p>
                </div>
                <textarea
                  value={diagnosticAnswers[q.id] || ''}
                  onChange={(e) => setDiagnosticAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer here... Show all your working!"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  rows={3}
                />
                {diagnosticAnswers[q.id] && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Answer recorded! Great job!</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => completeSession(true)}
            disabled={isLoading}
            className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
              currentTutor.gradient
            } hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking your mastery...
              </span>
            ) : (
              <span>Submit Mastery Check →</span>
            )}
          </button>
        </motion.div>
      )}

      {/* ========== STUDENT ATTEMPT UI ========== */}
      {smartTeachingActive && currentStep === 4 && teachingMode === 'practicing' && !showDiagnosticQuiz && !showMasteryCheck && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t-4 border-purple-300 shadow-lg"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">✏️</span>
              <div>
                <h4 className="font-bold text-purple-800 text-lg">Your Turn!</h4>
                <p className="text-xs text-purple-600">Show your working out</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
              <span className="font-bold">💡</span>
              <span>Take your time and show all your steps!</span>
            </div>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here... Show all your working step by step!"
            className="w-full p-4 border-2 border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-4 transition font-mono"
            rows={5}
          />

          {currentAnswer.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-100 px-3 py-2 rounded-lg"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ready to submit! Great work!</span>
            </motion.div>
          )}

          <button
            onClick={submitStudentAttempt}
            disabled={isLoading || !currentAnswer.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
              currentTutor.gradient
            } hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking your work...
              </span>
            ) : (
              <span>Submit Answer →</span>
            )}
          </button>
        </motion.div>
      )}

      {/* Quick Question Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setQuestion('Can you explain this in a simpler way?');
          }}
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
        >
          💡 Explain Simpler
        </button>
        <button
          onClick={() => {
            setQuestion('Can you show me a step-by-step example?');
          }}
          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
        >
          📝 Show Example
        </button>
        <button
          onClick={() => {
            setQuestion('I don\'t understand this part, can you help me?');
          }}
          className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium transition-colors"
        >
          ❓ I Need Help
        </button>
        <button
          onClick={() => {
            setQuestion('Can you give me a similar question to practice?');
          }}
          className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium transition-colors"
        >
          ✏️ More Practice
        </button>
      </div>

      {/* LIVE VOICE-TO-VOICE COMMUNICATION - DIRECT CONVERSATION */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-purple-200">
        <button
          onMouseDown={startVoice}
          onMouseUp={stopVoice}
          onTouchStart={startVoice}
          onTouchEnd={stopVoice}
          className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg border-4 ${
            isStreaming
              ? 'bg-red-600 border-red-400 text-white animate-pulse'
              : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 border-purple-300 text-white hover:scale-105'
          }`}
          title="Hold to talk with AI teacher"
        >
          <div className="flex items-center justify-center gap-3">
            {isStreaming ? (
              <>
                <span className="text-3xl">🎤</span>
                <div className="text-left">
                  <div className="text-sm font-black">LISTENING...</div>
                  <div className="text-xs opacity-90">Speak now!</div>
                </div>
                <span className="text-2xl">🔊</span>
              </>
            ) : (
              <>
                <span className="text-3xl">🎤</span>
                <div className="text-left">
                  <div className="text-sm font-black">PUSH TO TALK</div>
                  <div className="text-xs opacity-90">Hold & speak directly to Teacher</div>
                </div>
                <span className="text-2xl">▶️</span>
              </>
            )}
          </div>
        </button>
        <p className="text-xs text-purple-700 mt-2 text-center">
          💡 Hold button → Speak → Release → Teacher responds (no text shown!)
        </p>
      </div>

      {/* Chat Input */}
      <ChatInput
        question={question}
        setQuestion={setQuestion}
        handleSend={handleSend}
        currentTutor={currentTutor}
      />

    </div>

    {/* RIGHT SIDEBAR - Progress Metrics & Curriculum Lock Status */}
    <div className="w-[20%] min-w-[280px] hidden xl:flex flex-col gap-3">
      {/* Curriculum Lock Status - Layer 1 */}
      {curriculumLockStatus && (
        <div className={`p-4 rounded-2xl shadow-lg border-2 ${
          curriculumLockStatus.locked
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {curriculumLockStatus.locked ? (
              <span className="text-2xl">🔒</span>
            ) : (
              <span className="text-2xl">⚠️</span>
            )}
            <h3 className="font-bold text-sm text-gray-800">Curriculum Lock</h3>
          </div>
          <p className="text-xs text-gray-700">
            {curriculumLockStatus.locked
              ? `✓ Verified content (Confidence: ${(curriculumLockStatus.confidence * 100).toFixed(0)}%)`
              : curriculumLockStatus.message || 'Not verified'}
          </p>
        </div>
      )}

      {/* Progress Metrics - Layer 3 */}
      {progressMetrics && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-sm text-gray-800">Your Progress</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Mastery</span>
                <span className="text-xs font-bold text-green-600">{progressMetrics.mastery_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressMetrics.mastery_percent >= 80 ? 'bg-green-500' :
                    progressMetrics.mastery_percent >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${progressMetrics.mastery_percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Attempts</span>
              <span className="text-xs font-semibold text-gray-900">{progressMetrics.attempts_count}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                progressMetrics.status === 'secure' ? 'bg-green-100 text-green-700' :
                progressMetrics.status === 'developing' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {progressMetrics.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Personalisation Mode - Layer 3 */}
      {/* Personalisation Mode - Layer 3 */}
  {personalisationMode !== 'standard' && (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎯</span>
        <h3 className="font-bold text-sm text-yellow-800">Adaptation Mode</h3>
      </div>
      <p className="text-xs font-semibold text-yellow-700 uppercase">{personalisationMode}</p>
      <p className="text-xs text-yellow-600 mt-1">
        {personalisationMode === 'simplify' && 'Simplified explanation activated'}
        {personalisationMode === 'challenge' && 'Challenge mode - going deeper'}
        {personalisationMode === 'scaffold' && 'Step-by-step scaffolding provided'}
      </p>
    </div>
  )}

  {/* Incorrect Attempts Counter */}
  {incorrectAttempts > 0 && (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⚠️</span>
        <h3 className="font-bold text-sm text-orange-800">Attempts</h3>
      </div>
      <p className="text-lg font-bold text-orange-700">{incorrectAttempts} incorrect</p>
      {incorrectAttempts >= 2 && (
        <p className="text-xs text-orange-600 mt-2">
          Let me explain this differently...
        </p>
      )}
      {incorrectAttempts >= 3 && (
        <p className="text-xs text-orange-600 mt-2 font-semibold">
          Would you like to take a break or try a different approach?
        </p>
      )}
    </div>
  )}

  {/* Quick Safeguarding Notice */}
  {/* <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg mt-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🛡️</span>
        <h3 className="font-bold text-sm text-blue-800">Safe Learning</h3>
      </div>
      <p className="text-xs text-blue-700">
        This AI tutor follows safeguarding guidelines. If you need personal support, talk to a trusted adult.
      </p>
  </div> */}

</div>  // <- only one main closing div
  )
}
