# Tile Wizards Website

Static multi-page marketing website for a tile installation business in Toronto and the GTA.

## Key Features
- Multi-page site: Home, Services, Portfolio, Privacy, 404.
- Dynamic HTML partial loading for shared sections (`header`, `footer`, `services`, `portfolio`, `faq`, `contact`).
- Data-driven portfolio grid with category filters and URL-synced filter state.
- Custom lightbox with keyboard support, focus management, and touch swipe gestures.
- Contact section with optional interactive service-area map (Mapbox + Turf), plus fallback mode.
- Built-in UX/SEO baseline: canonical tags, OG/Twitter tags, JSON-LD (`FAQPage`, `LocalBusiness`), `robots.txt`, `sitemap.xml`.
- Basic analytics event hooks for CTA clicks, phone taps, and form submits.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [How the App Works](#how-the-app-works)
- [Prerequisites](#prerequisites)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Available Commands](#available-commands)
- [Deployment](#deployment)
- [SEO and Structured Data](#seo-and-structured-data)
- [Tracking and Analytics](#tracking-and-analytics)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)

## Tech Stack
- **Markup**: HTML5
- **Styling**: CSS3 (`assets/css/main.css`, `assets/css/portfolio.css`, `assets/css/responsive.css`)
- **JavaScript**: Vanilla JS modules by responsibility
- **Data files**:
  - `assets/data/portfolio.json` (portfolio cards/content)
  - `assets/data/service-area.geojson` (map service zone)
  - `assets/data/services.json` (currently reserved/unused)
- **Map / geospatial (lazy-loaded on demand)**:
  - Mapbox GL JS
  - Mapbox Geocoder
  - Turf.js
- **Hosting/deploy pipeline**: GitHub Pages via GitHub Actions (`.github/workflows/deploy-pages.yml`)

## Repository Structure
```text
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── portfolio.css
│   │   ├── responsive.css               # bundled responsive stylesheet
│   │   └── responsive/                  # responsive source modules
│   ├── data/
│   │   ├── portfolio.json
│   │   ├── service-area.geojson
│   │   └── services.json
│   ├── images/
│   └── js/
│       ├── main.js
│       ├── gallery.js
│       ├── map.js
│       ├── config.public.js
│       └── config.example.js
├── partials/
│   ├── header.html
│   ├── footer.html
│   ├── services.html
│   ├── portfolio.html
│   ├── faq.html
│   └── contact.html
├── index.html
├── services.html
├── portfolio.html
├── privacy.html
├── 404.html
├── robots.txt
└── sitemap.xml
```

## How the App Works

### 1. Page composition with partials
- Pages include placeholders like:
  - `<div data-include="partials/header.html"></div>`
  - `<div data-include="partials/footer.html"></div>`
- `assets/js/main.js` fetches these fragments in parallel and injects them into the DOM.
- After injection, it dispatches a custom event: `partialsLoaded`.
- Other modules initialize on `partialsLoaded`, so they can reliably target injected markup.

### 2. JavaScript module responsibilities
- `assets/js/main.js`
  - loads partials
  - mobile menu behavior + accessibility state
  - sticky mobile CTA visibility logic
  - cookie notice state (`localStorage`)
  - lazy image attributes
  - FAQ accordion behavior
  - smooth anchor scrolling with `prefers-reduced-motion` support
  - CTA/phone/form tracking hooks
  - hero interactive pointer effect (desktop/hover only)
- `assets/js/gallery.js`
  - loads portfolio entries from `assets/data/portfolio.json`
  - renders cards dynamically
  - filter buttons and URL sync (`?filter=...`)
  - custom lightbox (keyboard, focus trap, swipe)
- `assets/js/map.js`
  - lazy-loads map assets only when map section enters viewport (`IntersectionObserver`)
  - loads service area polygons from `assets/data/service-area.geojson`
  - performs point-in-polygon checks via Turf
  - falls back to manual mode if token/assets fail

### 3. Data flow
```text
JSON / GeoJSON -> JS module -> DOM render -> user interaction -> tracking events (optional)
```

### 4. CSS architecture
- `main.css`: legacy/base desktop-first styles + component visuals.
- `portfolio.css`: portfolio/lightbox-specific styles.
- `responsive.css`: bundled responsive overrides sourced from `assets/css/responsive/**`.
- `assets/css/responsive/README.md` documents the responsive token/layer strategy.

## Prerequisites
- A modern browser (Chrome/Edge/Firefox/Safari).
- One of the following local static servers:
  - Python 3 (`python -m http.server`)
  - Node.js (`npx serve`)

Important: this project uses `fetch()` for partials and JSON files.  
Opening `index.html` directly via `file://` will break dynamic content loading.

## Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd tilewizards
```

### 2. Start a local static server
Option A (Python):
```bash
python -m http.server 8080
```

Option B (Node.js):
```bash
npx serve . -l 8080
```

### 3. Open the site
- Home: `http://localhost:8080/index.html`
- Services: `http://localhost:8080/services.html`
- Portfolio: `http://localhost:8080/portfolio.html`
- Privacy: `http://localhost:8080/privacy.html`

## Configuration

### Mapbox public token
Map features depend on `window.MAPBOX_TOKEN`.

Files:
- `assets/js/config.public.js` -> committed, intentionally empty in Git.
- `assets/js/config.example.js` -> token template.

Local development options:
1. Temporary direct edit (simple):
   - set token in `assets/js/config.public.js`
2. Optional local override file (cleaner):
   - create `assets/js/config.local.js` from example
   - include it after `config.public.js` in local HTML only

Recommended token hardening:
- Use a public (`pk...`) token only.
- Restrict token by allowed domain(s) in Mapbox dashboard.

### GitHub Pages secret
For CI deployment, set repo secret:
- `MAPBOX_PUBLIC_TOKEN`

The workflow injects this value into `assets/js/config.public.js` during deployment.

## Development Workflow

### Update page content/layout
- Edit page shells:
  - `index.html`, `services.html`, `portfolio.html`, `privacy.html`, `404.html`
- Edit shared sections:
  - `partials/*.html`

### Update portfolio content
- Edit `assets/data/portfolio.json`
- Keep fields consistent:
  - `title`, `category`, `cover`, `images[]`, `summary`, `location`, etc.

### Update service area polygons
- Edit/replace `assets/data/service-area.geojson`
- `map.js` supports both `Feature` and `FeatureCollection` polygon geometries.

### Responsive CSS source vs bundle
- Source modules live under `assets/css/responsive/**`
- Runtime file loaded by pages: `assets/css/responsive.css`
- After source edits, regenerate the bundle.

PowerShell bundle command:
```powershell
$parts = @(
  "assets/css/responsive/reset.css",
  "assets/css/responsive/global.css",
  "assets/css/responsive/utilities.css",
  "assets/css/responsive/sections/section-base.css",
  "assets/css/responsive/sections/services.css",
  "assets/css/responsive/sections/portfolio.css",
  "assets/css/responsive/sections/reviews.css",
  "assets/css/responsive/sections/faq.css",
  "assets/css/responsive/sections/contact.css",
  "assets/css/responsive/header.css",
  "assets/css/responsive/hero.css",
  "assets/css/responsive/footer.css",
  "assets/css/responsive/pages/home.css",
  "assets/css/responsive/pages/privacy.css",
  "assets/css/responsive/pages/portfolio.css"
)

$out = "/* Bundled responsive stylesheet (generated to remove @import request waterfall). */`n`n"
$out += (($parts | ForEach-Object {
  "/* Source: $_ */`n" + (Get-Content -Raw $_).TrimEnd() + "`n`n"
}) -join "")

[IO.File]::WriteAllText(
  "assets/css/responsive.css",
  $out.TrimEnd() + "`n",
  [Text.UTF8Encoding]::new($false)
)
```

## Available Commands

| Command | Purpose |
|---|---|
| `python -m http.server 8080` | Run local static server (Python). |
| `npx serve . -l 8080` | Run local static server (Node.js). |
| `node --check assets/js/main.js` | Syntax-check `main.js`. |
| `node --check assets/js/gallery.js` | Syntax-check `gallery.js`. |
| `node --check assets/js/map.js` | Syntax-check `map.js`. |
| `rg --files` | Fast repository file listing. |
| `rg -n "pattern" <paths>` | Fast code/text search. |

## Deployment

### GitHub Pages (configured)
Workflow file: `.github/workflows/deploy-pages.yml`

Trigger:
- push to `main`
- manual `workflow_dispatch`

Pipeline steps:
1. checkout repository
2. inject `MAPBOX_PUBLIC_TOKEN` into `assets/js/config.public.js`
3. upload repository root as Pages artifact
4. deploy to GitHub Pages

### Setup checklist
1. `Settings -> Pages -> Build and deployment -> Source: GitHub Actions`
2. Add repository secret `MAPBOX_PUBLIC_TOKEN`
3. Push to `main`

### Other static hosts
This project can also run on Netlify, Vercel, Cloudflare Pages, or any static server because no build step is required.

## SEO and Structured Data
- Canonical URLs on key pages.
- Open Graph and Twitter metadata on public pages.
- JSON-LD:
  - `FAQPage` on home
  - `LocalBusiness` on home/services/portfolio
- Crawl support:
  - `robots.txt`
  - `sitemap.xml`

## Tracking and Analytics

`assets/js/main.js` emits events if either `gtag` or `dataLayer` is present:
- `phone_click`
- `cta_click`
- `form_submit`

This repository does not include GA/GTM snippet installation itself.  
Add your analytics provider script in page templates as needed.

## Troubleshooting

### Partials or portfolio cards are not loading
Symptoms:
- Empty header/footer/sections
- Empty portfolio grid

Fix:
1. Serve via HTTP (`python -m http.server`), not `file://`.
2. Check DevTools Network for `partials/*.html` and `assets/data/portfolio.json`.

### Map shows fallback / no interactive search
Fix:
1. Ensure `window.MAPBOX_TOKEN` is set to a valid public token.
2. Verify outbound access to:
   - `api.mapbox.com`
   - `unpkg.com`
3. Ensure `assets/data/service-area.geojson` is present and valid JSON.

### Mobile menu / sticky CTA behavior seems stale
Fix:
1. Hard refresh (`Ctrl+F5`).
2. Clear site data for localStorage key:
   - `tilewizards_cookie_notice_accepted`

### Styles look inconsistent after responsive edits
Fix:
1. Regenerate `assets/css/responsive.css` from `assets/css/responsive/**`.
2. Hard refresh browser cache.

## Known Limitations
- No backend form processing is included. The contact form is UI-only by default.
- No automated test suite/linter pipeline is currently defined.
- Interactive map script is included on `index.html`; pages that reuse contact markup without `map.js` will not have live map behavior unless you include map scripts there as well.
