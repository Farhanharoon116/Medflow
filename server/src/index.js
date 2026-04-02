import './config/env.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import connectDB from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// ── 1. Load env FIRST — before anything else ────────────────────────
dotenv.config();

// ── 2. Connect to database ───────────────────────────────────────────
connectDB();

const app = express();
app.set('trust proxy', 1);

// ── 3. Security Middleware ───────────────────────────────────────────
// ORDER MATTERS — these must all come before routes
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// ── 4. Body Parsing — MUST be before routes and security middlewares ───
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(hpp());
app.use('/api', globalLimiter);

// ── 5. Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MedFlow API is running',
    env: process.env.NODE_ENV,
  });
});

// ── 6. Routes — MUST come after body parsing ─────────────────────────
import authRoutes from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import vitalsRoutes from './routes/vitalsRoutes.js';
import labRoutes from './routes/labRoutes.js';
import { startReminderCron } from './services/reminderService.js';

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/labs', labRoutes);

// ── 7. 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── 8. Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── 9. Start Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MedFlow server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  startReminderCron();
});
