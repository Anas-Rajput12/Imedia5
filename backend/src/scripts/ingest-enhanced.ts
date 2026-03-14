/**
 * Enhanced Document Ingestion Script
 * 
 * Best Practices:
 * 1. Split documents into small sections (300-500 words)
 * 2. Organize by: Subject → Topic → Year → Exam Board
 * 3. Clean content only (remove duplicates, messy text)
 * 4. Add complete metadata for every chunk
 * 
 * Usage: ts-node src/scripts/ingest-enhanced.ts [pdf-file-path]
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

// Qdrant configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = 'curriculum_documents';

// Embedding API (using HuggingFace or OpenAI)
const EMBEDDING_API_KEY = process.env.OPENAI_API_KEY || process.env.HUGGINGFACE_API_KEY || '';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    subject: string;
    topic: string;
    keyStage: string;
    examBoard: string;
    sourceFile: string;
    pageNumber: number;
    sectionTitle: string;
    chunkIndex: number;
    totalChunks: number;
  };
  embedding: number[];
}

/**
 * Clean text content
 * - Remove OCR errors
 * - Remove headers/footers
 * - Remove page numbers
 * - Fix broken formatting
 */
function cleanText(text: string): string {
  return text
    // Remove page numbers (standalone numbers)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove headers/footers (common patterns)
    .replace(/^(Copyright|©|All rights reserved).*/gim, '')
    .replace(/^(Page \d+ of \d+).*/gim, '')
    // Remove multiple blank lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove special characters that break embedding
    .replace(/[^\w\s.,!?;:()\-+'"@£$%&*]/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Split text into chunks (300-500 words each)
 * - Split at natural boundaries (sections, paragraphs)
 * - Ensure each chunk is coherent
 */
function splitIntoChunks(text: string, maxWords: number = 500): string[] {
  const chunks: string[] = [];
  
  // First split by major sections (double newlines)
  const sections = text.split(/\n\s*\n/);
  
  let currentChunk = '';
  let currentWordCount = 0;
  
  for (const section of sections) {
    const words = section.trim().split(/\s+/);
    const wordCount = words.length;
    
    // If section itself is too long, split it further
    if (wordCount > maxWords) {
      // Save current chunk first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentWordCount = 0;
      }
      
      // Split long section into paragraphs
      const paragraphs = section.split(/\n/);
      for (const paragraph of paragraphs) {
        const paraWords = paragraph.trim().split(/\s+/);
        if (paraWords.length > maxWords) {
          // Split very long paragraph into sentences
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          let sentenceChunk = '';
          let sentenceCount = 0;
          
          for (const sentence of sentences) {
            sentenceChunk += sentence + ' ';
            sentenceCount++;
            
            if (sentenceCount >= 3 || sentenceChunk.split(/\s+/).length >= maxWords) {
              chunks.push(sentenceChunk.trim());
              sentenceChunk = '';
              sentenceCount = 0;
            }
          }
          
          if (sentenceChunk.trim()) {
            chunks.push(sentenceChunk.trim());
          }
        } else {
          currentChunk += paragraph + '\n\n';
          currentWordCount += paraWords.length;
          
          if (currentWordCount >= maxWords) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
            currentWordCount = 0;
          }
        }
      }
    } else {
      // Add section to current chunk
      currentChunk += section + '\n\n';
      currentWordCount += wordCount;
      
      // If chunk is full, save it
      if (currentWordCount >= maxWords * 0.8) { // 80% of max
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentWordCount = 0;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.split(/\s+/).length >= 50); // Minimum 50 words
}

/**
 * Extract metadata from filename or user input
 * Format: subject_topic_year_examboard.pdf
 * Example: maths_algebra_year7_gcse.pdf
 */
function extractMetadata(filename: string, userMetadata?: any): any {
  const baseName = path.basename(filename, '.pdf');
  const parts = baseName.toLowerCase().split('_');
  
  const defaults = {
    subject: 'General',
    topic: 'General',
    keyStage: 'Year 7',
    examBoard: 'GCSE',
  };
  
  // Try to extract from filename
  if (parts.length >= 2) {
    defaults.subject = capitalize(parts[0]);
    defaults.topic = capitalize(parts[1]);
    
    if (parts.length >= 3) {
      defaults.keyStage = parts[2].replace('year', 'Year ');
    }
    
    if (parts.length >= 4) {
      defaults.examBoard = parts[3].toUpperCase();
    }
  }
  
  // Override with user-provided metadata
  return {
    ...defaults,
    ...userMetadata,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate embedding for text
 * Using HuggingFace Inference API (free tier)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Option 1: Use HuggingFace Inference API
  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
}

/**
 * Parse PDF and extract text with page numbers
 */
async function parsePDF(filePath: string): Promise<{ text: string; pages: Array<{ pageNumber: number; text: string }> }> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  // Note: pdf-parse doesn't give us page-by-page breakdown easily
  // For better page extraction, consider using pdfjs-dist
  return {
    text: data.text,
    pages: [{ pageNumber: 1, text: data.text }] // Simplified
  };
}

/**
 * Main ingestion function
 */
async function ingestDocument(filePath: string, metadata?: any) {
  console.log(`\n📚 Starting ingestion: ${filePath}`);
  
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Initialize Qdrant client
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });
  
  // Check if collection exists, create if not
  const collections = await client.getCollections();
  if (!collections.collections.some(c => c.name === COLLECTION_NAME)) {
    console.log('Creating collection...');
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384, // all-MiniLM-L6-v2 embedding size
        distance: 'Cosine',
      },
    });
    
    // Create payload indexes for filtering
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'subject',
      field_schema: 'keyword',
    });
    
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'topic',
      field_schema: 'keyword',
    });
    
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'keyStage',
      field_schema: 'keyword',
    });
    
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'examBoard',
      field_schema: 'keyword',
    });
  }
  
  // Parse PDF
  console.log('Parsing PDF...');
  const pdfData = await parsePDF(filePath);
  
  // Extract metadata
  const docMetadata = extractMetadata(filePath, metadata);
  console.log('Metadata:', docMetadata);
  
  // Clean and split text
  console.log('Splitting into chunks...');
  const cleanTextContent = cleanText(pdfData.text);
  const chunks = splitIntoChunks(cleanTextContent, 400); // 400 words max
  
  console.log(`Created ${chunks.length} chunks`);
  
  // Process each chunk
  const points: any[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
    
    // Generate embedding
    const embedding = await generateEmbedding(chunkText);
    
    // Create point
    const point = {
      id: uuidv4(),
      vector: embedding,
      payload: {
        subject: docMetadata.subject,
        topic: docMetadata.topic,
        keyStage: docMetadata.keyStage,
        examBoard: docMetadata.examBoard,
        sourceFile: path.basename(filePath),
        pageNumber: 1, // Would need better PDF parsing for accurate pages
        sectionTitle: `Section ${i + 1}`,
        chunkIndex: i,
        totalChunks: chunks.length,
        content: chunkText,
      },
    };
    
    points.push(point);
    
    // Batch upload every 100 points
    if (points.length % 100 === 0) {
      console.log(`Uploading batch of ${points.length} points...`);
      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points: points,
      });
      points.length = 0; // Clear array
    }
  }
  
  // Upload remaining points
  if (points.length > 0) {
    console.log(`Uploading final batch of ${points.length} points...`);
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });
  }
  
  console.log(`\n✅ Ingestion complete! ${chunks.length} chunks indexed.`);
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: ts-node src/scripts/ingest-enhanced.ts [pdf-file-path]');
    console.log('Example: ts-node src/scripts/ingest-enhanced.ts ./documents/maths_algebra_year7_gcse.pdf');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  try {
    await ingestDocument(filePath);
  } catch (error: any) {
    console.error('❌ Ingestion error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { ingestDocument, cleanText, splitIntoChunks };
