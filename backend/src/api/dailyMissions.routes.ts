/**
 * Daily Missions API Routes
 * Gamification and daily challenges
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth } from '../middleware/auth';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';
import { AppDataSource } from '../config/database';
import { LearningSession, TeachingSession } from '../models';
import { Between } from 'typeorm';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Daily missions configuration
const DAILY_MISSIONS = [
  {
    id: 'complete_lesson',
    title: 'Complete a Lesson',
    description: 'Finish any lesson today',
    xp_reward: 50,
    check: (sessions: any[]) => sessions.length > 0,
  },
  {
    id: 'five_questions',
    title: 'Practice Makes Perfect',
    description: 'Answer 5 questions correctly',
    xp_reward: 30,
    check: (sessions: any[]) => {
      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
      return totalCorrect >= 5;
    },
  },
  {
    id: 'perfect_accuracy',
    title: 'Perfect Score',
    description: 'Get 100% on a practice session',
    xp_reward: 100,
    check: (sessions: any[]) => sessions.some((s) => s.accuracy === 100),
  },
  {
    id: 'try_new_subject',
    title: 'Explorer',
    description: 'Try a different subject',
    xp_reward: 40,
    check: (sessions: any[]) => {
      const subjects = new Set(sessions.map((s) => s.tutor_type));
      return subjects.size > 1;
    },
  },
  {
    id: 'streak_keeper',
    title: 'On Fire!',
    description: 'Maintain your learning streak',
    xp_reward: 75,
    check: (sessions: any[]) => sessions.length > 0, // Simplified
  },
];

/**
 * @route   GET /api/daily-missions/:student_id
 * @desc    Get daily missions for student
 * @access  Private
 */
router.get(
  '/:student_id',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { student_id } = req.params;

    const learningSessionRepo = AppDataSource.getRepository(LearningSession);
    const teachingSessionRepo = AppDataSource.getRepository(TeachingSession);

    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const learningSessions = await learningSessionRepo.find({
      where: {
        student_id,
        created_at: Between(today, tomorrow),
      },
    });

    const teachingSessions = await teachingSessionRepo.find({
      where: {
        student_id,
        created_at: Between(today, tomorrow),
      },
    });

    const allSessions = [...learningSessions, ...teachingSessions];

    // Check mission progress
    const missions = DAILY_MISSIONS.map((mission) => {
      const completed = mission.check(allSessions);
      return {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        xp_reward: mission.xp_reward,
        completed,
        progress: completed ? 100 : 0, // Simplified
      };
    });

    const completedCount = missions.filter((m) => m.completed).length;
    const totalXP = missions
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.xp_reward, 0);

    res.json({
      success: true,
      data: {
        student_id,
        date: today.toISOString(),
        missions,
        summary: {
          completed: completedCount,
          total: missions.length,
          xp_earned: totalXP,
        },
      },
    });
  })
);

/**
 * @route   GET /api/daily-missions/:student_id/streak
 * @desc    Get learning streak
 * @access  Private
 */
router.get(
  '/:student_id/streak',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { student_id } = req.params;

    const learningSessionRepo = AppDataSource.getRepository(LearningSession);
    const teachingSessionRepo = AppDataSource.getRepository(TeachingSession);

    // Get all sessions
    const learningSessions = await learningSessionRepo.find({
      where: { student_id },
      order: { created_at: 'DESC' },
    });

    const teachingSessions = await teachingSessionRepo.find({
      where: { student_id },
      order: { created_at: 'DESC' },
    });

    const allDates = [
      ...learningSessions.map((s) => s.created_at),
      ...teachingSessions.map((s) => s.created_at),
    ]
      .map((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .filter((value, index, self) => self.indexOf(value) === index) // Unique dates
      .sort((a, b) => b - a);

    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const yesterdayTime = todayTime - (1000 * 60 * 60 * 24);

    if (allDates.length > 0) {
      const lastDate = allDates[0];
      const diffDays = Math.floor((todayTime - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        currentStreak = 1;

        for (let i = 1; i < allDates.length; i++) {
          const dayDiff = Math.floor((allDates[i - 1] - allDates[i]) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            currentStreak++;
          } else if (dayDiff > 1) {
            break;
          }
        }
      }
    }

    // Get longest streak (simplified)
    const longestStreak = allDates.length; // Simplified

    res.json({
      success: true,
      data: {
        student_id,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_session: allDates[0] ? new Date(allDates[0]).toISOString() : null,
      },
    });
  })
);

/**
 * @route   POST /api/daily-missions/:student_id/claim
 * @desc    Claim mission reward
 * @access  Private
 */
router.post(
  '/:student_id/claim',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { student_id } = req.params;
    const { mission_id } = req.body;

    if (!mission_id) {
      throw new BadRequestError('mission_id is required');
    }

    const mission = DAILY_MISSIONS.find((m) => m.id === mission_id);

    if (!mission) {
      throw new BadRequestError('Mission not found');
    }

    // In production, verify mission completion and track claimed rewards
    // For now, return success

    res.json({
      success: true,
      data: {
        mission_id,
        xp_earned: mission.xp_reward,
        message: `Claimed ${mission.xp_reward} XP for "${mission.title}"`,
      },
    });
  })
);

export default router;
