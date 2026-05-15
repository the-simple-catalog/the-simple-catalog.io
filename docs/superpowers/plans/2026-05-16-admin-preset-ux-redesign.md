# Admin Preset UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the T2S Configuration section into a blue "Connection" zone (preset-managed: Customer ID, Tracking URL, Ads Server URL) and a grey "Manual settings" zone (Token, Page IDs, Order Prefix) so users immediately understand what the Quick Preset does and doesn't set.

**Architecture:** Pure HTML template + CSS change inside `js/pages/admin.js`. The `env-selector-container` div moves from outside the `<form>` to inside it, nested in the new `zone-connection` div. No logic changes anywhere — `EnvironmentSelector.js` renders into the same `#env-selector-container` ID and requires no edits.

**Tech Stack:** Vanilla JS, template literal HTML, inline CSS injected via `adminStyles` string — no build step, no framework.

---

## Files Changed

| File | Change |
|---|---|
| `js/pages/admin.js` | Add zone CSS to `adminStyles`; restructure T2S form HTML in `render()` |

No other files change.

---

### Task 1: Add zone CSS classes to adminStyles

**Files:**
- Modify: `js/pages/admin.js:1782` (after the closing `}` of `.admin-section`)

The `adminStyles` template literal starts at line 1775. The `.admin-section` block ends at line 1782. Insert the two new zone rules immediately after it.

- [ ] **Step 1: Open `js/pages/admin.js` and locate the insertion point**

Find this block (around line 1776–1782):

```css
    .admin-section {
        background: var(--surface);
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border);
    }
```

- [ ] **Step 2: Insert zone CSS immediately after the `.admin-section` closing brace**

Add this block between `.admin-section { }` and `/* Collapsible card … */`:

