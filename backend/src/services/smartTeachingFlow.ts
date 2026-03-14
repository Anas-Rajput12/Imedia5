/**
 * SMART Teaching Flow - Tutor Page Integration
 * 
 * Flow:
 * 1. Select topic → Show on whiteboard
 * 2. Teacher explains slide 1
 * 3. Teacher asks: "Any questions?"
 * 4. Student asks via chat
 * 5. Teacher answers
 * 6. Continue to next slide
 * 7. Mastery check at end
 */

import { TeachingSession } from '../models/teachingSession';
import { TopicMastery } from '../models/topicMastery';
import { getRepository } from 'typeorm';

export interface TeachingSlide {
  slideNumber: number;
  title: string;
  content: string;
  keyPoints: string[];
  teacherScript: string;
  checkQuestion: string;
}

export interface ChatMessage {
  role: 'teacher' | 'student';
  text: string;
  timestamp: Date;
}

export interface TeachingState {
  sessionId: string;
  currentSlide: number;
  totalSlides: number;
  isExplaining: boolean;
  waitingForQuestions: boolean;
  hasQuestions: boolean;
  masteryPassed: boolean | null;
}

/**
 * Generate teaching slides from topic content
 */
export async function generateTeachingSlides(
  topicId: string,
  topicName: string,
  content: string
): Promise<TeachingSlide[]> {
  // Split content into slides (3-5 slides per topic)
  const slides: TeachingSlide[] = [
    {
      slideNumber: 1,
      title: `Introduction to ${topicName}`,
      content: content.split('\n\n')[0] || '',
      keyPoints: ['Key concept 1', 'Key concept 2'],
      teacherScript: `Today we're learning about ${topicName}. Let me explain the basics...`,
      checkQuestion: 'Do you have any questions about this?',
    },
    {
      slideNumber: 2,
      title: `Main Concepts`,
      content: content.split('\n\n')[1] || '',
      keyPoints: ['Important detail 1', 'Important detail 2'],
      teacherScript: 'Now let\'s look at the main concepts in detail...',
      checkQuestion: 'Is everything clear so far?',
    },
    {
      slideNumber: 3,
      title: `Examples`,
      content: content.split('\n\n')[2] || '',
      keyPoints: ['Worked example 1', 'Worked example 2'],
      teacherScript: 'Let me show you some examples...',
      checkQuestion: 'Do you want me to explain any part again?',
    },
  ];

  return slides;
}

/**
 * Start teaching session
 */
export async function startTeachingSession(
  studentId: string,
  topicId: string,
  tutorType: 'maths' | 'science' | 'homework'
): Promise<{
  sessionId: string;
  state: TeachingState;
  firstSlide: TeachingSlide;
}> {
  const sessionId = `session_${Date.now()}_${studentId}`;

  // Create teaching session
  const session = new TeachingSession();
  session.session_id = sessionId;
  session.student_id = studentId;
  session.topic_id = topicId;
  session.tutor_type = tutorType;
  session.current_step = 3; // Start at Teach step
  session.attempts = 0;

  await getRepository(TeachingSession).save(session);

  // Initialize state
  const state: TeachingState = {
    sessionId,
    currentSlide: 1,
    totalSlides: 3,
    isExplaining: true,
    waitingForQuestions: false,
    hasQuestions: false,
    masteryPassed: null,
  };

  // Generate first slide
  const slides = await generateTeachingSlides(topicId, 'Topic', 'Content here');
  const firstSlide = slides[0];

  return {
    sessionId,
    state,
    firstSlide,
  };
}

/**
 * Handle student question during teaching
 */
export async function handleStudentQuestion(
  sessionId: string,
  question: string
): Promise<{
  answer: string;
  shouldContinue: boolean;
  followUpQuestion?: string;
}> {
  // Check for safeguarding concerns
  const safeguardingKeywords = [
    "i'm stupid",
    "i hate myself",
    "i give up",
    "hurt myself",
  ];

  const lowerQuestion = question.toLowerCase();
  const hasConcern = safeguardingKeywords.some(keyword => lowerQuestion.includes(keyword));

  if (hasConcern) {
    return {
      answer: 'I hear that you\'re struggling, and that\'s completely okay. Learning can be challenging sometimes. Would you like to take a short break? Remember, it\'s always good to talk to a trusted adult if you\'re feeling frustrated.',
      shouldContinue: false,
      followUpQuestion: 'Would you like to continue with a simpler explanation?',
    };
  }

  // Check if question is about current topic
  // TODO: Use RAG to answer question from retrieved content

  return {
    answer: 'Great question! Let me explain that more clearly...',
    shouldContinue: true,
    followUpQuestion: 'Does that make sense now?',
  };
}

/**
 * Move to next slide
 */
export async function nextSlide(
  sessionId: string,
  currentSlide: number
): Promise<{
  slide?: TeachingSlide;
  isComplete: boolean;
  message: string;
}> {
  const session = await getRepository(TeachingSession).findOne({
    where: { session_id: sessionId },
  });

  if (!session) {
    return {
      isComplete: true,
      message: 'Session not found',
    };
  }

  const nextSlideNum = currentSlide + 1;

  if (nextSlideNum > 3) {
    // Move to mastery check
    session.nextStep(); // Move to step 7 (Mastery)
    await getRepository(TeachingSession).save(session);

    return {
      isComplete: true,
      message: 'Great! You\'ve completed all the slides. Now let\'s check your understanding with a quick quiz!',
    };
  }

  // Generate next slide
  const slides = await generateTeachingSlides('topic', 'Topic', 'Content');
  const slide = slides[nextSlideNum - 1];

  return {
    slide,
    isComplete: false,
    message: `Now let's move to slide ${nextSlideNum}...`,
  };
}

/**
 * Check if student is ready to continue
 */
export function checkReadiness(
  studentMessage: string
): boolean {
  const readyKeywords = [
    'yes',
    'ready',
    'continue',
    'next',
    'got it',
    'understand',
    'clear',
    'okay',
    'ok',
  ];

  const lowerMessage = studentMessage.toLowerCase();
  return readyKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generate mastery check questions
 */
export function generateMasteryQuestions(topicId: string): Array<{
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}> {
  return [
    {
      question: 'What is the main concept we learned?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 0,
      explanation: 'The main concept is...',
    },
    {
      question: 'How would you apply this?',
      options: ['Method A', 'Method B', 'Method C', 'Method D'],
      correct: 1,
      explanation: 'The correct method is...',
    },
  ];
}
