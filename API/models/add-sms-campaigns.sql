-- SMS campaigns sent from the admin portal (one row per send, with how many went through).
-- Run once: psql -d yala-maha-api -f models/add-sms-campaigns.sql
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id    UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
  audience    TEXT NOT NULL,              -- e.g. "All active farmers", "District · Polonnaruwa"
  message     TEXT NOT NULL,
  recipients  INT NOT NULL CHECK (recipients >= 0),
  delivered   INT NOT NULL DEFAULT 0 CHECK (delivered >= 0),
  failed      INT NOT NULL DEFAULT 0 CHECK (failed >= 0),
  dry_run     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created ON sms_campaigns (created_at DESC);
