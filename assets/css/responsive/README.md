# Responsive CSS Architecture

## Strategy
- Mobile-first cascade.
- Breakpoints: `480`, `768`, `1024`, `1280`.
- Core scaling uses `min-width` media queries.
- Targeted `max-width` guards are allowed for narrow-device fixes and touch/perf constraints.

## Layers
```css
@layer reset, tokens, base, layout, components, pages, overrides;
```

- `tokens`: design tokens (scale + semantic).
- `base`: element-safe defaults and container baseline.
- `layout`: structural spacing/grid/flow rules.
- `components`: reusable BEM blocks (`header`, `hero`, `footer`).
- `pages`: page composition and section spacing orchestration.
- `overrides`: utilities and low-specificity helper overrides.

## Tokens
- Scale tokens: `--r-space-*`, `--r-text-*`, `--r-title-*`.
- Semantic tokens: `--space-section-*`, `--text-body`, `--text-muted`, `--text-heading`.

## Naming
- Components: BEM classes.
- Utilities: `.u-*` (`u-center`, `u-max-ch-38`, `u-balance`, `u-stack-*`).
- Section modifiers: `.section--compact`, `.section--spacious`, `.section--hero`, `.section--alt`.

## Placement Rules
- Put reusable visual rules into `layout`/`components`.
- Put page composition rules into `pages/` only.
- Avoid page wrapper coupling in component selectors.
- Keep specificity low; prefer `:where()` for nested component targets.
- If a rule must override legacy desktop CSS, prefer selector/order fixes first and use `!important` only as last resort.

## Touch & Performance
- Touch target ergonomics are managed in `utilities.css` with coarse pointer media query.
- Hero heavy effects are disabled on touch devices to keep FPS stable.
- Safe-area insets are tokenized and reused (e.g. cookie notice positioning).
