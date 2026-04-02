import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // doctors are users with role 'doctor'
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // receptionist or patient who booked
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String, // e.g. "10:00 AM - 10:30 AM"
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['consultation', 'follow-up', 'emergency', 'checkup'],
      default: 'consultation',
    },
    symptoms: String, // brief note from receptionist at booking
    notes: String,   // doctor's notes after appointment
    cancelReason: String,
    fee: {
        type: Number,
        default: 0,
      },
      feePaid: {
        type: Boolean,
        default: false,
      },
      paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'online', 'pending'],
        default: 'pending',
      },
  },
  { timestamps: true }
);

// Index for getting a doctor's schedule on a specific date
appointmentSchema.index({ clinic: 1, doctor: 1, date: 1 });
appointmentSchema.index({ clinic: 1, patient: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;