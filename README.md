# Yala-Maha Assist
**Advanced Hydrological Monitoring & Agricultural Early Warning System for Mahaweli B Zone, Sri Lanka**

## Overview
Yala-Maha Assist is a comprehensive, modular web application designed for hydrological monitoring, farmer registration, and agricultural early warning systems in Sri Lanka's Mahaweli B Zone (Palugaswewa / Kudawewa system). The system combines real-time river monitoring, schematic farm coverage mapping, multilingual SMS dispatch, and a farmer self-service portal into a unified platform.

**Version:** 1.0  
**Primary Focus:** Farmland management, water resource management, agricultural sustainability  
**Technologies:** Node.js, PostgreSQL, Express.js, Vanilla JavaScript, SVG, HTML5, CSS3  
**Target Users:** Irrigation Officers, Agricultural Extension Officers, Farmers, Government Agencies

---

## Table of Contents
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Project Structure
```
yala-maha-assist/
├── API/                       # REST API server with PostgreSQL integration
│   ├── app.js                 # Express app configuration
│   ├── server.js              # API server entry point
│   ├── config/                # Database configuration
│   │   └── db.js              # PostgreSQL connection pool
│   ├── middleware/            # Custom middleware
│   │   └── errorHandles.js    # Error handling middleware
│   ├── models/                # Database models and schema
│   │   ├── mahaweliModel.js   # Tank data model
│   │   └── schema.sql         # Database schema definition 
│   ├── routes/                # API route definitions
│   │   └── apiroutes.js       # REST API endpoints for Tanks/Resoviours
│   └── package.json           # API dependencies
├── Controllers/               # HTML page controllers
│   └── controller.js          # Serves HTML pages for various sections
├── Tank-Reserviour/           # Data extraction utilities
│   ├── get-mahaweli-tank-data.py  # Extract data from Mahaweli Public PDFs
│   ├── cropcalender.pdf       # crop calendar
│   ├── daily_download_pdfs.py     # Automated PDF downloader
│   └── tank-dat.pdf           # tank data PDF
├── public/                    # Static assets served by main server
│   └── yala-maha-assist.html  # Main operations dashboard
├── js/                        # Modular JavaScript components
│   ├── app.js                 # Main application controller
│   ├── translations.js        # Trilingual dictionary (EN/SI/TA)
│   ├── icons.js               # Centralized SVG icons
│   ├── schematic-map.js       # Vector map renderer & distance calculator
│   ├── farmer-portal.js       # Farmer registration flow
│   ├── dashboard.js           # Tank level charts & rainfall graphs
│   ├── sms-gateway.js         # SMS broadcast composition & history
│   ├── coverage-map.js        # Farm plots & coverage evaluation
│   ├── river-monitoring.js    # Flood prediction & gauge monitoring
│   ├── river-gauges.js        # River gauge data processing
│   ├── river-forecast.js      # Weather forecast integration
│   ├── river-risk.js          # Flood risk calculation
│   └── river-page.js          # River monitoring page logic
├── css/
│   └── style.css              # Unified design system (tokens, components)
├── test/                      # Automated test suite
│   └── test-suite.js          # 29 comprehensive tests
├── farmer-portal.html         # Mobile-first farmer registration portal
├── yala-maha-assist.html      # Main operations interface
├── farm-config.js             # Farm data, crop hierarchy, NIC validation
├── river-config.js            # River monitoring configuration & thresholds
├── server.js                  # Main HTTP server entry point
├── package.json               # Project dependencies & scripts
└── README.md                  # Original documentation
```

---

## Key Features

### 🌊 Real-Time River Monitoring & Flood Prediction
- **Live API Integration:** Connects to Open-Meteo Weather API for real-time rain data
- **Multi-Source Data Fusion:** Combines Irrigation Department gauge readings with weather forecasts
- **Predictive Analytics:** 7-day forecast with peak overflow timing and magnitude
- **Automated Alert System:** Trilingual SMS dispatch (English/Sinhala/Tamil) when flood thresholds exceeded
- **Officer Approval Workflow:** Configurable auto-send vs. officer approval for alerts

### 🗺️ Interactive Schematic Farm Coverage Map
- **Vector-Based SVG Map:** Interactive schematic of Mahaweli B Zone irrigation infrastructure
- **Dual-Axis Evaluation:** Simultaneous water supply adequacy and mobile/SMS signal strength assessment
- **Dynamic Filtering:** By village, crop type, coverage level (Good/Low/Very Low)
- **Vulnerability Identification:** Highlights farms requiring officer intervention (weak signal, low water)
- **Click-to-Reveal:** Farm details popup showing farmer name, crop, acreage, and coverage metrics

