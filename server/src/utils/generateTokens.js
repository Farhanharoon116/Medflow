import jwt from 'jsonwebtoken';

// Access token: short-lived (15 min), sent in response body
export const generateAccessToken = (id, role, plan) => {
  return jwt.sign({ id, role, plan }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Refresh token: long-lived (7 days), stored in httpOnly cookie
// httpOnly means JavaScript cannot read it — protects against XSS attacks
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  });
};

// Sends both tokens — access in body, refresh in secure cookie
export const sendTokens = async (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id, user.role, user.plan);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token hash to DB so we can invalidate it on logout
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const cookieOptions = {
    httpOnly: true,   // JS can't access this cookie — XSS protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Remove sensitive fields before sending user data
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      clinic: user.clinic,
      avatar: user.avatar,
    },
  });
};