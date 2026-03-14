import { Router } from "express";
import { AppDataSource } from "../config/database";
import { TeachingSession } from "../models/teachingSession";
import { TopicMastery } from "../models/topicMastery";
import { StudentProfile } from "../models/studentProfile";

const router = Router();

const sessionRepo = AppDataSource.getRepository(TeachingSession);
const masteryRepo = AppDataSource.getRepository(TopicMastery);
const studentRepo = AppDataSource.getRepository(StudentProfile);


/**
 * DASHBOARD SUMMARY - Comprehensive SMART AI Teacher Data
 * Returns Secure/Developing/At Risk status with full metrics
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

    const secure = masteries.filter(m => m.status === "secure").length;
    const developing = masteries.filter(m => m.status === "developing").length;
    const atRisk = masteries.filter(m => m.status === "at_risk").length;

    // Calculate totals by tutor type
    const mathsSessions = sessions.filter(s => s.tutor_type === "maths").length;
    const scienceSessions = sessions.filter(s => s.tutor_type === "science").length;
    const homeworkSessions = sessions.filter(s => s.tutor_type === "homework").length;

    // Calculate accuracy based on diagnostic scores and mastery checks
    const sessionsWithScores = sessions.filter(s => s.diagnostic_score !== null && s.diagnostic_score !== undefined);
    const totalScore = sessionsWithScores.reduce((sum, s) => sum + (s.diagnostic_score || 0), 0);
    const accuracyRate = sessionsWithScores.length > 0 ? Math.round(totalScore / sessionsWithScores.length) : 0;

    // Get student profile
    const student = await studentRepo.findOne({
      where: { student_id: studentId }
    });

    res.json({
      student: {
        student_id: studentId,
        name: student?.first_name || studentId,
        year_group: student?.year_group || "Not set"
      },
      summary: {
        total_sessions: sessions.length,
        total_messages: 0, // Not tracked in current model
        total_correct_answers: 0, // Not tracked in current model
        total_incorrect_answers: 0, // Not tracked in current model
        average_accuracy: accuracyRate,
        total_topics: masteries.length,
        secure_topics: secure,
        developing_topics: developing,
        at_risk_topics: atRisk
      },
      progress_by_tutor: {
        maths: mathsSessions,
        science: scienceSessions,
        homework: homeworkSessions
      },
      mastery_overview: {
        secure,
        developing,
        at_risk: atRisk,
        overall_mastery: masteries.length > 0 
          ? Math.round(masteries.reduce((sum, m) => sum + m.mastery_percent, 0) / masteries.length)
          : 0
      }
    });

  } catch (err) {
    console.error("Error loading dashboard summary:", err);

    res.status(500).json({
      error: "Failed to load dashboard"
    });

  }

});


/**
 * RECENT SESSIONS - With full SMART AI Teacher details
 */
router.get("/recent-sessions/:studentId", async (req, res) => {

  try {
    const { studentId } = req.params;

    const sessions = await sessionRepo.find({
      where: { student_id: studentId },
      order: { created_at: "DESC" },
      take: 10
    });

    const result = sessions.map(s => ({
      session_id: s.session_id,
      topic_id: s.topic_id,
      topic_name: s.topic_id, // For display
      tutor_type: s.tutor_type,
      type: s.tutor_type, // Alias for compatibility
      attempts: s.attempts,
      diagnostic_score: s.diagnostic_score,
      status: s.isComplete() ? "completed" : "active",
      is_complete: s.isComplete(),
      created_at: s.created_at,
      last_activity: s.created_at, // Use created_at since updated_at doesn't exist
      message_count: 0 // Not tracked in current model
    }));

    res.json(result);

  } catch (err) {
    console.error("Error loading recent sessions:", err);

    res.status(500).json({
      error: "Failed to load recent sessions"
    });

  }

});


/**
 * STUDENT MASTERY LIST - Full SMART AI Teacher metrics
 * Each TopicID stores: Mastery %, Attempts count, Error tags, Last practiced, Confidence signal
 */
router.get("/mastery/:studentId", async (req, res) => {

  try {
    const { studentId } = req.params;

    const masteries = await masteryRepo.find({
      where: { student_id: studentId },
      order: { mastery_percent: "DESC" }
    });

    const result = masteries.map(m => ({
      topic_id: m.topic_id,
      topic_name: m.topic_id, // For display - can be enhanced with curriculum lookup
      subject: "General", // Subject not tracked in current model
      mastery_percent: m.mastery_percent,
      attempts_count: m.attempts_count,
      error_tags: m.error_tags || [],
      last_practiced: m.last_practiced,
      confidence_signal: m.confidence_signal || 0,
      status: m.status, // "secure" | "developing" | "at_risk"
      trend: "stable" as const // Trend not tracked in current model
    }));

    res.json(result);

  } catch (err) {
    console.error("Error loading mastery data:", err);

    res.status(500).json({
      error: "Failed to load mastery data"
    });

  }

});


/**
 * RECOMMENDED PRACTICE - AI-powered lesson recommendation
 * Shows topics that need attention based on mastery and recent activity
 */
