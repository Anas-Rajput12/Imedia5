# Quick Start Guide - Express Backend

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Access to PostgreSQL database

## Installation (5 minutes)

### 1. Install Dependencies

```bash
cd backend-express
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
# - DATABASE_URL: Your Neon PostgreSQL connection string
# - CLERK_SECRET_KEY: Your Clerk secret key
# - JWT_SECRET: A secure random string
```

### 3. Initialize Database

```bash
# Create tables
npm run db:migrate

# Add sample curriculum data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Verify Installation

### Test Health Endpoint

```bash
curl http://localhost:5000/health
# Expected: {"status":"healthy"}
```

### Test Root Endpoint

```bash
curl http://localhost:5000/
# Expected: Welcome message with version info
```

## Test API Endpoints

### 1. Get User Profile (requires auth)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/auth/me
```

### 2. Start Teaching Session

```bash
curl -X POST http://localhost:5000/api/teaching/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "student_id": "student_123",
    "topic_id": "maths_y7_algebra_basics",
    "topic_name": "Algebra Basics",
    "year_group": "7"
  }'
```

### 3. Get Dashboard Data

```bash
curl http://localhost:5000/api/dashboard/student_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development Workflow

### Run in Development Mode

```bash
# With hot reload
npm run dev

# Server restarts automatically on file changes
```

### Build for Production

```bash
# Compile TypeScript
npm run build

# Start production server
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Common Tasks

### View Logs

```bash
# Combined logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Database Operations

```bash
# Reset database (WARNING: deletes all data)
npm run db:migrate

# Seed sample data
npm run db:seed
```

### Linting

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## Troubleshooting

### Port Already in Use

```bash
# Change PORT in .env file
PORT=5001

# Or kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Database Connection Failed

1. Check DATABASE_URL in .env
2. Verify database is accessible
3. Check firewall settings
4. Ensure SSL mode is set correctly

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
backend-express/
├── src/
│   ├── api/              # Route handlers
│   ├── config/           # Configuration
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── scripts/          # DB scripts
│   ├── services/         # Business logic (TODO)
│   ├── utils/            # Utilities
│   └── main.ts           # Entry point
├── logs/                 # Log files
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```

## API Documentation

All endpoints are documented in the routes:

- **Auth**: `src/api/auth.routes.ts`
- **Teaching**: `src/api/teaching.routes.ts`
- **Dashboard**: `src/api/dashboard.routes.ts`
- **Chatbot**: `src/api/chatbot.routes.ts`
- **Tutor**: `src/api/tutorChat.routes.ts`
- **Progress**: `src/api/progress.routes.ts`
- **Missions**: `src/api/dailyMissions.routes.ts`

## Frontend Integration

Update your frontend API base URL:

```javascript
// frontend/src/config/api.ts
export const API_BASE_URL = 'http://localhost:5000';
```

### Authentication

Include JWT token in all requests:

```javascript
const token = await getToken(); // From Clerk

const response = await fetch(`${API_BASE_URL}/api/dashboard/${studentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Next Steps

1. ✅ Get the server running
2. ✅ Test basic endpoints
3. ✅ Connect to your database
4. ⏳ Port remaining Python services
5. ⏳ Implement AI integration
6. ⏳ Add comprehensive testing

## Getting Help

- Check `README.md` for detailed documentation
- See `MIGRATION_GUIDE.md` for Python to Express migration
- Review `src/api/*.routes.ts` for endpoint implementations
- Check logs in `logs/` directory for errors

## Checklist

- [ ] Dependencies installed
- [ ] .env configured
- [ ] Database connected
- [ ] Server running
- [ ] Health check passing
- [ ] Can create teaching session
- [ ] Frontend can connect
- [ ] Logs are working

## Success Indicators

✅ Server starts without errors
✅ Database connection established
✅ Health endpoint returns `{"status":"healthy"}`
✅ API endpoints respond
✅ Logs are being written
✅ Frontend can make requests
