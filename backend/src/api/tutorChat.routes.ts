/**
 * Tutor Chat API Routes
 * Interactive tutor chat functionality
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth } from '../middleware/auth';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';
import { AppDataSource } from '../config/database';
import { ChatSession, ChatMessage, LearningSession } from '../models';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

interface TutorMessageRequest {
  session_id: string;
  student_id: string;
  message: string;
  topic_id?: string;
  tutor_type?: string; // 'maths', 'science', 'homework'
}

/**
 * @route   POST /api/tutor/chat/message
 * @desc    Send message to tutor
 * @access  Private
 */
router.post(
  '/chat/message',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id, student_id, message, topic_id, tutor_type = 'maths' }: TutorMessageRequest = req.body;

    if (!session_id || !student_id || !message) {
      throw new BadRequestError('Missing required fields');
    }

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);
    const learningSessionRepo = AppDataSource.getRepository(LearningSession);

    // Get or create chat session
    let session = await chatSessionRepo.findOne({
      where: { session_id },
    });

    if (!session) {
      session = chatSessionRepo.create({
        session_id,
        student_id,
        topic_id: topic_id || null,
        chat_type: 'tutor_chat',
        message_count: 0,
        status: 'active',
      });
      await chatSessionRepo.save(session);

      // Create learning session
      const learningSession = learningSessionRepo.create({
        session_id,
        student_id,
        topic_id: topic_id || 'general',
        tutor_type,
        session_data: {},
        accuracy: 0,
        total_questions: 0,
        correct_answers: 0,
        status: 'active',
      });
      await learningSessionRepo.save(learningSession);
    }

    // Save user message
    const userMessage = chatMessageRepo.create({
      session_id,
      message_id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
    });
    await chatMessageRepo.save(userMessage);

    // Generate tutor response (simplified - integrate with tutor service)
    const tutorResponse = "Great question! Let me guide you through this. What do you think the first step should be?";

    // Save tutor message
    const tutorMessage = chatMessageRepo.create({
      session_id,
      message_id: `msg_${Date.now()}_tutor`,
      role: 'assistant',
      content: tutorResponse,
      metadata: {
        tutor_type,
        avatar_mode: 'teaching',
      },
    });
    await chatMessageRepo.save(tutorMessage);

    // Update session
    session.message_count += 1;
    await chatSessionRepo.save(session);

    res.json({
      success: true,
      data: {
        message: tutorResponse,
        board_text: '',
        avatar_mode: 'teaching',
        session_id,
        message_count: session.message_count,
      },
    });
  })
);

/**
 * @route   POST /api/tutor/chat/start
 * @desc    Start a new tutor chat session
 * @access  Private
 */
router.post(
  '/chat/start',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { student_id, topic_id, topic_name, tutor_type = 'maths' } = req.body;

    if (!student_id) {
      throw new BadRequestError('student_id is required');
    }

    const session_id = `tutor_${student_id}_${Date.now()}`;

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const learningSessionRepo = AppDataSource.getRepository(LearningSession);

    // Create chat session
    const session = chatSessionRepo.create({
      session_id,
      student_id,
      topic_id: topic_id || null,
      chat_type: 'tutor_chat',
      message_count: 0,
      status: 'active',
    });
    await chatSessionRepo.save(session);

    // Create learning session
    const learningSession = learningSessionRepo.create({
      session_id,
      student_id,
      topic_id: topic_id || 'general',
      tutor_type,
      session_data: {
        topic_name: topic_name || 'General Practice',
      },
      accuracy: 0,
      total_questions: 0,
      correct_answers: 0,
      status: 'active',
    });
    await learningSessionRepo.save(learningSession);

    res.json({
      success: true,
      data: {
        session_id,
        topic_id: topic_id || 'general',
        topic_name: topic_name || 'General Practice',
        tutor_type,
        message: `Hello! I'm your ${tutor_type} tutor. What would you like to learn today?`,
      },
    });
  })
);

/**
 * @route   GET /api/tutor/chat/session/:session_id
 * @desc    Get tutor chat session
 * @access  Private
 */
router.get(
  '/chat/session/:session_id',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.params;

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);
    const learningSessionRepo = AppDataSource.getRepository(LearningSession);

    const session = await chatSessionRepo.findOne({
      where: { session_id },
    });

    if (!session) {
      throw new BadRequestError('Session not found');
    }

    const messages = await chatMessageRepo.find({
      where: { session_id },
      order: { created_at: 'ASC' },
    });

    const learningSession = await learningSessionRepo.findOne({
      where: { session_id },
    });

    res.json({
      success: true,
      data: {
        session: {
          session_id: session.session_id,
          student_id: session.student_id,
          topic_id: session.topic_id,
          chat_type: session.chat_type,
          message_count: session.message_count,
          status: session.status,
        },
        learning_session: learningSession ? {
          tutor_type: learningSession.tutor_type,
          accuracy: learningSession.accuracy,
          total_questions: learningSession.total_questions,
          correct_answers: learningSession.correct_answers,
        } : null,
        messages: messages.map((m) => ({
          message_id: m.message_id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        })),
      },
    });
  })
);

export default router;
