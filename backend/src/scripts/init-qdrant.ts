/**
 * Qdrant Initialization Script
 * 
 * Usage: npm run rag:init
 */

import { qdrantService } from '../services/qdrant.service';

async function initializeQdrant() {
  try {
    console.log('Initializing Qdrant collection...');
    await qdrantService.initializeCollection();

    const info = await qdrantService.getCollectionInfo();
    console.log('Qdrant collection initialized successfully');
    console.log('Collection info:', JSON.stringify(info, null, 2));

    const count = await qdrantService.getVectorCount();
    console.log(`Current vector count: ${count}`);

    process.exit(0);
  } catch (error: any) {
    console.error('Failed to initialize Qdrant:', error.message);
    process.exit(1);
  }
}

initializeQdrant();