### 👨‍🌾 Farmer Self-Service Portal
- **Mobile-First Design:** Optimized for low-bandwidth mobile access in rural areas
- **Trilingual Interface:** Seamless switching between English, Sinhala, and Tamil
- **4-Step Registration:**
  1. Personal Information & NIC validation
  2. Farm location & village selection
  3. Crop selection & acreage specification
  4. Schematic map pin placement & consent
- **Privacy Protection:** NIC and phone numbers masked in all displays
- **Self-Service Updates:** Farmers can modify their information post-registration

### 📱 Comprehensive SMS Gateway
- **Trilingual Broadcast Composer:** Template system with language-specific character limits
- **Segment Calculator:** Automatic GSM/Unicode segment counting for cost optimization
- **Delivery Tracking:** Real-time status monitoring (sent, delivered, pending, failed)
- **Inbound Query Handling:** Automatic replies for common farmer inquiries (STATUS, NEXT RELEASE)
- **Broadcast History:** Audit trail of all SMS campaigns with reach and delivery metrics

### 📊 Tank & Reservoir Dashboard
- **Real-Time Water Levels:** Current storage percentage with visual fill indicators
- **Historical Trends:** 30-day water level history chart
- **Rainfall Forecast:** 7-day precipitation prediction from Open-Meteo
- **Release Scheduling:** Next scheduled water release time display
- **Farmer Contact Metrics:**Details about reachable registered farmers via SMS

### 🔐 Secure & Modular Architecture
- **Zero External Dependencies:** Core functionality works offline with sample data
- **Clean Separation of Concerns:** MVC-inspired structure with distinct layers
- **Automated Testing:** 29-test suite validating all major components
- **Database Handling:** PostgreSQL connection pooling with proper error handling

---

## Technical Architecture

### Frontend (Client-Side)
- **Vanilla JavaScript ES6:** No frameworks for maximum compatibility and performance
- **Modular Component System:** Each feature encapsulated in its own JS module
- **SVG-Based Visualizations:** All charts, maps, and icons use scalable vector graphics
- **CSS Design System:** Unified tokens for colors, spacing, typography, and components
- **Progressive Enhancement:** Basic functionality works without JavaScript

### Backend (Server-Side)
- **Node.js Runtime:** JavaScript backend for code reuse and developer efficiency
- **Express.js Framework:** Minimalist web framework for routing and middleware
- **PostgreSQL Database:** Relational database for structured data storage
- **RESTful API:** Standard HTTP verbs for CRUD operations on resources
- **Environment-Based Configuration:** Separate configs for development/staging/production

### Data Flow
1. **Data Ingestion:** 
   - River data from Open-Meteo API & Irrigation Department gauges
   - Farm data from manual registration or batch imports
   - Tank/reservoir data from PDF extraction utilities
2. **Processing & Storage:**
   - Data validation and normalization
   - PostgreSQL persistence for historical analysis
   - Real-time caching for dashboard updates
3. **Presentation Layer:**
   - Reactive UI updates via DOM manipulation
   - WebSocket-style polling for real-time data (simplified with setInterval)
   - SVG redraws for changing data visualizations

---

## Setup & Installation

### Prerequisites
- Node.js >= 14.x
- npm >= 6.x
- PostgreSQL >= 12.x
- Git (for version control)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/yala-maha-assist.git
cd yala-maha-assist

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys


# 5. Start the application
npm start               # Main server (http://localhost:3000)
# OR
npm run api             # API server only (http://localhost:8005)
# OR
npm run dev             # Development mode with nodemon
```

### Alternative Start Methods
```bash
# Direct Node execution
node server.js          # Main server on port 3000
node API/server.js      # API server on port 8005

# With nodemon for development
npx nodemon server.js
npx nodemon API/server.js
```

---

## API Endpoints

### Health & Status
```
GET /api/health
Returns: { status: "healthy", timestamp: "...", uptime: "..." }
```

### Farm Management
```
GET /api/farms
Returns: List of all registered farms with pagination
Query: ?village=Palugaswewa&crop=paddy&limit=10&offset=0

GET /api/farms/:id
Returns: Single farm details by ID

