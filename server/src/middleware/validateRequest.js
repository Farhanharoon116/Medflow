import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

// Runs after express-validator rules — collects all errors and throws if any
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('. ');
    return next(new AppError(messages, 400));
  }
  next();
};