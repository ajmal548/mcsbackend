import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from './config/swagger.config';
import errorHandler from './middlewares/errorHandler';
import globalRoutes from './routes/global.routes';
import AppError from './utils/appError';

import requestIdMiddleware from './middlewares/requestId';

const app = express();

// Middlewares
app.use(requestIdMiddleware);
app.use(
  cors({
    exposedHeaders: ['x-renewed-token', 'x-request-id'],
  })
);
app.use(express.json());

// Serve Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to MYCARSOL Backend API' });
});

// Health Check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MYCARSOL API is running' });
});

// Global API Routes
app.use('/api', globalRoutes);

// Handle 404
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
