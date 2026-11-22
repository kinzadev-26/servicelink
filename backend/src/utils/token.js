import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// The token carries only the user id and role. Who the user is *now* (still active? still this role?)
// is always read from the database by the authenticate middleware.
export const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
