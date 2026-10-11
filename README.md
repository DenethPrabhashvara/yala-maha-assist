# Yala-Maha Assist
**Advanced Hydrological Monitoring, Farmer Portal & Agricultural Early Warning System for Mahaweli B Zone, Sri Lanka**

## Overview
Yala-Maha Assist is a comprehensive, modular web application designed for hydrological monitoring, farmer registration, and agricultural early warning systems in Sri Lanka's Mahaweli B Zone (Palugaswewa / Kudawewa system). The platform integrates real-time river monitoring, schematic GIS farm coverage mapping, multilingual Text.lk SMS dispatch, and a modern, mobile-responsive farmer self-service portal.

**Version:** 1.0  
**Primary Focus:** Farmland management, water resource optimization, agricultural sustainability, disaster mitigation  
**Technologies:** Node.js, Express.js, PostgreSQL, Vanilla JavaScript (ES6+), SVG, HTML5, CSS3, Text.lk SMS Gateway  
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
├── Controllers/                     # HTML page controllers
│   └── controller.js                # Serves HTML views
├── Tank-Reserviour/                 # Data extraction utilities
│   ├── get-mahaweli-tank-data.py    # Extract data from Mahaweli Authority PDFs
│   ├── cropcalender.pdf             # Crop calendar reference
│   ├── daily_download_pdfs.py       # Automated PDF downloader
│   └── tank-dat.pdf                 # Tank data reference
├── public/                          # Static web assets served by main web server
│   ├── farmer-portal.html           # Standalone mobile-responsive Farmer Portal
│   ├── yala-maha-assist.html        # Main operations management dashboard
│   ├── css/style.css                # Central design system stylesheet
│   └── js/                          # Client-side modules (mirrored for web serving)
├── js/                              # Modular frontend components
│   ├── app.js                       # Main application shell & tab switcher
│   ├── farmer-portal.js             # Farmer Portal UI, SMS OTP & 4-step registration
│   ├── sms-gateway.js               # SMS broadcast composer & audit history
│   ├── dashboard.js                 # Tank level charts & rainfall visualizers
│   ├── coverage-map.js              # Farm plots & signal coverage evaluation
│   ├── schematic-map.js             # SVG schematic canal/tank map generator
│   ├── river-monitoring.js          # Flood prediction & gauge monitoring
│   ├── river-gauges.js              # River gauge data processor
│   ├── river-forecast.js            # Open-Meteo weather integration
│   ├── river-risk.js                # Multi-source flood risk calculator
│   ├── translations.js              # Central trilingual dictionary (EN / SI / TA)
│   └── icons.js                     # Centralized SVG icons
├── css/
│   └── style.css                    # Unified design tokens, components & responsive layout
├── farmer-portal.html               # Clean, card-based Farmer Portal entry page
├── yala-maha-assist.html            # Unified operations dashboard
├── farm-config.js                   # Farm datasets, crop hierarchy & NIC validator
├── river-config.js                  # River monitoring configurations & gauge thresholds
├── server.js                        # Main HTTP web server entry point (Port 3007)
├── package.json                     # Main web dependencies & scripts
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

### 4. Run the Servers

#### Start the API Server (Port 8005):
```bash
cd api
node server.js
# Or with auto-reload:
npm run api
```

#### Start the Main Web Server (Port 3007):
```bash
node server.js
```

---

## API Endpoints

### 🌊 Mahaweli Tanks & Reservoirs
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mahaweli` | Retrieve live water levels, capacity, and rainfall for all tanks |
| `GET` | `/api/mahaweli/:id` | Retrieve single tank details by ID |

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
# Test live alert check:
Invoke-RestMethod -Method Post http://localhost:8005/api/alerts/check

# Test OTP generation:
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
