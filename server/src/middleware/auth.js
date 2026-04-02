import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';

// ── Protect: verifies JWT and attaches user to request ──────────────
export const protect = asyncHandler(async (req, res, next) => {
  // Get token from Authorization header: "Bearer <token>"
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  // Verify the token — throws if expired or tampered
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check user still exists (they might have been deactivated)
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or has been deactivated.', 401));
  }

  // Attach user to request so every subsequent middleware/controller can use it
  req.user = user;
  next();
});

// ── Authorize: checks role-based permissions ─────────────────────────
// Usage: authorize('admin', 'doctor') — only these roles can proceed
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized for this action.`,
          403
        )
      );
    }
    next();
  };
};

// ── Plan Gate: blocks free plan from Pro features ────────────────────
export const requirePro = asyncHandler(async (req, res, next) => {
  const user = req.user;
  // Get the clinic's plan (stored on admin user or directly on clinic)
  if (user.plan !== 'pro') {
    return next(
      new AppError('This feature requires a Pro plan. Please upgrade.', 403)
    );
  }
  next();
});