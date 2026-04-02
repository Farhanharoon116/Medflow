import express from 'express';
import {
  uploadLabResult,
  getLabsByPatient,
  getMyLabResults,
  updateLabNotes,
  updateLabStatus,
  deleteLabResult,
} from '../controllers/labController.js';
import { uploadLabFile } from '../middleware/labUploadMiddleware.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post(
  '/upload',
  authorize('admin', 'doctor', 'receptionist'),
  uploadLabFile.single('file'),
  uploadLabResult
);

router.get('/my-results', authorize('patient'), getMyLabResults);

router.get(
  '/patient/:patientId',
  authorize('admin', 'doctor', 'receptionist'),
  getLabsByPatient
);

router.patch(
  '/:id/notes',
  authorize('admin', 'doctor'),
  updateLabNotes
);

router.patch(
  '/:id/status',
  authorize('admin', 'doctor'),
  updateLabStatus
);

router.delete('/:id', authorize('admin'), deleteLabResult);

export default router;
