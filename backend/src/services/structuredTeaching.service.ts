/**
 * Structured Teaching Flow Service
 * 
 * Implements mandatory 7-step teaching loop:
 * 1. Confirm year group + topic (Curriculum Lock via Qdrant)
 * 2. Diagnostic micro-check (1-3 questions via OpenRouter)
 * 3. Teach in small chunk (OpenRouter + Qdrant context)
 * 4. Guided example (OpenRouter generated worked examples)
 * 5. Student attempt (evaluation via OpenRouter)
 * 6. Feedback with personalisation (trigger-based)
 * 7. Mastery check before moving on (80% pass threshold)
 * 
 * All content generation uses OpenRouter API
 * All curriculum validation uses Qdrant
 */

import { OpenRouterService } from './openRouter.service';
import { RAGService } from './rag.service';
import { qdrantService } from './qdrant.service';

const openRouterService = new OpenRouterService();
const ragService = new RAGService();

// ==================== INTERFACES ====================

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
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  final_answer: string;
  method_notes: string;
  exam_tips: string[];
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
  clarifyingQuestion?: string;
}

export interface PersonalisationTrigger {
  triggered: boolean;
  triggerType: 'two_incorrect' | 'three_failed' | 'high_achiever';
  adaptation: 'simplify' | 'scaffold' | 'visual_analogy' | 'challenge';
  message: string;
  visual_analogy?: string;
  scaffolded_steps?: string[];
}

export interface TeachingSession {
  sessionId: string;
  studentId: string;
  topicId: string;
  tutorType: 'maths' | 'science' | 'homework';
  yearGroup: string;
  currentStep: number;
  attemptCount: number;
  consecutiveIncorrect: number;
  diagnosticScore: number;
  createdAt: Date;
}

// ==================== SERVICE CLASS ====================

export class StructuredTeachingService {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MASTERY_PASS_THRESHOLD = 80;
  private readonly MAX_ATTEMPTS_BEFORE_SIMPLIFY = 2;
  private readonly MAX_ATTEMPTS_BEFORE_SCAFFOLD = 3;

  // Session storage (in production, use Redis/database)
  private sessions: Map<string, TeachingSession> = new Map();

  // ==================== STEP 1: CURRICULUM LOCK ====================

