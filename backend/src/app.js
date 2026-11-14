import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import categoryRoutes from './routes/categoryRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl}));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ServiceLink API is running', data: { time: new Date().toISOString() } });
});

app.use('/api/categories', categoryRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/services', serviceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
