# Frontend API URL Migration Guide

## Overview

This guide helps you migrate all hardcoded `localhost:8000` references to use the environment variable `NEXT_PUBLIC_API_BASE_URL` for easy switching between Express (port 5000) and Python (port 8000) backends.

## Files That Need Updating

### ✅ Already Updated
1. `src/lib/api.ts` - Uses `process.env.NEXT_PUBLIC_API_BASE_URL`
2. `src/components/MasteryTrackingPanel.tsx` - Updated
3. `src/components/ErrorAnalysisDisplay.tsx` - Updated
4. `src/lib/api-config.ts` - New centralized config created

### ⚠️ Need Manual Updates

| File | Hardcoded URLs | Lines | Priority |
|------|---------------|-------|----------|
| `src/app/dashboard/page.tsx` | 4 | 158, 182, 191, 205 | 🔴 High |
| `src/app/tutor/page.tsx` | 2 | 116, 620 | 🔴 High |
| `src/app/teacher/page.tsx` | 3 | 73, 91, 98 | 🔴 High |
| `src/components/WorkingUpload.tsx` | 2 | 145, 163 | 🟡 Medium |
| `src/components/RAGTutorPage.tsx` | 2 | 86, 132 | 🟡 Medium |
| `src/components/RAGPoweredTutorPage.tsx` | 4 | 93, 116, 132, 170, 228 | 🟡 Medium |
| `src/components/ProgressDashboard.tsx` | 1 | 71 | 🟡 Medium |
| `src/components/TopicSearch.tsx` | 1 | 69 | 🟢 Low |
| `src/lib/backendAuth.ts` | 1 | 35 | 🟡 Medium |

## Quick Fix Pattern

Replace this:
```typescript
const response = await fetch('http://localhost:8000/api/endpoint');
```

With this:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const response = await fetch(`${API_BASE_URL}/api/endpoint`);
```

Or use the new config:
```typescript
import { getApiUrl } from '@/lib/api-config';
const response = await fetch(getApiUrl('/api/endpoint'));
```

## Step-by-Step Updates

### 1. Dashboard Page (`src/app/dashboard/page.tsx`)

**Find** (line 158):
```typescript
`http://localhost:8000/api/unified/dashboard/${user.id}`
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/unified/dashboard/${user.id}`
```

**Repeat for lines**: 182, 191, 205

### 2. Tutor Page (`src/app/tutor/page.tsx`)

**Find** (line 116):
```typescript
`http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}`
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/teaching/curriculum/topics?subject=${subject}`
```

**Find** (line 620):
```typescript
'http://localhost:8000/api/chat/send'
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/chat/send`
```

### 3. Teacher Page (`src/app/teacher/page.tsx`)

**Find** (line 73):
```typescript
'http://localhost:8000/api/teacher/class/main/progress'
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/teacher/class/main/progress`
```

**Repeat for lines**: 91, 98

### 4. WorkingUpload Component (`src/components/WorkingUpload.tsx`)

**Find** (lines 145, 163):
```typescript
'http://localhost:8000/api/analyse/working/upload'
'http://localhost:8000/api/analyse/working/text'
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/analyse/working/upload`
`${API_BASE_URL}/api/analyse/working/text`
```

### 5. RAGTutorPage (`src/components/RAGTutorPage.tsx`)

**Find** (lines 86, 132):
```typescript
'http://localhost:8000/api/rag-chat/start'
'http://localhost:8000/api/rag-chat/send'
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/rag-chat/start`
`${API_BASE_URL}/api/rag-chat/send`
```

### 6. RAGPoweredTutorPage (`src/components/RAGPoweredTutorPage.tsx`)

**Find** (lines 93, 116, 132, 170, 228):
```typescript
'http://localhost:8000/api/teaching/curriculum/topics'
`http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}`
`http://localhost:8000/api/teaching/curriculum/topics?subject=${subject}&year_group=${year}`
'http://localhost:8000/api/rag-chat/start'
'http://localhost:8000/api/rag-chat/send'
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/teaching/curriculum/topics`
`${API_BASE_URL}/api/teaching/curriculum/topics?subject=${subject}`
`${API_BASE_URL}/api/teaching/curriculum/topics?subject=${subject}&year_group=${year}`
`${API_BASE_URL}/api/rag-chat/start`
`${API_BASE_URL}/api/rag-chat/send`
```

