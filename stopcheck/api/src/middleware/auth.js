const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.org = { id: decoded.orgId, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(org) {
  return jwt.sign(
    { orgId: org.id, email: org.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticateJWT, generateToken };
