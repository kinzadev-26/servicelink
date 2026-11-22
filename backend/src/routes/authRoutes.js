import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginRules, registerRules } from '../validators/authValidators.js';

const router = Router();
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', authenticate, me);
export default router;
