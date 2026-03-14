/**
 * SGA AI Tutor - Main Application
 * Express.js server with comprehensive AI teaching capabilities
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Import configuration
import { corsOptions } from './config/cors';
import { logger, stream } from './config/logger';
import { initializeDatabase, closeDatabase } from './config/database';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './middleware/errorHandler';

// Import routes
import authRoutes from './api/auth.routes';
import teachingRoutes from './api/teaching.routes';
import smartTeachingRoutes from './api/smartTeaching.routes';
import structuredTeachingRoutes from './api/structuredTeaching.routes';
import stepByStepTeachingRoutes from './api/stepByStepTeaching.routes';
import enhancedTeachingRoutes from './api/enhancedTeaching.routes';  // Enhanced Step-by-Step Teaching
import dashboardRoutes from './api/dashboard.routes';
import chatbotRoutes from './api/chatbot.routes';
import tutorChatRoutes from './api/tutorChat.routes';
import progressRoutes from './api/progress.routes';
import dailyMissionsRoutes from './api/dailyMissions.routes';

// Import RAG routes
import ragRoutes from './api/rag.routes';
import documentRoutes from './api/document.routes';
import curriculumRoutes from './api/curriculum.routes';

// Import Voice routes
import voiceRoutes from './api/voice.routes';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Create Express application
 */
const app: Application = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream }));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to SGA AI Tutor API',
    version: '2.0.0',
    environment: NODE_ENV,
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/teaching', teachingRoutes);
app.use('/api/teaching', smartTeachingRoutes);
app.use('/api/teaching', structuredTeachingRoutes);  // Structured Teaching Flow
app.use('/api/teaching/step', stepByStepTeachingRoutes);  // Step-by-Step Teaching
app.use('/api/teaching/enhanced', enhancedTeachingRoutes);  // Enhanced Step-by-Step Teaching
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/tutor', tutorChatRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/daily-missions', dailyMissionsRoutes);

// RAG Routes (AI Tutor with Retrieval)
app.use('/api/rag', ragRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/curriculum', curriculumRoutes);

// Voice Routes (Google Cloud Text-to-Speech)
app.use('/api/voice', voiceRoutes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
});

// Global error handler
app.use(errorHandler);

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database
    await initializeDatabase();

    // Start Express server
    app.listen(Number(PORT), () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      await closeDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      await closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
