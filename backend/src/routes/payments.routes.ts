import { Router } from 'express';
import { createCheckoutSession, getOrder, myOrders } from '../controllers/payments.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/checkout', requireAuth, asyncHandler(createCheckoutSession));
router.get('/orders', requireAuth, asyncHandler(myOrders));
router.get('/orders/:id', requireAuth, asyncHandler(getOrder));

export default router;
