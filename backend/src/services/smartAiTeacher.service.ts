/**
 * SMART AI Teacher Service - Enhanced 4-Layer Architecture
 * 
 * This service implements the complete SMART AI Teacher system with:
 * 1. Retrieval Layer (Curriculum only)
 * 2. Teaching Logic Layer (structured flow)
 * 3. Personalisation Engine (trigger-based adaptation)
 * 4. Safety & Guardrail Layer (safeguarding + exam integrity)
 * 
 * Teaching Structure (Non-Optional Flow):
 * 1. Confirm year group + topic
 * 2. Diagnostic micro-check (1-3 questions)
 * 3. Teach in small chunk
 * 4. Guided example
 * 5. Student attempt
 * 6. Feedback
 * 7. Mastery check before moving on
 */

import { getRepository } from 'typeorm';
import { TeachingSession } from '../models/teachingSession';
import { TopicMastery } from '../models/topicMastery';
import { SafeguardingLog } from '../models/safeguardingLog';
import { ErrorLog } from '../models/errorLog';
import { CurriculumTopic } from '../models/curriculumTopic';
import { RAGService } from './rag.service';
import { GeminiService } from './gemini.service';
import { qdrantService } from './qdrant.service';
import { OpenRouterService } from './openRouter.service';

const ragService = new RAGService();
const geminiService = new GeminiService();
const openRouterService = new OpenRouterService();

// Wrapper function for OpenRouter API
async function generateContent(prompt: string): Promise<string> {
  try {
    // Use OpenRouter for content generation
    const messages = [
      { role: 'system', content: 'You are a professional school teacher. Provide clear, educational responses.' },
      { role: 'user', content: prompt }
    ];
    
    const response = await openRouterService.generateTeacherResponse(
      prompt,  // question
      '',      // retrievedContext (empty for general generation)
      []       // sources
    );
    
    return response.answer;
  } catch (error) {
    console.error('Error generating content with OpenRouter:', error);
    // Fallback to Gemini if OpenRouter fails
    try {
      const result = await geminiService.generateTeacherResponse(prompt, '', []);
      return result.answer;
    } catch {
      return '';
    }
  }
}

// ==================== INTERFACES ====================

export interface TutorPersona {
  id: 'maths' | 'science' | 'homework';
  name: string;
  subject: string;
  description: string;
  teachingStyle: 'step-by-step' | 'question-led' | 'guided';
  examBoards: string[];
}

export interface CurriculumLockCheck {
  locked: boolean;
  topicId: string;
  topicExists: boolean;
  contextRetrieved: boolean;
  confidenceThreshold: number;
  actualConfidence: number;
  message: string;
  clarifyingQuestion?: string;
}

export interface PersonalisationTrigger {
  triggerType: 'two_incorrect' | 'three_failed' | 'high_achiever' | 'struggling';
  adaptation: 'simplify' | 'challenge' | 'scaffold' | 'visual_analogy';
  triggered: boolean;
  message: string;
}

export interface SafeguardingDetection {
  detected: boolean;
  type: 'emotional_distress' | 'self_harm' | 'harmful_topic' | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  response: string;
  escalate: boolean;
  trustedAdultPrompt: string;
}

export interface ExamIntegrityCheck {
  detected: boolean;
  type: 'direct_answer_request' | 'homework_cheat' | 'exam_cheat';
  response: string;
  hintProvided: string;
  workedExampleProvided: boolean;
  similarQuestionProvided: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TeachingChunk {
  title: string;
  content: string;
  key_points: string[];
  worked_examples: WorkedExample[];
  analogies: string[];
  visual_description: string;
  check_questions: string[];
  video_suggestion?: VideoSuggestion;
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  final_answer: string;
  method_notes: string;
  exam_tips: string[];
}

export interface VideoSuggestion {
  title: string;
  youtubeId: string;
  duration: string;
  description: string;
  pausePrompt: string;
  resumeQuestion: string;
}

export interface Feedback {
  is_correct: boolean;
  message: string;
  next_step: string;
  adaptation?: 'simplify' | 'challenge' | 'scaffold' | 'visual_analogy';
  error_type?: 'arithmetic' | 'method' | 'misconception' | 'careless';
  correct_answer?: string;
  scaffolded_steps?: string[];
  visual_analogy?: string;
  encouragement: string;
}

export interface MasteryCheck {
  passed: boolean;
  score: number;
  questions: DiagnosticQuestion[];
  studentAnswers: string[];
  feedback: string;
  nextAction: 'move_on' | 'review' | 'practice_more';
}

export interface ProgressMetrics {
  mastery_percent: number;
  attempts_count: number;
  error_tags: string[];
  last_practiced: Date;
  confidence_signal: number;
  status: 'secure' | 'developing' | 'at_risk';
  trend: 'improving' | 'stable' | 'declining';
}

// ==================== SERVICE CLASS ====================

export class SmartAiTeacherService {
  // Configuration constants
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_ATTEMPTS_BEFORE_SCAFFOLD = 3;
  private readonly MAX_ATTEMPTS_BEFORE_SIMPLIFY = 2;
  private readonly MASTERY_PASS_THRESHOLD = 80;

  // Tutor personas
  private readonly TUTOR_PERSONAS: Record<string, TutorPersona> = {
    maths: {
      id: 'maths',
      name: 'Prof. Mathew',
      subject: 'Mathematics',
      description: 'Exam-board approved methods, step-by-step working, live correction',
      teachingStyle: 'step-by-step',
      examBoards: ['AQA', 'Edexcel', 'OCR', 'Cambridge'],
    },
    science: {
      id: 'science',
      name: 'Dr. Science',
      subject: 'Science',
      description: 'Concept-based, interactive, video-supported, question-led teaching',
      teachingStyle: 'question-led',
      examBoards: ['AQA', 'Edexcel', 'OCR'],
    },
    homework: {
      id: 'homework',
      name: 'Teacher Alex',
      subject: 'Homework Support',
      description: 'Guided help only, anti-cheating enforced, method-first learning',
      teachingStyle: 'guided',
      examBoards: ['General'],
    },
  };

