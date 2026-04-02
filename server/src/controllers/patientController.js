import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import Prescription from '../models/Prescription.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { buildActiveMedicineList } from '../utils/medicineDuration.js';
import { sendMedicineReminderForPatient } from '../services/reminderService.js';

// ── CREATE PATIENT ───────────────────────────────────────────────────
export const createPatient = asyncHandler(async (req, res, next) => {
  const { name, age, gender, phone, email, address, bloodGroup, allergies, chronicConditions } = req.body;

  // Enforce free plan patient limit
  const clinic = await Clinic.findById(req.user.clinic);
  if (clinic.plan === 'free') {
    const patientCount = await Patient.countDocuments({ clinic: req.user.clinic });
    if (patientCount >= clinic.patientLimit) {
      return next(
        new AppError(
          `Free plan allows max ${clinic.patientLimit} patients. Please upgrade to Pro.`,
          403
        )
      );
    }
  }

  // Check duplicate phone in same clinic
  if (phone) {
    const existing = await Patient.findOne({ clinic: req.user.clinic, phone });
    if (existing) {
      return next(new AppError('A patient with this phone number already exists.', 400));
    }
  }

  const patient = await Patient.create({
    clinic: req.user.clinic,
    name,
    age,
    gender,
    phone,
    email,
    address,
    bloodGroup,
    allergies: allergies || [],
    chronicConditions: chronicConditions || [],
    registeredBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully.',
    patient,
  });
});

// ── GET ALL PATIENTS ─────────────────────────────────────────────────
export const getPatients = asyncHandler(async (req, res, next) => {
  // Search + pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  // Build search query — only search within this clinic
  const query = {
    clinic: req.user.clinic,
    isActive: true,
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } }, // case-insensitive name search
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('registeredBy', 'name role'),
    Patient.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: patients.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    patients,
  });
});

// ── GET SINGLE PATIENT ───────────────────────────────────────────────
export const getPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    clinic: req.user.clinic, // CRITICAL: ensures cross-clinic access is impossible
  }).populate('registeredBy', 'name role');

  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  res.status(200).json({ success: true, patient });
});

// ── UPDATE PATIENT ───────────────────────────────────────────────────
export const updatePatient = asyncHandler(async (req, res, next) => {
  // Fields that are allowed to be updated
  const allowedFields = [
    'name', 'age', 'gender', 'phone', 'email',
    'address', 'bloodGroup', 'allergies', 'chronicConditions',
  ];

  // Build update object with only allowed fields
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const patient = await Patient.findOneAndUpdate(
    { _id: req.params.id, clinic: req.user.clinic },
    updates,
    { new: true, runValidators: true } // new: true returns updated doc
  );

  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Patient updated successfully.',
    patient,
  });
});

// ── DELETE PATIENT (soft delete) ─────────────────────────────────────
// We never actually delete medical records — just mark as inactive
export const deletePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOneAndUpdate(
    { _id: req.params.id, clinic: req.user.clinic },
    { isActive: false },
    { new: true }
  );

  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Patient record deactivated successfully.',
  });
});

// ── GET PATIENT FULL HISTORY ─────────────────────────────────────────
// Returns appointments + prescriptions + diagnosis logs for one patient
export const getPatientHistory = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  // Import models inline to avoid circular imports
  const { default: Appointment } = await import('../models/Appointment.js');
  const { default: Prescription } = await import('../models/Prescription.js');
  const { default: DiagnosisLog } = await import('../models/DiagnosisLog.js');

  // Fetch all history in parallel for speed
  const [appointments, prescriptions, diagnosisLogs] = await Promise.all([
    Appointment.find({ patient: patient._id, clinic: req.user.clinic })
      .sort({ date: -1 })
      .populate('doctor', 'name specialization'),
    Prescription.find({ patient: patient._id, clinic: req.user.clinic })
      .sort({ createdAt: -1 })
      .populate('doctor', 'name specialization'),
    DiagnosisLog.find({ patient: patient._id, clinic: req.user.clinic })
      .sort({ createdAt: -1 })
      .populate('doctor', 'name'),
  ]);

  res.status(200).json({
    success: true,
    patient,
    history: {
      appointments,
      prescriptions,
      diagnosisLogs,
    },
  });
});

// GET /api/patients/my-record — for logged-in patient to get their own record
export const getMyRecord = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'patient') {
      return next(new AppError('This endpoint is for patients only.', 403));
    }
  
    const patient = await Patient.findOne({
      userAccount: req.user._id,
      clinic: req.user.clinic,
    });
  
    if (!patient) {
      return next(new AppError('Patient record not found.', 404));
    }
  
    res.status(200).json({ success: true, patient });
  });

// GET /api/patients/my-medicines — active medicines from last 60 days (patient only)
export const getMyMedicines = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'patient') {
    return next(new AppError('This endpoint is for patients only.', 403));
  }

  const patient = await Patient.findOne({
    userAccount: req.user._id,
    clinic: req.user.clinic,
  });

  if (!patient) {
    return next(new AppError('Patient record not found.', 404));
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const prescriptions = await Prescription.find({
    patient: patient._id,
    clinic: req.user.clinic,
    createdAt: { $gte: sixtyDaysAgo },
  })
    .sort({ createdAt: -1 })
    .populate('doctor', 'name');

  const medicines = buildActiveMedicineList(
    prescriptions.map((p) => p.toObject({ virtuals: true }))
  );

  res.status(200).json({ success: true, count: medicines.length, medicines });
});

// GET /api/patients/send-reminder/:id — manual reminder for one patient (admin / doctor)
export const sendPatientReminder = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  const result = await sendMedicineReminderForPatient(patient._id);

  if (!result.sent) {
    return res.status(400).json({
      success: false,
      message: result.message || 'Reminder could not be sent.',
    });
  }

  res.status(200).json({
    success: true,
    message: result.message || 'Reminder email sent.',
  });
});