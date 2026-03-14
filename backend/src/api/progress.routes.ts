import { Router } from "express";
import { AppDataSource } from "../config/database";
import { TeachingSession } from "../models/teachingSession";
import { TopicMastery } from "../models/topicMastery";

const router = Router();

const sessionRepo = AppDataSource.getRepository(TeachingSession);
const masteryRepo = AppDataSource.getRepository(TopicMastery);


/**
 * PROGRESS SUMMARY
 */
router.get("/summary/:studentId", async (req, res) => {

  try {

    const { studentId } = req.params;

    const sessions = await sessionRepo.find({
      where: { student_id: studentId }
    });

    const masteries = await masteryRepo.find({
      where: { student_id: studentId }
    });

    const secureTopics = masteries.filter(m => m.status === "secure").length;
    const developingTopics = masteries.filter(m => m.status === "developing").length;
    const atRiskTopics = masteries.filter(m => m.status === "at_risk").length;

    res.json({
      total_sessions: sessions.length,
      mastery: {
        secure: secureTopics,
        developing: developingTopics,
        at_risk: atRiskTopics
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load progress"
    });

  }

});


/**
 * SESSION HISTORY
 */
router.get("/sessions/:studentId", async (req, res) => {

  try {

    const { studentId } = req.params;

    const sessions = await sessionRepo.find({
      where: { student_id: studentId },
      order: { created_at: "DESC" }
    });

    const data = sessions.map(s => ({
      session_id: s.session_id,
      topic_id: s.topic_id,
      tutor_type: s.tutor_type,
      attempts: s.attempts,
      step: s.current_step,
      completed: s.isComplete(),
      created_at: s.created_at
    }));

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load sessions"
    });

  }

});


/**
 * TOPIC MASTERY LIST
 */
router.get("/topics/:studentId", async (req, res) => {

  try {

    const { studentId } = req.params;

    const masteries = await masteryRepo.find({
      where: { student_id: studentId },
      order: { mastery_percent: "DESC" }
    });

    const topics = masteries.map(m => ({
      topic_id: m.topic_id,
      mastery_percent: m.mastery_percent,
      attempts: m.attempts_count,
      status: m.status,
      last_practiced: m.last_practiced
    }));

    res.json(topics);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load topics"
    });

  }

});


/**
 * PRACTICE RECOMMENDATIONS
 */
router.get("/recommendations/:studentId", async (req, res) => {

  try {

    const { studentId } = req.params;

    const masteries = await masteryRepo.find({
      where: { student_id: studentId }
    });

    const weakTopics = masteries
      .filter(m => m.mastery_percent < 70)
      .map(m => ({
        topic_id: m.topic_id,
        mastery_percent: m.mastery_percent,
        recommendation: `Practice topic ${m.topic_id} to improve mastery to 85%`
      }));

    res.json({
      recommendations: weakTopics
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load recommendations"
    });

  }

});


export default router;