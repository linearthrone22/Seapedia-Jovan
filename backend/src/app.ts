import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import router from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || '', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many requests' } });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use('/api', generalLimiter);

app.use('/api', router);

export default app;
