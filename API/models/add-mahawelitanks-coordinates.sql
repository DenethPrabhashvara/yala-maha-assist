-- Adds latitude/longitude to mahawelitanks and copies them from the matching reservoirs row.
-- Safe to run more than once. get-mahaweli-tank-data.py never writes these columns.
--
-- Left NULL on purpose:
--   PSS        (Parakrama Samudraya) - not linked, by decision
--   Tissawewa  - could be Tissawewa (Hambantota) or Thissa wewa (Anuradhapura); set it by hand once known

BEGIN;

ALTER TABLE mahawelitanks ADD COLUMN IF NOT EXISTS latitude  NUMERIC(10,6) CHECK (latitude  BETWEEN -90  AND 90);
ALTER TABLE mahawelitanks ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6) CHECK (longitude BETWEEN -180 AND 180);

UPDATE mahawelitanks t
SET latitude = r.latitude, longitude = r.longitude
FROM (VALUES
  ('Ridiyagama',    'Ridiyagama'),
  ('Mapakada',      'Mapakada'),
  ('Dambarawa',     'Dambarawa'),
  ('Sorabora',      'Sorabora'),
  ('Vakaneri',      'Vakaneri'),
  ('Huruluwewa',    'Huruluwewa'),
  ('Thuruvila',     'Thuruwila tank'),
  ('Nachchaduwa',   'Nachchaduwa'),
  ('Nuwarawewa',    'Nuwara Wewa'),
  ('Basawakkulama', 'Basavakkulama (Abaya wewa)'),
  ('Rajanganaya',   'Rajangana'),
  ('Angamuwa',      'Angamuwa'),
  ('Giritale',      'Giritale'),
  ('Minneriya',     'Minneriya'),
  ('Kaudulla',      'Kaudulla'),
  ('Kantale',       'Kantale'),
  ('Vendrason',     'Vendrasan'),
  ('Alikotaara',    'Alikota ara'),
  ('Hadapanagala',  'Handapanagala'),
  ('Lunugamwehera', 'Lunugamwehera')
) AS m(tank_name, reservoir_name)
JOIN reservoirs r ON r.name = m.reservoir_name
WHERE t.tank_name = m.tank_name;

COMMIT;
