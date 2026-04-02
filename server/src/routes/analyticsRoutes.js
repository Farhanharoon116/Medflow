import express from 'express';
import { getAdminAnalytics, getDoctorAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminAnalytics);
router.get('/doctor', authorize('doctor', 'admin'), getDoctorAnalytics);

export default router;