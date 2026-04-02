import VitalSigns from '../models/VitalSigns.js';
import Patient from '../models/Patient.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const populateVitals = [
  { path: 'patient', select: 'name' },
  { path: 'doctor', select: 'name specialization' },
  { path: 'appointment', select: 'date timeSlot' },
];

function stripEmptyBp(bp) {
  if (!bp || typeof bp !== 'object') return undefined;
  const s = bp.systolic;
  const d = bp.diastolic;
  if (s == null && d == null) return undefined;
  const out = {};
  if (s != null && s !== '') out.systolic = Number(s);
  if (d != null && d !== '') out.diastolic = Number(d);
  return Object.keys(out).length ? out : undefined;
}

// POST /api/vitals
export const createVitals = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    appointmentId,
    recordedAt,
    bloodPressure,
    heartRate,
    temperature,
    weight,
    height,
    oxygenSaturation,
    bloodGlucose,
    notes,
  } = req.body;

  if (!patientId) {
    return next(new AppError('Patient ID is required.', 400));
  }

  const patient = await Patient.findOne({
    _id: patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found in this clinic.', 404));
  }

  const bp = stripEmptyBp(bloodPressure);

  const payload = {
    clinic: req.user.clinic,
    patient: patientId,
    doctor: req.user._id,
    appointment: appointmentId || null,
    recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
  };
  if (bp) payload.bloodPressure = bp;
  if (heartRate != null && heartRate !== '') payload.heartRate = Number(heartRate);
  if (temperature != null && temperature !== '') payload.temperature = Number(temperature);
  if (weight != null && weight !== '') payload.weight = Number(weight);
  if (height != null && height !== '') payload.height = Number(height);
  if (oxygenSaturation != null && oxygenSaturation !== '')
    payload.oxygenSaturation = Number(oxygenSaturation);
  if (bloodGlucose != null && bloodGlucose !== '') payload.bloodGlucose = Number(bloodGlucose);
  if (notes?.trim()) payload.notes = notes.trim();

  const doc = await VitalSigns.create(payload);

  await doc.populate(populateVitals);

  res.status(201).json({
    success: true,
    message: 'Vital signs recorded.',
    vitals: doc,
  });
});

// GET /api/vitals/patient/:patientId
export const getVitalsByPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  const vitals = await VitalSigns.find({ patient: patient._id, clinic: req.user.clinic })
    .sort({ recordedAt: -1 })
    .populate(populateVitals)
    .lean();

  res.status(200).json({
    success: true,
    count: vitals.length,
    vitals,
  });
});

// GET /api/vitals/latest/:patientId
export const getLatestVitals = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  const vitals = await VitalSigns.findOne({
    patient: patient._id,
    clinic: req.user.clinic,
  })
    .sort({ recordedAt: -1 })
    .populate(populateVitals);

  res.status(200).json({
    success: true,
    vitals: vitals || null,
  });
});

// GET /api/vitals/recent-count — vitals recorded by this user (doctor/admin) in last 7 days
export const getRecentVitalsCount = asyncHandler(async (req, res, next) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const count = await VitalSigns.countDocuments({
    clinic: req.user.clinic,
    doctor: req.user._id,
    createdAt: { $gte: since },
  });

  res.status(200).json({
    success: true,
    count,
    periodDays: 7,
  });
});
