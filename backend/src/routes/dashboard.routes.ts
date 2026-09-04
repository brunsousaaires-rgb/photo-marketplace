import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/stats', requireAuth, requireRole('PHOTOGRAPHER'), asyncHandler(getDashboardStats));

export default router;
