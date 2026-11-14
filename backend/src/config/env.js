import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (!env.mongoUri) {
  throw new Error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
}
