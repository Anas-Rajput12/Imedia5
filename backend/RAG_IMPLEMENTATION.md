# RAG Implementation Guide

## Overview

This document describes the Retrieval-Augmented Generation (RAG) implementation for the AI Tutor App. The system retrieves relevant educational content from uploaded documents and generates teacher-style explanations using Google Gemini.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Student   │────▶│  Frontend    │────▶│  Backend    │
│  (Question) │     │  (Next.js)   │     │ (Express.js)│
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                  ┌─────────────────────────────┼─────────────────────────────┐
                  │                             │                             │
                  ▼                             ▼                             ▼
         ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
         │   Embedding    │          │    Qdrant      │          │    Gemini      │
         │   (OpenAI)     │          │  (Vector DB)   │          │     (LLM)      │
         └────────────────┘          └────────────────┘          └────────────────┘
```

## RAG Pipeline Flow

### 1. Document Ingestion

```
File (PDF/DOCX/PPTX) → Text Extraction → Chunking → Embedding → Qdrant Storage
```

**Steps:**
1. Load file from `backend/data` directory
2. Extract text using pdf-parse (PDF) or mammoth (DOCX/PPTX)
3. Split text into 500-token chunks with 50-token overlap
4. Generate 768-dimensional embeddings using OpenAI `text-embedding-3-small`
5. Store vectors in Qdrant with metadata (subject, key stage, topic, source)

### 2. Query Processing

```
Student Question → Embedding → Vector Search → Retrieve Chunks → Build Context
```

**Steps:**
1. Sanitize student question
2. Generate query embedding (same model as documents)
3. Search Qdrant for top-5 similar chunks (cosine similarity > 0.7)
4. Filter by subject and key stage if provided
5. Format retrieved chunks with source attribution

### 3. Response Generation

```
Context + Question → Gemini Prompt → Teacher Response → Structured Output
```

**Prompt Structure:**
```
SYSTEM: You are a professional school teacher...

CONTEXT (from retrieved documents):
[Source: Algebra.pdf | Maths | KS4]
The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a...

STUDENT QUESTION:
What is the quadratic formula?

RESPONSE STRUCTURE:
**Introduction:** ...
**Explanation:** ...
**Examples:** ...
**Summary:** ...
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env` file:

```env
# Required for RAG
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=ai-tutor-embeddings
```

### 3. Start Qdrant (Docker)

```bash
docker run -d \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  --name ai-tutor-qdrant \
  qdrant/qdrant
```

### 4. Initialize Qdrant Collection

```bash
npm run rag:init
```

### 5. Ingest Documents

Place educational documents in `backend/data`:

```
backend/data/
├── KS3 Math/
│   └── algebra-basics.pdf
├── KS4 Biology/
│   └── cell-division.docx
└── KS4 Chemistry/
    └── periodic-table.pptx
```

Run ingestion:

```bash
# Ingest all documents
npm run rag:ingest

