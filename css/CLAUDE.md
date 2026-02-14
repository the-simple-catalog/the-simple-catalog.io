# CSS Directory - CLAUDE.md

This file provides guidance to Claude Code when working with the stylesheet in this directory.

## Overview

All styles live in a single file: `styles.css` (~1500 lines). There is no CSS preprocessor, no build step, and no CSS framework. Everything is vanilla CSS using modern features (CSS variables, Grid, Flexbox).

## Design System

### Theme: Light & Professional (Teal + Orange)

The site uses a light, professional theme. Do NOT introduce dark backgrounds, glow effects, vibrant/electric colors, or animated gradients.

### Color Palette (CSS Variables)

Always use CSS variables for colors. Never use hardcoded hex values inline.

```
Primary:    --primary-color (#0D9488 teal)     --primary-light (#5EEAD4)   --primary-dark (#0F766E)
Secondary:  --secondary-color (#F97316 orange)  --secondary-light (#FDBA74)  --secondary-dark (#EA580C)
Accent:     --accent-color (#06B6D4 cyan)       --accent-soft (#E0F2FE light cyan bg)
Background: --bg-primary (#FFFFFF)  --bg-secondary (#F9FAFB)  --bg-card (#FFFFFF)  --bg-hover (#F3F4F6)
Text:       --text-primary (#1F2937)  --text-secondary (#6B7280)
Border:     --border-color (#E5E7EB)
Semantic:   --success-color (#10B981)  --error-color (#EF4444)  --sale-color (#DC2626)
```

### When to Use Each Color

- **Primary (teal)**: Buttons, links, active states, brand elements, cart badge
- **Secondary (orange)**: CTA buttons (hero), accent highlights, secondary actions
- **Accent (cyan)**: Info messages, badges, focus rings (`--accent-soft` for light bg tints)
- **Semantic**: Success messages (green), errors (red), sale badges/prices (red)

### Typography (Do Not Change)

```
--font-heading: 'Space Grotesk'  (headings, buttons, labels)
--font-body: 'Sora'              (body text, descriptions)
--font-mono: 'DM Mono'           (badges, SKU codes, technical text)
```

Fonts are loaded via Google Fonts `@import` at line 4.

### Shadows (Not Glow)

Use `--shadow-sm/md/lg/xl` for elevation. Never add glow effects (`box-shadow` with colored rgba values at high opacity).

### Border Radius

Use `--radius-sm (6px)`, `--radius-md (10px)`, `--radius-lg (14px)`, `--radius-xl (18px)`. The design favors rounded corners.

### Spacing

Use `--spacing-xs (4px)`, `--spacing-sm (8px)`, `--spacing-md (16px)`, `--spacing-lg (24px)`, `--spacing-xl (32px)`.

### Transitions

Use `--transition-fast (0.15s)`, `--transition-base (0.3s)`, `--transition-slow (0.5s)`.

## File Structure (Section Map)

The file is organized into clearly labeled sections with `/* === */` comment headers:

