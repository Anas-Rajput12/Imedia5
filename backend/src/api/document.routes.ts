import { Router, Request, Response } from 'express';
import { fileLoader } from '../utils/fileLoader';
import { embeddingService } from '../services/embedding.service';
import * as crypto from 'crypto';

const router = Router();

/**
 * Generate UUID using Node.js crypto
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * POST /api/documents/ingest
 * Ingest a document into the RAG system
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    const { file_path, subject, key_stage, topic_tags } = req.body;

    // Validate request
    if (!file_path) {
      return res.status(400).json({
        success: false,
        error: 'File path is required',
      });
    }

    if (!subject || !['Maths', 'Biology', 'Chemistry', 'Physics'].includes(subject)) {
      return res.status(400).json({
        success: false,
        error: 'Subject must be Maths, Biology, Chemistry, or Physics',
      });
    }

    console.log(`Ingesting document: ${file_path} (subject: ${subject})`);

    // Load file
    const fileContent = await fileLoader.loadFile(file_path);

    // Extract metadata
    const documentId = generateUUID();
    const topic = fileLoader.extractTopic(fileContent.metadata.fileName);

    // Chunk text
    const chunks = await embeddingService.chunkText(fileContent.text, {
      subject,
      keyStage: key_stage || fileLoader.extractKeyStage(file_path),
      topic: topic_tags?.[0] || topic,
      sourceFile: fileContent.metadata.fileName,
      documentId,
    });

    console.log(`Created ${chunks.length} chunks from document`);

    // Generate embeddings and store in Qdrant
    await embeddingService.embedAndStore(chunks);

    res.json({
      success: true,
      data: {
        document_id: documentId,
        file_name: fileContent.metadata.fileName,
        file_type: fileContent.metadata.fileType,
        file_size: fileContent.metadata.fileSize,
        chunks_created: chunks.length,
        subject,
        key_stage: key_stage || fileLoader.extractKeyStage(file_path),
        topic,
        ingested_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/documents/ingest:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to ingest document',
    });
  }
});

/**
 * POST /api/documents/ingest-all
 * Ingest all documents from backend/data directory
 */
router.post('/ingest-all', async (req: Request, res: Response) => {
  try {
    console.log('Starting bulk ingestion from backend/data...');

    // Load all documents from data directory
    const files = await fileLoader.loadDirectory('.', {
      recursive: true,
      extensions: ['.pdf', '.docx', '.pptx', '.txt'],
    });

    console.log(`Found ${files.length} documents to ingest`);

    const results: Array<{
      fileName: string;
      chunksCreated: number;
      success: boolean;
      error?: string;
    }> = [];

    // Process each file
    for (const file of files) {
      try {
        const documentId = generateUUID();
        const subject = fileLoader.extractSubject(file.metadata.filePath);
        const keyStage = fileLoader.extractKeyStage(file.metadata.filePath);
        const topic = fileLoader.extractTopic(file.metadata.fileName);

        // Chunk and embed
        const chunks = await embeddingService.chunkText(file.text, {
          subject,
          keyStage,
          topic,
          sourceFile: file.metadata.fileName,
          documentId,
        });

        await embeddingService.embedAndStore(chunks);

        results.push({
          fileName: file.metadata.fileName,
          chunksCreated: chunks.length,
          success: true,
        });

        console.log(`✓ Ingested: ${file.metadata.fileName} (${chunks.length} chunks)`);
      } catch (error: any) {
        results.push({
          fileName: file.metadata.fileName,
          chunksCreated: 0,
          success: false,
          error: error.message,
        });

        console.error(`✗ Failed to ingest ${file.metadata.fileName}:`, error.message);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      data: {
        total_files: files.length,
        successful: successCount,
        failed: failCount,
        results,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/documents/ingest-all:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to ingest documents',
    });
  }
});

/**
 * GET /api/documents
 * List all ingested documents (from Qdrant metadata)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { subject, key_stage } = req.query;

    // Note: This is a simplified implementation
    // In production, you'd query Qdrant for unique documents
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        documents: [],
        message: 'Document listing requires database integration',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list documents',
    });
  }
});

export default router;
