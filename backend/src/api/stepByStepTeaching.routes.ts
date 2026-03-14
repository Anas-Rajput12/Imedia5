/**
 * Step-by-Step Teaching API Routes
 * 
 * Implements interactive teaching flow:
 * 1. Concept explanation (brief, not full PDF)
 * 2. Worked example with step-by-step solution
 * 3. Student practice question
 * 4. Mistake detection & feedback
 * 5. Visual highlighting
 * 6. Progress tracking
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth } from '../middleware/auth';
import { RAGService } from '../services/rag.service';
import { OpenRouterService } from '../services/openRouter.service';
import { getRepository } from 'typeorm';
import { TopicMastery } from '../models/topicMastery';

const router = Router();
const ragService = new RAGService();
const openRouterService = new OpenRouterService();

// ==================== INTERFACES ====================

interface TeachingStep {
  stepNumber: number;
  title: string;
  content: string;
  keyPoints: string[];
  visualDescription: string;
  analogy?: string;
  checkQuestion?: string;
}

interface WorkedExampleStep {
  stepNumber: number;
  text: string;
  explanation: string;
  highlight?: string;
}

interface WorkedExample {
  question: string;
  steps: WorkedExampleStep[];
  solution: string;
  commonMistakes: string[];
  checkMethod: string;
}

interface PracticeQuestion {
  question: string;
  data?: string;
  marks: number;
  markScheme: Array<{ step: string; marks: number }>;
  commonMistakes: string[];
  hint?: string;
}

interface EvaluationResult {
  isCorrect: boolean;
  mistakeType: 'arithmetic' | 'method' | 'misconception' | 'careless' | null;
  feedback: string;
  highlightedError?: string;
  correctMethod?: string;
  encouragement: string;
}

// ==================== ROUTES ====================

/**
 * POST /api/teaching/step/explain
 * Generate step-by-step explanation for a concept
 */
