-- ===========================
--  TABLA USERS
-- ===========================
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name  TEXT,
  theme TEXT NOT NULL DEFAULT 'ink',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================
--  TABLA PROJECTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  methodology TEXT,
  stage TEXT,
  domain TEXT,
  templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);

-- ===========================
--  CAMPOS EXTRA PARA AUTH:
--  - Google / otros providers
--  - Verificación de correo
-- ===========================
ALTER TABLE public.users
  -- verificación de correo
  ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verify_token         TEXT,
  ADD COLUMN IF NOT EXISTS verify_token_expires TIMESTAMPTZ,

  -- auth externa (Google, etc.)
  ADD COLUMN IF NOT EXISTS provider     TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS provider_id  TEXT,
  ADD COLUMN IF NOT EXISTS name         TEXT,
  ADD COLUMN IF NOT EXISTS picture      TEXT;

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users (email);
CREATE INDEX IF NOT EXISTS users_provider_idx       ON public.users (provider, provider_id);



DELETE FROM users WHERE email = 'jpshadow.2023@gmail.com';
