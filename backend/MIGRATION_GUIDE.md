# Python to Express Backend Migration Guide

## Overview

This document describes the migration of the SGA AI Tutor backend from Python FastAPI to Express.js with TypeScript.

## Architecture Comparison

### Python FastAPI Stack
- **Framework**: FastAPI with Uvicorn
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Auth**: python-jose, passlib
- **AI**: Google Vertex AI SDK
- **Database**: PostgreSQL (Neon)

### Express.js Stack
- **Framework**: Express.js with TypeScript
- **ORM**: TypeORM
- **Validation**: TypeScript interfaces, express-validator
- **Auth**: @clerk/express, jsonwebtoken
- **AI**: To be implemented (Vertex AI REST API)
- **Database**: PostgreSQL (Neon)

## Migration Status

### ✅ Completed

1. **Project Structure**
   - Express.js application with TypeScript
   - Organized directory structure (api, models, services, middleware, config)
   - npm scripts for development and production

2. **Database Layer**
   - TypeORM configuration with Neon PostgreSQL
   - Connection pooling optimized for serverless
   - Graceful shutdown handling

3. **Models (7 entities)**
   - `User` - User authentication data
   - `StudentProfile` - Student information
   - `TopicMastery` - Progress tracking
   - `CurriculumTopic` - Curriculum content
   - `TeachingSession` - Teaching sessions
   - `LearningSession` - Practice sessions
   - `ChatSession` & `ChatMessage` - Chat history

4. **Middleware**
   - Clerk JWT authentication (`verifyClerkAuth`)
   - Optional authentication (`optionalAuth`)
   - Global error handling
   - CORS configuration
   - Morgan HTTP logging

5. **API Routes (7 modules)**
   - **Auth**: `/auth/me`, `/auth/verify`
   - **Teaching**: `/api/teaching/*` (6 endpoints)
   - **Dashboard**: `/api/dashboard/*` (3 endpoints)
   - **Chatbot**: `/api/chatbot/*` (3 endpoints)
   - **Tutor Chat**: `/api/tutor/chat/*` (3 endpoints)
   - **Progress**: `/api/progress/*` (4 endpoints)
   - **Daily Missions**: `/api/daily-missions/*` (3 endpoints)

6. **Configuration**
   - Environment variables (.env)
   - Winston logger with file output
   - CORS for frontend integration
   - TypeScript configuration

7. **Scripts**
   - Database migration (`npm run db:migrate`)
   - Database seeding (`npm run db:seed`)

### 🚧 In Progress / TODO

1. **Services Layer** (Critical)
   - [ ] `AIService` - AI model integration
   - [ ] `UnifiedTeachingService` - Teaching orchestration
   - [ ] `MasteryTrackingEngine` - Progress tracking
   - [ ] `MathsErrorEngine` - Error analysis
   - [ ] `RetrievalService` - RAG system
   - [ ] `SafeguardingLayer` - Safety checks
   - [ ] `CurriculumLockEnforcer` - Curriculum validation
   - [ ] `TeachingFlowEngine` - Teaching flow
   - [ ] `DashboardService` - Dashboard data aggregation
   - [ ] `VoiceService` - Voice synthesis (Edge TTS)
   - [ ] `AvatarService` - Avatar control
   - [ ] `ExamIntegrityGuard` - Anti-cheating
   - [ ] `PersonalizationEngine` - Adaptive learning

2. **AI Integration**
   - [ ] Vertex AI REST API client
   - [ ] RAG (Retrieval Augmented Generation)
   - [ ] Curriculum-aligned response generation
   - [ ] Error detection and remediation
   - [ ] Analogy generation

3. **Advanced Features**
   - [ ] WebSocket support for real-time updates
   - [ ] Voice synthesis (Edge TTS)
   - [ ] Avatar animation control
   - [ ] File upload for homework photos
   - [ ] PDF processing

4. **Testing**
   - [ ] Unit tests (Jest)
   - [ ] Integration tests
   - [ ] API endpoint tests
   - [ ] Load testing

5. **Production Readiness**
   - [ ] API rate limiting
   - [ ] Request validation
   - [ ] API documentation (Swagger/OpenAPI)
   - [ ] Health checks
   - [ ] Monitoring and alerting
   - [ ] CI/CD pipeline

## Code Migration Examples

### 1. Route Handler

**Python FastAPI:**
```python
@router.post("/start", response_model=StartTeachingResponse)
async def start_teaching_session(
    request: StartTeachingRequest,
    db: Session = Depends(get_db),
):
    session_id = f"session_{request.student_id}_{request.topic_id}"
    result = service.start_teaching_session(...)
    return StartTeachingResponse(**result)
```

**Express.js TypeScript:**
```typescript
router.post(
  '/start',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { student_id, topic_id, topic_name } = req.body;
    const session_id = `session_${student_id}_${topic_id}`;
    const result = await service.startTeachingSession(...);
    res.json({ success: true, data: result });
  })
);
```

### 2. Database Model

**Python SQLAlchemy:**
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    year_group = Column(Integer, default=5)
```

**TypeScript TypeORM:**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  @Index()
  email!: string;

  @Column({ nullable: false })
  first_name!: string;

  @Column({ default: 5 })
  year_group!: number;
}
```

