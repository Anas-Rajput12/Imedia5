import { Router, Request, Response } from 'express';
import { QdrantClient } from '@qdrant/js-client-rest';
import { getCleanTopicName } from '../utils/topicMappings';

const router = Router();

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
});

const COLLECTION_NAME = 'ai-tutor-embeddings';

/**
 * Extract year from key stage
 * Maps KS1-KS5 to specific year ranges
 * Also handles "Year X" and "Year-X" formats
 */
function keyStageToYears(keyStage: string): number[] {
  // Normalize key stage format (handle both "Year 7" and "Year-7")
  const normalizedKeyStage = keyStage.replace(/\s+/g, '-');
  
  const mapping: Record<string, number[]> = {
    'KS1': [1, 2],           // Ages 5-7
    'KS2': [3, 4, 5, 6],     // Ages 7-11
    'KS3': [7, 8, 9],        // Ages 11-14
    'KS4': [10, 11],         // Ages 14-16 (GCSE)
    'KS5': [12, 13],         // Ages 16-18 (A-Level)
    // Direct year mappings
    'Year-1': [1], 'Year-2': [2], 'Year-3': [3], 'Year-4': [4], 'Year-5': [5],
    'Year-6': [6], 'Year-7': [7], 'Year-8': [8], 'Year-9': [9],
    'Year-10': [10], 'Year-11': [11], 'Year-12': [12], 'Year-13': [13],
  };

  return mapping[normalizedKeyStage] || [];
}

/**
 * Extract better topic name from content
 * Looks for headings, key concepts in the content
 */
