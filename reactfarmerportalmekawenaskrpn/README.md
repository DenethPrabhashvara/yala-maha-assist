# Yala-Maha Assist — Farmer Portal

Mobile-first React + Vite app for smallholder farmers in the Mahaweli B zone: flood warnings, tank levels, water release times, canal issue reports and 4-stage farm registration, in English, Sinhala and Tamil.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
npm run dev -- --host # to test on lan un different devices
npm run dev:phone # https on the LAN, needed to test GPS / farm registration on a phone
```

Phones only allow GPS on `https://` (or `localhost`), and farm registration needs GPS. `npm run dev:phone` serves
`https://<your-pc-ip>:5173` with a self-signed certificate: open the **Network** address on the phone, tap
**Advanced → Proceed** on the certificate warning once, then allow location.

On a desktop browser the app shows inside a phone frame; on a phone it fills the screen. It can be added to the home screen (PWA manifest included).

## Screens

| Route | Screen |
|---|---|
| `/` | Splash |
| `/welcome` | 3-slide onboarding (swipe or tap) |
| `/language` | English / සිංහල / தமிழ் |
| `/login` → `/otp` | Phone number + 6-digit SMS code with 60 s resend timer |
| `/home` | Flood alert, tank level (switch tanks), next water release, 3-day rain + advice, my fields |
| `/water` | Aerial tank & canal map, 7-day tank chart, water release schedule, SMS reminder |
| `/forecast?tank=horabora` | 14-day ML tank-level forecast: chart with likely range, spill/low lines, daily rain, day-by-day list, risk and advice |
| `/report` | Canal issue report (type, place, notes, photo) + "My reports" |
| `/alerts` | Notifications with unread state |
| `/fields` | Registered farm and crops |
| `/profile` | Language, SMS alerts switch, help contacts, log out |
| `/register/identity` | Stage 1 — name, NIC (old 9+V / new 12-digit, masked), verified phone |
| `/register/crops` | Stage 2a — multiple crops, category → type → variety, acres, yield + unit, running total |
| `/register/pin` | Stage 2b (required) — asks for location access on open; satellite map (free Leaflet map, or Google with a key), drag the pin to adjust, village search, distance to nearest tank. Continue is disabled until GPS gives a position; offline shows a "connect to the internet" retry card |
| `/register/water` | Stage 2c — where the field gets water: tank (which one), canal, river, agro-well or rain only. Pre-selects the tank/canal nearest the pin |
| `/register/review` | Stage 3 — summary + agrarian consent |
| `/register/done` | Stage 4 — Farm ID |
| `/error` | Error screen (also shown automatically if a page crashes) |
| anything else | 404 page |

An offline banner appears when the phone loses its connection.

## Demo behaviour

- **Sign-in is real.** The OTP is sent by the API (`API/routes/authroutes.js`) through Text.lk. Set `SMS_DRY_RUN=true` in the API to print codes in its console instead.
- Farm details are also kept in the browser (`localStorage`). Profile → "Reset demo data" signs out and starts over.
- Tank levels and forecasts come from the API. River, water release and weather numbers are still sample data in `src/data.js`.

## Tank data and forecast

`npm run dev` proxies `/api` to the Express API (`AUTH_API_PROXY` in `.env`, default `http://127.0.0.1:8005`).
`src/api/reservoirs.js` reads, per reservoir id from the `reservoirs` table:

| Endpoint | Used for |
|---|---|
| `GET /api/data/reservoir` | the farmer's reservoir and the nearest others (tank chips) |
| `GET /api/data/reservoir/:id` | name, capacity and the latest reading (Home tank card) |
| `GET /api/data/reservoir/:id/history?days=14` | the last 7 readings (Home bars, Water chart) |
| `GET /api/data/reservoir/:id/forecast` | the ML forecast (Home "Next 14 days", forecast screen) |

The farm's reservoir is `farm.reservoirId` (the farmer's `reservoir_id`). Farms on a canal, river or well show the reservoir nearest to the pin.
There is no sample data: if a request fails the card says why, with a retry.

The forecast endpoint sends the reservoir's `gross_storage_acft` readings of the last 90 days to the model service (`ml-model/server.js`,
`FORECAST_API_URL` in the API). The model only knows the 43 reservoirs in `ml-model/tank_model.json`; other reservoirs show
"No forecast model for this reservoir yet". It returns one prediction 14 days ahead (not a daily series), as a fill % of gross capacity.
Risk label: "May reach spill level" at 95% or more, "May fall low" at 30% or less.

## Maps (farm pin)

The pin step picks a map in this order:

1. **Google Maps**, if `VITE_GOOGLE_MAPS_API_KEY` is set (see below).
2. **Free map (default)**: Leaflet with Esri World Imagery satellite tiles, OpenStreetMap street tiles and
   OpenStreetMap Nominatim village search (`src/components/LeafletFarmMap.jsx`). No account, key or billing.
   Keep the map attribution visible, and keep search on submit only: Nominatim allows at most 1 request per
   second and no search-as-you-type. For heavy production traffic, move to a paid or self-hosted tile/search provider.
With no internet the step shows a retry card (and retries by itself when the connection returns).

**Location is required.** The step requests GPS as soon as it opens and Continue stays disabled until the phone
returns a position (`draft.located`); the farmer can then drag the pin onto the exact field. Browsers only allow
GPS on `https://` or `localhost`, so test registration on a phone over HTTPS (plain `http://192.168.x.x:5173` blocks it).

### Optional: Google Maps

1. In Google Cloud Console enable **Maps JavaScript API** (and **Geocoding API** for the village search box).
2. Create an API key, restrict it to your site (HTTP referrers, e.g. `http://localhost:5173/*` and your domain).
3. Put it in `.env` as `VITE_GOOGLE_MAPS_API_KEY=...` and restart `npm run dev`.

The pins use Advanced Markers, which need a Map ID. `DEMO_MAP_ID` is used by default; set `VITE_GOOGLE_MAPS_MAP_ID` for production.
If the key is rejected, the pin step falls back to the free map.
GPS ("Use my location") needs HTTPS on a real phone (localhost is fine for testing).

The tanks on the maps and in the water-source search are `RESERVOIRS` in `src/reservoirs.js`, generated from `reservoirs_data.json` by `npm run reservoirs`.
`aka` holds other spellings farmers may search for (the Mahaweli Authority names, e.g. Rajanganaya for Rajangana).

The saved pin is `draft.pin = { lat, lng, accuracy? }`, with `draft.located = true` once GPS has succeeded. The water answer is `draft.water = { source, name }`, where `source` is one of `tank | canal | river | well | rain`.

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
| Sign-in and registration | Done: `src/api/auth.js` (OTP, register, NIC sign-in, token refresh, profile update) |
| Tank levels and forecast | Done: `src/api/reservoirs.js` |
| Tank / canal / river lists for the water-source step | `src/reservoirs.js` (generated), `CANALS`, `RIVERS` in `src/data.js` |
| River gauges, water release schedule, weather | Replace the exports in `src/data.js` with API calls (e.g. Open-Meteo for rain) |
| Submit reports | `src/pages/Report.jsx` (`submit`) |
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
