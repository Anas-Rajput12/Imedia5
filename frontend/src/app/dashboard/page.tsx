'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  Flame,
  Zap,
  Target,
  BookOpen,
  Brain,
  Award,
  Users
} from 'lucide-react';
import MasteryTrackingPanel from '@/components/MasteryTrackingPanel';
import ErrorAnalysisDisplay from '@/components/ErrorAnalysisDisplay';
import SmartProgressDashboard from '@/components/SmartProgressDashboard';

interface SessionStats {
  session_id: string;
  tutor_type: string;
  topic: string | null;
  total_messages: number;
  correct_answers: number;
  incorrect_answers: number;
  difficulty_level: string;
  started_at: string;
  last_activity_at: string;
}

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

interface DailySummary {
  student_id: string;
  date: string;
  streak: {
    days: number;
    xp_bonus: number;
  };
  xp: {
    total: number;
    today: number;
    current: number;
    goal: number;
  };
  missions: {
    total: number;
    completed: number;
    progress_percent: number;
  };
  motivational_message: string;
}

interface Mission {
  mission_id: string;
  mission_type: string;
  title: string;
  description: string;
  xp_reward: number;
  progress_current: number;
  progress_target: number;
  is_completed: boolean;
}

interface RecommendedLesson {
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
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionStats[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [recommendedLesson, setRecommendedLesson] = useState<RecommendedLesson | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ragDailyLesson, setRagDailyLesson] = useState<any | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch RAG-based daily lesson from uploaded documents
        setRagLoading(true);
        try {
          const ragLessonResponse = await fetch(
            `http://localhost:5000/api/lessons/daily?student_id=${user.id}`
          );
          if (ragLessonResponse.ok) {
            const ragResult = await ragLessonResponse.json();
            if (ragResult.data) {
              setRagDailyLesson({
                topic: ragResult.data.topic || ragResult.data.topic_name,
                subject: ragResult.data.subject,
                slides: ragResult.data.slides || [],
                isComplete: ragResult.data.isComplete || false,
              });
            }
          }
        } catch (ragError) {
          console.warn('RAG daily lesson not available:', ragError);
        } finally {
          setRagLoading(false);
        }

        // Fetch comprehensive dashboard data from SMART AI Teacher backend
        const [dashboardSummary, recentSessionsData, masteryData, progressDashboard] = await Promise.all([
          fetch(`http://localhost:5000/api/dashboard/summary/${user.id}`).then(r => r.ok ? r.json() : null),
          fetch(`http://localhost:5000/api/dashboard/recent-sessions/${user.id}`).then(r => r.ok ? r.json() : null),
          fetch(`http://localhost:5000/api/dashboard/mastery/${user.id}`).then(r => r.ok ? r.json() : null),
          fetch(`http://localhost:5000/api/dashboard/progress-dashboard/${user.id}`).then(r => r.ok ? r.json() : null),
        ]);

