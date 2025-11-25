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


-- Se Añade SOLO lo necesario; no toca el esquema local de login
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


-- ======================
-- MÓDULO SCRUM
-- ======================

-- 1) Miembros del proyecto con rol Scrum
CREATE TABLE IF NOT EXISTS project_members (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('product_owner', 'scrum_master', 'developer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 2) Product Backlog
CREATE TABLE IF NOT EXISTS product_backlog (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('story','task','bug','enhancement')),
  priority INT DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Sprints
CREATE TABLE IF NOT EXISTS sprints (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('planned','active','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Sprint Backlog (tareas del sprint)
CREATE TABLE IF NOT EXISTS sprint_backlog (
  id BIGSERIAL PRIMARY KEY,
  sprint_id BIGINT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  pb_item_id BIGINT NOT NULL REFERENCES product_backlog(id) ON DELETE CASCADE,
  assigned_to BIGINT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'todo'
);

-- 5) Impediments Backlog
CREATE TABLE IF NOT EXISTS impediments (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reported_by BIGINT REFERENCES users(id),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Incidents Backlog
CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7) Parking Lot
CREATE TABLE IF NOT EXISTS parking_lot (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id),
  idea TEXT NOT NULL,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8) Métricas de sprint (para burndown / velocity)
CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  remaining_points INT,
  completed_points INT
);