### 3. Service Class

**Python:**
```python
class AIService:
    def __init__(self):
        self.curriculum_knowledge = {...}
    
    async def get_curriculum_aligned_response(self, user_message, student_context):
        if self._detect_cheating_attempt(user_message):
            return self._generate_cheating_response()
        # ... logic
```

**TypeScript:**
```typescript
export class AIService {
  private curriculumKnowledge: Record<string, any>;

  constructor() {
    this.curriculumKnowledge = {...};
  }

  async getCurriculumAlignedResponse(
    userMessage: string,
    studentContext: Record<string, any>
  ): Promise<string> {
    if (this.detectCheatingAttempt(userMessage)) {
      return this.generateCheatingResponse();
    }
    // ... logic
  }
}
```

## API Endpoint Mapping

| Python Route | Express Route | Status |
|-------------|---------------|--------|
| `/auth/me` | `GET /auth/me` | ✅ |
| `/api/teaching/start` | `POST /api/teaching/start` | ✅ |
| `/api/teaching/message` | `POST /api/teaching/message` | ✅ |
| `/api/teaching/session/{id}` | `GET /api/teaching/session/:id` | ✅ |
| `/api/teaching/mastery/{id}` | `GET /api/teaching/mastery/:id` | ✅ |
| `/api/teaching/error/analyze` | `POST /api/teaching/error/analyze` | ✅ |
| `/api/teaching/topics/search` | `GET /api/teaching/topics/search` | ✅ |
| `/api/dashboard/{id}` | `GET /api/dashboard/:id` | ✅ |
| `/api/dashboard/recommendations/{id}` | `GET /api/dashboard/recommendations/:id` | ✅ |
| `/api/chatbot/message` | `POST /api/chatbot/message` | ✅ |
| `/api/tutor/chat/message` | `POST /api/tutor/chat/message` | ✅ |
| `/api/progress/{id}` | `GET /api/progress/:id` | ✅ |
| `/api/daily-missions/{id}` | `GET /api/daily-missions/:id` | ✅ |

## Breaking Changes

1. **Authentication Header**
   - Old: Custom token format
   - New: Standard `Authorization: Bearer <jwt_token>`

2. **Response Format**
   - Old: Direct response objects
   - New: Wrapped in `{ success: true, data: {...} }`

3. **Error Responses**
   - Old: FastAPI automatic error format
   - New: Custom `{ success: false, error: { message: "..." } }`

4. **Database Connection**
   - Old: SQLAlchemy session per request
   - New: TypeORM repository pattern

## Environment Variables Migration

| Python (.env) | Express (.env) | Notes |
|--------------|----------------|-------|
| `DATABASE_URL` | `DATABASE_URL` | Same format |
| `CLERK_SECRET_KEY` | `CLERK_SECRET_KEY` | Same |
| `GOOGLE_CLOUD_PROJECT_ID` | `GOOGLE_CLOUD_PROJECT_ID` | Same |
| `JWT_SECRET` | `JWT_SECRET` | Same |
| `PORT` | `PORT` | Default: 5000 (was 8000) |

## Testing Checklist

- [ ] Health check endpoint (`GET /health`)
- [ ] Authentication flow
- [ ] Teaching session creation
- [ ] Message processing
- [ ] Dashboard data retrieval
- [ ] Progress tracking
- [ ] Chatbot interactions
- [ ] Daily missions
- [ ] Error handling
- [ ] Database operations

## Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Seed Data (optional)**
   ```bash
   npm run db:seed
   ```

4. **Start Server**
   ```bash
   npm start
   ```

5. **Verify**
   ```bash
   curl http://localhost:5000/health
   # Expected: {"status":"healthy"}
   ```

## Performance Considerations

1. **Connection Pooling**: Configured for Neon serverless (max 10, min 3)
2. **Caching**: To be implemented (Redis recommended)
3. **Rate Limiting**: To be implemented
4. **Compression**: Consider adding compression middleware
5. **Clustering**: Use PM2 or Node.js cluster module for production

## Security Checklist

- [x] CORS configured
- [x] JWT authentication
- [x] Input validation
- [ ] Rate limiting
- [ ] SQL injection protection (TypeORM provides this)
- [ ] XSS protection
- [ ] Helmet.js security headers
- [ ] Request size limits
- [ ] Environment variable validation

## Next Steps

1. **Immediate**
   - Install dependencies
   - Test database connection
   - Verify API endpoints
   - Update frontend API calls

2. **Short-term**
   - Port critical services (AI, Teaching, Mastery)
   - Implement Vertex AI integration
   - Add comprehensive error handling
   - Write unit tests

3. **Long-term**
   - Add WebSocket support
   - Implement caching
   - Set up monitoring
   - Optimize performance
   - Add API documentation

## Support & Resources

- **Express.js Docs**: https://expressjs.com/
- **TypeORM Docs**: https://typeorm.io/
- **TypeScript Docs**: https://www.typescriptlang.org/
- **Clerk Docs**: https://clerk.com/docs

## Migration Team Notes

- All Python files remain in `backend/` directory for reference
- New Express code in `backend-express/`
- Frontend remains unchanged (points to same API endpoints)
- Database schema remains compatible
- Gradual rollout recommended: run both backends in parallel
