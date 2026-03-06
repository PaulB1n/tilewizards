# Security Headers

## Current Hosting Constraint

The site is deployed to GitHub Pages via `.github/workflows/deploy-pages.yml`.
GitHub Pages does not provide repository-level custom HTTP response headers.
Because of that, CSP is currently enforced via `<meta http-equiv="Content-Security-Policy">` in root HTML pages.

## Recommended Production Setup

To move CSP from meta to HTTP headers (recommended), put a proxy/CDN in front of GitHub Pages (for example Cloudflare) and set:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'wasm-unsafe-eval' 'sha256-ilcAScfv+8b6iQvCt3uvouq9rDX5wOLa8rlELsEkIn8=' 'sha256-lNsv1zHa2IOhDPGp02BqjqjKzw6g303r0ZTBaq/yWjs=' 'sha256-KdT7H/t1j/yxiwUekOnYoIEEIeFO+MPzlnlawxuQfXY=' 'sha256-FIrJyJ+RvCb7X7DBpkrRpABuRIsPoVWVECC+Zb9vSH4=' https://www.googletagmanager.com https://api.mapbox.com https://unpkg.com https://cdn.jsdelivr.net; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; font-src 'self' data: https://api.mapbox.com; connect-src 'self' https://*.mapbox.com https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://script.google.com https://script.googleusercontent.com; frame-src 'self' https://www.openstreetmap.org; child-src 'self' blob:; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'; upgrade-insecure-requests
```

Optional additional headers:

```text
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
