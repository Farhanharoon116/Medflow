// Wraps async route handlers so we don't need try/catch in every controller
// Instead of try/catch everywhere, we just wrap the function with this
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;