  // ==================== LAYER 1: RETRIEVAL LAYER ====================

  /**
   * Get topic content from Qdrant (wrapper for existing RAG service)
   */
  async getTopicContent(subject: string, topic: string, keyStage: string): Promise<any> {
    try {
      // Use the topic name as a query to search for relevant chunks
      const query = `Teach me about ${topic}`;
      
      // Execute RAG query
      const result = await ragService.executeRAG({
        question: query,
        studentId: 'system',
        subject,
        keyStage,
        topic,
        restrictToTopic: true,
      });

      return {
        documents: result.retrievedChunks.length > 0 ? [{
          chunks: result.retrievedChunks.map((chunk: any) => ({
            content: chunk.content || '',
            source_file: chunk.sourceFile || '',
            similarity_score: chunk.similarityScore || 0,
          }))
        }] : [],
      };
    } catch (error) {
      console.error('Error getting topic content:', error);
      return { documents: [] };
    }
  }

  /**
   * Ask RAG question (wrapper)
   */
  async askRAG(question: string, subject: string, keyStage?: string): Promise<any> {
    try {
      const result = await ragService.executeRAG({
        question,
        studentId: 'system',
        subject,
        keyStage,
      });

      return {
        documents: result.retrievedChunks.length > 0 ? [{
          chunks: result.retrievedChunks.map((chunk: any) => ({
            content: chunk.content || '',
            source_file: chunk.sourceFile || '',
            similarity_score: chunk.similarityScore || 0,
          }))
        }] : [],
      };
    } catch (error) {
      console.error('Error asking RAG:', error);
      return { documents: [] };
    }
  }

  /**
   * CURRICULUM LOCK MODE
   * AI may ONLY generate factual teaching content if:
   * - A valid TopicID is selected
   * - Retrieved context exists
   * - Retrieval confidence > threshold (0.7)
   * 
   * If not: Ask clarifying question or escalate. NEVER invent.
   */
  async checkCurriculumLock(
    topicId: string,
    tutorType: string,
    yearGroup?: string
  ): Promise<CurriculumLockCheck> {
    // 1. Verify valid TopicID is selected
    if (!topicId || topicId.trim() === '') {
      return {
        locked: false,
        topicId: '',
        topicExists: false,
        contextRetrieved: false,
        confidenceThreshold: this.CONFIDENCE_THRESHOLD,
        actualConfidence: 0,
        message: "I need to know which topic you'd like to learn about.",
        clarifyingQuestion: "Could you please select a topic from the curriculum menu?",
      };
    }

    try {
      // Map tutor type to subject for retrieval
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology', // Can be Physics/Chemistry too
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      // 2. Check if topic exists in Qdrant
      const retrievalResult = await this.getTopicContent(subject, topicId, yearGroup || '');

      const topicExists = retrievalResult && retrievalResult.documents && retrievalResult.documents.length > 0;
      
      if (!topicExists) {
        return {
          locked: false,
          topicId,
          topicExists: false,
          contextRetrieved: false,
          confidenceThreshold: this.CONFIDENCE_THRESHOLD,
          actualConfidence: 0,
          message: `I couldn't find information about "${topicId}" in our curriculum.`,
          clarifyingQuestion: "Could you check the topic name or select from the available topics in the curriculum?",
        };
      }

      // 3. Check if retrieved context has content
      const hasContent = retrievalResult.documents.some((doc: any) =>
        doc.chunks && doc.chunks.length > 0
      );

      if (!hasContent) {
        return {
          locked: false,
          topicId,
          topicExists: true,
          contextRetrieved: false,
          confidenceThreshold: this.CONFIDENCE_THRESHOLD,
          actualConfidence: 0,
          message: `I found the topic "${topicId}" but don't have enough content to teach it properly.`,
          clarifyingQuestion: "Would you like to try a different topic, or shall I help you with something else?",
        };
      }

      // 4. Calculate retrieval confidence (based on document similarity scores)
      const avgConfidence = this.calculateRetrievalConfidence(retrievalResult);

      if (avgConfidence < this.CONFIDENCE_THRESHOLD) {
        return {
          locked: false,
          topicId,
          topicExists: true,
          contextRetrieved: true,
          confidenceThreshold: this.CONFIDENCE_THRESHOLD,
          actualConfidence: avgConfidence,
          message: `I'm not entirely confident about the content for "${topicId}". The information I have might not be complete.`,
          clarifyingQuestion: "Would you like me to proceed with what I have, or would you prefer to select a different topic?",
        };
      }

      // All checks passed - curriculum is locked
      return {
        locked: true,
        topicId,
        topicExists: true,
        contextRetrieved: true,
        confidenceThreshold: this.CONFIDENCE_THRESHOLD,
        actualConfidence: avgConfidence,
        message: 'Curriculum verified. Ready to teach with approved content.',
      };
    } catch (error) {
      console.error('Curriculum lock check failed:', error);
      return {
        locked: false,
        topicId,
        topicExists: false,
        contextRetrieved: false,
        confidenceThreshold: this.CONFIDENCE_THRESHOLD,
        actualConfidence: 0,
        message: "I'm having trouble accessing the curriculum right now.",
        clarifyingQuestion: "Could you try again in a moment? If this continues, please let your teacher know.",
      };
    }
  }

  /**
   * Calculate average retrieval confidence from search results
   */
  private calculateRetrievalConfidence(retrievalResult: any): number {
    if (!retrievalResult || !retrievalResult.documents) return 0;

    const allChunks = retrievalResult.documents.flatMap((doc: any) => doc.chunks || []);
    if (allChunks.length === 0) return 0;

    const totalScore = allChunks.reduce((sum: number, chunk: any) => {
      return sum + (chunk.similarity_score || 0);
    }, 0);

    return totalScore / allChunks.length;
  }

  /**
   * Retrieve context for teaching (curriculum-only)
   */
  async retrieveContext(
    topicId: string,
    tutorType: string,
    yearGroup?: string,
    question?: string
  ): Promise<{
    context: string;
    sources: string[];
    confidence: number;
    chunks: any[];
  }> {
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    };
    const subject = subjectMap[tutorType] || 'Maths';

