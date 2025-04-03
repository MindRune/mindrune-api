import dotenv from 'dotenv';
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import createError from 'http-errors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import logger from './utils/logger';
import auth0 from './config/auth0';
import authMiddleware from './middlewares/auth.middleware';
import passport from 'passport';

// Initialize Auth0 clients
auth0.initClients();

authMiddleware.initializePassport();

// Import routes
import osrsRoutes from './routes/osrs';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import agentRoutes from './routes/agent';
import imgRoutes from './routes/img';

// Load environment variables
dotenv.config();

// Initialize app
const app: Express = express();

// Middleware setup
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../node_modules')));
app.use('/dkg', express.static(path.join(__dirname, '../node_modules/dkg.js')));
app.use('/util', express.static(path.join(__dirname, '../public/util')));
app.use(bodyParser.json({ limit: '50mb', extended: true } as any));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 } as any));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(cors());
app.use(passport.initialize());

// OpenAPI/Swagger Documentation
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs/swagger.json'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/osrs', osrsRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/agent', agentRoutes);
app.use('/img', imgRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Log error
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Send error response
  res.status(err.status || 500);
  res.json({
    success: false,
    msg: err.message || 'Invalid Path.',
    error: req.app.get('env') === 'development' ? err : undefined,
  });
});

export default app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { service: 'mindrune-api' });
  });
}