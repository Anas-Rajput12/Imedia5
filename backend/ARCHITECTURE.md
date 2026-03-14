# Express Backend Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   React     │  │   Mobile    │  │   Other     │             │
│  │  Frontend   │  │     App     │  │  Clients    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                        │
│                    JWT Token                                      │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js Server                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   CORS   │  │  Clerk   │  │  Error   │  │  Morgan  │  │  │
│  │  │          │  │   Auth   │  │ Handler  │  │  Logger  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     API Routes Layer                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   Auth   │  │ Teaching │  │Dashboard │  │ Chatbot  │  │  │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │  │
│  │  │  Tutor   │  │ Progress │  │  Daily   │                │  │
│  │  │  Routes  │  │  Routes  │  │ Missions │                │  │
│  │  └──────────┘  └──────────┘  └──────────┘                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Services Layer (TODO)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │    AI    │  │ Teaching │  │ Mastery  │  │   RAG    │  │  │
│  │  │ Service  │  │ Service  │  │ Engine   │  │ Service  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Data Access Layer                        │  │
│  │                    TypeORM Repository                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   User   │  │ Student  │  │  Topic   │  │ Teaching │  │  │
│  │  │  Repo    │  │  Repo    │  │  Repo    │  │  Repo    │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│              Neon Serverless PostgreSQL                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tables:                                                  │   │
│  │  - users                                                  │   │
│  │  - student_profiles                                       │   │
│  │  - topic_mastery                                          │   │
│  │  - curriculum_topics                                      │   │
│  │  - teaching_sessions                                      │   │
│  │  - learning_sessions                                      │   │
│  │  - chat_sessions                                          │   │
│  │  - chat_messages                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Example: Start Teaching Session

