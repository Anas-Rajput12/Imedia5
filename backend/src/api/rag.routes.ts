import { Router, Request, Response } from 'express';
import { ragService } from '../services/rag.service';
import { embeddingService } from '../services/embedding.service';
import { qdrantService } from '../services/qdrant.service';

const router = Router();

/**
 * POST /api/rag/ask
 * Ask a question with RAG retrieval
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, student_id, subject, key_stage, topic, conversation_history, restrict_to_topic } = req.body;

    // Validate request
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string',
      });
    }

    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required',
      });
    }

    console.log(`RAG ask: student=${student_id}, subject=${subject}, topic=${topic}, question=${question.substring(0, 50)}...`);

    // Execute RAG pipeline
    const result = await ragService.executeRAG({
      question,
      studentId: student_id,
      subject,
      keyStage: key_stage,
      topic,
      conversationHistory: conversation_history,
      restrictToTopic: restrict_to_topic || false,
    });

    console.log('RAG result:', {
      confidence: result.response.confidence,
      flags: result.response.flags,
      hasAnswer: !!result.response.answer,
      chunksFound: result.retrievedChunks.length,
    });

    // Return structured response
    res.json({
      success: true,
      data: {
        answer: result.response.answer,
        structured_response: result.response.structuredResponse,
        sources: result.response.sources,
        confidence: result.response.confidence,
        flags: result.response.flags,
        retrieved_chunks: result.retrievedChunks.map((chunk) => ({
          content: chunk.content,
          source_file: chunk.sourceFile,
          subject: chunk.subject,
          key_stage: chunk.keyStage,
          topic: chunk.topic,
          similarity_score: chunk.similarityScore,
        })),
        metrics: {
          retrieval_time_ms: result.retrievalTime,
          generation_time_ms: result.generationTime,
          total_time_ms: result.retrievalTime + result.generationTime,
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /api/rag/ask:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process question',
    });
  }
});

/**
 * POST /api/rag/retrieve
 * Retrieve relevant chunks without generation (for debugging/preview)
 */
router.post('/retrieve', async (req: Request, res: Response) => {
  try {
    const { query, top_k, subject, key_stage } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string',
      });
    }

    const chunks = await ragService.retrieveOnly(query, {
      limit: top_k || 5,
      subject,
      keyStage: key_stage,
    });

    res.json({
      success: true,
      data: {
        chunks: chunks.map((chunk) => ({
          content: chunk.content,
          source_file: chunk.sourceFile,
          subject: chunk.subject,
          key_stage: chunk.keyStage,
          topic: chunk.topic,
          similarity_score: chunk.similarityScore,
        })),
        query,
        total_results: chunks.length,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/rag/retrieve:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve chunks',
    });
  }
});

/**
 * GET /api/rag/health
 * Health check for RAG services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const vectorCount = await qdrantService.getVectorCount();
    const modelInfo = embeddingService.getModelInfo();

    res.json({
      success: true,
      data: {
        qdrant: {
          status: 'connected',
          vector_count: vectorCount,
        },
        embedding_model: modelInfo,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed',
    });
  }
});

export default router;
