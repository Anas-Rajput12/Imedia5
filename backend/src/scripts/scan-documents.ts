/**
 * Simple Document Ingestion Script
 * Processes ALL files from backend/data folder
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

console.log('=== Simple Document Ingestion ===\n');
console.log('Data Directory:', DATA_DIR);
console.log('Qdrant URL:', QDRANT_URL ? 'Configured' : 'MISSING');
console.log('OpenAI API Key:', OPENAI_API_KEY ? 'Configured' : 'MISSING');
console.log('Gemini API Key:', GOOGLE_GEMINI_API_KEY ? 'Configured' : 'MISSING');
console.log('\nStarting ingestion...\n');

// Simple file scanner
function scanDirectory(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // Only process PDF and DOCX files (most reliable)
      if (ext === '.pdf' || ext === '.docx' || ext === '.txt') {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

console.log('Scanning for documents...');
const allFiles = scanDirectory(DATA_DIR);
console.log(`Found ${allFiles.length} supported files (PDF, DOCX, TXT)\n`);

// Display files
allFiles.forEach((file, i) => {
  console.log(`${i + 1}. ${path.relative(DATA_DIR, file)}`);
});

console.log(`\n✅ Scan complete!`);
console.log(`\nNext step: Run 'npm run rag:ingest' to process these files into Qdrant`);
