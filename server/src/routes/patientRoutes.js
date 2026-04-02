import express from 'express';
import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  getMyRecord,
  getMyMedicines,
  sendPatientReminder,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All patient routes require login
router.use(protect);

const patientRules = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
];

// IMPORTANT: specific routes MUST come before /:id routes
// otherwise express thinks 'my-record' is an :id parameter
router.get('/my-record', getMyRecord);
router.get('/my-medicines', authorize('patient'), getMyMedicines);
router.get(
  '/send-reminder/:id',
  authorize('admin', 'doctor'),
  sendPatientReminder
);

router
  .route('/')
  .get(getPatients)
  .post(
    authorize('admin', 'receptionist', 'doctor'),
    patientRules,
    validateRequest,
    createPatient
  );

router.get('/:id/history', getPatientHistory);

router
  .route('/:id')
  .get(getPatient)
  .patch(authorize('admin', 'receptionist', 'doctor'), updatePatient)
  .delete(authorize('admin'), deletePatient);

export default router;