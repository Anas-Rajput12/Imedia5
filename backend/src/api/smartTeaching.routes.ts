/**
 * SMART AI Teacher API Routes
 * 
 * Implements the complete 4-layer architecture:
 * 1. Retrieval Layer (Curriculum only)
 * 2. Teaching Logic Layer (structured flow)
 * 3. Personalisation Engine (trigger-based adaptation)
 * 4. Safety & Guardrail Layer
 * 
 * Endpoints:
 * - POST /api/teaching/smart/start - Start SMART teaching session
 * - POST /api/teaching/smart/diagnostic - Generate diagnostic questions
 * - POST /api/teaching/smart/submit-diagnostic - Submit diagnostic answers
 * - POST /api/teaching/smart/teach - Get teaching chunk
 * - POST /api/teaching/smart/example - Get worked example
 * - POST /api/teaching/smart/submit-attempt - Submit student attempt
 * - POST /api/teaching/smart/mastery - Generate mastery check
 * - POST /api/teaching/smart/complete - Complete session
 * - GET  /api/teaching/smart/progress/:studentId - Get progress dashboard
 */

import { Router, Request, Response } from 'express';
import { smartAiTeacherService } from '../services/smartAiTeacher.service';
import { verifyClerkAuth } from '../middleware/auth';

const router = Router();

// ==================== INTERFACES ====================

interface SmartTeachingRequest {
  sessionId: string;
  studentId: string;
  topicId: string;
  tutorType: 'maths' | 'science' | 'homework';
  yearGroup?: string;
  examBoard?: string;
}

interface AnswerSubmissionRequest {
  sessionId: string;
  studentId: string;
  topicId: string;
  tutorType: string;
  answer: string;
  questionId?: string;
}

// ==================== ROUTES ====================

/**
 * START SMART TEACHING SESSION
 * 
 * Validates curriculum lock before starting.
 * Returns session ID and initial diagnostic questions.
 */
