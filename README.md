# Color Atlas World

A standalone, public country reference website for **coloratlasworld.com**.

The atlas includes:

- 207 searchable country, territory, and educational profiles;
- daily facts, compact infographic snapshots, comparisons, and special reports;
- dated demographic and economic indicators with source links;
- responsive layouts for desktop, tablet, and mobile;
- Cloudflare-native deployment through vinext and Workers.

## Data sources

- Demographic snapshots use the **United Nations DESA Population Division, World Population Prospects 2024 Revision**, with values labeled as the **2026 medium projection**.
- Historical and economic series use the latest available World Bank observations and display their observation year.
- The Special Report keeps historical observations, the UN current demographic baseline, and Color Atlas World educational projections visibly separate.

Regenerate the UN demographic dataset from the official downloads:

```bash
npm run data:un
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
```

## Routes

- `/`
- `/countries/:slug`
- `/compare`
- `/compare/:pair`
- `/analytics`

This repository is independent from the existing Color Atlas livestream apps.
