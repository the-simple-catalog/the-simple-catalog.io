// ===================================
// Debug overlay — dev tooling for ad zones
// ===================================
//
// When enabled (Settings.debugMode), every ad zone gets a dashed outline +
// corner badge and a fixed sidebar lists the current page context plus
// every registered productAds / display ad unit.
//
// Page modules call:
//     Debug.setPage({ type, id, path, productId / categoryId / searchKeyword })
//     Debug.register({ kind, id, format, creativeFormat, ... })
//     Debug.wrap(slotEl, unit)
//
// The sidebar is the only dark surface in the app — see css/CLAUDE.md.

import { Settings } from './catalog.js';
import { escapeHtml } from './utils.js';

const HIDE_OVERLAYS_KEY = 'mk_dbg_hide_overlays';

class Debug {
    static #enabled = false;
    static #hideOverlays = false;
    static #page = { type: null, id: null, path: null };
    static #units = new Map();
    static #sidebarEl = null;

    /**
     * Initialize debug state from Settings + localStorage.
     * Call once at app startup AFTER Settings is loadable.
     */
    static init() {
        const settings = Settings.get();
        this.#hideOverlays = localStorage.getItem(HIDE_OVERLAYS_KEY) === '1';
        this.applyEnabled(settings.debugMode === true);
    }

    /**
     * Persist debugMode in Settings AND apply side effects.
     * Use this from UI code (Admin "Developer" toggle).
     * @param {boolean} on
     */
    static setEnabled(on) {
        Settings.save({ debugMode: !!on });
        // Settings.save will call applyEnabled via the side-effect block.
    }

    /**
     * Apply the enabled state to the DOM without persisting.
     * Settings.save calls this so it can be invoked recursively-safe.
     * @param {boolean} on
     */
    static applyEnabled(on) {
        this.#enabled = !!on;
        if (this.#enabled) {
            this.#mountSidebar();
            document.body.classList.add('dbg-mode');
            if (this.#hideOverlays) {
                document.body.classList.add('dbg-overlays-hidden');
            }
        } else {
            this.#unmountSidebar();
            document.body.classList.remove('dbg-mode', 'dbg-overlays-hidden');
            this.#removeAllWraps();
        }
    }

    /**
     * Toggle the "hide overlays" sub-mode (sidebar stays).
     */
    static toggleHideOverlays() {
        this.#hideOverlays = !this.#hideOverlays;
        localStorage.setItem(HIDE_OVERLAYS_KEY, this.#hideOverlays ? '1' : '0');
        document.body.classList.toggle('dbg-overlays-hidden', this.#hideOverlays);
        this.#renderSidebar();
    }

    /**
     * Set the current page context. Clears the registered units list.
     * @param {Object} info
     * @param {string} info.type           e.g. 'product', 'category', 'home', 'search', 'cart', 'checkout', 'order'
     * @param {number|string} info.id      page id
     * @param {string} [info.path]         current location.hash
     * @param {string} [info.productId]
     * @param {string} [info.categoryId]
     * @param {string} [info.searchKeyword]
     */
    static setPage(info) {
        this.#page = { ...info };
        this.#units.clear();
        if (this.#enabled) {
            this.#renderSidebar();
        }
    }

    /**
     * Register an ad unit so it appears in the sidebar.
     * Called by Tracking.renderSponsoredBand and renderDisplayAds.
     * @param {Object} unit
     * @param {'PRODUCT'|'DISPLAY'} unit.kind
     * @param {string} unit.id
     * @param {string} [unit.format]            adUnitSize, e.g. "4"
     * @param {string} [unit.creativeFormat]    e.g. "BANNER", "NATIVE_BANNER"
     * @param {string} [unit.formatCode]
     * @param {string} [unit.adUnitSize]
     * @param {number} [unit.productsCount]
     * @param {Array<string>} [unit.productIds]
     * @param {number} [unit.served]
     */
    static register(unit) {
        if (!unit?.id) return;
        this.#units.set(unit.id, unit);
        if (this.#enabled) {
            this.#renderSidebar();
        }
    }

    /**
     * Wrap a slot element with the dashed outline + corner badge.
     * Idempotent — safe to call multiple times for the same element.
     * Always inserts the badge regardless of debug state, but CSS hides it
     * when debug is off so toggling via Admin works without re-render.
     * @param {HTMLElement} slotEl
     * @param {Object} unit  same shape as register()
     */
    static wrap(slotEl, unit) {
        if (!slotEl || !unit) return;

        // Idempotent: do nothing if already wrapped for this unit
        if (slotEl.dataset.dbgUnitId === unit.id) return;

        slotEl.classList.add('dbg-wrap');
        slotEl.dataset.dbgUnitId = unit.id;

        // Slot must be a positioning context for the absolute badge
        const computed = window.getComputedStyle(slotEl);
        if (computed.position === 'static') {
            slotEl.style.position = 'relative';
        }

        // Remove any prior badge so we can refresh format info
        const prior = slotEl.querySelector(':scope > .dbg-badge');
        if (prior) prior.remove();

        const badge = document.createElement('div');
        badge.className = 'dbg-badge';
        badge.innerHTML = this.#badgeHtml(unit);
        slotEl.appendChild(badge);
    }

    // -------- private helpers --------

    static #badgeHtml(unit) {
        const parts = [`<span class="dbg-kind">${escapeHtml(unit.kind || '')}</span>`];
        parts.push(`<span class="dbg-id">${escapeHtml(unit.id)}</span>`);
        if (unit.creativeFormat) {
            parts.push(`<span class="dbg-creative-format">· ${escapeHtml(unit.creativeFormat)}</span>`);
        }
        // Asset format (e.g. "300:250") — Mirakl Ads creativeSet.asset.format.
        // Shown as its own chip so it is visible alongside the creativeFormat name.
        if (unit.assetFormat) {
            parts.push(`<span class="dbg-format">· ${escapeHtml(String(unit.assetFormat))}</span>`);
        }
        const size = unit.adUnitSize ?? unit.format;
        if (size != null && String(size) !== String(unit.assetFormat || '')) {
            parts.push(`<span class="dbg-format">· ${escapeHtml(String(size))}</span>`);
        }
        return parts.join('');
    }

    static #mountSidebar() {
        if (this.#sidebarEl) return;
        const el = document.createElement('aside');
        el.id = 'dbg-sidebar';
        document.body.appendChild(el);
        this.#sidebarEl = el;
        this.#renderSidebar();
    }

    static #unmountSidebar() {
        if (!this.#sidebarEl) return;
        this.#sidebarEl.remove();
        this.#sidebarEl = null;
    }

    static #removeAllWraps() {
        document.querySelectorAll('.dbg-wrap').forEach(el => {
            el.classList.remove('dbg-wrap');
            const badge = el.querySelector(':scope > .dbg-badge');
            if (badge) badge.remove();
            delete el.dataset.dbgUnitId;
        });
    }

