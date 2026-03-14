# Frontend Configuration for Express Backend

## ✅ What Was Done

### 1. API Client Updated (`frontend/src/lib/api.ts`)

The API client has been updated to:

- **Dynamic Base URL**: Uses `process.env.NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:5000`)
- **Response Format Handling**: Automatically handles Express response format `{ success: true, data: {...} }`
- **Authentication Support**: Includes `getAuthToken()` function for Clerk JWT tokens
- **Auth Fetch Helper**: `fetchWithAuth()` for authenticated requests

### 2. Environment Configuration

**Updated**: `frontend/.env.local.example`

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_api_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 3. Backend Switcher Script

Created: `backend-express/switch-backend.js`

Quickly switch between Express and Python backends:

```bash
# Check current backend
node backend-express/switch-backend.js status

# Switch to Express
node backend-express/switch-backend.js express

# Switch to Python
node backend-express/switch-backend.js python
```

## 🚀 How to Use

### Option 1: Manual Configuration

1. **Create/Edit** `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

2. **Restart Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Option 2: Use Switcher Script

```bash
# Switch to Express backend
node backend-express/switch-backend.js express

# Restart frontend
cd frontend
npm run dev
```

## 📊 API Compatibility

### Endpoints That Work Immediately

These endpoints work with **both** backends without frontend changes:

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/api/teaching/start` | Start teaching session | ✅ |
| `/api/teaching/message` | Process student message | ✅ |
| `/api/teaching/error/analyze` | Analyze maths errors | ✅ |
| `/api/teaching/curriculum/topics` | Get topics | ✅ |
| `/api/dashboard/:id` | Dashboard data | ✅ |
| `/api/progress/:id` | Progress tracking | ✅ |
| `/api/daily-missions/:id` | Daily missions | ✅ |
| `/api/chatbot/message` | Chatbot | ✅ |
| `/api/tutor/chat/message` | Tutor chat | ✅ |

### Response Format Handling

The API client automatically handles both response formats:

**Python Response**:
```json
{
  "session_id": "abc123",
  "message": "Hello"
}
```

**Express Response**:
```json
{
  "success": true,
  "data": {
    "session_id": "abc123",
    "message": "Hello"
  }
}
```

Both work seamlessly - the client extracts the data automatically.

## 🔧 Configuration Files

### Frontend Environment

**File**: `frontend/.env.local`

```env
# Use Express backend (port 5000)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Or use Python backend (port 8000)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

ELEVENLABS_API_KEY=your_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Express Backend Environment

**File**: `backend-express/.env`

```env
PORT=5000
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
JWT_SECRET=your_secret
```

## 🧪 Testing

### 1. Test Backend Connection

```bash
curl http://localhost:5000/health
# Expected: {"status":"healthy"}
```

### 2. Test Frontend Connection

With both servers running:

1. Open `http://localhost:3000`
2. Open browser DevTools → Console
3. Check for any API errors
4. Navigate to dashboard - should load data

### 3. Test API Call

In browser console (on your frontend):

```javascript
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
```

## 🔄 Switching Backends

### Quick Switch

```bash
# To Express
node backend-express/switch-backend.js express

# To Python  
node backend-express/switch-backend.js python
```

### Manual Switch

Edit `frontend/.env.local`:

```env
# Express
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Python
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then restart frontend.

## ⚠️ Important Notes

### 1. No .env.local Changes

The `.env.local` file is **gitignored** and contains your personal credentials. You need to create/edit it manually.

### 2. Restart Required

After changing `NEXT_PUBLIC_API_BASE_URL`, you **must restart** the frontend:

```bash
# Stop (Ctrl+C)
# Then restart
npm run dev
```

### 3. CORS Configuration

If you get CORS errors, ensure the Express backend includes your frontend URL:

**File**: `backend-express/src/config/cors.ts`

```typescript
export const corsOptions: CorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  // ...
};
```

## 📝 What Changed in Frontend

### Modified Files

1. **`frontend/src/lib/api.ts`**
   - Changed base URL to use environment variable
   - Added response format handling for Express
   - Added authentication helper functions

2. **`frontend/.env.local.example`**
   - Added `NEXT_PUBLIC_API_BASE_URL`
   - Updated comments for backend switching

### No Changes Needed

These files work as-is:

- All React components
- All page files
- All hooks
- All other lib files

## 🎯 Quick Start Checklist

- [ ] Express backend installed (`cd backend-express && npm install`)
- [ ] Express backend configured (`backend-express/.env` created)
- [ ] Frontend `.env.local` created with `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`
- [ ] Start Express backend: `cd backend-express && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Test health: `http://localhost:5000/health`
- [ ] Open frontend: `http://localhost:3000`
- [ ] Check browser console for errors
- [ ] Test a feature (dashboard, tutor, etc.)

## 🐛 Troubleshooting

### "Connection Refused"

**Problem**: Frontend can't connect to backend

**Solution**:
1. Check backend is running: `http://localhost:5000/health`
2. Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Restart frontend after changing URL

### CORS Errors

**Problem**: Browser blocks requests

**Solution**:
1. Check backend CORS config in `src/config/cors.ts`
2. Ensure frontend URL is in allowed origins
3. Restart backend after changes

### 401 Unauthorized

**Problem**: API calls fail with authentication error

**Solution**:
1. Verify Clerk is configured in frontend
2. Check `CLERK_SECRET_KEY` in backend `.env`
3. Ensure user is logged in

### Wrong Data Format

**Problem**: Frontend expects different data structure

**Solution**:
1. Check API response in Network tab
2. Verify backend returns `{ success: true, data: {...} }`
3. Update component to handle new format if needed

## 📚 Documentation

- **Backend README**: `backend-express/README.md`
- **Quick Start**: `backend-express/QUICKSTART.md`
- **Migration Guide**: `backend-express/MIGRATION_GUIDE.md`
- **Frontend Integration**: `backend-express/FRONTEND_INTEGRATION.md`
- **Architecture**: `backend-express/ARCHITECTURE.md`

## ✅ Success Indicators

You've successfully configured the frontend when:

- ✅ No console errors on page load
- ✅ Dashboard loads with data
- ✅ Can start teaching sessions
- ✅ Can send/receive messages
- ✅ Progress data displays
- ✅ No CORS errors
- ✅ Authentication works

---

**Status**: Frontend configured for Express backend
**Date**: 2026-03-02
**Version**: 2.0.0
