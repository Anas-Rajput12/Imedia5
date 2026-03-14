import { getRepository } from 'typeorm';
import { TeachingSession } from '../models/teachingSession';
import { TopicMastery } from '../models/topicMastery';
import { SafeguardingLog } from '../models/safeguardingLog';
import { ErrorLog } from '../models/errorLog';
import { ragService } from './rag.service';
import { geminiService } from './gemini.service';

/**
 * SMART AI Teacher Service
 * Implements structured teaching flow with curriculum lock,
 * personalisation engine, and safeguarding.
 * 
 * Architecture Layers:
 * 1. Retrieval Layer (Curriculum only)
 * 2. Teaching Logic Layer (structured flow)
 * 3. Personalisation Engine (profile updates)
 * 4. Safety & Guardrail Layer
 */

export interface TeachingStep {
  step: number;
  title: string;
  description: string;
}

export interface DiagnosticQuestion {
  question: string;
  correct_answer: string;
  explanation: string;
}

export interface TeachingChunk {
  content: string;
  key_points: string[];
  examples: string[];
  analogies?: string[];
  visual_description?: string;
}

export interface Feedback {
  is_correct: boolean;
  message: string;
  next_step: string;
  adaptation?: 'simplify' | 'challenge' | 'scaffold';
  error_type?: 'arithmetic' | 'method' | 'misconception';
  correct_answer?: string;
  scaffolded_steps?: string[];
}

export interface SafeguardingCheck {
  detected: boolean;
  type?: 'emotional_distress' | 'self_harm' | 'cheating_attempt';
  response?: string;
  escalate?: boolean;
}

export class SmartTeachingService {
  private readonly TEACHING_STEPS: TeachingStep[] = [
    { step: 1, title: 'Confirm', description: 'Confirm year group + topic' },
    { step: 2, title: 'Diagnostic', description: 'Diagnostic micro-check (1-3 questions)' },
    { step: 3, title: 'Teach', description: 'Teach in small chunk' },
    { step: 4, title: 'Example', description: 'Guided example' },
    { step: 5, title: 'Attempt', description: 'Student attempt' },
    { step: 6, title: 'Feedback', description: 'Feedback' },
    { step: 7, title: 'Mastery', description: 'Mastery check' },
  ];

  /**
   * Safeguarding detection keywords
   */
  private readonly SAFEGUARDING_KEYWORDS = {
    emotional_distress: [
      "i'm stupid",
      "i hate myself",
      "i'm worthless",
      "nobody cares",
      "i give up",
      "i can't do this",
      "i'm dumb",
      "this is too hard",
      "i'm useless",
    ],
    self_harm: [
      "hurt myself",
      "self-harm",
      "cutting",
      "suicide",
      "end it all",
      "kill myself",
      "die",
      "wish i was dead",
    ],
    cheating: [
      "just give me the answer",
      "what's the answer",
      "this is my homework",
      "exam tomorrow help",
      "do my homework",
      "i need the answer now",
      "can you tell me the answer",
      "what should i write",
    ],
  };

  /**
   * Start a new teaching session
   */
  async startSession(
    studentId: string,
    topicId: string,
    tutorType: 'maths' | 'science' | 'homework',
    yearGroup?: string
  ): Promise<{
    session_id: string;
    step: number;
    diagnostic_questions?: DiagnosticQuestion[];
    message: string;
    topic_name?: string;
  }> {
    const sessionId = `session_${Date.now()}_${studentId}`;

    // Create teaching session
    const session = new TeachingSession();
    session.session_id = sessionId;
    session.student_id = studentId;
    session.topic_id = topicId;
    session.tutor_type = tutorType;
    session.current_step = 1;

    await getRepository(TeachingSession).save(session);

    // Check curriculum lock
    const curriculumCheck = await this.checkCurriculumLock(topicId, tutorType);
    if (!curriculumCheck.locked) {
      return {
        session_id: sessionId,
        step: 1,
        message: curriculumCheck.message,
      };
    }

    // Generate diagnostic questions based on tutor type
    const diagnosticQuestions = await this.generateDiagnosticQuestions(
      topicId,
      tutorType,
      yearGroup
    );

    // Get topic name for display
    const topicName = await this.getTopicName(topicId, tutorType);

    return {
      session_id: sessionId,
      step: 1,
      diagnostic_questions: diagnosticQuestions,
      message: this.getWelcomeMessage(tutorType, topicName),
      topic_name: topicName,
    };
  }

