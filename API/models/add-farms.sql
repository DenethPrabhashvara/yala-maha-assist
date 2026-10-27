-- Adds farmers.farm_id and the farms / farm_crops tables, then fills them for farmers already registered.
-- Safe to run more than once.
--
-- Existing farmers keep the ID the portal already showed them: 'FAR-' + the first 6 hex digits of farmer_id.
-- New farmers get a random 6-hex ID from the column default (the API draws again on the rare clash).

BEGIN;

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS farm_id TEXT;
UPDATE farmers SET farm_id = 'FAR-' || upper(substr(replace(farmer_id::text, '-', ''), 1, 6)) WHERE farm_id IS NULL;
ALTER TABLE farmers
  ALTER COLUMN farm_id SET DEFAULT ('FAR-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  ALTER COLUMN farm_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farmers_farm_id_key') THEN
    ALTER TABLE farmers ADD CONSTRAINT farmers_farm_id_key UNIQUE (farm_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farmers_farm_id_check') THEN
    ALTER TABLE farmers ADD CONSTRAINT farmers_farm_id_check CHECK (farm_id ~ '^FAR-[0-9A-F]{6}$');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS farms (
  farm_id         TEXT PRIMARY KEY REFERENCES farmers(farm_id) ON DELETE CASCADE ON UPDATE CASCADE,
  water_source    TEXT CHECK (water_source IN ('tank', 'canal', 'river', 'well', 'rain')),
  water_name      TEXT,           -- tank / canal / river name as the farmer gave it
  location_label  TEXT,           -- nearest place to the farm pin, as shown in the portal
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_farms_updated_at ON farms;
CREATE TRIGGER trg_farms_updated_at
  BEFORE UPDATE ON farms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS farm_crops (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  farm_id     TEXT NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE ON UPDATE CASCADE,
  position    SMALLINT NOT NULL CHECK (position >= 0),   -- order the farmer listed them; 0 is the main crop
  category    TEXT,                                      -- 'paddy', 'vegetables', ... (NULL if not known)
  crop_type   TEXT NOT NULL,
  variety     TEXT,
  acres       NUMERIC(10,2) NOT NULL CHECK (acres > 0),
  last_yield  NUMERIC(12,2) CHECK (last_yield >= 0),     -- per acre, in yield_unit
  yield_unit  TEXT CHECK (yield_unit IN ('kg', 'bu', 't')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_farm_crop_position UNIQUE (farm_id, position)
);

-- Farmers registered before this: one farm each, with their reservoir/tank and main crop.
INSERT INTO farms (farm_id, water_source, water_name, location_label)
SELECT f.farm_id,
       CASE WHEN f.reservoir_id IS NOT NULL OR f.tank_id IS NOT NULL THEN 'tank' END,
       COALESCE(r.name, t.tank_name),
       NULLIF(concat_ws(', ', f.division, f.district), '')
FROM farmers f
LEFT JOIN reservoirs r ON r.id = f.reservoir_id
LEFT JOIN mahawelitanks t ON t.id = f.tank_id
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO farm_crops (farm_id, position, category, crop_type, acres)
SELECT f.farm_id, 0,
       CASE WHEN f.primary_crop IN ('paddy', 'White Rice (BG)', 'Red Rice (AT)', 'Samba') THEN 'paddy' END,
       f.primary_crop, f.land_acres
FROM farmers f
WHERE f.primary_crop IS NOT NULL AND f.land_acres > 0
ON CONFLICT (farm_id, position) DO NOTHING;

COMMIT;