POST /api/farms
Body: {
  "farmerName": "string",
  "nic": "string", 
  "mobile": "string",
  "village": "string",
  "crops": [{ "category": "...", "crop": "...", "species": "...", "acres": number }],
  "totalAcres": number
}
Returns: Created farm object with assigned ID
```

### River Monitoring
```
GET /api/river
Returns: Current river status including level, discharge, flood risk, and forecast
```


## Database Schema

### mahawelitanks Table
Stores real-time reservoir and tank monitoring data:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing unique identifier |
| tank_name | VARCHAR(50) UNIQUE | Name of the reservoir/tank |
| tot_capacity_mcm | DECIMAL(6,3) | Total capacity in million cubic meters |
| water_level_msl | DECIMAL(7,3) | Water level in meters above sea level |
| storage_mcm | DECIMAL(6,3) | Current storage volume in MCM |
| storage_percentage | DECIMAL(6,2) | Storage as percentage of capacity |
| covered_land_acres | INT | Irrigated land area in acres |
| rainfall_last_24h_mm | DECIMAL(6,3) | Rainfall in last 24 hours (mm) |
| createdAt | TIMESTAMP | Record creation timestamp |

*Schema definition located at: `API/models/schema.sql`*

---

## Testing

### Automated Test Suite
The project includes a comprehensive test suite validating:
- Domain configurations (farm & river settings)
- NIC validation & privacy masking algorithms
- Translation completeness (English/Sinhala/Tamil)
- File existence for all static assets
- HTTP server responsiveness
- REST API endpoint functionality
- Database connectivity and queries

### Running Tests
```bash
# Run all tests
npm test

# Run tests with verbose output
node test/test-suite.js
```

### Test Coverage
- **Configuration Tests:** 4 tests
- **Security/Privacy Tests:** 5 tests  
- **File Existence Tests:** 9 tests
- **HTTP/API Tests:** 11 tests
- **Total:** 29 automated tests

---

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yala-maha
DB_USER=postgres
DB_PASSWORD=your_password

# API Configuration (Optional)
OPEN_METEO_API_KEY=your_api_key_here
IRRIGATION_DEPT_API_KEY=your_api_key_here

# Server Ports
MAIN_SERVER_PORT=3000
API_SERVER_PORT=8005

# Feature Flags
ENABLE_SMS_GATEWAY=true
ENABLE_AUTO_ALERTS=true
```

### Configuration Files
- **API/config/db.js:** Database connection parameters


---

## Deployment

### Development Deployment
1. Follow the Setup & Installation steps above
2. Use `npm run dev` for automatic restart on file changes & Use `npm run api` to Start the api
3. Access at:
   - Main Interface: http://localhost:3000
   - API Documentation: http://localhost:8005/api/
    -Mahaweli Tanks/Resrviours api http://localhost:8005/api/mahaweli

   - Farmer Portal: http://localhost:3000/portal

### Production Deployment Considerations


---

## Project Dependencies

### Production Dependencies
- **express@^5.3.0** - Web framework
- **cors@^2.8.6** - Cross-origin resource sharing (API)
- **dotenv@^18.0.7** - Environment variable loading
- **joi@^18.2.9** - Schema validation (API)
- **pg@^8.23.1** - PostgreSQL client

### Development Dependencies
- **nodemon@^1.14.10** - Development server auto-restart
- **pdfplumber** - PDF text/table extraction (Python utility)

---

## Data Sources & Integration

### External APIs
2. **Open-Meteo Weather API:** 7-day rainfall forecasts for catchment areas
3. **Irrigation Department Gauges:** Real-time river level measurements (JSON endpoint)

### File-Based Data Sources
- **PDF Extraction:** Tank/reservoir Mahaweli Autority data from PDF reports using `get-mahaweli-tank-data.py`
- **Reservoir data:** from  Department of Irrigation Pubished Documents

---

### Testing Guidelines
- Write tests for new features before implementation
- Test edge cases and error conditions
- Mock external API calls in tests
- Keep tests focused and independent

---


---

## Acknowledgments

- **Sri Lanka Mahaweli Authority:** For providing irrigation infrastructure data
- **Department of Irrigation:** For real-time gauge station data
- **Open-Meteo:** For free access to rain and weather APIs
- **Contributors:** All developers, testers, and domain experts who contributed to this project

---

## Contact & Support

For questions, issues, or contributions:
- **Issues:** Use the GitHub Issues tab
- **Documentation:** Refer to this README and inline code comments
- **Configuration:** Check the `.env.example` and config files for guidance

**Yala-Maha Assist · Empowering Sri Lankan Agriculture Through Technology**

---
*Last Updated: October 2026*
