import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { LowDbManager } from './database/lowdb-manager';
import routes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from docs directory (relative to project root)
app.use('/docs', express.static('../docs'));

// API endpoint to get docs directory structure
app.get('/docs', (req, res) => {
  try {
    const docsPath = path.join(__dirname, '../../docs');
    const files = fs.readdirSync(docsPath)
      .filter(file => file.endsWith('.md'))
      .sort();
    
    res.json(files);
  } catch (error) {
    console.error('Error reading docs directory:', error);
    res.status(500).json({ error: 'Failed to read docs directory' });
  }
});

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function initializeServer() {
  try {
    // Initialize lowdb
    const dbManager = LowDbManager.getInstance();
    await dbManager.init();
    
    console.log('Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
      console.log(`API documentation available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  const dbManager = LowDbManager.getInstance();
  await dbManager.save();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  const dbManager = LowDbManager.getInstance();
  await dbManager.save();
  process.exit(0);
});

// Start the server
initializeServer();

export default app;