    let result: any;

    if (question) {
      // RAG retrieval for specific question
      result = await this.askRAG(question, subject, yearGroup);
    } else {
      // Topic-based retrieval
      result = await this.getTopicContent(subject, topicId, yearGroup || '');
    }

    const context = this.formatRetrievedContext(result);
    const sources = this.extractSources(result);
    const confidence = this.calculateRetrievalConfidence(result);

    return {
      context,
      sources,
      confidence,
      chunks: result?.documents?.flatMap((d: any) => d.chunks || []) || [],
    };
  }

  /**
   * Format retrieved context for teaching
   */
  private formatRetrievedContext(result: any): string {
    if (!result || !result.documents) return '';

    return result.documents
      .flatMap((doc: any) => doc.chunks || [])
      .map((chunk: any) => chunk.content || '')
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Extract sources from retrieval result
   */
  private extractSources(result: any): string[] {
    if (!result || !result.documents) return [];

    return result.documents
      .flatMap((doc: any) => doc.chunks || [])
      .map((chunk: any) => chunk.source_file || '')
      .filter(Boolean)
      .slice(0, 5); // Limit to 5 sources
  }

  // ==================== LAYER 2: TEACHING LOGIC LAYER ====================

  /**
   * Generate diagnostic micro-check questions (1-3 questions)
   * Based on topic, tutor type, and prior knowledge
   */
  async generateDiagnosticQuestions(
    topicId: string,
    tutorType: string,
    yearGroup?: string,
    priorKnowledge?: number
  ): Promise<DiagnosticQuestion[]> {
    try {
      console.log('[DIAGNOSTIC] Generating questions for topic:', topicId, 'tutorType:', tutorType);
      
      // Retrieve context first
      const { context, sources } = await this.retrieveContext(topicId, tutorType, yearGroup);
      console.log('[DIAGNOSTIC] Retrieved context length:', context?.length || 0, 'sources:', sources);

      const persona = this.TUTOR_PERSONAS[tutorType];

      const prompt = this.buildDiagnosticPrompt(persona, topicId, context, sources, priorKnowledge);
      console.log('[DIAGNOSTIC] Prompt generated, calling generateContent...');
      
      const response = await generateContent(prompt);
      console.log('[DIAGNOSTIC] OpenRouter response:', response.substring(0, 200));

      const questions = this.parseDiagnosticQuestions(response);
      console.log('[DIAGNOSTIC] Parsed questions:', questions.length);

      // Ensure 1-3 questions
      const finalQuestions = questions.slice(0, Math.max(1, Math.min(3, questions.length)));
      console.log('[DIAGNOSTIC] Final questions:', finalQuestions.map(q => q.question.substring(0, 50)));
      
      return finalQuestions;
    } catch (error) {
      console.error('[DIAGNOSTIC] Error generating questions:', error);
      return this.getFallbackDiagnosticQuestions(tutorType, topicId);
    }
  }

  /**
   * Build prompt for diagnostic question generation
   */
  private buildDiagnosticPrompt(
    persona: TutorPersona,
    topicId: string,
    context: string,
    sources: string[],
    priorKnowledge?: number
  ): string {
    const difficultyAdjustment = priorKnowledge !== undefined
      ? priorKnowledge >= 80
        ? 'Student shows strong prior knowledge. Generate challenging questions.'
        : priorKnowledge >= 50
        ? 'Student has some understanding. Generate moderate difficulty questions.'
        : 'Student is new to this topic. Generate accessible foundation questions.'
      : 'Generate standard diagnostic questions.';

    const personaInstructions = {
      maths: `You are ${persona.name}. Generate 2-3 diagnostic questions for "${topicId}".
- Focus on exam-board approved methods
- Include questions that check method understanding, not just answers
- Questions should be solvable without calculator unless specified`,

      science: `You are ${persona.name}. Generate 2-3 diagnostic questions for "${topicId}".
- Use "why" and "how" questions to probe understanding
- Include questions about scientific concepts and real-world applications
- Encourage scientific thinking`,

      homework: `You are ${persona.name}. Generate 2-3 diagnostic questions for "${topicId}".
- Focus on reading comprehension and writing skills
- Assess understanding of approach, not just answers
- Encourage reflection on learning strategies`,
    };

    return `${personaInstructions[persona.id as keyof typeof personaInstructions]}

${difficultyAdjustment}

SOURCES (cite these): ${sources.join(', ')}

CONTEXT:
${context}

Format response as JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "correct_answer": "Answer",
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;
  }

  /**
   * Parse diagnostic questions from AI response
   */
  private parseDiagnosticQuestions(response: string): DiagnosticQuestion[] {
    try {
      const parsed = JSON.parse(response);
      return (parsed.questions || []).map((q: any, i: number) => ({
        id: q.id || `q${i + 1}`,
        question: q.question || '',
        correct_answer: q.correct_answer || '',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fallback diagnostic questions
   */
  private getFallbackDiagnosticQuestions(tutorType: string, topicId: string): DiagnosticQuestion[] {
    const fallbacks: Record<string, DiagnosticQuestion[]> = {
      maths: [
        {
          id: 'q1',
          question: `What do you already know about ${topicId}?`,
          correct_answer: '',
          explanation: 'This helps me understand your starting point.',
          difficulty: 'easy',
        },
      ],
      science: [
        {
          id: 'q1',
          question: `What comes to mind when you hear "${topicId}"?`,
          correct_answer: '',
          explanation: 'I want to understand your current thinking.',
          difficulty: 'easy',
        },
      ],
      homework: [
        {
          id: 'q1',
          question: `What do you find most challenging about ${topicId}?`,
          correct_answer: '',
          explanation: 'Knowing your challenges helps me support you.',
          difficulty: 'easy',
        },
      ],
    };
    return fallbacks[tutorType] || fallbacks.maths;
  }

  /**
   * Generate teaching chunk (small chunk of content)
   */
  async generateTeachingChunk(
    topicId: string,
    tutorType: string,
    yearGroup?: string,
    knowledgeLevel?: number
  ): Promise<TeachingChunk> {
    try {
      const { context, sources, confidence } = await this.retrieveContext(topicId, tutorType, yearGroup);
      const persona = this.TUTOR_PERSONAS[tutorType];

      const prompt = this.buildTeachingChunkPrompt(persona, topicId, context, sources, knowledgeLevel);
      const response = await generateContent(prompt);

      return this.parseTeachingChunk(response);
    } catch (error) {
      console.error('Error generating teaching chunk:', error);
      return this.getFallbackTeachingChunk(tutorType, topicId);
    }
  }

  /**
   * Build prompt for teaching chunk generation
   */
  private buildTeachingChunkPrompt(
    persona: TutorPersona,
    topicId: string,
    context: string,
    sources: string[],
    knowledgeLevel?: number
  ): string {
    const adaptationInstruction = knowledgeLevel !== undefined
      ? knowledgeLevel >= 80
        ? 'ADVANCED: Provide detailed explanations with challenging examples. Push student thinking.'
        : knowledgeLevel >= 50
        ? 'INTERMEDIATE: Provide clear explanations with moderate difficulty examples.'
        : 'BEGINNER: Simplify language significantly. Use analogies. Provide scaffolded steps.'
      : 'STANDARD: Provide clear, age-appropriate explanations.';

    const personaInstructions = {
      maths: `You are ${persona.name}. Teach "${topicId}" using exam-board approved methods.

REQUIREMENTS:
- Show step-by-step working for every example
- Highlight key steps clearly
- Explain EACH line of working
- Use digital whiteboard style descriptions
- Include method notes and exam tips

${adaptationInstruction}

SOURCES: ${sources.join(', ')}

CONTEXT:
${context}

Format as JSON:
{
  "title": "Topic name",
  "content": "Main teaching text (2-3 paragraphs)",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "worked_examples": [
    {
      "problem": "Problem statement",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "final_answer": "Answer",
      "method_notes": "Why this method works",
      "exam_tips": ["Tip 1", "Tip 2"]
    }
  ],
  "analogies": ["Real-world analogy"],
  "visual_description": "Description for whiteboard display",
  "check_questions": ["Question 1", "Question 2"]
}`,

      science: `You are ${persona.name}. Teach "${topicId}" using question-led explanations.

REQUIREMENTS:
- Use "why" and "how" questions throughout
- Prompt note-taking: "Pause and write this definition"
- Ask students to summarize in own words
- Suggest where videos could help
- Use simple language first, then increase depth

${adaptationInstruction}

SOURCES: ${sources.join(', ')}

CONTEXT:
${context}

Format as JSON:
{
  "title": "Topic name",
  "content": "Main teaching text with embedded questions",
  "key_points": ["Concept 1", "Concept 2"],
  "worked_examples": [
    {
      "problem": "Application question",
      "steps": ["Reasoning step 1", "Reasoning step 2"],
      "final_answer": "Conclusion",
      "method_notes": "Scientific reasoning",
      "exam_tips": ["Exam tip"]
    }
  ],
  "analogies": ["Analogy to explain concept"],
  "visual_description": "Diagram description",
  "check_questions": ["Why...?", "How...?"],
  "video_suggestion": {
    "title": "Video title",
    "youtubeId": "video_id",
    "duration": "3:00",
    "description": "What video shows",
    "pausePrompt": "Watch this clip",
    "resumeQuestion": "What did you notice?"
  }
}`,

      homework: `You are ${persona.name}. Support learning about "${topicId}" WITHOUT giving direct answers.

REQUIREMENTS:
- NEVER provide final answers to homework
- Provide hints and similar examples only
- Break problems into parts
- Show method, not solution
- Use scaffolded learning approach

${adaptationInstruction}

SOURCES: ${sources.join(', ')}

CONTEXT:
${context}

Format as JSON:
{
  "title": "Topic name",
  "content": "Guidance on approach (not answers)",
  "key_points": ["Strategy 1", "Strategy 2"],
  "worked_examples": [
    {
      "problem": "SIMILAR problem (not the actual homework)",
      "steps": ["Approach step 1", "Approach step 2"],
      "final_answer": "Method demonstration",
      "method_notes": "How to approach similar problems",
      "exam_tips": ["Tip for independence"]
    }
  ],
  "analogies": ["Learning analogy"],
  "visual_description": "Strategy diagram",
  "check_questions": ["What do you understand?", "What's your plan?"]
}`,
    };

    return `${personaInstructions[persona.id]}

Format response as valid JSON.`;
  }

  /**
   * Parse teaching chunk from AI response
   */
  private parseTeachingChunk(response: string): TeachingChunk {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || '',
        content: parsed.content || '',
        key_points: parsed.key_points || [],
        worked_examples: parsed.worked_examples || [],
        analogies: parsed.analogies || [],
        visual_description: parsed.visual_description || '',
        check_questions: parsed.check_questions || [],
        video_suggestion: parsed.video_suggestion,
      };
    } catch {
      return {
        title: '',
        content: response,
        key_points: [],
        worked_examples: [],
        analogies: [],
        visual_description: '',
        check_questions: [],
      };
    }
  }

  /**
   * Fallback teaching chunk
   */
  private getFallbackTeachingChunk(tutorType: string, topicId: string): TeachingChunk {
    const persona = this.TUTOR_PERSONAS[tutorType];
    
    return {
      title: topicId,
      content: `Let's learn about **${topicId}** with ${persona.name}.

${persona.description}

I'll guide you through this topic step-by-step, checking your understanding along the way.`,
      key_points: ['Understanding the basics', 'Key concepts', 'Application'],
      worked_examples: [
        {
          problem: `Example problem about ${topicId}`,
          steps: ['Step 1: Understand what is asked', 'Step 2: Choose appropriate method', 'Step 3: Work through systematically', 'Step 4: Check answer'],
          final_answer: 'Solution',
          method_notes: 'This method works because...',
          exam_tips: ['Show all working', 'Check units'],
        },
      ],
      analogies: ['Think of this like...'],
      visual_description: `Whiteboard: ${topicId}`,
      check_questions: ['What do you understand so far?', 'Any questions?'],
    };
  }

