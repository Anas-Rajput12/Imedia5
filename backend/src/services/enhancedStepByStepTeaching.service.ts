/**
 * Enhanced Step-by-Step Teaching Service
 *
 * Implements interactive teaching flow:
 * 1. AI explains concept briefly (not full PDF)
 * 2. Shows ONE worked example with step-by-step solution
 * 3. Student tries a practice question
 * 4. AI provides feedback, handles mistakes
 * 5. Visual highlighting throughout
 * 6. Tracks student progress and mistakes
 */

import { OpenRouterService } from './openRouter.service';
import { RAGService } from './rag.service';
import { getRepository } from 'typeorm';
import { TopicMastery } from '../models/topicMastery';
import { ENHANCED_TUTOR_SYSTEM_PROMPT, CONCEPT_EXPLANATION_PROMPT, WORKED_EXAMPLE_PROMPT, PRACTICE_QUESTION_PROMPT, FEEDBACK_PROMPT, SIMPLIFY_EXPLANATION_PROMPT, SIMILAR_QUESTION_GENERATOR_PROMPT } from '../data/enhancedTutorPrompts';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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

// ==================== SERVICE ====================

export class EnhancedStepByStepTeachingService {
  private openRouterService = new OpenRouterService();
  private ragService = new RAGService();

  /**
   * PHASE 1: Get brief concept explanation
   * NOT the full PDF content - just a focused introduction
   */
  async getConceptExplanation(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
    studentId: string;
  }): Promise<ServiceResponse<ConceptExplanation>> {
    try {
      const { topicId, subject, yearGroup, studentLevel, studentId } = params;

      // Get relevant context from RAG (retrieval)
      const retrievalResult = await this.ragService.executeRAG({
        question: `Explain ${topicId} for ${yearGroup} students`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .slice(0, 3) // Limit context for brief explanation
        .join('\n\n');

      // Build prompt with enhanced tutor style
      const prompt = CONCEPT_EXPLANATION_PROMPT
        .replace('{topic}', topicId)
        .replace('{yearGroup}', yearGroup)
        .replace('{studentLevel}', studentLevel);

      // Generate explanation using OpenRouter
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      // Parse JSON response
      const explanation = this.parseConceptExplanation(response.answer);

      return {
        success: true,
        data: explanation,
      };
    } catch (error: any) {
      console.error('Error getting concept explanation:', error);
      return {
        success: false,
        error: 'Failed to generate concept explanation',
        message: error.message,
      };
    }
  }

  /**
   * PHASE 2: Get worked example with step-by-step solution
   */
  async getWorkedExample(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    difficulty: 'easy' | 'medium' | 'hard';
    studentId: string;
  }): Promise<ServiceResponse<WorkedExample>> {
    try {
      const { topicId, subject, yearGroup, difficulty, studentId } = params;

      // Get context from RAG
      const retrievalResult = await this.ragService.executeRAG({
        question: `Show worked example for ${topicId}`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n');

      // Build prompt
      const prompt = WORKED_EXAMPLE_PROMPT
        .replace('{topic}', topicId)
        .replace('{yearGroup}', yearGroup)
        .replace('{difficulty}', difficulty);

      // Generate example
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      const example = this.parseWorkedExample(response.answer);

      return {
        success: true,
        data: example,
      };
    } catch (error: any) {
      console.error('Error getting worked example:', error);
      return {
        success: false,
        error: 'Failed to generate worked example',
        message: error.message,
      };
    }
  }

  /**
   * PHASE 3: Get practice question
   */
  async getPracticeQuestion(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    difficulty: 'easy' | 'medium' | 'hard';
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
    studentId: string;
  }): Promise<ServiceResponse<PracticeQuestion>> {
    try {
      const { topicId, subject, yearGroup, difficulty, studentLevel, studentId } = params;

      // Get context from RAG
      const retrievalResult = await this.ragService.executeRAG({
        question: `Generate practice question for ${topicId}`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n');

      // Build prompt
      const prompt = PRACTICE_QUESTION_PROMPT
        .replace('{topic}', topicId)
        .replace('{yearGroup}', yearGroup)
        .replace('{difficulty}', difficulty)
        .replace('{studentLevel}', studentLevel);

      // Generate question
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      const question = this.parsePracticeQuestion(response.answer);

      return {
        success: true,
        data: question,
      };
    } catch (error: any) {
      console.error('Error getting practice question:', error);
      return {
        success: false,
        error: 'Failed to generate practice question',
        message: error.message,
      };
    }
  }

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
    studentId: string;
  }): Promise<ServiceResponse<Feedback>> {
    try {
      const { topicId, subject, yearGroup, question, studentAnswer, correctAnswer, attemptNumber, studentId } = params;

      // Get context from RAG
      const retrievalResult = await this.ragService.executeRAG({
        question: `Evaluate answer for: ${question}`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n');

      // Build prompt
      const prompt = FEEDBACK_PROMPT
        .replace('{topic}', topicId)
        .replace('{question}', question)
        .replace('{studentAnswer}', studentAnswer)
        .replace('{correctAnswer}', correctAnswer)
        .replace('{attemptNumber}', attemptNumber.toString());

      // Generate feedback
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      const feedback = this.parseFeedback(response.answer);

      // Track mistake if wrong
      if (!feedback.isCorrect) {
        await this.trackMistake(studentId, topicId, {
          question,
          studentAnswer,
          mistakeType: feedback.mistakeType || 'method',
          explanation: feedback.errorExplanation || '',
        });

        // Update mastery tracking
        await this.updateMastery(studentId, topicId, false);
      } else {
        // Update mastery for correct answer
        await this.updateMastery(studentId, topicId, true);
      }

      return {
        success: true,
        data: feedback,
      };
    } catch (error: any) {
      console.error('Error evaluating answer:', error);
      return {
        success: false,
        error: 'Failed to evaluate answer',
        message: error.message,
      };
    }
  }

  /**
   * Get simplified explanation for struggling students
   */
  async getSimplifiedExplanation(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    confusionPoint: string;
    mistakes: MistakeRecord[];
    studentId: string;
  }): Promise<ServiceResponse<SimplifiedExplanation>> {
    try {
      const { topicId, subject, yearGroup, confusionPoint, mistakes, studentId } = params;

      // Get context from RAG
      const retrievalResult = await this.ragService.executeRAG({
        question: `Explain ${topicId} simply`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n');

      // Build prompt
      const prompt = SIMPLIFY_EXPLANATION_PROMPT
        .replace('{topic}', topicId)
        .replace('{confusionPoint}', confusionPoint)
        .replace('{mistakes}', JSON.stringify(mistakes));

      // Generate simplified explanation
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      const explanation = this.parseSimplifiedExplanation(response.answer);

      return {
        success: true,
        data: explanation,
      };
    } catch (error: any) {
      console.error('Error getting simplified explanation:', error);
      return {
        success: false,
        error: 'Failed to generate simplified explanation',
        message: error.message,
      };
    }
  }

  /**
   * Generate similar question for additional practice
   */
  async getSimilarQuestion(params: {
    topicId: string;
    subject: string;
    yearGroup: string;
    originalQuestion: string;
    strugglePoint: string;
    studentId: string;
  }): Promise<ServiceResponse<SimilarQuestion>> {
    try {
      const { topicId, subject, yearGroup, originalQuestion, strugglePoint, studentId } = params;

      // Get context from RAG
      const retrievalResult = await this.ragService.executeRAG({
        question: `Generate similar question for ${topicId}`,
        studentId,
        subject,
        keyStage: yearGroup,
        topic: topicId,
        restrictToTopic: true,
      });

      const context = retrievalResult.retrievedChunks
        .map((chunk: any) => chunk.content)
        .join('\n\n');

      // Build prompt
      const prompt = SIMILAR_QUESTION_GENERATOR_PROMPT
        .replace('{topic}', topicId)
        .replace('{originalQuestion}', originalQuestion)
        .replace('{strugglePoint}', strugglePoint);

      // Generate similar question
      const response = await this.openRouterService.generateTeacherResponse(
        prompt,
        context,
        []
      );

      const similarQuestion = this.parseSimilarQuestion(response.answer);

      return {
        success: true,
        data: similarQuestion,
      };
    } catch (error: any) {
      console.error('Error getting similar question:', error);
      return {
        success: false,
        error: 'Failed to generate similar question',
        message: error.message,
      };
    }
  }

  /**
   * Get student progress for a topic
   */
  async getStudentProgress(studentId: string, topicId: string): Promise<ServiceResponse<StudentProgress>> {
    try {
      const masteryRepo = getRepository(TopicMastery);
      
      const mastery = await masteryRepo.findOne({
        where: { student_id: studentId, topic_id: topicId },
      });

      if (!mastery) {
        return {
          success: true,
          data: {
            topicId,
            masteryPercent: 0,
            attemptsCount: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
            recentMistakes: [],
            status: 'developing',
            lastPracticed: new Date(),
          },
        };
      }

      // Parse recent mistakes from error_tags
      const recentMistakes: MistakeRecord[] = (mastery.error_tags || []).map((tag: string) => ({
        topic: topicId,
        mistakeType: tag as any,
        timestamp: mastery.last_practiced || new Date(),
        question: '',
        studentAnswer: '',
        explanation: '',
      }));

      const status = mastery.mastery_percent >= 80 ? 'secure' : mastery.mastery_percent >= 50 ? 'developing' : 'at_risk';

      return {
        success: true,
        data: {
          topicId,
          masteryPercent: mastery.mastery_percent,
          attemptsCount: mastery.attempts_count,
          correctAttempts: Math.round(mastery.attempts_count * (mastery.mastery_percent / 100)),
          incorrectAttempts: Math.round(mastery.attempts_count * (1 - mastery.mastery_percent / 100)),
          recentMistakes,
          status,
          lastPracticed: mastery.last_practiced || new Date(),
        },
      };
    } catch (error: any) {
      console.error('Error getting student progress:', error);
      return {
        success: false,
        error: 'Failed to get student progress',
        message: error.message,
      };
    }
  }

  // ==================== HELPER METHODS ====================

  private parseConceptExplanation(response: string): ConceptExplanation {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing concept explanation:', e);
    }

    // Fallback
    return {
      title: 'Concept Introduction',
      bigIdea: response,
      analogy: '',
      whyItMatters: '',
      keyParts: [],
      checkQuestion: 'Does that make sense?',
      spokenIntroduction: response,
    };
  }

  private parseWorkedExample(response: string): WorkedExample {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing worked example:', e);
    }

    // Fallback
    return {
      question: response,
      givenData: '',
      steps: [],
      finalAnswer: '',
      checkMethod: '',
      totalSteps: 0,
    };
  }

  private parsePracticeQuestion(response: string): PracticeQuestion {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing practice question:', e);
    }

    // Fallback
    return {
      question: response,
      givenData: '',
      anxietyReducer: 'Take your time',
      thinkingHint: '',
      expectedFormat: 'Show your working',
      correctAnswer: '',
      markScheme: [],
      commonMistakesToWatch: [],
    };
  }

  private parseFeedback(response: string): Feedback {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing feedback:', e);
    }

    // Fallback
    return {
      isCorrect: false,
      mistakeType: 'method',
      encouragement: 'Keep trying!',
      specificFeedback: response,
      nextStep: 'Try again',
      spokenFeedback: response,
    };
  }

  private parseSimplifiedExplanation(response: string): SimplifiedExplanation {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing simplified explanation:', e);
    }

    // Fallback
    return {
      newAnalogy: response,
      simplifiedSteps: [],
      keyInsight: '',
      encouragement: 'You\'ve got this!',
    };
  }

  private parseSimilarQuestion(response: string): SimilarQuestion {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing similar question:', e);
    }

    // Fallback
    return {
      question: response,
      similarity: '',
      simplification: '',
      hint: '',
      correctAnswer: '',
      encouragement: 'You can do this!',
    };
  }

  private async trackMistake(
    studentId: string,
    topicId: string,
    mistake: {
      question: string;
      studentAnswer: string;
      mistakeType: string;
      explanation: string;
    }
  ): Promise<void> {
    console.log('[MISTAKE TRACKED]', {
      studentId,
      topicId,
      timestamp: new Date(),
      mistake,
    });

    // In production, save to dedicated mistakes table
    // For now, it's tracked in TopicMastery.error_tags
  }

  private async updateMastery(
    studentId: string,
    topicId: string,
    isCorrect: boolean
  ): Promise<void> {
    const masteryRepo = getRepository(TopicMastery);

    let mastery = await masteryRepo.findOne({
      where: { student_id: studentId, topic_id: topicId },
    });

    if (!mastery) {
      // Create new mastery record
      mastery = new TopicMastery();
      mastery.student_id = studentId;
      mastery.topic_id = topicId;
      mastery.mastery_percent = isCorrect ? 10 : 0;
      mastery.attempts_count = 1;
      mastery.error_tags = isCorrect ? [] : ['method'];
      mastery.last_practiced = new Date();
    } else {
      // Update existing
      mastery.attempts_count += 1;
      if (isCorrect) {
        mastery.mastery_percent = Math.min(100, mastery.mastery_percent + 10);
      } else {
        mastery.mastery_percent = Math.max(0, mastery.mastery_percent - 5);
        const errorTag = 'method';
        if (!mastery.error_tags?.includes(errorTag)) {
          mastery.error_tags = [...(mastery.error_tags || []), errorTag];
        }
      }
      mastery.last_practiced = new Date();
      mastery.updateStatus();
    }

    await masteryRepo.save(mastery);
  }
}
