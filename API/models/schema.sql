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

--This is just the schemas for all of API Related Databases !!!  -D3n3th
--TODO   - ADD ANOTHER TABLE TO STORE RAIN_DATA
--CREATE A DATABASES WITH : 