```css
    /* Two-zone layout inside T2S Configuration */
    .zone-connection {
        border: 1px solid #90cdf4;
        background: #ebf8ff;
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

The result should look like:

```css
    .admin-section {
        background: var(--surface);
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border);
    }

    /* Two-zone layout inside T2S Configuration */
    .zone-connection {
        border: 1px solid #90cdf4;
        background: #ebf8ff;
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

    /* Collapsible card (e.g. File import — kept secondary) */
    details.admin-section--collapsible {
```

- [ ] **Step 3: Verify CSS is syntactically valid**

Run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('js/pages/admin.js', 'utf8');
const m = src.match(/const adminStyles = \`([\s\S]*?)\`;/);
const css = m[1];
const open = (css.match(/{/g)||[]).length;
const close = (css.match(/}/g)||[]).length;
console.log('Braces balanced:', open === close, '(open:', open, 'close:', close, ')');
console.log('zone-connection present:', css.includes('.zone-connection'));
console.log('zone-manual present:', css.includes('.zone-manual'));
"
```

Expected output:
```
Braces balanced: true (open: <N> close: <N>)
zone-connection present: true
zone-manual present: true
```

---

### Task 2: Restructure the T2S form HTML in render()

**Files:**
- Modify: `js/pages/admin.js:49–130` (the T2S Configuration `admin-section` block)

This is the only structural change. Every `id`, `value`, `placeholder`, and `onsubmit` attribute stays identical — only the wrapping divs change.

- [ ] **Step 1: Locate the T2S section in `render()`**

Find this exact block (lines 49–130):

```javascript
                    <!-- 1. Ads & T2S Customer Configuration (first) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔧 Ads &amp; T2S - Customer Configuration</h2>

                        <div id="env-selector-container"></div>

                        <form id="t2s-settings-form" onsubmit="AdminPage.saveT2SSettings(event)">
                            <div class="form-group">
                                <label class="form-label">T2S Customer ID</label>
                                <input
                                    type="text"
                                    id="setting-customer-id"
                                    class="form-input"
                                    value="${escapeHtml(settings.t2sCustomerId || DEFAULT_T2S_CUSTOMER_ID)}"
                                    placeholder="${DEFAULT_T2S_CUSTOMER_ID}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">T2S Tracking URL</label>
                                <input
                                    type="text"
                                    id="setting-tracking-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.trackingUrl || DEFAULT_TRACKING_URL)}"
                                    placeholder="${DEFAULT_TRACKING_URL}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Ads Server URL</label>
                                <input
                                    type="text"
                                    id="setting-ads-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerUrl || DEFAULT_ADS_SERVER_URL)}"
                                    placeholder="${DEFAULT_ADS_SERVER_URL}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Ads Server Token (Optional - JWT only)</label>
                                <input
                                    type="text"
                                    id="setting-ads-token"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerToken || "")}"
                                    placeholder="Leave empty to use public endpoint"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Page IDs Configuration (JSON)</label>
                                <textarea
                                    id="setting-page-ids"
                                    class="form-input"
                                    rows="6"
                                    placeholder='${escapeHtml(JSON.stringify(Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}'
                                    style="font-family: monospace; font-size: 13px;"
                                >${escapeHtml(JSON.stringify(settings.t2sPageIds || Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}</textarea>
                                <small style="color: var(--text-secondary); font-size: 12px;">
                                    JSON object with page type to page ID mappings
                                </small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Order Prefix</label>
                                <input
                                    type="text"
                                    id="setting-order-prefix"
                                    class="form-input"
                                    value="${escapeHtml(settings.orderPrefix || "")}"
                                    placeholder="${DEFAULT_ORDER_PREFIX}"
                                />
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save T2S Settings
                            </button>
                        </form>

                        <div id="t2s-settings-message"></div>
                    </div>
```

- [ ] **Step 2: Replace the entire block with the two-zone version**

Replace with:

```javascript
                    <!-- 1. Ads & T2S Customer Configuration (first) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔧 Ads &amp; T2S - Customer Configuration</h2>

                        <form id="t2s-settings-form" onsubmit="AdminPage.saveT2SSettings(event)">

                            <!-- Blue zone: 3 fields filled by Quick Preset -->
                            <div class="zone-connection">
                                <div class="zone-title">🌍 Connection — filled by Quick Preset</div>
                                <div id="env-selector-container"></div>
                                <div class="form-group">
                                    <label class="form-label">T2S Customer ID</label>
                                    <input
                                        type="text"
                                        id="setting-customer-id"
                                        class="form-input"
                                        value="${escapeHtml(settings.t2sCustomerId || DEFAULT_T2S_CUSTOMER_ID)}"
                                        placeholder="${DEFAULT_T2S_CUSTOMER_ID}"
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">T2S Tracking URL</label>
                                    <input
                                        type="text"
                                        id="setting-tracking-url"
                                        class="form-input"
                                        value="${escapeHtml(settings.trackingUrl || DEFAULT_TRACKING_URL)}"
                                        placeholder="${DEFAULT_TRACKING_URL}"
                                    />
                                </div>

                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">Ads Server URL</label>
                                    <input
                                        type="text"
                                        id="setting-ads-url"
                                        class="form-input"
                                        value="${escapeHtml(settings.adsServerUrl || DEFAULT_ADS_SERVER_URL)}"
                                        placeholder="${DEFAULT_ADS_SERVER_URL}"
                                    />
                                </div>
                            </div>

                            <!-- Grey zone: fields not set by preset -->
                            <div class="zone-manual">
                                <div class="zone-title">⚙️ Manual settings — not set by preset</div>
                                <div class="form-group">
                                    <label class="form-label">Ads Server Token (Optional - JWT only)</label>
                                    <input
                                        type="text"
                                        id="setting-ads-token"
                                        class="form-input"
                                        value="${escapeHtml(settings.adsServerToken || "")}"
                                        placeholder="Leave empty to use public endpoint"
                                    />
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Page IDs Configuration (JSON)</label>
                                    <textarea
                                        id="setting-page-ids"
                                        class="form-input"
                                        rows="6"
                                        placeholder='${escapeHtml(JSON.stringify(Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}'
                                        style="font-family: monospace; font-size: 13px;"
                                    >${escapeHtml(JSON.stringify(settings.t2sPageIds || Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}</textarea>
                                    <small style="color: var(--text-secondary); font-size: 12px;">
                                        JSON object with page type to page ID mappings
                                    </small>
                                </div>

                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">Order Prefix</label>
                                    <input
                                        type="text"
                                        id="setting-order-prefix"
                                        class="form-input"
                                        value="${escapeHtml(settings.orderPrefix || "")}"
                                        placeholder="${DEFAULT_ORDER_PREFIX}"
                                    />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save T2S Settings
                            </button>
                        </form>

                        <div id="t2s-settings-message"></div>
                    </div>
```

Key structural differences from the original:
- `env-selector-container` is now **inside** the `<form>` tag, inside `zone-connection`
- The `<form>` now wraps both zone divs
- The 3 connection field `form-group` divs are inside `zone-connection`
- The 3 manual field `form-group` divs are inside `zone-manual`
- The last `form-group` in each zone has `style="margin-bottom: 0;"` to avoid extra whitespace at zone bottom

- [ ] **Step 3: Verify the IDs are all still present**

Run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('js/pages/admin.js', 'utf8');
const ids = ['env-selector-container','setting-customer-id','setting-tracking-url','setting-ads-url','setting-ads-token','setting-page-ids','setting-order-prefix','t2s-settings-form','t2s-settings-message'];
ids.forEach(id => console.log(id + ':', src.includes(id) ? 'OK' : 'MISSING'));
"
```

Expected: all lines print `OK`.

- [ ] **Step 4: Open the admin page in Chrome and verify visually**

Serve the site:
```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/#/admin` in Chrome.

Check **State 1 — preset applied:**
- The T2S Configuration section shows a blue-tinted box at the top
- The box header reads "🌍 CONNECTION — FILLED BY QUICK PRESET" in uppercase blue
- The Quick Preset dropdowns appear inside the blue box
- The 3 connection fields (Customer ID, Tracking URL, Ads Server URL) are inside the blue box, with white backgrounds
- Below the blue box, a grey box reads "⚙️ MANUAL SETTINGS — NOT SET BY PRESET"
- Token, Page IDs, Order Prefix are in the grey box
- The "Save T2S Settings" button appears below the grey box

Check **State 2 — Other (manual):**
- Select "— Other (manual) —" in the Environment dropdown
- Customer picker disappears, message appears: "📝 Enter T2S Tracking URL, Ads Server URL and Customer ID in the fields below."
- The 3 connection fields in the blue zone are white and editable (not greyed out)

Check **Save still works:**
- Type a value in T2S Customer ID, click "Save T2S Settings"
- Success message appears below the form: "T2S settings saved successfully!"

- [ ] **Step 5: Commit**

```bash
git add js/pages/admin.js
git commit --author="linuxidefix <linuxidefix@users.noreply.github.com>" -m "$(cat <<'EOF'
💄 Split T2S config into Connection and Manual settings zones

Blue zone (preset-managed): Customer ID, Tracking URL, Ads Server URL.
Grey zone (manual): Token, Page IDs, Order Prefix.
Makes preset scope immediately visible without reading any label.
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- ✓ Blue zone with "Connection — filled by Quick Preset" title
- ✓ Grey zone with "Manual settings — not set by preset" title
- ✓ Fields in blue zone remain editable
- ✓ State 1 (preset applied): green message inside blue zone (existing `env-sel-message` behaviour, unchanged)
- ✓ State 2 (Other/manual): customer picker hides, fields white and editable
- ✓ State 3 (no environments): existing empty-state message renders inside blue zone — no extra work needed since `env-selector-container` is still the same div, just positioned differently

**Placeholder scan:** No TBDs, all code is complete. ✓

**Type consistency:** No new functions or types introduced. All IDs referenced in JS logic (`setting-customer-id`, `setting-tracking-url`, etc.) are unchanged in the HTML. ✓
