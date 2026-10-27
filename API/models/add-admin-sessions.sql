-- Admin portal sign-in tables (see routes/ADMIN/authroutes.js). Safe to run more than once.
-- Create the first account afterwards with: node scripts/create-admin.js

CREATE TABLE IF NOT EXISTS admins (
  admin_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT NOT NULL,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,    -- bcrypt
  role           TEXT NOT NULL CHECK (role IN ('officer', 'admin', 'super_admin')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);

-- Refresh-token sessions, like farmer_sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id           UUID NOT NULL REFERENCES admins(admin_id) ON DELETE CASCADE,
  refresh_token_hash CHAR(64) NOT NULL UNIQUE
                     CHECK (refresh_token_hash ~ '^[0-9a-f]{64}$'),   -- SHA-256 hex of the token
  ip                 INET NOT NULL,
  user_agent         TEXT NOT NULL,
  revoked_at         TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin   ON admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at);