function extractTopicFromContent(content: string, fileName: string): string {
  // First, try to find meaningful headings in content
  const headingPatterns = [
    /(?:Chapter|Section|Unit|Topic)\s*\d*[:\s]+([A-Z][^.\n]+)/gi,
    /(?:##|###)\s*([A-Z][^.\n]+)/g,
    /^([A-Z][A-Z\s]+)\s*$/gm,  // All caps headings
  ];
  
  for (const pattern of headingPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Return first meaningful heading
      const heading = matches[0].replace(/^(Chapter|Section|Unit|Topic|##|###)\s*\d*[:\s]*/i, '').trim();
      if (heading.length > 3 && heading.length < 100) {
        return heading;
      }
    }
  }
  
  // If no good heading found, use filename but clean it
  return cleanTopicName(fileName);
}

/**
 * Clean topic name (remove PDF extensions, normalize)
 */
function cleanTopicName(topic: string): string {
  return topic
    .replace(/\.(pdf|docx|pptx|txt)$/i, '') // Remove file extensions
    .replace(/\s*\(\s*Key Stage\s*\d+\s*\)/gi, '') // Remove "(Key Stage 1)"
    .replace(/\s*\(\s*Ages\s*\d+\s*-\s*\d+\s*\)/gi, '') // Remove "(Ages 5-7)"
    .replace(/\s*REVISED\s*/gi, '') // Remove "REVISED"
    .replace(/_\d+/g, '') // Remove "_327071"
    .replace(/\.indd/gi, '') // Remove ".indd"
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * GET /api/curriculum/subjects
 * Get all unique subjects from Qdrant
 */
router.get('/subjects', async (req: Request, res: Response) => {
  try {
    // Scroll through collection to get unique subjects
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
    });
    
    const uniqueSubjects = new Set<string>();
    scrollResult.points.forEach(point => {
      if (point.payload?.subject) {
        uniqueSubjects.add(point.payload.subject as string);
      }
    });
    
    res.json({
      success: true,
      data: {
        subjects: Array.from(uniqueSubjects).sort(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/curriculum/years
 * Get all unique key stages for a specific subject from Qdrant
 * Returns key stages as stored in Qdrant (KS1, KS2, KS3, KS4, KS5, Year-X, etc.)
 */
router.get('/years', async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject parameter is required',
      });
    }

    console.log('[YEARS API] Fetching key stages for subject:', subject);

    // Scroll through collection to get unique key stages for subject
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
      filter: {
        must: [
          { key: 'subject', match: { value: subject as string } },
        ],
      },
    });

    console.log('[YEARS API] Found', scrollResult.points.length, 'points in Qdrant');

    const uniqueKeyStages = new Set<string>();
    scrollResult.points.forEach(point => {
      if (point.payload?.key_stage) {
        uniqueKeyStages.add(point.payload.key_stage as string);
      }
    });

    console.log('[YEARS API] Unique key stages:', Array.from(uniqueKeyStages));

    // Sort by key stage order
    const keyStageOrder = ['KS1', 'KS2', 'KS3', 'KS4', 'KS5', 'Year-1', 'Year-2', 'Year-3', 'Year-4', 'Year-5', 'Year-6', 'Year-7', 'Year-8', 'Year-9', 'Year-10', 'Year-11'];
    const sortedKeyStages = Array.from(uniqueKeyStages).sort((a, b) => {
      const aIndex = keyStageOrder.indexOf(a);
      const bIndex = keyStageOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    res.json({
      success: true,
      data: {
        years: sortedKeyStages,
      },
    });
  } catch (error: any) {
    console.error('[YEARS API] Error fetching key stages:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/curriculum/topics
 * Get all unique topics for a specific subject and key_stage
 * Extracts topics from actual PDFs in Qdrant
 */
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const { subject, key_stage } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject parameter is required',
      });
    }

    console.log(`[TOPICS API] Fetching topics for subject=${subject}, key_stage=${key_stage || 'all'}`);

    // Build filter
    const filter: any = {
      must: [
        { key: 'subject', match: { value: subject as string } },
      ],
    };

    // Add key_stage filter if provided
    if (key_stage) {
      filter.must.push({ key: 'key_stage', match: { value: key_stage as string } });
    }

    console.log('[TOPICS API] Filter:', JSON.stringify(filter));

    // Scroll through collection to get all points
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
      filter,
    });

    console.log(`[TOPICS API] Found ${scrollResult.points.length} points in Qdrant`);

    // Extract unique topics
    const uniqueTopics = new Map<string, {
      topic: string;
      source_file: string;
      chunk_count: number;
      key_stage?: string;
    }>();

    scrollResult.points.forEach(point => {
      const topic = point.payload?.topic as string;
      const sourceFile = point.payload?.source_file as string;
      const pointKeyStage = point.payload?.key_stage as string;

      if (!topic || topic.trim() === '') return;

      // Clean topic name
      const cleanTopic = cleanTopicName(topic);

      // Add topic
      const existingKey = `${cleanTopic}_${pointKeyStage || ''}`;
      if (!uniqueTopics.has(existingKey)) {
        uniqueTopics.set(existingKey, {
          topic: cleanTopic,
          source_file: sourceFile || 'Unknown',
          chunk_count: 1,
          key_stage: pointKeyStage || undefined,
        });
      } else {
        const existing = uniqueTopics.get(existingKey)!;
        existing.chunk_count += 1;
      }
    });

    // Convert to array and sort by topic name
    const topics = Array.from(uniqueTopics.values())
      .sort((a, b) => a.topic.localeCompare(b.topic));

    console.log(`[TOPICS API] Extracted ${topics.length} unique topics`);
    if (topics.length > 0 && topics.length <= 20) {
      console.log('[TOPICS API] Topics:', topics.map(t => `${t.topic} (${t.key_stage})`));
    }

    res.json({
      success: true,
      data: {
        topics,
        subject,
        key_stage: key_stage || 'all',
      },
    });
  } catch (error: any) {
    console.error('[TOPICS API] Error fetching topics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/curriculum/topic-content
 * Get all content chunks for a specific topic
 */
router.get('/topic-content', async (req: Request, res: Response) => {
  try {
    const { subject, key_stage, topic } = req.query;
    
    if (!subject || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Subject and topic parameters are required',
      });
    }
    
    // Build filter
    const filter: any = {
      must: [
        { key: 'subject', match: { value: subject as string } },
        { key: 'topic', match: { value: topic as string } },
      ],
    };
    
    if (key_stage) {
      filter.must.push({ key: 'key_stage', match: { value: key_stage as string } });
    }
    
    // Scroll through collection to get all chunks for this topic
    const scrollResult = await qdrantClient.scroll(COLLECTION_NAME, {
      limit: 1000,
      filter,
    });
    
    // Group chunks by document and sort by chunk index
    const documents = new Map<string, { source_file: string; chunks: Array<{ index: number; content: string }> }>();
    
    scrollResult.points.forEach(point => {
      const sourceFile = point.payload?.source_file as string || 'Unknown';
      const chunkIndex = point.payload?.chunk_index as number || 0;
      const content = point.payload?.content as string || '';
      
      if (!documents.has(sourceFile)) {
        documents.set(sourceFile, {
          source_file: sourceFile,
          chunks: [],
        });
      }
      
      documents.get(sourceFile)!.chunks.push({
        index: chunkIndex,
        content,
      });
    });
    
    // Sort chunks within each document
    documents.forEach(doc => {
      doc.chunks.sort((a, b) => a.index - b.index);
    });
    
    // Convert to array
    const content = Array.from(documents.values());
    
    res.json({
      success: true,
      data: {
        topic,
        subject,
        key_stage,
        documents: content,
        total_chunks: scrollResult.points.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching topic content:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
