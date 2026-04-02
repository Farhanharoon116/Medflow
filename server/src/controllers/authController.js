import mongoose from 'mongoose';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import Patient from '../models/Patient.js'; // ← THIS was missing
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import {
  sendTokens,
} from '../utils/generateTokens.js';
import jwt from 'jsonwebtoken';
import {
  sendWelcomeEmail,
  sendStaffWelcomeEmail,
} from '../services/emailService.js';

// ── REGISTER ADMIN + CLINIC ──────────────────────────────────────────
export const registerAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, clinicName, phone, city } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 400));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const admin = await User.create(
      [
        {
          name,
          email,
          password,
          role: 'admin',
          phone: phone || '',
          plan: 'free',
        },
      ],
      { session }
    );

    const clinic = await Clinic.create(
      [
        {
          name: clinicName,
          phone: phone || '',
          city: city || '',
          owner: admin[0]._id,
          plan: 'free',
          patientLimit: 30,
        },
      ],
      { session }
    );

    // Link clinic back to admin
    admin[0].clinic = clinic[0]._id;
    await admin[0].save({ validateBeforeSave: false, session });

    await session.commitTransaction();
    session.endSession();

    // Non-blocking welcome email
    void sendWelcomeEmail(admin[0], clinic[0]).catch(() => {});

    await sendTokens(admin[0], 201, res);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

// ── REGISTER PATIENT (self-registration) ────────────────────────────
export const registerPatient = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, age, gender, clinicCode } = req.body;

  // Validate required fields
  if (!name || !email || !password || !clinicCode) {
    return next(
      new AppError('Name, email, password and clinic code are required.', 400)
    );
  }
  if (!age || !gender) {
    return next(
      new AppError('Age and gender are required for patient registration.', 400)
    );
  }

  // Find clinic by ID
  const clinic = await Clinic.findById(clinicCode).catch(() => null);
  if (!clinic) {
    return next(
      new AppError(
        'Invalid clinic code. Ask your receptionist for the correct Clinic ID.',
        404
      )
    );
  }

  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new AppError('An account with this email already exists.', 400)
    );
  }

  // 1. Create the user account
  const user = await User.create({
    name,
    email,
    password,
    role: 'patient',
    clinic: clinic._id,
    phone: phone || '',
    plan: clinic.plan,
  });

  // 2. Create the linked patient record in the patients collection
  const patient = await Patient.create({
    clinic: clinic._id,
    name,
    age: parseInt(age),
    gender,
    phone: phone || '',
    email,
    userAccount: user._id,
    registeredBy: user._id,
  });

  // 3. Link patient record back to user
  user.patientRecord = patient._id;
  await user.save({ validateBeforeSave: false });

  console.log(`✅ Patient registered: ${name} | Patient record ID: ${patient._id}`);

  await sendTokens(user, 201, res);
});

// ── LOGIN ────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isActive) {
    return next(
      new AppError('Your account has been deactivated. Contact admin.', 401)
    );
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid email or password.', 401));
  }

  await sendTokens(user, 200, res);
});

// ── ADD STAFF (Doctor / Receptionist) ────────────────────────────────
export const addStaff = asyncHandler(async (req, res, next) => {
  const {
    name, email, password, role,
    specialization, qualification, phone,
  } = req.body;

  if (!['doctor', 'receptionist'].includes(role)) {
    return next(
      new AppError('You can only create doctor or receptionist accounts.', 400)
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(
      new AppError('An account with this email already exists.', 400)
    );
  }

  const staff = await User.create({
    name,
    email,
    password,
    role,
    clinic: req.user.clinic,
    phone,
    specialization,
    qualification,
    plan: req.user.plan,
  });

  const clinic = await Clinic.findById(req.user.clinic);

  staff.password = undefined;

  // Non-blocking staff welcome email
  void sendStaffWelcomeEmail(staff, clinic, password).catch(() => {});

  res.status(201).json({
    success: true,
    message: `${role} account created successfully.`,
    user: staff,
  });
});

// ── GET ALL STAFF ────────────────────────────────────────────────────
export const getStaff = asyncHandler(async (req, res, next) => {
  const staff = await User.find({
    clinic: req.user.clinic,
    role: { $in: ['doctor', 'receptionist'] },
    isActive: true,
  }).select('-password -refreshToken');

  res.status(200).json({ success: true, staff });
});

// ── UPDATE DOCTOR FEE ─────────────────────────────────────────────────
export const updateDoctorFee = asyncHandler(async (req, res, next) => {
  const { consultationFee } = req.body;

  if (consultationFee === undefined || consultationFee < 0) {
    return next(new AppError('Valid consultation fee is required.', 400));
  }

  const doctor = await User.findOneAndUpdate(
    { _id: req.params.id, clinic: req.user.clinic, role: 'doctor' },
    { consultationFee },
    { new: true }
  ).select('-password -refreshToken');

  if (!doctor) {
    return next(new AppError('Doctor not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Consultation fee updated.',
    doctor,
  });
});

// ── REFRESH TOKEN ─────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(
      new AppError('No refresh token found. Please log in again.', 401)
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return next(
      new AppError('Invalid or expired refresh token. Please log in again.', 401)
    );
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    return next(
      new AppError('Refresh token mismatch. Please log in again.', 401)
    );
  }

  await sendTokens(user, 200, res);
});