# Or ingest single file
npm run rag:ingest -- --file=KS3\ Math/algebra-basics.pdf --subject=Maths
```

### 6. Test RAG Pipeline

```bash
npm run rag:test
```

## API Endpoints

### POST /api/rag/ask

Ask a question with RAG retrieval.

**Request:**
```json
{
  "question": "What is the quadratic formula?",
  "student_id": "user_123",
  "subject": "Maths",
  "key_stage": "KS4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "The quadratic formula is...",
    "structured_response": {
      "introduction": "...",
      "explanation": "...",
      "examples": "...",
      "summary": "..."
    },
    "sources": ["algebra-basics.pdf"],
    "confidence": 0.85,
    "flags": [],
    "retrieved_chunks": [...],
    "metrics": {
      "retrieval_time_ms": 245,
      "generation_time_ms": 1823,
      "total_time_ms": 2068
    }
  }
}
```

### POST /api/rag/retrieve

Retrieve chunks without generation (for debugging).

**Request:**
```json
{
  "query": "quadratic formula",
  "top_k": 5,
  "subject": "Maths"
}
```

### POST /api/documents/ingest

Ingest a single document.

**Request:**
```json
{
  "file_path": "KS3 Math/algebra-basics.pdf",
  "subject": "Maths",
  "key_stage": "KS4"
}
```

### POST /api/documents/ingest-all

Ingest all documents from `backend/data`.

## Core Services

### QdrantService

Location: `backend/src/services/qdrant.service.ts`

**Methods:**
- `initializeCollection()` - Create Qdrant collection with indexes
- `upsertVectors(vectors, payloads)` - Store embeddings
- `search(queryVector, options)` - Search with filtering
- `getVectorCount()` - Get total vectors in collection

### EmbeddingService

Location: `backend/src/services/embedding.service.ts`

**Methods:**
- `chunkText(text, metadata)` - Split text into chunks
- `embedAndStore(chunks)` - Generate embeddings and store
- `embedQuery(query)` - Embed user question

### GeminiService

Location: `backend/src/services/gemini.service.ts`

**Methods:**
- `generateTeacherResponse(question, context, sources)` - Generate structured response
- `generateDailyLesson(topic, subject)` - Generate 7-slide lesson
- `generateSimpleResponse(message)` - Generate without retrieval

### RAGService

Location: `backend/src/services/rag.service.ts`

**Methods:**
- `executeRAG(query)` - Complete RAG pipeline
- `retrieveOnly(query, options)` - Retrieve without generation
- `generateDailyLesson(topic, subject)` - Generate lesson
- `checkRetrievalQuality(chunks)` - Monitor retrieval quality

## Chunking Strategy

### Hierarchical Chunking

```
Document
├── Chapter (metadata)
│   ├── Section (chunk boundary)
│   │   ├── Subsection (chunk if < 500 tokens)
│   │   └── Subsection (chunk)
│   └── Section (chunk boundary)
```

### Configuration

```typescript
chunkSize: 500 tokens
chunkOverlap: 50 tokens
separators: ['\n## ', '\n### ', '\n\n', '\n', ' ']
```

### Metadata Preservation

Each chunk includes:
- `subject`: Maths, Biology, Chemistry, Physics
- `key_stage`: KS1-KS5
- `topic`: Extracted from filename/path
- `source_file`: Original filename
- `document_id`: Unique document identifier
- `chunk_index`: Position in document (0-indexed)
- `section_title`: Section/chapter title
- `content_type`: explanation, example, definition, formula

## Anti-Hallucination Measures

### 1. Retrieval-First Policy

- No response generated without retrieval
- Empty retrieval triggers "I cannot find..." response

### 2. Confidence Scoring

```typescript
if (averageSimilarity < 0.7) confidence = 0.3
if (context.length < 200) confidence = 0.6
if (uncertainty_phrases_detected) confidence = 0.3
```

### 3. Source Citation

Every factual claim must link to retrieved source:
```
[Source: algebra-basics.pdf | Maths | KS4]
```

### 4. Low-Confidence Flagging

Responses include flags:
- `LOW_CONFIDENCE`: Average similarity < 0.7
- `NO_RETRIEVAL`: No chunks retrieved

## Performance Optimization

### Caching

```typescript
// Cache frequent queries
const cache = new Map<string, RAGResult>();
```

### Hybrid Search

Combine semantic + keyword search for mathematical notation:

```typescript
filter: {
  must: [
    { key: 'subject', match: { value: 'Maths' } }
  ]
}
```

### Batch Processing

```typescript
// Process documents in batches of 64
const BATCH_SIZE = 64;
```

## Monitoring

### Key Metrics

- **Retrieval Latency**: Target < 2s (p95)
- **Generation Time**: Target < 3s (p95)
- **Retrieval Precision**: Target > 85%
- **Confidence Score**: Track distribution

### Logging

All RAG operations logged with Winston:
```
[RAG] Executing RAG for question: What is the quadratic formula?...
[RAG] Retrieval completed in 245ms, found 5 chunks
[RAG] Generation completed in 1823ms
```

## Troubleshooting

### Issue: No Retrieval Results

**Causes:**
- Documents not ingested
- Score threshold too high
- Subject filter mismatch

**Solutions:**
1. Run `npm run rag:ingest`
2. Lower `scoreThreshold` from 0.7 to 0.5
3. Check subject metadata matches query filter

### Issue: High Latency

**Causes:**
- Qdrant not indexed properly
- Large chunk sizes
- Network latency

**Solutions:**
1. Verify payload indexes exist (subject, key_stage, topic)
2. Reduce chunk size from 500 to 300 tokens
3. Use local Qdrant instance

### Issue: Poor Response Quality

**Causes:**
- Insufficient retrieval context
- Weak embedding model
- Gemini prompt not optimized

**Solutions:**
1. Increase `top_k` from 5 to 10
2. Use `text-embedding-3-large` for better accuracy
3. Refine teacher persona in prompt

## Security Considerations

### API Key Management

- Store keys in `.env` only (never commit)
- Never expose to frontend
- Rotate keys periodically

### Input Sanitization

```typescript
// Remove prompt injection attempts
query = query.replace(/(IGNORE|SYSTEM|INSTRUCT)/gi, '');
```

### Rate Limiting

Implement rate limiting for production:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Next Steps

1. **Daily Lesson Scheduler**: Implement cron job for daily lesson generation
2. **Chat Context Memory**: Add conversation history to RAG
3. **Avatar Integration**: Connect responses to teacher avatar
4. **Progress Tracking**: Store student interactions in database
5. **Advanced Caching**: Implement Redis for query caching

## References

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [LangChain.js](https://js.langchain.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
