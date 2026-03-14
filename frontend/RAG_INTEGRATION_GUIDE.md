# RAG Frontend Integration Guide

## Overview

Your AI Tutor frontend now displays content from your uploaded educational documents (`backend/data` folder) using the RAG (Retrieval-Augmented Generation) system.

## What's Been Integrated

### 1. Tutor Page (`/tutor`)

**Changes Made:**
- Updated `sendToAI()` function to use `/api/rag/ask` endpoint
- Responses now come from your uploaded documents (PDFs, DOCX, PPTX in `backend/data`)
- Shows source citations when answering questions
- Displays confidence indicators for low-retrieval answers
- Falls back to regular tutor chat if RAG fails

**Features:**
- ✅ Document-based answers (not generic AI responses)
- ✅ Source citations (shows which file the answer came from)
- ✅ Confidence warnings (if retrieval is weak)
- ✅ Conversation context (remembers last 5 messages)
- ✅ Subject filtering (Maths, Biology, Chemistry, Physics)

### 2. Dashboard Page (`/dashboard`)

**Changes Made:**
- Added "Today's Lesson - From Your Documents" section
- Fetches daily lesson from RAG system
- Displays lesson slides generated from uploaded content
- Shows lesson completion status

**Features:**
- ✅ Daily lesson from uploaded documents
- ✅ Slide preview (shows first 4 slides)
- ✅ Quick start button to tutor page
- ✅ Loading states and error handling

### 3. RAG Service (`frontend/src/services/ragService.ts`)

**New Functions:**
- `askRAGQuestion()` - Ask questions, get document-based answers
- `generateDailyLesson()` - Generate lesson from documents
- `getDailyLesson()` - Get today's lesson
- `retrieveChunks()` - Debug/retrieve document chunks

## Setup Instructions

### Step 1: Start Qdrant (Vector Database)

```bash
docker run -d \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  --name ai-tutor-qdrant \
  qdrant/qdrant
```

**Verify Qdrant is running:**
```bash
curl http://localhost:6333/
# Should return: {"title":"qdrant - vector search engine"}
```

### Step 2: Add API Keys to Backend

Edit `backend/.env`:

```env
# Required for RAG
GOOGLE_GEMINI_API_KEY=AIzaSy...your_key_here
OPENAI_API_KEY=sk-...your_key_here

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=ai-tutor-embeddings
```

### Step 3: Initialize Qdrant Collection

```bash
cd backend
npm run rag:init
```

**Expected output:**
```
Initializing Qdrant collection...
Collection 'ai-tutor-embeddings' created successfully
Payload indexes created successfully
```

### Step 4: Ingest Your Educational Documents

Place your files in `backend/data`:

```
backend/data/
├── KS3 Math/
│   ├── algebra-basics.pdf
│   └── equations.pdf
├── KS4 Biology/
│   ├── cell-division.docx
│   └── photosynthesis.pdf
└── KS4 Chemistry/
    └── periodic-table.pptx
```

**Run ingestion:**
```bash
cd backend
npm run rag:ingest
```

**Expected output:**
```
Found 5 documents to process

Processing: algebra-basics.pdf
  Subject: Maths, Key Stage: KS3, Topic: Algebra Basics
  ✓ Created 12 chunks

Processing: cell-division.docx
  Subject: Biology, Key Stage: KS4, Topic: Cell Division
  ✓ Created 8 chunks

...

Total vectors in Qdrant: 45
```

### Step 5: Start Backend Server

```bash
cd backend
npm run dev
```

Backend should be running on `http://localhost:5000`

### Step 6: Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend should be running on `http://localhost:3000`

### Step 7: Test RAG Integration

1. **Go to Dashboard** (`http://localhost:3000/dashboard`)
   - You should see "Today's Lesson - From Your Documents" section
   - If lesson exists, it will show slides from your documents

2. **Go to Tutor Page** (`http://localhost:3000/tutor?type=maths`)
   - Select a topic (e.g., "Algebra", "Equations")
   - Ask a question like "What is the quadratic formula?"
   - Response should include:
     - Answer from your uploaded documents
     - Source citation (e.g., "📚 Sources: algebra-basics.pdf")
     - Structured format (Introduction, Explanation, Examples, Summary)

## Testing Examples

### Example 1: Maths Question

**Upload:** `algebra-basics.pdf` containing quadratic formula

**Ask:** "What is the quadratic formula?"

