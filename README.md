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
- Mapbox token is loaded from `assets/js/config.local.js` (ignored by Git).
- Copy `assets/js/config.example.js` to `assets/js/config.local.js` and set your token locally.
https://paulb1n.github.io/tilewizards/
