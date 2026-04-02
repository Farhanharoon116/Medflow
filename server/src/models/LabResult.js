import mongoose from 'mongoose';

const labResultSchema = new mongoose.Schema(
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
    },
    labName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['pending-review', 'reviewed', 'normal', 'abnormal'],
      default: 'pending-review',
    },
    isSharedWithPatient: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

labResultSchema.index({ clinic: 1, patient: 1, testDate: -1 });
labResultSchema.index({ clinic: 1, uploadedBy: 1, createdAt: -1 });

const LabResult = mongoose.model('LabResult', labResultSchema);
export default LabResult;
