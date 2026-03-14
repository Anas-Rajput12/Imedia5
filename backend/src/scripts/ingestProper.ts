/**
 * Proper Document Ingestion with Topic Extraction
 * 
 * Usage: npm run rag:ingest-proper
 * 
 * This script:
 * 1. Clears existing Qdrant collection
 * 2. Reads files from backend/data organized by Year
 * 3. Extracts topics from content
 * 4. Stores with proper metadata (year, topic, subject)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileLoader } from '../utils/fileLoader';
import { embeddingService } from '../services/embedding.service';
import { qdrantService } from '../services/qdrant.service';
import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'ai-tutor-embeddings';

// Year to folder mapping
const YEAR_FOLDERS: Record<string, string> = {
  'Year-5': 'Year 5',
  'Year-6': 'Year 6',
  'Year-7': 'Year 7',
  'Year-8': 'Year 8',
  'Year-9': 'Year 9',
  'Year-10': 'Year 10',
  'Year-11': 'Year 11',
};

// Subject extraction from folder name
function extractSubject(folderName: string): string {
  const subjectMap: Record<string, string> = {
    'Maths': 'Maths',
    'Math': 'Maths',
    'Biology': 'Biology',
    'Science': 'Biology',
    'English': 'English',
    'Chemistry': 'Chemistry',
    'Physics': 'Physics',
  };
  
  for (const [key, subject] of Object.entries(subjectMap)) {
    if (folderName.toLowerCase().includes(key.toLowerCase())) {
      return subject;
    }
  }
  
  return 'General';
}

/**
 * Extract topic from content (first few pages)
 */
function extractTopicFromContent(content: string, fileName: string): string {
  // Remove file extension
  let topic = fileName.replace(/\.(pdf|docx|pptx|txt)$/i, '');
  
  // Look for chapter/section headings in content
  const lines = content.split('\n').filter(line => line.trim().length > 10);
  
  for (const line of lines.slice(0, 20)) {
    // Look for capitalized headings
    const headingPatterns = [
      /^(?:Chapter|Section|Unit|Topic)\s*\d*[:\s]+([A-Z][^.\n]+)/i,
      /^([A-Z][A-Za-z\s]+(?:System|Process|Theory|Law|Principle|Equation|Formula|Methods|Techniques))$/,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})$/,  // Title case
    ];
    
    for (const pattern of headingPatterns) {
      const match = line.match(pattern);
      if (match && match[1].length > 5 && match[1].length < 100) {
        return match[1].trim();
      }
    }
  }
  
  // Fallback to cleaned filename
  return topic
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clear Qdrant collection
 */
async function clearCollection(): Promise<void> {
  console.log('🗑️  Clearing Qdrant collection...');
  
  const client = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
  });
  
  try {
    // Delete collection
    await client.deleteCollection(COLLECTION_NAME);
    console.log('✓ Collection deleted');
    
    // Recreate collection
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768, // text-embedding-3-small
        distance: 'Cosine',
      },
    });
    console.log('✓ Collection recreated');
  } catch (error: any) {
    console.error('Error clearing collection:', error.message);
  }
}

/**
 * Ingest a single file with proper metadata
 */
async function ingestFile(
  filePath: string,
  year: string,
  subject: string
): Promise<{ topic: string; chunks: number }> {
  try {
    console.log(`📄 Processing: ${filePath}`);
    
    // Load file
    const fileContent = await fileLoader.loadFile(filePath);
    
    // Extract topic from content
    const topic = extractTopicFromContent(fileContent.text, fileContent.metadata.fileName);
    
    console.log(`  → Topic: ${topic}`);
    
    // Chunk text with proper metadata
    const chunks = await embeddingService.chunkText(fileContent.text, {
      subject,
      keyStage: year,
      topic,
      sourceFile: fileContent.metadata.fileName,
      documentId: `doc_${year}_${subject}_${topic.replace(/\s+/g, '_').toLowerCase()}`,
    });
    
    console.log(`  → Chunks: ${chunks.length}`);
    
    // Generate embeddings and store
    await embeddingService.embedAndStore(chunks);
    
    return { topic, chunks: chunks.length };
  } catch (error: any) {
    console.error(`  ✗ Error: ${error.message}`);
    return { topic: '', chunks: 0 };
  }
}

/**
 * Main ingestion function
 */
async function ingestAllProper() {
  console.log('=== Proper Document Ingestion ===\n');
  console.log('⚠️  This will CLEAR Qdrant and re-ingest all documents\n');
  
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Data directory not found:', dataDir);
    return;
  }
  
  // Option 1: Clear and re-ingest
  const shouldClear = process.argv.includes('--clear');
  
  if (shouldClear) {
    await clearCollection();
    console.log('\n');
  }
  
  // Read year folders
  const results: Array<{
    year: string;
    subject: string;
    topic: string;
    chunks: number;
  }> = [];
  
  for (const [year, folderName] of Object.entries(YEAR_FOLDERS)) {
    const yearDir = path.join(dataDir, folderName);
    
    if (!fs.existsSync(yearDir)) {
      console.log(`⏭️  Skipping ${folderName} (not found)`);
      continue;
    }
    
    console.log(`\n📁 Processing ${folderName}...`);
    
    // Read subject folders within year
    const subjectFolders = fs.readdirSync(yearDir);
    
    for (const subjectFolder of subjectFolders) {
      const subjectDir = path.join(yearDir, subjectFolder);
      
      if (!fs.statSync(subjectDir).isDirectory()) {
        continue;
      }
      
      const subject = extractSubject(subjectFolder);
      console.log(`  📚 Subject: ${subject}`);
      
      // Read files in subject folder
      const files = fs.readdirSync(subjectDir);
      
      for (const file of files) {
        if (file.endsWith('.pdf') || file.endsWith('.docx') || file.endsWith('.pptx')) {
          const filePath = path.join(subjectDir, file);
          const result = await ingestFile(filePath, year, subject);
          
          if (result.chunks > 0) {
            results.push({
              year,
              subject,
              topic: result.topic,
              chunks: result.chunks,
            });
          }
        }
      }
    }
  }
  
  // Summary
  console.log('\n=== Ingestion Complete ===\n');
  console.log(`Total topics ingested: ${results.length}`);
  console.log(`Total chunks: ${results.reduce((sum, r) => sum + r.chunks, 0)}`);
  
  // Group by year
  const byYear: Record<string, number> = {};
  results.forEach(r => {
    byYear[r.year] = (byYear[r.year] || 0) + 1;
  });
  
  console.log('\nBy Year:');
  for (const [year, count] of Object.entries(byYear)) {
    console.log(`  ${year}: ${count} topics`);
  }
}

// Run
ingestAllProper().catch(console.error);
