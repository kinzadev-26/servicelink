import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
if (env.nodeEnv === 'production') app.set('trust proxy', 1); // behind Render's proxy, so rate limiting sees real IPs

// Security and parsing middleware (see section 7 of the design document)
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ServiceLink API is running', data: { time: new Date().toISOString() } });
});

app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
