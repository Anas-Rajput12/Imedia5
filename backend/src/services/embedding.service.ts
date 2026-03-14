import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { qdrantService } from './qdrant.service';

export interface ChunkMetadata {
  subject: string;
  keyStage: string;
  topic: string;
  sourceFile: string;
  documentId: string;
  chunkIndex: number;
  sectionTitle?: string;
  pageNumber?: number;
  contentType?: string;
}

export interface DocumentChunk {
  text: string;
  metadata: ChunkMetadata;
}

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Use OpenRouter for embeddings (cheaper than direct OpenAI)
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENROUTER_BASE_URL || undefined;
    
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY or OPENAI_API_KEY is not set in environment variables');
    }

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      dimensions: 768,
      apiKey,
      configuration: baseURL ? { baseURL } : {},
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: [
        '\n## ',      // Section headers
        '\n### ',     // Subsection headers
        '\n\n',       // Paragraph breaks
        '\n',         // Line breaks
        ' '           // Word breaks
      ],
    });
  }

  /**
   * Split text into chunks with metadata preservation
   */
  async chunkText(
    text: string,
    metadata: Omit<ChunkMetadata, 'chunkIndex'>
  ): Promise<DocumentChunk[]> {
    try {
      // Preprocess text
      const processedText = this.preprocessText(text);

      // Split into chunks
      const splitChunks = await this.textSplitter.splitText(processedText);

      // Add metadata to each chunk
      return splitChunks.map((chunkText, index) => ({
        text: chunkText,
        metadata: {
          ...metadata,
          chunkIndex: index,
        },
      }));
    } catch (error) {
      console.error('Error chunking text:', error);
      throw error;
    }
  }

  /**
   * Preprocess text before chunking
   */
  private preprocessText(text: string): string {
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Preserve mathematical notation (don't normalize LaTeX)
    // Remove common headers/footers if detected
    text = this.removeHeaderFooter(text);

    return text;
  }

  /**
   * Remove headers and footers from text
   */
  private removeHeaderFooter(text: string): string {
    // Remove page numbers at start/end of lines
    text = text.replace(/^\s*\d+\s*$/gm, '');

    // Remove common header/footer patterns
    text = text.replace(/^\s*(Copyright|Page \d+|\d+ of \d+)\s*$/gim, '');

    return text.trim();
  }

  /**
   * Generate embeddings for chunks and store in Qdrant
   */
  async embedAndStore(
    chunks: DocumentChunk[]
  ): Promise<void> {
    try {
      console.log(`Generating embeddings for ${chunks.length} chunks...`);

      // Extract texts for embedding
      const texts = chunks.map((chunk) => chunk.text);

      // Generate all embeddings at once
      const vectors = await this.embeddings.embedDocuments(texts);

      if (vectors.length !== chunks.length) {
        throw new Error(
          `Vector count mismatch: expected ${chunks.length}, got ${vectors.length}`
        );
      }

      // Prepare payloads for Qdrant
      const payloads = chunks.map((chunk, index) => ({
        subject: chunk.metadata.subject,
        key_stage: chunk.metadata.keyStage,
        topic: chunk.metadata.topic,
        source_file: chunk.metadata.sourceFile,
        chunk_index: chunk.metadata.chunkIndex,
        document_id: chunk.metadata.documentId,
        section_title: chunk.metadata.sectionTitle || null,
        page_number: chunk.metadata.pageNumber || null,
        content_type: chunk.metadata.contentType || this.detectContentType(chunk.text),
        content: chunk.text, // ADD THE ACTUAL CONTENT
      }));

      // Store in Qdrant
      await qdrantService.upsertVectors(vectors, payloads);

      console.log(`Successfully stored ${vectors.length} embeddings in Qdrant`);
    } catch (error) {
      console.error('Error embedding and storing chunks:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for a query
   */
  async embedQuery(query: string): Promise<number[]> {
    try {
      const sanitizedQuery = this.sanitizeQuery(query);
      return await this.embeddings.embedQuery(sanitizedQuery);
    } catch (error) {
      console.error('Error embedding query:', error);
      throw error;
    }
  }

  /**
   * Sanitize user query before embedding
   */
  private sanitizeQuery(query: string): string {
    // Remove potential prompt injection attempts
    query = query.replace(/(IGNORE|SYSTEM|INSTRUCT)/gi, '');

    // Limit query length
    query = query.slice(0, 1000);

    return query.trim();
  }

  /**
   * Detect content type of a chunk
   */
  private detectContentType(text: string): string {
    const lowerText = text.toLowerCase();

    // Check for examples
    if (lowerText.includes('example:') || lowerText.includes('for example:')) {
      return 'example';
    }

    // Check for definitions
    if (lowerText.includes('is defined as') || lowerText.includes('means')) {
      return 'definition';
    }

    // Check for formulas (mathematical notation)
    if (/[=+\-×÷]/.test(text) && /\d/.test(text)) {
      return 'formula';
    }

    // Default to explanation
    return 'explanation';
  }

  /**
   * Get embedding model info
   */
  getModelInfo(): { modelName: string; dimensions: number } {
    return {
      modelName: 'text-embedding-3-small',
      dimensions: 768,
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