| Line | Section | Purpose |
|------|---------|---------|
| 1 | Google Fonts Import | `@import` for web fonts |
| 9 | CSS Variables & Theme | All `:root` design tokens |
| 67 | Reset & Base Styles | Box-sizing, body, `a`, `button`, `img` resets |
| 104 | Layout Utilities | `.container` max-width wrapper |
| 113 | Header | `.header`, `.logo`, `.main-nav`, `.header-actions`, `.cart-count` |
| 191 | Header Grid Layout | `.header-content` grid, `.header-left` |
| 208 | Header Search Bar | `.header-search`, `.search-input`, `.search-btn` |
| 270 | Categories Dropdown | `.categories-dropdown`, `.subcategory-panel` |
| 390 | Hero Banner | `.hero-banner`, `.hero-title`, `.hero-subtitle`, `.hero-cta` |
| 472 | Category Cards | `.category-section-title` |
| 483 | Checkout Page | `.checkout-grid`, `.checkout-section` |
| 511 | Category Card | `.category-card`, `.category-card-icon` |
| 528 | Main Content | `.main-content` min-height |
| 536 | Footer | `.footer` |
| 549 | Buttons | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-full` |
| 606 | Product Card | `.product-card`, `.product-grid`, image wrapper, overlay, badges |
| 795 | Sponsored Products | `.sponsored-section`, `.sponsored-grid`, `.sponsored-placeholder` |
| 841 | Category List | `.category-list`, `.category-card` (grid layout) |
| 880 | Product Detail Page | `.product-detail-grid`, image, title, description, stock status, price, metadata, quantity controls |
| 1070 | Page Title & Breadcrumb | `.page-header`, `.breadcrumb`, `.page-title` |
| 1105 | Forms | `.form-group`, `.form-input`, `.form-select`, `.form-textarea` |
| 1142 | Loading & Messages | `.loading`, `.message`, `.message-success/error/info` |
| 1178 | Responsive Design | Media queries at 1024px, 768px, 480px breakpoints |
| 1351 | Animations | `@keyframes fadeIn`, `productCardFadeIn`, `badgeFadeIn` |
| 1391 | Features Section | `.features-section`, `.features-grid`, `.features-item` color variants |

## Key Patterns

### Card Pattern

All cards (product, category, checkout) follow this pattern:
```css
.card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-base);
}
.card:hover {
    box-shadow: var(--shadow-md);  /* or --shadow-lg */
    transform: translateY(-Npx);
}
```

### Button Pattern

Primary buttons use solid teal, secondary buttons use bordered style:
```css
.btn-primary { background-color: var(--primary-color); color: white; }
.btn-primary:hover { background-color: var(--primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-md); }
```

### Focus State Pattern

All form inputs use the same focus ring:
```css
element:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### Gradient Text: REMOVED

The old theme used `-webkit-background-clip: text` with `-webkit-text-fill-color: transparent` for gradient text effects. These have been completely removed. Do NOT reintroduce them. All text uses solid `color` values.

### Product Card Image Overlay

Product cards have a hover overlay with dark gradient for readability on images. This is the only place dark rgba values are appropriate:
```css
background: linear-gradient(to top, rgba(31, 41, 55, 0.9), transparent);
```

## Responsive Breakpoints

- **1024px**: Product detail and checkout grids collapse to single column
- **768px**: Header goes single column, hero text centers, product grid shrinks, features grid goes single column, product detail typography reduces
- **480px**: Hero banner minimal, product grid 2-column, category list single column

## Animations (Keep vs Removed)

**Kept animations:**
- `fadeIn` - General entrance animation
- `slideInFromLeft` - Hero content entrance
- `productCardFadeIn` - Staggered product card entrance (delays via nth-child)
- `badgeFadeIn` - Staggered badge entrance

**Removed (do not reintroduce):**
- `gradientShift` - Animated gradient backgrounds
- `glowPulse` - Pulsing glow box-shadows
- `borderSlide` - Animated gradient borders

## Common Tasks

### Adding a New Component

1. Add styles in a new section with a `/* === Section Name === */` header
2. Use existing CSS variables for all colors, spacing, radii, shadows
3. Follow the card or button pattern if applicable
4. Add responsive rules inside the existing `@media` blocks
5. Place the new section before the Responsive Design section (before line ~1178)

### Modifying Colors

Only modify the `:root` variables (lines 9-65). All components reference these variables, so changes propagate automatically.

### Adding a Badge Type

Follow the existing pattern in the Product Badges section (~line 777):
```css
.product-badge-newtype {
    background: linear-gradient(135deg, #LIGHTER 0%, #DARKER 100%);
    color: white;  /* or dark text for light badges */
    box-shadow: 0 2px 8px rgba(R, G, B, 0.2);
}
```

## Do NOT

- Add glow effects or animated gradients
- Use hardcoded colors instead of CSS variables
- Add vendor prefixes (Chrome-only target)
- Use `!important` except in responsive overrides where already used
- Add gradient text effects (`-webkit-text-fill-color: transparent`)
- Introduce dark backgrounds or high-contrast neon colors
- Modify the font imports or font-family variables