  /**
   * Get welcome message based on tutor type
   */
  private getWelcomeMessage(tutorType: string, topicName?: string): string {
    const messages = {
      maths: `Hello! I'm Prof. Mathew, your Maths teacher. Today we're learning about **${topicName}**. I'll guide you through step-by-step, showing you exactly how to solve problems using exam-board approved methods. Let's start with a quick check to see what you already know!`,
      science: `Hi there! I'm Dr. Science, and I'm excited to teach you about **${topicName}**. We'll explore scientific concepts together, and I'll ask you questions to help you think like a scientist. Ready to begin?`,
      homework: `Hey! I'm Teacher Alex, your Homework Tutor. I'm here to help you learn, not to give you answers. We'll work through problems together, and I'll show you similar examples so you can solve your homework yourself. Let's get started!`,
    };
    return messages[tutorType as keyof typeof messages] || messages.maths;
  }

  /**
   * Check curriculum lock before teaching
   * AI may ONLY generate factual teaching content if:
   * - A valid TopicID is selected
   * - Retrieved context exists
   * - Retrieval confidence > threshold (0.7)
   */
  private async checkCurriculumLock(
    topicId: string,
    tutorType: string
  ): Promise<{
    locked: boolean;
    message: string;
  }> {
    try {
      // 1. Verify valid TopicID exists
      if (!topicId || topicId.trim() === '') {
        return {
          locked: false,
          message: "I need to know which topic you'd like to learn about. Could you please select a topic from the curriculum?",
        };
      }

      // 2. Check if topic exists in curriculum
      const subjectMap: Record<string, string> = {
        'maths': 'Maths',
        'science': 'Biology',
        'homework': 'English',
      };
      const subject = subjectMap[tutorType] || 'Maths';

      // Try to retrieve topic content from Qdrant
      const retrievalResult = await ragService.getTopicContent(subject, topicId, '');
      
      // 3. Check if retrieved context exists
      if (!retrievalResult || !retrievalResult.documents || retrievalResult.documents.length === 0) {
        return {
          locked: false,
          message: `I couldn't find information about "${topicId}" in our curriculum. Could you check the topic name or select from the available topics?`,
        };
      }

      // 4. Check retrieval confidence (if available)
      // Note: Current implementation doesn't return confidence, but we check document existence
      const hasContent = retrievalResult.documents.some(doc => 
        doc.chunks && doc.chunks.length > 0
      );

      if (!hasContent) {
        return {
          locked: false,
          message: `I found the topic "${topicId}" but don't have enough content to teach it properly. Let me know if you'd like to try a different topic!`,
        };
      }

      return {
        locked: true,
        message: 'Curriculum verified. Ready to teach!',
      };
    } catch (error) {
      console.error('Curriculum lock check failed:', error);
      return {
        locked: false,
        message: "I'm having trouble accessing the curriculum right now. Let's try again in a moment!",
      };
    }
  }

  /**
   * Get topic name from topic ID
   */
  private async getTopicName(topicId: string, tutorType: string): Promise<string> {
    // For now, return the topicId as name
    // TODO: Fetch from curriculum database
    return topicId;
  }

  /**
   * Generate diagnostic micro-check questions (1-3 questions)
   * Based on topic and tutor type
   */
  private async generateDiagnosticQuestions(
    topicId: string,
    tutorType: string,
    yearGroup?: string
  ): Promise<DiagnosticQuestion[]> {
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    };
    const subject = subjectMap[tutorType] || 'Maths';

