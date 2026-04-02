import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Clinic from '../models/Clinic.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

/** Parse "10:00 AM - 10:30 AM" start → minutes from midnight for sorting */
function slotStartMinutes(timeSlot) {
  if (!timeSlot) return 0;
  const start = timeSlot.split(' - ')[0]?.trim();
  const match = start.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ap = match[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function patientFirstName(name) {
  if (!name || typeof name !== 'string') return 'Patient';
  const parts = name.trim().split(/\s+/);
  return parts[0] || 'Patient';
}

function formatQueueAppointment(apt) {
  const room = apt.doctor?.consultationRoom?.trim();
  return {
    _id: apt._id,
    timeSlot: apt.timeSlot,
    status: apt.status,
    patientFirstName: patientFirstName(apt.patient?.name),
    doctorName: apt.doctor?.name ? `Dr. ${apt.doctor.name}` : '—',
    consultationRoom: room || 'Consultation',
  };
}

// ── BOOK APPOINTMENT ─────────────────────────────────────────────────
export const bookAppointment = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, date, timeSlot, type, symptoms } = req.body;

  // Verify patient belongs to this clinic
  const patient = await Patient.findOne({ _id: patientId, clinic: req.user.clinic });
  if (!patient) {
    return next(new AppError('Patient not found in this clinic.', 404));
  }

  // Verify doctor belongs to this clinic
  const doctor = await User.findOne({
    _id: doctorId,
    clinic: req.user.clinic,
    role: 'doctor',
    isActive: true,
  });
  if (!doctor) {
    return next(new AppError('Doctor not found in this clinic.', 404));
  }

  // Validate doctor availability for this day/time
const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const dayOfWeek = dayNames[new Date(date).getDay()];
const daySchedule = doctor.availability?.[dayOfWeek];

if (!daySchedule?.isAvailable) {
  return next(
    new AppError(
      `Dr. ${doctor.name} is not available on ${dayOfWeek}s. Please choose another day.`,
      400
    )
  );
}

// Validate timeSlot is within working hours
if (daySchedule.startTime && daySchedule.endTime) {
  const slotStart = timeSlot.split(' - ')[0];
  const toMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH,   endM]   = daySchedule.endTime.split(':').map(Number);
  const workStart  = startH * 60 + startM;
  const workEnd    = endH   * 60 + endM;
  const slotMinute = toMinutes(slotStart);

  if (slotMinute < workStart || slotMinute >= workEnd) {
    return next(
      new AppError(
        `This time slot is outside Dr. ${doctor.name}'s working hours (${daySchedule.startTime} - ${daySchedule.endTime}).`,
        400
      )
    );
  }
}

  // Check doctor doesn't already have appointment at this time slot
  const conflict = await Appointment.findOne({
    clinic: req.user.clinic,
    doctor: doctorId,
    date: new Date(date),
    timeSlot,
    status: { $in: ['pending', 'confirmed'] },
  });
  if (conflict) {
    return next(new AppError('This time slot is already booked for this doctor.', 400));
  }

  const appointment = await Appointment.create({
    clinic: req.user.clinic,
    patient: patientId,
    doctor: doctorId,
    bookedBy: req.user._id,
    date: new Date(date),
    timeSlot,
    type: type || 'consultation',
    symptoms,
    status: 'pending',
    fee: doctor.consultationFee || 500, // auto-attach doctor's fee
    feePaid: false,
    paymentMethod: 'pending',
  });
  await appointment.populate([
    { path: 'patient', select: 'name age gender phone' },
    { path: 'doctor', select: 'name specialization' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully.',
    appointment,
  });
});

// ── GET ALL APPOINTMENTS ─────────────────────────────────────────────
export const getAppointments = asyncHandler(async (req, res, next) => {
    const { date, status, doctorId, page = 1, limit = 20 } = req.query;
  
    const query = { clinic: req.user.clinic };
  
    // ── Role-based filtering ─────────────────────────────────────────
    if (req.user.role === 'doctor') {
      // Doctors only see their own appointments
      query.doctor = req.user._id;
  
    } else if (req.user.role === 'patient') {
      // Patients only see appointments linked to their patient record
      const Patient = (await import('../models/Patient.js')).default;
      const patientRecord = await Patient.findOne({
        userAccount: req.user._id,
        clinic: req.user.clinic,
      });
  
      if (!patientRecord) {
        // No patient record linked — return empty
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: 1,
          appointments: [],
        });
      }
  
      query.patient = patientRecord._id;
  
    } else {
      // Admin and receptionist — can filter by doctor
      if (doctorId) query.doctor = doctorId;
    }
  
    // ── Optional filters ─────────────────────────────────────────────
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
  
    if (status) query.status = status;
  
    const skip = (parseInt(page) - 1) * parseInt(limit);
  
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ date: 1, timeSlot: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('patient', 'name age gender phone')
        .populate('doctor', 'name specialization')
        .populate('bookedBy', 'name role'),
      Appointment.countDocuments(query),
    ]);
  
    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      appointments,
    });
  });

// ── GET SINGLE APPOINTMENT ───────────────────────────────────────────
export const getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  })
    .populate('patient', 'name age gender phone bloodGroup allergies')
    .populate('doctor', 'name specialization qualification')
    .populate('bookedBy', 'name role');

  if (!appointment) {
    return next(new AppError('Appointment not found.', 404));
  }

  res.status(200).json({ success: true, appointment });
});