  /**
   * Generate worked example with live working-out
   */
  async generateWorkedExample(
    topicId: string,
    tutorType: string,
    problem?: string,
    yearGroup?: string
  ): Promise<WorkedExample> {
    try {
      const { context, sources } = await this.retrieveContext(topicId, tutorType, yearGroup);
      const persona = this.TUTOR_PERSONAS[tutorType];

      const prompt = this.buildWorkedExamplePrompt(persona, topicId, context, sources, problem);
      const response = await generateContent(prompt);

      return this.parseWorkedExample(response);
    } catch (error) {
      console.error('Error generating worked example:', error);
      return this.getFallbackWorkedExample(tutorType, topicId);
    }
  }

  /**
   * Build prompt for worked example generation
   */
  private buildWorkedExamplePrompt(
    persona: TutorPersona,
    topicId: string,
    context: string,
    sources: string[],
    problem?: string
  ): string {
    const problemInstruction = problem
      ? `Solve this specific problem: "${problem}"`
      : 'Generate a representative example problem for this topic.';

    const personaInstructions = {
      maths: `You are ${persona.name}. Create a worked example for "${topicId}".

CRITICAL REQUIREMENTS:
- Show EVERY step of working clearly
- Explain EACH line (why this step?)
- Use exam-board approved method
- Highlight where marks are earned
- Include common mistakes to avoid

${problemInstruction}

SOURCES: ${sources.join(', ')}
CONTEXT: ${context}

Format as JSON:
{
  "problem": "Problem statement",
  "steps": [
    "Step 1: [action] because [reason]",
    "Step 2: [action] because [reason]"
  ],
  "final_answer": "Answer",
  "method_notes": "Why this method is correct",
  "exam_tips": ["Tip 1", "Tip 2"]
}`,

      science: `You are ${persona.name}. Create a worked example for "${topicId}".

REQUIREMENTS:
- Show scientific reasoning step-by-step
- Explain the "why" behind each step
- Use correct scientific terminology
- Connect to real-world applications

${problemInstruction}

SOURCES: ${sources.join(', ')}
CONTEXT: ${context}

Format as JSON:
{
  "problem": "Question or scenario",
  "steps": ["Reasoning step 1", "Reasoning step 2"],
  "final_answer": "Conclusion with explanation",
  "method_notes": "Scientific principle applied",
  "exam_tips": ["Exam tip"]
}`,

      homework: `You are ${persona.name}. Create a GUIDED example for "${topicId}".

CRITICAL: This is a SIMILAR problem, NOT the actual homework.

REQUIREMENTS:
- Show approach and method
- Break into manageable parts
- Explain decision-making process
- Encourage independent application

${problemInstruction}

SOURCES: ${sources.join(', ')}
CONTEXT: ${context}

Format as JSON:
{
  "problem": "Similar problem (not actual homework)",
  "steps": ["Approach step 1", "Approach step 2"],
  "final_answer": "Method demonstration",
  "method_notes": "How to apply to your homework",
  "exam_tips": ["Independence tip"]
}`,
    };

    return `${personaInstructions[persona.id]}

Format as valid JSON.`;
  }

