# Yala-Maha Assist
**Advanced Hydrological Monitoring, Farmer Portal & Agricultural Early Warning System for Mahaweli B Zone, Sri Lanka**

## Overview
Yala-Maha Assist is a comprehensive, modular web application designed for hydrological monitoring, farmer registration, and agricultural early warning systems in Sri Lanka's Mahaweli B Zone (Palugaswewa / Kudawewa system). The platform integrates real-time river monitoring, schematic GIS farm coverage mapping, multilingual Text.lk SMS dispatch, and a modern, mobile-responsive farmer self-service portal.

**Version:** 1.0  
**Primary Focus:** Farmland management, water resource optimization, agricultural sustainability, disaster mitigation  
**Technologies:** React, Vite, Node.js, Express.js, PostgreSQL, SVG, HTML5, CSS3, Text.lk SMS Gateway
**Target Users:** Irrigation Officers, Agrarian Extension Officers, Registered Farmers, Government Agencies  

---

## Table of Contents
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [SMS Gateway Integration (Text.lk)](#sms-gateway-integration-textlk)
- [Technical Architecture](#technical-architecture)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Testing & CLI Tools](#testing--cli-tools)
- [Deployment](#deployment)
- [Acknowledgments](#acknowledgments)

---

## Project Structure
```
yala-maha-assist/
├── api/                             # REST API server & SMS services (Port 8005)
│   ├── app.js                       # Express app configuration & middleware
│   ├── server.js                    # API server startup & dotenv loader
│   ├── config.env                   # Database, Text.lk, and alert configurations
│   ├── test-sms.js                  # CLI utility for live & dry-run SMS testing
│   ├── config/                      # Database configuration
│   │   └── db.js                    # PostgreSQL connection pool
│   ├── middleware/                  # Custom middleware
│   │   ├── errorHandles.js          # Central error handling middleware
│   │   └── inputValidators.js       # Joi request validation
│   ├── models/                      # Database models and schema
│   │   ├── mahaweliModel.js         # Mahaweli tank queries & controllers
│   │   └── schema.sql               # PostgreSQL table definitions
│   ├── routes/                      # Route controllers
│   │   └── apiroutes.js             # Mahaweli tanks, alerts & SMS endpoints
│   ├── services/                    # Business logic & gateway services
│   │   ├── alertservice.js          # Threshold checking & automated flood warnings
│   │   └── smsService.js            # Text.lk integration, OTP store & normalization
│   └── package.json                 # API dependencies
├── Tank-Reserviour/                 # Data extraction utilities
│   ├── get-mahaweli-tank-data.py    # Extract data from Mahaweli Authority PDFs
│   ├── get-realtime-river-levels.py # Fetch recent river-gauge readings from ArcGIS
│   ├── cropcalender.pdf             # Crop calendar reference
│   ├── daily_download_pdfs.py       # Automated PDF downloader
│   └── tank-dat.pdf                 # Tank data reference
├── adminportal/                     # Admin portal (React + Vite), see adminportal/README.md
├── reactfarmerportalmekawenaskrpn/  # Farmer portal (React + Vite)
├── ml-model/                        # Tank forecast model & service (Port 5000)
├── package.json                     # Root dependencies for the ML service (npm run ml)
└── README.md                        # Project documentation
```

---

## Key Features

### 🌊 Real-Time River Monitoring & Flood Prediction
- **Live Weather API:** Integrates with Open-Meteo for 7-day precipitation forecasts.
- **Multi-Source Gauges:** Merges Irrigation Department gauge readings with catchment rainfall data.
- **Predictive Risk Modeling:** Calculates flood overflow timing and risk level (Safe, Watch, Warning, Critical).
- **Automated Alert Dispatch:** Trilingual SMS notifications (English, Sinhala, Tamil) when storage thresholds exceed safe limits.

### 📱 Integrated SMS Gateway (Text.lk)
- **Direct Carrier Delivery:** Integrates directly with Sri Lankan telecom providers (Dialog, Mobitel, Airtel, Hutch) via Text.lk API v3.
- **Phone Number Normalization:** Automatically standardizes local inputs (`07XXXXXXXX` or `+94...`) into international format `947XXXXXXXX`.
- **Live OTP Verification:** Dispatches real 6-digit SMS OTP codes with a 5-minute validity window for farmer login.
- **Registration Confirmations:** Automatically delivers confirmation SMS with assigned Farm ID upon registration.
- **Broadcast Composer:** Trilingual templates, GSM/Unicode segment counter, and live recipient broadcasting.
- **Dry-Run Safe Mode:** Easily toggle between simulated and live SMS dispatch via environment variables.

### 👨‍🌾 Clean, Redesigned Farmer Portal
- **Mobile-First Card Layout:** Clean, accessible card interface with trilingual switcher (**English / සිංහල / தமிழ்**).
- **Instant Agrarian Insights:** Landing view directly displays current tank water levels, next water release date/time, and 3-day local rainfall.
- **Guided 4-Step Registration:**
  1. **Farmer Identity:** Full name, mobile verification, and NIC validation with privacy masking.
  2. **Crop Details:** Dynamic cascade for categories (Paddy, Vegetables, Fruits, OFC), varieties, acreage, and expected yield.
  3. **Interactive Schematic Map:** Drag-and-drop pin on SVG canal/tank map with automatic landmark snapping and distance calculation.
  4. **Review & Consent:** Summary review card with instant SMS confirmation upon submission.
- **Canal Maintenance Reports:** Rapid reporting tool for canal blockages, gate damage, and water leaks.

### 🗺️ Schematic GIS Farm Coverage Map
- **Vector-Based SVG Infrastructure:** Interactive schematic of the Mahaweli B Zone water distribution network.
- **Dual-Axis Evaluation:** Simultaneous evaluation of water supply adequacy and cellular/SMS signal reception.
- **Vulnerability Highlighting:** Instantly pinpoints downstream farms facing water scarcity or poor communication reception.

---

## SMS Gateway Integration (Text.lk)

### Architecture Flow

```
[Farmer Portal / Dashboard] 
           │ (HTTP POST)
           ▼
[Express API Server (Port 8005)]
           │ (services/smsService.js)
           ▼
[Text.lk Cloud API (https://app.text.lk/api/v3/sms/send)]
           │ (Bearer Token Auth)
           ▼
[Sri Lankan Telecom Operators (Dialog / Mobitel / Airtel / Hutch)]
           │ (GSM Cellular Dispatch)
           ▼
[Farmer's Mobile Phone Inbox]
```

### Supported SMS Workflows
1. **OTP Verification:** `POST /api/sms/send-otp` & `POST /api/sms/verify-otp`
2. **Registration Confirmation:** `POST /api/sms/confirm-registration`
3. **Threshold Flood Alerts:** `POST /api/alerts/check` (Dispatches alerts when tanks reach $\ge 90\%$ capacity)
4. **Custom & Broadcast Messages:** `POST /api/sms/send-custom`

---

## Technical Architecture

### Frontend (Client-Side)
- **Vanilla JavaScript ES6+:** Zero frontend framework dependencies for ultra-fast load times on rural mobile connections.
- **Scalable Vector Graphics (SVG):** Dynamic water ring gauges, interactive GIS maps, and crisp icons.
- **Trilingual Dictionary:** Centralized dictionary in `js/translations.js` supporting English, Sinhala, and Tamil.

### Backend (Server-Side)
- **Node.js & Express.js:** Fast, asynchronous REST API running on Port `8005`.
- **PostgreSQL Database:** Connection pooled via `pg` for tank monitoring, storage history, and agrarian records.
- **Environment Isolation:** Configured via `config.env` with dry-run support to prevent accidental credit consumption.

---

## Setup & Installation

### Prerequisites
- **Node.js** >= 18.x
- **PostgreSQL** >= 12.x
- **Text.lk Account** (for live SMS dispatch)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/yala-maha-assist.git
cd yala-maha-assist

# Install main web server dependencies
npm install

# Install API server dependencies
cd api
npm install
cd ..
```

### 2. Configure Environment Variables
Edit `api/config.env`:
```env
APIDBUSERN=postgres
APIDBPASSWORD=your_postgres_password
APIDBHOST=localhost
APIDATABASE=yala-maha-api
APIDBPORT=5432

# Text.lk SMS Gateway Credentials
TEXTLK_API_TOKEN=your_textlk_api_token
TEXTLK_SENDER_ID=TextLKDemo
SMS_DRY_RUN=false

# Alert System Configuration
ALERT_THRESHOLD=90
ALERT_RECIPIENTS=94774817583
```

### 3. Initialize Database
Run `api/models/schema.sql` against your PostgreSQL database:
```bash
psql -U postgres -d yala-maha-api -f api/models/schema.sql
```

### 4. Run the Applications

#### Start the API service (Port 8005):
```bash
cd api
node server.js
# Or with auto-reload:
npm run api
```

#### Start the admin portal (`adminportal/`):
```bash
cd adminportal
npm install
npm run dev
```
The admin portal (React 19, Vite, Recharts) has the Dashboard, Tanks & Reservoirs, Rivers, SMS, Farmers, Database and Settings pages, all reading the API's `/admin` routes. Its dev server proxies `/admin` to the API on port 8005, so start the API first, and create the first account with `node scripts/create-admin.js` (in `API/`). See `adminportal/README.md`.

#### Start the farmer portal (`reactfarmerportalmekawenaskrpn/`):
```bash
cd reactfarmerportalmekawenaskrpn
npm install
npm run dev
```
See `reactfarmerportalmekawenaskrpn/README.md`.

#### Start the ML forecast service (Port 5000):
```bash
npm install
npm run ml
```

---

## API Endpoints

### 🔐 Admin API (`/admin`, admin portal only)

Admins sign in with a username and password. Farmer tokens are never accepted here: admin tokens are signed with `JWT_ADMIN_SECRET` (which must differ from `JWT_SECRET`), carry `role: "admin-yalamaha"`, and must belong to an open row in `admin_sessions`.

Set up once: run `API/models/add-admin-sessions.sql`, then create the first account with `cd API && node scripts/create-admin.js <username> "<full name>" super_admin`.

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| `POST` | `/admin/auth/login` | anyone | `{ username, password }` → `accessToken` (15 min) + `adminRefreshToken` cookie (7 days). 5 wrong passwords lock the username for 15 minutes. |
| `POST` | `/admin/auth/refresh_token` | cookie | New access token; the refresh token is rotated |
| `POST` | `/admin/auth/logout` | cookie | Ends the session |
| `GET` | `/admin/auth/me` | any admin | The signed-in admin |
| `PATCH` | `/admin/auth/password` | any admin | `{ current_password, new_password }`; signs out the admin's other sessions |
| `POST` | `/admin/auth/admins` | super_admin | `{ username, password, full_name, role }` |
| `GET` | `/admin/farmers` | any admin | `?q=&district=&reservoir_id=&tank_id=&is_active=&page=&limit=` |
| `GET` | `/admin/farmers/:farmerId` | any admin | Farmer with farm and crops |
| `PATCH` | `/admin/farmers/:farmerId` | admin, super_admin | Profile fields, `phone`, `nic`, `is_active`, and farm details (`water_source`, `water_name`, `location_label`, `crops`) |
| `DELETE` | `/admin/farmers/:farmerId` | admin, super_admin | Deletes the farmer, farm, crops and sessions |
| `GET` | `/admin/db/tables` | any admin | Every table with columns, primary key and row estimate |
| `GET` | `/admin/db/tables/:table` | any admin | `?page=&limit=&sort=&order=&<column>=<value>` |
| `GET` | `/admin/db/tables/:table/rows/:id` | any admin | One row by primary key |
| `POST` / `PATCH` / `DELETE` | `/admin/db/tables/:table[/rows/:id]` | admin, super_admin | Insert, update or delete rows (`admins` and `admin_sessions`: super_admin only) |
| `GET` / `POST` | `/admin/sms/...` | any admin / admin, super_admin | Alert preview, alert send, custom SMS (moved from the old open `/sms` routes) |

Password, refresh-token and NIC hashes are never returned or writable through `/admin/db`. Officers (`role = officer`) can view everything but change nothing.

### 🌊 Mahaweli Tanks & Reservoirs (Public CSV & Data API)

The Mahaweli tanks API is publicly accessible with full CORS support (`Access-Control-Allow-Origin: *`), designed for direct integration with machine learning pipelines (e.g. Google Colab notebooks), GIS dashboards, spreadsheets, and frontend applications.

| Method | Endpoint | Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mahaweli` | **CSV** | **Public default endpoint** returning all tank water levels, capacity, and rainfall in CSV format |
| `GET` | `/api/mahaweli?download=true` | **CSV File** | Prompts direct browser download of `mahaweli_tanks.csv` (`Content-Disposition: attachment`) |
| `GET` | `/api/mahaweli/csv` | **CSV** | Dedicated route alias returning CSV format |
| `GET` | `/api/mahaweli?format=json` | **JSON** | Alternative JSON format containing full dataset and metadata |
| `GET` | `/api/mahaweli/:id` | **JSON** | Retrieve single tank record by ID (e.g. `/api/mahaweli/1`) |
| `GET` | `/api/mahaweli/:id?format=csv` | **CSV** | Retrieve single tank record in CSV format (also supports `/api/mahaweli/:id.csv`) |
| `GET` | `/api/forecast/:id` | **JSON** | Calculate and return a 14-day forecast for a tank using its stored readings (e.g. `/api/forecast/1`); requires the ML service on port 5000 |

The forecast route looks up the numeric `mahawelitanks.id`, converts its recent `storage_mcm` readings to the Ac-ft units required by the model, and returns the prediction. Start the ML service with `node ml-model/server.js`; set `FORECAST_API_URL` in `API/config.env` if it is not running at `http://localhost:5000`.

#### Quick Examples:

##### 1. Python / Pandas (Google Colab, Jupyter & ML Pipelines)
```python
import pandas as pd

# Load directly into DataFrame from public endpoint
url = "http://localhost:8005/api/mahaweli"
df = pd.read_csv(url)

print(df.head())
print(df.info())
```

##### 2. cURL / Terminal
```bash
# View CSV in terminal
curl -s http://localhost:8005/api/mahaweli

# Download as a file
curl -o mahaweli_tanks.csv http://localhost:8005/api/mahaweli?download=true
```

##### 3. PowerShell
```powershell
# View CSV raw text
Invoke-RestMethod -Uri "http://localhost:8005/api/mahaweli"

# Save directly to a local CSV file
Invoke-WebRequest -Uri "http://localhost:8005/api/mahaweli?download=true" -OutFile "mahaweli_tanks.csv"
```

##### 4. Google Sheets
```text
=IMPORTDATA("http://localhost:8005/api/mahaweli")
```

##### 5. CSV Output Preview
```csv
id,tank_name,tot_capacity_mcm,water_level_msl,storage_mcm,storage_percentage,covered_land_acres,rainfall_last_24h_mm,last_update
1,Ridiyagama,32.100,20.060,33.770,105.00,16561,,2026-10-07T18:30:00.000Z
2,Mapakada,9.510,103.540,5.520,58.00,1507,21.200,2026-10-08T18:30:00.000Z
3,Dambarawa,15.940,100.620,11.400,71.00,1507,,2026-10-08T18:30:00.000Z
```

### 📲 SMS Gateway & OTP Services
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sms/send-otp` | Generate & dispatch a 6-digit verification code to farmer's phone |
| `POST` | `/api/sms/verify-otp` | Verify the 6-digit OTP code entered by the farmer |
| `POST` | `/api/sms/confirm-registration`| Send official registration confirmation SMS with Farm ID |
| `POST` | `/api/sms/send-custom` | Send custom SMS text to one or multiple recipient numbers |

### ⚠️ Early Warning Flood Alerts
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/alerts/preview` | Safe dry-run preview of pending high water level alerts (zero cost) |
| `POST` | `/api/alerts/check` | Evaluates tank threshold $\ge 90\%$ and dispatches real SMS alerts |

---

## Testing & CLI Tools

### Realtime River Gauge Data
Fetch the same recent gauge observations used by the Irrigation Department's
Realtime Water Level dashboard. The script uses Python's standard library and
does not require additional packages:

```bash
# Fetch all available observations from the source's seven-day window.
# JSON is saved by default to Tank-Reserviour/realtime_river_levels.json:
python Tank-Reserviour/get-realtime-river-levels.py

# Fetch a particular station's data (also saved to the default JSON file):
python Tank-Reserviour/get-realtime-river-levels.py \
  --basin "Kelani Ganga" --station "Holombuwa"

# List selectable basins or stations within a basin:
python Tank-Reserviour/get-realtime-river-levels.py --list-basins
python Tank-Reserviour/get-realtime-river-levels.py \
  --list-stations --basin "Kelani Ganga"

# Change the lookback or choose a different JSON output path:
python Tank-Reserviour/get-realtime-river-levels.py \
  --basin "Kelani Ganga" --station "Holombuwa" --days 1 \
  --output river-levels.json
```

`CreationDate` and `EditDate` are written as ISO-8601 UTC timestamp strings
(for example, `2026-10-23T15:40:27.219+00:00`), ready to insert into PostgreSQL
`TIMESTAMPTZ` columns. Each observation also includes `station`, `latitude`, and
`longitude`, joined from the dashboard's Hydrostations layer using basin and
station name. If a gauge has no matching station metadata, its coordinates are
`null` and the script reports the unmatched station names.

### Realtime Rainfall Dashboard Data
Fetch the rainfall dashboard's full seven-day observation window, station
metadata and rainfall summaries. The script creates
`public.rainfall_realtime` with `CREATE TABLE IF NOT EXISTS`, upserts every
station from the JSON `stations` array (not the observations), and saves the
result to `Tank-Reserviour/realtime_rainf_new.json` without overwriting the
existing `realtime_rainfall.json`:

```bash
python Tank-Reserviour/get-realtime-rainfall.py

# Optionally filter observations and choose a different output path:
python Tank-Reserviour/get-realtime-rainfall.py \
  --basin "Kelani Ganga" --station "Holombuwa" --days 3 \
  --output kelani-rainfall.json
```

The table stores each station's basin, coordinates, unit, tributary, alert/flood
levels and elevation, with the complete station record in a JSONB column. If an
older observation-based `rainfall_realtime` table exists, the script preserves
it as `rainfall_realtime_observations_archive` before creating the station table.
The database defaults to the project's local `yala-maha-api` PostgreSQL
database. Configure `APIDBHOST`, `APIDBPORT`, `APIDATABASE`, `APIDBUSERN`, and
`APIDBPASSWORD` (or the equivalent `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
and `DB_PASSWORD` variables) to use different connection settings. The Python
environment needs `psycopg2`.

The JSON contains all available gauge observation fields, station coordinates
and metadata. Its `dashboard_views` object contains only `latest_nonzero_rainfall_updates`
and `rainfall_observations_last_hour`. Observation timestamps are ISO-8601 UTC
strings.

### Terminal SMS Gateway Test Tool
A dedicated CLI tool is provided to test SMS dispatch directly from PowerShell or Bash:

```bash
cd api

# 1. Safe dry-run simulation (does not consume SMS credits):
node test-sms.js 0774817583

# 2. Live SMS dispatch directly to your phone:
node test-sms.js 0774817583 --live

# 3. Custom message test:
node test-sms.js 0774817583 "Hello from Yala-Maha Assist" --live
```

### Testing API Endpoints via PowerShell
```powershell
# 1. Test public Mahaweli tanks CSV endpoint:
Invoke-RestMethod -Uri http://localhost:8005/api/mahaweli

# 2. Test live alert check:
Invoke-RestMethod -Method Post http://localhost:8005/api/alerts/check

# 3. Test OTP generation:
Invoke-RestMethod -Method Post http://localhost:8005/api/sms/send-otp -ContentType "application/json" -Body '{"phone":"0774817583"}'
```

---

## Database Schema

### `mahawelitanks` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing unique identifier |
| `tank_name` | `VARCHAR(50) UNIQUE` | Reservoir name (e.g., *Ridiyagama*, *Rajanganaya*) |
| `tot_capacity_mcm` | `DECIMAL(6,3)` | Total capacity in million cubic meters (MCM) |
| `water_level_msl` | `DECIMAL(7,3)` | Current water elevation above sea level |
| `storage_mcm` | `DECIMAL(6,3)` | Current water volume in MCM |
| `storage_percentage`| `DECIMAL(6,2)` | Current storage percentage ($\%$) |
| `covered_land_acres`| `INT` | Irrigated agricultural land (acres) |
| `rainfall_last_24h_mm`| `DECIMAL(6,3)`| 24-hour catchment rainfall in millimeters |
| `last_update` | `TIMESTAMP` | Timestamp of latest hydrological reading |

---

## Deployment

### Accessing the Web Interfaces
- **Farmer Portal (Mobile Interface):** `http://localhost:3007/farmer-portal.html` or direct file view `farmer-portal.html`
- **Operations Dashboard:** `http://localhost:3007/`
- **Backend API Base:** `http://localhost:8005/api/`

---

## Acknowledgments
- **Sri Lanka Mahaweli Authority:** For irrigation infrastructure and catchment data.
- **Department of Irrigation, Sri Lanka:** For river gauge monitoring and hydrological records.
- **Open-Meteo:** For weather and precipitation forecast APIs.
- **Text.lk:** For Sri Lankan mobile SMS gateway infrastructure.

---
*Yala-Maha Assist · Empowering Sri Lankan Agriculture Through Technology*

#### important
for to train ml model on google colab notebook i put  the current github pages appi endpoint url for it when hosting it on another platform please mention it again
