CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name  TEXT,
  theme TEXT NOT NULL DEFAULT 'ink',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  methodology TEXT,
  stage TEXT,
  domain TEXT,
  templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text,
  ADD COLUMN IF NOT EXISTS theme      text NOT NULL DEFAULT 'ink';


-- ✅ Añade SOLO lo necesario; no toca tu esquema local de login
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS provider              TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS provider_id           TEXT,
  ADD COLUMN IF NOT EXISTS name                  TEXT,
  ADD COLUMN IF NOT EXISTS picture               TEXT,
  ADD COLUMN IF NOT EXISTS verify_token          TEXT,
  ADD COLUMN IF NOT EXISTS verify_token_expires  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users (email);
CREATE INDEX IF NOT EXISTS users_provider_idx ON public.users (provider, provider_id);
