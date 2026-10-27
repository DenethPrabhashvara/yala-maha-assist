# YalaMaha — National Water Command Center

The admin portal for Yala Maha Assist, built with React 19, Vite 8 and Recharts. It shows reservoir storage, river gauges, farmers and the water issue schedule from the API database, sends SMS to farmers, and lets admins browse and edit every table.

Everything comes from the API's `/admin` routes (see `API/routes/ADMIN/`). Admins sign in with a username and password; the access token is kept in memory and a refresh cookie keeps the session across reloads.

| Role | Can |
| --- | --- |
| `officer` | View everything |
| `admin` | Also edit and delete farmers, log reservoir readings, send SMS, change table rows |
| `super_admin` | Also manage admin accounts (`admins`, `admin_sessions`) and create admins in Settings |

## Run locally

Start the API first (`cd API && npm run api`, port 8005). Create the first account once:

```bash
cd API
node scripts/create-admin.js <username> "<full name>" super_admin
```

Then:

```bash
npm install
npm run dev
```

The dev server proxies `/admin` to `http://localhost:8005` (set `API_URL` to change it). For a build served from another host, set `VITE_API_URL` to the API's address and add the portal's origin to the API's `CORS_ORIGINS`.

The dev server prints the local URL (default `http://localhost:5173`). To force a specific port:

```bash
npm run dev -- --port 5180
```

## Production build

```bash
npm run build
npm run preview
```

## Sections

| Route | Section | Highlights |
| --- | --- | --- |
| `/login` | Sign in | Username and password; 5 wrong passwords lock the username for 15 minutes |
| `/` | Dashboard | KPIs, 30-day average storage, farmers by district, rainfall and spilling reservoirs, alerts |
| `/tanks` | Tank & Reservoir | Reservoir register with latest readings, map view, 30-day history, field-reading form, CSV export |
| `/rivers` | River | River gauges with alert, minor and major flood levels, 24-hour hydrographs |
| `/sms` | SMS Gateway | Send to all farmers, a district, reservoir or tank; templates; campaign history; high tank alert check |
| `/farmers` | Farmer Portal | Farmer registry (search, profile, farm and crops, edit, deactivate, delete) and the water issue schedule |
| `/database` | Database | Every table: browse, sort, edit, add and delete rows (password, token and NIC hashes are hidden) |
| `/settings` | Settings | Account, change password, create admins (super_admin), theme |

## Project structure

```
src/
├── components/
│   ├── charts/       Recharts wrappers and shared chart theme
│   ├── layout/       Sidebar, topbar, app shell, command palette
│   └── ui/           Buttons, cards, badges, overlays, gauges, tables
├── api/              Fetch wrapper for /admin with token refresh
├── context/          Auth, data (loads and shapes the API data), theme and toast providers
├── data/             Turn API rows into what the pages show
├── pages/            Dashboard, Tanks, Rivers, SmsGateway, FarmerPortal, Database, Settings, Login
├── styles/           Design tokens and modular CSS (base, layout, components, pages, responsive)
└── utils/            Formatting, class names, CSV export
```

## Features

- Global search with `⌘K` / `Ctrl K` command palette
- Light and dark themes with persisted preference
- Full keyboard focus states and reduced-motion-safe styling
- Responsive layouts from mobile through wide desktop
- Interactive charts with consistent tooltips and colour tokens
- Toast feedback for exports, forms and campaign actions
