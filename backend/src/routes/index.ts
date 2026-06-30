import { Router } from 'express';
import { register, login, selectRole, logout, me } from '../controllers/auth.controller';
import { createReview, getReviews } from '../controllers/review.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/select-role', verifyToken, selectRole);
router.post('/auth/logout', verifyToken, logout);
router.get('/auth/me', verifyToken, me);

router.post('/reviews', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return verifyToken(req, res, next);
  next();
}, createReview);
router.get('/reviews', getReviews);

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default router;
