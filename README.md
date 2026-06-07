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
| **Dashboard** | Now includes an **interactive Africa coverage map** (SVG choropleth from GeoJSON) coloured by engagement status, with hover tooltips and click-to-inspect. |
| **Directory** | Searchable/filterable directory with **certification badges** (5 disciplines + year), a **mentors-only** filter, and **click-through profile pages** (`profile.html?id=…`). Sample data — replace with the official roster. |
| **Framework** | The official **Regional BSBS Legal Framework (2023)** and its six regulatory domains, with the full PDF bundled in `resources/`. |
| **Training** | Course catalogue plus **Certification Pathways** — the 5 disciplines and the Prepare → Apply → Maintain journey. |
| **Mentorship** | Mentor directory + a request/become-a-mentor form (composes an email — no backend needed). |
| **Events** | Conferences, trainings and workshops, filterable by type and region. |
| **Knowledge Hub** | Frameworks, strategy, guidance and curated external references (WHO, IFBA, BWC, IHR), searchable by category. |
| **Get Involved** | Get certified, find a mentor, join a National TWG (form), or partner with the BBI. |
| **Home** | Adds a rotating **Biosafety Hero / professional spotlight**. |
| **News** | Missions, trainings and strategy milestones, filterable by region. |
| **About** | The initiative, the 2025–2030 strategy, partners and funders. |

Feature set and structure are modelled in part on the IFBA platform (internationalbiosafety.org): professional certifications, a certified-professionals register, a mentorship programme, a spotlight, an events series and a knowledge hub.

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

## Applications, accounts & admin (Firebase)

The app includes an **end-to-end application system**: applicants create an account with their **email + password**, an administrator **approves** the account, and then the applicant submits an Expression of Interest to the **RTCP-BBP** programme and tracks its status. Administrators review registrations and applications in a gated **admin panel** (`admin.html`).

It runs entirely from the static frontend using **Firebase** (Auth + Firestore) — no server to host, and **email auth is free** (no SMS/billing). It stays dormant (showing a friendly "being set up" notice) until you add your Firebase config.

### One-time setup

1. **Create a Firebase project** at <https://console.firebase.google.com>.
2. **Add a Web app** (Project settings → General → Your apps → Web). Copy the config object.
3. Paste it into [`js/firebase-config.js`](js/firebase-config.js) (replace the `PASTE_…` values). These are public client keys — safe to commit.
4. **Authentication → Sign-in method →** enable **Email/Password**.
5. **Authentication → Settings → Authorized domains →** add `drtemesgen.github.io` (and `bbi.aslm.org` once DNS is live).
6. **Firestore Database → Create database** (production mode), then **Rules** → paste the contents of [`firestore.rules`](firestore.rules) → Publish.
7. **Make yourself an admin:** register once on the live site at `/login.html`, copy the **User ID** shown on `/account.html`, then in Firestore create a collection **`admins`** with a document whose **ID = that User ID** (any field/value). Reload `/admin.html`.

### How approval works

- A new user registers (`users/{uid}` is created with `approved: false`).
- They see a **"pending approval"** banner and cannot submit yet.
- In **Admin → Registrations**, an admin clicks **Approve**; the user can then submit applications.
- The Firestore rules enforce this: only approved users can create an application.

> **Note:** Firebase **email** auth has no per-message cost (unlike SMS), so no Blaze billing is required for sign-in. Verification emails are sent automatically; approval is still done by an admin.

### Document uploads

This version captures document **links** (e.g. Google Drive/OneDrive). Direct file uploads can be added later with **Firebase Storage** (requires the Blaze plan).

## License & attribution

Built for ASLM / Africa CDC. "BBI", "Africa CDC" and "ASLM" names and any official logos belong to their respective organisations.