    static #renderSidebar() {
        if (!this.#sidebarEl) return;

        const productUnits = [...this.#units.values()].filter(u => u.kind === 'PRODUCT');
        const displayUnits = [...this.#units.values()].filter(u => u.kind === 'DISPLAY');

        this.#sidebarEl.innerHTML = `
            <header class="dbg-sidebar-h">
                <span class="dbg-sidebar-h-title">Ads · Debug</span>
                <span class="dbg-pid">${escapeHtml(String(this.#page.id ?? '—'))}</span>
            </header>
            <div class="dbg-toolbar">
                <button id="dbg-toggle-overlays" class="${this.#hideOverlays ? '' : 'is-on'}">
                    ${this.#hideOverlays ? 'Show overlays' : 'Hide overlays'}
                </button>
            </div>
            <section class="dbg-section">
                <h4>Page</h4>
                <dl class="dbg-row"><dt>Type</dt><dd>${escapeHtml(this.#page.type || '—')}</dd></dl>
                <dl class="dbg-row"><dt>Page ID</dt><dd>${escapeHtml(String(this.#page.id ?? '—'))}</dd></dl>
                ${this.#page.productId ? `<dl class="dbg-row"><dt>Product ID</dt><dd>${escapeHtml(this.#page.productId)}</dd></dl>` : ''}
                ${this.#page.categoryId ? `<dl class="dbg-row"><dt>Category ID</dt><dd>${escapeHtml(this.#page.categoryId)}</dd></dl>` : ''}
                ${this.#page.searchKeyword ? `<dl class="dbg-row"><dt>Keyword</dt><dd>${escapeHtml(this.#page.searchKeyword)}</dd></dl>` : ''}
                ${this.#page.path ? `<dl class="dbg-row"><dt>Path</dt><dd>${escapeHtml(this.#page.path)}</dd></dl>` : ''}
            </section>
            <section class="dbg-section">
                <h4>productAds (${productUnits.length})</h4>
                ${productUnits.length === 0
                    ? '<div class="dbg-empty">No product ad units on this page.</div>'
                    : productUnits.map(u => this.#unitHtml(u)).join('')}
            </section>
            <section class="dbg-section">
                <h4>display (${displayUnits.length})</h4>
                ${displayUnits.length === 0
                    ? '<div class="dbg-empty">No display creatives on this page.</div>'
                    : displayUnits.map(u => this.#unitHtml(u)).join('')}
            </section>
        `;

        const btn = this.#sidebarEl.querySelector('#dbg-toggle-overlays');
        if (btn) {
            btn.addEventListener('click', () => Debug.toggleHideOverlays());
        }
    }

    static #unitHtml(u) {
        const productIdsHtml = (u.productIds && u.productIds.length)
            ? u.productIds.slice(0, 6).map(id => `<span class="dbg-pid">${escapeHtml(id)}</span>`).join(' ')
            : '';
        return `
            <details class="dbg-unit">
                <summary>
                    <span><span class="dbg-kind">${escapeHtml(u.kind || '')}</span> ${escapeHtml(u.id)}</span>
                    ${u.creativeFormat ? `<span>${escapeHtml(u.creativeFormat)}</span>` : ''}
                </summary>
                <div class="dbg-unit-body">
                    ${u.assetFormat ? `<dl class="dbg-row"><dt>Asset format</dt><dd>${escapeHtml(String(u.assetFormat))}</dd></dl>` : ''}
                    ${u.adUnitSize != null ? `<dl class="dbg-row"><dt>Size</dt><dd>${escapeHtml(String(u.adUnitSize))}</dd></dl>` : ''}
                    ${u.formatCode ? `<dl class="dbg-row"><dt>Format code</dt><dd>${escapeHtml(u.formatCode)}</dd></dl>` : ''}
                    ${u.productsCount != null ? `<dl class="dbg-row"><dt>Requested</dt><dd>${escapeHtml(String(u.productsCount))}</dd></dl>` : ''}
                    ${u.served != null ? `<dl class="dbg-row"><dt>Served</dt><dd>${escapeHtml(String(u.served))}</dd></dl>` : ''}
                    ${productIdsHtml ? `<dl class="dbg-row"><dt>Products</dt><dd>${productIdsHtml}</dd></dl>` : ''}
                </div>
            </details>
        `;
    }
}

export { Debug };
