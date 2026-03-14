import { qdrantService } from './qdrant.service';
import { embeddingService } from './embedding.service';
import { openRouterService, TeacherResponse } from './openRouter.service';

export interface RetrievedChunk {
  id: string;
  content: string;
  sourceFile: string;
  subject: string;
  keyStage: string;
  topic: string;
  similarityScore: number;
}

export interface RAGQuery {
  question: string;
  studentId: string;
  subject?: string;
  keyStage?: string;
  topic?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  restrictToTopic?: boolean; // If true, only answer questions about the current topic
}

export interface RAGResult {
  response: TeacherResponse;
  retrievedChunks: RetrievedChunk[];
  query: string;
  retrievalTime: number;
  generationTime: number;
}

export class RAGService {
  /**
   * Execute complete RAG pipeline: Query → Embed → Retrieve → Augment → Generate
   */
  async executeRAG(query: RAGQuery): Promise<RAGResult> {
    const retrievalStart = Date.now();

    try {
      console.log(`Executing RAG for question: ${query.question.substring(0, 50)}...`);
      console.log(`RAG Query: subject=${query.subject}, keyStage=${query.keyStage}, topic=${query.topic}, restrictToTopic=${query.restrictToTopic}`);

      // Step 1: Convert question to embedding
      const queryVector = await embeddingService.embedQuery(query.question);

      // Step 2: Retrieve relevant chunks from Qdrant
      // If restrictToTopic is true and topic is provided, filter by topic
      const searchResults = await qdrantService.search(queryVector, {
        limit: 10, // Increase limit for better retrieval
        scoreThreshold: 0.0, // Set to 0.0 to return all results (Qdrant Cloud indexing issue)
        subject: query.subject,
        keyStage: query.keyStage,
        topic: query.restrictToTopic ? query.topic : undefined, // Only filter by topic if restrictToTopic is true
      });

      const retrievalTime = Date.now() - retrievalStart;
      console.log(`Retrieval completed in ${retrievalTime}ms, found ${searchResults.length} chunks`);
      console.log(`Retrieved chunks from topic: ${searchResults.map(r => r.payload?.topic).join(', ')}`);

      // Step 3: Format retrieved context
      const { context, sources, chunks } = this.formatRetrievedContext(searchResults);

      // Step 4: Check if retrieval returned sufficient context
      if (!context || context.trim().length === 0) {
        // No retrieval - return low-confidence response
        const noRetrievalResponse: TeacherResponse = {
          answer: `I couldn't find specific information about "${query.question}" in our study materials for **${query.topic || 'this topic'}**.\n\nThis might be because:\n1. This topic isn't covered in your uploaded documents yet\n2. The question uses different words than your documents\n\nLet me explain what I know about **${query.topic || 'this topic'}** instead...\n\nThink about the key concepts we've covered:\n1. What information do you have?\n2. What are you trying to find?\n3. Which method should you use?\n\nShow me your working and I'll give you feedback!`,
          structuredResponse: {
            introduction: `I couldn't find specific information about this topic in the provided study materials.`,
            explanation: "This could mean:\n1. The topic is not covered in the uploaded documents\n2. The documents need to be ingested into the system\n3. Try rephrasing your question with different keywords",
            examples: '',
            summary: 'Please upload relevant study materials or contact your teacher for assistance with this topic.',
          },
          sources: [],
          confidence: 0.1,
          flags: ['NO_RETRIEVAL', 'LOW_CONFIDENCE'],
        };

        return {
          response: noRetrievalResponse,
          retrievedChunks: [],
          query: query.question,
          retrievalTime,
          generationTime: 0,
        };
      }

      // Step 5: If restrictToTopic is true, check if question is about the current topic
      if (query.restrictToTopic && query.topic) {
        const isTopicRelevant = this.checkTopicRelevance(query.question, query.topic, chunks);

        if (!isTopicRelevant) {
          const offTopicResponse: TeacherResponse = {
            answer: `I notice you're asking about "${query.question.substring(0, 50)}...", but we're currently studying **${query.topic}**. \n\nLet's focus on our current topic first! Once we complete this lesson, you can ask me about other topics. \n\nDo you have any questions about **${query.topic}**?`,
            structuredResponse: {
              introduction: `We're currently studying ${query.topic}.`,
              explanation: 'Please ask questions related to our current topic so I can help you understand it better.',
              examples: '',
              summary: `Let's focus on ${query.topic} for now.`,
            },
            sources: [],
            confidence: 1.0,
            flags: ['OFF_TOPIC'],
          };

          return {
            response: offTopicResponse,
            retrievedChunks: [],
            query: query.question,
            retrievalTime,
            generationTime: 0,
          };
        }
      }

      // Step 6: Generate teacher-style response with OpenRouter
      const generationStart = Date.now();
      const response = await openRouterService.generateTeacherResponse(
        query.question,
        context,
        sources,
        query.conversationHistory
      );
      const generationTime = Date.now() - generationStart;

      console.log(`Generation completed in ${generationTime}ms`);

      return {
        response,
        retrievedChunks: chunks,
        query: query.question,
        retrievalTime,
        generationTime,
      };
    } catch (error) {
      console.error('Error executing RAG pipeline:', error);
      throw error;
    }
  }

