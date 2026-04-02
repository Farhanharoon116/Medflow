import express from 'express';
import { body } from 'express-validator';
import {
  registerAdmin,
  registerPatient,
  login,
  addStaff,
  getStaff,
  updateDoctorFee,
  refreshToken,
  logout,
  getMe,
  getClinicInfo,
  changePassword,
  updatePlan,
  getDoctors,
  updateAvailability,
  updateClinicProfile,
  uploadClinicLogoUrl,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { uploadClinicLogo } from '../middleware/clinicLogoUploadMiddleware.js';

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('clinicName').trim().notEmpty().withMessage('Clinic name is required'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(?:0\d{10,11})$/)
    .withMessage('Enter a valid Pakistani phone number (e.g. 03001234567)'),
  body('city').optional({ nullable: true, checkFalsy: true }).trim(),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Public routes (no auth needed) ───────────────────────────────────
router.post(
  '/register',
  authLimiter,
  registerRules,
  validateRequest,
  registerAdmin
);

router.post(
  '/login',
  authLimiter,
  loginRules,
  validateRequest,
  login
);

router.post('/register-patient', authLimiter, registerPatient);

router.post('/refresh', refreshToken);

// Public clinic lookup — patients use this to verify clinic code
router.get('/clinic/:id', getClinicInfo);

// ── Protected routes (must be logged in) ─────────────────────────────
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.patch('/change-password', changePassword);
router.get('/doctors', getDoctors);
router.patch('/staff/:id/availability', authorize('admin'), updateAvailability);

// Admin only
router.post('/add-staff', authorize('admin'), addStaff);
router.get('/staff', authorize('admin', 'receptionist', 'doctor'), getStaff);
router.patch(
  '/staff/:id/fee',
  authorize('admin'),
  updateDoctorFee
);
router.patch('/update-plan', authorize('admin'), updatePlan);

// Admin: clinic profile + logo
router.patch('/clinic-profile', authorize('admin'), updateClinicProfile);
router.post(
  '/upload-clinic-logo',
  authorize('admin'),
  uploadClinicLogo.single('file'),
  uploadClinicLogoUrl
);

export default router;