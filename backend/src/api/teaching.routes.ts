import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { TeachingSession } from '../models/teachingSession'
import { TopicMastery } from '../models/topicMastery'

const router = Router()

const teachingSessionRepo = AppDataSource.getRepository(TeachingSession)
const topicMasteryRepo = AppDataSource.getRepository(TopicMastery)

/**
 * START TEACHING SESSION
 */
router.post('/start', async (req, res) => {
  try {

    const { sessionId, studentId, topicId, tutorType } = req.body

    let session = await teachingSessionRepo.findOne({
      where: { session_id: sessionId }
    })

    if (!session) {

      session = teachingSessionRepo.create({
        session_id: sessionId,
        student_id: studentId,
        topic_id: topicId,
        tutor_type: tutorType,
        current_step: TeachingSession.STEPS.CONFIRM
      })

      await teachingSessionRepo.save(session)

    }

    res.json({
      success: true,
      session
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    })

  }
})


/**
 * NEXT STEP
 */
router.post('/next-step', async (req, res) => {

  try {

    const { sessionId } = req.body

    const session = await teachingSessionRepo.findOne({
      where: { session_id: sessionId }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    session.nextStep()

    await teachingSessionRepo.save(session)

    res.json({
      success: true,
      step: session.current_step
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: 'Failed to move step'
    })

  }

})


/**
 * SUBMIT ANSWER
 */
router.post('/submit-answer', async (req, res) => {

  try {

    const { sessionId, studentId, topicId, correct } = req.body

    const session = await teachingSessionRepo.findOne({
      where: { session_id: sessionId }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    let mastery = await topicMasteryRepo.findOne({
      where: {
        student_id: studentId,
        topic_id: topicId
      }
    })

    if (!mastery) {

      mastery = topicMasteryRepo.create({
        student_id: studentId,
        topic_id: topicId,
        mastery_percent: 0,
        attempts_count: 0
      })

    }

    mastery.incrementAttempts()

    if (correct) {
      mastery.mastery_percent = Math.min(
        100,
        mastery.mastery_percent + 10
      )
    }

    mastery.updateStatus()

    await topicMasteryRepo.save(mastery)

    session.attempts += 1

    await teachingSessionRepo.save(session)

    res.json({
      success: true,
      mastery
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: 'Failed to submit answer'
    })

  }

})


/**
 * COMPLETE SESSION
 */
router.post('/complete', async (req, res) => {

  try {

    const { sessionId, masteryPassed } = req.body

    const session = await teachingSessionRepo.findOne({
      where: { session_id: sessionId }
    })

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    session.complete(masteryPassed)

    await teachingSessionRepo.save(session)

    res.json({
      success: true,
      completed: session.isComplete()
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: 'Failed to complete session'
    })

  }

})


/**
 * GET SESSION
 */
router.get('/:sessionId', async (req, res) => {

  try {

    const { sessionId } = req.params

    const session = await teachingSessionRepo.findOne({
      where: { session_id: sessionId }
    })

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    res.json({
      session_id: session.session_id,
      topic_id: session.topic_id,
      step: session.current_step,
      attempts: session.attempts,
      completed: session.isComplete()
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: 'Failed to get session'
    })

  }

})

export default router