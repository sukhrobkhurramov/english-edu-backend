import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, transaction } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({ email: z.string().email().transform(v => v.toLowerCase()), password: z.string().min(8).max(128) });
const registerSchema = credentials.extend({ displayName: z.string().trim().min(2).max(80) });

router.post('/register', async (req, res) => {
  const input = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await transaction(async client => {
    const result = await client.query(
      'INSERT INTO users(email, password_hash, display_name) VALUES($1,$2,$3) RETURNING id,email,display_name,role,created_at',
      [input.email, passwordHash, input.displayName]
    );
    await client.query('INSERT INTO user_progress(user_id) VALUES($1)', [result.rows[0].id]);
    return result.rows[0];
  });
  res.status(201).json({ user, token: signToken(user) });
});

router.post('/login', async (req, res) => {
  const input = credentials.parse(req.body);
  const result = await query('SELECT id,email,display_name,role,password_hash,is_active,created_at FROM users WHERE email=$1', [input.email]);
  const user = result.rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(input.password, user.password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect' });
  }
  delete user.password_hash;
  res.json({ user, token: signToken(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
