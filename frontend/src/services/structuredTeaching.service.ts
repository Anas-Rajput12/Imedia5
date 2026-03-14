/**
 * Structured Teaching Flow Service
 * 
 * Frontend service for interacting with the Structured Teaching API.
 * Implements the mandatory 7-step teaching flow:
 * 1. Confirm year group + topic (Curriculum Lock via Qdrant)
 * 2. Diagnostic micro-check (1-3 questions)
 * 3. Teach in small chunk
 * 4. Guided example
 * 5. Student attempt
 * 6. Feedback with personalisation
 * 7. Mastery check before moving on (80% pass threshold)
 * 
 * All content generated via OpenRouter API
 * All curriculum validation via Qdrant
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Helper function to get auth headers
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
}

export interface Feedback {
  is_correct: boolean;
  message: string;
  next_step: string;
  error_type?: 'arithmetic' | 'method' | 'misconception' | 'careless';
  correct_answer?: string;
  scaffolded_steps?: string[];
  visual_analogy?: string;
  encouragement: string;
}

export interface CurriculumLockStatus {
  locked: boolean;
  topicExists: boolean;
  confidence: number;
  message: string;
  clarifying_question?: string;
}

export interface PersonalisationTrigger {
  triggered: boolean;
  triggerType: 'two_incorrect' | 'three_failed' | 'high_achiever';
  adaptation: 'simplify' | 'scaffold' | 'visual_analogy' | 'challenge';
  message: string;
  visual_analogy?: string;
  scaffolded_steps?: string[];
}

// ==================== API RESPONSES ====================

export interface StartSessionResponse {
  success: boolean;
  session_id: string;
  topic_id: string;
  tutor_type: 'maths' | 'science' | 'homework';
  tutor_name: string;
  curriculum_lock: CurriculumLockStatus;
  diagnostic_questions: DiagnosticQuestion[];
  welcome_message: string;
  next_step: 'diagnostic';
}

export interface SubmitDiagnosticResponse {
  success: boolean;
  session_id: string;
  diagnostic_score: number;
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
  personalisation?: PersonalisationTrigger;
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

export interface SubmitMasteryResponse {
  success: boolean;
  session_id: string;
  completed: boolean;
  mastery_passed: boolean;
  mastery_percent: number;
  next_steps: string;
  recommendation: 'move_to_next_topic' | 'review_and_retry';
}

// ==================== SERVICE ====================

export const structuredTeachingService = {
  /**
   * STEP 1: Start structured teaching session
   * Validates curriculum lock via Qdrant
   */
  async startSession(
    topicId: string,
    tutorType: 'maths' | 'science' | 'homework',
    yearGroup: string
  ): Promise<StartSessionResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/start`, {
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
    } catch (error) {
      console.error('Error starting structured session:', error);
      return null;
    }
  },

  /**
   * STEP 2: Submit diagnostic answers
   */
  async submitDiagnostic(
    sessionId: string,
    answers: Array<{ question: string; answer: string }>
  ): Promise<SubmitDiagnosticResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/diagnostic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId,
          answers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit diagnostic');
      }

      return response.json();
    } catch (error) {
      console.error('Error submitting diagnostic:', error);
      return null;
    }
  },

  /**
   * STEP 4: Get worked example
   */
  async getWorkedExample(
    sessionId: string,
    problem?: string
  ): Promise<WorkedExampleResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/example`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId,
          problem,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get worked example');
      }

      return response.json();
    } catch (error) {
      console.error('Error getting worked example:', error);
      return null;
    }
  },

  /**
   * STEP 5: Submit student attempt
   */
  async submitAttempt(
    sessionId: string,
    answer: string
  ): Promise<SubmitAttemptResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId,
          answer,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit attempt');
      }

      return response.json();
    } catch (error) {
      console.error('Error submitting attempt:', error);
      return null;
    }
  },

  /**
   * STEP 7: Generate mastery check
   */
  async generateMasteryCheck(
    sessionId: string
  ): Promise<MasteryCheckResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/mastery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate mastery check');
      }

      return response.json();
    } catch (error) {
      console.error('Error generating mastery check:', error);
      return null;
    }
  },

  /**
   * STEP 7: Submit mastery check answers
   */
  async submitMastery(
    sessionId: string,
    answers: Array<{ question: string; answer: string }>
  ): Promise<SubmitMasteryResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/structured/submit-mastery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId,
          answers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit mastery');
      }

      return response.json();
    } catch (error) {
      console.error('Error submitting mastery:', error);
      return null;
    }
  },
};

export default structuredTeachingService;
