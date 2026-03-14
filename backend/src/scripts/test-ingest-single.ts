/**
 * Quick Test Ingestion - Single File
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileLoader } from '../utils/fileLoader';
import { embeddingService } from '../services/embedding.service';
import { qdrantService } from '../services/qdrant.service';

dotenv.config();

async function testSingleFile() {
  try {
    console.log('=== Testing Single File Ingestion ===\n');
    
    // Find first PDF file
    const testFile = 'KS1\\Maths\\Public\\Count and Colour 1.pdf';
    const fullPath = path.join(process.cwd(), 'data', testFile);
    
    console.log('Test file:', testFile);
    console.log('Full path:', fullPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(fullPath)) {
      console.log('❌ File not found! Trying alternative...');
      // Try another file
      const altFile = 'KS1-Awesome-websites.pdf';
      const altPath = path.join(process.cwd(), 'data', altFile);
      if (fs.existsSync(altPath)) {
        console.log('Using alternative:', altFile);
        await processFile(altFile, altPath);
      } else {
        console.log('❌ No test files found!');
      }
      return;
    }
    
    await processFile(testFile, fullPath);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

async function processFile(testFile: string, fullPath: string) {
  console.log('\n1. Loading file...');
  const content = await fileLoader.loadFile(testFile);
  console.log(`   ✓ Loaded ${content.metadata.fileName}`);
  console.log(`   File size: ${content.metadata.fileSize} bytes`);
  console.log(`   Text length: ${content.text.length} characters`);
  
  console.log('\n2. Initializing Qdrant...');
  await qdrantService.initializeCollection();
  console.log('   ✓ Qdrant ready');
  
  console.log('\n3. Extracting metadata...');
  const subject = fileLoader.extractSubject(content.metadata.filePath);
  const keyStage = fileLoader.extractKeyStage(content.metadata.filePath);
  const topic = fileLoader.extractTopic(content.metadata.fileName);
  console.log(`   Subject: ${subject}`);
  console.log(`   Key Stage: ${keyStage}`);
  console.log(`   Topic: ${topic}`);
  
  console.log('\n4. Chunking text...');
  const crypto = require('crypto');
  const documentId = crypto.randomUUID();
  const chunks = await embeddingService.chunkText(content.text, {
    subject,
    keyStage,
    topic,
    sourceFile: content.metadata.fileName,
    documentId,
  });
  console.log(`   ✓ Created ${chunks.length} chunks`);
  
  console.log('\n5. Generating embeddings and storing in Qdrant...');
  await embeddingService.embedAndStore(chunks);
  console.log('   ✓ Embeddings stored');
  
  console.log('\n6. Checking Qdrant...');
  const count = await qdrantService.getVectorCount();
  console.log(`   ✓ Total vectors in Qdrant: ${count}`);
  
  console.log('\n✅ Test completed successfully!');
}

testSingleFile();
