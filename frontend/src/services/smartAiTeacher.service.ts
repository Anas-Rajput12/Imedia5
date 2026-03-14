/**
 * SMART AI Teacher API Service
 *
 * Frontend service for interacting with the SMART AI Teacher backend.
 * Implements the 7-step teaching flow with 3 specialized tutors.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth headers (optional - for future Clerk integration)
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  try {
    const token = localStorage.getItem('clerk_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Ignore errors
  }
  
  return {};
}

// ==================== INTERFACES ====================

export interface DiagnosticQuestion {
  id: string;
  question: string;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  final_answer: string;
  method_notes: string;
  exam_tips: string[];
}

export interface TeachingChunk {
  title: string;
  content: string;
  key_points: string[];
  worked_examples: WorkedExample[];
  analogies: string[];
  visual_description: string;
  check_questions: string[];
  video_suggestion?: {
    title: string;
    youtubeId: string;
    duration: string;
    description: string;
    pausePrompt: string;
    resumeQuestion: string;
  };
}

export interface Feedback {
  is_correct: boolean;
  message: string;
  next_step: string;
  error_type?: 'arithmetic' | 'method' | 'misconception' | 'careless';
  correct_answer?: string;
  adaptation?: 'simplify' | 'challenge' | 'scaffold' | 'visual_analogy';
  scaffolded_steps?: string[];
  visual_analogy?: string;
  encouragement: string;
}

export interface ProgressMetrics {
  mastery_percent: number;
  attempts_count: number;
  error_tags: string[];
  last_practiced: string;
  confidence_signal: number;
  status: 'secure' | 'developing' | 'at_risk';
  trend: 'improving' | 'stable' | 'declining';
}

export interface CurriculumLockCheck {
  locked: boolean;
  topicId: string;
  topicExists: boolean;
  contextRetrieved: boolean;
  confidenceThreshold: number;
  actualConfidence: number;
  message: string;
  clarifying_question?: string;
}

export interface SafeguardingAlert {
  detected: boolean;
  type: 'emotional_distress' | 'self_harm' | 'harmful_topic' | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  response: string;
  trusted_adult_prompt: string;
  escalate: boolean;
}

export interface IntegrityViolation {
  detected: boolean;
  type: 'direct_answer_request' | 'homework_cheat' | 'exam_cheat';
  response: string;
}

export interface StartSessionResponse {
  success: boolean;
  session_id: string;
  topic_id: string;
  tutor_type: 'maths' | 'science' | 'homework';
  tutor_name: string;
  curriculum_lock: CurriculumLockCheck;
  diagnostic_questions: DiagnosticQuestion[];
  welcome_message: string;
  next_step: 'diagnostic';
}

export interface SubmitDiagnosticResponse {
  success: boolean;
  session_id: string;
  diagnostic_score: number;
  adaptation: 'challenge' | 'standard' | 'simplify';
  message: string;
  teaching_chunk: TeachingChunk;
  next_step: 'teach';
}

export interface WorkedExampleResponse {
  success: boolean;
  session_id: string;
  worked_example: WorkedExample;
  tutor_type: string;
  next_step: 'student_attempt';
}

export interface SubmitAttemptResponse {
  success: boolean;
  session_id: string;
  feedback: Feedback;
  personalisation?: {
    trigger_type: string;
    adaptation: string;
    message: string;
    visual_analogy?: string;
    scaffolded_steps?: string[];
  };
  safeguarding?: SafeguardingAlert;
  integrity_violation?: IntegrityViolation;
  similar_example?: WorkedExample;
  hint?: string;
  progress: ProgressMetrics;
  next_step: 'mastery_check' | 'retry';
}

export interface MasteryCheckResponse {
  success: boolean;
  session_id: string;
  mastery_check: {
    questions: DiagnosticQuestion[];
    pass_threshold: number;
    instructions: string;
  };
  next_step: 'submit_mastery';
}

export interface CompleteSessionResponse {
  success: boolean;
  session_id: string;
  completed: boolean;
  mastery_passed: boolean;
  progress: ProgressMetrics;
  next_steps: string;
  recommendation: 'move_to_next_topic' | 'review_and_retry';
}

export interface ProgressDashboardResponse {
  success: boolean;
  student_id: string;
  dashboard: {
    topics: Array<{
      topic_id: string;
      topic_name: string;
      subject: string;
      mastery_percent: number;
      status: 'secure' | 'developing' | 'at_risk';
      attempts: number;
      last_practiced: string | null;
      error_tags: string[];
      confidence_signal: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
    summary: {
      secure_count: number;
      developing_count: number;
      at_risk_count: number;
      total_topics: number;
      overall_mastery: number;
    };
  };
}

// ==================== API SERVICE ====================

export const smartAiTeacherService = {
  /**
   * Start a new SMART teaching session
   */
  async startSession(
    topicId: string,
    tutorType: 'maths' | 'science' | 'homework',
    yearGroup?: string
  ): Promise<StartSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        tutorType,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start session');
    }

    return response.json();
  },

  /**
   * Generate diagnostic questions (standalone - without starting session)
   */
  async generateDiagnosticQuestions(
    topicId: string,
    tutorType: 'maths' | 'science' | 'homework',
    yearGroup?: string
  ): Promise<DiagnosticQuestion[]> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/diagnostic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        tutorType,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate diagnostic questions');
    }

    const data = await response.json();
    return data.questions || [];
  },

  /**
   * Submit diagnostic answers
   */
  async submitDiagnostic(
    sessionId: string,
    answers: { question: string; answer: string }[],
    topicId: string,
    tutorType: string,
    yearGroup?: string
  ): Promise<SubmitDiagnosticResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/submit-diagnostic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        sessionId,
        answers,
        topicId,
        tutorType,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit diagnostic');
    }

    return response.json();
  },

  /**
   * Get worked example
   */
  async getWorkedExample(
    sessionId: string,
    topicId: string,
    tutorType: string,
    yearGroup?: string,
    problem?: string
  ): Promise<WorkedExampleResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/example`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        sessionId,
        topicId,
        tutorType,
        yearGroup,
        problem,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get worked example');
    }

    return response.json();
  },

  /**
   * Submit student attempt
   */
  async submitAttempt(
    sessionId: string,
    answer: string,
    topicId: string,
    tutorType: string,
    yearGroup?: string,
    attempts?: number
  ): Promise<SubmitAttemptResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/submit-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        sessionId,
        answer,
        topicId,
        tutorType,
        yearGroup,
        attempts,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit attempt');
    }

    return response.json();
  },

  /**
   * Generate mastery check
   */
  async generateMasteryCheck(
    sessionId: string,
    topicId: string,
    tutorType: string,
    yearGroup?: string
  ): Promise<MasteryCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/mastery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        sessionId,
        topicId,
        tutorType,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate mastery check');
    }

    return response.json();
  },

  /**
   * Complete teaching session
   */
  async completeSession(
    sessionId: string,
    masteryPassed: boolean,
    topicId?: string,
    tutorType?: string
  ): Promise<CompleteSessionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/smart/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        sessionId,
        masteryPassed,
        topicId,
        tutorType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete session');
    }

    return response.json();
  },

  /**
   * Get progress dashboard
   */
  async getProgressDashboard(studentId: string): Promise<ProgressDashboardResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard/progress-dashboard/${studentId}`,
      {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get progress dashboard');
    }

    const data = await response.json();
    
    // Transform backend response to match frontend interface
    return {
      success: data.success,
      student_id: data.student_id,
      dashboard: {
        topics: [
          ...(data.secure_topics || []).map((t: any) => ({
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject: t.subject,
            mastery_percent: t.mastery_percent,
            status: 'secure' as const,
            attempts: 0,
            last_practiced: null,
            error_tags: [],
            confidence_signal: 0,
            trend: t.trend || 'stable' as const,
          })),
          ...(data.developing_topics || []).map((t: any) => ({
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject: t.subject,
            mastery_percent: t.mastery_percent,
            status: 'developing' as const,
            attempts: 0,
            last_practiced: null,
            error_tags: [],
            confidence_signal: 0,
            trend: t.trend || 'stable' as const,
          })),
          ...(data.at_risk_topics || []).map((t: any) => ({
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject: t.subject,
            mastery_percent: t.mastery_percent,
            status: 'at_risk' as const,
            attempts: 0,
            last_practiced: null,
            error_tags: [],
            confidence_signal: 0,
            trend: t.trend || 'stable' as const,
          })),
        ],
        summary: data.overview || {
          secure_count: data.status_summary?.secure || 0,
          developing_count: data.status_summary?.developing || 0,
          at_risk_count: data.status_summary?.at_risk || 0,
          total_topics: data.overview?.total_topics || 0,
          overall_mastery: data.overview?.overall_mastery_percent || 0,
        },
      },
    };
  },
};

export default smartAiTeacherService;
