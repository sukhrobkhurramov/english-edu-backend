import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router=Router();
router.use(requireAuth,requireAdmin);

router.get('/stats',async(req,res)=>{
  const result=await query(`SELECT
    (SELECT COUNT(*)::int FROM users WHERE role='user') AS total_users,
    (SELECT COUNT(*)::int FROM users WHERE created_at>=NOW()-INTERVAL '7 days') AS new_users_7d,
    (SELECT COUNT(*)::int FROM user_progress WHERE updated_at>=NOW()-INTERVAL '24 hours') AS active_users_24h,
    (SELECT COALESCE(SUM(xp),0)::bigint FROM user_progress) AS total_xp,
    (SELECT COALESCE(AVG(xp),0)::numeric(12,1) FROM user_progress) AS average_xp,
    (SELECT COUNT(*)::int FROM mistakes WHERE resolved=FALSE) AS unresolved_mistakes,
    (SELECT COUNT(*)::int FROM difficult_words WHERE mastered=FALSE) AS difficult_words`);
  res.json({stats:result.rows[0]});
});

router.get('/users',async(req,res)=>{
  const input=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(100).default('')}).parse(req.query);
  const offset=(input.page-1)*input.limit;
  const result=await query(`SELECT u.id,u.email,u.display_name,u.role,u.is_active,u.created_at,p.xp,p.streak,p.completed_lessons,p.updated_at AS last_activity,
    COUNT(*) OVER()::int AS total_count FROM users u LEFT JOIN user_progress p ON p.user_id=u.id
    WHERE ($1='' OR u.email ILIKE '%'||$1||'%' OR u.display_name ILIKE '%'||$1||'%') ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`,[input.search,input.limit,offset]);
  res.json({users:result.rows,total:result.rows[0]?.total_count||0,page:input.page,limit:input.limit});
});

router.patch('/users/:id/status',async(req,res)=>{
  const {isActive}=z.object({isActive:z.boolean()}).parse(req.body);
  if(req.params.id===req.user.id) return res.status(400).json({error:'You cannot disable your own account'});
  const result=await query('UPDATE users SET is_active=$1,updated_at=NOW() WHERE id=$2 RETURNING id,email,display_name,role,is_active',[isActive,req.params.id]);
  if(!result.rows[0]) return res.status(404).json({error:'User not found'});
  res.json({user:result.rows[0]});
});

export default router;