  /**
   * Parse worked example from AI response
   */
  private parseWorkedExample(response: string): WorkedExample {
    try {
      const parsed = JSON.parse(response);
      return {
        problem: parsed.problem || '',
        steps: parsed.steps || [],
        final_answer: parsed.final_answer || '',
        method_notes: parsed.method_notes || '',
        exam_tips: parsed.exam_tips || [],
      };
    } catch {
      return {
        problem: '',
        steps: [],
        final_answer: '',
        method_notes: '',
        exam_tips: [],
      };
    }
  }

  /**
   * Fallback worked example
   */
  private getFallbackWorkedExample(tutorType: string, topicId: string): WorkedExample {
    return {
      problem: `Example: ${topicId}`,
      steps: ['Step 1: Read and understand', 'Step 2: Plan approach', 'Step 3: Execute method', 'Step 4: Verify'],
      final_answer: 'Solution',
      method_notes: 'Standard approach',
      exam_tips: ['Show working', 'Check answer'],
    };
  }

  // ==================== LAYER 3: PERSONALISATION ENGINE ====================

  /**
   * PERSONALISATION ENGINE - Trigger-based adaptation
   * 
   * Trigger Logic:
   * - 2 incorrect attempts on same concept → Switch explanation style, simplify, add visual analogy
   * - 3 failed mastery checks → Trigger escalation suggestion
   * - High diagnostic + correct → Challenge mode
   */
  checkPersonalisationTriggers(
    attempts: number,
    consecutiveIncorrect: number,
    diagnosticScore: number,
    lastAttemptCorrect: boolean
  ): PersonalisationTrigger {
    // Trigger: 3 failed attempts → Scaffold
    if (attempts >= this.MAX_ATTEMPTS_BEFORE_SCAFFOLD && !lastAttemptCorrect) {
      return {
        triggerType: 'three_failed',
        adaptation: 'scaffold',
        triggered: true,
        message: "I can see this is challenging. Let me break this down into smaller, manageable steps for you.",
      };
    }

    // Trigger: 2 incorrect attempts → Simplify + Visual Analogy
    if (consecutiveIncorrect >= this.MAX_ATTEMPTS_BEFORE_SIMPLIFY && !lastAttemptCorrect) {
      return {
        triggerType: 'two_incorrect',
        adaptation: 'visual_analogy',
        triggered: true,
        message: "Let me show you this in a different way with a visual analogy to help understanding.",
      };
    }

    // Trigger: High achiever → Challenge
    if (diagnosticScore >= 80 && lastAttemptCorrect) {
      return {
        triggerType: 'high_achiever',
        adaptation: 'challenge',
        triggered: true,
        message: "Excellent! You're grasping this quickly. Let's explore a more challenging application.",
      };
    }

    // Trigger: Struggling but trying → Encourage
    if (attempts >= 2 && consecutiveIncorrect >= 2) {
      return {
        triggerType: 'struggling',
        adaptation: 'simplify',
        triggered: true,
        message: "You're working hard on this, and that's what matters. Let's simplify and build from the basics.",
      };
    }

    return {
      triggerType: 'two_incorrect',
      adaptation: 'simplify',
      triggered: false,
      message: '',
    };
  }

