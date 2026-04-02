import LabResult from '../models/LabResult.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import cloudinary from '../config/cloudinary.js';

const populateLab = [
  { path: 'uploadedBy', select: 'name role' },
  { path: 'doctor', select: 'name specialization' },
  { path: 'patient', select: 'name' },
];

function fileTypeFromMimetype(mimetype) {
  if (mimetype === 'application/pdf') return 'pdf';
  if (/^image\//.test(mimetype || '')) return 'image';
  return null;
}

// POST /api/labs/upload (multipart: file + fields)
export const uploadLabResult = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('A file is required.', 400));
  }

  const {
    patientId,
    testName,
    testDate,
    labName,
    doctorId,
    notes,
    isSharedWithPatient,
  } = req.body;

  if (!patientId || !testName || !testDate) {
    return next(new AppError('patientId, testName, and testDate are required.', 400));
  }

  const patient = await Patient.findOne({
    _id: patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found in this clinic.', 404));
  }

  let doctorRef = null;
  const rawDoctor = doctorId && String(doctorId).trim();
  if (rawDoctor) {
    const docUser = await User.findOne({
      _id: rawDoctor,
      clinic: req.user.clinic,
      role: 'doctor',
      isActive: true,
    });
    if (!docUser) {
      return next(new AppError('Ordering doctor not found in this clinic.', 400));
    }
    doctorRef = docUser._id;
  }

  const fileType = fileTypeFromMimetype(req.file.mimetype);
  if (!fileType) {
    return next(new AppError('Unsupported file type.', 400));
  }

  const shared =
    isSharedWithPatient === false ||
    isSharedWithPatient === 'false'
      ? false
      : true;

  const lab = await LabResult.create({
    clinic: req.user.clinic,
    patient: patientId,
    uploadedBy: req.user._id,
    doctor: doctorRef,
    testName: testName.trim(),
    testDate: new Date(testDate),
    labName: labName?.trim() || undefined,
    fileUrl: req.file.path,
    fileType,
    publicId: req.file.filename,
    notes: notes?.trim() || undefined,
    status: 'pending-review',
    isSharedWithPatient: shared,
  });

  await lab.populate(populateLab);

  res.status(201).json({
    success: true,
    message: 'Lab result uploaded successfully.',
    labResult: lab,
  });
});

// GET /api/labs/patient/:patientId
export const getLabsByPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({
    _id: req.params.patientId,
    clinic: req.user.clinic,
  });
  if (!patient) {
    return next(new AppError('Patient not found.', 404));
  }

  const results = await LabResult.find({
    patient: patient._id,
    clinic: req.user.clinic,
  })
    .sort({ testDate: -1 })
    .populate(populateLab);

  res.status(200).json({
    success: true,
    count: results.length,
    labResults: results,
  });
});

// GET /api/labs/my-results — patient only
export const getMyLabResults = asyncHandler(async (req, res, next) => {
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

  const results = await LabResult.find({
    patient: patient._id,
    clinic: req.user.clinic,
    isSharedWithPatient: true,
  })
    .sort({ testDate: -1 })
    .populate(populateLab);

  res.status(200).json({
    success: true,
    count: results.length,
    labResults: results,
  });
});

// PATCH /api/labs/:id/notes
export const updateLabNotes = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  if (notes === undefined) {
    return next(new AppError('notes field is required.', 400));
  }

  const lab = await LabResult.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!lab) {
    return next(new AppError('Lab result not found.', 404));
  }

  lab.notes = notes?.trim() || '';
  await lab.save();
  await lab.populate(populateLab);

  res.status(200).json({
    success: true,
    message: 'Notes updated.',
    labResult: lab,
  });
});

// PATCH /api/labs/:id/status
export const updateLabStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const allowed = ['pending-review', 'reviewed', 'normal', 'abnormal'];
  if (!status || !allowed.includes(status)) {
    return next(new AppError(`status must be one of: ${allowed.join(', ')}`, 400));
  }

  const lab = await LabResult.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!lab) {
    return next(new AppError('Lab result not found.', 404));
  }

  lab.status = status;
  await lab.save();
  await lab.populate(populateLab);

  res.status(200).json({
    success: true,
    message: 'Status updated.',
    labResult: lab,
  });
});

// DELETE /api/labs/:id — admin only
export const deleteLabResult = asyncHandler(async (req, res, next) => {
  const lab = await LabResult.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!lab) {
    return next(new AppError('Lab result not found.', 404));
  }

  const resourceType = lab.fileType === 'pdf' ? 'raw' : 'image';

  try {
    await cloudinary.uploader.destroy(lab.publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
    try {
      await cloudinary.uploader.destroy(lab.publicId, {
        resource_type: resourceType === 'raw' ? 'image' : 'raw',
        invalidate: true,
      });
    } catch (err2) {
      console.error('Cloudinary delete retry failed:', err2.message);
    }
  }

  await lab.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Lab result deleted.',
  });
});