router.post('/smart/start', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, tutorType, yearGroup, examBoard }: SmartTeachingRequest = req.body;
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!topicId || !tutorType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['topicId', 'tutorType'],
      });
    }

    // Generate session ID
    const sessionId = `smart_${Date.now()}_${studentId}`;

    // CURRICULUM LOCK CHECK (Layer 1: Retrieval)
    const curriculumLock = await smartAiTeacherService.checkCurriculumLock(
      topicId,
      tutorType,
      yearGroup
    );

    if (!curriculumLock.locked) {
      return res.status(200).json({
        success: false,
        session_id: sessionId,
        curriculum_lock: curriculumLock,
        message: curriculumLock.message,
        clarifying_question: curriculumLock.clarifyingQuestion,
      });
    }

    // Get tutor persona
    const persona = smartAiTeacherService.getTutorPersona(tutorType);

    // GENERATE DIAGNOSTIC QUESTIONS (Layer 2: Teaching Logic)
    const diagnosticQuestions = await smartAiTeacherService.generateDiagnosticQuestions(
      topicId,
      tutorType,
      yearGroup
    );

    res.json({
      success: true,
      session_id: sessionId,
      topic_id: topicId,
      tutor_type: tutorType,
      tutor_name: persona.name,
      curriculum_lock: curriculumLock,
      diagnostic_questions: diagnosticQuestions,
      welcome_message: getWelcomeMessage(tutorType, topicId),
      next_step: 'diagnostic',
    });
  } catch (error) {
    console.error('Error starting SMART teaching session:', error);
    res.status(500).json({
      error: 'Failed to start teaching session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GENERATE DIAGNOSTIC QUESTIONS (Standalone)
 *
 * Generates 1-3 diagnostic questions for a topic.
 * Used when starting diagnostic micro-check independently.
 */
router.post('/smart/diagnostic', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, tutorType, yearGroup }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !topicId || !tutorType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate diagnostic questions
    const diagnosticQuestions = await smartAiTeacherService.generateDiagnosticQuestions(
      topicId,
      tutorType,
      yearGroup
    );

    res.json({
      success: true,
      questions: diagnosticQuestions,
    });
  } catch (error) {
    console.error('Error generating diagnostic questions:', error);
    res.status(500).json({
      error: 'Failed to generate diagnostic questions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * SUBMIT DIAGNOSTIC ANSWERS
 * 
 * Evaluates answers and generates teaching chunk.
 * Applies personalisation based on diagnostic score.
 */
router.post('/smart/submit-diagnostic', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers, topicId, tutorType, yearGroup }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate diagnostic score
    const diagnosticScore = smartAiTeacherService.calculateDiagnosticScore(answers);

    // GENERATE TEACHING CHUNK (Layer 2: Teaching Logic)
    const teachingChunk = await smartAiTeacherService.generateTeachingChunk(
      topicId,
      tutorType,
      yearGroup,
      diagnosticScore
    );

    // PERSONALISATION (Layer 3: Personalisation Engine)
    const adaptation = diagnosticScore >= 80
      ? 'challenge'
      : diagnosticScore >= 50
      ? 'standard'
      : 'simplify';

    const message = getDiagnosticFeedbackMessage(diagnosticScore, tutorType);

    res.json({
      success: true,
      session_id: sessionId,
      diagnostic_score: diagnosticScore,
      adaptation,
      message,
      teaching_chunk: teachingChunk,
      next_step: 'teach',
    });
  } catch (error) {
    console.error('Error submitting diagnostic:', error);
    res.status(500).json({
      error: 'Failed to submit diagnostic',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET WORKED EXAMPLE
 * 
 * Returns worked example with step-by-step working.
 * Maths: Full working-out shown
 * Science: Reasoning steps
 * Homework: Approach guidance
 */
router.post('/smart/example', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, topicId, tutorType, yearGroup, problem }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !topicId || !tutorType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // GENERATE WORKED EXAMPLE (Layer 2: Teaching Logic)
    const workedExample = await smartAiTeacherService.generateWorkedExample(
      topicId,
      tutorType,
      problem,
      yearGroup
    );

    res.json({
      success: true,
      session_id: sessionId,
      worked_example: workedExample,
      tutor_type: tutorType,
      next_step: 'student_attempt',
    });
  } catch (error) {
    console.error('Error generating worked example:', error);
    res.status(500).json({
      error: 'Failed to generate worked example',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * SUBMIT STUDENT ATTEMPT
 * 
 * Evaluates answer with AI.
 * Applies personalisation triggers.
 * Checks safeguarding and exam integrity.
 */
router.post('/smart/submit-attempt', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, answer, topicId, tutorType, yearGroup, attempts = 0 }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId || !answer || !topicId || !tutorType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // SAFETY LAYER (Layer 4: Safety & Guardrail)
    
    // 1. Check safeguarding concerns
    const safeguardingCheck = smartAiTeacherService.detectSafeguardingConcerns(answer);
    if (safeguardingCheck.detected) {
      await smartAiTeacherService.logSafeguardingConcern(
        studentId,
        sessionId,
        safeguardingCheck,
        answer
      );

      return res.json({
        success: true,
        session_id: sessionId,
        safeguarding: {
          detected: true,
          type: safeguardingCheck.type,
          severity: safeguardingCheck.severity,
          response: safeguardingCheck.response,
          trusted_adult_prompt: safeguardingCheck.trustedAdultPrompt,
          escalate: safeguardingCheck.escalate,
        },
        feedback: {
          is_correct: false,
          message: safeguardingCheck.response,
          next_step: 'Take a break and talk to someone.',
          encouragement: 'Your wellbeing matters most.',
        },
      });
    }

    // 2. Check exam integrity violation
    const integrityCheck = smartAiTeacherService.detectExamIntegrityViolation(answer);
    if (integrityCheck.detected) {
      await smartAiTeacherService.logExamIntegrityViolation(
        studentId,
        sessionId,
        integrityCheck,
        answer
      );

      // Generate similar example instead of answer
      const similarExample = await smartAiTeacherService.generateWorkedExample(
        topicId,
        tutorType,
        undefined,
        yearGroup
      );

      return res.json({
        success: true,
        session_id: sessionId,
        integrity_violation: {
          detected: true,
          type: integrityCheck.type,
          response: integrityCheck.response,
        },
        hint: integrityCheck.hintProvided,
        similar_example: similarExample,
        feedback: {
          is_correct: false,
          message: integrityCheck.response,
          next_step: 'Try solving your problem using this similar example as a guide.',
          encouragement: 'You can do this yourself!',
        },
      });
    }

    // EVALUATE ANSWER (Layer 2: Teaching Logic)
    const evaluation = await smartAiTeacherService.evaluateAnswer(
      topicId,
      tutorType,
      answer,
      undefined,
      yearGroup
    );

    // PERSONALISATION TRIGGERS (Layer 3: Personalisation Engine)
    const consecutiveIncorrect = attempts; // Simplified - in production, track properly
    const personalisationTrigger = smartAiTeacherService.checkPersonalisationTriggers(
      attempts + 1,
      consecutiveIncorrect,
      50, // Would come from diagnostic
      evaluation.is_correct
    );

    let adaptationResponse: any = {};

    if (personalisationTrigger.triggered) {
      adaptationResponse = {
        trigger_type: personalisationTrigger.triggerType,
        adaptation: personalisationTrigger.adaptation,
        message: personalisationTrigger.message,
      };

      // Generate additional support based on adaptation
      if (personalisationTrigger.adaptation === 'visual_analogy') {
        const visualAnalogy = await smartAiTeacherService.generateVisualAnalogy(
          topicId,
          tutorType,
          'key concept'
        );
        adaptationResponse.visual_analogy = visualAnalogy;
      }

      if (personalisationTrigger.adaptation === 'scaffold') {
        const scaffoldedSteps = smartAiTeacherService.generateScaffoldedSteps(
          answer,
          tutorType
        );
        adaptationResponse.scaffolded_steps = scaffoldedSteps;
      }
    }

    // UPDATE MASTERY (Layer 3: Personalisation Engine)
    const progressMetrics = await smartAiTeacherService.updateMastery(
      studentId,
      topicId,
      evaluation.is_correct,
      evaluation.error_type
    );

    res.json({
      success: true,
      session_id: sessionId,
      feedback: evaluation,
      personalisation: adaptationResponse,
      progress: progressMetrics,
      next_step: evaluation.is_correct ? 'mastery_check' : 'retry',
    });
  } catch (error) {
    console.error('Error submitting student attempt:', error);
    res.status(500).json({
      error: 'Failed to submit attempt',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GENERATE MASTERY CHECK
 * 
 * Generates questions to assess mastery before moving on.
 */
router.post('/smart/mastery', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, topicId, tutorType, yearGroup }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !topicId || !tutorType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate mastery check questions
    const masteryQuestions = await smartAiTeacherService.generateDiagnosticQuestions(
      topicId,
      tutorType,
      yearGroup
    );

    res.json({
      success: true,
      session_id: sessionId,
      mastery_check: {
        questions: masteryQuestions,
        pass_threshold: 80,
        instructions: 'Answer these questions to demonstrate your understanding.',
      },
      next_step: 'submit_mastery',
    });
  } catch (error) {
    console.error('Error generating mastery check:', error);
    res.status(500).json({
      error: 'Failed to generate mastery check',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * COMPLETE TEACHING SESSION
 * 
 * Finalizes session and updates mastery.
 */
router.post('/smart/complete', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, masteryPassed, topicId, tutorType }: any = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update final mastery
    const progressMetrics = await smartAiTeacherService.updateMastery(
      studentId,
      topicId || '',
      masteryPassed
    );

    const nextSteps = masteryPassed
      ? 'Excellent work! You\'ve mastered this topic. Ready to move to the next challenge?'
      : 'Good effort! Let\'s review the areas you found tricky and try again.';

    res.json({
      success: true,
      session_id: sessionId,
      completed: true,
      mastery_passed: masteryPassed,
      progress: progressMetrics,
      next_steps: nextSteps,
      recommendation: masteryPassed ? 'move_to_next_topic' : 'review_and_retry',
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      error: 'Failed to complete session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET PROGRESS DASHBOARD
 * 
 * Returns quantified progress: Secure / Developing / At Risk
 */
router.get('/smart/progress/:studentId', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const authStudentId = req.userId;

    // Students can only view their own progress (unless admin)
    if (authStudentId !== studentId) {
      // TODO: Check for admin/teacher role
      return res.status(403).json({ error: 'Forbidden' });
    }

    const dashboard = await smartAiTeacherService.getProgressDashboard(studentId);

    res.json({
      success: true,
      student_id: studentId,
      dashboard,
    });
  } catch (error) {
    console.error('Error getting progress dashboard:', error);
    res.status(500).json({
      error: 'Failed to get progress dashboard',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getWelcomeMessage(tutorType: string, topicId: string): string {
  const messages: Record<string, string> = {
    maths: `Hello! I'm Prof. Mathew, your Maths teacher. Today we're learning about **${topicId}**. I'll guide you through step-by-step, showing you exactly how to solve problems using exam-board approved methods. Let's start with a quick check to see what you already know!`,
    science: `Hi there! I'm Dr. Science, and I'm excited to teach you about **${topicId}**. We'll explore scientific concepts together, and I'll ask you questions to help you think like a scientist. Ready to begin?`,
    homework: `Hey! I'm Teacher Alex, your Homework Tutor. I'm here to help you learn, not to give you answers. We'll work through problems together, and I'll show you similar examples so you can solve your homework yourself. Let's get started!`,
  };
  return messages[tutorType] || messages.maths;
}

function getDiagnosticFeedbackMessage(score: number, tutorType: string): string {
  if (score >= 80) {
    return 'Excellent! You already have strong understanding. Let\'s build on that and go deeper.';
  } else if (score >= 50) {
    return 'Good start! You know some basics. Let\'s clarify and strengthen your understanding.';
  } else {
    return 'That\'s perfectly fine! We\'ll start from the basics and build up together. Everyone learns at their own pace.';
  }
}

export default router;
