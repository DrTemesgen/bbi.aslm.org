# BBI Africa — Biosafety & Biosecurity Initiative

A Progressive Web App (PWA) and mobile application for the **Biosafety and Biosecurity Initiative (BBI)** — a continental programme led by **Africa CDC** in collaboration with the **African Society for Laboratory Medicine (ASLM)** to strengthen biosafety and biosecurity systems across all 55 African Union Member States.

It works as a **website** in any browser **and** packages into an **Android app for Google Play** (the same workflow as the SLIPTA Self-Assessment app, via [PWABuilder](https://www.pwabuilder.com/)).

> ℹ️ This is an **unofficial reference application** built for the BBI programme. Content is summarised from public Africa CDC and ASLM communications (2019–2025). For official information see [aslm.org](https://aslm.org) and [africacdc.org](https://africacdc.org).

---

## Features

| Page | Description |
|------|-------------|
| **Home** | Overview, key statistics, the five strategic pillars, and the initiative timeline. |
| **Dashboard** | Continental progress: country engagement by region, status breakdown, pillar progress, and a country tracker. Charts are pure SVG/CSS — no external libraries, fully offline. |
| **Directory** | Searchable, filterable professional directory of certified biosafety & biosecurity practitioners (currently illustrative sample data). |
| **Framework** | The official **Regional BSBS Legal Framework (2023)** and its six regulatory domains, with the full PDF bundled in `resources/`. |
| **Training** | The Regional Training & Certification Programme and course catalogue. |
| **Resources** | Frameworks, strategies, guidance and media, searchable by category. |
| **News** | Missions, trainings and strategy milestones, filterable by region. |
| **About** | The initiative, the 2025–2030 strategy, partners and funders. |

Plus full **PWA** support: installable, offline-capable (service worker app shell), app icons, and home-screen shortcuts.

## Tech stack

- **Vanilla HTML / CSS / JavaScript** — no build step, no framework. Open `index.html` and it runs.
- A single design system in [`css/styles.css`](css/styles.css).
- Shared header/footer injected by [`js/app.js`](js/app.js); all content data lives in [`js/data.js`](js/data.js).
- Offline support via [`service-worker.js`](service-worker.js) and [`manifest.webmanifest`](manifest.webmanifest).

## Run locally

No dependencies needed to run. Serve the folder with any static server:

```bash
# Python
python -m http.server 8080
# or Node
npx serve .
```

Then open <http://localhost:8080>. (A server is recommended over opening the file directly so the service worker and manifest load correctly.)

## Edit the content

All content is data-driven — edit [`js/data.js`](js/data.js):

- `BBI.metrics` — headline numbers on the home/dashboard pages.
- `BBI.directory` — **replace the illustrative sample profiles** with the official roster of certified professionals.
- `BBI.countries`, `BBI.news`, `BBI.resources`, `BBI.trainings`, `BBI.pillars`, `BBI.timeline`.

## App icons

Icons in `assets/icons/` are generated from [`assets/icons/icon.svg`](assets/icons/icon.svg). To regenerate after editing the SVG:

```bash
npm i sharp
node gen-icons.mjs
```

## Package for Google Play (Android)

This PWA is ready for [PWABuilder](https://www.pwabuilder.com/):

1. Deploy the site to a public HTTPS URL (e.g. `https://bbi.aslm.org` via GitHub Pages or your host).
2. Go to PWABuilder, enter the URL, and generate the Android package.
3. Use package name **`org.aslm.bbi`** (or your preferred ID).
4. Host the generated `assetlinks.json` at `https://bbi.aslm.org/.well-known/assetlinks.json`, filling in your signing key's SHA-256 fingerprint (see [`assetlinks.json`](assetlinks.json) for the template).
5. Upload the `.aab` to Google Play Console.

## Deploy as a website (GitHub Pages)

GitHub Pages is enabled on this repo. The live URL is:

- **https://drtemesgen.github.io/bbi.aslm.org/**

### Moving to the custom domain `bbi.aslm.org`

Requires a DNS change on the `aslm.org` domain (done by whoever manages ASLM's DNS):

1. At the `aslm.org` DNS provider, add a **CNAME record**: `bbi` → `drtemesgen.github.io`.
2. In this repo: **Settings → Pages → Custom domain** → enter `bbi.aslm.org` → Save.
   (This recreates a `CNAME` file containing `bbi.aslm.org`.)
3. Wait for the DNS check to pass, then tick **Enforce HTTPS**.

Until the DNS record exists, use the `drtemesgen.github.io` URL above.

## License & attribution

Built for ASLM / Africa CDC. "BBI", "Africa CDC" and "ASLM" names and any official logos belong to their respective organisations.