  /**
   * Check if a question is relevant to the current topic
   */
  private checkTopicRelevance(
    question: string, 
    topic: string, 
    chunks: RetrievedChunk[]
  ): boolean {
    const questionLower = question.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    // Check if question contains topic keywords
    const topicKeywords = topicLower.split(' ').filter(word => word.length > 3);
    let keywordMatchCount = 0;
    
    topicKeywords.forEach(keyword => {
      if (questionLower.includes(keyword)) {
        keywordMatchCount++;
      }
    });
    
    // If question contains at least 1 topic keyword, it's relevant
    if (keywordMatchCount >= 1) {
      return true;
    }
    
    // Check if any retrieved chunk is about the topic
    const topicChunkMatch = chunks.some(chunk => {
      const chunkTopic = (chunk.topic || '').toLowerCase();
      return chunkTopic.includes(topicLower) || topicLower.includes(chunkTopic);
    });
    
    return topicChunkMatch;
  }

  /**
   * Format retrieved context for prompt injection
   */
  private formatRetrievedContext(
    searchResults: Array<{ id: string; score: number; payload: Record<string, unknown> }>
  ): { context: string; sources: string[]; chunks: RetrievedChunk[] } {
    const chunks: RetrievedChunk[] = [];
    const sources = new Set<string>();
    const contextParts: string[] = [];

    console.log(`formatRetrievedContext: Processing ${searchResults.length} search results`);

    searchResults.forEach((result, index) => {
      const content = result.payload.content as string;
      const sourceFile = result.payload.source_file as string;
      const subject = result.payload.subject as string;
      const keyStage = result.payload.key_stage as string;
      const topic = result.payload.topic as string;

      console.log(`Chunk ${index}: score=${result.score}, topic=${topic}, content_length=${content?.length || 0}`);

      if (!content || content.trim().length === 0) {
        console.log(`Chunk ${index}: Skipping - empty content`);
        return;
      }

      chunks.push({
        id: result.id,
        content,
        sourceFile: sourceFile || 'Unknown',
        subject: subject || 'General',
        keyStage: keyStage || 'Unknown',
        topic: topic || 'Unknown',
        similarityScore: result.score,
      });

      sources.add(sourceFile as string);

      // Format chunk with source attribution
      contextParts.push(
        `[Source: ${sourceFile} | Subject: ${subject} | Key Stage: ${keyStage} | Topic: ${topic}]\n${content}\n`
      );
    });

    console.log(`formatRetrievedContext: Successfully formatted ${chunks.length} chunks`);

    return {
      context: contextParts.join('\n---\n'),
      sources: Array.from(sources),
      chunks,
    };
  }

  /**
   * Simple retrieval without generation (for debugging/preview)
   */
  async retrieveOnly(
    query: string,
    options: {
      limit?: number;
      subject?: string;
      keyStage?: string;
    } = {}
  ): Promise<RetrievedChunk[]> {
    try {
      const queryVector = await embeddingService.embedQuery(query);

      const searchResults = await qdrantService.search(queryVector, {
        limit: options.limit || 5,
        scoreThreshold: 0.0,
        subject: options.subject,
        keyStage: options.keyStage,
      });

      const { chunks } = this.formatRetrievedContext(searchResults);
      return chunks;
    } catch (error) {
      console.error('Error retrieving chunks:', error);
      throw error;
    }
  }

  /**
   * Get topic content from Qdrant
   */
  async getTopicContent(
    subject: string,
    topic: string,
    keyStage: string
  ): Promise<{
    topic: string;
    subject: string;
    documents: Array<{
      source_file: string;
      chunks: Array<{
        index: number;
        content: string;
      }>;
    }>;
    total_chunks: number;
  }> {
    try {
      // Build filter
      const filter: any = {
        must: [
          { key: 'subject', match: { value: subject } },
          { key: 'topic', match: { value: topic } },
        ],
      };

      if (keyStage) {
        filter.must.push({ key: 'key_stage', match: { value: keyStage } });
      }

      // Scroll through collection to get all chunks for this topic
      const scrollResult = await qdrantService['client'].scroll('ai-tutor-embeddings', {
        limit: 1000,
        filter,
      });

      // Group chunks by document and sort by chunk index
      const documents = new Map<string, { source_file: string; chunks: Array<{ index: number; content: string }> }>();

      scrollResult.points.forEach((point: any) => {
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

      return {
        topic,
        subject,
        documents: content,
        total_chunks: scrollResult.points.length,
      };
    } catch (error) {
      console.error('Error fetching topic content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
