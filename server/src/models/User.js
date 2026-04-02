import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never return password in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'receptionist', 'patient'],
      required: true,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      // not required — admin creating the first clinic won't have one yet
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary URL
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Doctor-specific fields
    specialization: String,
    qualification: String,
    consultationFee: {
        type: Number,
        default: 500, // PKR
        min: 0,
      },
    // Shown on public queue display (waiting room TV)
    consultationRoom: {
      type: String,
      trim: true,
      default: null,
    },
      availability: {
        monday:    { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        tuesday:   { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        wednesday: { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        thursday:  { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        friday:    { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        saturday:  { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        sunday:    { isAvailable: { type: Boolean, default: false }, startTime: { type: String, default: '09:00' }, endTime: { type: String, default: '17:00' } },
        slotDurationMinutes: { type: Number, default: 30 },
      },
    // Subscription plan — applies at clinic level but stored on admin user
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    patientRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null,
      },
    refreshToken: {
      type: String,
      select: false, // never expose refresh token in API responses
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt
  }
);

// ── Hash password before saving ──────────────────────────────────────
// This runs automatically every time a user is saved with a new password
userSchema.pre('save', async function (next) {
  // only hash if password was actually changed
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Method to compare passwords at login ────────────────────────────
// We call this as: user.comparePassword(enteredPassword)
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