  /**
   * CURRICULUM LOCK MODE
   * Validates topic exists in Qdrant with confidence > 0.7
   * AI may ONLY generate content if curriculum is locked
   */
  async validateCurriculumLock(
    topicId: string,
    tutorType: string,
    yearGroup: string
  ): Promise<CurriculumLockStatus> {
    try {
      // Map tutor type to subject
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      // Query Qdrant via RAG service
      const query = `Teach me about ${topicId}`;
      const result = await ragService.executeRAG({
        question: query,
        studentId: 'system',
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      // Check if topic exists
      const topicExists = result.retrievedChunks && result.retrievedChunks.length > 0;

      if (!topicExists) {
        return {
          locked: false,
          topicExists: false,
          confidence: 0,
          message: `I couldn't find "${topicId}" in our curriculum database.`,
          clarifyingQuestion: 'Could you please select a topic from the available curriculum list?',
        };
      }

      // Calculate average confidence from similarity scores
      const avgConfidence = result.retrievedChunks.reduce((sum, chunk: any) => {
        return sum + (chunk.similarityScore || 0);
      }, 0) / result.retrievedChunks.length;

      if (avgConfidence < this.CONFIDENCE_THRESHOLD) {
        return {
          locked: false,
          topicExists: true,
          confidence: avgConfidence,
          message: `I'm not confident about this content (confidence: ${(avgConfidence * 100).toFixed(0)}%).`,
          clarifyingQuestion: 'Would you like to select a different topic, or shall I proceed with caution?',
        };
      }

      // Curriculum locked successfully
      return {
        locked: true,
        topicExists: true,
        confidence: avgConfidence,
        message: 'Curriculum verified. Ready to teach with approved content.',
      };
    } catch (error) {
      console.error('Curriculum lock validation failed:', error);
      return {
        locked: false,
        topicExists: false,
        confidence: 0,
        message: 'Error accessing curriculum database.',
        clarifyingQuestion: 'Please check if the backend service is running.',
      };
    }
  }

  // ==================== STEP 2: DIAGNOSTIC QUESTIONS ====================

  /**
   * Generate 1-3 diagnostic questions using OpenRouter
   * Based on topic content from Qdrant
   */
  async generateDiagnosticQuestions(
    topicId: string,
    tutorType: string,
    yearGroup: string,
    priorKnowledge?: number
  ): Promise<DiagnosticQuestion[]> {
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      // Get context from Qdrant
      const query = `Generate diagnostic questions for ${topicId}`;
      const result = await ragService.executeRAG({
        question: query,
        studentId: 'system',
        subject,
        keyStage: yearGroup,
        topic: topicId,
      });

      // Format context for OpenRouter
      const context = result.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n')
        .slice(0, 2000); // Limit context length

      // Build prompt for OpenRouter
      const difficultyAdjustment = priorKnowledge !== undefined
        ? priorKnowledge >= 80
          ? 'Student shows strong prior knowledge. Generate challenging questions.'
          : priorKnowledge >= 50
          ? 'Student has some understanding. Generate moderate difficulty questions.'
          : 'Student is new to this topic. Generate accessible foundation questions.'
        : 'Generate standard diagnostic questions.';

      const prompt = `You are ${this.getTutorPersona(tutorType)}. Generate 2-3 diagnostic questions for "${topicId}" (Year ${yearGroup}).

${difficultyAdjustment}

REQUIREMENTS:
- Questions should assess prior knowledge, not test
- Use age-appropriate language for Year ${yearGroup}
- Include questions that check understanding, not just recall
- Format as JSON array

CONTEXT FROM CURRICULUM:
${context}

Format response as JSON:
[
  {
    "id": "q1",
    "question": "Question text",
    "correct_answer": "Expected answer",
    "explanation": "Why this answer is correct",
    "difficulty": "easy|medium|hard"
  }
]

Generate exactly 2-3 questions:`;

      // Call OpenRouter
      const response = await openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      // Parse questions from response
      const questions = this.parseDiagnosticQuestions(response.answer);
      
      // Ensure 1-3 questions
      return questions.slice(0, Math.max(1, Math.min(3, questions.length)));
    } catch (error) {
      console.error('Error generating diagnostic questions:', error);
      return this.getFallbackDiagnosticQuestions(tutorType, topicId);
    }
  }

  private parseDiagnosticQuestions(response: string): DiagnosticQuestion[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed || []).map((q: any, i: number) => ({
          id: q.id || `q${i + 1}`,
          question: q.question || '',
          correct_answer: q.correct_answer || '',
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  private getFallbackDiagnosticQuestions(tutorType: string, topicId: string): DiagnosticQuestion[] {
    return [
      {
        id: 'q1',
        question: `What do you already know about ${topicId}?`,
        correct_answer: '',
        explanation: 'This helps me understand your starting point.',
        difficulty: 'easy',
      },
    ];
  }

  // ==================== STEP 3: TEACHING CHUNK ====================

  /**
   * Generate teaching chunk using OpenRouter + Qdrant context
   * Small, focused chunk of content
   */
  async generateTeachingChunk(
    topicId: string,
    tutorType: string,
    yearGroup: string,
    diagnosticScore?: number
  ): Promise<TeachingChunk> {
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      // Get context from Qdrant
      const query = `Teach ${topicId} to Year ${yearGroup}`;
      const result = await ragService.executeRAG({
        question: query,
        studentId: 'system',
        subject,
        keyStage: yearGroup,
        topic: topicId,
      });

      const context = result.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n')
        .slice(0, 3000);

      // Adapt based on diagnostic score
      const adaptationInstruction = diagnosticScore !== undefined
        ? diagnosticScore >= 80
          ? 'ADVANCED: Provide detailed explanations with challenging examples.'
          : diagnosticScore >= 50
          ? 'INTERMEDIATE: Provide clear explanations with moderate examples.'
          : 'BEGINNER: Simplify language. Use analogies. Provide scaffolded steps.'
        : 'STANDARD: Provide clear, age-appropriate explanations.';

      const prompt = `You are ${this.getTutorPersona(tutorType)}. Teach "${topicId}" to Year ${yearGroup} students.

${adaptationInstruction}

REQUIREMENTS:
- Break content into small, manageable chunks
- Use clear, simple language
- Include key points summary
- Provide at least 1 worked example
- Include 1-2 analogies for understanding
- Describe what should be shown on whiteboard

CURRICULUM CONTEXT:
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
  "analogies": ["Real-world analogy 1", "Real-world analogy 2"],
  "visual_description": "Description for whiteboard display",
  "check_questions": ["Question 1", "Question 2"]
}

Generate complete teaching chunk:`;

      const response = await openRouterService.generateTeacherResponse(prompt, context, []);
      return this.parseTeachingChunk(response.answer);
    } catch (error) {
      console.error('Error generating teaching chunk:', error);
      return this.getFallbackTeachingChunk(tutorType, topicId);
    }
  }

  private parseTeachingChunk(response: string): TeachingChunk {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || '',
          content: parsed.content || '',
          key_points: parsed.key_points || [],
          worked_examples: parsed.worked_examples || [],
          analogies: parsed.analogies || [],
          visual_description: parsed.visual_description || '',
          check_questions: parsed.check_questions || [],
        };
      }
      return {
        title: '',
        content: response,
        key_points: [],
        worked_examples: [],
        analogies: [],
        visual_description: '',
        check_questions: [],
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

  private getFallbackTeachingChunk(tutorType: string, topicId: string): TeachingChunk {
    return {
      title: topicId,
      content: `Let's learn about **${topicId}** together.

I'll guide you through this topic step-by-step, checking your understanding along the way.`,
      key_points: ['Understanding the basics', 'Key concepts', 'Application'],
      worked_examples: [
        {
          problem: `Example problem about ${topicId}`,
          steps: ['Step 1: Understand what is asked', 'Step 2: Choose method', 'Step 3: Work through systematically', 'Step 4: Check answer'],
          final_answer: 'Solution',
          method_notes: 'This method works because...',
          exam_tips: ['Show all working', 'Check units'],
        },
      ],
      analogies: ['Think of this like building blocks - each concept builds on the previous one.'],
      visual_description: `Whiteboard: ${topicId}`,
      check_questions: ['What do you understand so far?', 'Any questions?'],
    };
  }

  // ==================== STEP 4: WORKED EXAMPLE ====================

  /**
   * Generate worked example using OpenRouter
   * Shows step-by-step solution with explanations
   */
  async generateWorkedExample(
    topicId: string,
    tutorType: string,
    problem?: string,
    yearGroup?: string
  ): Promise<WorkedExample> {
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      const query = problem || `Worked example for ${topicId}`;
      const result = await ragService.executeRAG({
        question: query,
        studentId: 'system',
        subject,
        keyStage: yearGroup || '',
        topic: topicId,
      });

      const context = result.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n')
        .slice(0, 2000);

      const problemInstruction = problem
        ? `Solve this specific problem: "${problem}"`
        : 'Generate a representative example problem for this topic.';

      const prompt = `You are ${this.getTutorPersona(tutorType)}. Create a worked example for "${topicId}".

CRITICAL REQUIREMENTS:
- Show EVERY step of working clearly
- Explain EACH step (why this step?)
- Use exam-board approved method
- Highlight where marks are earned
- Include common mistakes to avoid

${problemInstruction}

CURRICULUM CONTEXT:
${context}

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
}

Generate complete worked example:`;

      const response = await openRouterService.generateTeacherResponse(prompt, context, []);
      return this.parseWorkedExample(response.answer);
    } catch (error) {
      console.error('Error generating worked example:', error);
      return this.getFallbackWorkedExample(tutorType, topicId);
    }
  }

  private parseWorkedExample(response: string): WorkedExample {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          problem: parsed.problem || '',
          steps: parsed.steps || [],
          final_answer: parsed.final_answer || '',
          method_notes: parsed.method_notes || '',
          exam_tips: parsed.exam_tips || [],
        };
      }
      return {
        problem: '',
        steps: [],
        final_answer: '',
        method_notes: '',
        exam_tips: [],
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

  private getFallbackWorkedExample(tutorType: string, topicId: string): WorkedExample {
    return {
      problem: `Example: ${topicId}`,
      steps: ['Step 1: Read and understand', 'Step 2: Plan approach', 'Step 3: Execute method', 'Step 4: Verify'],
      final_answer: 'Solution',
      method_notes: 'Standard approach',
      exam_tips: ['Show working', 'Check answer'],
    };
  }

  // ==================== STEP 5-6: EVALUATE & FEEDBACK ====================

  /**
   * Evaluate student attempt and provide feedback
   * Includes personalisation triggers
   */
  async evaluateStudentAttempt(
    topicId: string,
    tutorType: string,
    studentAnswer: string,
    yearGroup?: string,
    attemptCount: number = 0,
    consecutiveIncorrect: number = 0
  ): Promise<{
    feedback: Feedback;
    personalisation?: PersonalisationTrigger;
  }> {
    try {
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      const result = await ragService.executeRAG({
        question: `Evaluate this answer: ${studentAnswer}`,
        studentId: 'system',
        subject,
        keyStage: yearGroup || '',
        topic: topicId,
      });

      const context = result.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n')
        .slice(0, 2000);

      const prompt = `You are ${this.getTutorPersona(tutorType)}. Evaluate this student answer for "${topicId}".

STUDENT ANSWER: "${studentAnswer}"

REQUIREMENTS:
- Be encouraging but honest
- Identify specific errors (arithmetic, method, misconception, or careless)
- Provide clear next steps
- Use age-appropriate language for Year ${yearGroup || '7'}

Format as JSON:
{
  "is_correct": true/false,
  "message": "Detailed feedback message",
  "next_step": "What student should do next",
  "error_type": "arithmetic|method|misconception|careless",
  "correct_answer": "Correct answer if wrong",
  "encouragement": "Encouraging message"
}

Evaluate answer:`;

      const response = await openRouterService.generateTeacherResponse(prompt, context, []);
      const feedback = this.parseFeedback(response.answer);

      // PERSONALISATION ENGINE: Check triggers
      const personalisation = this.checkPersonalisationTriggers(
        attemptCount,
        consecutiveIncorrect,
        feedback.is_correct
      );

      // Generate additional support if triggered
      if (personalisation.triggered) {
        if (personalisation.adaptation === 'visual_analogy') {
          personalisation.visual_analogy = await this.generateVisualAnalogy(topicId, tutorType);
        }

        if (personalisation.adaptation === 'scaffold') {
          personalisation.scaffolded_steps = this.generateScaffoldedSteps(tutorType);
        }
      }

      return { feedback, personalisation: personalisation.triggered ? personalisation : undefined };
    } catch (error) {
      console.error('Error evaluating attempt:', error);
      return {
        feedback: {
          is_correct: false,
          message: 'Let me review your answer...',
          next_step: 'Keep trying!',
          encouragement: 'You can do this!',
        },
      };
    }
  }

  private parseFeedback(response: string): Feedback {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          is_correct: parsed.is_correct || false,
          message: parsed.message || '',
          next_step: parsed.next_step || '',
          error_type: parsed.error_type,
          correct_answer: parsed.correct_answer,
          encouragement: parsed.encouragement || 'Keep trying!',
        };
      }
      return {
        is_correct: false,
        message: response,
        next_step: 'Try again',
        encouragement: 'Keep trying!',
      };
    } catch {
      return {
        is_correct: false,
        message: response,
        next_step: 'Try again',
        encouragement: 'Keep trying!',
      };
    }
  }

  // ==================== PERSONALISATION ENGINE ====================

  /**
   * PERSONALISATION ENGINE - Trigger-based adaptation
   * 
   * Triggers:
   * - 2 incorrect attempts → Simplify + Visual Analogy
   * - 3 failed attempts → Scaffold
   */
  checkPersonalisationTriggers(
    attemptCount: number,
    consecutiveIncorrect: number,
    lastAttemptCorrect: boolean
  ): PersonalisationTrigger {
    // Trigger: 3 failed attempts → Scaffold
    if (attemptCount >= this.MAX_ATTEMPTS_BEFORE_SCAFFOLD && !lastAttemptCorrect) {
      return {
        triggered: true,
        triggerType: 'three_failed',
        adaptation: 'scaffold',
        message: "I can see this is challenging. Let me break this down into smaller, manageable steps for you.",
      };
    }

    // Trigger: 2 incorrect attempts → Simplify + Visual Analogy
    if (consecutiveIncorrect >= this.MAX_ATTEMPTS_BEFORE_SIMPLIFY && !lastAttemptCorrect) {
      return {
        triggered: true,
        triggerType: 'two_incorrect',
        adaptation: 'visual_analogy',
        message: "Let me show you this in a different way with a visual analogy to help understanding.",
      };
    }

    return {
      triggered: false,
      triggerType: 'two_incorrect',
      adaptation: 'simplify',
      message: '',
    };
  }

  private async generateVisualAnalogy(topicId: string, tutorType: string): Promise<string> {
    const prompt = `Create a VISUAL ANALOGY to explain "${topicId}".

Requirements:
- Use everyday situations students can relate to
- Create a mental image that makes the concept concrete
- Keep it simple and memorable
- Connect the analogy back to the actual concept

Example format:
"Think of it like [everyday situation]. Just as [analogy explanation], in ${topicId} we have [concept connection]."

Generate a visual analogy:`;

    try {
      const response = await openRouterService.generateTeacherResponse(prompt, '', []);
      return response.answer.trim();
    } catch {
      return `Think of ${topicId} like a building process - you need a strong foundation before adding the upper floors.`;
    }
  }

  private generateScaffoldedSteps(tutorType: string): string[] {
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

  // ==================== STEP 7: MASTERY CHECK ====================

  /**
   * Generate mastery check questions
   * 80% pass threshold required
   */
  async generateMasteryCheck(
    topicId: string,
    tutorType: string,
    yearGroup: string
  ): Promise<{
    questions: DiagnosticQuestion[];
    pass_threshold: number;
    instructions: string;
  }> {
    // Generate questions same as diagnostic
    const questions = await this.generateDiagnosticQuestions(topicId, tutorType, yearGroup);

    return {
      questions,
      pass_threshold: this.MASTERY_PASS_THRESHOLD,
      instructions: `Answer these questions to demonstrate your understanding of **${topicId}**.\n\nYou need to score **${this.MASTERY_PASS_THRESHOLD}%** or higher to pass.`,
    };
  }

  // ==================== HELPERS ====================

  private getTutorPersona(tutorType: string): string {
    const personas: Record<string, string> = {
      maths: 'Prof. Mathew, a Mathematics teacher who uses step-by-step working and exam-board approved methods',
      science: 'Dr. Science, a Science teacher who uses question-led explanations and real-world applications',
      homework: 'Teacher Alex, a Homework tutor who provides guided support without giving direct answers',
    };
    return personas[tutorType] || personas.maths;
  }

  // Session management
  createSession(
    sessionId: string,
    studentId: string,
    topicId: string,
    tutorType: 'maths' | 'science' | 'homework',
    yearGroup: string
  ): TeachingSession {
    const session: TeachingSession = {
      sessionId,
      studentId,
      topicId,
      tutorType,
      yearGroup,
      currentStep: 1,
      attemptCount: 0,
      consecutiveIncorrect: 0,
      diagnosticScore: 0,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): TeachingSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<TeachingSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.sessions.set(sessionId, session);
    }
  }
}

// Export singleton instance
export const structuredTeachingService = new StructuredTeachingService();
