# Tile Wizards Website

Static multi-page marketing website for a tile installation business in Toronto and the GTA.
Last docs update: 2026-05-08.

## Key Features
- Multi-page site: Home, Services, Portfolio, Service Areas, service detail pages, location pages, Privacy, 404.
- Shared sections for header/footer/services/portfolio/FAQ/contact via `partials/*.html`.
- Data-driven portfolio grid with category filters and URL-synced filter state.
- Custom lightbox with keyboard support, focus management, and touch swipe gestures.
- Contact section with optional interactive service-area map (Mapbox + Turf), plus fallback mode.
- UX/SEO baseline: canonical tags, Open Graph/Twitter tags, JSON-LD, `robots.txt`, `sitemap.xml`.
- Cookie-aware analytics hooks for CTA clicks, phone taps, and form submits.

## Tech Stack
- Markup: HTML5
- Styling: CSS3 (`assets/css/main.css`, `assets/css/portfolio.css`, `assets/css/responsive.css`)
- JavaScript: vanilla JS (`assets/js/main.js`, `assets/js/gallery.js`, `assets/js/map.js`)
- Data: `assets/data/portfolio.json`, `assets/data/service-area.geojson`, `assets/data/services.json`
- Hosting/deploy: GitHub Pages via `.github/workflows/deploy-pages.yml`

## Repository Structure
```text
.
|-- .github/
|   `-- workflows/deploy-pages.yml
|-- assets/
|   |-- css/
|   |   |-- main.css
|   |   |-- portfolio.css
|   |   |-- responsive.css          # bundled responsive stylesheet loaded by pages
|   |   `-- responsive/             # responsive source modules
|   |-- data/
|   |-- images/
|   `-- js/
|-- docs/
|-- partials/
|-- index.html
|-- services.html
|-- portfolio.html
|-- areas.html
|-- bathroom-tile-installation-toronto.html
|-- kitchen-backsplash-installation-toronto.html
|-- floor-tile-installation-toronto.html
|-- large-format-slab-installation-toronto.html
|-- tile-installation-mississauga.html
|-- tile-installation-vaughan.html
|-- tile-installation-markham.html
|-- tile-installation-brampton.html
|-- privacy.html
|-- 404.html
|-- robots.txt
`-- sitemap.xml
```

## Local Development
This project uses `fetch()` for partials and JSON files, so opening pages via `file://` will break dynamic loading.

Run a static server:
```bash
python -m http.server 8080
```

Open:
- Home: `http://localhost:8080/index.html`
- Services: `http://localhost:8080/services.html`
- Portfolio: `http://localhost:8080/portfolio.html`
- Areas: `http://localhost:8080/areas.html`
- Privacy: `http://localhost:8080/privacy.html`

## Configuration
Runtime config is generated into `assets/js/config.public.js`.

Supported values:
- `MAPBOX_PUBLIC_TOKEN` - required for interactive Mapbox service-area features.
- `GA_MEASUREMENT_ID` - optional GA4 measurement ID.
- `GAS_WEBHOOK_URL` - optional Google Apps Script lead webhook.
- `GOOGLE_SHEETS_WEBHOOK_URL` - legacy fallback for the same webhook.

Local testing can set values directly in `assets/js/config.public.js`.

## Development Workflow
- Page shells live in root HTML files.
- Shared sections live in `partials/*.html`.
- Portfolio content lives in `assets/data/portfolio.json`.
- Service-area polygons live in `assets/data/service-area.geojson`.
- Responsive source modules live under `assets/css/responsive/**`.
- Runtime responsive bundle is `assets/css/responsive.css`.

After editing responsive source modules, regenerate `assets/css/responsive.css`:
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
  "assets/css/responsive/pages/portfolio.css",
  "assets/css/responsive/overrides.css"
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

## Useful Commands
| Command | Purpose |
|---|---|
| `python -m http.server 8080` | Run local static server. |
| `node --check assets/js/main.js` | Syntax-check `main.js`. |
| `node --check assets/js/gallery.js` | Syntax-check `gallery.js`. |
| `node --check assets/js/map.js` | Syntax-check `map.js`. |
| `bash scripts/inject-runtime-config.sh` | Generate runtime config from env vars/secrets. |
| `ASSET_VERSION=<sha> bash scripts/apply-asset-version.sh` | Replace `__ASSET_VERSION__` placeholders in root HTML files. |
| `rg --files` | Fast repository file listing. |
| `rg -n "pattern" <paths>` | Fast text search. |

## Deployment
GitHub Pages deploy is configured in `.github/workflows/deploy-pages.yml`.

The workflow:
1. Checks JavaScript syntax.
2. Checks local links in root HTML and partials.
3. Runs accessibility smoke checks.
4. Serves the site locally and smoke-tests every root HTML file, `robots.txt`, and `sitemap.xml`.
5. Injects runtime config.
6. Applies asset version cache busting.
7. Uploads and deploys the Pages artifact.

Required repository secret:
- `MAPBOX_PUBLIC_TOKEN`

Optional repository secrets:
- `GA_MEASUREMENT_ID`
- `GAS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_URL`

## SEO and Structured Data
- `robots.txt` allows crawling and points to `https://tilewizards.ca/sitemap.xml`.
- `sitemap.xml` lists public crawlable root pages.
- Canonical and OG/Twitter metadata are included on public pages.
- JSON-LD includes combinations of `LocalBusiness`, `Service`, `FAQPage`, and `BreadcrumbList`.

## Troubleshooting
If partials, portfolio cards, or map data are not loading:
1. Serve via HTTP, not `file://`.
2. Check DevTools Network for `partials/*.html`, `assets/data/portfolio.json`, and `assets/data/service-area.geojson`.
3. Verify `MAPBOX_PUBLIC_TOKEN` if the map falls back.

If styles look stale:
1. Regenerate `assets/css/responsive.css` after source-module edits.
2. Hard refresh browser cache.

## Known Limitations
- No backend is included. Lead delivery depends on an external Apps Script webhook.
- No unit/integration test suite is included. CI provides syntax/link/accessibility/smoke checks.
- Map features depend on third-party Mapbox assets and token configuration.
