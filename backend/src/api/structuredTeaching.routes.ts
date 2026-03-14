/**
 * Structured Teaching Flow API Routes
 * 
 * Implements mandatory 7-step teaching loop:
 * 1. POST /api/teaching/structured/start - Confirm year + topic (Curriculum Lock)
 * 2. POST /api/teaching/structured/diagnostic - Diagnostic micro-check (1-3 questions)
 * 3. POST /api/teaching/structured/teach - Teach in small chunk
 * 4. POST /api/teaching/structured/example - Guided example
 * 5. POST /api/teaching/structured/attempt - Student attempt
 * 6. POST /api/teaching/structured/feedback - Feedback (auto-included in attempt)
 * 7. POST /api/teaching/structured/mastery - Mastery check (80% threshold)
 * 
 * All content generated via OpenRouter API
 * All curriculum validation via Qdrant
 */

import { Router, Request, Response } from 'express';
import { structuredTeachingService } from '../services/structuredTeaching.service';
import { verifyClerkAuth } from '../middleware/auth';

const router = Router();

// ==================== INTERFACES ====================

interface StartSessionRequest {
  topicId: string;
  tutorType: 'maths' | 'science' | 'homework';
  yearGroup: string;
}

interface SubmitDiagnosticRequest {
  sessionId: string;
  answers: Array<{ question: string; answer: string }>;
}

interface SubmitAttemptRequest {
  sessionId: string;
  answer: string;
}

interface SubmitMasteryRequest {
  sessionId: string;
  answers: Array<{ question: string; answer: string }>;
}

// ==================== ROUTES ====================

/**
 * STEP 1: START TEACHING SESSION
 * 
 * Validates curriculum lock before starting.
 * Returns session ID and initial state.
 */
