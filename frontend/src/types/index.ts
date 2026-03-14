/**
 * Type definitions for SMART AI Teacher
 */

// ==================== Dashboard Types ====================

export interface DashboardData {
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
  mastery_data: Array<{
    topic_id: string;
    topic_name: string;
    subject: string;
    mastery_percent: number;
    attempts: number;
    error_tags: string[];
    last_practiced: string;
    status: 'secure' | 'developing' | 'at_risk';
  }>;
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

export interface DailySummary {
  student_id: string;
  date: string;
  streak: {
    days: number;
    xp_bonus: number;
  };
  xp: {
    total: number;
    today: number;
  };
  missions: {
    total: number;
    completed: number;
    progress_percent: number;
  };
  motivational_message: string;
}

export interface Mission {
  mission_id: string;
  mission_type: string;
  title: string;
  description: string;
  xp_reward: number;
  progress_current: number;
  progress_target: number;
  is_completed: boolean;
}

export interface RecommendedLesson {
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

// ==================== Tutor Types ====================

export interface CurriculumTopic {
  topic_id: string;
  topic_name: string;
  subject: string;
  year_level: number;
  learning_objectives: string[];
  teaching_notes: string;
  difficulty_level: string;
  estimated_duration_mins: number;
}

export interface TeachingSession {
  session_id: string;
  student_id: string;
  topic_id: string;
  current_step: number;
  step_name: string;
  mastery_percent: number;
  mastery_status: string;
}

export interface DiagnosticQuestion {
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correct_answer: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface DiagnosticResult {
  question_id: string;
  is_correct: boolean;
  student_answer: string;
  time_taken: number;
}

export interface WorkingStep {
  stepNumber: number;
  studentWorking: string;
  isCorrect: boolean;
  errorType?: 'method' | 'arithmetic' | 'misconception';
  correction?: string;
  explanation?: string;
}

// ==================== Teacher Dashboard Types ====================

export interface Student {
  student_id: string;
  name: string;
  email: string;
  year_group: string;
  average_mastery: number;
  total_sessions: number;
  integrity_flags: number;
  safeguarding_alerts: number;
  last_active: string;
}

export interface SafeguardingAlert {
  log_id: string;
  student_id: string;
  student_name: string;
  concern_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  status: 'new' | 'escalated' | 'resolved';
  requires_follow_up: boolean;
}

export interface IntegrityFlag {
  attempt_id: string;
  student_id: string;
  student_name: string;
  topic: string;
  timestamp: string;
  request_type: string;
  acted_on_help: boolean;
}

// ==================== Video Types ====================

export interface ApprovedVideo {
  video_id: string;
  youtube_id: string;
  title: string;
  description: string;
  subject: string;
  topic_id: string;
  duration_seconds: number;
  duration_formatted: string;
  youtube_url: string;
  embed_url: string;
}

// ==================== Analogy Types ====================

export interface Analogy {
  type: 'visual' | 'real_world' | 'simplified';
  title: string;
  description: string;
  icon?: string;
}

// ==================== Learning Objective Types ====================

export interface LearningObjective {
  id: string;
  text: string;
  completed: boolean;
}

// ==================== Scaffold Types ====================

export interface ScaffoldStep {
  step: number;
  name: string;
  description: string;
}

export const SCAFFOLD_STEPS: ScaffoldStep[] = [
  { step: 1, name: 'Break Down', description: 'Break the problem into parts' },
  { step: 2, name: 'Similar Example', description: 'Show a similar problem' },
  { step: 3, name: 'Guided Attempt', description: 'Let student try with guidance' },
  { step: 4, name: 'Feedback', description: 'Provide detailed feedback' },
  { step: 5, name: 'Return to Original', description: 'Return to original question' },
];

// ==================== Teaching Step Types ====================

export interface TeachingStep {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export const TEACHING_STEPS: TeachingStep[] = [
  { id: 1, name: 'Confirm', icon: '', description: 'Confirm year group + topic' },
  { id: 2, name: 'Diagnostic', icon: '', description: 'Diagnostic micro-check' },
  { id: 3, name: 'Teach', icon: '', description: 'Teach in small chunk' },
  { id: 4, name: 'Example', icon: '', description: 'Guided example' },
  { id: 5, name: 'Attempt', icon: '', description: 'Student attempt' },
  { id: 6, name: 'Feedback', icon: '', description: 'Feedback' },
  { id: 7, name: 'Mastery', icon: '', description: 'Mastery check' },
];

// ==================== Exam Board Types ====================

export type ExamBoard = 'AQA' | 'Edexcel' | 'OCR' | 'Cambridge' | 'UK KS2' | 'UK KS3' | 'General';

export const EXAM_BOARDS: Record<string, ExamBoard[]> = {
  '5': ['UK KS2', 'General'],
  '6': ['UK KS2', 'General'],
  '7': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '8': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '9': ['UK KS3', 'AQA', 'Edexcel', 'OCR', 'General'],
  '10': ['AQA', 'Edexcel', 'OCR', 'Cambridge', 'General'],
  '11': ['AQA', 'Edexcel', 'OCR', 'Cambridge', 'General'],
};