// ── LOGOUT ────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// ── GET CURRENT USER ──────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate(
    'clinic',
    'name plan logo address phone email city onboardingDismissed'
  );

  res.status(200).json({ success: true, user });
});

// ── GET CLINIC INFO (public — for patient registration) ───────────────
export const getClinicInfo = asyncHandler(async (req, res, next) => {
  const clinic = await Clinic.findById(req.params.id).select(
    'name address phone logo'
  );
  if (!clinic) return next(new AppError('Clinic not found.', 404));
  res.status(200).json({ success: true, clinic });
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  await sendTokens(user, 200, res);
});

// ── UPDATE SUBSCRIPTION PLAN ──────────────────────────────────────────
export const updatePlan = asyncHandler(async (req, res, next) => {
  const { plan } = req.body;

  if (!['free', 'pro'].includes(plan)) {
    return next(new AppError('Invalid plan.', 400));
  }

  await User.updateMany({ clinic: req.user.clinic }, { plan });
  await Clinic.findByIdAndUpdate(req.user.clinic, {
    plan,
    patientLimit: plan === 'pro' ? 999999 : 30,
  });

  const updatedUser = await User.findById(req.user._id).populate('clinic');

  res.status(200).json({
    success: true,
    message: `Plan updated to ${plan} successfully.`,
    user: updatedUser,
  });
});

// ── GET ALL DOCTORS with availability ────────────────────────────────
export const getDoctors = asyncHandler(async (req, res, next) => {
  const doctors = await User.find({
    clinic: req.user.clinic,
    role: 'doctor',
    isActive: true,
  }).select('-password -refreshToken');

  res.status(200).json({ success: true, doctors });
});

// ── UPDATE DOCTOR AVAILABILITY ────────────────────────────────────────
export const updateAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;

  const doctor = await User.findOneAndUpdate(
    { _id: req.params.id, clinic: req.user.clinic, role: 'doctor' },
    { availability },
    { new: true, runValidators: false }
  ).select('-password -refreshToken');

  if (!doctor) {
    return next(new AppError('Doctor not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Availability updated successfully.',
    doctor,
  });
});

// ── UPDATE CLINIC PROFILE ───────────────────────────────────────────
export const updateClinicProfile = asyncHandler(async (req, res, next) => {
  const clinicId = req.user.clinic;

  const allowedFields = [
    'name',
    'address',
    'phone',
    'email',
    'city',
    'logo',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Normalize empty strings -> undefined so Mongo doesn't store empty values
  Object.keys(updates).forEach((k) => {
    if (typeof updates[k] === 'string' && updates[k].trim() === '') {
      updates[k] = '';
    }
  });

  const clinic = await Clinic.findOneAndUpdate(
    { _id: clinicId },
    { $set: updates },
    { new: true, runValidators: true }
  ).select('name address phone email city logo onboardingDismissed');

  if (!clinic) return next(new AppError('Clinic not found.', 404));

  res.status(200).json({
    success: true,
    message: 'Clinic profile updated.',
    clinic,
  });
});

// ── UPLOAD CLINIC LOGO (Cloudinary) ──────────────────────────────────
export const uploadClinicLogoUrl = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('A file is required.', 400));

  res.status(201).json({
    success: true,
    logoUrl: req.file.path, // CloudinaryStorage sets the public URL here
  });
});