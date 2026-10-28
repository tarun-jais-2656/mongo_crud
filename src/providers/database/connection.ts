import mongoose from 'mongoose';
import { getEnv } from '../../config/env.js';

/**
 * Single place that opens (and closes) the Mongoose connection.
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  const env = getEnv();

  // Fail fast on bad queries instead of buffering them forever.
  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(env.MONGODB_URI, {
    dbName: env.DB_NAME,
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(`MongoDB connected -> database "${env.DB_NAME}"`);
  return connection;
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
