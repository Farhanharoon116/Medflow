import Clinic from '../models/Clinic.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const TOTAL_STEPS = 5;

function hasClinicProfile(clinic) {
  return Boolean(clinic?.address && clinic?.phone);
}

export const getOnboardingStatus = asyncHandler(async (req, res, next) => {
  const clinicId = req.user.clinic;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return next(new AppError('Clinic not found.', 404));

  const [hasDoctor, hasReceptionist, hasPatient, hasAppointment] =
    await Promise.all([
      User.exists({ clinic: clinicId, role: 'doctor', isActive: true }),
      User.exists({ clinic: clinicId, role: 'receptionist', isActive: true }),
      Patient.exists({ clinic: clinicId, isActive: true }),
      Appointment.exists({ clinic: clinicId }),
    ]);

  const clinicProfileOk = hasClinicProfile(clinic);

  const stepFlags = [
    Boolean(hasDoctor),
    Boolean(hasReceptionist),
    Boolean(hasPatient),
    Boolean(hasAppointment),
    Boolean(clinicProfileOk),
  ];

  const completedCount = stepFlags.filter(Boolean).length;
  const isComplete =
    Boolean(clinic?.onboardingDismissed) || completedCount === TOTAL_STEPS;

  res.status(200).json({
    hasDoctor: Boolean(hasDoctor),
    hasReceptionist: Boolean(hasReceptionist),
    hasPatient: Boolean(hasPatient),
    hasAppointment: Boolean(hasAppointment),
    hasClinicProfile: Boolean(clinicProfileOk),
    isComplete,
    completedCount,
    totalSteps: TOTAL_STEPS,
  });
});

export const completeOnboarding = asyncHandler(async (req, res, next) => {
  const clinicId = req.user.clinic;
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) return next(new AppError('Clinic not found.', 404));

  clinic.onboardingDismissed = true;
  await clinic.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Onboarding dismissed permanently.',
    isComplete: true,
  });
});

