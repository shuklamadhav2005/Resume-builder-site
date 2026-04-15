const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/user.model');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const user = await User.findById(req.user.id).select('role');
      const role = user?.role || 'user';
      req.user.role = role;

      if (!roles.includes(role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Failed to verify access', error: error.message });
    }
  };
}

module.exports = {
  verifyToken,
  requireRole
};
