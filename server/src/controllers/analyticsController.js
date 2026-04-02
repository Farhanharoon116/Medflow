import asyncHandler from '../utils/asyncHandler.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import DiagnosisLog from '../models/DiagnosisLog.js';
import User from '../models/User.js';

// ── ADMIN DASHBOARD ANALYTICS ────────────────────────────────────────
export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinic;

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Run all queries in parallel for speed
  const [
    totalPatients,
    newPatientsThisMonth,
    totalDoctors,
    totalReceptionists,
    totalAppointments,
    appointmentsThisMonth,
    completedThisMonth,
    cancelledThisMonth,
    totalPrescriptions,
    appointmentsByDay,
    appointmentsByStatus,
    topDiagnoses,
    doctorPerformance,
    revenueThisMonthResult,  
    revenueTotalResult,     
  ] = await Promise.all([
    // Total counts
    Patient.countDocuments({ clinic: clinicId, isActive: true }),
    Patient.countDocuments({ clinic: clinicId, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ clinic: clinicId, role: 'doctor', isActive: true }),
    User.countDocuments({ clinic: clinicId, role: 'receptionist', isActive: true }),
    Appointment.countDocuments({ clinic: clinicId }),
    Appointment.countDocuments({ clinic: clinicId, createdAt: { $gte: startOfMonth } }),
    Appointment.countDocuments({ clinic: clinicId, status: 'completed', createdAt: { $gte: startOfMonth } }),
    Appointment.countDocuments({ clinic: clinicId, status: 'cancelled', createdAt: { $gte: startOfMonth } }),
    Prescription.countDocuments({ clinic: clinicId }),

    // Appointments per day for the last 30 days (for line chart)
    Appointment.aggregate([
      {
        $match: {
          clinic: clinicId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Appointments by status (for pie chart)
    Appointment.aggregate([
      { $match: { clinic: clinicId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Top diagnoses (for bar chart)
    Prescription.aggregate([
      { $match: { clinic: clinicId } },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    // Doctor performance
    Appointment.aggregate([
      { $match: { clinic: clinicId, status: 'completed' } },
      { $group: { _id: '$doctor', completedAppointments: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          doctorName: '$doctor.name',
          specialization: '$doctor.specialization',
          completedAppointments: 1,
        },
      },
      { $sort: { completedAppointments: -1 } },
    ]),
Appointment.aggregate([
    {
      $match: {
        clinic: clinicId,
        feePaid: true,
        createdAt: { $gte: startOfMonth },
      },
    },
    { $group: { _id: null, total: { $sum: '$fee' } } },
  ]),
  
  Appointment.aggregate([
    {
      $match: { clinic: clinicId, feePaid: true },
    },
    { $group: { _id: null, total: { $sum: '$fee' } } },
  ]),
  ]);

  // Calculate growth percentage vs last month
  const patientsLastMonth = await Patient.countDocuments({
    clinic: clinicId,
    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
  });

  const patientGrowth =
    patientsLastMonth === 0
      ? 100
      : Math.round(((newPatientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100);

  res.status(200).json({
    success: true,
    analytics: {
      overview: {
        totalPatients,
        newPatientsThisMonth,
        patientGrowth,
        totalDoctors,
        totalReceptionists,
        totalAppointments,
        appointmentsThisMonth,
        completedThisMonth,
        cancelledThisMonth,
        totalPrescriptions,
        completionRate:
          appointmentsThisMonth === 0
            ? 0
            : Math.round((completedThisMonth / appointmentsThisMonth) * 100),
      },
      charts: {
        appointmentsByDay,
        appointmentsByStatus,
        topDiagnoses,
        doctorPerformance,
        revenueThisMonth: revenueThisMonthResult[0]?.total || 0,
       revenueTotal: revenueTotalResult[0]?.total || 0,
      },
    },
  });
});

// ── DOCTOR DASHBOARD ANALYTICS ───────────────────────────────────────
export const getDoctorAnalytics = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const clinicId = req.user.clinic;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));

  const [
    todayAppointments,
    monthAppointments,
    totalPatientsSeen,
    totalPrescriptions,
    appointmentsByStatus,
    recentAppointments,
  ] = await Promise.all([
    Appointment.countDocuments({
      doctor: doctorId,
      clinic: clinicId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }),
    Appointment.countDocuments({
      doctor: doctorId,
      clinic: clinicId,
      createdAt: { $gte: startOfMonth },
    }),
    Appointment.distinct('patient', {
      doctor: doctorId,
      clinic: clinicId,
      status: 'completed',
    }),
    Prescription.countDocuments({ doctor: doctorId, clinic: clinicId }),
    Appointment.aggregate([
      { $match: { doctor: doctorId, clinic: clinicId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.find({
      doctor: doctorId,
      clinic: clinicId,
      date: { $gte: startOfToday, $lte: endOfToday },
    })
      .sort({ timeSlot: 1 })
      .limit(10)
      .populate('patient', 'name age gender phone'),
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      overview: {
        todayAppointments,
        monthAppointments,
        totalPatientsSeen: totalPatientsSeen.length,
        totalPrescriptions,
      },
      charts: { appointmentsByStatus },
      recentAppointments,
    },
  });
});