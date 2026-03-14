'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  Flame,
  Zap,
  Target,
  BookOpen,
  Brain,
  Award,
  Users,
  Calculator,
  FlaskConical,
  FileText,
  Upload,
  Camera,
  Type,
  Shield,
  AlertTriangle,
  AlertCircle,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import SmartProgressDashboard from '@/components/SmartProgressDashboard';

// ==================== INTERFACES ====================

interface DashboardData {
  student_id: string;
  profile: {
    student_id: string;
    xp_total: number;
    streak_days: number;
    last_active: string;
  };
  summary: {
    total_sessions: number;
    total_messages: number;
    total_correct_answers: number;
    total_incorrect_answers: number;
    accuracy_rate: number;
    chat_sessions: number;
    teaching_sessions: number;
    learning_sessions: number;
  };
  by_tutor_type: {
    maths: { sessions: number; messages: number };
    science: { sessions: number; messages: number };
    homework: { sessions: number; messages: number };
  };
  recent_sessions: Array<{
    session_id: string;
    session_type: string;
    tutor_type: string;
    topic: string | null;
    last_activity: string;
    message_count: number;
  }>;
  mastery_data: {
    topic_id: string;
    topic_name: string;
    subject: string;
    mastery_percent: number;
    attempts: number;
    error_tags: string[];
    last_practiced: string;
    status: 'secure' | 'developing' | 'at_risk';
  }[];
  learning_streak: {
    current_streak_days: number;
    best_streak_days: number;
    weekly_xp: number;
    weekly_goal_xp: number;
    xp_today: number;
    daily_goal_xp: number;
  };
  recommended_lesson?: {
    topic_id: string;
    topic_name: string;
    subject: string;
    year_group: string;
    mastery_percent: number;
    goal_mastery: number;
    last_activity: string;
    struggled_with: string;
    time_needed: number;
    reason: string;
  };
}

interface TutorCard {
  id: 'maths' | 'science' | 'homework';
  name: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  gradient: string;
  features: string[];
}

interface TeachingStep {
  step: number;
  title: string;
  description: string;
  icon: any;
}

interface HomeworkUpload {
  type: 'image' | 'pdf' | 'typed';
  file?: File;
  preview?: string;
  question?: string;
}

// ==================== CONSTANTS ====================

const TUTORS: TutorCard[] = [
  {
    id: 'maths',
    name: 'Prof. Mathew',
    title: 'Maths Teacher',
    description: 'Master mathematics with live working-out, exam-board methods, and step-by-step guidance.',
    icon: Calculator,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    features: ['Live Working-Out', 'Exam-Board Methods', 'Step-by-Step'],
  },
  {
    id: 'science',
    name: 'Dr. Science',
    title: 'Science Teacher',
    description: 'Explore biology, chemistry, and physics with concept-based learning and video integration.',
    icon: FlaskConical,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    features: ['Concept-Based', 'Video Lessons', 'Interactive'],
  },
  {
    id: 'homework',
    name: 'Helper Bot',
    title: 'Homework Tutor',
    description: 'Get scaffolded homework help with anti-cheating protection and mistake correction.',
    icon: FileText,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    features: ['Mistake Analysis', 'Guided Help', 'Upload Support'],
  },
];

const TEACHING_STEPS: TeachingStep[] = [
  { step: 1, title: 'Confirm', description: 'Year + Topic', icon: Target },
  { step: 2, title: 'Diagnostic', description: 'Micro-Check', icon: Brain },
  { step: 3, title: 'Teach', description: 'Small Chunk', icon: BookOpen },
  { step: 4, title: 'Example', description: 'Guided', icon: Lightbulb },
  { step: 5, title: 'Attempt', description: 'Student Try', icon: PenToolIcon },
  { step: 6, title: 'Feedback', description: 'Review', icon: MessageSquare },
  { step: 7, title: 'Mastery', description: 'Check', icon: GraduationCap },
];

// ==================== HELPER COMPONENTS ====================

function PenToolIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DashboardPageEnhanced() {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<'maths' | 'science' | 'homework' | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [homeworkUpload, setHomeworkUpload] = useState<HomeworkUpload | null>(null);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [typedQuestion, setTypedQuestion] = useState('');
  const [currentTeachingStep, setCurrentTeachingStep] = useState(0);
  const [showTeachingFlow, setShowTeachingFlow] = useState(false);
  const [personalisationMode, setPersonalisationMode] = useState<'standard' | 'simplified' | 'visual'>('standard');
  const [safetyModeEnabled, setSafetyModeEnabled] = useState(true);

  const topicSelectorRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const dashboardResponse = await fetch(
          `http://localhost:5000/api/dashboard/${user.id}`
        );
        if (dashboardResponse.ok) {
          const result = await dashboardResponse.json();
          const data = result.data;

          const transformedData: DashboardData = {
            student_id: data.student.student_id,
            profile: {
              student_id: data.student.student_id,
              xp_total: 0,
              streak_days: 0,
              last_active: new Date().toISOString(),
            },
            summary: {
              total_sessions: data.summary.total_sessions,
              total_messages: data.summary.total_messages,
              total_correct_answers: 0,
              total_incorrect_answers: 0,
              accuracy_rate: data.summary.average_accuracy,
              chat_sessions: 0,
              teaching_sessions: 0,
              learning_sessions: 0,
            },
            by_tutor_type: {
              maths: { sessions: data.progress_by_tutor.maths, messages: 0 },
              science: { sessions: data.progress_by_tutor.science, messages: 0 },
              homework: { sessions: data.progress_by_tutor.homework, messages: 0 },
            },
            recent_sessions: data.recent_sessions.map((session: any) => ({
              session_id: session.session_id,
              session_type: session.type,
              tutor_type: session.type === 'learning' ? 'maths' : 'homework',
              topic: session.topic_name,
              last_activity: session.created_at,
              message_count: 0,
            })),
            mastery_data: [],
            learning_streak: {
              current_streak_days: 0,
              best_streak_days: 0,
              weekly_xp: 0,
              weekly_goal_xp: 1500,
              xp_today: 0,
              daily_goal_xp: 500,
            },
          };

          setDashboardData(transformedData);
        }

        const streakResponse = await fetch(
          `http://localhost:5000/api/dashboard/streak/${user.id}`
        );
        if (streakResponse.ok) {
          const streakData = await streakResponse.json();
          if (streakData.data) {
            setDashboardData(prev => prev ? {
              ...prev,
              learning_streak: {
                ...prev.learning_streak,
                current_streak_days: streakData.data.current_streak,
              },
            } : null);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle tutor selection
  const handleTutorSelect = (tutorId: 'maths' | 'science' | 'homework') => {
    setSelectedTutor(tutorId);
    if (tutorId === 'homework') {
      setShowHomeworkModal(true);
    } else {
      setShowTopicSelector(true);
      setTimeout(() => {
        topicSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    // In real implementation, fetch topics for this year
  };

  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setShowTeachingFlow(true);
    setCurrentTeachingStep(1);
  };

  // Start lesson
  const handleStartLesson = () => {
    setCurrentTeachingStep(1);
    setShowTeachingFlow(true);
  };

  // Handle homework upload
  const handleHomeworkUpload = (type: 'image' | 'pdf' | 'typed') => {
    setHomeworkUpload({ type });
    if (type === 'typed') {
      // Show text input
    }
  };

  // Submit homework
  const handleSubmitHomework = () => {
    // Process homework with AI
    setShowHomeworkModal(false);
    setShowTeachingFlow(true);
    setCurrentTeachingStep(1);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading your learning hub...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const studentName =
    user.fullName ||
    user.emailAddresses[0]?.emailAddress.split('@')[0] ||
    'Student';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentStreak = dashboardData?.learning_streak?.current_streak_days || 0;
  const xpToday = dashboardData?.learning_streak?.xp_today || 0;
  const weeklyGoalXP = dashboardData?.learning_streak?.weekly_goal_xp || 1500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ================= HEADER ================= */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* User Greeting */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {getGreeting()}, {studentName}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome to your AI Learning Hub
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Streak */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Current Streak</p>
                  <p className="text-sm font-bold text-orange-700">{currentStreak} days</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm min-w-[200px]">
                <Zap className="w-5 h-5 text-blue-500" fill="currentColor" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-medium">XP Today</p>
                    <p className="text-xs font-semibold text-blue-600">{xpToday} / {weeklyGoalXP}</p>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((xpToday / weeklyGoalXP) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Teacher Dashboard Link */}
              <Link
                href="/teacher"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-md font-medium text-sm"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Teacher Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TEACHING FLOW INDICATOR */}
        <AnimatePresence>
          {showTeachingFlow && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Learning Session in Progress</h2>
                    <p className="text-sm text-gray-500">{selectedTutor === 'maths' ? 'Prof. Mathew' : selectedTutor === 'science' ? 'Dr. Science' : 'Helper Bot'} • {selectedTopic}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTeachingFlow(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 7-Step Teaching Flow */}
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {TEACHING_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index + 1 === currentTeachingStep;
                  const isCompleted = index + 1 < currentTeachingStep;
                  
                  return (
                    <div key={step.step} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <StepIcon className="w-6 h-6" />
                          )}
                        </div>
                        <div className="text-center mt-2">
                          <p className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-400 hidden md:block">{step.description}</p>
                        </div>
                      </div>
                      {index < TEACHING_STEPS.length - 1 && (
                        <div className={`w-8 md:w-16 h-1 mx-2 rounded ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SMART PROGRESS DASHBOARD */}
        <div className="mb-8">
          <SmartProgressDashboard studentId={user?.id || ''} compact />
        </div>

        {/* TUTOR SELECTION SECTION */}
        {!showTeachingFlow && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Choose Your AI Tutor</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TUTORS.map((tutor, index) => {
                const TutorIcon = tutor.icon;
                const isSelected = selectedTutor === tutor.id;
                
                return (
                  <motion.div
                    key={tutor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleTutorSelect(tutor.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? `border-${tutor.color}-500 shadow-xl`
                        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                    } bg-white`}
                  >
                    {/* Gradient Header */}
                    <div className={`h-24 bg-gradient-to-r ${tutor.gradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/10" />
                      <div className="absolute -right-4 -bottom-4 opacity-20">
                        <TutorIcon className="w-32 h-32 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tutor.gradient} flex items-center justify-center -mt-12 shadow-lg`}>
                          <TutorIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{tutor.name}</h3>
                          <p className="text-xs text-gray-500">{tutor.title}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{tutor.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {tutor.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <button
                        className={`w-full py-2.5 rounded-lg font-semibold transition ${
                          isSelected
                            ? `bg-gradient-to-r ${tutor.gradient} text-white`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? 'Selected ✓' : 'Select Tutor'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TOPIC SELECTOR */}
        <AnimatePresence>
          {showTopicSelector && selectedTutor && selectedTutor !== 'homework' && (
            <motion.div
              ref={topicSelectorRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedTutor === 'maths' ? 'Maths' : 'Science'} Curriculum
                </h2>
              </div>

              {/* Year Group Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Step 1: Select Your Year Group</h3>
                <div className="flex flex-wrap gap-3">
                  {['KS1', 'KS2', 'KS3', 'KS4', 'KS5'].map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        selectedYear === year
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selection */}
              {selectedYear && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Step 2: Select a Topic</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {['Algebra', 'Fractions', 'Geometry', 'Statistics', 'Probability', 'Calculus'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => handleTopicSelect(topic)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTopic === topic
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 text-sm">{topic}</p>
                        <p className="text-xs text-gray-500 mt-1">45 chunks</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Start Learning Button */}
              {selectedTopic && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <GraduationCap className="w-8 h-8 text-emerald-600" />
                    <h3 className="text-lg font-bold text-emerald-900">Ready to Learn!</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Starting <span className="font-semibold">{selectedTopic}</span> with{' '}
                    <span className="font-semibold">
                      {selectedTutor === 'maths' ? 'Prof. Mathew' : 'Dr. Science'}
                    </span>
                  </p>
                  <button
                    onClick={handleStartLesson}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Start Learning
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HOMEWORK UPLOAD MODAL */}
        <AnimatePresence>
          {showHomeworkModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHomeworkModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Homework Help</h2>
                        <p className="text-sm text-gray-500">Upload your question for AI analysis</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowHomeworkModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Upload Options */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => handleHomeworkUpload('image')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        homeworkUpload?.type === 'image'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-semibold text-gray-900">Photo</p>
                      <p className="text-xs text-gray-500 mt-1">Take a picture</p>
                    </button>

                    <button
                      onClick={() => handleHomeworkUpload('pdf')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        homeworkUpload?.type === 'pdf'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-semibold text-gray-900">PDF</p>
                      <p className="text-xs text-gray-500 mt-1">Upload file</p>
                    </button>

                    <button
                      onClick={() => handleHomeworkUpload('typed')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        homeworkUpload?.type === 'typed'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Type className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-semibold text-gray-900">Type</p>
                      <p className="text-xs text-gray-500 mt-1">Enter text</p>
                    </button>
                  </div>

                  {/* Typed Question Input */}
                  {homeworkUpload?.type === 'typed' && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={typedQuestion}
                        onChange={(e) => setTypedQuestion(e.target.value)}
                        placeholder="Type your homework question here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={6}
                      />
                    </div>
                  )}

                  {/* Safety Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Learning First Approach</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Helper Bot won't give direct answers. Instead, it will guide you with hints,
                          similar examples, and step-by-step scaffolding to help you learn.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitHomework}
                    disabled={!homeworkUpload || (homeworkUpload.type === 'typed' && !typedQuestion.trim())}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Submit for Analysis
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSONALISATION & SAFETY SETTINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Personalisation Engine */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Personalisation Engine</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              AI adjusts explanation style based on your mistakes and confidence signals
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setPersonalisationMode('standard')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  personalisationMode === 'standard'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Standard</p>
                    <p className="text-xs text-gray-500">Balanced explanations</p>
                  </div>
                  {personalisationMode === 'standard' && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPersonalisationMode('simplified')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  personalisationMode === 'simplified'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Simplified</p>
                    <p className="text-xs text-gray-500">After 2+ incorrect attempts</p>
                  </div>
                  {personalisationMode === 'simplified' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPersonalisationMode('visual')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  personalisationMode === 'visual'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Visual + Analogies</p>
                    <p className="text-xs text-gray-500">For conceptual understanding</p>
                  </div>
                  {personalisationMode === 'visual' && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Safety & Anti-Cheating */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Safety & Integrity</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Protected learning environment with safeguarding and exam integrity
            </p>

            <div className="space-y-4">
              {/* Safety Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Safeguarding Detection</p>
                    <p className="text-xs text-gray-500">Monitors for distress signals</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Anti-Cheating */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Anti-Cheating Mode</p>
                    <p className="text-xs text-gray-500">Hints instead of answers</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Error Tracking */}
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Error Pattern Tracking</p>
                    <p className="text-xs text-gray-500">Identifies misconceptions</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-purple-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT SESSIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Recent Learning Sessions</h2>
            </div>
            <Link
              href="/progress"
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              View All →
            </Link>
          </div>

          {dashboardData?.recent_sessions && dashboardData.recent_sessions.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_sessions.slice(0, 5).map((session, index) => (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.tutor_type === 'maths' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {session.tutor_type === 'maths' ? (
                        <Calculator className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{session.topic || 'Untitled Session'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.last_activity).toLocaleDateString()} • {session.tutor_type}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sessions yet. Start learning to track your progress!</p>
              <Link
                href="/tutor?type=maths"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Start Your First Lesson →
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2026 AI Learning Hub. Structured AI tutoring for school-ready learning.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/progress" className="text-sm text-gray-600 hover:underline">
                Progress Dashboard
              </Link>
              <Link href="/teacher" className="text-sm text-gray-600 hover:underline">
                Teacher View
              </Link>
              <Link href="/settings" className="text-sm text-gray-600 hover:underline">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
