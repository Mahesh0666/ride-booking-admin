const AuditLog = require('../models/AuditLog');

const logAudit = async (req, action, resource, resourceId, details = {}) => {
  try {
    if (!req.user || req.user.role !== 'admin') return;

    await AuditLog.create({
      admin: req.user._id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const adminRoles = {
  super_admin: ['user', 'driver', 'ride', 'payment', 'service', 'settings', 'auth', 'system'],
  operations: ['ride', 'driver', 'user'],
  support: ['ride', 'user'],
  finance: ['payment'],
  driver_verification: ['driver'],
};

const requireAdminRole = (...allowedResources) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }

    const adminRole = req.user.adminRole || 'super_admin';
    const allowed = adminRoles[adminRole] || [];

    const hasAccess = allowedResources.some((r) => allowed.includes(r));
    if (!hasAccess) {
      return res.status(403).json({
        error: { message: `Your admin role (${adminRole}) does not have access to this resource` },
      });
    }

    next();
  };
};

module.exports = { logAudit, requireAdminRole, adminRoles };
