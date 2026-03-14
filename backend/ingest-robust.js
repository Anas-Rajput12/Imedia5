/**
 * Robust Document Ingestion Script
 * Processes PDF/DOCX files with proper error handling
 */

// Load environment variables FIRST
require('dotenv').config();

// Set absolute path for Google credentials if relative
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && 
    !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(
    process.cwd(), 
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { HuggingFaceEmbeddings } = require('./src/utils/huggingface-embeddings');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const crypto = require('crypto');

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = 'ai-tutor-embeddings';

console.log('=== RAG Document Ingestion (FREE HuggingFace) ===\n');
console.log('Configuration:');
console.log(`  Qdrant URL: ${QDRANT_URL ? '✓' : '✗ MISSING'}`);
console.log(`  Qdrant API Key: ${QDRANT_API_KEY ? '✓' : '✗ MISSING'}`);
console.log(`  Embeddings: HuggingFace (FREE - no API key needed)`);
console.log(`  Collection: ${COLLECTION_NAME}\n`);

if (!QDRANT_URL || !QDRANT_API_KEY) {
  console.error('❌ Missing required configuration!');
  process.exit(1);
}

// Initialize services
const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

// Initialize FREE HuggingFace embeddings (no API key needed)
const embeddings = new HuggingFaceEmbeddings({
  model: 'sentence-transformers/all-MiniLM-L6-v2',
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],
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
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
      console.log('\nCreating collection...');
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: { size: 768, distance: 'Cosine' },
      });
      
      // Create indexes
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'subject',
        field_schema: 'keyword',
        wait: true,
      });
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'key_stage',
        field_schema: 'keyword',
        wait: true,
      });
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'topic',
        field_schema: 'keyword',
        wait: true,
      });
      
      console.log('✓ Collection created with indexes');
    } else {
      console.log('✓ Collection exists');
    }
  } catch (error) {
    console.error('❌ Error initializing collection:', error.message);
    throw error;
  }
}

async function processFile(filePath, relativePath) {
  try {
    // Extract text
    const text = await extractText(filePath);
    if (!text || text.trim().length === 0) {
      return { success: false, reason: 'empty', chunks: 0 };
    }
    
    // Get metadata
    const subject = extractSubject(relativePath);
    const keyStage = extractKeyStage(relativePath);
    const topic = extractTopic(filePath);
    const fileName = path.basename(filePath);
    const documentId = crypto.randomUUID();
    
    // Chunk text
    const chunks = await textSplitter.splitText(text);
    if (chunks.length === 0) {
      return { success: false, reason: 'no_chunks', chunks: 0 };
    }
    
    // Generate embeddings in batches using Vertex AI
    const batchSize = 5; // Vertex AI batch limit
    const points = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Vertex AI embedDocuments returns number[][]
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
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Upload to Qdrant
    if (points.length > 0) {
      await qdrantClient.upsert(COLLECTION_NAME, {
        points,
        wait: true,
      });
    }
    
    return { success: true, chunks: points.length };
    
  } catch (error) {
    return { success: false, reason: error.message, chunks: 0 };
  }
}

async function scanDirectory(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await scanDirectory(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.pdf' || ext === '.docx' || ext === '.txt') {
        // Skip PPTX and XLSX
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Main execution
async function main() {
  try {
    // Initialize
    console.log('\n1. Initializing Qdrant...');
    await initializeCollection();
    
    // Scan files
    console.log('\n2. Scanning for documents...');
    const allFiles = await scanDirectory(DATA_DIR);
    console.log(`   Found ${allFiles.length} files (PDF/DOCX/TXT)`);
    
    // Process files
    console.log('\n3. Processing documents...\n');
    
    let successCount = 0;
    let failCount = 0;
    let emptyCount = 0;
    let totalChunks = 0;
    
    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      const relativePath = path.relative(DATA_DIR, filePath);
      const fileName = path.basename(filePath);
      
      process.stdout.write(`   [${i + 1}/${allFiles.length}] ${fileName}... `);
      
      const result = await processFile(filePath, relativePath);
      
      if (result.success) {
        successCount++;
        totalChunks += result.chunks;
        console.log(`✓ ${result.chunks} chunks`);
      } else if (result.reason === 'empty' || result.reason === 'no_chunks') {
        emptyCount++;
        console.log('⊘ empty');
      } else {
        failCount++;
        console.log(`✗ ${result.reason}`);
      }
      
      // Progress update every 10 files
      if ((i + 1) % 10 === 0) {
        const current = await qdrantClient.getCollection(COLLECTION_NAME);
        console.log(`   → Progress: ${current.points_count || 0} vectors in Qdrant`);
      }
    }
    
    // Final stats
    const collection = await qdrantClient.getCollection(COLLECTION_NAME);
    
    console.log('\n=================================');
    console.log('Ingestion Complete');
    console.log('=================================');
    console.log(`Successful: ${successCount}`);
    console.log(`Empty/Skipped: ${emptyCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total chunks: ${totalChunks}`);
    console.log(`Vectors in Qdrant: ${collection.points_count || 0}`);
    console.log('=================================\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
