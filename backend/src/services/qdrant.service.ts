import { QdrantClient } from '@qdrant/js-client-rest';
import * as crypto from 'crypto';

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor() {
    // Force load environment variables
    const dotenv = require('dotenv');
    dotenv.config();
    
    const url = process.env.QDRANT_URL || 'https://f63900e2-8b2a-478f-86a7-32bdd640af27.eu-west-1-0.aws.cloud.qdrant.io:6333';
    const apiKey = process.env.QDRANT_API_KEY;
    this.collectionName = process.env.QDRANT_COLLECTION || 'ai-tutor-embeddings';

    console.log('QDRANT_URL from env:', url ? 'PRESENT' : 'MISSING');
    console.log('QDRANT_API_KEY from env:', apiKey ? 'PRESENT' : 'MISSING');
    console.log('QDRANT_COLLECTION from env:', this.collectionName);

    if (!apiKey) {
      console.error('WARNING: QDRANT_API_KEY not found in environment!');
    }

    this.client = new QdrantClient({
      url,
      apiKey: apiKey || undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate UUID using Node.js crypto
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Initialize the Qdrant collection with proper schema
   */
  async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );

      if (exists) {
        console.log(`Collection '${this.collectionName}' already exists`);
        return;
      }

      // Create collection with vector config
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: 768, // text-embedding-3-small dimension
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        hnsw_config: {
          m: 16,
          ef_construct: 100,
        },
      });

      console.log(`Collection '${this.collectionName}' created successfully`);

      // Create payload indexes for filtering
      await this.createPayloadIndex('subject', 'keyword');
      await this.createPayloadIndex('key_stage', 'keyword');
      await this.createPayloadIndex('topic', 'keyword');
      await this.createPayloadIndex('document_id', 'keyword');

      console.log('Payload indexes created successfully');
    } catch (error) {
      console.error('Error initializing Qdrant collection:', error);
      throw error;
    }
  }

  /**
   * Create a payload index for filtering
   */
  private async createPayloadIndex(
    fieldName: string,
    fieldType: 'keyword' | 'text' | 'integer'
  ): Promise<void> {
    try {
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: fieldName,
        field_schema: fieldType,
        wait: true,
      });
      console.log(`Index created for field: ${fieldName}`);
    } catch (error) {
      console.error(`Error creating index for ${fieldName}:`, error);
    }
  }

  /**
   * Upsert vectors into Qdrant
   */
  async upsertVectors(
    vectors: number[][],
    payloads: Array<Record<string, unknown>>
  ): Promise<void> {
    try {
      const points = vectors.map((vector, index) => ({
        id: this.generateUUID(),
        vector,
        payload: payloads[index],
      }));

      await this.client.upsert(this.collectionName, {
        points,
        wait: true,
      });

      console.log(`Upserted ${vectors.length} vectors successfully`);
    } catch (error) {
      console.error('Error upserting vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors with optional filtering
   */
  async search(
    queryVector: number[],
    options: {
      limit?: number;
      scoreThreshold?: number;
      subject?: string;
      keyStage?: string;
      topic?: string;
    } = {}
  ): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
    try {
      const {
        limit = 5,
        scoreThreshold = 0.0, // Set to 0.0 to return all results
        subject,
        keyStage,
        topic,
      } = options;

      // Build filter if any filters are provided
      const filter = this.buildFilter(subject, keyStage, topic);

      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit,
        score_threshold: scoreThreshold,
        filter,
        params: {
          hnsw_ef: 128,
          exact: false,
        },
      });

      return results.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as Record<string, unknown>,
      }));
    } catch (error) {
      console.error('Error searching vectors:', error);
      throw error;
    }
  }

  /**
   * Build Qdrant filter from options
   */
  private buildFilter(
    subject?: string,
    keyStage?: string,
    topic?: string
  ): Record<string, unknown> | undefined {
    const must: Array<Record<string, unknown>> = [];

    if (subject) {
      must.push({ key: 'subject', match: { value: subject } });
    }
    if (keyStage) {
      must.push({ key: 'key_stage', match: { value: keyStage } });
    }
    if (topic) {
      must.push({ key: 'topic', match: { value: topic } });
    }

    return must.length > 0 ? { must } : undefined;
  }

  /**
   * Delete a collection (for testing/reset)
   */
  async deleteCollection(): Promise<void> {
    try {
      await this.client.deleteCollection(this.collectionName);
      console.log(`Collection '${this.collectionName}' deleted`);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(): Promise<unknown> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return info;
    } catch (error) {
      console.error('Error getting collection info:', error);
      throw error;
    }
  }

  /**
   * Get vector count
   */
  async getVectorCount(): Promise<number> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return (info as any).points_count || 0;
    } catch (error) {
      console.error('Error getting vector count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const qdrantService = new QdrantService();
