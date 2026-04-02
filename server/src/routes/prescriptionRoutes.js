import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescription,
  downloadPrescription,
  aiSymptomCheck,
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id/download', downloadPrescription);

// ── All routes below require authentication ──────────────────────────
router.use(protect);

router
  .route('/')
  .get(getPrescriptions)
  .post(authorize('doctor'), createPrescription);

router.get('/:id', getPrescription);

// AI symptom check — doctors and admins only
router.post(
  '/ai/symptom-check',
  authorize('doctor', 'admin'),
  aiSymptomCheck
);

export default router;