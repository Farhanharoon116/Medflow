import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getOnboardingStatus,
  completeOnboarding,
} from '../controllers/onboardingController.js';

const router = express.Router();

router.use(protect);

router.get('/status', authorize('admin'), getOnboardingStatus);
router.patch('/complete', authorize('admin'), completeOnboarding);

export default router;

