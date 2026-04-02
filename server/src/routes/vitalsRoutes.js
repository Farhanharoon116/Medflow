import express from 'express';
import {
  createVitals,
  getVitalsByPatient,
  getLatestVitals,
  getRecentVitalsCount,
} from '../controllers/vitalsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('doctor', 'admin'), createVitals);

router.get(
  '/recent-count',
  authorize('doctor', 'admin'),
  getRecentVitalsCount
);

router.get(
  '/patient/:patientId',
  authorize('admin', 'doctor', 'receptionist'),
  getVitalsByPatient
);

router.get(
  '/latest/:patientId',
  authorize('admin', 'doctor', 'receptionist'),
  getLatestVitals
);

export default router;
