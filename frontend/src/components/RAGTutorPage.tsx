'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  StopCircle,
  BookOpen,
  Brain,
  Target,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  GraduationCap,
  FileText,
  Shield,
  Lock,
  TrendingUp,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import AvatarTeacher from './AvatarTeacher';
import TopicSearch from './TopicSearch';
import MasteryTrackingPanel from './MasteryTrackingPanel';
import ChatInput from './common/ChatInput';
import DiagnosticQuiz from './DiagnosticQuiz';
import WorkedExampleDisplay from './WorkedExampleDisplay';
import TeachingStepIndicator from './TeachingStepIndicator';
import SafeguardingBanner from './SafeguardingBanner';

// ==================== INTERFACES ====================

interface Message {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  timestamp?: Date;
  type?: 'text' | 'file' | 'voice';
  boardText?: string;
  metadata?: any;
}

interface CurriculumTopic {
  topic_id: string;
  topic_name: string;
  subject: string;
  year_level: number;
  difficulty_level: number;
  learning_objectives?: string[];
}

interface DiagnosticQuestion {
  id: string;
  question: string;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface WorkedExample {
  problem: string;
  steps: string[];
  final_answer: string;
  method_notes: string;
  exam_tips: string[];
}

interface Feedback {
  is_correct: boolean;
  message: string;
  next_step: string;
  adaptation?: 'simplify' | 'challenge' | 'scaffold' | 'visual_analogy';
  error_type?: 'arithmetic' | 'method' | 'misconception' | 'careless';
  correct_answer?: string;
  scaffolded_steps?: string[];
  visual_analogy?: string;
  encouragement: string;
}

interface ProgressMetrics {
  mastery_percent: number;
  attempts_count: number;
  error_tags: string[];
  last_practiced: string;
  confidence_signal: number;
  status: 'secure' | 'developing' | 'at_risk';
  trend: 'improving' | 'stable' | 'declining';
}

interface SafeguardingAlert {
  detected: boolean;
  type: 'emotional_distress' | 'self_harm' | 'harmful_topic' | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  response: string;
  trusted_adult_prompt: string;
  escalate: boolean;
}

interface CurriculumLockCheck {
  locked: boolean;
  topicId: string;
  topicExists: boolean;
  contextRetrieved: boolean;
  confidenceThreshold: number;
  actualConfidence: number;
  message: string;
  clarifying_question?: string;
}

// Teaching step enum
enum TeachingStep {
  CONFIRM_TOPIC = 1,
  DIAGNOSTIC = 2,
  TEACH_CHUNK = 3,
  GUIDED_EXAMPLE = 4,
  STUDENT_ATTEMPT = 5,
  FEEDBACK = 6,
  MASTERY_CHECK = 7,
}

// ==================== MAIN COMPONENT ====================

export default function RAGTutorPage() {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [boardText, setBoardText] = useState('');
  const [avatarMode, setAvatarMode] = useState<'explaining' | 'writing' | 'pointing' | 'idle'>('idle');

  // Curriculum selection state - Year groups from Qdrant
  const [selectedSubject, setSelectedSubject] = useState('maths');
  const [selectedYear, setSelectedYear] = useState('7');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [availableTopics, setAvailableTopics] = useState<CurriculumTopic[]>([]);

  // UI state
  const [showTopicSearch, setShowTopicSearch] = useState(true);
  const [showMasteryPanel, setShowMasteryPanel] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // SMART AI Teacher state
  const [teachingStep, setTeachingStep] = useState<TeachingStep | null>(null);
  const [curriculumLock, setCurriculumLock] = useState<CurriculumLockCheck | null>(null);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [diagnosticScore, setDiagnosticScore] = useState<number>(0);
  const [workedExample, setWorkedExample] = useState<WorkedExample | null>(null);
  const [studentAttempt, setStudentAttempt] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [safeguardingAlert, setSafeguardingAlert] = useState<SafeguardingAlert | null>(null);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [failedMasteryChecks, setFailedMasteryChecks] = useState(0);
  const [adaptationMode, setAdaptationMode] = useState<'standard' | 'simplify' | 'challenge' | 'scaffold'>('standard');

  // Load curriculum data on mount
  useEffect(() => {
    if (user) {
      loadCurriculumData();
    }
  }, [user]);

  // Load year groups when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadYearGroups(selectedSubject);
    }
  }, [selectedSubject]);

  // Load topics when year changes
  useEffect(() => {
    if (selectedSubject && selectedYear) {
      loadTopicsForYear(selectedSubject, selectedYear);
    }
  }, [selectedSubject, selectedYear]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session when topic is selected
  useEffect(() => {
    if (user && selectedTopic && !sessionId) {
      initializeSession();
    }
  }, [user, selectedTopic]);

  // ==================== CURRICULUM LOADING ====================

  const loadYearGroups = async (subject: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/curriculum/years?subject=${subject}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableYears(data.data?.years || []);
        
        // If current selected year is not in the available years, select the first available
        if (!data.data?.years.includes(selectedYear) && data.data?.years.length > 0) {
          setSelectedYear(data.data.years[0]);
        }
      }
    } catch (error) {
      console.error('Error loading year groups:', error);
      // Fallback to default years
      setAvailableYears(['5', '6', '7', '8', '9']);
    }
  };

  const loadCurriculumData = async () => {
    try {
      // Load subjects from backend
      const subjectsResponse = await fetch('http://localhost:8000/api/teaching/curriculum/topics');
      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        const uniqueSubjects = Array.from(new Set(data.topics.map((t: any) => t.subject)));
        if (uniqueSubjects.length > 0 && !selectedSubject) {
          setSelectedSubject(uniqueSubjects[0]);
        }
      }
    } catch (error) {
      console.error('Error loading curriculum data:', error);
    }
  };

  const loadTopicsForYear = async (subject: string, year: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}&year_group=${year}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableTopics(data.topics || []);
        
        // If a topic was previously selected but doesn't match the new year, clear it
        if (selectedTopic && !data.topics.some((t: any) => t.topic_id === selectedTopic.topic_id)) {
          setSelectedTopic(null);
        }
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      setAvailableTopics([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== SESSION MANAGEMENT ====================

  const initializeSession = async () => {
    if (!user || !selectedTopic) return;

    try {
      // Step 1: Check curriculum lock BEFORE starting session
      const lockCheck = await checkCurriculumLock(selectedTopic.topic_id, selectedSubject, selectedYear);
      setCurriculumLock(lockCheck);

      if (!lockCheck.locked) {
        // Show clarifying question
        setMessages([{
          id: 'welcome',
          sender: 'teacher',
          text: lockCheck.message,
          timestamp: new Date(),
        }]);
        
        if (lockCheck.clarifying_question) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: 'clarify',
              sender: 'teacher',
              text: lockCheck.clarifying_question!,
              timestamp: new Date(),
            }]);
          }, 1000);
        }
        return;
      }

      // Curriculum is locked - start session
      const response = await fetch('http://localhost:8000/api/rag-chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          topic_id: selectedTopic.topic_id,
          subject: selectedTopic.subject,
          year_group: selectedTopic.year_level.toString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);

        // Welcome message with topic confirmation (Step 1)
        const welcomeMessage: Message = {
          id: 'welcome',
          sender: 'teacher',
          text: `Great! We're studying **${selectedTopic.topic_name}** for **Year ${selectedTopic.year_level} ${selectedSubject}**. ` +
                `Let me confirm what you already know before we begin.`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        // Set teaching step to diagnostic
        setTeachingStep(TeachingStep.DIAGNOSTIC);
        setAvatarMode('explaining');

        // Generate diagnostic questions (Step 2)
        await generateDiagnosticQuestions();
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setMessages([{
        id: 'error',
        sender: 'teacher',
        text: "Sorry, I encountered an error. Please try again!",
        timestamp: new Date(),
      }]);
    }
  };

  // ==================== LAYER 1: CURRICULUM LOCK ====================

  const checkCurriculumLock = async (topicId: string, subject: string, year: string): Promise<CurriculumLockCheck> => {
    try {
      // Check if topic ID is valid
      if (!topicId || topicId.trim() === '') {
        return {
          locked: false,
          topicId: '',
          topicExists: false,
          contextRetrieved: false,
          confidenceThreshold: 0.7,
          actualConfidence: 0,
          message: "I need to know which topic you'd like to learn about.",
          clarifying_question: "Could you please select a topic from the curriculum menu?",
        };
      }

      // Check if topic exists in Qdrant
      const topicResponse = await fetch(
        `http://localhost:8000/api/curriculum/topic-content?subject=${subject}&topic=${topicId}&key_stage=${year}`
      );

      if (!topicResponse.ok) {
        return {
          locked: false,
          topicId,
          topicExists: false,
          contextRetrieved: false,
          confidenceThreshold: 0.7,
          actualConfidence: 0,
          message: `I couldn't find "${topicId}" in our curriculum.`,
          clarifying_question: "Could you check the topic name or select from the available topics?",
        };
      }

      const topicData = await topicResponse.json();
      const hasContent = topicData.data?.documents?.some((doc: any) => doc.chunks && doc.chunks.length > 0);

      if (!hasContent) {
        return {
          locked: false,
          topicId,
          topicExists: true,
          contextRetrieved: false,
          confidenceThreshold: 0.7,
          actualConfidence: 0,
          message: `I found "${topicId}" but don't have enough content to teach it properly.`,
          clarifying_question: "Would you like to try a different topic?",
        };
      }

      // Calculate confidence from similarity scores
      const allChunks = topicData.data?.documents?.flatMap((doc: any) => doc.chunks || []) || [];
      const avgConfidence = allChunks.length > 0
        ? allChunks.reduce((sum: number, chunk: any) => sum + (chunk.similarity_score || 0), 0) / allChunks.length
        : 0;

      if (avgConfidence < 0.7) {
        return {
          locked: false,
          topicId,
          topicExists: true,
          contextRetrieved: true,
          confidenceThreshold: 0.7,
          actualConfidence: avgConfidence,
          message: `I'm not entirely confident about the content for "${topicId}".`,
          clarifying_question: "Would you like me to proceed with what I have, or select a different topic?",
        };
      }

      // All checks passed
      return {
        locked: true,
        topicId,
        topicExists: true,
        contextRetrieved: true,
        confidenceThreshold: 0.7,
        actualConfidence: avgConfidence,
        message: 'Curriculum verified. Ready to teach with approved content.',
      };
    } catch (error) {
      console.error('Curriculum lock check failed:', error);
      return {
        locked: false,
        topicId: topicId || '',
        topicExists: false,
        contextRetrieved: false,
        confidenceThreshold: 0.7,
        actualConfidence: 0,
        message: "I'm having trouble accessing the curriculum right now.",
        clarifying_question: "Could you try again in a moment?",
      };
    }
  };

  // ==================== LAYER 2: TEACHING FLOW ====================

  const generateDiagnosticQuestions = async () => {
    if (!selectedTopic || !sessionId) return;

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/generate-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosticQuestions(data.questions || []);
        
        // Update board with diagnostic intro
        setBoardText(`STEP 2: Diagnostic Check\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nLet's see what you already know about ${selectedTopic.topic_name}.\n\nAnswer these ${Math.min(data.questions?.length || 1, 3)} questions:`);
        
        setAvatarMode('pointing');
      }
    } catch (error) {
      console.error('Error generating diagnostic questions:', error);
      // Fallback to manual diagnostic
      setDiagnosticQuestions([{
        id: 'q1',
        question: `What do you already know about ${selectedTopic?.topic_name || 'this topic'}?`,
        correct_answer: '',
        explanation: 'This helps me understand your starting point.',
        difficulty: 'easy',
      }]);
    }
  };

  const handleDiagnosticSubmit = async (answers: { question: string; answer: string }[]) => {
    if (!sessionId || !selectedTopic) return;

    setDiagnosticAnswers(answers);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/submit-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosticScore(data.diagnostic_score || 0);

        // Add teacher message with adaptation
        const adaptationMessage = data.adaptation === 'simplify'
          ? "Thanks! I can see this is new to you. Let me break it down simply."
          : data.adaptation === 'challenge'
          ? "Excellent! You already understand the basics. Let's go deeper."
          : "Great! Let me build on what you know.";

        setMessages(prev => [...prev, {
          id: `diagnostic_feedback_${Date.now()}`,
          sender: 'teacher',
          text: adaptationMessage,
          timestamp: new Date(),
        }]);

        // Set adaptation mode based on diagnostic score
        if (data.diagnostic_score < 40) {
          setAdaptationMode('simplify');
        } else if (data.diagnostic_score > 80) {
          setAdaptationMode('challenge');
        } else {
          setAdaptationMode('standard');
        }

        // Move to Step 3: Teach chunk
        setTeachingStep(TeachingStep.TEACH_CHUNK);
        await generateTeachingChunk(data.adaptation);
      }
    } catch (error) {
      console.error('Error submitting diagnostic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTeachingChunk = async (adaptation: string) => {
    if (!selectedTopic || !sessionId) return;

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/generate-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
          adaptation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update board with teaching content
        const boardContent = `STEP 3: Learning\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${data.chunk?.title || selectedTopic.topic_name}\n\n${data.chunk?.content || ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nKey Points:\n${(data.chunk?.key_points || []).map(p => `• ${p}`).join('\n')}`;
        
        setBoardText(boardContent);
        setAvatarMode('explaining');

        // Add chat message
        setMessages(prev => [...prev, {
          id: `teach_${Date.now()}`,
          sender: 'teacher',
          text: data.chunk?.content || `Let's learn about **${selectedTopic.topic_name}**.`,
          timestamp: new Date(),
        }]);

        // Move to Step 4: Guided example
        setTeachingStep(TeachingStep.GUIDED_EXAMPLE);
        await generateWorkedExample();
      }
    } catch (error) {
      console.error('Error generating teaching chunk:', error);
    }
  };

  const generateWorkedExample = async () => {
    if (!selectedTopic || !sessionId) return;

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
          adaptation: adaptationMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkedExample(data.example);

        // Update board with worked example
        const boardContent = `STEP 4: Worked Example\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nProblem: ${data.example?.problem || ''}\n\nSolution:\n${(data.example?.steps || []).map((s: string, i: number) => `Step ${i + 1}: ${s}`).join('\n')}\n\nFinal Answer: ${data.example?.final_answer || ''}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nMethod Notes: ${data.example?.method_notes || ''}`;
        
        setBoardText(boardContent);
        setAvatarMode('writing');

        // Add chat message
        setMessages(prev => [...prev, {
          id: `example_${Date.now()}`,
          sender: 'teacher',
          text: `Here's a worked example. Study the steps carefully.`,
          timestamp: new Date(),
        }]);

        // Move to Step 5: Student attempt
        setTeachingStep(TeachingStep.STUDENT_ATTEMPT);
        setAvatarMode('pointing');

        // Prompt student to attempt
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `attempt_prompt_${Date.now()}`,
            sender: 'teacher',
            text: `Now it's your turn! Try to solve a similar problem. Type your answer below.`,
            timestamp: new Date(),
          }]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating worked example:', error);
    }
  };

  const handleStudentAttempt = async (attempt: string) => {
    if (!sessionId || !selectedTopic) return;

    setStudentAttempt(attempt);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answer: attempt,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
          attempts: incorrectAttempts + 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);

        // Check for safeguarding concerns (Layer 4)
        if (data.safeguarding?.detected) {
          setSafeguardingAlert(data.safeguarding);
          return;
        }

        // Check for exam integrity violation (Layer 4)
        if (data.integrity_violation?.detected) {
          setMessages(prev => [...prev, {
            id: `integrity_${Date.now()}`,
            sender: 'teacher',
            text: data.integrity_violation.response,
            timestamp: new Date(),
          }]);
          // Don't provide answer - give hint instead
          setTeachingStep(TeachingStep.GUIDED_EXAMPLE);
          setIsLoading(false);
          return;
        }

        // Handle feedback (Step 6)
        setTeachingStep(TeachingStep.FEEDBACK);

        if (data.feedback.is_correct) {
          // Correct answer
          setMessages(prev => [...prev, {
            id: `feedback_${Date.now()}`,
            sender: 'teacher',
            text: `${data.feedback.encouragement} ${data.feedback.message}`,
            timestamp: new Date(),
          }]);

          // Reset incorrect attempts
          setIncorrectAttempts(0);

          // Move to mastery check
          setTimeout(() => {
            setTeachingStep(TeachingStep.MASTERY_CHECK);
            generateMasteryCheck();
          }, 2000);
        } else {
          // Incorrect answer
          const newIncorrectAttempts = incorrectAttempts + 1;
          setIncorrectAttempts(newIncorrectAttempts);

          // Personalisation Engine (Layer 3)
          if (newIncorrectAttempts >= 3) {
            // 3 failed attempts - escalate suggestion
            setFailedMasteryChecks(prev => prev + 1);
            setMessages(prev => [...prev, {
              id: `escalate_${Date.now()}`,
              sender: 'teacher',
              text: "I notice this is challenging. Would you like to try a different approach or take a break?",
              timestamp: new Date(),
            }]);
          } else if (newIncorrectAttempts >= 2) {
            // 2 incorrect - switch explanation style
            setAdaptationMode('simplify');
            setMessages(prev => [...prev, {
              id: `adapt_${Date.now()}`,
              sender: 'teacher',
              text: `Let me explain this differently. ${data.feedback.scaffolded_steps ? ' Here are some scaffolded steps: ' + data.feedback.scaffolded_steps.join(', ') : ''}`,
              timestamp: new Date(),
            }]);
            
            if (data.feedback.visual_analogy) {
              setMessages(prev => [...prev, {
                id: `analogy_${Date.now()}`,
                sender: 'teacher',
                text: `Think of it like this: ${data.feedback.visual_analogy}`,
                timestamp: new Date(),
              }]);
            }
          } else {
            // First incorrect
            setMessages(prev => [...prev, {
              id: `feedback_${Date.now()}`,
              sender: 'teacher',
              text: `${data.feedback.message} ${data.feedback.encouragement}`,
              timestamp: new Date(),
            }]);
          }

          // Stay on student attempt
          setTeachingStep(TeachingStep.STUDENT_ATTEMPT);
        }

        // Update progress metrics
        if (data.progress) {
          setProgressMetrics(data.progress);
        }
      }
    } catch (error) {
      console.error('Error submitting attempt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMasteryCheck = async () => {
    if (!sessionId || !selectedTopic) return;

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/generate-mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setMessages(prev => [...prev, {
          id: `mastery_${Date.now()}`,
          sender: 'teacher',
          text: `Let's check your understanding with ${data.mastery_check?.questions?.length || 3} quick questions. You need ${data.mastery_check?.pass_threshold || 80}% to pass.`,
          timestamp: new Date(),
        }]);

        // Update board
        setBoardText(`STEP 7: Mastery Check\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nShow what you've learned!\n\nPass mark: ${data.mastery_check?.pass_threshold || 80}%\n\nQuestions: ${data.mastery_check?.questions?.length || 3}`);
        setAvatarMode('pointing');
      }
    } catch (error) {
      console.error('Error generating mastery check:', error);
    }
  };

  const handleMasterySubmit = async (answers: { question: string; answer: string }[]) => {
    if (!sessionId || !selectedTopic) return;

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/teaching/smart/submit-mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answers,
          topic_id: selectedTopic.topic_id,
          tutor_type: selectedSubject,
          year_group: selectedYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.mastery_passed) {
          // Passed mastery check
          setMessages(prev => [...prev, {
            id: `mastery_pass_${Date.now()}`,
            sender: 'teacher',
            text: `🎉 Excellent! You've mastered **${selectedTopic.topic_name}**! Your mastery score is ${data.progress?.mastery_percent || 100}%.`,
            timestamp: new Date(),
          }]);

          setProgressMetrics(data.progress);
          setTeachingStep(null); // Session complete

          // Update board
          setBoardText(`SESSION COMPLETE ✓\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTopic: ${selectedTopic.topic_name}\nMastery: ${data.progress?.mastery_percent || 100}%\nStatus: SECURE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nWell done! You can now:\n• Move to the next topic\n• Practice more questions\n• Review your notes`);
        } else {
          // Failed mastery check
          const newFailedChecks = failedMasteryChecks + 1;
          setFailedMasteryChecks(newFailedChecks);

          if (newFailedChecks >= 3) {
            // 3 failed mastery checks - trigger escalation
            setMessages(prev => [...prev, {
              id: `escalate_${Date.now()}`,
              sender: 'teacher',
              text: "I notice you're finding this challenging. Let's review the key concepts again, or I can suggest asking your teacher for extra support.",
              timestamp: new Date(),
            }]);
            setTeachingStep(TeachingStep.TEACH_CHUNK); // Go back to teaching
          } else {
            // Retry mastery
            setMessages(prev => [...prev, {
              id: `mastery_retry_${Date.now()}`,
              sender: 'teacher',
              text: `Not quite there yet. Let's review and try again. Your score was ${data.mastery_score || 0}%.`,
              timestamp: new Date(),
            }]);
            setTeachingStep(TeachingStep.TEACH_CHUNK); // Go back to teaching
          }
        }

        // Complete session
        await completeSession(data.mastery_passed);
      }
    } catch (error) {
      console.error('Error submitting mastery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async (masteryPassed: boolean) => {
    if (!sessionId) return;

    try {
      await fetch('http://localhost:8000/api/teaching/smart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mastery_passed: masteryPassed,
          topic_id: selectedTopic?.topic_id,
          tutor_type: selectedSubject,
        }),
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // ==================== MESSAGE HANDLING ====================

  const sendMessage = async (message: string) => {
    if (!sessionId || !message.trim()) return;

    // Check for safeguarding concerns FIRST
    const safeguardingCheck = await checkSafeguarding(message);
    if (safeguardingCheck.detected) {
      setSafeguardingAlert(safeguardingCheck);
      return;
    }

    // Check for exam integrity violation
    const integrityCheck = checkExamIntegrity(message);
    if (integrityCheck.detected) {
      setMessages(prev => [...prev, {
        id: `integrity_${Date.now()}`,
        sender: 'teacher',
        text: integrityCheck.response,
        timestamp: new Date(),
      }]);
      return;
    }

    // Handle based on current teaching step
    if (teachingStep === TeachingStep.STUDENT_ATTEMPT) {
      await handleStudentAttempt(message);
    } else {
      // Regular chat message
      setIsLoading(true);

      try {
        // Add student message
        const studentMessage: Message = {
          id: `student_${Date.now()}`,
          sender: 'student',
          text: message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, studentMessage]);

        // Send to RAG chatbot API
        const response = await fetch('http://localhost:8000/api/rag-chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            student_id: user?.id,
            message: message,
            topic_id: selectedTopic?.topic_id,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          const tutorMessage: Message = {
            id: `tutor_${Date.now()}`,
            sender: 'teacher',
            text: data.response,
            timestamp: new Date(),
            boardText: data.board_text,
          };
          setMessages(prev => [...prev, tutorMessage]);

          if (data.board_text) {
            setBoardText(data.board_text);
          }

          if (data.avatar_mode) {
            setAvatarMode(data.avatar_mode as any);
          }

          if (!isMuted && data.response) {
            speakResponse(data.response);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ==================== LAYER 4: SAFETY LAYER ====================

  const checkSafeguarding = async (message: string): Promise<SafeguardingAlert> => {
    const distressKeywords = [
      'sad', 'depressed', 'anxious', 'worried', 'scared', 'alone',
      'hurt myself', 'give up', 'no point', 'hate myself',
      'stupid', 'useless', 'worthless'
    ];

    const hasDistress = distressKeywords.some(keyword => message.toLowerCase().includes(keyword));

    if (hasDistress) {
      const alert: SafeguardingAlert = {
        detected: true,
        type: 'emotional_distress',
        severity: 'medium',
        response: "I can see you're feeling upset. It's really important to talk to someone about this.",
        trusted_adult_prompt: "Please speak to a trusted adult - a parent, teacher, or school counselor. They're there to help you.",
        escalate: true,
      };
      return alert;
    }

    return {
      detected: false,
      type: null,
      severity: 'low',
      response: '',
      trusted_adult_prompt: '',
      escalate: false,
    };
  };

  const checkExamIntegrity = (message: string): { detected: boolean; type: string; response: string } => {
    const cheatPatterns = [
      /what'?s the answer/i,
      /just give me the answer/i,
      /this is my homework/i,
      /need to submit this/i,
      /can you do this for me/i,
      /what do i write/i
    ];

    const detected = cheatPatterns.some(pattern => pattern.test(message));

    if (detected) {
      return {
        detected: true,
        type: 'direct_answer_request',
        response: "I can't give you the answer directly, but I can help you understand how to solve it. Let me show you a similar example first, then you can try.",
      };
    }

    return { detected: false, type: '', response: '' };
  };

  // ==================== UTILITIES ====================

  const speakResponse = (text: string) => {
    if (typeof window === 'undefined') return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(voice =>
      voice.lang.includes('en-GB') || voice.lang.includes('en_UK')
    );
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleTopicSelect = (topic: CurriculumTopic) => {
    setSelectedTopic(topic);
    setShowTopicSearch(false);
    // Reset session state
    setSessionId('');
    setMessages([]);
    setTeachingStep(null);
    setIncorrectAttempts(0);
    setFailedMasteryChecks(0);
    setAdaptationMode('standard');
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setSessionId('');
    setMessages([]);
    setTeachingStep(null);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedTopic(null);
    setSessionId('');
    setMessages([]);
    setTeachingStep(null);
  };

  const restartSession = () => {
    setSessionId('');
    setMessages([]);
    setTeachingStep(null);
    setSelectedTopic(null);
    setBoardText('');
    setIncorrectAttempts(0);
    setFailedMasteryChecks(0);
    setAdaptationMode('standard');
    setShowTopicSearch(true);
  };

  const formatMessageText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  // ==================== RENDER ====================

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Safeguarding Banner */}
      {safeguardingAlert?.detected && (
        <SafeguardingBanner
          alert={safeguardingAlert}
          onDismiss={() => setSafeguardingAlert(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Session Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">SMART AI Tutor</h1>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sessionId}
              >
                <option value="maths">Maths</option>
                <option value="science">Science</option>
                <option value="english">English</option>
              </select>

              {/* Year Groups from Qdrant */}
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sessionId || availableYears.length === 0}
              >
                {availableYears.length > 0 ? (
                  availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))
                ) : (
                  <option value="7">Loading years...</option>
                )}
              </select>

              {selectedTopic && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{selectedTopic.topic_name}</span>
                  {curriculumLock?.locked && (
                    <Lock className="w-3 h-3 text-green-600" />
                  )}
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {sessionId && (
                <button
                  onClick={restartSession}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="New Session"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setShowTopicSearch(!showTopicSearch)}
                className={`p-2 rounded-lg transition ${showTopicSearch ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Search Topics"
              >
                <BookOpen className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowMasteryPanel(!showMasteryPanel)}
                className={`p-2 rounded-lg transition ${showMasteryPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="View Mastery Tracking"
              >
                <Target className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Left Panel: Topic Search & Mastery */}
          <AnimatePresence>
            {(showTopicSearch || showMasteryPanel) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="col-span-3 overflow-hidden"
              >
                <div className="h-full overflow-y-auto space-y-4">
                  {showTopicSearch && (
                    <TopicSearch
                      onSelectTopic={handleTopicSelect}
                      selectedYearGroup={selectedYear}
                      selectedSubject={selectedSubject}
                    />
                  )}

                  {showMasteryPanel && user && (
                    <MasteryTrackingPanel
                      studentId={user.id}
                      compact={false}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center: Avatar & Whiteboard */}
          <div className={`${(showTopicSearch || showMasteryPanel) ? 'col-span-6' : 'col-span-8'} flex flex-col gap-4`}>
            {/* Teaching Step Indicator */}
            {teachingStep && (
              <TeachingStepIndicator currentStep={teachingStep} />
            )}

            {/* Avatar and Whiteboard Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 h-full">
                {/* Avatar Side */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-r border-gray-200">
                  <div className="h-full flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      AI Teacher
                    </h3>
                    <div className="flex-1 relative">
                      <AvatarTeacher
                        emotion={avatarMode === 'pointing' ? 'concerned' : avatarMode === 'writing' ? 'focused' : 'happy'}
                        isSpeaking={isSpeaking}
                        teachingMode={avatarMode}
                      />
                    </div>
                    
                    {/* Adaptation Mode Indicator */}
                    {adaptationMode !== 'standard' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-yellow-700">
                            Adaptation: {adaptationMode.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Whiteboard Side */}
                <div className="bg-white p-4 overflow-hidden">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Whiteboard
                  </h3>
                  <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-4 overflow-y-auto">
                    {boardText ? (
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {boardText}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Board content will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Quiz */}
            {teachingStep === TeachingStep.DIAGNOSTIC && diagnosticQuestions.length > 0 && (
              <DiagnosticQuiz
                questions={diagnosticQuestions}
                onSubmit={handleDiagnosticSubmit}
                isLoading={isLoading}
              />
            )}

            {/* Worked Example Display */}
            {workedExample && teachingStep === TeachingStep.GUIDED_EXAMPLE && (
              <WorkedExampleDisplay example={workedExample} />
            )}

            {/* Chat Section */}
            <div className="h-[350px] bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Chat
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isLoading ? (
                    <>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <span>AI is thinking...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <span>Ready</span>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'student'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
                      />
                      <p className={`text-xs mt-1 ${message.sender === 'student' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {}}
                    className={`p-3 rounded-full transition hover:bg-gray-100`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                    placeholder={
                      teachingStep === TeachingStep.STUDENT_ATTEMPT
                        ? "Type your answer here..."
                        : "Ask a question or type your answer..."
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />

                  <button
                    onClick={() => {
                      if (inputMessage.trim()) {
                        sendMessage(inputMessage);
                        setInputMessage('');
                      }
                    }}
                    disabled={isLoading || !inputMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Progress & Stats */}
          <div className="col-span-3 space-y-4">
            {/* Teaching Step */}
            {teachingStep && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Current Step
                </h3>
                <div className="text-sm text-gray-700">
                  {TeachingStep[teachingStep].replace('_', ' ')}
                </div>
              </div>
            )}

            {/* Progress Metrics */}
            {progressMetrics && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Your Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mastery</span>
                    <span className="font-bold text-green-600">{progressMetrics.mastery_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Attempts</span>
                    <span className="font-medium text-gray-900">{progressMetrics.attempts_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
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

            {/* Attempt Counter */}
            {incorrectAttempts > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Attempts</h3>
                </div>
                <p className="text-sm text-orange-700">
                  {incorrectAttempts} incorrect {incorrectAttempts === 1 ? 'attempt' : 'attempts'}
                </p>
                {incorrectAttempts >= 2 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Let me explain this differently...
                  </p>
                )}
              </div>
            )}

            {/* Curriculum Lock Status */}
            {curriculumLock && (
              <div className={`rounded-xl p-4 border ${
                curriculumLock.locked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {curriculumLock.locked ? (
                    <Lock className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="font-semibold text-gray-900">Curriculum Lock</h3>
                </div>
                <p className="text-xs text-gray-700">
                  {curriculumLock.locked
                    ? `✓ Verified content (Confidence: ${(curriculumLock.actualConfidence * 100).toFixed(0)}%)`
                    : curriculumLock.message}
                </p>
              </div>
            )}

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Quick Tips
              </h3>
              <ul className="text-xs text-purple-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Select a topic to begin the 7-step teaching flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Complete diagnostic questions to personalize learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Study the worked example before attempting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Pass the mastery check to complete the topic</span>
                </li>
              </ul>
            </div>

            {/* Safeguarding Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Safe Learning</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    This AI tutor follows safeguarding guidelines. If you need personal support, talk to a trusted adult.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple MessageCircle icon component
function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function Minimize2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6L4 20M20 10h-6m0 0V4m0 6l6-6M4 10h6m0 0V4m0 6L4 4M20 14h-6m0 0v6m0-6l6 6" />
    </svg>
  );
}

function Maximize2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
