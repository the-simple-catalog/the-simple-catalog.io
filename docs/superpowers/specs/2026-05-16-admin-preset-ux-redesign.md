# Admin Page — Preset UX Redesign

**Date:** 2026-05-16
**Branch:** worktree-admin-ux-redesign

## Problem

The Quick Preset selector in the "Ads & T2S — Customer Configuration" section fills exactly 3 fields when the user clicks Apply:

- T2S Customer ID
- T2S Tracking URL
- Ads Server URL

The form also contains Token, Page IDs (JSON), and Order Prefix — which the preset never touches. Because all six fields sit in a flat list below the preset widget, users can reasonably assume the preset controls all of them. This creates confusion: users may not realise they still need to fill in Token, Page IDs, and Order Prefix themselves.

A secondary concern: users who have no preset configured (choosing "Other (manual)") need to understand they must fill the three connection fields themselves, without any visual hint to guide them.

## Design Decision

**Two-Zone Layout** — split the T2S Configuration section into two visually distinct sub-zones:

| Zone | Fields | Style |
|---|---|---|
| Connection (preset-managed) | Customer ID, Tracking URL, Ads Server URL + preset dropdowns | Blue tint, blue border |
| Manual settings | Ads Server Token, Page IDs (JSON), Order Prefix | Neutral grey, standard border |

Fields in the blue zone remain **always editable** — the preset is a shortcut that pre-fills them, not a lock.

## Layout Spec

### Blue zone — "Connection — filled by Quick Preset"

```
┌─────────────────────────────────────────────────────────────┐  ← blue border (#90cdf4)
│  🌍 CONNECTION — FILLED BY QUICK PRESET                     │  ← zone title (uppercase, blue)
│                                                             │
│  [Environment ▼] → [Customer ▼]  [Apply ✓]                 │  ← preset row (unchanged)
│                                                             │
│  [state banner — see States below]                          │
│                                                             │
│  T2S Customer ID                                            │
│  [_______________________________________]                  │  ← white, editable
│                                                             │
│  T2S Tracking URL                                           │
│  [_______________________________________]                  │  ← white, editable
│                                                             │
│  Ads Server URL                                             │
│  [_______________________________________]                  │  ← white, editable, mb:0
└─────────────────────────────────────────────────────────────┘
```

### Grey zone — "Manual settings — not set by preset"

```
┌─────────────────────────────────────────────────────────────┐  ← standard border
│  ⚙️ MANUAL SETTINGS — NOT SET BY PRESET                     │  ← zone title (uppercase, grey)
│                                                             │
│  Ads Server Token (Optional — JWT only)                     │
│  [_______________________________________]                  │
│                                                             │
│  Page IDs Configuration (JSON)                              │
│  [textarea___________________________]                      │
│                                                             │
│  Order Prefix                                               │
│  [_______________________________________]  mb:0            │
└─────────────────────────────────────────────────────────────┘

[Save T2S Settings]
```

## States

### State 1 — Preset applied

Triggered by: user selects an environment + customer and clicks Apply.

- The existing `env-sel-message` div (inside the blue zone) shows the green confirmation:
  `✓ Staging / Acme Staging applied — edit fields below if needed`
- The 3 connection fields are filled with the preset values.
- Fields remain editable — user can adjust after Apply.

### State 2 — Other (manual)

Triggered by: user selects "— Other (manual) —" in the environment dropdown.

- Customer picker is hidden (existing behaviour in `EnvironmentSelector.#onEnvChange`).
- Apply button is hidden (existing behaviour).
- The `env-sel-message` div shows a neutral hint:
  `✏ No preset — fill the connection fields manually below`
- The 3 connection fields are white and empty, ready for direct input.

### State 3 — No environments configured (empty state)

Triggered by: `config/environments.json` missing or empty.

- The existing empty-state message ("No environments configured — edit config/environments.json") renders inside the blue zone in place of the dropdowns.
- The 3 connection fields are still shown below, editable.

## CSS

Two new classes added to the `adminStyles` block in `admin.js`:

```css
.zone-connection {
  border: 1px solid #90cdf4;        /* blue border */
  background: #ebf8ff;              /* very light blue tint */
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.zone-connection .zone-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #2b6cb0;
  margin-bottom: 12px;
}

.zone-manual {
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.zone-manual .zone-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
```

The `env-sel-message` success/info styles in `EnvironmentSelector.#showMsg` remain unchanged — the green/grey pill already looks correct inside the blue zone.

## Scope

**Files changed:**

- `js/pages/admin.js` — HTML restructure only inside `render()`; new CSS classes in `adminStyles`
- `js/environmentSelector.js` — no changes needed; existing message rendering works correctly inside the new zone structure

**Files unchanged:** all other pages, `js/catalog.js`, `js/tracking.js`, `css/styles.css`, etc.

## What Does NOT Change

- The preset logic itself (which fields it sets, the Apply flow, the "Other" hiding behaviour)
- All other admin sections (Catalog Import, Site Settings, Developer, tID, Advanced, Export)
- Validation, save, and message logic in `saveT2SSettings()`
- The `env-sel-message` confirmation/hint rendering in `EnvironmentSelector`
