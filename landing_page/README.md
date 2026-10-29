# Yala Maha Assist — landing page

The public landing page for the Yala Maha Assist farmer app (Next.js 16, Tailwind CSS 4).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Before deploying

Set the farmer app's public address. It is used for every "Open the app" button and for the QR code:

```bash
NEXT_PUBLIC_APP_URL=https://your-farmer-app-address npm run build
```

Without it the page links to `http://localhost:5174` (the farmer portal's dev server).

## Where things are

- `lib/site.ts` — app name, app link and the coverage numbers shown on the page (117 reservoirs, 40 river gauges, 55 canal sections, 14-day forecast, 3 languages). Update them here if the data grows.
- `app/page.tsx` — the page, section by section; `app/credits/page.tsx` — photo credits.
- `components/landing/` — the sections.
- `public/images/screens/` — screenshots of the farmer app in a phone frame.
- `public/images/photos/` — Wikimedia Commons photos; `CREDITS.md` lists authors and licences. CC BY-SA photos must keep their attribution (shown on `/credits`).
- `public/assets/` — the layout template's stylesheet, fonts and decorative clouds.

The layout comes from the "Habitline" template (Envato Elements, unifato); all of its text, photos and screens have been replaced.
