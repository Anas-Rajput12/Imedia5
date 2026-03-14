/**
 * Chatbot API Routes
 * RAG-based chatbot functionality
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth } from '../middleware/auth';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';
import { AppDataSource } from '../config/database';
import { ChatSession, ChatMessage } from '../models';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

interface ChatMessageRequest {
  session_id: string;
  student_id: string;
  message: string;
  topic_id?: string;
}

/**
 * @route   POST /api/chatbot/message
 * @desc    Send message to chatbot
 * @access  Private
 */
router.post(
  '/message',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id, student_id, message, topic_id }: ChatMessageRequest = req.body;

    if (!session_id || !student_id || !message) {
      throw new BadRequestError('Missing required fields');
    }

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);

    // Get or create session
    let session = await chatSessionRepo.findOne({
      where: { session_id },
    });

    if (!session) {
      session = chatSessionRepo.create({
        session_id,
        student_id,
        topic_id: topic_id || null,
        chat_type: 'rag_chatbot',
        message_count: 0,
        status: 'active',
      });
      await chatSessionRepo.save(session);
    }

    // Save user message
    const userMessage = chatMessageRepo.create({
      session_id,
      message_id: `msg_${Date.now()}_user`,
      role: 'user',
      content: message,
    });
    await chatMessageRepo.save(userMessage);

    // Generate bot response (simplified - integrate with RAG service)
    const botResponse = "That's a great question! Let me help you understand this concept. Can you tell me what you already know about this topic?";

    // Save bot message
    const botMessage = chatMessageRepo.create({
      session_id,
      message_id: `msg_${Date.now()}_bot`,
      role: 'assistant',
      content: botResponse,
    });
    await chatMessageRepo.save(botMessage);

    // Update session message count
    session.message_count += 1;
    await chatSessionRepo.save(session);

    res.json({
      success: true,
      data: {
        message: botResponse,
        session_id,
        message_count: session.message_count,
      },
    });
  })
);

/**
 * @route   GET /api/chatbot/session/:session_id
 * @desc    Get chat session history
 * @access  Private
 */
router.get(
  '/session/:session_id',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.params;

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);

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
          created_at: session.created_at,
        },
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

/**
 * @route   DELETE /api/chatbot/session/:session_id
 * @desc    Clear chat session
 * @access  Private
 */
router.delete(
  '/session/:session_id',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { session_id } = req.params;

    const chatSessionRepo = AppDataSource.getRepository(ChatSession);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);

    const session = await chatSessionRepo.findOne({
      where: { session_id },
    });

    if (!session) {
      throw new BadRequestError('Session not found');
    }

    // Delete messages
    await chatMessageRepo.delete({ session_id });

    // Update session
    session.message_count = 0;
    session.status = 'closed';
    await chatSessionRepo.save(session);

    res.json({
      success: true,
      message: 'Session cleared successfully',
    });
  })
);

export default router;
