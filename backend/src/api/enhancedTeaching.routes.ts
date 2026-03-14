/**
 * Enhanced Step-by-Step Teaching API Routes
 * 
 * Implements pedagogical teaching flow:
 * 1. AI explains concept briefly (not full PDF dump)
 * 2. Shows ONE worked example with visual highlighting
 * 3. Student tries practice question
 * 4. AI provides feedback, handles mistakes
 * 5. Support buttons: "Explain simpler", "Show step-by-step", "Give similar question"
 * 6. Tracks student progress and mistakes
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth } from '../middleware/auth';
import { EnhancedStepByStepTeachingService } from '../services/enhancedStepByStepTeaching.service';

const router = Router();
const teachingService = new EnhancedStepByStepTeachingService();

// ==================== ROUTES ====================

/**
 * POST /api/teaching/enhanced/concept
 * Get brief concept explanation (Phase 1)
 */
router.post('/enhanced/concept', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, subject, yearGroup, studentLevel = 'intermediate' } = req.body;
    const studentId = req.userId;

    if (!topicId || !yearGroup) {
      return res.status(400).json({ error: 'Missing required fields: topicId, yearGroup' });
    }

    const service = teachingService;
    const result = await service.getConceptExplanation({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      studentLevel: studentLevel as any,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in concept explanation route:', error);
    res.status(500).json({
      error: 'Failed to get concept explanation',
      message: error.message,
    });
  }
});

/**
 * POST /api/teaching/enhanced/example
 * Get worked example with step-by-step solution (Phase 2)
 */
router.post('/enhanced/example', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, subject, yearGroup, difficulty = 'medium' } = req.body;
    const studentId = req.userId;

    if (!topicId || !yearGroup) {
      return res.status(400).json({ error: 'Missing required fields: topicId, yearGroup' });
    }

    const service = teachingService;
    const result = await service.getWorkedExample({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      difficulty: difficulty as any,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in worked example route:', error);
    res.status(500).json({
      error: 'Failed to get worked example',
      message: error.message,
    });
  }
});

/**
 * POST /api/teaching/enhanced/practice
 * Get practice question (Phase 3)
 */
router.post('/enhanced/practice', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, subject, yearGroup, difficulty = 'medium', studentLevel = 'intermediate' } = req.body;
    const studentId = req.userId;

    if (!topicId || !yearGroup) {
      return res.status(400).json({ error: 'Missing required fields: topicId, yearGroup' });
    }

    const service = teachingService;
    const result = await service.getPracticeQuestion({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      difficulty: difficulty as any,
      studentLevel: studentLevel as any,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in practice question route:', error);
    res.status(500).json({
      error: 'Failed to get practice question',
      message: error.message,
    });
  }
});

/**
 * POST /api/teaching/enhanced/evaluate
 * Evaluate student answer and provide feedback (Phase 4)
 */
router.post('/enhanced/evaluate', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const {
      topicId,
      subject,
      yearGroup,
      question,
      studentAnswer,
      correctAnswer,
      attemptNumber = 1,
    } = req.body;
    const studentId = req.userId;

    if (!topicId || !question || !studentAnswer) {
      return res.status(400).json({
        error: 'Missing required fields: topicId, question, studentAnswer',
      });
    }

    const service = teachingService;
    const result = await service.evaluateAnswer({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      question,
      studentAnswer,
      correctAnswer,
      attemptNumber,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in evaluation route:', error);
    res.status(500).json({
      error: 'Failed to evaluate answer',
      message: error.message,
    });
  }
});

/**
 * POST /api/teaching/enhanced/simplify
 * Get simplified explanation for struggling students
 */
router.post('/enhanced/simplify', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, subject, yearGroup, confusionPoint, mistakes = [] } = req.body;
    const studentId = req.userId;

    if (!topicId || !yearGroup || !confusionPoint) {
      return res.status(400).json({
        error: 'Missing required fields: topicId, yearGroup, confusionPoint',
      });
    }

    const service = teachingService;
    const result = await service.getSimplifiedExplanation({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      confusionPoint,
      mistakes,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in simplification route:', error);
    res.status(500).json({
      error: 'Failed to simplify explanation',
      message: error.message,
    });
  }
});

/**
 * POST /api/teaching/enhanced/similar-question
 * Generate similar question for additional practice
 */
router.post('/enhanced/similar-question', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, subject, yearGroup, originalQuestion, strugglePoint } = req.body;
    const studentId = req.userId;

    if (!topicId || !yearGroup || !originalQuestion || !strugglePoint) {
      return res.status(400).json({
        error: 'Missing required fields: topicId, yearGroup, originalQuestion, strugglePoint',
      });
    }

    const service = teachingService;
    const result = await service.getSimilarQuestion({
      topicId,
      subject: subject || 'Maths',
      yearGroup,
      originalQuestion,
      strugglePoint,
      studentId: studentId || 'system',
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in similar question route:', error);
    res.status(500).json({
      error: 'Failed to generate similar question',
      message: error.message,
    });
  }
});

/**
 * GET /api/teaching/enhanced/progress/:studentId/:topicId
 * Get student progress for a topic
 */
router.get('/enhanced/progress/:studentId/:topicId', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { studentId, topicId } = req.params;

    const service = teachingService;
    const result = await service.getStudentProgress(studentId, topicId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in progress route:', error);
    res.status(500).json({
      error: 'Failed to get student progress',
      message: error.message,
    });
  }
});

export default router;
