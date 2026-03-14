/**
 * RAG Service for AI Tutor
 * Handles communication with backend RAG API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

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

export interface CurriculumSubject {
  subject: string;
}

export interface CurriculumYear {
  year: string;
}

export interface CurriculumTopic {
  topic: string;
  source_file: string;
  chunk_count: number;
}

export interface ChatMessage {
  role: 'student' | 'tutor';
  content: string;
}

/**
 * Get all available subjects from Qdrant
 */
export async function getSubjects(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/curriculum/subjects`);
    if (!response.ok) {
      throw new Error('Failed to fetch subjects');
    }
    const result = await response.json();
    return result.data.subjects || [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

/**
 * Get all years for a specific subject
 */
export async function getYears(subject: string): Promise<string[]> {
  try {
    const url = `${API_BASE_URL}/api/curriculum/years?subject=${encodeURIComponent(subject)}`;
    console.log('Fetching years from:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch years: ${response.status} ${errorText}`);
    }
    const result = await response.json();
    console.log('Years result:', result);
    return result.data.years || [];
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
}

/**
 * Get all topics for a specific subject and year
 */
export async function getTopics(subject: string, keyStage?: string): Promise<CurriculumTopic[]> {
  try {
    let url = `${API_BASE_URL}/api/curriculum/topics?subject=${encodeURIComponent(subject)}`;
    if (keyStage) {
      url += `&key_stage=${encodeURIComponent(keyStage)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }
    const result = await response.json();
    return result.data.topics || [];
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
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
    topic?: string;
    conversationHistory?: ChatMessage[];
    restrictToTopic?: boolean;
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
        topic: options?.topic,
        conversation_history: options?.conversationHistory,
        restrict_to_topic: options?.restrictToTopic || false,
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
 * Get topic content from Qdrant
 */
export async function getTopicContent(
  subject: string,
  topic: string,
  keyStage?: string
): Promise<{
  topic: string;
  subject: string;
  documents: Array<{
    source_file: string;
    chunks: Array<{
      index: number;
      content: string;
    }>;
  }>;
  total_chunks: number;
}> {
  try {
    let url = `${API_BASE_URL}/api/curriculum/topic-content?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;
    if (keyStage) {
      url += `&key_stage=${encodeURIComponent(keyStage)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch topic content');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching topic content:', error);
    throw error;
  }
}
