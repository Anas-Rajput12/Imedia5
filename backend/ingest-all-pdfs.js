/**
 * Ingest all PDFs from backend/data folder
 */
const fs = require('fs');
const path = require('path');
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION = 'ai-tutor-embeddings';
const DATA_DIR = path.join(__dirname, 'data');

// Simple PDF text extractor (placeholder - in production use pdf-parse)
function extractTextFromPDF(pdfPath) {
  // For demo, return filename-based content
  const fileName = path.basename(pdfPath, '.pdf');
  return `Document: ${fileName}\n\nThis document contains educational content for ${fileName}.`;
}

// Chunk text into smaller pieces
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

// Map folders to subjects and key stages
function getMetadata(filePath) {
  const relativePath = path.relative(DATA_DIR, filePath);
  const parts = relativePath.split(path.sep);
  
  const folder = parts[0];
  const fileName = path.basename(filePath, '.pdf');
  
  // Map folder to subject and key stage
  const mappings = {
    'KS1': { subject: 'General', keyStage: 'KS1' },
    'KS2': { subject: 'General', keyStage: 'KS2' },
    'KS3 Math': { subject: 'Maths', keyStage: 'KS3' },
    'KS4 Biology': { subject: 'Biology', keyStage: 'KS4' },
    'KS4 Chemistry': { subject: 'Chemistry', keyStage: 'KS4' },
    'Year 7 English': { subject: 'English', keyStage: 'Year-7' },
    'Year 8 English': { subject: 'English', keyStage: 'Year-8' },
    'EYFS': { subject: 'General', keyStage: 'EYFS' },
  };
  
  const mapping = mappings[folder] || { subject: 'General', keyStage: 'KS2' };
  
  return {
    subject: mapping.subject,
    keyStage: mapping.keyStage,
    topic: fileName,
    sourceFile: fileName + '.pdf',
  };
}

async function ingestAllPDFs() {
  try {
    console.log('=== Starting PDF Ingestion ===\n');
    
    // Find all PDF files
    const pdfFiles = [];
    
    function findPDFs(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findPDFs(fullPath);
        } else if (item.endsWith('.pdf')) {
          pdfFiles.push(fullPath);
        }
      }
    }
    
    findPDFs(DATA_DIR);
    
    console.log(`Found ${pdfFiles.length} PDF files\n`);
    
    let totalChunks = 0;
    let totalTopics = 0;
    
    for (const pdfPath of pdfFiles) {
      const metadata = getMetadata(pdfPath);
      console.log(`Processing: ${metadata.sourceFile}`);
      console.log(`  Subject: ${metadata.subject}, Key Stage: ${metadata.keyStage}, Topic: ${metadata.topic}`);
      
      // Extract text (simplified - in production use proper PDF parser)
      const fullText = extractTextFromPDF(pdfPath);
      
      // Chunk text
      const chunks = chunkText(fullText, 500, 50);
      console.log(`  Created ${chunks.length} chunks`);
      
      // Generate random vectors (768 dimensions)
      const vectors = chunks.map(() => Array(768).fill(0).map(() => Math.random()));
      
      // Prepare points
      const points = chunks.map((chunk, idx) => ({
        id: totalChunks + idx + 1000,
        vector: vectors[idx],
        payload: {
          subject: metadata.subject,
          key_stage: metadata.keyStage,
          topic: metadata.topic,
          source_file: metadata.sourceFile,
          chunk_index: idx,
          document_id: `doc-${totalTopics}`,
          section_title: null,
          page_number: null,
          content_type: 'explanation',
          content: chunk.text || chunk,
        },
      }));
      
      // Upsert to Qdrant
      await client.upsert(COLLECTION, { points });
      
      totalChunks += chunks.length;
      totalTopics++;
      console.log(`  ✅ Ingested ${chunks.length} chunks\n`);
    }
    
    console.log('=== Ingestion Complete ===');
    console.log(`Total topics: ${totalTopics}`);
    console.log(`Total chunks: ${totalChunks}`);
    
    // Verify
    const scrollResult = await client.scroll(COLLECTION, { limit: 10 });
    console.log(`\nVerification: Qdrant now has ${scrollResult.points.length} total chunks`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

ingestAllPDFs();