  /**
   * Generate visual analogy for struggling students
   */
  async generateVisualAnalogy(
    topicId: string,
    tutorType: string,
    concept: string
  ): Promise<string> {
    try {
      const persona = this.TUTOR_PERSONAS[tutorType];
      
      const prompt = `You are ${persona.name}. Create a VISUAL ANALOGY to explain "${concept}" in the topic "${topicId}".

Requirements:
- Use everyday situations students can relate to
- Create a mental image that makes the concept concrete
- Keep it simple and memorable
- Connect the analogy back to the actual concept

Example format:
"Think of it like [everyday situation]. Just as [analogy explanation], in [topic] we have [concept connection]."

Generate a visual analogy:`;

      const response = await generateContent(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error generating visual analogy:', error);
      return `Think of ${concept} like a building process - you need a strong foundation before adding the upper floors.`;
    }
  }

  /**
   * Generate scaffolded steps for struggling students
   */
  generateScaffoldedSteps(
    problem: string,
    tutorType: string
  ): string[] {
    const scaffoldMap: Record<string, string[]> = {
      maths: [
        'Step 1: Read the question carefully. What is it asking you to find?',
        'Step 2: Identify what information you are given.',
        'Step 3: Choose the appropriate method or formula.',
        'Step 4: Write down the first step of your working.',
        'Step 5: Continue step-by-step, showing all working.',
        'Step 6: Check if your answer makes sense.',
      ],
      science: [
        'Step 1: What scientific concept is this question about?',
        'Step 2: What do you already know about this concept?',
        'Step 3: What evidence or reasoning can you use?',
        'Step 4: Structure your answer logically.',
        'Step 5: Use correct scientific terminology.',
        'Step 6: Review your answer for completeness.',
      ],
      homework: [
        'Step 1: What is the task asking you to do?',
        'Step 2: Break it into smaller parts.',
        'Step 3: Find a similar example to guide you.',
        'Step 4: Apply the method to your problem.',
        'Step 5: Check your approach makes sense.',
        'Step 6: Review and refine your work.',
      ],
    };

    return scaffoldMap[tutorType] || scaffoldMap.maths;
  }

  // ==================== LAYER 4: SAFETY & GUARDRAIL LAYER ====================

  /**
   * SAFEGUARDING MODE - Automated detection
   * 
   * Detects:
   * - Emotional distress
   * - Self-esteem issues
   * - Self-harm indicators
   * - Harmful topics
   * 
   * Response Protocol:
   * 1. Supportive tone
   * 2. Encourage speaking to trusted adult
   * 3. Do not continue harmful topic
   * 4. Log safeguarding flag
   */
  detectSafeguardingConcerns(message: string): SafeguardingDetection {
    const lowerMessage = message.toLowerCase();

    // Self-harm detection (CRITICAL - requires escalation)
    const selfHarmKeywords = [
      'hurt myself', 'self-harm', 'cutting', 'suicide', 'end it all',
      'kill myself', 'die', 'wish i was dead', 'no point living',
      'better off dead', 'want to disappear',
    ];

    for (const keyword of selfHarmKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          detected: true,
          type: 'self_harm',
          severity: 'critical',
          response: 'I hear that you\'re really struggling right now, and I want you to know that your wellbeing is the most important thing. You matter, and there are people who care about you and want to help.',
          escalate: true,
          trustedAdultPrompt: 'Please talk to a trusted adult about how you\'re feeling - a parent, teacher, school counsellor, or call Childline at 0800 1111. They are there to listen and support you. Would you like to take a break from this work?',
        };
      }
    }

    // Emotional distress detection
    const distressKeywords = [
      "i'm stupid", "i hate myself", "i'm worthless", "nobody cares",
      "i can't do anything right", "i'm useless", "i'm a failure",
      "everyone is better than me", "i give up on everything",
      "what's the point of trying", "i'm dumb",
    ];

