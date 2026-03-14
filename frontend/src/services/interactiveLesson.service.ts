/**
 * Interactive Lesson Service with OpenRouter Integration
 * 
 * Flow:
 * 1. AI explains concept briefly (not full PDF)
 * 2. Shows ONE worked example with step-by-step solution
 * 3. Student tries practice question
 * 4. AI provides feedback, handles mistakes
 * 5. Voice-to-voice interaction enabled
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

export interface LessonConcept {
  title: string;
  briefExplanation: string;
  keyIdea: string;
  realWorldExample: string;
  checkQuestion: string;
}

export interface WorkedExample {
  question: string;
  steps: Array<{
    stepNumber: number;
    action: string;
    explanation: string;
  }>;
  finalAnswer: string;
  commonMistake: string;
}

export interface PracticeQuestion {
  question: string;
  hint: string;
  correctAnswer: string;
  markScheme: Array<{ step: string; marks: number }>;
}

export interface PracticeFeedback {
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  encouragement: string;
  nextStep: string;
}

export interface VoiceInteraction {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error?: string;
}

// ==================== SERVICE ====================

export const interactiveLessonService = {
  /**
   * PHASE 1: Get brief concept explanation using OpenRouter
   */
  async getConceptExplanation(params: {
    topic: string;
    subject: string;
    yearGroup: string;
    contentChunks: string[];
  }): Promise<{ success: boolean; data?: LessonConcept; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/concept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting concept explanation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get explanation' 
      };
    }
  },

  /**
   * PHASE 2: Get worked example using OpenRouter
   */
  async getWorkedExample(params: {
    topic: string;
    subject: string;
    yearGroup: string;
    conceptTaught: boolean;
  }): Promise<{ success: boolean; data?: WorkedExample; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/example`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting worked example:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get example' 
      };
    }
  },

  /**
   * PHASE 3: Get practice question using OpenRouter
   */
  async getPracticeQuestion(params: {
    topic: string;
    subject: string;
    yearGroup: string;
    exampleShown: boolean;
  }): Promise<{ success: boolean; data?: PracticeQuestion; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting practice question:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get practice question' 
      };
    }
  },

  /**
   * PHASE 4: Evaluate student answer using OpenRouter
   */
  async evaluateAnswer(params: {
    topic: string;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    markScheme: Array<{ step: string; marks: number }>;
  }): Promise<{ success: boolean; data?: PracticeFeedback; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to evaluate answer' 
      };
    }
  },

  /**
   * Get hint for practice question using OpenRouter
   */
  async getHint(params: {
    topic: string;
    question: string;
    studentAttempt: string;
  }): Promise<{ success: boolean; data?: { hint: string; encouragement: string }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting hint:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get hint' 
      };
    }
  },

  /**
   * Voice-to-voice interaction helper
   * Converts speech to text and sends to AI for response
   */
  async processVoiceQuestion(params: {
    transcript: string;
    topic: string;
    subject: string;
    yearGroup: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }): Promise<{ success: boolean; data?: { response: string; shouldShowOnBoard: boolean; boardContent?: string }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson/voice-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error processing voice question:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process voice question' 
      };
    }
  },
};

export default interactiveLessonService;
