import app from './app.js';
import { getEnv, validateConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './providers/database/connection.js';

const boot = async (): Promise<void> => {
  // 1) Validate environment before doing anything else.
  try {
    validateConfig(process.env);
  } catch (err) {
    console.error('Invalid environment configuration:\n', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const env = getEnv();

  // 2) Connect to MongoDB Atlas.
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // 3) Start the HTTP server.
  const server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`API docs on   http://localhost:${env.PORT}/api/docs`);
  });

  // 4) Shut down cleanly.
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

void boot();
