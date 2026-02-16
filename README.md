# Tile Wizards Website

Production-style static website for a tile installation business in Toronto and GTA.

## Stack
- HTML partials + full pages (`index.html`, `services.html`, `portfolio.html`)
- CSS (`assets/css/main.css`, `assets/css/portfolio.css`, `assets/css/responsive.css`)
- Vanilla JavaScript (`assets/js/main.js`, `assets/js/gallery.js`)
- Data-driven portfolio (`assets/data/portfolio.json`)

## Current Features
- Dynamic partial loading (`header`, `footer`, sections)
- Responsive navigation (desktop + mobile)
- Hero with custom interactive background effect
- Services page with process timeline and proof blocks
- Portfolio page with:
  - category filters
  - case-card details (scope/area/material)
  - featured project treatment
  - custom lightbox (keyboard, swipe, counter, caption, loader)
- FAQ accordion
- Contact section with lead form UI
- Structured data:
  - FAQPage on home
  - LocalBusiness on home/services/portfolio
- SEO files:
  - `sitemap.xml`
  - `robots.txt`

## Tracking (basic)
- CTA button clicks
- Phone link clicks (`tel:`)
- Contact form submits

Events are sent if either `gtag` or `dataLayer` is available on page.

## Project Structure
```text
assets/
  css/
  js/
  data/
  images/
  video/
partials/
index.html
services.html
portfolio.html
404.html
sitemap.xml
robots.txt
```

## Notes
- This is a static frontend. Form submission backend is not included in this repo.
- For analytics, connect GA4 or GTM on page to receive emitted events.
- `assets/js/config.public.js` stays empty in Git to avoid secret leaks.
- Optional local override: copy `assets/js/config.example.js` to `assets/js/config.local.js` and include it only in local/dev pages when needed.

## Secure Mapbox Token on GitHub Pages
1. Add repository secret:
   - Name: `MAPBOX_PUBLIC_TOKEN`
   - Value: your Mapbox public token (`pk...`)
2. In GitHub repo settings, set `Pages -> Build and deployment -> Source` to `GitHub Actions`.
3. Push to `main`.

The workflow `.github/workflows/deploy-pages.yml` injects the secret token during deployment and publishes the built artifact to GitHub Pages.
