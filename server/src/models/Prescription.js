import mongoose from 'mongoose';

// Each medicine in a prescription is its own sub-document
const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },   // e.g. "500mg"
  frequency: { type: String, required: true }, // e.g. "Twice daily"
  duration: { type: String, required: true },  // e.g. "7 days"
  instructions: String,                        // e.g. "Take after meals"
});

const prescriptionSchema = new mongoose.Schema(
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
    medicines: [medicineSchema],
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
    },
    instructions: String, // general instructions beyond individual medicines
    followUpDate: Date,
    // PDF stored in Cloudinary
    pdfUrl: {
      type: String,
      default: null,
    },
    // AI-generated patient explanation (Pro plan only)
    aiExplanation: {
      type: String,
      default: null,
    },
    aiExplanationUrdu: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ clinic: 1, patient: 1 });
prescriptionSchema.index({ clinic: 1, doctor: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;