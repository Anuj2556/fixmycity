const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fixmycity_jwt_access_secret_super_secure_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fixmycity_jwt_refresh_secret_super_secure_key_2026';

const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    is_staff: user.is_staff || user.role === 'admin',
    department: user.department ? user.department.toString() : null,
  };

  const access = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '7d' });
  const refresh = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });

  return { access, refresh };
};

const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({ detail: 'Token is invalid or expired.', code: 'token_not_valid' });
    }

    const user = await User.findById(decoded.id).populate('department');
    if (!user) {
      return res.status(401).json({ detail: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server authentication error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && !req.user.is_staff)) {
    return res.status(403).json({ detail: 'Access restricted to City Administrators.' });
  }
  next();
};

const requireOfficerOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'department_admin'].includes(req.user.role)) {
    return res.status(403).json({ detail: 'Access restricted to Municipal Officers and Administrators.' });
  }
  next();
};

module.exports = {
  generateTokens,
  verifyRefreshToken,
  authMiddleware,
  requireAdmin,
  requireOfficerOrAdmin,
};