**Expected Response:**
```
**The quadratic formula is used to solve equations of the form ax² + bx + c = 0.**

The formula is: x = (-b ± √(b² - 4ac)) / 2a

**Examples:**
Solve: 2x² + 5x - 3 = 0
a=2, b=5, c=-3
x = (-5 ± √(25 + 24)) / 4
x = (-5 ± 7) / 4
x = 0.5 or x = -3

**Summary:**
- Use quadratic formula for ax² + bx + c = 0
- Formula: x = (-b ± √(b² - 4ac)) / 2a
- Always check your solutions

📚 **Sources:** algebra-basics.pdf
```

### Example 2: Biology Question

**Upload:** `cell-division.docx` containing mitosis information

**Ask:** "What are the stages of mitosis?"

**Expected Response:**
```
**Mitosis has 4 main stages: Prophase, Metaphase, Anaphase, and Telophase.**

**Prophase:** Chromosomes condense, nuclear envelope breaks down
**Metaphase:** Chromosomes align at the equator
**Anaphase:** Sister chromatids separate
**Telophase:** New nuclei form

**Examples:**
In animal cells, mitosis occurs in...

**Summary:**
- PMAT: Prophase → Metaphase → Anaphase → Telophase
- Produces 2 identical daughter cells
- Used for growth and repair

📚 **Sources:** cell-division.docx
```

## Troubleshooting

### Issue: "No lesson generated yet from your uploaded documents"

**Cause:** Documents not ingested or daily lesson not generated

**Solution:**
1. Run `npm run rag:ingest` in backend folder
2. Start a lesson in tutor page (this triggers lesson generation)
3. Refresh dashboard

### Issue: Tutor responses don't show sources

**Cause:** Retrieval not finding documents or API not called

**Solution:**
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:5000/health`
3. Check Qdrant has vectors: `curl http://localhost:6333/collections/ai-tutor-embeddings`
4. Verify documents were ingested (check backend logs)

### Issue: "RAG API error: 404"

**Cause:** Backend endpoint not available

**Solution:**
1. Make sure backend is running (`npm run dev`)
2. Check `backend/src/api/rag.routes.ts` exists
3. Verify `backend/src/main.ts` includes: `app.use('/api/rag', ragRoutes)`

### Issue: Low confidence warnings

**Cause:** Retrieval similarity below 0.7 threshold

**Solution:**
1. Ingest more documents on the topic
2. Rephrase question to match document language
3. Lower threshold in `backend/src/services/qdrant.service.ts` (change `scoreThreshold` from 0.7 to 0.5)

## Architecture Flow

```
Student asks question
    ↓
Frontend (/tutor page)
    ↓
POST /api/rag/ask
    ↓
Backend RAG Service
    ↓
1. Embed question → OpenAI embeddings
2. Search Qdrant → Find similar chunks from YOUR documents
3. Build prompt → Add retrieved context
4. Generate response → Google Gemini
    ↓
Return structured answer with sources
    ↓
Display in chat with citations
```

## Next Steps

### Phase 1: Test Basic Integration
- [ ] Start Qdrant
- [ ] Add API keys
- [ ] Ingest documents
- [ ] Test tutor page questions
- [ ] Verify source citations appear

### Phase 2: Daily Lessons
- [ ] Generate first daily lesson
- [ ] Check dashboard displays lesson
- [ ] View slides in tutor page
- [ ] Complete lesson and see status update

### Phase 3: Advanced Features
- [ ] Add conversation memory (chat history)
- [ ] Implement subject filtering
- [ ] Add confidence indicators
- [ ] Show retrieval quality metrics

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rag/ask` | POST | Ask question, get document-based answer |
| `/api/rag/retrieve` | POST | Debug: retrieve chunks without generation |
| `/api/lessons/daily` | POST | Generate daily lesson from documents |
| `/api/lessons/daily` | GET | Get today's lesson for student |

## File Locations

```
frontend/
├── src/
│   ├── app/
│   │   ├── tutor/
│   │   │   └── page.tsx          # Updated with RAG integration
│   │   └── dashboard/
│   │       └── page.tsx          # Updated with RAG lesson card
│   └── services/
│       └── ragService.ts          # New RAG API client

backend/
├── src/
│   ├── services/
│   │   ├── qdrant.service.ts     # Vector database operations
│   │   ├── embedding.service.ts  # Text chunking & embeddings
│   │   ├── gemini.service.ts     # Google Gemini integration
│   │   └── rag.service.ts        # Complete RAG pipeline
│   └── api/
│       ├── rag.routes.ts          # /api/rag/* endpoints
│       └── document.routes.ts     # /api/documents/* endpoints
```

## Support

For issues or questions:
1. Check backend logs: `backend/logs/combined.log`
2. Check browser console for frontend errors
3. Test RAG pipeline: `npm run rag:test` (in backend folder)
4. Verify Qdrant has vectors: Check dashboard at `http://localhost:6333/dashboard`
