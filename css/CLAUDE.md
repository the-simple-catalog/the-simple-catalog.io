# CSS Directory - CLAUDE.md

This file provides guidance to Claude Code when working with the stylesheet in this directory.

## Overview

All styles live in a single file: `styles.css`. There is no CSS preprocessor, no build step, and no CSS framework. Everything is vanilla CSS using modern features (CSS variables, Grid, Flexbox, `color-mix()`, `aspect-ratio`).

## Design System

### Themes

The site supports three switchable themes selected via `data-theme` on `<html>`:

| Theme    | Selector                       | Vibe                                |
|----------|--------------------------------|-------------------------------------|
| Slate    | (default — no attribute)       | Cool blue accent on warm-grey base  |
| Warm     | `<html data-theme="warm">`     | Terracotta accent on cream base     |
| Modern   | `<html data-theme="modern">`   | Electric green accent, pure neutral |

The theme is configured in Admin → Developer card. `Settings.save({ theme })` syncs `documentElement.dataset.theme` so all token-driven components recolor instantly.

Do NOT introduce dark backgrounds, glow effects, or animated gradients **anywhere except** the dev-only `#dbg-sidebar` and `.dbg-badge` (see Debug overlay).

### Token map (CSS variables)

The themes redefine the same token set. Always read tokens — never hardcode hex.

```
Core
  --accent          primary action color
  --accent-hover    hover/pressed
  --bg              page background
  --bg-elev         elevated surface (card hover, panels)
  --surface         card / panel background
  --text            primary text
  --text-muted      secondary text
  --border          neutral hairlines
  --mp              marketplace 3P chip color

Legacy aliases (kept for components written before themes existed)
  --primary-color → --accent
  --primary-dark  → --accent-hover
  --bg-primary    → --bg
  --bg-secondary  → --bg-elev
  --bg-card       → --surface
  --text-primary  → --text
  --text-secondary→ --text-muted
  --border-color  → --border
  --accent-color  → --accent
  --accent-soft   → light tint of accent

Semantic (theme-independent)
  --success-color  --error-color  --sale-color

Layout primitives (theme-independent)
  --shadow-sm/md/lg/xl
  --radius-sm/md/lg/xl
  --spacing-xs/sm/md/lg/xl
  --transition-fast/base/slow
```

To change a theme's colors, edit only the `:root` block (Slate) or the `[data-theme="warm"]`/`[data-theme="modern"]` blocks (lines ~76–110).

### Typography

```
--font-heading: 'Inter Tight', 'Inter', sans-serif    (headings, buttons, labels)
--font-body:    'Inter', sans-serif                    (body text)
--font-mono:    'JetBrains Mono', 'DM Mono', monospace (badges, SKU codes, debug)
--font-serif:   'Source Serif 4', Georgia, serif       (PDP "About this item" lead)
```

Loaded via Google Fonts `@import` at line 4.

### Shadows (not glow)

Use `--shadow-sm/md/lg/xl` for elevation. Never add colored-rgba glow shadows in product UI. Only `.dbg-*` classes may use higher-opacity shadows because they are dev tooling.

## Section map (key components)

| Component family | Key classes | Notes |
|------------------|-------------|-------|
| Header           | `.header`, `.logo`, `.header-search`, `.cart-count` | unchanged structure, recolored via tokens |
| Hero / homepage  | `.hero-banner`, `.hero-cta`, `.features-section`    | uses `--accent` |
| Product card     | `.product-card`, `.product-grid`, `.product-badges` | shared by category, search, sponsored band cards |
| **PDP grid**     | `.pdp-grid`, `.pdp-thumbs`, `.pdp-main`, `.pdp-info-mid`, `.pdp-buybox-col`, `.pdp-meta-grid`, `.pdp-stock-dot{.low,.out}`, `.pdp-desc-block`, `.pdp-desc-facts` | 4-col @ ≥1280px → 2-col @ 800–1280px → 1-col below |
| Marketplace chip | `.mp-chip`, `.mp-chip-sm`, `.mp-chip-pdp` | rendered when `partyTypes === '3P'` |
| **Display creatives** | `.sm-banner`, `.sm-billboard` (1980/420), `.sm-leaderboard` (970/250), `.sm-tag`, `.sm-fullimg`, `.sm-fmt-banner`, `.sm-fmt-display` (split content/art), `.sm-fmt-native` (overlay) | Mobile collapses all to 16/9 |
| **Shoppable / Sponso band** | `.sm-shoppable`, `.sm-shop-head/title/tag/body/scroller`, `.sm-shop-prod`, `.sm-shop-prev/next`, `.sponso-band`, `.sponso-shop-now` | Used both for `SPONSORED_BRAND_IMAGE` display creatives and for the unified Sponsored Products band |
| **Debug overlay** | `.dbg-wrap` (dashed outline), `.dbg-badge` (corner pill), `#dbg-sidebar` (fixed right, dark), `.dbg-toolbar`, `.dbg-section`, `.dbg-unit` | Only dark surface in the entire app. `body.dbg-overlays-hidden` hides outlines/badges but keeps the sidebar |

## Layout: PDP grid breakpoints

```
≥1280px → 80px | 1fr | 320px | 360px        (thumbs · hero · meta · sticky buybox)
800–1280px → 1fr | 360px                    (drop thumbs; meta becomes full-width row)
<800px   → 1fr                              (single column, buybox not sticky)
```

The full-width "About this item" block (`.pdp-desc-block`) lives in row 2 with `grid-column: 1 / -1`.

## Debug sidebar — dev-only dark UI

The debug sidebar (`#dbg-sidebar`) is the **only** dark surface in the app. It is gated by `Settings.debugMode` and managed by `js/debug.js`. When enabled:
- `<body>` gets `dbg-mode` (adds `padding-right: 320px` on desktop)
- Each registered ad zone gets `.dbg-wrap` + a corner `.dbg-badge`
- "Hide overlays" toggles `body.dbg-overlays-hidden` to remove outlines without removing the sidebar

On screens ≤1024px, the sidebar collapses to the bottom 50vh instead of the right edge.

## Patterns

### Card pattern

```css
.card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-base);
}
.card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-Npx);
}
```

### Focus state pattern

```css
element:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### Marketplace chip pattern

When labelling a 3P product:

```html
<span class="mp-chip">Marketplace</span>
```

Use `.mp-chip-pdp` on the PDP "Sold by" row; `.mp-chip-sm` for compact contexts.

## Do NOT

- Add glow effects, animated gradients, or gradient text in product UI (sidebar excepted)
- Use hardcoded colors instead of CSS variables
- Introduce dark backgrounds outside `.dbg-*` classes
- Re-add the legacy `.sponsored-section` / `.sponsored-grid` / `.sponsored-placeholder` (replaced by `.sm-shoppable.sponso-band`)
- Modify the font imports or font-family variables without updating this file
