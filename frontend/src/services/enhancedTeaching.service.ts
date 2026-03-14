/**
 * Enhanced Step-by-Step Teaching Service (Frontend)
 * 
 * Interactive teaching flow:
 * 1. AI explains concept briefly (not full PDF)
 * 2. Shows ONE worked example with step-by-step solution
 * 3. Student tries practice question
 * 4. AI provides feedback, handles mistakes
 * 5. Support buttons: "Explain simpler", "Show step-by-step", "Give similar question"
 * 6. Tracks student progress and mistakes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

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

export interface ConceptExplanation {
  title: string;
  bigIdea: string;
  analogy: string;
  whyItMatters: string;
  keyParts: Array<{
    label: string;
    description: string;
    highlight: string;
  }>;
  checkQuestion: string;
  spokenIntroduction: string;
}

export interface WorkedExampleStep {
  stepNumber: number;
  action: string;
  reasoning: string;
  highlight: string;
  commonMistake?: string;
  spokenExplanation: string;
}

export interface WorkedExample {
  question: string;
  givenData: string;
  steps: WorkedExampleStep[];
  finalAnswer: string;
  checkMethod: string;
  totalSteps: number;
}

export interface PracticeQuestion {
  question: string;
  givenData: string;
  anxietyReducer: string;
  thinkingHint: string;
  expectedFormat: string;
  correctAnswer: string;
  markScheme: Array<{ step: string; marks: number }>;
  commonMistakesToWatch: string[];
}

export interface MistakeRecord {
  topic: string;
  mistakeType: 'arithmetic' | 'method' | 'misconception' | 'careless';
  timestamp: Date;
  question: string;
  studentAnswer: string;
  explanation: string;
}

export interface StudentProgress {
  topicId: string;
  masteryPercent: number;
  attemptsCount: number;
  correctAttempts: number;
  incorrectAttempts: number;
  recentMistakes: MistakeRecord[];
  status: 'secure' | 'developing' | 'at_risk';
  lastPracticed: Date;
}

export interface Feedback {
  isCorrect: boolean;
  mistakeType: 'arithmetic' | 'method' | 'misconception' | 'careless' | null;
  encouragement: string;
  specificFeedback: string;
  errorExplanation?: string;
  correctMethod?: string;
  analogy?: string;
  nextStep: string;
  spokenFeedback: string;
}

export interface SimplifiedExplanation {
  newAnalogy: string;
  simplifiedSteps: Array<{
    step: number;
    explanation: string;
    visual: string;
  }>;
  keyInsight: string;
  encouragement: string;
}

export interface SimilarQuestion {
  question: string;
  similarity: string;
  simplification: string;
  hint: string;
  correctAnswer: string;
  encouragement: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== SERVICE ====================

export const enhancedTeachingService = {
  /**
   * PHASE 1: Get brief concept explanation
   */
  async getConceptExplanation(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<ServiceResponse<ConceptExplanation>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/concept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to get concept explanation',
        message: error.message,
      };
    }
  },

  /**
   * PHASE 2: Get worked example with step-by-step solution
   */
  async getWorkedExample(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<ServiceResponse<WorkedExample>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/example`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to get worked example',
        message: error.message,
      };
    }
  },

  /**
   * PHASE 3: Get practice question
   */
  async getPracticeQuestion(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    difficulty: 'easy' | 'medium' | 'hard';
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<ServiceResponse<PracticeQuestion>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to get practice question',
        message: error.message,
      };
    }
  },

  /**
   * PHASE 4: Evaluate student answer and provide feedback
   */
  async evaluateAnswer(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    attemptNumber: number;
  }): Promise<ServiceResponse<Feedback>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to evaluate answer',
        message: error.message,
      };
    }
  },

  /**
   * Get simplified explanation for struggling students
   */
  async getSimplifiedExplanation(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    confusionPoint: string;
    mistakes: MistakeRecord[];
  }): Promise<ServiceResponse<SimplifiedExplanation>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/simplify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to simplify explanation',
        message: error.message,
      };
    }
  },

  /**
   * Generate similar question for additional practice
   */
  async getSimilarQuestion(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    originalQuestion: string;
    strugglePoint: string;
  }): Promise<ServiceResponse<SimilarQuestion>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teaching/enhanced/similar-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to generate similar question',
        message: error.message,
      };
    }
  },

  /**
   * Get student progress for a topic
   */
  async getStudentProgress(params: {
    studentId: string;
    topicId: string;
  }): Promise<ServiceResponse<StudentProgress>> {
    try {
      const { studentId, topicId } = params;
      const response = await fetch(
        `${API_BASE_URL}/api/teaching/enhanced/progress/${studentId}/${topicId}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to get student progress',
        message: error.message,
      };
    }
  },
};

export default enhancedTeachingService;