### 7. ProgressDashboard (`src/components/ProgressDashboard.tsx`)

**Find** (line 71):
```typescript
`http://localhost:8000/api/progress/${studentId}/dashboard`
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/progress/${studentId}/dashboard`
```

### 8. TopicSearch (`src/components/TopicSearch.tsx`)

**Find** (line 69):
```typescript
`http://localhost:8000/api/teaching/topics/search?query=${encodeURIComponent(query)}&subject=${filterSubject !== 'all' ? filterSubject : ''}&year_level=${filterYear !== 'all' ? filterYear : ''}`
```

**Replace with**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
`${API_BASE_URL}/api/teaching/topics/search?query=${encodeURIComponent(query)}&subject=${filterSubject !== 'all' ? filterSubject : ''}&year_level=${filterYear !== 'all' ? filterYear : ''}`
```

### 9. backendAuth (`src/lib/backendAuth.ts`)

**Find** (line 35):
```typescript
this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
```

**Replace with**:
```typescript
this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
```

## Automated Migration Script

For advanced users, here's a Node.js script to automate the migration:

```javascript
// migrate-urls.js
const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/dashboard/page.tsx',
  'src/app/tutor/page.tsx',
  'src/app/teacher/page.tsx',
  'src/components/WorkingUpload.tsx',
  'src/components/RAGTutorPage.tsx',
  'src/components/RAGPoweredTutorPage.tsx',
  'src/components/ProgressDashboard.tsx',
  'src/components/TopicSearch.tsx',
  'src/lib/backendAuth.ts',
];

const frontendDir = path.join(__dirname, '..', 'frontend');

filesToUpdate.forEach(file => {
  const filePath = path.join(frontendDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace hardcoded localhost:8000 with env variable
  content = content.replace(
    /http:\/\/localhost:8000/g,
    '${API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}'
  );
  
  // Add API_BASE_URL constant at the top of component functions if not present
  if (content.includes('http://localhost:5000') || content.includes('localhost:8000')) {
    const functionMatch = content.match(/(export default function \w+\([^)]*\) \{)/);
    if (functionMatch && !content.includes('const API_BASE_URL')) {
      const insertPos = functionMatch.index + functionMatch[0].length;
      content = content.slice(0, insertPos) + 
        '\n  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || \'http://localhost:5000\';' +
        content.slice(insertPos);
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated: ${file}`);
});

console.log('\n✅ Migration complete!');
```

Run with:
```bash
node migrate-urls.js
```

## Testing After Migration

1. **Create `.env.local`**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

2. **Start Express Backend**:
   ```bash
   cd backend-express
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Each Page**:
   - Dashboard: `http://localhost:3000/dashboard`
   - Tutor: `http://localhost:3000/tutor`
   - Teacher: `http://localhost:3000/teacher`
   - Progress: `http://localhost:3000/progress`

5. **Check Console**: No connection errors should appear

## Switching Backends

To switch back to Python backend:

```env
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then restart frontend.

## Verification Checklist

- [ ] All `localhost:8000` references replaced
- [ ] `NEXT_PUBLIC_API_BASE_URL` added to `.env.local`
- [ ] Frontend starts without errors
- [ ] Dashboard page loads data
- [ ] Tutor page connects to backend
- [ ] Teacher page shows data
- [ ] No console errors about connections
- [ ] Can switch between Express and Python backends

## Common Issues

### Issue: "API_BASE_URL is not defined"
**Solution**: Add the constant at the top of the component function:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
```

### Issue: "Environment variable not defined"
**Solution**: Create `frontend/.env.local` with:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Issue: "CORS errors after migration"
**Solution**: Restart both frontend and backend after changes

## Summary

- **Total Files**: 9
- **Total Replacements**: ~20
- **Time Required**: 15-30 minutes
- **Priority**: High (blocks Express backend usage)

---

**Status**: Partially Complete (3/9 files updated)
**Next Action**: Update remaining 6 files manually or with script