    try {
      // Retrieve topic content to generate relevant questions
      const content = await ragService.getTopicContent(subject, topicId, yearGroup || '');
      
      // Use Gemini to generate diagnostic questions from content
      const prompt = this.generateDiagnosticPrompt(tutorType, topicId, content);
      const response = await geminiService.generateContent(prompt);
      
      // Parse response into DiagnosticQuestion array
      const questions = this.parseDiagnosticQuestions(response);
      
      // Limit to 1-3 questions
      return questions.slice(0, 3);
    } catch (error) {
      console.error('Error generating diagnostic questions:', error);
      // Fallback to generic questions
      return this.getFallbackDiagnosticQuestions(tutorType, topicId);
    }
  }

  /**
   * Generate prompt for diagnostic question creation
   */
  private generateDiagnosticPrompt(
    tutorType: string,
    topicId: string,
    content: any
  ): string {
    const tutorInstructions = {
      maths: `You are Prof. Mathew, a Maths teacher. Generate 2-3 diagnostic questions for the topic "${topicId}". Questions should check prior knowledge and be solvable without a calculator. Include the correct answer and a brief explanation for each.`,
      science: `You are Dr. Science, a Science teacher. Generate 2-3 diagnostic questions for the topic "${topicId}". Questions should check understanding of key scientific concepts. Include the correct answer and explanation.`,
      homework: `You are Teacher Alex, a Homework Tutor. Generate 2-3 diagnostic questions for the topic "${topicId}". Questions should assess reading comprehension or writing skills. Include answers and explanations.`,
    };

    return `${tutorInstructions[tutorType as keyof typeof tutorInstructions]}

Format your response as JSON:
{
  "questions": [
    {
      "question": "Question text here",
      "correct_answer": "Answer",
      "explanation": "Why this is correct"
    }
  ]
}

Topic content:
${JSON.stringify(content, null, 2)}`;
  }

  /**
   * Parse diagnostic questions from AI response
   */
  private parseDiagnosticQuestions(response: string): DiagnosticQuestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.questions || [];
    } catch {
      return [];
    }
  }

  /**
   * Fallback diagnostic questions if AI fails
   */
  private getFallbackDiagnosticQuestions(
    tutorType: string,
    topicId: string
  ): DiagnosticQuestion[] {
    const fallbacks: Record<string, DiagnosticQuestion[]> = {
      maths: [
        {
          question: `What do you already know about ${topicId}?`,
          correct_answer: '',
          explanation: 'This helps me understand your starting point.',
        },
        {
          question: 'Can you give me an example of where you might use this in real life?',
          correct_answer: '',
          explanation: 'Connecting maths to real situations helps understanding.',
        },
      ],
      science: [
        {
          question: `What comes to mind when you hear "${topicId}"?`,
          correct_answer: '',
          explanation: 'I want to understand your current thinking.',
        },
        {
          question: 'Have you learned anything similar before?',
          correct_answer: '',
          explanation: 'Building on prior knowledge helps learning.',
        },
      ],
      homework: [
        {
          question: `What do you find most challenging about ${topicId}?`,
          correct_answer: '',
          explanation: 'Knowing your challenges helps me support you.',
        },
        {
          question: 'What would you like to get better at?',
          correct_answer: '',
          explanation: 'Setting goals helps us focus our learning.',
        },
      ],
    };

    return fallbacks[tutorType] || fallbacks.maths;
  }

  /**
   * Submit diagnostic answers and get teaching chunk
   */
  async submitDiagnostic(
    sessionId: string,
    answers: { question: string; answer: string }[],
    studentId: string
  ): Promise<{
    step: number;
    score: number;
    message: string;
    teaching_chunk?: TeachingChunk;
    adaptation?: 'simplify' | 'challenge';
  }> {
    const session = await getRepository(TeachingSession).findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate diagnostic score
    const score = this.calculateDiagnosticScore(answers);
    session.diagnostic_score = score;
    session.nextStep(); // Move to step 3 (Teach)

    await getRepository(TeachingSession).save(session);

    // Generate teaching chunk based on diagnostic score
    const teachingChunk = await this.generateTeachingChunk(
      session.topic_id,
      session.tutor_type,
      score
    );

    // Personalisation: Adapt based on score
    let message = '';
    let adaptation: 'simplify' | 'challenge' | undefined;

    if (score >= 80) {
      message = 'Excellent! You already have strong understanding. Let\'s build on that and go deeper.';
      adaptation = 'challenge';
    } else if (score >= 50) {
      message = 'Good start! You know some basics. Let\'s clarify and strengthen your understanding.';
    } else {
      message = 'That\'s perfectly fine! We\'ll start from the basics and build up together. Everyone learns at their own pace.';
      adaptation = 'simplify';
    }

    return {
      step: session.current_step,
      score,
      message,
      teaching_chunk: teachingChunk,
      adaptation,
    };
  }

  /**
   * Calculate diagnostic score (0-100)
   */
  private calculateDiagnosticScore(answers: { question: string; answer: string }[]): number {
    if (answers.length === 0) return 50; // Default if no answers

    // Simple scoring: check if answers have reasonable length
    // TODO: Use AI to evaluate answer quality
    let totalScore = 0;

    answers.forEach(answer => {
      const text = answer.answer.toLowerCase().trim();
      
      // Check for empty or very short answers
      if (text.length === 0) {
        totalScore += 0;
      } else if (text.length < 10) {
        totalScore += 25;
      } else if (text.length < 30) {
        totalScore += 50;
      } else {
        totalScore += 75;
      }

      // Bonus for showing understanding (keywords)
      if (text.includes('because') || text.includes('example') || text.includes('think')) {
        totalScore += 25;
      }
    });

    return Math.min(100, Math.round(totalScore / answers.length));
  }

  /**
   * Generate teaching chunk based on knowledge level
   */
  private async generateTeachingChunk(
    topicId: string,
    tutorType: string,
    knowledgeLevel: number
  ): Promise<TeachingChunk> {
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    };
    const subject = subjectMap[tutorType] || 'Maths';

    try {
      // Retrieve content from Qdrant
      const content = await ragService.getTopicContent(subject, topicId, '');

      // Use Gemini to generate teaching chunk
      const prompt = this.generateTeachingChunkPrompt(
        tutorType,
        topicId,
        content,
        knowledgeLevel
      );
      const response = await geminiService.generateContent(prompt);

      // Parse response
      return this.parseTeachingChunk(response);
    } catch (error) {
      console.error('Error generating teaching chunk:', error);
      return this.getFallbackTeachingChunk(tutorType, topicId, knowledgeLevel);
    }
  }

  /**
   * Generate prompt for teaching chunk creation
   */
  private generateTeachingChunkPrompt(
    tutorType: string,
    topicId: string,
    content: any,
    knowledgeLevel: number
  ): string {
    const adaptationInstruction = knowledgeLevel >= 80
      ? 'Student shows strong prior knowledge. Provide advanced explanations with challenging examples.'
      : knowledgeLevel >= 50
      ? 'Student has some understanding. Provide clear explanations with moderate difficulty.'
      : 'Student is new to this topic. Simplify language, use analogies, and provide scaffolded steps.';

    const tutorInstructions = {
      maths: `You are Prof. Mathew. Teach "${topicId}" using exam-board approved methods. Show step-by-step working. ${adaptationInstruction}

Include:
- Clear explanation (2-3 paragraphs)
- 3-4 key points
- 2 worked examples with full working
- Visual description for whiteboard`,
      science: `You are Dr. Science. Teach "${topicId}" using question-led explanations. ${adaptationInstruction}

Include:
- Clear explanation with "why" and "how" questions
- 3-4 key concepts
- 2 real-world examples
- Suggest where a video could help (describe what video would show)`,
      homework: `You are Teacher Alex. Support learning about "${topicId}" without giving direct answers. ${adaptationInstruction}

Include:
- Guidance on approach (not answers)
- 3-4 key strategies
- 2 similar examples (not the actual homework)
- Scaffolded steps`,
    };

    return `${tutorInstructions[tutorType as keyof typeof tutorInstructions]}

Format as JSON:
{
  "content": "Main teaching text",
  "key_points": ["Point 1", "Point 2"],
  "examples": ["Example 1", "Example 2"],
  "analogies": ["Analogy to help understanding"],
  "visual_description": "Description for whiteboard"
}

Topic content:
${JSON.stringify(content, null, 2)}`;
  }

  /**
   * Parse teaching chunk from AI response
   */
  private parseTeachingChunk(response: string): TeachingChunk {
    try {
      const parsed = JSON.parse(response);
      return {
        content: parsed.content || '',
        key_points: parsed.key_points || [],
        examples: parsed.examples || [],
        analogies: parsed.analogies || [],
        visual_description: parsed.visual_description || '',
      };
    } catch {
      return {
        content: response,
        key_points: [],
        examples: [],
      };
    }
  }

  /**
   * Fallback teaching chunk
   */
  private getFallbackTeachingChunk(
    tutorType: string,
    topicId: string,
    knowledgeLevel: number
  ): TeachingChunk {
    const fallbacks: Record<string, TeachingChunk> = {
      maths: {
        content: `Let's learn about **${topicId}**.

This is an important mathematical concept that you'll use in exams.

I'll show you step-by-step how to approach problems in this topic. Remember to always show your working - it helps you avoid mistakes and earns method marks in exams!`,
        key_points: [
          'Understand what the question is asking',
          'Choose the correct method',
          'Show all your working clearly',
          'Check your answer makes sense',
        ],
        examples: [
          'Example 1: Let\'s work through a simple case together...',
          'Example 2: Now let\'s try a more challenging problem...',
        ],
        visual_description: `Whiteboard: ${topicId}\n\nKey Steps:\n1. Read question\n2. Choose method\n3. Show working\n4. Check answer`,
      },
      science: {
        content: `Today we're exploring **${topicId}**.

Science is all about understanding how the world works. As we go through this, I'll ask you questions to help you think like a scientist.

Pause and think about each question before I reveal the answer!`,
        key_points: [
          'What do we already know?',
          'What are we trying to find out?',
          'What evidence supports this?',
          'How does this connect to other concepts?',
        ],
        examples: [
          'Real-world example 1: This concept applies when...',
          'Real-world example 2: You can see this in action when...',
        ],
        visual_description: `Whiteboard: ${topicId}\n\nKey Concepts:\n• Concept 1\n• Concept 2\n• Connections`,
      },
      homework: {
        content: `I'm here to help you learn about **${topicId}**.

Remember, my job is to help you learn, not to give you answers. When you're stuck on homework, the best approach is to:

1. Break the problem into smaller parts
2. Look for similar examples
3. Try applying the method
4. Check your understanding

Let's work through this together!`,
        key_points: [
          'Understand the question first',
          'Find a similar example',
          'Apply the method step-by-step',
          'Review and check your work',
        ],
        examples: [
          'Similar problem 1: Here\'s a question like yours...',
          'Similar problem 2: Notice how we approach this...',
        ],
        visual_description: `Whiteboard: ${topicId}\n\nApproach:\n1. Understand\n2. Plan\n3. Solve\n4. Check`,
      },
    };

    return fallbacks[tutorType] || fallbacks.maths;
  }

  /**
   * Submit student attempt and get feedback
   * Implements personalisation engine with trigger-based adaptation
   */
  async submitAttempt(
    sessionId: string,
    answer: string,
    studentId: string
  ): Promise<{
    step: number;
    feedback: Feedback;
    adaptation_triggered?: 'simplify' | 'challenge' | 'scaffold';
  }> {
    const session = await getRepository(TeachingSession).findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // SAFEGUARDING LAYER: Check for concerns first
    const safeguardingCheck = this.detectSafeguardingConcerns(answer);
    if (safeguardingCheck.detected) {
      await this.logSafeguardingConcern(
        session.student_id,
        session.session_id,
        safeguardingCheck.type!,
        answer
      );

      return {
        step: session.current_step,
        feedback: {
          is_correct: false,
          message: safeguardingCheck.response!,
          next_step: 'Let\'s take a break from this question. Is everything okay?',
        },
      };
    }

    // EXAM INTEGRITY: Check for cheating attempts
    const cheatingCheck = this.detectCheatingAttempt(answer);
    if (cheatingCheck.detected) {
      await this.logSafeguardingConcern(
        session.student_id,
        session.session_id,
        'cheating_attempt',
        answer
      );

      return {
        step: session.current_step,
        feedback: {
          is_correct: false,
          message: 'I understand you want the answer, but I\'m here to help you learn. Let me show you a similar example instead, then you can try your question.',
          next_step: 'Try solving this similar problem first.',
          adaptation: 'scaffold',
          scaffolded_steps: [
            'Look at the similar example I\'ll show you',
            'Notice the method used',
            'Apply the same method to your question',
            'Show your working step-by-step',
          ],
        },
      };
    }

    // Evaluate answer
    const evaluation = await this.evaluateAnswer(
      session.topic_id,
      session.tutor_type,
      answer
    );

    session.attempts += 1;

    // Log error if incorrect
    if (!evaluation.is_correct && evaluation.error_type) {
      await this.logError(
        session.student_id,
        session.topic_id,
        evaluation.error_type,
        answer,
        evaluation.correct_answer || '',
        evaluation.message
      );

      // Update topic mastery
      await this.updateMastery(
        session.student_id,
        session.topic_id,
        false
      );
    }

    // PERSONALISATION ENGINE: Check for adaptation triggers
    let adaptationTriggered: 'simplify' | 'challenge' | 'scaffold' | undefined;

    if (session.attempts >= 2 && !evaluation.is_correct) {
      // Trigger: 2 incorrect attempts → Switch explanation style
      adaptationTriggered = 'simplify';
      evaluation.adaptation = 'simplify';
    }

    if (session.attempts >= 3 && !evaluation.is_correct) {
      // Trigger: 3 failed attempts → Escalation suggestion
      adaptationTriggered = 'scaffold';
      evaluation.adaptation = 'scaffold';
    }

    if (evaluation.is_correct && session.diagnostic_score && session.diagnostic_score >= 80) {
      // High achiever gets challenge
      adaptationTriggered = 'challenge';
      evaluation.adaptation = 'challenge';
    }

    session.nextStep(); // Move to feedback step
    await getRepository(TeachingSession).save(session);

    return {
      step: session.current_step,
      feedback: evaluation,
      adaptation_triggered: adaptationTriggered,
    };
  }

  /**
   * Detect safeguarding concerns
   */
  private detectSafeguardingConcerns(message: string): SafeguardingCheck {
    const lowerMessage = message.toLowerCase();

    // Check for self-harm (highest priority - requires escalation)
    for (const keyword of this.SAFEGUARDING_KEYWORDS.self_harm) {
      if (lowerMessage.includes(keyword)) {
        return {
          detected: true,
          type: 'self_harm',
          response: 'I hear that you\'re really struggling right now, and I want you to know that your wellbeing is the most important thing. Please talk to a trusted adult about how you\'re feeling - a parent, teacher, or school counsellor. They care about you and want to help. Would you like to take a break from this work?',
          escalate: true,
        };
      }
    }

    // Check for emotional distress
    for (const keyword of this.SAFEGUARDING_KEYWORDS.emotional_distress) {
      if (lowerMessage.includes(keyword)) {
        return {
          detected: true,
          type: 'emotional_distress',
          response: 'I can see this is frustrating you, and that\'s completely okay. Learning challenging things can feel overwhelming sometimes. Let\'s take a short break. Remember, it\'s always good to talk to someone you trust when you\'re feeling this way. Would you like to try a simpler question instead?',
          escalate: false,
        };
      }
    }

    return { detected: false };
  }

  /**
   * Detect cheating attempts (Exam Integrity Guard)
   */
  private detectCheatingAttempt(message: string): { detected: boolean } {
    const lowerMessage = message.toLowerCase();

    for (const keyword of this.SAFEGUARDING_KEYWORDS.cheating) {
      if (lowerMessage.includes(keyword)) {
        return { detected: true };
      }
    }

    return { detected: false };
  }

  /**
   * Log safeguarding concern
   */
  private async logSafeguardingConcern(
    studentId: string,
    sessionId: string,
    flagType: string,
    messageContent: string
  ): Promise<void> {
    const log = new SafeguardingLog();
    log.log_id = `safeguard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log.student_id = studentId;
    log.session_id = sessionId;
    log.flag_type = flagType as 'emotional_distress' | 'self_harm' | 'cheating_attempt';
    log.message_content = messageContent;
    log.response_given = 'Supportive response provided';
    log.escalated = flagType === 'self_harm';

    await getRepository(SafeguardingLog).save(log);
  }

  /**
   * Log error
   */
  private async logError(
    studentId: string,
    topicId: string,
    errorType: string,
    studentAnswer: string,
    correctAnswer: string,
    feedbackGiven: string
  ): Promise<void> {
    const log = new ErrorLog();
    log.error_id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    log.student_id = studentId;
    log.topic_id = topicId;
    log.error_type = errorType as 'arithmetic' | 'method' | 'misconception';
    log.question_content = studentAnswer;
    log.student_answer = studentAnswer;
    log.correct_answer = correctAnswer;
    log.feedback_given = feedbackGiven;

    await getRepository(ErrorLog).save(log);
  }

  /**
   * Evaluate answer using AI
   */
  private async evaluateAnswer(
    topicId: string,
    tutorType: string,
    answer: string
  ): Promise<Feedback> {
    const subjectMap: Record<string, string> = {
      'maths': 'Maths',
      'science': 'Biology',
      'homework': 'English',
    };
    const subject = subjectMap[tutorType] || 'Maths';

    try {
      // Retrieve topic content for evaluation context
      const content = await ragService.getTopicContent(subject, topicId, '');

      // Use Gemini to evaluate answer
      const prompt = this.generateEvaluationPrompt(
        tutorType,
        topicId,
        content,
        answer
      );
      const response = await geminiService.generateContent(prompt);

      // Parse response
      return this.parseEvaluation(response);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        is_correct: false,
        message: 'Let me look at your answer more carefully...',
        next_step: 'Let\'s review this together.',
        error_type: 'method',
      };
    }
  }

  /**
   * Generate prompt for answer evaluation
   */
  private generateEvaluationPrompt(
    tutorType: string,
    topicId: string,
    content: any,
    answer: string
  ): string {
    const tutorInstructions = {
      maths: `You are Prof. Mathew evaluating a student's answer about "${topicId}".

Check for:
1. Correct method (exam-board approved)
2. Arithmetic accuracy
3. Conceptual understanding

Identify error type:
- "arithmetic" = calculation mistake
- "method" = wrong approach
- "misconception" = fundamental misunderstanding

Student answer: "${answer}"

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Specific feedback about what went wrong/right",
  "next_step": "What student should do next",
  "error_type": "arithmetic/method/misconception",
  "correct_answer": "Correct solution if wrong",
  "adaptation": "simplify/challenge/scaffold"
}`,
      science: `You are Dr. Science evaluating a student's answer about "${topicId}".