// ── UPDATE APPOINTMENT STATUS ────────────────────────────────────────
export const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status, notes, cancelReason } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status value.', 400));
  }

  // Role-based status rules
  if (status === 'completed' && req.user.role !== 'doctor') {
    return next(new AppError('Only doctors can mark appointments as completed.', 403));
  }

  const updateData = { status };
  if (notes) updateData.notes = notes;
  if (cancelReason) updateData.cancelReason = cancelReason;

  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, clinic: req.user.clinic },
    updateData,
    { new: true }
  )
    .populate('patient', 'name age phone')
    .populate('doctor', 'name specialization');

  if (!appointment) {
    return next(new AppError('Appointment not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: `Appointment ${status} successfully.`,
    appointment,
  });
});

// ── GET DOCTOR SCHEDULE ──────────────────────────────────────────────
export const getDoctorSchedule = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;

  const targetDoctor = doctorId || req.user._id;

  const startOfDay = new Date(date || Date.now());
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date || Date.now());
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    clinic: req.user.clinic,
    doctor: targetDoctor,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' },
  })
    .sort({ timeSlot: 1 })
    .populate('patient', 'name age gender phone');

  res.status(200).json({
    success: true,
    date: startOfDay.toDateString(),
    count: appointments.length,
    appointments,
  });
});

// ── CANCEL APPOINTMENT ───────────────────────────────────────────────
export const cancelAppointment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    clinic: req.user.clinic,
  });

  if (!appointment) {
    return next(new AppError('Appointment not found.', 404));
  }

  if (appointment.status === 'completed') {
    return next(new AppError('Cannot cancel a completed appointment.', 400));
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = reason || 'No reason provided';
  await appointment.save();

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully.',
    appointment,
  });
});

// ── MARK FEE AS PAID ─────────────────────────────────────────────────
export const markFeePaid = asyncHandler(async (req, res, next) => {
    const { paymentMethod } = req.body;
  
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clinic: req.user.clinic,
    });
  
    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }
  
    if (appointment.feePaid) {
      return next(new AppError('Fee already marked as paid.', 400));
    }
  
    appointment.feePaid = true;
    appointment.paymentMethod = paymentMethod || 'cash';
    await appointment.save();
  
    res.status(200).json({
      success: true,
      message: 'Fee marked as paid.',
      appointment,
    });
  });

  // ── GET AVAILABLE SLOTS ───────────────────────────────────────────────
export const getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return next(new AppError('doctorId and date are required.', 400));
  }

  // Get doctor with availability
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isActive: true,
  });

  if (!doctor) {
    return next(new AppError('Doctor not found.', 404));
  }

  // Get day name from date
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dayOfWeek = dayNames[new Date(date).getDay()];
  const daySchedule = doctor.availability?.[dayOfWeek];

  // Doctor not available this day
  if (!daySchedule?.isAvailable) {
    return res.status(200).json({
      success: true,
      available: false,
      message: `Dr. ${doctor.name} is not available on ${dayOfWeek}s.`,
      slots: [],
    });
  }

  // Generate all slots for the day
  const slots = [];
  const slotDuration = doctor.availability?.slotDurationMinutes || 30;
  const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
  const [endHour,   endMin]   = daySchedule.endTime.split(':').map(Number);

  let current = startHour * 60 + startMin;
  const end   = endHour   * 60 + endMin;

  while (current + slotDuration <= end) {
    const h1 = Math.floor(current / 60);
    const m1 = current % 60;
    const h2 = Math.floor((current + slotDuration) / 60);
    const m2 = (current + slotDuration) % 60;

    const fmt = (h, m) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${hour}:${String(m).padStart(2, '0')} ${period}`;
    };

    slots.push(`${fmt(h1, m1)} - ${fmt(h2, m2)}`);
    current += slotDuration;
  }

  // Remove already booked slots for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
  });

  const bookedSlots = new Set(bookedAppointments.map(a => a.timeSlot));
  const availableSlots = slots.filter(s => !bookedSlots.has(s));

  res.status(200).json({
    success: true,
    available: true,
    day: dayOfWeek,
    workingHours: `${daySchedule.startTime} - ${daySchedule.endTime}`,
    totalSlots: slots.length,
    bookedCount: bookedSlots.size,
    slots: availableSlots,
  });
});

// ── PUBLIC QUEUE DISPLAY (waiting room TV — no auth) ─────────────────
export const getAppointmentQueue = asyncHandler(async (req, res, next) => {
  const { date, clinicId } = req.query;

  if (!clinicId || !mongoose.isValidObjectId(clinicId)) {
    return next(new AppError('A valid clinicId query parameter is required.', 400));
  }

  const clinic = await Clinic.findById(clinicId).select('name');
  if (!clinic) {
    return next(new AppError('Clinic not found.', 404));
  }

  const day = date ? new Date(date) : new Date();
  if (Number.isNaN(day.getTime())) {
    return next(new AppError('Invalid date.', 400));
  }

  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    clinic: clinicId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('patient', 'name')
    .populate('doctor', 'name consultationRoom')
    .lean();

  const waiting = appointments.filter((a) => a.status === 'pending').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const totalToday = appointments.filter(
    (a) => !['cancelled', 'no-show'].includes(a.status)
  ).length;

  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  let currentlyWith = null;
  if (confirmed.length > 0) {
    currentlyWith = [...confirmed].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    )[0];
  }

  const currentId = currentlyWith?._id?.toString();

  const queueSorted = appointments
    .filter((a) => ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => slotStartMinutes(a.timeSlot) - slotStartMinutes(b.timeSlot));

  const upNext = queueSorted
    .filter((a) => a._id.toString() !== currentId)
    .slice(0, 3)
    .map(formatQueueAppointment);

  res.status(200).json({
    success: true,
    clinicName: clinic.name,
    lastUpdated: new Date().toISOString(),
    currentlyWith: currentlyWith ? formatQueueAppointment(currentlyWith) : null,
    upNext,
    waiting,
    completed,
    totalToday,
  });
});