router.get("/recommendations/:studentId", async (req, res) => {

  try {
    const { studentId } = req.params;

    const masteries = await masteryRepo.find({
      where: { student_id: studentId }
    });

    // Find weak topics (mastery < 70%)
    const weakTopics = masteries
      .filter(m => m.mastery_percent < 70)
      .sort((a, b) => a.mastery_percent - b.mastery_percent)
      .map(m => {
        let reason = "";
        if (m.mastery_percent < 40) {
          reason = "This topic needs immediate attention. Let's build your foundation.";
        } else if (m.mastery_percent < 60) {
          reason = "You're making progress. Let's strengthen your understanding.";
        } else {
          reason = "Close to mastery! A bit more practice will secure this topic.";
        }

        return {
          topic_id: m.topic_id,
          topic_name: m.topic_id,
          subject: "General", // Subject not tracked in current model
          year_group: "Mixed",
          mastery_percent: m.mastery_percent,
          goal_mastery: 85,
          last_activity: m.last_practiced?.toISOString() || "Never",
          struggled_with: m.error_tags?.[0] || "Key concepts",
          time_needed: m.mastery_percent < 40 ? 30 : m.mastery_percent < 60 ? 20 : 15,
          reason: reason,
          recommended_practice: true
        };
      });

    // If no weak topics, recommend maintaining strong topics
    if (weakTopics.length === 0 && masteries.length > 0) {
      const strongTopic = masteries
        .sort((a, b) => b.mastery_percent - a.mastery_percent)[0];
      
      weakTopics.push({
        topic_id: strongTopic.topic_id,
        topic_name: strongTopic.topic_id,
        subject: "General", // Subject not tracked in current model
        year_group: "Mixed",
        mastery_percent: strongTopic.mastery_percent,
        goal_mastery: 95,
        last_activity: strongTopic.last_practiced?.toISOString() || "Never",
        struggled_with: "Maintenance",
        time_needed: 10,
        reason: "Great work! Let's keep this topic sharp with some quick practice.",
        recommended_practice: true
      });
    }

    res.json({
      data: weakTopics[0] || null, // Return top recommendation
      all_recommendations: weakTopics
    });

  } catch (err) {
    console.error("Error loading recommendations:", err);

    res.status(500).json({
      error: "Failed to load recommendations"
    });

  }

});


/**
 * PROGRESS DASHBOARD - Secure/Developing/At Risk Overview
 * Quantified progress dashboard for schools
 */
router.get("/progress-dashboard/:studentId", async (req, res) => {

  try {
    const { studentId } = req.params;

    const masteries = await masteryRepo.find({
      where: { student_id: studentId }
    });

    // Group by status
    const secure = masteries
      .filter(m => m.status === "secure")
      .map(m => ({
        topic_id: m.topic_id,
        topic_name: m.topic_id,
        subject: "General", // Subject not tracked in current model
        mastery_percent: m.mastery_percent,
        trend: "stable" as const // Trend not tracked in current model
      }));

    const developing = masteries
      .filter(m => m.status === "developing")
      .map(m => ({
        topic_id: m.topic_id,
        topic_name: m.topic_id,
        subject: "General", // Subject not tracked in current model
        mastery_percent: m.mastery_percent,
        trend: "stable" as const // Trend not tracked in current model
      }));

    const atRisk = masteries
      .filter(m => m.status === "at_risk")
      .map(m => ({
        topic_id: m.topic_id,
        topic_name: m.topic_id,
        subject: "General", // Subject not tracked in current model
        mastery_percent: m.mastery_percent,
        trend: "stable" as const // Trend not tracked in current model
      }));

    // Calculate overall statistics
    const overallMastery = masteries.length > 0
      ? Math.round(masteries.reduce((sum, m) => sum + m.mastery_percent, 0) / masteries.length)
      : 0;

    const improvingCount = 0; // Trend not tracked in current model
    const decliningCount = 0; // Trend not tracked in current model

    res.json({
      student_id: studentId,
      overview: {
        total_topics: masteries.length,
        secure_count: secure.length,
        developing_count: developing.length,
        at_risk_count: atRisk.length,
        overall_mastery_percent: overallMastery,
        improving_topics: improvingCount,
        declining_topics: decliningCount
      },
      secure_topics: secure,
      developing_topics: developing,
      at_risk_topics: atRisk,
      status_summary: {
        secure: secure.length,
        developing: developing.length,
        at_risk: atRisk.length
      }
    });

  } catch (err) {
    console.error("Error loading progress dashboard:", err);

    res.status(500).json({
      error: "Failed to load progress dashboard"
    });

  }

});


/**
 * TUTOR TYPE BREAKDOWN - Sessions by Maths/Science/Homework
 */
router.get("/tutor-breakdown/:studentId", async (req, res) => {

  try {
    const { studentId } = req.params;

    const sessions = await sessionRepo.find({
      where: { student_id: studentId }
    });

    const mathsSessions = sessions.filter(s => s.tutor_type === "maths");
    const scienceSessions = sessions.filter(s => s.tutor_type === "science");
    const homeworkSessions = sessions.filter(s => s.tutor_type === "homework");

    const calculateStats = (sessions: TeachingSession[]) => ({
      total_sessions: sessions.length,
      total_messages: 0, // Not tracked in current model
      total_correct: 0, // Not tracked in current model
      total_incorrect: 0, // Not tracked in current model
      average_accuracy: sessions.length > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.diagnostic_score || 0), 0) / sessions.length
          )
        : 0
    });

    res.json({
      maths: calculateStats(mathsSessions),
      science: calculateStats(scienceSessions),
      homework: calculateStats(homeworkSessions)
    });

  } catch (err) {
    console.error("Error loading tutor breakdown:", err);

    res.status(500).json({
      error: "Failed to load tutor breakdown"
    });

  }

});


export default router;