import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import DiagnosisLog from '../models/DiagnosisLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { generatePrescriptionPDF, uploadPDFToCloudinary } from '../services/pdfService.js';
import { explainPrescription } from '../services/geminiService.js';

// ── CREATE PRESCRIPTION ──────────────────────────────────────────────
export const createPrescription = asyncHandler(async (req, res, next) => {
  const {
    patientId,
    appointmentId,
    medicines,
    diagnosis,
    instructions,
    followUpDate,
    generateAiExplanation,
  } = req.body;

  // Verify patient belongs to clinic
  const patient = await Patient.findOne({
    _id: patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  // Validate medicines array
  if (!medicines || medicines.length === 0) {
    return next(new AppError('At least one medicine is required.', 400));
  }

  // Create prescription in DB first
  const prescription = await Prescription.create({
    clinic: req.user.clinic,
    patient: patientId,
    doctor: req.user._id,
    appointment: appointmentId || null,
    medicines,
    diagnosis,
    instructions,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
  });

  // Populate for PDF generation
  await prescription.populate([
    { path: 'patient', select: 'name age gender phone bloodGroup' },
    { path: 'doctor', select: 'name specialization qualification' },
    { path: 'clinic', select: 'name address phone' },
  ]);

  // Generate PDF in background — don't make user wait
  try {
    const pdfBuffer = await generatePrescriptionPDF(prescription.toObject());
    const filename = `prescription_${prescription._id}_${Date.now()}`;
    const pdfUrl = await uploadPDFToCloudinary(pdfBuffer, filename);

    prescription.pdfUrl = pdfUrl;
    await prescription.save();
  } catch (pdfError) {
    // PDF generation failed but prescription is saved — not a blocking error
    console.error('PDF generation failed:', pdfError.message);
  }

  // AI explanation — only for Pro plan and if requested
  if (generateAiExplanation && req.user.plan === 'pro') {
    try {
      const aiResult = await explainPrescription({
        medicines,
        diagnosis,
        instructions,
        language: 'english',
      });

      if (aiResult.success) {
        prescription.aiExplanation = aiResult.explanation;
      }

      // Also generate Urdu version
      const urduResult = await explainPrescription({
        medicines,
        diagnosis,
        instructions,
        language: 'urdu',
      });

      if (urduResult.success) {
        prescription.aiExplanationUrdu = urduResult.explanation;
      }

      await prescription.save();
    } catch (aiError) {
      console.error('AI explanation failed:', aiError.message);
      // Non-blocking — prescription still works without AI
    }
  }

  res.status(201).json({
    success: true,
    message: 'Prescription created successfully.',
    prescription,
  });
});

// ── GET PRESCRIPTIONS ────────────────────────────────────────────────
export const getPrescriptions = asyncHandler(async (req, res, next) => {
    const { patientId, page = 1, limit = 20 } = req.query;
    const query = { clinic: req.user.clinic };
  
    // ── Role-based filtering ─────────────────────────────────────────
    if (req.user.role === 'patient') {
      // Find their linked patient record
      const { default: Patient } = await import('../models/Patient.js');
      const patientRecord = await Patient.findOne({
        userAccount: req.user._id,
        clinic: req.user.clinic,
      });
  
      if (!patientRecord) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: 1,
          prescriptions: [],
        });
      }
  
      query.patient = patientRecord._id;
  
    } else if (req.user.role === 'doctor') {
      // Doctors see their own prescriptions
      query.doctor = req.user._id;
      if (patientId) query.patient = patientId;
  
    } else {
      // Admin and receptionist
      if (patientId) query.patient = patientId;
    }
  
    const skip = (parseInt(page) - 1) * parseInt(limit);
  
    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('patient', 'name age gender phone')
        .populate('doctor', 'name specialization'),
      Prescription.countDocuments(query),
    ]);
  
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      prescriptions,
    });
  });

// ── GET SINGLE PRESCRIPTION ──────────────────────────────────────────
export const getPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  })
    .populate('patient', 'name age gender phone bloodGroup allergies')
    .populate('doctor', 'name specialization qualification')
    .populate('appointment', 'date timeSlot type');

  if (!prescription) {
    return next(new AppError('Prescription not found.', 404));
  }

  res.status(200).json({ success: true, prescription });
});

// ── DOWNLOAD PRESCRIPTION PDF ────────────────────────────────────────
export const downloadPrescription = asyncHandler(async (req, res, next) => {
  // No clinic filter — route is public, prescription ID is the access key
  const prescription = await Prescription.findById(req.params.id)
    .populate([
      { path: 'patient', select: 'name age gender phone bloodGroup' },
      { path: 'doctor',  select: 'name specialization qualification' },
      { path: 'clinic',  select: 'name address phone' },
    ]);

  if (!prescription) {
    return next(new AppError('Prescription not found.', 404));
  }

  // Try Cloudinary URL first
  if (prescription.pdfUrl) {
    return res.redirect(prescription.pdfUrl);
  }

  // Fallback: generate PDF on the fly and stream directly
  try {
    const pdfBuffer = await generatePrescriptionPDF(prescription.toObject());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=prescription_${prescription._id}.pdf`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    return next(new AppError('Failed to generate PDF.', 500));
  }
});

// ── AI SYMPTOM CHECK ─────────────────────────────────────────────────
export const aiSymptomCheck = asyncHandler(async (req, res, next) => {
  const { symptoms, patientId, relevantHistory } = req.body;

  if (!symptoms) {
    return next(new AppError('Symptoms are required.', 400));
  }

  // Get patient details for context
  const patient = await Patient.findOne({
    _id: patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  const { checkSymptoms } = await import('../services/geminiService.js');

  const aiResult = await checkSymptoms({
    symptoms,
    age: patient.age,
    gender: patient.gender,
    history: relevantHistory || patient.chronicConditions?.join(', '),
  });

  // Log the diagnosis attempt regardless of AI success
  const log = await DiagnosisLog.create({
    clinic: req.user.clinic,
    patient: patientId,
    doctor: req.user._id,
    inputSymptoms: symptoms,
    patientAge: patient.age,
    patientGender: patient.gender,
    relevantHistory,
    aiResponse: aiResult.error ? {} : aiResult,
    aiAvailable: !aiResult.error,
  });

  res.status(200).json({
    success: true,
    aiAvailable: !aiResult.error,
    result: aiResult,
    logId: log._id,
  });
});