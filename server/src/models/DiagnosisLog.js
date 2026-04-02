import mongoose from 'mongoose';

const diagnosisLogSchema = new mongoose.Schema(
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
    // What the doctor entered
    inputSymptoms: {
      type: String,
      required: true,
    },
    patientAge: Number,
    patientGender: String,
    relevantHistory: String,
    // What AI returned
    aiResponse: {
      conditions: [String],
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      suggestedTests: [String],
      reasoning: String,
    },
    // Was AI available or did it fallback?
    aiAvailable: {
      type: Boolean,
      default: true,
    },
    // Doctor's final confirmed diagnosis (may differ from AI)
    confirmedDiagnosis: String,
  },
  { timestamps: true }
);

diagnosisLogSchema.index({ clinic: 1, createdAt: -1 });
diagnosisLogSchema.index({ clinic: 1, patient: 1 });

const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
export default DiagnosisLog;
