import mongoose from 'mongoose';

const vitalSignsSchema = new mongoose.Schema(
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
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    bloodPressure: {
      systolic: { type: Number, min: 0, max: 300 },
      diastolic: { type: Number, min: 0, max: 200 },
    },
    heartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    temperature: {
      type: Number,
      min: 30,
      max: 45,
    },
    weight: {
      type: Number,
      min: 0,
      max: 500,
    },
    height: {
      type: Number,
      min: 0,
      max: 300,
    },
    oxygenSaturation: {
      type: Number,
      min: 0,
      max: 100,
    },
    bloodGlucose: {
      type: Number,
      min: 0,
      max: 1000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

vitalSignsSchema.index({ clinic: 1, patient: 1, recordedAt: -1 });
vitalSignsSchema.index({ clinic: 1, doctor: 1, createdAt: -1 });

const VitalSigns = mongoose.model('VitalSigns', vitalSignsSchema);
export default VitalSigns;
