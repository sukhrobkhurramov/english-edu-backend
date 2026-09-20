CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
  best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  daily_goal INTEGER NOT NULL DEFAULT 10 CHECK (daily_goal BETWEEN 5 AND 120),
  minutes_today INTEGER NOT NULL DEFAULT 0 CHECK (minutes_today >= 0),
  completed_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  learned_words INTEGER NOT NULL DEFAULT 0 CHECK (learned_words >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  total_answers INTEGER NOT NULL DEFAULT 0 CHECK (total_answers >= 0),
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  question_key TEXT NOT NULL,
  question TEXT NOT NULL,
  wrong_answer TEXT,
  correct_answer TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id, question_key)
);

CREATE TABLE IF NOT EXISTS difficult_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_unresolved ON mistakes(user_id, resolved, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_words_user_mastered ON difficult_words(user_id, mastered, difficulty DESC);
