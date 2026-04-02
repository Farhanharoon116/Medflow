import express from 'express';
import {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  getDoctorSchedule,
  cancelAppointment,
  getAvailableSlots,
  markFeePaid,
  getAppointmentQueue,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();
router.get('/available-slots', getAvailableSlots);
router.get('/queue', getAppointmentQueue);
router.use(protect);

const bookingRules = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('timeSlot').notEmpty().withMessage('Time slot is required'),
];

router
  .route('/')
  .get(getAppointments)
  .post(
    authorize('admin', 'receptionist', 'doctor'),
    bookingRules,
    validateRequest,
    bookAppointment
  );

router.get('/schedule', getDoctorSchedule);

router
  .route('/:id')
  .get(getAppointment)
  .patch(authorize('admin', 'receptionist', 'doctor'), updateAppointmentStatus);
router.patch('/:id/pay', authorize('admin', 'receptionist'), markFeePaid);

router.patch('/:id/cancel', cancelAppointment);

export default router;