router.post('/structured/start', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, tutorType, yearGroup }: StartSessionRequest = req.body;
    const studentId = req.userId;

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!topicId || !tutorType || !yearGroup) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['topicId', 'tutorType', 'yearGroup'],
      });
    }

    // STEP 1: CURRICULUM LOCK CHECK
    const curriculumLock = await structuredTeachingService.validateCurriculumLock(
      topicId,
      tutorType,
      yearGroup
    );

    if (!curriculumLock.locked) {
      return res.status(200).json({
        success: false,
        curriculum_lock: curriculumLock,
        message: curriculumLock.message,
        clarifying_question: curriculumLock.clarifyingQuestion,
      });
    }

    // Generate session ID
    const sessionId = `structured_${Date.now()}_${studentId}`;

    // Create session
    const session = structuredTeachingService.createSession(
      sessionId,
      studentId,
      topicId,
      tutorType,
      yearGroup
    );

    // STEP 2: GENERATE DIAGNOSTIC QUESTIONS
    const diagnosticQuestions = await structuredTeachingService.generateDiagnosticQuestions(
      topicId,
      tutorType,
      yearGroup
    );

    // Get tutor persona
    const persona = structuredTeachingService['getTutorPersona'](tutorType);

    res.json({
      success: true,
      session_id: sessionId,
      topic_id: topicId,
      tutor_type: tutorType,
      tutor_name: persona.split(',')[0],
      curriculum_lock: curriculumLock,
      diagnostic_questions: diagnosticQuestions,
      welcome_message: getWelcomeMessage(tutorType, topicId),
      next_step: 'diagnostic',
    });
  } catch (error) {
    console.error('Error starting structured teaching session:', error);
    res.status(500).json({
      error: 'Failed to start teaching session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * STEP 2: SUBMIT DIAGNOSTIC ANSWERS
 * 
 * Evaluates diagnostic answers and generates teaching chunk.
 */
router.post('/structured/diagnostic', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers }: SubmitDiagnosticRequest = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session
    const session = structuredTeachingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate diagnostic score (simple: percentage of non-empty answers)
    const answeredCount = answers.filter(a => a.answer.trim().length > 0).length;
    const diagnosticScore = Math.round((answeredCount / answers.length) * 100);

    // Update session
    structuredTeachingService.updateSession(sessionId, {
      diagnosticScore,
      currentStep: 2,
    });

    // STEP 3: GENERATE TEACHING CHUNK
    const teachingChunk = await structuredTeachingService.generateTeachingChunk(
      session.topicId,
      session.tutorType,
      session.yearGroup,
      diagnosticScore
    );

    // Generate feedback message
    const message = getDiagnosticFeedbackMessage(diagnosticScore, session.tutorType);

    res.json({
      success: true,
      session_id: sessionId,
      diagnostic_score: diagnosticScore,
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
 * STEP 3: GET TEACHING CHUNK
 * (Already included in diagnostic response)
 */

/**
 * STEP 4: GET WORKED EXAMPLE
 */
router.post('/structured/example', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, problem }: { sessionId: string; problem?: string } = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session
    const session = structuredTeachingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // STEP 4: GENERATE WORKED EXAMPLE
    const workedExample = await structuredTeachingService.generateWorkedExample(
      session.topicId,
      session.tutorType,
      problem,
      session.yearGroup
    );

    // Update session
    structuredTeachingService.updateSession(sessionId, {
      currentStep: 3,
    });

    res.json({
      success: true,
      session_id: sessionId,
      worked_example: workedExample,
      tutor_type: session.tutorType,
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
 * STEP 5: SUBMIT STUDENT ATTEMPT
 * 
 * Evaluates answer and provides feedback.
 * Includes personalisation triggers.
 */
router.post('/structured/attempt', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, answer }: SubmitAttemptRequest = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session
    const session = structuredTeachingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // STEP 5-6: EVALUATE ATTEMPT & PROVIDE FEEDBACK
    const result = await structuredTeachingService.evaluateStudentAttempt(
      session.topicId,
      session.tutorType,
      answer,
      session.yearGroup,
      session.attemptCount,
      session.consecutiveIncorrect
    );

    // Update session state
    const newAttemptCount = session.attemptCount + 1;
    const newConsecutiveIncorrect = result.feedback.is_correct ? 0 : session.consecutiveIncorrect + 1;

    structuredTeachingService.updateSession(sessionId, {
      attemptCount: newAttemptCount,
      consecutiveIncorrect: newConsecutiveIncorrect,
      currentStep: result.feedback.is_correct ? 5 : 4,
    });

    // Determine next step
    const nextStep = result.feedback.is_correct ? 'mastery_check' : 'retry';

    res.json({
      success: true,
      session_id: sessionId,
      feedback: result.feedback,
      personalisation: result.personalisation,
      next_step: nextStep,
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({
      error: 'Failed to submit attempt',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * STEP 7: GENERATE MASTERY CHECK
 */
router.post('/structured/mastery', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId }: { sessionId: string } = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session
    const session = structuredTeachingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // STEP 7: GENERATE MASTERY CHECK
    const masteryCheck = await structuredTeachingService.generateMasteryCheck(
      session.topicId,
      session.tutorType,
      session.yearGroup
    );

    res.json({
      success: true,
      session_id: sessionId,
      mastery_check: masteryCheck,
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
 * STEP 7: SUBMIT MASTERY CHECK
 */
router.post('/structured/submit-mastery', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers }: SubmitMasteryRequest = req.body;
    const studentId = req.userId;

    if (!studentId || !sessionId || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get session
    const session = structuredTeachingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Calculate mastery score
    const answeredCount = answers.filter(a => a.answer.trim().length > 0).length;
    const masteryPercent = Math.round((answeredCount / answers.length) * 100);
    const passed = masteryPercent >= 80; // 80% pass threshold

    // Generate completion message
    const nextSteps = passed
      ? `Excellent work! You've mastered **${session.topicId}** with ${masteryPercent}% score. Ready to move to the next topic?`
      : `Good effort! You scored ${masteryPercent}%. Let's review the areas you found tricky and try again.`;

    res.json({
      success: true,
      session_id: sessionId,
      completed: true,
      mastery_passed: passed,
      mastery_percent: masteryPercent,
      next_steps: nextSteps,
      recommendation: passed ? 'move_to_next_topic' : 'review_and_retry',
    });
  } catch (error) {
    console.error('Error submitting mastery check:', error);
    res.status(500).json({
      error: 'Failed to submit mastery check',
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
