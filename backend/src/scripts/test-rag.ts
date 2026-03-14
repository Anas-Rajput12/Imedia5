/**
 * Test RAG Pipeline Script
 * 
 * Usage: npm run rag:test
 */

import { ragService } from '../services/rag.service';

async function testRAG() {
  try {
    console.log('=== Testing RAG Pipeline ===\n');

    // Test question
    const testQuestion = 'What is the quadratic formula?';

    console.log(`Question: ${testQuestion}\n`);

    // Execute RAG
    const result = await ragService.executeRAG({
      question: testQuestion,
      studentId: 'test-user',
      subject: 'Maths',
    });

    console.log('=== Response ===\n');
    console.log(`Answer: ${result.response.answer}\n`);

    console.log('=== Structured Response ===\n');
    console.log(`Introduction: ${result.response.structuredResponse.introduction}`);
    console.log(`\nExplanation: ${result.response.structuredResponse.explanation}`);
    console.log(`\nExamples: ${result.response.structuredResponse.examples}`);
    console.log(`\nSummary: ${result.response.structuredResponse.summary}`);

    console.log('\n=== Sources ===\n');
    result.response.sources.forEach((source, i) => {
      console.log(`${i + 1}. ${source}`);
    });

    console.log('\n=== Metrics ===\n');
    console.log(`Retrieval Time: ${result.retrievalTime}ms`);
    console.log(`Generation Time: ${result.generationTime}ms`);
    console.log(`Total Time: ${result.retrievalTime + result.generationTime}ms`);
    console.log(`Confidence: ${(result.response.confidence * 100).toFixed(1)}%`);
    console.log(`Flags: ${result.response.flags.join(', ') || 'None'}`);

    console.log('\n=== Retrieved Chunks ===\n');
    result.retrievedChunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}:`);
      console.log(`  Source: ${chunk.sourceFile}`);
      console.log(`  Subject: ${chunk.subject}`);
      console.log(`  Key Stage: ${chunk.keyStage}`);
      console.log(`  Topic: ${chunk.topic}`);
      console.log(`  Score: ${(chunk.similarityScore * 100).toFixed(1)}%`);
      console.log(`  Content: ${chunk.content.substring(0, 100)}...\n`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRAG();
