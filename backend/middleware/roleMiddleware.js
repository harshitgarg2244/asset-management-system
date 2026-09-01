const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Your role (${req.user ? req.user.role : 'unknown'}) is not permitted to do this.`,
      });
    }
    next();
  };
};

module.exports = { allowRoles };
