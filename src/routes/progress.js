import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const progressSchema = z.object({
  xp: z.number().int().min(0).max(10_000_000),
  streak: z.number().int().min(0).max(10_000),
  bestStreak: z.number().int().min(0).max(10_000),
  dailyGoal: z.number().int().min(5).max(120),
  minutesToday: z.number().int().min(0).max(1440),
  completedLessons: z.array(z.string().min(1).max(100)).max(500),
  learnedWords: z.number().int().min(0).max(1_000_000),
  correctAnswers: z.number().int().min(0).max(100_000_000),
  totalAnswers: z.number().int().min(0).max(100_000_000),
  lastActivityDate: z.string().date().nullable().optional()
}).refine(v => v.correctAnswers <= v.totalAnswers, { message: 'Correct answers cannot exceed total answers' });

router.get('/', async (req, res) => {
  const result = await query('SELECT * FROM user_progress WHERE user_id=$1', [req.user.id]);
  res.json({ progress: result.rows[0] });
});

router.put('/', async (req, res) => {
  const v = progressSchema.parse(req.body);
  const result = await query(`
    INSERT INTO user_progress(user_id,xp,streak,best_streak,daily_goal,minutes_today,completed_lessons,learned_words,correct_answers,total_answers,last_activity_date,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,NOW())
    ON CONFLICT(user_id) DO UPDATE SET xp=EXCLUDED.xp,streak=EXCLUDED.streak,best_streak=EXCLUDED.best_streak,daily_goal=EXCLUDED.daily_goal,minutes_today=EXCLUDED.minutes_today,completed_lessons=EXCLUDED.completed_lessons,learned_words=EXCLUDED.learned_words,correct_answers=EXCLUDED.correct_answers,total_answers=EXCLUDED.total_answers,last_activity_date=EXCLUDED.last_activity_date,updated_at=NOW()
    RETURNING *`,
    [req.user.id,v.xp,v.streak,v.bestStreak,v.dailyGoal,v.minutesToday,JSON.stringify(v.completedLessons),v.learnedWords,v.correctAnswers,v.totalAnswers,v.lastActivityDate || null]
  );
  res.json({ progress: result.rows[0] });
});

const mistakeSchema = z.object({ lessonId:z.string().min(1).max(100), questionKey:z.string().min(1).max(200), question:z.string().min(1).max(1000), wrongAnswer:z.string().max(500).nullable().optional(), correctAnswer:z.string().min(1).max(500) });

router.get('/mistakes', async (req, res) => {
  const result = await query('SELECT * FROM mistakes WHERE user_id=$1 ORDER BY resolved ASC,last_seen_at DESC LIMIT 200', [req.user.id]);
  res.json({ mistakes: result.rows });
});

router.post('/mistakes', async (req, res) => {
  const v = mistakeSchema.parse(req.body);
  const result = await query(`INSERT INTO mistakes(user_id,lesson_id,question_key,question,wrong_answer,correct_answer)
    VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id,lesson_id,question_key) DO UPDATE SET wrong_answer=EXCLUDED.wrong_answer,correct_answer=EXCLUDED.correct_answer,attempts=mistakes.attempts+1,resolved=FALSE,last_seen_at=NOW() RETURNING *`,
    [req.user.id,v.lessonId,v.questionKey,v.question,v.wrongAnswer || null,v.correctAnswer]);
  res.status(201).json({ mistake: result.rows[0] });
});

router.patch('/mistakes/:id/resolve', async (req, res) => {
  const result = await query('UPDATE mistakes SET resolved=TRUE,last_seen_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id,req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ error:'Mistake not found' });
  res.json({ mistake:result.rows[0] });
});

const wordSchema = z.object({ word:z.string().trim().min(1).max(120).transform(v=>v.toLowerCase()), translation:z.string().trim().max(250).nullable().optional(), difficulty:z.number().int().min(1).max(5).default(1) });

router.get('/difficult-words', async (req,res) => {
  const result = await query('SELECT * FROM difficult_words WHERE user_id=$1 ORDER BY mastered ASC,difficulty DESC,created_at DESC LIMIT 500',[req.user.id]);
  res.json({ words:result.rows });
});

router.post('/difficult-words', async (req,res) => {
  const v=wordSchema.parse(req.body);
  const result=await query(`INSERT INTO difficult_words(user_id,word,translation,difficulty) VALUES($1,$2,$3,$4)
    ON CONFLICT(user_id,word) DO UPDATE SET translation=COALESCE(EXCLUDED.translation,difficult_words.translation),difficulty=GREATEST(difficult_words.difficulty,EXCLUDED.difficulty),mastered=FALSE RETURNING *`,[req.user.id,v.word,v.translation||null,v.difficulty]);
  res.status(201).json({ word:result.rows[0] });
});

router.patch('/difficult-words/:id', async (req,res) => {
  const v=z.object({ mastered:z.boolean(), difficulty:z.number().int().min(1).max(5).optional() }).parse(req.body);
  const result=await query('UPDATE difficult_words SET mastered=$1,difficulty=COALESCE($2,difficulty),review_count=review_count+1,last_reviewed_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *',[v.mastered,v.difficulty||null,req.params.id,req.user.id]);
  if(!result.rows[0]) return res.status(404).json({error:'Word not found'});
  res.json({word:result.rows[0]});
});

export default router;
