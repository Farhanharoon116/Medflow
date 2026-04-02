// A custom error class so we can attach a statusCode to any error
class AppError extends Error {
    constructor(message, statusCode) {
      super(message); // calls the built-in Error constructor
      this.statusCode = statusCode;
      this.isOperational = true; // marks this as a known, expected error
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export default AppError;