# Tile Installation Website — Toronto & GTA

Professional tile installation website optimized for **Google Ads**, **mobile conversions** and real project showcasing.

Static website with modular structure, dynamic portfolio, lightbox gallery and call-first UX.

---

## 📁 Project Structure

/
├── index.html # Home page (main landing page)
├── portfolio.html # Portfolio page
├── services.html # Services page
├── contact.html # Contact & quote page
├── faq.html # FAQ page
├── 404.html # Custom 404 error page
│
├── partials/
│ ├── header.html # Header & navigation (desktop + mobile)
│ ├── footer.html # Footer
│ ├── portfolio.html # Portfolio section markup
│ ├── services.html # Services sections
│ └── faq.html # FAQ section
│
├── assets/
│ ├── css/
│ │ ├── main.css # Global styles & layout
│ │ ├── portfolio.css # Portfolio grid & lightbox styles
│ │ └── responsive.css # Responsive overrides
│ │
│ ├── js/
│ │ ├── main.js # Core UI logic & interactions
│ │ └── gallery.js # Portfolio grid & lightbox logic
│ │
│ ├── data/
│ │ └── portfolio.json # Portfolio categories & images
│ │
│ └── images/
│ └── portfolio/ # Portfolio images by category

markdown
Копировать код

---

## 🏠 index.html — Home Page

Main landing page designed for paid traffic and conversions.

### Purpose
- Entry point for Google Ads
- Converts visitors into calls and quote requests

### Key Sections
- Hero with video background and primary CTAs
- Services & specialty services
- Portfolio preview (limited to 3 items)
- Reviews & trust signals
- FAQ
- Contact / Quote form

⚠️ Do not remove section IDs:
`#services`, `#portfolio`, `#faq`, `#contact`

---

## 🧭 header.html — Header & Navigation

Contains desktop and mobile navigation.

### Desktop Navigation
- Services
- Portfolio
- FAQ
- Get Quote (primary CTA)

### Mobile Navigation
- Call-first UX with clickable phone number
- Fullscreen mobile menu
- Primary CTA button: **Request a Free Quote**

### Notes
- Mobile menu behavior is controlled by `main.js`
- CTA button uses `.mobile-cta`
- Phone number should match Google Ads call extensions

⚠️ Do not rename IDs or classes used in JavaScript

---

## 🎨 main.css — Global Styles

Main stylesheet containing:
- Color system and typography
- Layout and grid styles
- Header, hero and buttons
- Services, CTA, Reviews, FAQ
- Mobile menu styles
- 404 page styles

### Important
- Mobile menu styles rely on `.nav--mobile`
- CTA button styles use `.mobile-cta`
- Body scroll is locked with `body.menu-open`

⚠️ Renaming classes may break JS behavior

---

## 🖼 portfolio.css — Portfolio & Lightbox

Styles for portfolio cards and fullscreen lightbox.

### Features
- Responsive grid layout
- Featured first project on portfolio page
- Hover overlays and CTA hints
- Fullscreen lightbox with:
  - Next / Prev buttons
  - Swipe support
  - Image counter

### Key Classes
- `.portfolio__grid`
- `.portfolio__item`
- `.portfolio__item--card`
- `#lightbox`

⚠️ Layout depends on `.page-portfolio` body class

---

## 📱 responsive.css — Responsive Overrides

Breakpoint-specific overrides for mobile and tablet.

### Breakpoints
- ≤1024px — tablets
- ≤768px — mobile
- ≤480px — small phones

### Adjusts
- Typography scaling
- Hero layout
- Services & portfolio grids
- Mobile menu spacing
- FAQ spacing
- 404 page layout

ℹ️ Contains overrides only — base styles live in `main.css`

---

## 📊 portfolio.json — Portfolio Data

Single source of truth for portfolio content.

### Structure
Each object represents **one category** of work.

```json
{
  "id": "house",
  "title": "Residential House Projects",
  "cover": "assets/images/portfolio/house-1.jpg",
  "stats": [
    "Full house tile installation",
    "Bathrooms, kitchens & floors",
    "Precision leveling & clean cuts"
  ],
  "images": []
}
Usage
Loaded dynamically by gallery.js

Same data used on Home and Portfolio pages

⚠️ Images must exist in /assets/images/portfolio/

🖼 gallery.js — Portfolio Grid & Lightbox Logic
Handles:

Loading portfolio items from portfolio.json

Rendering portfolio cards

Opening and closing the lightbox

Image navigation (buttons, keyboard, swipe)

Image counter

Lazy image preloading

Behavior
On homepage: shows first 3 items

On portfolio page: shows all items

Uses partialsLoaded event

🧠 main.js — Core JavaScript
Main interaction logic for the site.

Responsibilities
Load HTML partials (data-include)

Dispatch partialsLoaded event

Sticky header on scroll

Mobile menu open / close

Smooth scrolling for anchors

Scroll reveal animations

FAQ accordion logic

Important IDs
burger

mobileMenu

menuClose

⚠️ Do not change these without updating JS

🚀 Running Locally
This is a static website.

Options:

Open index.html directly

Use Live Server (VS Code)

Use any local static server

⚠️ Notes
Do not rename CSS classes used in JS

Portfolio images must be added manually

Form is frontend-only (no backend handler)

Analytics & Google Ads tracking added separately