router.post('/step/explain', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, step, studentLevel, subject, yearGroup } = req.body;
    const studentId = req.userId;

    if (!topicId || !step) {
      return res.status(400).json({ error: 'Missing required fields: topicId, step' });
    }

    // Get context from Qdrant (RAG retrieval)
    const retrievalResult = await ragService.executeRAG({
      question: `Explain ${topicId} for ${yearGroup} students`,
      studentId: studentId || 'system',
      subject: subject || 'Maths',
      keyStage: yearGroup || 'Year 7',
      topic: topicId,
      restrictToTopic: true,
    });

    const context = retrievalResult.retrievedChunks
      .map((chunk: any) => chunk.content)
      .join('\n\n');

    // Generate step-by-step explanation using OpenRouter
    const prompt = buildExplanationPrompt(topicId, step, studentLevel, context, yearGroup);

    const explanation = await openRouterService.generateTeacherResponse(
      prompt,
      context,
      []  // No sources available
    );

    res.json({
      success: true,
      explanation: explanation.answer,
      step: step,
      nextStep: step + 1,
    });

  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({
      error: 'Failed to generate explanation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/teaching/step/example
 * Generate worked example with step-by-step solution
 */
router.post('/step/example', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, difficulty = 'medium', subject, yearGroup } = req.body;
    const studentId = req.userId;

    if (!topicId) {
      return res.status(400).json({ error: 'Missing required field: topicId' });
    }

    // Get context from Qdrant
    const retrievalResult = await ragService.executeRAG({
      question: `Show worked example for ${topicId}`,
      studentId: studentId || 'system',
      subject: subject || 'Maths',
      keyStage: yearGroup || 'Year 7',
      topic: topicId,
      restrictToTopic: true,
    });

    const context = retrievalResult.retrievedChunks
      .map((chunk: any) => chunk.content)
      .join('\n\n');

    // Generate worked example using OpenRouter
    const prompt = buildExamplePrompt(topicId, difficulty, context, yearGroup);

    const example = await openRouterService.generateTeacherResponse(
      prompt,
      context,
      []  // No sources available
    );

    // Parse the response to extract question, steps, solution
    const parsedExample = parseWorkedExample(example.answer);

    res.json({
      success: true,
      example: parsedExample,
      difficulty: difficulty,
    });

  } catch (error) {
    console.error('Error generating example:', error);
    res.status(500).json({
      error: 'Failed to generate example',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/teaching/step/evaluate
 * Evaluate student answer and provide feedback
 */
router.post('/step/evaluate', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, question, studentAnswer, correctAnswer, subject, yearGroup } = req.body;
    const studentId = req.userId;

    if (!topicId || !question || !studentAnswer) {
      return res.status(400).json({ 
        error: 'Missing required fields: topicId, question, studentAnswer' 
      });
    }

    // Get context from Qdrant
    const retrievalResult = await ragService.executeRAG({
      question: `Evaluate answer for ${topicId}: ${question}`,
      studentId: studentId || 'system',
      subject: subject || 'Maths',
      keyStage: yearGroup || 'Year 7',
      topic: topicId,
      restrictToTopic: true,
    });

    const context = retrievalResult.retrievedChunks
      .map((chunk: any) => chunk.content)
      .join('\n\n');

    // Evaluate answer using OpenRouter
    const prompt = buildEvaluationPrompt(topicId, question, studentAnswer, correctAnswer, context);

    const evaluation = await openRouterService.generateTeacherResponse(
      prompt,
      context,
      []  // No sources available
    );

    // Parse evaluation response
    const parsedEvaluation = parseEvaluation(evaluation.answer);

    // Track mistake in database if answer is wrong
    if (!parsedEvaluation.isCorrect && studentId) {
      await trackMistake(studentId, topicId, {
        question: question,
        studentAnswer: studentAnswer,
        mistakeType: parsedEvaluation.mistakeType,
        explanation: parsedEvaluation.feedback,
      });

      // Update mastery tracking
      await updateMastery(studentId, topicId, false);
    } else if (studentId) {
      // Update mastery tracking for correct answer
      await updateMastery(studentId, topicId, true);
    }

    res.json({
      success: true,
      evaluation: parsedEvaluation,
    });

  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({
      error: 'Failed to evaluate answer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/teaching/step/practice
 * Generate practice question
 */
router.post('/step/practice', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, difficulty = 'medium', studentLevel, subject, yearGroup } = req.body;
    const studentId = req.userId;

    if (!topicId) {
      return res.status(400).json({ error: 'Missing required field: topicId' });
    }

    // Get context from Qdrant
    const retrievalResult = await ragService.executeRAG({
      question: `Generate practice question for ${topicId}`,
      studentId: studentId || 'system',
      subject: subject || 'Maths',
      keyStage: yearGroup || 'Year 7',
      topic: topicId,
      restrictToTopic: true,
    });

    const context = retrievalResult.retrievedChunks
      .map((chunk: any) => chunk.content)
      .join('\n\n');

    // Generate practice question using OpenRouter
    const prompt = buildPracticePrompt(topicId, difficulty, studentLevel, context, yearGroup);

    const practice = await openRouterService.generateTeacherResponse(
      prompt,
      context,
      []  // No sources available
    );

    // Parse practice question
    const parsedPractice = parsePracticeQuestion(practice.answer);

    res.json({
      success: true,
      practice: parsedPractice,
      difficulty: difficulty,
    });

  } catch (error) {
    console.error('Error generating practice question:', error);
    res.status(500).json({
      error: 'Failed to generate practice question',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teaching/step/mistakes/:studentId/:topicId
 * Get student's mistake history for a topic
 */
router.get('/step/mistakes/:studentId/:topicId', verifyClerkAuth, async (req: Request, res: Response) => {
  try {
    const { studentId, topicId } = req.params;
    
    // Get mastery record which contains mistake tracking
    const masteryRepo = getRepository(TopicMastery);
    const mastery = await masteryRepo.findOne({
      where: { student_id: studentId, topic_id: topicId },
    });

    if (!mastery) {
      return res.json({
        success: true,
        mistakes: [],
        masteryLevel: 0,
      });
    }

    res.json({
      success: true,
      mistakes: mastery.error_tags || [],
      masteryLevel: mastery.mastery_percent,
      attempts: mastery.attempts_count,
    });

  } catch (error) {
    console.error('Error getting mistakes:', error);
    res.status(500).json({
      error: 'Failed to get mistakes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function buildExplanationPrompt(
  topicId: string,
  step: number,
  studentLevel: string,
  context: string,
  yearGroup: string
): string {
  const levelInstructions = {
    beginner: 'Explain in very simple terms. Use analogies and everyday examples. Break down complex ideas.',
    intermediate: 'Explain clearly with some technical terms. Include examples but assume some prior knowledge.',
    advanced: 'Provide detailed explanation with technical depth. Include edge cases and applications.',
  };

  return `You are a professional teacher explaining ${topicId} to a ${yearGroup} student.

STUDENT LEVEL: ${studentLevel}
INSTRUCTION: ${levelInstructions[studentLevel as keyof typeof levelInstructions]}

CONTEXT FROM TEXTBOOK:
${context}

Generate a step-by-step explanation for STEP ${step}:
- STEP 1: Basic concept definition (what is it?)
- STEP 2: Why it's important (real-world application)
- STEP 3: How it works (mechanism/process)
- STEP 4: Common mistakes to avoid

Format as JSON:
{
  "title": "Topic name",
  "content": "Main explanation text",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "visualDescription": "Description of what to show on board",
  "analogy": "Real-world analogy to help understanding",
  "checkQuestion": "Quick question to check understanding"
}`;
}

function buildExamplePrompt(
  topicId: string,
  difficulty: string,
  context: string,
  yearGroup: string
): string {
  return `You are a professional teacher creating a worked example for ${topicId}.

DIFFICULTY: ${difficulty}
YEAR GROUP: ${yearGroup}

CONTEXT FROM TEXTBOOK:
${context}

Create a worked example with step-by-step solution:
- Show the question clearly
- Break solution into numbered steps
- Explain EACH step (why we do this)
- Highlight common mistakes
- Show how to check the answer

Format as JSON:
{
  "question": "The problem statement",
  "steps": [
    {
      "stepNumber": 1,
      "text": "What we do",
      "explanation": "Why we do it",
      "highlight": "Key part to focus on"
    }
  ],
  "solution": "Final answer",
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "checkMethod": "How to verify the answer"
}`;
}

function buildEvaluationPrompt(
  topicId: string,
  question: string,
  studentAnswer: string,
  correctAnswer: string | undefined,
  context: string
): string {
  return `You are a professional teacher evaluating a student's answer.

TOPIC: ${topicId}
QUESTION: ${question}
STUDENT ANSWER: ${studentAnswer}
${correctAnswer ? `CORRECT ANSWER: ${correctAnswer}` : ''}

CONTEXT FROM TEXTBOOK:
${context}

Evaluate the student's answer:
1. Is it correct?
2. If wrong, what type of mistake? (arithmetic/method/misconception/careless)
3. Provide specific, encouraging feedback
4. Explain the correct method
5. Highlight where the mistake happened

Format as JSON:
{
  "isCorrect": true/false,
  "mistakeType": "arithmetic|method|misconception|careless|null",
  "feedback": "Specific, encouraging feedback message",
  "highlightedError": "What part was wrong",
  "correctMethod": "Show correct approach",
  "encouragement": "Positive message to motivate student"
}`;
}

function buildPracticePrompt(
  topicId: string,
  difficulty: string,
  studentLevel: string,
  context: string,
  yearGroup: string
): string {
  return `You are a professional teacher creating a practice question for ${topicId}.

DIFFICULTY: ${difficulty}
STUDENT LEVEL: ${studentLevel}
YEAR GROUP: ${yearGroup}

CONTEXT FROM TEXTBOOK:
${context}

Create a practice question:
- Clear question statement
- Appropriate difficulty for the level
- Include any necessary data/diagrams
- Provide mark scheme
- Show common mistakes to watch for

Format as JSON:
{
  "question": "The practice question",
  "data": "Any data/diagram needed",
  "marks": 5,
  "markScheme": [
    {"step": "Step 1", "marks": 1},
    {"step": "Step 2", "marks": 2}
  ],
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "hint": "Optional hint if student gets stuck"
}`;
}

function parseWorkedExample(response: string): WorkedExample {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Error parsing worked example:', e);
  }
  
  // Fallback
  return {
    question: response,
    steps: [],
    solution: '',
    commonMistakes: [],
    checkMethod: '',
  };
}

function parseEvaluation(response: string): EvaluationResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Error parsing evaluation:', e);
  }
  
  // Fallback
  return {
    isCorrect: false,
    mistakeType: 'method',
    feedback: response,
    encouragement: 'Keep trying!',
  };
}

function parsePracticeQuestion(response: string): PracticeQuestion {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Error parsing practice question:', e);
  }
  
  // Fallback
  return {
    question: response,
    marks: 1,
    markScheme: [],
    commonMistakes: [],
  };
}

async function trackMistake(
  studentId: string,
  topicId: string,
  mistake: {
    question: string;
    studentAnswer: string;
    mistakeType: string | null;
    explanation: string;
  }
): Promise<void> {
  console.log('[MISTAKE TRACKED]', {
    studentId,
    topicId,
    timestamp: new Date(),
    mistake,
  });
  
  // In production, save to database
  // For now, just log it
}

async function updateMastery(
  studentId: string,
  topicId: string,
  isCorrect: boolean
): Promise<void> {
  const masteryRepo = getRepository(TopicMastery);
  
  let mastery = await masteryRepo.findOne({
    where: { student_id: studentId, topic_id: topicId },
  });
  
  if (!mastery) {
    // Create new mastery record
    mastery = new TopicMastery();
    mastery.student_id = studentId;
    mastery.topic_id = topicId;
    mastery.mastery_percent = isCorrect ? 10 : 0;
    mastery.attempts_count = 1;
    mastery.error_tags = isCorrect ? [] : ['method'];
    mastery.last_practiced = new Date();
  } else {
    // Update existing
    mastery.attempts_count += 1;
    if (isCorrect) {
      mastery.mastery_percent = Math.min(100, mastery.mastery_percent + 10);
    } else {
      mastery.mastery_percent = Math.max(0, mastery.mastery_percent - 5);
      if (!mastery.error_tags?.includes('method')) {
        mastery.error_tags = [...(mastery.error_tags || []), 'method'];
      }
    }
    mastery.last_practiced = new Date();
    mastery.updateStatus();
  }
  
  await masteryRepo.save(mastery);
}

export default router;
