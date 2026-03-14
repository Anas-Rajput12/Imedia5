/**
 * Test data ingestion with real embeddings
 */
const { QdrantClient } = require('@qdrant/js-client-rest');
const { HuggingFaceTransformersEmbeddings } = require('./dist/utils/huggingface-embeddings.js');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'ai-tutor-embeddings';
const embeddings = new HuggingFaceTransformersEmbeddings();

// Test content for Frequency Tables
const frequencyTablesContent = [
  {
    chunk_index: 0,
    text: 'Frequency Tables - Introduction: A frequency table is a way of organizing and displaying data. It shows how often (the frequency) each value or category occurs in a data set. Frequency tables are useful for summarizing large amounts of data and making it easier to understand patterns.',
  },
  {
    chunk_index: 1,
    text: 'Structure of a Frequency Table: A basic frequency table has two columns: (1) The first column lists all the different values or categories in the data set. (2) The second column shows the frequency - how many times each value appears. The frequencies should add up to the total number of data points.',
  },
  {
    chunk_index: 2,
    text: 'How to Create a Frequency Table: Step 1: Identify all the different values or categories in your data. Step 2: Draw a table with two columns - one for the values/categories and one for frequency. Step 3: Go through your data and count how many times each value appears. Step 4: Record these counts in the frequency column. Step 5: Check that the total of all frequencies equals your total number of data points.',
  },
  {
    chunk_index: 3,
    text: 'Example - Rolling a Dice: If you roll a dice 20 times and get: 1,3,3,5,2,1,4,3,6,2,1,5,4,3,2,6,1,4,5,3 - You can create a frequency table: Number 1 appears 4 times, Number 2 appears 3 times, Number 3 appears 5 times, Number 4 appears 3 times, Number 5 appears 3 times, Number 6 appears 2 times. Total: 20 rolls.',
  },
  {
    chunk_index: 4,
    text: 'Tally Charts and Frequency Tables: Tally charts are often used to collect data before making a frequency table. Each time a value occurs, you add a tally mark. Every fifth mark is drawn diagonally across the previous four to make a group of 5. This makes counting easier when creating the final frequency table.',
  },
];

async function ingestTestData() {
  try {
    console.log('Starting test data ingestion with real embeddings...');
    
    // Extract texts
    const texts = frequencyTablesContent.map(chunk => chunk.text);
    
    console.log('Generating embeddings...');
    const vectors = await embeddings.embedDocuments(texts);
    console.log(`Generated ${vectors.length} vectors with dimension ${vectors[0].length}`);
    
    // Prepare points
    const points = frequencyTablesContent.map((chunk, idx) => ({
      id: `freq-table-chunk-${chunk.chunk_index}`,
      vector: vectors[idx],
      payload: {
        subject: 'Maths',
        key_stage: 'KS2',
        topic: 'Frequency Tables Worksheet',
        source_file: 'Frequency Tables Worksheet.pdf',
        chunk_index: chunk.chunk_index,
        document_id: 'freq-tables-001',
        section_title: null,
        page_number: null,
        content_type: 'explanation',
        content: chunk.text, // THE ACTUAL CONTENT
      },
    }));

    console.log(`Upserting ${points.length} vectors to Qdrant...`);
    
    const result = await client.upsert(COLLECTION_NAME, {
      points: points,
      wait: true,
    });

    console.log('✅ Successfully ingested test data!');
    console.log(`Status: ${result.status}`);
    
    // Verify by scrolling
    const scrollResult = await client.scroll(COLLECTION_NAME, {
      limit: 5,
      filter: {
        must: [
          { key: 'topic', match: { value: 'Frequency Tables Worksheet' } },
        ],
      },
    });
    
    console.log(`\nVerification: Found ${scrollResult.points.length} chunks for Frequency Tables`);
    scrollResult.points.forEach((point, idx) => {
      const content = point.payload?.content;
      console.log(`Chunk ${idx}: ${content ? content.substring(0, 80) + '...' : 'NO CONTENT'}`);
    });
    
  } catch (error) {
    console.error('❌ Error ingesting test data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

ingestTestData();
