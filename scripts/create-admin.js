import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, db } from '../src/db.js';

const input=z.object({ADMIN_EMAIL:z.string().email(),ADMIN_PASSWORD:z.string().min(12),ADMIN_NAME:z.string().min(2).default('English Edu Admin')}).parse(process.env);
const passwordHash=await bcrypt.hash(input.ADMIN_PASSWORD,12);
const result=await query(`INSERT INTO users(email,password_hash,display_name,role) VALUES($1,$2,$3,'admin')
  ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,display_name=EXCLUDED.display_name,role='admin',is_active=TRUE,updated_at=NOW()
  RETURNING id,email,display_name,role`,[input.ADMIN_EMAIL.toLowerCase(),passwordHash,input.ADMIN_NAME]);
await query('INSERT INTO user_progress(user_id) VALUES($1) ON CONFLICT DO NOTHING',[result.rows[0].id]);
console.log('Admin ready:',result.rows[0].email);
await db.end();
