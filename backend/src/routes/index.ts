import { Router } from 'express';
import { register, login, selectRole, logout, me } from '../controllers/auth.controller';
import { createReview, getReviews } from '../controllers/review.controller';
import { createStore, getOwnStore, updateStore, getPublicStore } from '../controllers/store.controller';
import { createProduct, getSellerProducts, updateProduct, deleteProduct, getPublicProducts, getPublicProductDetail } from '../controllers/product.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/select-role', verifyToken, selectRole);
router.post('/auth/logout', verifyToken, logout);
router.get('/auth/me', verifyToken, me);

// Review Routes
router.post('/reviews', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return verifyToken(req, res, next);
  next();
}, createReview);
router.get('/reviews', getReviews);

// Store Routes (Seller)
router.post('/seller/store', verifyToken, requireRole('SELLER'), createStore);
router.get('/seller/store', verifyToken, requireRole('SELLER'), getOwnStore);
router.put('/seller/store', verifyToken, requireRole('SELLER'), updateStore);

// Store Routes (Public)
router.get('/stores/:id', getPublicStore);

// Product Routes (Seller)
router.post('/seller/products', verifyToken, requireRole('SELLER'), createProduct);
router.get('/seller/products', verifyToken, requireRole('SELLER'), getSellerProducts);
router.put('/seller/products/:id', verifyToken, requireRole('SELLER'), updateProduct);
router.delete('/seller/products/:id', verifyToken, requireRole('SELLER'), deleteProduct);

// Product Routes (Public)
router.get('/products', getPublicProducts);
router.get('/products/:id', getPublicProductDetail);

// Health Check
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default router;
