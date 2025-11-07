import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { DatabaseManager } from './database/connection';
import { createTables, updateExistingTables } from './database/migrations';
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
    // Initialize default database connection
    const dbManager = DatabaseManager.getInstance();
    
    // Create default SQLite database connection for the application itself
    const defaultConfig = {
      id: 'default',
      name: 'default',
      type: 'sqlite' as const,
      database: 'easyprompt.db',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const connection = await dbManager.createConnection(defaultConfig);
    
    // Store the default connection in DatabaseManager
    // This ensures DatabaseConfigService can access it
    const connectionKey = `${defaultConfig.name}_${defaultConfig.database}`;
    dbManager.connections.set(connectionKey, connection);
    
    // Create tables if they don't exist
    await createTables(connection);
    
    // Update existing tables with new columns
    await updateExistingTables(connection);
    
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
  const dbManager = DatabaseManager.getInstance();
  await dbManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  const dbManager = DatabaseManager.getInstance();
  await dbManager.closeAllConnections();
  process.exit(0);
});

// Start the server
initializeServer();

export default app;