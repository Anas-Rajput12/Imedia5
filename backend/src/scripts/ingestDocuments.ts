/**
 * Document Ingestion Script
 * 
 * Usage: npm run rag:ingest
 * Or: npm run rag:ingest -- --file=path/to/file.pdf --subject=Maths
 */

import { fileLoader } from '../utils/fileLoader';
import { embeddingService } from '../services/embedding.service';
import { qdrantService } from '../services/qdrant.service';
import * as crypto from 'crypto';

/**
 * Generate UUID using Node.js crypto
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

async function ingestDocuments() {
  try {
    const args = process.argv.slice(2);
    const fileArg = args.find((arg) => arg.startsWith('--file='));
    const subjectArg = args.find((arg) => arg.startsWith('--subject='));
    const keyStageArg = args.find((arg) => arg.startsWith('--key_stage='));

    console.log('Starting document ingestion...\n');

    // Initialize Qdrant first
    console.log('Initializing Qdrant...');
    await qdrantService.initializeCollection();

    let files: Array<{ filePath: string; text: string }> = [];

    if (fileArg) {
      // Single file mode
      const filePath = fileArg.split('=')[1];
      const subject = subjectArg?.split('=')[1] || 'General';
      const keyStage = keyStageArg?.split('=')[1] || 'KS4';

      console.log(`Ingesting single file: ${filePath}`);

      const content = await fileLoader.loadFile(filePath);
      const documentId = generateUUID();
      const topic = fileLoader.extractTopic(content.metadata.fileName);

      const chunks = await embeddingService.chunkText(content.text, {
        subject,
        keyStage,
        topic,
        sourceFile: content.metadata.fileName,
        documentId,
      });

      await embeddingService.embedAndStore(chunks);

      console.log(`✓ Successfully ingested ${content.metadata.fileName}`);
      console.log(`  Chunks created: ${chunks.length}`);
    } else {
      // Bulk ingestion from data directory
      console.log('Ingesting all documents from backend/data...\n');

      const allFiles = await fileLoader.loadDirectory('.', {
        recursive: true,
        extensions: ['.pdf', '.docx', '.pptx', '.txt'],
      });

      console.log(`Found ${allFiles.length} documents to process\n`);

      let successCount = 0;
      let failCount = 0;

      for (const file of allFiles) {
        try {
          const documentId = generateUUID();
          const subject = fileLoader.extractSubject(file.metadata.filePath);
          const keyStage = fileLoader.extractKeyStage(file.metadata.filePath);
          const topic = fileLoader.extractTopic(file.metadata.fileName);

          console.log(`Processing: ${file.metadata.fileName}`);
          console.log(`  Subject: ${subject}, Key Stage: ${keyStage}, Topic: ${topic}`);

          const chunks = await embeddingService.chunkText(file.text, {
            subject,
            keyStage,
            topic,
            sourceFile: file.metadata.fileName,
            documentId,
          });

          await embeddingService.embedAndStore(chunks);

          successCount++;
          console.log(`  ✓ Created ${chunks.length} chunks\n`);
        } catch (error: any) {
          failCount++;
          console.error(`  ✗ Error: ${error.message}\n`);
        }
      }

      console.log(`\n=================================`);
      console.log(`Ingestion Complete`);
      console.log(`=================================`);
      console.log(`Successful: ${successCount}`);
      console.log(`Failed: ${failCount}`);
      console.log(`Total: ${allFiles.length}`);
    }

    const vectorCount = await qdrantService.getVectorCount();
    console.log(`\nTotal vectors in Qdrant: ${vectorCount}`);

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Ingestion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

ingestDocuments();
