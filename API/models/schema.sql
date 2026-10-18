CREATE TABLE IF NOT EXISTS mahawelitanks(
    id SERIAL PRIMARY KEY,
    tank_name VARCHAR(50) NOT NULL UNIQUE,
    tot_capacity_mcm DECIMAL(6,3),
    water_level_msl DECIMAL(7,3),
    storage_mcm DECIMAL(6,3),
    storage_percentage DECIMAL(6,2),
    covered_land_acres INT,
    rainfall_last_24h_mm DECIMAL(6,3)
)

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
