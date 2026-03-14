const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface RAGResponse {
  answer: string;
  structured_response: {
    introduction: string;
    explanation: string;
    examples: string;
    summary: string;
  };
  sources: string[];
  confidence: number;
  flags: string[];
  retrieved_chunks: Array<{
    content: string;
    source_file: string;
    subject: string;
    key_stage: string;
    topic: string;
    similarity_score: number;
  }>;
  metrics: {
    retrieval_time_ms: number;
    generation_time_ms: number;
    total_time_ms: number;
  };
}

export interface ChatMessage {
  role: 'student' | 'tutor';
  content: string;
}

/**
 * Ask a question using RAG pipeline
 */
export async function askRAGQuestion(
  question: string,
  studentId: string,
  options?: {
    subject?: string;
    keyStage?: string;
    conversationHistory?: ChatMessage[];
  }
): Promise<RAGResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rag/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        student_id: studentId,
        subject: options?.subject,
        key_stage: options?.keyStage,
        conversation_history: options?.conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error asking RAG question:', error);
    throw error;
  }
}

/**
 * Retrieve chunks without generation (for debugging)
 */
export async function retrieveChunks(
  query: string,
  options?: {
    topK?: number;
    subject?: string;
    keyStage?: string;
  }
): Promise<Array<{
  content: string;
  source_file: string;
  subject: string;
  key_stage: string;
  topic: string;
  similarity_score: number;
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rag/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        top_k: options?.topK || 5,
        subject: options?.subject,
        key_stage: options?.keyStage,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG retrieve error: ${response.status}`);
    }

    const result = await response.json();
    return result.data.chunks;
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
}

/**
 * Generate daily lesson for a topic
 */
export async function generateDailyLesson(
  topic: string,
  subject: string,
  studentId: string
): Promise<Array<{
  slideNumber: number;
  slideType: 'overview' | 'explanation' | 'example' | 'summary';
  title: string;
  content: string;
  bulletPoints?: string[];
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lessons/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        subject,
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) {
      throw new Error(`Lesson generation error: ${response.status}`);
    }

    const result = await response.json();
    return result.data.slides || result.data;
  } catch (error) {
    console.error('Error generating daily lesson:', error);
    throw error;
  }
}

/**
 * Get today's daily lesson
 */
export async function getDailyLesson(
  studentId: string,
  date?: string
): Promise<{
  id: string;
  topic: string;
  subject: string;
  slides: Array<{
    slideNumber: number;
    slideType: 'overview' | 'explanation' | 'example' | 'summary';
    title: string;
    content: string;
    bulletPoints?: string[];
  }>;
  isComplete: boolean;
} | null> {
  try {
    const url = `${API_BASE_URL}/api/lessons/daily?student_id=${studentId}${date ? `&date=${date}` : ''}`;
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Get lesson error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting daily lesson:', error);
    return null;
  }
}
