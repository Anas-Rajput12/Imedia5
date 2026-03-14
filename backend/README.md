# SGA AI Tutor - Express.js Backend

Express.js backend for the Smart Global Academy AI Tutor Platform, converted from Python FastAPI.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon serverless recommended)
- Clerk account for authentication

### Installation

```bash
# Navigate to backend directory
cd backend-express

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure your database and Clerk credentials

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Integration

To connect your frontend to this backend:

1. **Update Frontend Environment**:
   ```bash
   # In frontend/.env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```

2. **Use the Switcher Script** (optional):
   ```bash
   node switch-backend.js express
   ```

3. **Restart Frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

See `FRONTEND_SETUP.md` for detailed frontend integration guide.

## 📁 Project Structure

```
backend-express/
├── src/
│   ├── api/              # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── teaching.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── chatbot.routes.ts
│   │   ├── tutorChat.routes.ts
│   │   ├── progress.routes.ts
│   │   └── dailyMissions.routes.ts
│   ├── config/           # Configuration files
│   │   ├── database.ts   # TypeORM database config
│   │   ├── logger.ts     # Winston logger config
│   │   └── cors.ts       # CORS configuration
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Clerk authentication
│   │   └── errorHandler.ts
│   ├── models/           # TypeORM entities
│   │   ├── user.ts
│   │   ├── studentProfile.ts
│   │   ├── topicMastery.ts
│   │   ├── curriculumTopic.ts
│   │   ├── teachingSession.ts
│   │   ├── learningSession.ts
│   │   └── chatSession.ts
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database scripts
│   └── main.ts           # Application entry point
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication
- `GET /auth/me` - Get current user profile
- `GET /auth/verify` - Verify authentication token

### Teaching
- `POST /api/teaching/start` - Start teaching session
- `POST /api/teaching/message` - Process student message
- `GET /api/teaching/session/:session_id` - Get session summary
- `GET /api/teaching/mastery/:student_id` - Get mastery data
- `POST /api/teaching/error/analyze` - Analyze maths error
- `GET /api/teaching/topics/search` - Search curriculum topics
- `GET /api/teaching/curriculum/topics` - Get curriculum topics

### Dashboard
- `GET /api/dashboard/:student_id` - Get comprehensive dashboard data
- `GET /api/dashboard/recommendations/:student_id` - Get AI-recommended lesson
- `GET /api/dashboard/streak/:student_id` - Get learning streak

### Chatbot
- `POST /api/chatbot/message` - Send message to chatbot
- `GET /api/chatbot/session/:session_id` - Get chat session history
- `DELETE /api/chatbot/session/:session_id` - Clear chat session

### Tutor Chat
- `POST /api/tutor/chat/message` - Send message to tutor
- `POST /api/tutor/chat/start` - Start tutor chat session
- `GET /api/tutor/chat/session/:session_id` - Get tutor chat session

### Progress
- `GET /api/progress/:student_id` - Get progress overview
- `GET /api/progress/:student_id/topics` - Get progress by topic
- `GET /api/progress/:student_id/history` - Get learning history
- `GET /api/progress/:student_id/weaknesses` - Get identified weaknesses

### Daily Missions
- `GET /api/daily-missions/:student_id` - Get daily missions
- `GET /api/daily-missions/:student_id/streak` - Get learning streak
- `POST /api/daily-missions/:student_id/claim` - Claim mission reward

## 🗄️ Database Setup

The application uses TypeORM with PostgreSQL (Neon serverless).

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# Clerk Authentication
CLERK_SECRET_KEY=sk_***
CLERK_PUBLISHABLE_KEY=pk_***

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key

# CORS
FRONTEND_URL=http://localhost:3000
```

### Initialize Database

```bash
# The database tables are automatically created on first run
# For manual migrations:
npm run db:migrate

# Seed sample data:
npm run db:seed
```

## 🔐 Authentication

The backend uses Clerk for authentication. All protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## 🛠️ Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm run test
npm run test:watch

# Database operations
npm run db:migrate
npm run db:seed
```

### Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

In development, logs are also output to the console.

## 📊 Key Features

### Converted from Python FastAPI
- ✅ All API routes migrated to Express.js
- ✅ SQLAlchemy models converted to TypeORM entities
- ✅ Pydantic schemas replaced with TypeScript interfaces
- ✅ FastAPI dependency injection replaced with middleware
- ✅ Python services converted to TypeScript classes

### Architecture
- **MVC Pattern** - Models, Views (Routes), Controllers (Services)
- **Dependency Injection** - TypeORM repositories
- **Error Handling** - Global error middleware
- **Authentication** - Clerk JWT verification
- **Logging** - Winston structured logging
- **CORS** - Configured for frontend

## 🔄 Migration from Python

### Key Differences

| Python (FastAPI) | Express.js (TypeScript) |
|-----------------|------------------------|
| `@app.get()` | `router.get()` |
| `Pydantic models` | TypeScript interfaces |
| `SQLAlchemy` | `TypeORM` |
| `async def` | `async/await` |
| `Depends()` | Middleware |
| `uvicorn` | Native Express server |

### Services to Implement

The following Python services need to be ported to TypeScript:

- [ ] `AIService` - AI model integration
- [ ] `UnifiedTeachingService` - Teaching orchestration
- [ ] `MasteryTrackingEngine` - Progress tracking
- [ ] `MathsErrorEngine` - Error analysis
- [ ] `RetrievalService` - RAG system
- [ ] `SafeguardingLayer` - Safety checks
- [ ] `CurriculumLockEnforcer` - Curriculum validation
- [ ] `TeachingFlowEngine` - Teaching flow
- [ ] `DashboardService` - Dashboard data
- [ ] `VoiceService` - Voice synthesis
- [ ] `AvatarService` - Avatar control

## 🚧 TODO

### High Priority
1. Port all Python services to TypeScript
2. Implement Vertex AI integration
3. Add RAG (Retrieval Augmented Generation)
4. Implement maths error detection engine
5. Add safeguarding and safety checks

### Medium Priority
1. Add WebSocket support for real-time features
2. Implement voice synthesis (Edge TTS)
3. Add avatar animation control
4. Set up comprehensive testing
5. Add API rate limiting

### Low Priority
1. Add API documentation (Swagger/OpenAPI)
2. Implement caching layer (Redis)
3. Add performance monitoring
4. Set up CI/CD pipeline
5. Add comprehensive logging and analytics

## 📝 License

ISC

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the repository.