```
Client Request
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. CORS Middleware                       │
│    - Validate origin                     │
│    - Set CORS headers                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. Authentication Middleware             │
│    - Verify JWT token from Clerk         │
│    - Extract user ID                     │
│    - Attach to request                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. Route Handler                         │
│    POST /api/teaching/start              │
│    - Validate request body               │
│    - Extract student_id, topic_id        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. Business Logic (TODO)                 │
│    - Validate curriculum lock            │
│    - Create teaching session             │
│    - Initialize mastery record           │
│    - Generate AI response                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 5. Data Access Layer                     │
│    - TypeORM repositories                │
│    - Query database                      │
│    - Save session data                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 6. Response                              │
│    {                                     │
│      "success": true,                    │
│      "data": {                           │
│        "session_id": "...",              │
│        "topic_id": "...",                │
│        "message": "..."                  │
│      }                                   │
│    }                                     │
└─────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password            │
│ first_name          │
│ last_name           │
│ year_group          │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│  student_profiles   │
├─────────────────────┤
│ student_id (PK)     │
│ clerk_user_id       │
│ user_id (FK)        │
│ first_name          │
│ last_name           │
│ email               │
│ year_group          │
│ preferred_subject   │
│ learning_preferences│
│ weak_topics         │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│topic_mastery│ │teaching_    │ │learning_    │ │chat_        │
├─────────────┤ │sessions     │ │sessions     │ │sessions     │
│ id (PK)     │ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ student_id  │ │ id (PK)     │ │ id (PK)     │ │ id (PK)     │
│ topic_id    │ │ session_id  │ │ session_id  │ │ session_id  │
│ mastery_%   │ │ student_id  │ │ student_id  │ │ student_id  │
│ status      │ │ topic_id    │ │ topic_id    │ │ topic_id    │
│ error_tags  │ │ topic_name  │ │ tutor_type  │ │ chat_type   │
│ created_at  │ │ subject     │ │ accuracy    │ │ message_cnt │
│ updated_at  │ │ current_step│ │ total_q     │ │ status      │
└─────────────┘ │ is_complete │ │ correct_a   │ │ created_at  │
         │      │ created_at  │ │ status      │ │ updated_at  │
         │      └─────────────┘ └─────────────┘ └─────────────┘
         │
         │ N:1
         ▼
┌─────────────────────┐
│ curriculum_topics   │
├─────────────────────┤
│ topic_id (PK)       │
│ topic_name          │
│ subject             │
│ year_level          │
│ exam_board          │
│ description         │
│ learning_objectives │
│ estimated_duration  │
│ content             │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## Component Interactions

### Authentication Flow

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Client  │      │  Clerk  │      │ Express │      │   DB    │
│         │      │  Auth   │      │ Backend │      │         │
└────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
     │                │                │                │
     │ 1. Login       │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │ 2. JWT Token   │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ 3. Request + JWT               │                │
     │───────────────────────────────>│                │
     │                │                │                │
     │                │ 4. Verify JWT │                │
     │                │<──────────────│                │
     │                │                │                │
     │                │ 5. User Data   │                │
     │                │──────────────>│                │
     │                │                │                │
     │                │                │ 6. Get/Create  │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ 7. User Record │
     │                │                │<───────────────│
     │                │                │                │
     │ 8. Response    │                │                │
     │<───────────────────────────────│                │
     │                │                │                │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 1. Transport Security                            │    │
│  │    - HTTPS/TLS (production)                     │    │
│  │    - SSL mode for database                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 2. Authentication                                │    │
│  │    - Clerk JWT tokens                           │    │
│  │    - Token expiration validation                │    │
│  │    - Secure token storage                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 3. Authorization                                 │    │
│  │    - Route-level protection                     │    │
│  │    - User ownership validation                  │    │
│  │    - Role-based access control (TODO)           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 4. Input Validation                              │    │
│  │    - Request body validation                    │    │
│  │    - SQL injection prevention (TypeORM)         │    │
│  │    - XSS prevention                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 5. Rate Limiting (TODO)                          │    │
│  │    - Request throttling                         │    │
│  │    - IP-based limits                            │    │
│  │    - User-based limits                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Production Environment                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────┐                                          │
│  │   CDN      │                                          │
│  │  (Static)  │                                          │
│  └────────────┘                                          │
│         │                                                 │
│         ▼                                                 │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐    │
│  │  Express   │     │  Express   │     │  Express   │    │
│  │  Instance  │     │  Instance  │     │  Instance  │    │
│  │     1      │     │     2      │     │     N      │    │
│  └─────┬──────┘     └─────┬──────┘     └─────┬──────┘    │
│        │                  │                  │            │
│        └──────────────────┴──────────────────┘            │
│                           │                               │
│                           ▼                               │
│                   ┌────────────┐                          │
│                   │    Load    │                          │
│                   │  Balancer  │                          │
│                   └─────┬──────┘                          │
│                         │                                 │
│                         ▼                                 │
│                   ┌────────────┐                          │
│                   │    Neon    │                          │
│                   │ PostgreSQL │                          │
│                   └────────────┘                          │
│                                                           │
│                   ┌────────────┐                          │
│                   │   Clerk    │                          │
│                   │    Auth    │                          │
│                   └────────────┘                          │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## File Organization

```
backend-express/
│
├── src/
│   ├── api/                      # Route handlers
│   │   ├── auth.routes.ts        # /auth/*
│   │   ├── teaching.routes.ts    # /api/teaching/*
│   │   ├── dashboard.routes.ts   # /api/dashboard/*
│   │   ├── chatbot.routes.ts     # /api/chatbot/*
│   │   ├── tutorChat.routes.ts   # /api/tutor/chat/*
│   │   ├── progress.routes.ts    # /api/progress/*
│   │   └── dailyMissions.routes.ts # /api/daily-missions/*
│   │
│   ├── config/                   # Configuration
│   │   ├── database.ts           # TypeORM setup
│   │   ├── logger.ts             # Winston setup
│   │   └── cors.ts               # CORS config
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # Clerk auth
│   │   └── errorHandler.ts       # Error handling
│   │
│   ├── models/                   # TypeORM entities
│   │   ├── user.ts
│   │   ├── studentProfile.ts
│   │   ├── topicMastery.ts
│   │   ├── curriculumTopic.ts
│   │   ├── teachingSession.ts
│   │   ├── learningSession.ts
│   │   ├── chatSession.ts
│   │   └── index.ts
│   │
│   ├── scripts/                  # DB scripts
│   │   ├── migrate.ts
│   │   └── seed.ts
│   │
│   ├── services/                 # Business logic (TODO)
│   │   ├── aiService.ts
│   │   ├── teachingService.ts
│   │   └── ...
│   │
│   ├── utils/                    # Utilities
│   │
│   └── main.ts                   # Entry point
│
├── logs/                         # Log files
│   ├── combined.log
│   └── error.log
│
├── .env                          # Environment variables
├── .env.example                  # Example env
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── MIGRATION_GUIDE.md
├── QUICKSTART.md
└── test-setup.js
```