    for (const keyword of distressKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          detected: true,
          type: 'emotional_distress',
          severity: 'high',
          response: 'I can see this is really frustrating you, and that\'s completely okay. Learning challenging things can feel overwhelming sometimes. But please know that struggling with schoolwork doesn\'t define your worth.',
          escalate: false,
          trustedAdultPrompt: 'When you\'re feeling this way, it helps to talk to someone you trust - a parent, teacher, or friend. They care about you and want to support you. Would you like to take a short break and try a simpler question instead?',
        };
      }
    }

    // Harmful topic detection (context-dependent)
    const harmfulContextKeywords = [
      'nobody loves me', 'i want to run away', 'they hate me',
      'i wish i could escape', 'life is too hard',
    ];

    for (const keyword of harmfulContextKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          detected: true,
          type: 'harmful_topic',
          severity: 'medium',
          response: 'I hear that you\'re going through something difficult. While I\'m here to help with your learning, I\'m concerned about how you\'re feeling.',
          escalate: false,
          trustedAdultPrompt: 'It\'s important to share these feelings with a trusted adult who can support you properly. Would you like to take a break from this work?',
        };
      }
    }

    return {
      detected: false,
      type: null,
      severity: 'low',
      response: '',
      escalate: false,
      trustedAdultPrompt: '',
    };
  }

  /**
   * EXAM INTEGRITY GUARD - Anti-cheating enforcement
   * 
   * Enforcement:
   * If input contains:
   * - "What's the answer?"
   * - "Just give me the answer"
   * - "This is my homework"
   * 
   * Then:
   * - Refuse final answer
   * - Provide hint
   * - Provide worked example of similar question
   * - Ask student to try
   * - Log attempt internally
   */
  detectExamIntegrityViolation(message: string): ExamIntegrityCheck {
    const lowerMessage = message.toLowerCase();

    // Direct answer requests
    const directAnswerPatterns = [
      'what\'s the answer', 'what is the answer', 'give me the answer',
      'just tell me the answer', 'i need the answer', 'what should i write',
      'can you give me', 'just give', 'tell me what to write',
    ];

    for (const pattern of directAnswerPatterns) {
      if (lowerMessage.includes(pattern)) {
        return {
          detected: true,
          type: 'direct_answer_request',
          response: 'I understand you want the answer, but I\'m here to help you learn, not to do the work for you. When you figure it out yourself, you\'re building skills that will help you in exams.',
          hintProvided: 'Let me give you a hint instead...',
          workedExampleProvided: true,
          similarQuestionProvided: true,
        };
      }
    }

    // Homework cheating attempts
    const homeworkCheatPatterns = [
      'this is my homework', 'do my homework', 'homework due tomorrow',
      'teacher will check this', 'this is for marks', 'exam tomorrow help',
      'need this for grade', 'assignment due',
    ];

    for (const pattern of homeworkCheatPatterns) {
      if (lowerMessage.includes(pattern)) {
        return {
          detected: true,
          type: 'homework_cheat',
          response: 'I understand this is for your homework, and I\'m happy to help you learn! But the best way I can help is by showing you how to approach similar problems, so you can solve it yourself.',
          hintProvided: 'Let\'s break down what the question is asking...',
          workedExampleProvided: true,
          similarQuestionProvided: true,
        };
      }
    }

    return {
      detected: false,
      type: 'direct_answer_request',
      response: '',
      hintProvided: '',
      workedExampleProvided: false,
      similarQuestionProvided: false,
    };
  }

  /**
   * Log safeguarding concern to database
   */
  async logSafeguardingConcern(
    studentId: string,
    sessionId: string,
    detection: SafeguardingDetection,
    messageContent: string
  ): Promise<void> {
    const log = new SafeguardingLog();
    log.log_id = `safeguard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log.student_id = studentId;
    log.session_id = sessionId;
    log.flag_type = detection.type as any;
    log.message_content = messageContent;
    log.response_given = detection.response + ' ' + detection.trustedAdultPrompt;
    log.escalated = detection.escalate;

    const repo = getRepository(SafeguardingLog);
    await repo.save(log);

    // In production: Send alert to school safeguarding lead if escalated
    if (detection.escalate) {
      console.warn(`🚨 SAFEGUARDING ALERT: Student ${studentId} - Immediate escalation required`);
      // TODO: Integrate with school notification system
    }
  }

  /**
   * Log exam integrity violation
   */
  async logExamIntegrityViolation(
    studentId: string,
    sessionId: string,
    violation: ExamIntegrityCheck,
    messageContent: string
  ): Promise<void> {
    const log = new ErrorLog();
    log.error_id = `integrity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log.student_id = studentId;
    log.topic_id = sessionId; // Using sessionId as topic reference
    log.error_type = 'method';
    log.question_content = messageContent;
    log.student_answer = 'Attempted to request direct answer';
    log.correct_answer = 'Provided hint and similar example';
    log.feedback_given = violation.response;

    const repo = getRepository(ErrorLog);
    await repo.save(log);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get tutor persona by type
   */
  getTutorPersona(tutorType: string): TutorPersona {
    return this.TUTOR_PERSONAS[tutorType] || this.TUTOR_PERSONAS.maths;
  }

  /**
   * Calculate diagnostic score from answers
   */
  calculateDiagnosticScore(answers: { question: string; answer: string }[]): number {
    if (answers.length === 0) return 50;

    let totalScore = 0;

    answers.forEach(answer => {
      const text = answer.answer.toLowerCase().trim();
      
      if (text.length === 0) {
        totalScore += 0;
      } else if (text.length < 10) {
        totalScore += 25;
      } else if (text.length < 30) {
        totalScore += 50;
      } else {
        totalScore += 75;
      }

      // Bonus for showing understanding
      if (text.includes('because') || text.includes('example') || text.includes('think')) {
        totalScore += 25;
      }
    });

    return Math.min(100, Math.round(totalScore / answers.length));
  }

  /**
   * Evaluate student answer using AI
   */
  async evaluateAnswer(
    topicId: string,
    tutorType: string,
    studentAnswer: string,
    expectedAnswer?: string,
    yearGroup?: string
  ): Promise<Feedback> {
    try {
      const { context, sources } = await this.retrieveContext(topicId, tutorType, yearGroup);
      const persona = this.TUTOR_PERSONAS[tutorType];

      const prompt = this.buildEvaluationPrompt(persona, topicId, context, sources, studentAnswer, expectedAnswer);
      const response = await generateContent(prompt);

      return this.parseEvaluation(response);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        is_correct: false,
        message: 'Let me look at your answer more carefully...',
        next_step: 'Let\'s review this together.',
        error_type: 'method',
        encouragement: 'Keep trying - you\'re learning!',
      };
    }
  }

  /**
   * Build prompt for answer evaluation
   */
  private buildEvaluationPrompt(
    persona: TutorPersona,
    topicId: string,
    context: string,
    sources: string[],
    studentAnswer: string,
    expectedAnswer?: string
  ): string {
    const expectedAnswerInstruction = expectedAnswer
      ? `Expected answer (for reference): "${expectedAnswer}"`
      : 'Evaluate based on understanding shown.';

    const personaInstructions = {
      maths: `You are ${persona.name} evaluating a student's answer about "${topicId}".

Check for:
1. Correct method (exam-board approved)
2. Arithmetic accuracy
3. Conceptual understanding
4. Working shown clearly

Identify error type:
- "arithmetic" = calculation mistake
- "method" = wrong approach
- "misconception" = fundamental misunderstanding
- "careless" = silly mistake

Student answer: "${studentAnswer}"
${expectedAnswerInstruction}

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Specific, encouraging feedback",
  "next_step": "What student should do next",
  "error_type": "arithmetic/method/misconception/careless",
  "correct_answer": "Correct solution if wrong",
  "adaptation": "simplify/challenge/scaffold",
  "encouragement": "Positive message"
}`,

      science: `You are ${persona.name} evaluating a student's answer about "${topicId}".

Check for:
1. Scientific accuracy
2. Understanding of concepts
3. Use of correct terminology
4. Quality of reasoning

Student answer: "${studentAnswer}"
${expectedAnswerInstruction}

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Specific feedback",
  "next_step": "What to do next",
  "error_type": "misconception/method",
  "correct_answer": "Correct explanation if wrong",
  "encouragement": "Positive message"
}`,

      homework: `You are ${persona.name} evaluating a student's answer about "${topicId}".

Check for:
1. Understanding of approach
2. Application of method
3. Effort shown
4. Independence in learning

Student answer: "${studentAnswer}"
${expectedAnswerInstruction}

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Encouraging feedback",
  "next_step": "Guidance for improvement",
  "error_type": "method",
  "adaptation": "scaffold",
  "encouragement": "Positive message"
}`,
    };

    return `${personaInstructions[persona.id]}

SOURCES: ${sources.join(', ')}
CONTEXT: ${context}

Format as valid JSON.`;
  }

  /**
   * Parse evaluation from AI response
   */
  private parseEvaluation(response: string): Feedback {
    try {
      const parsed = JSON.parse(response);
      return {
        is_correct: parsed.is_correct || false,
        message: parsed.message || 'Let\'s review this.',
        next_step: parsed.next_step || 'Try again.',
        error_type: parsed.error_type,
        correct_answer: parsed.correct_answer,
        adaptation: parsed.adaptation,
        encouragement: parsed.encouragement || 'Keep going!',
      };
    } catch {
      return {
        is_correct: false,
        message: 'Let\'s look at this together.',
        next_step: 'I\'ll show you how to approach it.',
        error_type: 'method',
        encouragement: 'You\'re doing great!',
      };
    }
  }

  /**
   * Update topic mastery in database
   */
  async updateMastery(
    studentId: string,
    topicId: string,
    isCorrect: boolean,
    errorType?: string
  ): Promise<ProgressMetrics> {
    const repo = getRepository(TopicMastery);
    
    let mastery = await repo.findOne({
      where: { student_id: studentId, topic_id: topicId },
    });

    if (!mastery) {
      // Create new mastery record
      mastery = new TopicMastery();
      mastery.student_id = studentId;
      mastery.topic_id = topicId;
      mastery.mastery_percent = isCorrect ? 10 : 0;
      mastery.attempts_count = 1;
      mastery.error_tags = errorType ? [errorType] : [];
      mastery.last_practiced = new Date();
    } else {
      // Update existing
      mastery.attempts_count += 1;
      if (isCorrect) {
        mastery.mastery_percent = Math.min(100, mastery.mastery_percent + 10);
      } else {
        mastery.mastery_percent = Math.max(0, mastery.mastery_percent - 5);
        if (errorType && mastery.error_tags && !mastery.error_tags.includes(errorType)) {
          mastery.error_tags.push(errorType);
        }
      }
      mastery.last_practiced = new Date();
    }

    mastery.updateStatus();
    await repo.save(mastery);

    return {
      mastery_percent: mastery.mastery_percent,
      attempts_count: mastery.attempts_count,
      error_tags: mastery.error_tags || [],
      last_practiced: mastery.last_practiced,
      confidence_signal: this.calculateConfidenceSignal(mastery),
      status: mastery.status as 'secure' | 'developing' | 'at_risk',
      trend: this.calculateTrend(mastery),
    };
  }

  /**
   * Calculate confidence signal from mastery data
   */
  private calculateConfidenceSignal(mastery: TopicMastery): number {
    // Simple heuristic: based on mastery % and recent performance
    const baseConfidence = mastery.mastery_percent / 100;
    const attemptBonus = Math.min(0.2, mastery.attempts_count * 0.02);
    return Math.min(1.0, baseConfidence + attemptBonus);
  }

  /**
   * Calculate trend from mastery data
   */
  private calculateTrend(mastery: TopicMastery): 'improving' | 'stable' | 'declining' {
    // Simplified: In production, track historical data
    if (mastery.mastery_percent >= 80) return 'improving';
    if (mastery.mastery_percent >= 50) return 'stable';
    return 'declining';
  }

  /**
   * Get progress dashboard for student
   */
  async getProgressDashboard(studentId: string): Promise<{
    topics: Array<{
      topic_id: string;
      topic_name: string;
      subject: string;
      mastery_percent: number;
      status: 'secure' | 'developing' | 'at_risk';
      attempts: number;
      last_practiced: Date | null;
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
  }> {
    const repo = getRepository(TopicMastery);
    const masteryRecords = await repo.find({
      where: { student_id: studentId },
      order: { updated_at: 'DESC' },
    });

    const topics = masteryRecords.map(record => ({
      topic_id: record.topic_id,
      topic_name: 'Topic', // TODO: Fetch from curriculum
      subject: 'Maths', // TODO: Fetch from curriculum
      mastery_percent: record.mastery_percent,
      status: record.status as 'secure' | 'developing' | 'at_risk',
      attempts: record.attempts_count,
      last_practiced: record.last_practiced,
      error_tags: record.error_tags || [],
      confidence_signal: this.calculateConfidenceSignal(record),
      trend: this.calculateTrend(record),
    }));

    const summary = {
      secure_count: topics.filter(t => t.status === 'secure').length,
      developing_count: topics.filter(t => t.status === 'developing').length,
      at_risk_count: topics.filter(t => t.status === 'at_risk').length,
      total_topics: topics.length,
      overall_mastery: topics.length > 0
        ? Math.round(topics.reduce((sum, t) => sum + t.mastery_percent, 0) / topics.length)
        : 0,
    };

    return { topics, summary };
  }
}

// Export singleton instance
export const smartAiTeacherService = new SmartAiTeacherService();
