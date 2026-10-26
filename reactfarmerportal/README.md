# Yala-Maha Assist — Farmer Portal

Mobile-first React + Vite app for smallholder farmers in the Mahaweli B zone: flood warnings, tank levels, Kapawa water-release times, canal issue reports and 4-stage farm registration, in English, Sinhala and Tamil.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
npm run dev -- --host # to test on lan un different devices
```

On a desktop browser the app shows inside a phone frame; on a phone it fills the screen. It can be added to the home screen (PWA manifest included).

## Screens

| Route | Screen |
|---|---|
| `/` | Splash |
| `/welcome` | 3-slide onboarding (swipe or tap) |
| `/language` | English / සිංහල / தமிழ் |
| `/login` → `/otp` | Phone number + 6-digit SMS code with 60 s resend timer |
| `/home` | Flood alert, tank level (switch tanks), Kapawa, 3-day rain + advice, my fields, test SMS |
| `/water` | Aerial tank & canal map, 7-day tank chart, Kapawa schedule, SMS reminder |
| `/forecast?tank=horabora` | 14-day ML tank-level forecast: chart with likely range, spill/low lines, daily rain, day-by-day list, risk and advice |
| `/report` | Canal issue report (type, place, notes, photo) + "My reports" |
| `/alerts` | Notifications with unread state |
| `/fields` | Registered farm and crops |
| `/profile` | Language, SMS alerts switch, help contacts, log out |
| `/register/identity` | Stage 1 — name, NIC (old 9+V / new 12-digit, masked), verified phone |
| `/register/crops` | Stage 2a — multiple crops, category → type → variety, acres, yield + unit, running total |
| `/register/pin` | Stage 2b — Google satellite map with "Use my location" (GPS), tap/drag pin, village search, distance to nearest tank; falls back to the schematic canal map without a key. Skip or SMS reminder |
| `/register/water` | Stage 2c — where the field gets water: tank (which one), canal, river, agro-well or rain only. Pre-selects the tank/canal nearest the pin |
| `/register/review` | Stage 3 — summary + agrarian consent |
| `/register/done` | Stage 4 — Farm ID |
| `/error` | Error screen (also shown automatically if a page crashes) |
| anything else | 404 page |

An offline banner appears when the phone loses its connection.

## Demo behaviour

- **SMS is simulated.** Text.lk messages appear as a phone-style notification at the top. The OTP code shown there is the one that works.
- Data is saved in the browser (`localStorage`). Profile → "Reset demo data" starts over.
- Tank, river, Kapawa and weather numbers are sample data in `src/data.js`.

## Forecast API contract

The app calls `GET {VITE_API_URL}/api/forecast/tanks/{tankId}?days=14` (React → Express → FastAPI).
Copy `.env.example` to `.env` and set `VITE_API_URL` to your Express server. Without it, or if the call fails,
the app shows sample predictions labelled "Sample data".

```json
{
  "tank_id": "horabora",
  "tank_name": "Horabora Wewa",
  "generated_at": "2026-10-25T06:00:00+05:30",
  "model_version": "rf-v1",
  "unit": "percent",
  "thresholds": { "low": 30, "spill": 95 },
  "history":  [{ "date": "2026-10-19", "level_pct": 52.0 }],
  "forecast": [{ "date": "2026-10-26", "level_pct": 59.1, "lower": 57.8, "upper": 60.4, "rain_mm": 4.2 }]
}
```

- `forecast` should have 14 items. `lower`/`upper` (likely range) are optional; without them the app draws ±2%.
- `history` (last 7 observed days) is optional; without it the app uses its own sample history.
- Tank ids must match `TANKS` in `src/data.js` (`kudawewa`, `palugaswewa`, `horabora`) — add your other tanks there.
- `server-examples/` has a ready Express route and a FastAPI endpoint that returns this shape using Open-Meteo rain.

The forecast drives: the Home "Next 14 days" card, the forecast screen, and the risk label
("May reach spill level" if the upper range touches the spill line, "May fall low" if the lower range reaches the low line).

## Google Maps (farm pin)

1. In Google Cloud Console enable **Maps JavaScript API** (and **Geocoding API** for the village search box).
2. Create an API key, restrict it to your site (HTTP referrers, e.g. `http://localhost:5173/*` and your domain).
3. Put it in `.env` as `VITE_GOOGLE_MAPS_API_KEY=...` and restart `npm run dev`.

The pins use Advanced Markers, which need a Map ID. `DEMO_MAP_ID` is used by default; set `VITE_GOOGLE_MAPS_MAP_ID` for production.
Without a key, or if the key is rejected, the pin step shows the offline schematic map instead.
GPS ("Use my location") needs HTTPS on a real phone (localhost is fine for testing).

Tanks appear on the map and count for "nearest tank" only if they have `lat`/`lon` in `TANKS` (`src/data.js`). Only Horabora Wewa has coordinates now: add the others.

The saved pin is `draft.pin = { lat, lng, accuracy? }` (schematic map: `{ x, y }`). The water answer is `draft.water = { source, name }`, where `source` is one of `tank | canal | river | well | rain`.

## Colours

The palette is navy / sky blue with amber for warnings and red for danger, built in OKLCH (even lightness steps per hue).
The top of `src/styles.css` has two layers:

- **Reference ramps** (`--slate-*`, `--navy-*`, `--sky-*`, `--blue-*`, `--amber-*`, `--red-*`, `--green-*`): hex values with the OKLCH source in a comment. Hex is used so older phone browsers without `oklch()` still show colour.
- **Semantic roles** (`--ink`, `--muted`, `--accent`, `--dark`, `--info-*`, `--warning-*`, `--danger-*`…): components use only these.

`src/theme.js` repeats the few colours needed in SVG and inline styles; keep it in step with `styles.css`.
All text/background pairs pass WCAG (4.5:1 text, 3:1 shapes). The green field illustrations are intentionally left green.

## Photos

Real photos live in `public/photos/` and are listed in `PHOTOS` (`src/data.js`). Pass one to `<Aerial photo={PHOTOS.paddy} />`.
They are from Wikimedia Commons under CC BY / CC BY-SA. Keep `public/photos/CREDITS.md`, and credit the authors on an About screen or in the store listing.
Swap in your own field photos by replacing the files (keep them around 960 px wide).

## Connecting real services

| What | Where to change |
|---|---|
| Send / verify OTP via Text.lk | `src/pages/Login.jsx` (`submit`) and `src/pages/Otp.jsx` (`verify`) — call your backend; never put the Text.lk API key in the frontend |
| Tank / canal / river lists for the water-source step | `TANKS`, `CANALS`, `RIVERS` in `src/data.js` |
| Tank levels, river gauges, Kapawa, forecast | Replace the exports in `src/data.js` with API calls (e.g. Open-Meteo for rain) |
| Submit reports & registrations | `src/pages/Report.jsx` (`submit`), `src/pages/register/RegReview.jsx` (`submit`) |
| Translations | `src/i18n.js` — Sinhala and Tamil should be checked by a native speaker |
| Help contacts | `src/pages/Profile.jsx` — replace the `[OFFICER NAME]`, `[PHONE]`, `[ADDRESS]` placeholders |

## Structure

```
src/
  App.jsx              routes, auth guard, nav, banners
  state/AppContext.jsx app state, persistence, phone/NIC helpers
  i18n.js              EN / SI / TA strings
  data.js              sample data, crop catalogue, map features
  components/          Icon, UI (buttons, nav, toasts…), Sheet, ErrorBoundary
  pages/               all screens (register/ holds the 4 stages)
  styles.css           design tokens and all styles
```
