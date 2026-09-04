import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, getSports, listEvents, myEvents } from '../controllers/events.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listEvents));
router.get('/sports', asyncHandler(getSports));
router.get('/mine', requireAuth, requireRole('PHOTOGRAPHER'), asyncHandler(myEvents));
router.get('/:id', asyncHandler(getEvent));
router.post('/', requireAuth, requireRole('PHOTOGRAPHER'), upload.single('cover'), asyncHandler(createEvent));
router.delete('/:id', requireAuth, requireRole('PHOTOGRAPHER'), asyncHandler(deleteEvent));

export default router;
