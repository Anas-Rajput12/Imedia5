/**
 * Step-by-Step Teaching Service
 * 
 * Frontend service for interactive step-by-step teaching flow
 * Uses backend RAG + OpenRouter for content generation
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

export interface TeachingStep {
  stepNumber: number;
  title: string;
  content: string;
  keyPoints: string[];
  visualDescription: string;
  analogy?: string;
  checkQuestion?: string;
}

export interface WorkedExampleStep {
  stepNumber: number;
  text: string;
  explanation: string;
  highlight?: string;
}

export interface WorkedExample {
  question: string;
  steps: WorkedExampleStep[];
  solution: string;
  commonMistakes: string[];
  checkMethod: string;
}

export interface PracticeQuestion {
  question: string;
  data?: string;
  marks: number;
  markScheme: Array<{ step: string; marks: number }>;
  commonMistakes: string[];
  hint?: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  mistakeType: 'arithmetic' | 'method' | 'misconception' | 'careless' | null;
  feedback: string;
  highlightedError?: string;
  correctMethod?: string;
  encouragement: string;
}

export interface MistakeHistory {
  topic: string;
  mistakeType: string;
  timestamp: Date;
}

// ==================== SERVICE ====================

export const stepByStepTeachingService = {
  /**
   * Get step-by-step explanation
   */
  async getExplanation(
    topicId: string,
    step: number,
    studentLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    subject: string = 'Maths',
    yearGroup: string = 'Year 7'
  ): Promise<TeachingStep> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/step/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        step,
        studentLevel,
        subject,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get explanation');
    }

    const data = await response.json();
    return data.explanation;
  },

  /**
   * Get worked example
   */
  async getWorkedExample(
    topicId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    subject: string = 'Maths',
    yearGroup: string = 'Year 7'
  ): Promise<WorkedExample> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/step/example`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        difficulty,
        subject,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get example');
    }

    const data = await response.json();
    return data.example;
  },

  /**
   * Evaluate student answer
   */
  async evaluateAnswer(
    topicId: string,
    question: string,
    studentAnswer: string,
    correctAnswer?: string,
    subject: string = 'Maths',
    yearGroup: string = 'Year 7'
  ): Promise<EvaluationResult> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/step/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        question,
        studentAnswer,
        correctAnswer,
        subject,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to evaluate answer');
    }

    const data = await response.json();
    return data.evaluation;
  },

  /**
   * Get practice question
   */
  async getPracticeQuestion(
    topicId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    studentLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    subject: string = 'Maths',
    yearGroup: string = 'Year 7'
  ): Promise<PracticeQuestion> {
    const response = await fetch(`${API_BASE_URL}/api/teaching/step/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        topicId,
        difficulty,
        studentLevel,
        subject,
        yearGroup,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get practice question');
    }

    const data = await response.json();
    return data.practice;
  },

  /**
   * Get student's mistake history
   */
  async getMistakeHistory(
    studentId: string,
    topicId: string
  ): Promise<{ mistakes: string[]; masteryLevel: number; attempts: number }> {
    const response = await fetch(
      `${API_BASE_URL}/api/teaching/step/mistakes/${studentId}/${topicId}`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get mistake history');
    }

    return response.json();
  },
};

export default stepByStepTeachingService;