Check for:
1. Scientific accuracy
2. Understanding of concepts
3. Use of correct terminology

Student answer: "${answer}"

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Specific feedback",
  "next_step": "What to do next",
  "error_type": "misconception",
  "correct_answer": "Correct explanation if wrong"
}`,
      homework: `You are Teacher Alex evaluating a student's answer about "${topicId}".

Check for:
1. Understanding of approach
2. Application of method
3. Effort shown

Student answer: "${answer}"

Respond as JSON:
{
  "is_correct": true/false,
  "message": "Encouraging feedback",
  "next_step": "Guidance for improvement",
  "error_type": "method",
  "adaptation": "scaffold"
}`,
    };

    return `${tutorInstructions[tutorType as keyof typeof tutorInstructions]}

Topic content:
${JSON.stringify(content, null, 2)}`;
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
      };
    } catch {
      return {
        is_correct: false,
        message: 'Let\'s look at this together.',
        next_step: 'I\'ll show you how to approach it.',
        error_type: 'method',
      };
    }
  }

  /**
   * Update topic mastery
   */
  async updateMastery(
    studentId: string,
    topicId: string,
    isCorrect: boolean
  ): Promise<void> {
    const mastery = await getRepository(TopicMastery).findOne({
      where: { student_id: studentId, topic_id: topicId },
    });

    if (!mastery) {
      // Create new mastery record
      const newMastery = new TopicMastery();
      newMastery.student_id = studentId;
      newMastery.topic_id = topicId;
      newMastery.mastery_percent = isCorrect ? 10 : 0;
      newMastery.attempts_count = 1;
      newMastery.updateStatus();

      await getRepository(TopicMastery).save(newMastery);
    } else {
      // Update existing
      mastery.incrementAttempts();
      if (isCorrect) {
        mastery.mastery_percent = Math.min(100, mastery.mastery_percent + 10);
      } else {
        mastery.mastery_percent = Math.max(0, mastery.mastery_percent - 5);
      }
      mastery.updateStatus();

      await getRepository(TopicMastery).save(mastery);
    }
  }

  /**
   * Get student progress dashboard
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
      error_tags?: string[];
    }>;
    summary: {
      secure_count: number;
      developing_count: number;
      at_risk_count: number;
      total_topics: number;
    };
  }> {
    const masteryRecords = await getRepository(TopicMastery).find({
      where: { student_id: studentId },
      order: { updated_at: 'DESC' },
    });

    const topics = masteryRecords.map(record => ({
      topic_id: record.topic_id,
      topic_name: 'Topic', // TODO: Fetch from curriculum
      subject: 'Maths', // TODO: Fetch from curriculum
      mastery_percent: record.mastery_percent,
      status: record.status,
      attempts: record.attempts_count,
      last_practiced: record.last_practiced,
      error_tags: record.error_tags || [],
    }));

    return {
      topics,
      summary: {
        secure_count: topics.filter(t => t.status === 'secure').length,
        developing_count: topics.filter(t => t.status === 'developing').length,
        at_risk_count: topics.filter(t => t.status === 'at_risk').length,
        total_topics: topics.length,
      },
    };
  }

  /**
   * Get mastery check questions
   */
  async generateMasteryCheckQuestions(
    topicId: string,
    tutorType: string
  ): Promise<DiagnosticQuestion[]> {
    return this.generateDiagnosticQuestions(topicId, tutorType, '');
  }

  /**
   * Complete teaching session
   */
  async completeSession(
    sessionId: string,
    masteryPassed: boolean
  ): Promise<{
    completed: boolean;
    mastery_percent: number;
    next_steps: string;
  }> {
    const session = await getRepository(TeachingSession).findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    session.complete(masteryPassed);
    await getRepository(TeachingSession).save(session);

    // Update mastery
    await this.updateMastery(
      session.student_id,
      session.topic_id,
      masteryPassed
    );

    // Get updated mastery
    const mastery = await getRepository(TopicMastery).findOne({
      where: {
        student_id: session.student_id,
        topic_id: session.topic_id,
      },
    });

    const nextSteps = masteryPassed
      ? 'Excellent work! You\'ve mastered this topic. Ready to move to the next challenge?'
      : 'Good effort! Let\'s review the areas you found tricky and try again.';

    return {
      completed: true,
      mastery_percent: mastery?.mastery_percent || 0,
      next_steps: nextSteps,
    };
  }
}

// Export singleton instance
export const smartTeachingService = new SmartTeachingService();
