import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
};

if (!env.mongoUri) {
  throw new Error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
}
// NFR-2: the signing secret must be long and random, and only ever live in the environment.
if (!env.jwtSecret || env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET is missing or shorter than 32 characters. See .env.example for how to generate one.');
}
