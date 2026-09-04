import { Router } from 'express';
import {
  deletePhoto,
  downloadPhoto,
  getCategories,
  getPhoto,
  listPhotos,
  myPhotos,
  uploadPhoto,
} from '../controllers/photos.controller';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get('/', asyncHandler(listPhotos));
router.get('/categories', asyncHandler(getCategories));
router.get('/mine', requireAuth, requireRole('PHOTOGRAPHER'), asyncHandler(myPhotos));
router.get('/:id', optionalAuth, asyncHandler(getPhoto));
router.get('/:id/download', requireAuth, asyncHandler(downloadPhoto));
router.post('/', requireAuth, requireRole('PHOTOGRAPHER'), upload.single('image'), asyncHandler(uploadPhoto));
router.delete('/:id', requireAuth, requireRole('PHOTOGRAPHER'), asyncHandler(deletePhoto));

export default router;
