# Frontend to Express Backend Integration Guide

## Overview

This guide explains how to configure the frontend to use the new Express.js backend instead of the Python FastAPI backend.

## Quick Configuration

### 1. Update Environment Variables

**File**: `frontend/.env.local` (create if doesn't exist)

```env
# Use Express.js backend (port 5000)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Python backend would be:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. API Client Already Updated

The `frontend/src/lib/api.ts` file has been updated to:
- Use `process.env.NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:5000`)
- Handle Express response format: `{ success: true, data: {...} }`
- Include authentication token handling for Clerk

## API Endpoint Mapping

The Express backend uses the same endpoint paths as Python, so **no frontend code changes are needed** for most API calls.

| Feature | Endpoint | Backend |
|---------|----------|---------|
| Dashboard | `/api/unified/dashboard/:id` | ✅ Both |
| Teaching Start | `/api/teaching/start` | ✅ Both |
| Teaching Message | `/api/teaching/message` | ✅ Both |
| Error Analysis | `/api/teaching/error/analyze` | ✅ Both |
| Progress | `/api/progress/:id` | ✅ Express only |
| Daily Missions | `/api/daily-missions/:id` | ✅ Express only |

## Response Format Differences

### Python FastAPI Response
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Express.js Response
```json
{
  "success": true,
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

The `api.ts` client automatically handles both formats by extracting the `data` field.

## Starting Both Servers

### Terminal 1: Express Backend
```bash
cd backend-express
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## Testing the Connection

### 1. Test Health Endpoint

Open browser: `http://localhost:5000/health`

Expected response:
```json
{"status":"healthy"}
```

### 2. Test Frontend Connection

With both servers running, open `http://localhost:3000` and check browser console for any API errors.

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check Express backend `src/config/cors.ts` includes your frontend URL:
```typescript
export const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  // ...
};
```

2. Restart the Express backend after changes.

### Authentication Errors

If API calls fail with 401 Unauthorized:

1. Ensure Clerk is properly configured in both frontend and backend
2. Check `CLERK_SECRET_KEY` in `backend-express/.env`
3. Verify frontend can get JWT tokens from Clerk

### Connection Refused

If you see "Connection refused" errors:

1. Verify Express backend is running: `http://localhost:5000/health`
2. Check `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`
3. Ensure no firewall is blocking port 5000

## Switching Between Backends

### Use Express Backend
```env
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Use Python Backend
```env
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

After changing, restart the frontend:
```bash
# Stop frontend (Ctrl+C)
npm run dev
```

## Feature Compatibility

### ✅ Fully Compatible Features

These work with the Express backend:

- Dashboard data retrieval
- Teaching session management
- Student message processing
- Progress tracking
- Daily missions
- Chatbot interactions
- Tutor chat

### ⚠️ Partially Compatible Features

These need services layer implementation:

- AI-powered responses (needs AIService)
- RAG-based answers (needs RetrievalService)
- Maths error detection (needs MathsErrorEngine)
- Adaptive learning (needs PersonalizationEngine)

For these features, the Express backend returns placeholder responses until the services are implemented.

## API Client Usage Examples

### Get Dashboard Data

```typescript
import { getDashboardData } from '@/lib/api';

const { data, error } = await getDashboardData('student_123');

if (data) {
  console.log('Dashboard:', data);
}
```

### Start Teaching Session

```typescript
import { startTeachingSession } from '@/lib/api';

const { data, error } = await startTeachingSession({
  student_id: 'student_123',
  topic_id: 'maths_y7_algebra_basics',
  topic_name: 'Algebra Basics',
  year_group: '7',
  subject: 'maths',
});

if (data) {
  console.log('Session started:', data.session_id);
}
```

### Process Student Message

```typescript
import { processStudentMessage } from '@/lib/api';

const { data, error } = await processStudentMessage({
  student_id: 'student_123',
  session_id: 'session_123',
  message: 'I don\'t understand this step',
  topic_id: 'maths_y7_algebra_basics',
});

if (data) {
  console.log('AI Response:', data.message);
  console.log('Board Text:', data.board_text);
}
```

## Environment Variables Reference

### Frontend (.env.local)

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ElevenLabs (for voice)
ELEVENLABS_API_KEY=...
```

### Express Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://...

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...

# JWT
JWT_SECRET=your_secret_key
```

## Migration Checklist

- [ ] Express backend installed (`npm install`)
- [ ] Express backend configured (`.env` created)
- [ ] Frontend `.env.local` updated with `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`
- [ ] Express backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Health check passes (`http://localhost:5000/health`)
- [ ] Frontend can load dashboard
- [ ] Teaching sessions can start
- [ ] Messages can be sent
- [ ] No CORS errors in console

## Next Steps

1. **Test Core Features**: Verify dashboard, teaching, and chatbot work
2. **Implement Services**: Port Python services to TypeScript
3. **Add AI Integration**: Connect Vertex AI or other AI services
4. **Write Tests**: Add integration tests for API calls
5. **Deploy**: Set up production environment

## Support

For issues:
1. Check backend logs in `backend-express/logs/`
2. Check browser console for frontend errors
3. Review API endpoint documentation in `backend-express/README.md`
4. Verify environment variables are correct

---

**Status**: Frontend configured for Express backend
**Date**: 2026-03-02
