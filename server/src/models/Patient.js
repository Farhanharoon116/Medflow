import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    // Every patient belongs to one clinic — this is how multi-tenancy works
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Invalid age'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: String,
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    allergies: [String], // array of allergy strings e.g. ['Penicillin', 'Aspirin']
    chronicConditions: [String], // e.g. ['Diabetes', 'Hypertension']
    // Link to user account if patient self-registers
    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Who registered this patient (receptionist or doctor)
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast clinic-scoped searches
patientSchema.index({ clinic: 1, name: 1 });
patientSchema.index({ clinic: 1, phone: 1 });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;