        if (dashboardSummary?.data) {
          const data = dashboardSummary.data;

          // Transform SMART AI Teacher data to match frontend expectations
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
              total_correct_answers: data.summary.total_correct_answers,
              total_incorrect_answers: data.summary.total_incorrect_answers,
              accuracy_rate: data.summary.average_accuracy,
              chat_sessions: 0,
              teaching_sessions: data.summary.total_sessions,
              learning_sessions: data.summary.total_sessions,
            },
            by_tutor_type: {
              maths: { sessions: data.progress_by_tutor.maths, messages: 0 },
              science: { sessions: data.progress_by_tutor.science, messages: 0 },
              homework: { sessions: data.progress_by_tutor.homework, messages: 0 },
            },
            recent_sessions: (recentSessionsData?.data || []).map((session: any) => ({
              session_id: session.session_id,
              session_type: session.type,
              tutor_type: session.tutor_type,
              topic: session.topic_name,
              last_activity: session.created_at,
              message_count: session.message_count,
            })),
            mastery_data: (masteryData?.data || []).map((m: any) => ({
              topic_id: m.topic_id,
              topic_name: m.topic_name,
              subject: m.subject,
              mastery_percent: m.mastery_percent,
              attempts: m.attempts_count,
              error_tags: m.error_tags,
              last_practiced: m.last_practiced,
              status: m.status,
            })),
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
          setRecentSessions(transformedData.recent_sessions as any);
        }

        // Update progress dashboard from SMART AI Teacher
        if (progressDashboard?.data) {
          // Progress dashboard data is handled by SmartProgressDashboard component
        }

        // Fetch recommended lesson from backend-express
        const recommendedResponse = await fetch(
          `http://localhost:5000/api/dashboard/recommendations/${user.id}`
        );
        if (recommendedResponse.ok) {
          const result = await recommendedResponse.json();
          if (result.data) {
            setRecommendedLesson(result.data);
          }
        }

        // Fetch daily summary and missions from backend-express
        const dailyResponse = await fetch(
          `http://localhost:5000/api/daily-missions/${user.id}`
        );
        if (dailyResponse.ok) {
          const missionsData = await dailyResponse.json();
          if (missionsData.data) {
            setDailySummary({
              student_id: user.id,
              date: new Date().toISOString(),
              streak: { days: 0, xp_bonus: 0 },
              xp: { total: 0, today: 0, current: 0, goal: 500 },
              missions: { total: 0, completed: 0, progress_percent: 0 },
              motivational_message: 'Keep learning!',
            });
            if (missionsData.data.missions) {
              setMissions(missionsData.data.missions);
            }
          }
        }

        // Fetch streak data
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const studentName =
    user.fullName ||
    user.emailAddresses[0]?.emailAddress.split('@')[0] ||
    'Student';

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Use REAL database data with proper fallbacks
  const totalSessions = dashboardData?.summary.total_sessions || 0;
  const totalMessages = dashboardData?.summary.total_messages || 0;
  const accuracyRate = dashboardData?.summary.accuracy_rate || 0;
  const currentStreak = dashboardData?.learning_streak?.current_streak_days || dailySummary?.streak?.days || 0;
  const currentXP = dashboardData?.learning_streak?.xp_today || dailySummary?.xp?.today || 0;
  const weeklyXP = dashboardData?.learning_streak?.weekly_xp || 0;
  const weeklyGoalXP = dashboardData?.learning_streak?.weekly_goal_xp || 1500;
  const currentMastery = recommendedLesson?.mastery_percent || dashboardData?.mastery_data?.[0]?.mastery_percent || 0;
  const goalMastery = recommendedLesson?.goal_mastery || 85;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b sticky top-0 z-50">
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
                  Let's keep building your maths confidence.
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 flex-wrap">
              {/* Teacher Dashboard Link */}
              <Link
                href="/teacher"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-md font-medium text-sm"
              >
                <Users className="w-4 h-4" />
                Teacher Dashboard
              </Link>

              {/* Streak */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Current Streak</p>
                  <p className="text-sm font-bold text-orange-700">
                    {currentStreak} days
                  </p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-sm min-w-[200px]">
                <Zap className="w-5 h-5 text-blue-500" fill="currentColor" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-medium">XP Progress</p>
                    <p className="text-xs font-semibold text-blue-600">
                      {currentXP} / {weeklyGoalXP}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((currentXP / weeklyGoalXP) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* SMART Progress Dashboard - Secure/Developing/At Risk */}
        {/* <div className="mb-8">
          <SmartProgressDashboard studentId={user?.id || ''} />
        </div> */}

        {/* RAG DAILY LESSON - From Uploaded Documents */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-emerald-900">Today's Lesson - From Your Documents</h2>
              {ragLoading && (
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin ml-2" />
              )}
            </div>

            {ragDailyLesson ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{ragDailyLesson.topic}</h3>
                    <p className="text-sm text-gray-600 mt-1">Subject: {ragDailyLesson.subject}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    ragDailyLesson.isComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ragDailyLesson.isComplete ? ' Completed' : ' Ready to Start'}
                  </span>
                </div>

                {ragDailyLesson.slides && ragDailyLesson.slides.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-emerald-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lesson Slides:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ragDailyLesson.slides.slice(0, 4).map((slide: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-900">Slide {slide.slideNumber}</p>
                          <p className="text-xs text-gray-600 mt-1">{slide.slideType}</p>
                          <p className="text-xs font-semibold text-gray-800 mt-2 line-clamp-2">{slide.title}</p>
                        </div>
                      ))}
                    </div>
                    {ragDailyLesson.slides.length > 4 && (
                      <p className="text-xs text-gray-500 mt-3 text-center">+ {ragDailyLesson.slides.length - 4} more slides</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/tutor?type=${ragDailyLesson.subject?.toLowerCase() || 'maths'}`}
                    className="flex-1 bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-md"
                  >
                    Start Lesson →
                  </Link>
                  <button className="flex-1 border border-emerald-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-50 transition text-emerald-700">
                    View Slides
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {ragLoading ? (
                  <p>Loading today's lesson from your documents...</p>
                ) : (
                  <div>
                    <p className="mb-3">No lesson generated yet from your uploaded documents.</p>
                    <Link
                      href="/tutor?type=maths"
                      className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-md"
                    >
                      Start Learning →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TOP SECTION: AI Recommended + Today's Missions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* AI RECOMMENDED CARD */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">AI Recommended</span>
            </div>

            {recommendedLesson ? (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {recommendedLesson.topic_name}
                </h2>

                <p className="text-sm text-gray-500 mb-6 italic">
                  "{recommendedLesson.reason}"
                </p>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Mastery Circle */}
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="42"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-blue-600 transition-all duration-1000"
                          strokeWidth="8"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * recommendedLesson.mastery_percent) / 100}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="42"
                          cx="50"
                          cy="50"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-blue-600">{recommendedLesson.mastery_percent}%</span>
                        <span className="text-xs text-gray-500">Current</span>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                        <p className="text-sm font-medium text-gray-900">
                          {recommendedLesson.last_activity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time Needed</p>
                        <p className="text-sm font-medium text-gray-900">
                          ~{recommendedLesson.time_needed} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Your Goal</p>
                        <p className="text-sm font-medium text-purple-600">
                          Reach Secure ({recommendedLesson.goal_mastery}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          recommendedLesson.mastery_percent >= recommendedLesson.goal_mastery
                            ? 'bg-green-100 text-green-700'
                            : recommendedLesson.mastery_percent >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {recommendedLesson.mastery_percent >= recommendedLesson.goal_mastery ? 'Secure' : recommendedLesson.mastery_percent >= 50 ? 'Developing' : 'At Risk'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Link
                        href={`/tutor?type=${recommendedLesson.subject}`}
                        className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md"
                      >
                        Resume Lesson
                      </Link>
                      <button className="flex-1 border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        Practise first
                      </button>
                      <button className="text-blue-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
                        Try another explanation
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recommendations available yet. Start learning to get personalized recommendations!</p>
                <Link
                  href="/tutor?type=maths"
                  className="mt-4 inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-md"
                >
                  Start Learning →
                </Link>
              </div>
            )}
          </div>

          {/* TODAY'S MISSIONS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Today's Missions
            </h3>

            <div className="space-y-3">
              {missions.length > 0 ? (
                // Show REAL missions from database
                missions.map((mission, index) => {
                  const progressPercent = mission.progress_target > 0 
                    ? Math.round((mission.progress_current / mission.progress_target) * 100) 
                    : 0;
                  
                  const getMissionColor = (type: string) => {
                    if (type.includes('weak') || type.includes('fix')) return 'yellow';
                    if (type.includes('review') || type.includes('spaced')) return 'blue';
                    if (type.includes('confidence') || type.includes('boost')) return 'green';
                    return 'purple';
                  };
                  
                  const color = getMissionColor(mission.mission_type);
                  const colorClasses: Record<string, string> = {
                    yellow: 'from-yellow-50 to-amber-50 border-yellow-200',
                    blue: 'from-blue-50 to-indigo-50 border-blue-200',
                    green: 'from-green-50 to-emerald-50 border-green-200',
                    purple: 'from-purple-50 to-pink-50 border-purple-200',
                  };
                  
                  const iconMap: Record<string, JSX.Element> = {
                    yellow: <Target className="w-5 h-5 text-yellow-600" />,
                    blue: <BookOpen className="w-5 h-5 text-blue-600" />,
                    green: <Award className="w-5 h-5 text-green-600" />,
                    purple: <Zap className="w-5 h-5 text-purple-600" />,
                  };

                  const strokeOffset = 88 - (88 * progressPercent) / 100;

                  return (
                    <div key={mission.mission_id} className={`bg-gradient-to-br p-4 rounded-xl border ${colorClasses[color] || colorClasses.purple}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {iconMap[color] || iconMap.purple}
                          <p className="font-semibold text-sm text-gray-800">{mission.title}</p>
                        </div>
                        <div className="relative w-8 h-8">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <circle className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" />
                            <circle 
                              className={color === 'yellow' ? 'text-yellow-500' : color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : 'text-purple-500'} 
                              strokeWidth="3" 
                              strokeDasharray="88" 
                              strokeDashoffset={strokeOffset} 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="14" 
                              cx="18" 
                              cy="18" 
                              transform="rotate(-90 18 18)" 
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{progressPercent}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{mission.description}</p>
                      {mission.is_completed && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Completed! +{mission.xp_reward} XP
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Show dummy missions only if no data from database
                <>
                  {/* Fix a Weak Spot */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-yellow-600" />
                        <p className="font-semibold text-sm text-yellow-800">Fix a Weak Spot</p>
                      </div>
                      <div className="relative w-8 h-8">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" />
                          <circle className="text-yellow-500" strokeWidth="3" strokeDasharray="88" strokeDashoffset="53" strokeLinecap="round" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" transform="rotate(-90 18 18)" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-700">40%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Equivalent fractions — 5 quick questions</p>
                  </div>

                  {/* Spaced Review Quiz */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-sm text-blue-800">Spaced Review Quiz</p>
                      </div>
                      <div className="relative w-8 h-8">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" />
                          <circle className="text-blue-500" strokeWidth="3" strokeDasharray="88" strokeDashoffset="88" strokeLinecap="round" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" transform="rotate(-90 18 18)" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-700">0%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Quick recall from last week</p>
                  </div>

                  {/* Confidence Boost */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-sm text-green-800">Confidence Boost</p>
                      </div>
                      <div className="relative w-8 h-8">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" />
                          <circle className="text-green-500" strokeWidth="3" strokeDasharray="88" strokeDashoffset="26" strokeLinecap="round" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" transform="rotate(-90 18 18)" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-700">70%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">Algebra: basic factoring expressions</p>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/tutor?type=maths"
              className="mt-4 block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
            >
              Start Learning →
            </Link>
          </div>
        </div>

        {/* WEEK PROGRESS - SMART AI Teacher Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-6">This Week's Progress</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Mastery Gain */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                {dashboardData?.mastery_data?.length ? Math.round(dashboardData.mastery_data.reduce((acc, m) => acc + m.mastery_percent, 0) / dashboardData.mastery_data.length) : 0}%
              </p>
              <p className="text-sm text-gray-600">Avg mastery</p>
            </div>

            {/* Errors Corrected */}
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">
                {dashboardData?.summary.total_correct_answers || 0}
              </p>
              <p className="text-sm text-gray-600">Correct answers</p>
            </div>

            {/* Sessions Completed */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-1">
                {dashboardData?.summary.total_sessions || 0}
              </p>
              <p className="text-sm text-gray-600">Sessions</p>
            </div>

            {/* Streak Active */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Flame className="w-6 h-6 text-orange-600" fill="currentColor" />
              </div>
              <p className="text-3xl font-bold text-orange-600 mb-1">
                {currentStreak}-day
              </p>
              <p className="text-sm text-gray-600">Streak active</p>
            </div>
          </div>
        </div>

        {/* MASTERY TRACKING & ERROR ANALYSIS */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MasteryTrackingPanel studentId={user.id} compact={false} />
            <ErrorAnalysisDisplay studentId={user.id} compact={false} />
          </div>
        )}

        {/* PICK YOUR TUTOR - SMART AI Teacher System */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pick Your Tutor</h2>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">4-Layer SMART AI System</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Maths Tutor - Prof. Mathew */}
            <Link href="/tutor?type=maths" className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-md group-hover:shadow-xl transition duration-300 group-hover:scale-105 h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <img
                  src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Maths Tutor"
                  className="w-full h-80 object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📐</span>
                    <h3 className="text-xl font-bold text-white">Maths with Prof. Mathew</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-3">
                    {dashboardData?.by_tutor_type?.maths?.sessions || 0} sessions • {dashboardData?.by_tutor_type?.maths?.messages || 0} messages
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                      Step-by-Step Working
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500 text-white">
                      UK Curriculum
                    </span>
                  </div>
                  <p className="text-white/80 text-xs">
                    Exam-board approved methods (AQA/Edexcel/OCR). Live worked examples with full method showing.
                  </p>
                </div>
              </div>
            </Link>

            {/* Science Tutor - Dr. Science */}
            <Link href="/tutor?type=science" className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-md group-hover:shadow-xl transition duration-300 group-hover:scale-105 h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <img
                  src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Science Tutor"
                  className="w-full h-80 object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔬</span>
                    <h3 className="text-xl font-bold text-white">Science with Dr. Science</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-3">
                    {dashboardData?.by_tutor_type?.science?.sessions || 0} sessions • {dashboardData?.by_tutor_type?.science?.messages || 0} messages
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                      Question-Led
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                      Video-Supported
                    </span>
                  </div>
                  <p className="text-white/80 text-xs">
                    Physics, Chemistry & Biology. Interactive concepts with "why" and "how" questions throughout.
                  </p>
                </div>
              </div>
            </Link>

            {/* Homework Tutor - Teacher Alex */}
            <Link href="/tutor?type=homework" className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-md group-hover:shadow-xl transition duration-300 group-hover:scale-105 h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <img
                  src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Homework Tutor"
                  className="w-full h-80 object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📚</span>
                    <h3 className="text-xl font-bold text-white">Homework with Teacher Alex</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-3">
                    {dashboardData?.by_tutor_type?.homework?.sessions || 0} sessions • {dashboardData?.by_tutor_type?.homework?.messages || 0} messages
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                      Anti-Cheating
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-500 text-white">
                      Guided Support
                    </span>
                  </div>
                  <p className="text-white/80 text-xs">
                    I help you learn, not cheat. Scaffolded learning with similar examples. You solve your own homework!
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* SMART AI Teacher Features */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" fill="currentColor" />
              What Makes Our SMART AI Teacher Different?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h5 className="font-semibold text-gray-900">Curriculum Lock</h5>
                </div>
                <p className="text-sm text-gray-600">Only teaches from approved curriculum content. No hallucinations, no made-up facts.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h5 className="font-semibold text-gray-900">Personalisation Engine</h5>
                </div>
                <p className="text-sm text-gray-600">Adapts after 2 incorrect attempts. Simplifies language, adds analogies, provides scaffolds.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h5 className="font-semibold text-gray-900">Structured Flow</h5>
                </div>
                <p className="text-sm text-gray-600">Diagnostic → Teach → Example → Attempt → Feedback → Mastery. Real teaching, not chat drift.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  <h5 className="font-semibold text-gray-900">Safeguarding Built-In</h5>
                </div>
                <p className="text-sm text-gray-600">Detects emotional distress, self-harm, and cheating. Escalates when needed. School-grade safety.</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
