CREATE TABLE IF NOT EXISTS mahawelitanks (
  id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tank_name          TEXT NOT NULL UNIQUE,
  tot_capacity_mcm   NUMERIC(10,3) NOT NULL CHECK (tot_capacity_mcm > 0),
  covered_land_acres NUMERIC(12,2) CHECK (covered_land_acres >= 0),
  createdat          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mahaweli_water_level (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tank_id            INTEGER NOT NULL REFERENCES mahawelitanks(id) ON DELETE CASCADE,
  reading_date       DATE NOT NULL,
  water_level_msl    NUMERIC(7,2),
  storage_mcm        NUMERIC(10,3) CHECK (storage_mcm >= 0),
  storage_percentage NUMERIC(5,2) CHECK (storage_percentage >= 0),
  rainfall_24h_mm    NUMERIC(6,1) CHECK (rainfall_24h_mm >= 0),
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tank_day UNIQUE (tank_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_water_level_date ON mahaweli_water_level (reading_date DESC);

CREATE TABLE reservoirs (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  district           TEXT,          -- Range
  division           TEXT,
  latitude           NUMERIC(10,6),
  longitude          NUMERIC(10,6),
  farmland_acres       NUMERIC,
  full_depth_ft NUMERIC,
  gross_capacity_acft  NUMERIC,
  dead_storage_acft    NUMERIC,
  active_capacity_acft NUMERIC,
  type               TEXT,          -- 'medium' or 'major'
  UNIQUE (name, latitude, longitude)
);

CREATE TABLE reservoir_levels (
  id                    SERIAL PRIMARY KEY,
  reservoir_id          INT NOT NULL REFERENCES reservoirs(id),
  reading_date          DATE NOT NULL,
  water_depth_ft        NUMERIC,
  gross_storage_acft    NUMERIC,
  usable_storage_acft   NUMERIC,
  usable_storage_percent NUMERIC,
  rainfall_prev_day_mm  NUMERIC,    -- NULL when "-"
  is_spilling            TEXT,
  ds_impact              TEXT,      -- "Yes"/"No"
  spilling_rate_cusec         NUMERIC,      -- NULL if not spilling or not reported
  fetched_at            TIMESTAMP DEFAULT now(),
  UNIQUE (reservoir_id, reading_date)
);
CREATE INDEX idx_levels_lookup ON reservoir_levels (reservoir_id, reading_date DESC);


--This is just the schemas for all of API Related Databases !!!  -D3n3th
--TODO   - ADD ANOTHER TABLE TO STORE RAIN_DATA
--CREATE A DATABASES WITH : 
