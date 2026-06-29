const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Customer } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendEmail } = require('../config/mailer');
const { successResponse, errorResponse } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const existingPhone = await Customer.findOne({ where: { phone } });
    if (existingPhone) return errorResponse(res, 'Phone number already registered', 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({ email, password: hashedPassword, role: 'customer' });
    await Customer.create({ userId: user.id, name, phone, address });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await user.update({ refreshToken });

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name },
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return errorResponse(res, 'Invalid email or password', 401);
    if (!user.isActive) return errorResponse(res, 'Account is deactivated. Contact admin.', 401);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return errorResponse(res, 'Invalid email or password', 401);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await user.update({ refreshToken });

    // Get profile name
    let name = user.email;
    if (user.role === 'customer') {
      const c = await Customer.findOne({ where: { userId: user.id } });
      if (c) name = c.name;
    }

    const { Mechanic } = require('../models');
    if (user.role === 'mechanic') {
      const m = await Mechanic.findOne({ where: { userId: user.id } });
      if (m) name = m.name;
    }

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name },
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return errorResponse(res, 'Refresh token required', 400);

    const decoded = verifyRefreshToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await user.update({ refreshToken: newRefreshToken });

    return successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Refresh token expired. Please login again.', 401);
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await req.user.update({ refreshToken: null });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) return successResponse(res, null, 'If this email exists, a reset link has been sent.');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({ resetPasswordToken: token, resetPasswordExpires: expires });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: 'VSM - Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `,
    });

    return successResponse(res, null, 'If this email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return successResponse(res, null, 'Password reset successful. Please login.');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const { Customer, Mechanic } = require('../models');
  let profile = null;
  if (req.user.role === 'customer') {
    profile = await Customer.findOne({ where: { userId: req.user.id } });
  } else if (req.user.role === 'mechanic') {
    profile = await Mechanic.findOne({ where: { userId: req.user.id } });
  }
  return successResponse(res, { ...req.user.toJSON(), profile });
};

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword, getMe };
