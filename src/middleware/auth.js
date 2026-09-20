import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'english-edu-api',
    audience: 'english-edu-web'
  });
}

export async function requireAuth(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, config.JWT_SECRET, { issuer: 'english-edu-api', audience: 'english-edu-web' });
    const result = await query('SELECT id, email, display_name, role, is_active, created_at FROM users WHERE id = $1', [payload.sub]);
    const user = result.rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account is unavailable' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}
