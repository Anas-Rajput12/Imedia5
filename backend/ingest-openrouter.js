/**
 * OpenRouter Document Ingestion
 * Fast and cheap embeddings using OpenRouter API
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const crypto = require('crypto');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const COLLECTION_NAME = 'ai-tutor-embeddings';

console.log('=== RAG Ingestion (OpenRouter - Fast & Cheap) ===\n');
console.log('Configuration:');
console.log(`  Qdrant: ${QDRANT_URL ? '✓' : '✗'}`);
console.log(`  OpenRouter: ${OPENROUTER_API_KEY ? '✓' : '✗'}`);
console.log(`  Collection: ${COLLECTION_NAME}\n`);

if (!QDRANT_URL || !QDRANT_API_KEY || !OPENROUTER_API_KEY) {
  console.error('❌ Missing configuration!');
  process.exit(1);
}

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

// OpenRouter embeddings (uses OpenAI compatible API)
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
  dimensions: 768,
  apiKey: OPENROUTER_API_KEY,
  configuration: {
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  },
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// Helper functions
function extractSubject(filePath) {
  const parts = filePath.split(path.sep);
  const keywords = ['Math', 'Maths', 'Biology', 'Chemistry', 'Physics', 'English'];
  for (const part of parts) {
    for (const keyword of keywords) {
      if (part.toLowerCase().includes(keyword.toLowerCase())) {
        return part.toLowerCase().includes('math') ? 'Maths' : keyword;
      }
    }
  }
  return 'General';
}

function extractKeyStage(filePath) {
  const parts = filePath.split(path.sep);
  const patterns = ['KS1', 'KS2', 'KS3', 'KS4', 'KS5', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];
  for (const part of parts) {
    for (const pattern of patterns) {
      if (part.toLowerCase().includes(pattern.toLowerCase())) {
        return pattern.replace(' ', '-');
      }
    }
  }
  return 'KS4';
}

function extractTopic(fileName) {
  const name = path.basename(fileName, path.extname(fileName));
  return name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

async function initializeCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      console.log('Creating collection...');
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: { size: 768, distance: 'Cosine' },
      });
      
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, { field_name: 'subject', field_schema: 'keyword', wait: true });
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, { field_name: 'key_stage', field_schema: 'keyword', wait: true });
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, { field_name: 'topic', field_schema: 'keyword', wait: true });
      
      console.log('✓ Collection created\n');
    } else {
      console.log('✓ Collection exists\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function scanFiles() {
  const files = [];
  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.pdf' || ext === '.docx' || ext === '.txt') {
          files.push(fullPath);
        }
      }
    }
  }
  scan(DATA_DIR);
  return files;
}

async function main() {
  try {
    await initializeCollection();
    
    console.log('Scanning files...');
    const allFiles = await scanFiles();
    console.log(`Found ${allFiles.length} files\n`);
    
    let processed = 0, success = 0, failed = 0, totalVectors = 0;
    
    console.log('Starting ingestion...\n');
    
    for (const filePath of allFiles) {
      processed++;
      const relativePath = path.relative(DATA_DIR, filePath);
      const fileName = path.basename(filePath);
      
      process.stdout.write(`[${processed}/${allFiles.length}] ${fileName}... `);
      
      try {
        const text = await extractText(filePath);
        if (!text || text.trim().length === 0) {
          console.log('⊘ empty');
          failed++;
          continue;
        }
        
        const subject = extractSubject(relativePath);
        const keyStage = extractKeyStage(relativePath);
        const topic = extractTopic(filePath);
        const documentId = crypto.randomUUID();
        
        const chunks = await textSplitter.splitText(text);
        if (chunks.length === 0) {
          console.log('⊘ no chunks');
          failed++;
          continue;
        }
        
        // Generate embeddings in batches
        const points = [];
        const batchSize = 10;
        
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const vectors = await embeddings.embedDocuments(batch);
          
          batch.forEach((chunk, idx) => {
            points.push({
              id: crypto.randomUUID(),
              vector: vectors[idx],
              payload: {
                subject,
                key_stage: keyStage,
                topic,
                source_file: fileName,
                document_id: documentId,
                chunk_index: i + idx,
                content: chunk,
              },
            });
          });
        }
        
        if (points.length > 0) {
          await qdrantClient.upsert(COLLECTION_NAME, { points, wait: true });
          success++;
          totalVectors += points.length;
          console.log(`✓ ${points.length} vectors (total: ${totalVectors})`);
          
          if (processed % 10 === 0) {
            console.log(`   → Progress: ${totalVectors} vectors\n`);
          }
        } else {
          console.log('✗ upload failed');
          failed++;
        }
        
      } catch (error) {
        console.log(`✗ ${error.message.substring(0, 50)}`);
        failed++;
      }
    }
    
    const collection = await qdrantClient.getCollection(COLLECTION_NAME);
    
    console.log('\n=================================');
    console.log('✅ Ingestion Complete!');
    console.log('=================================');
    console.log(`Processed: ${processed}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total Vectors: ${collection.points_count || totalVectors}`);
    console.log('=================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
