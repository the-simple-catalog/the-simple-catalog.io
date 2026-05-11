// ===================================
// Homepage — Marketplace layout
// ===================================
//
// Layout (mirrors the Marketplace design bundle):
//   1. Sponsored Media — BANNER  (display ad zone, image only)
//   2. Sponsored Media — SPONSORED_BRAND_IMAGE  (display ad zone, shoppable)
//   3. Shop by department  (root-category tiles)
//   4. Sponsored Media — NATIVE_BANNER  (display ad zone, image + CTA overlay)
//   5. Recommended for you  (12 product cards)
//   6. Sponsored Products band  (carousel with "Shop now" card)
//
// One Tracking.requestAds() call returns both productAds[] and display[].
// Display creatives are dispatched to the 3 named slots by creativeFormat.

import { getEl, escapeHtml, formatPrice } from '../utils.js';
import { CatalogManager, Settings } from '../catalog.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

// Display formats placed on the homepage, in render order. Each entry pairs
// a slot id with a predicate that matches every creativeFormat string Mirakl
// Ads may emit for that family (e.g. BANNER_IMAGE is the prod alias of BANNER).
// Mirakl Ads returns ALL display creatives in one array; we pick the first
// match per family. Slots whose format isn't returned stay empty (no fallback).
const HOME_DISPLAY_SLOTS = [
    { slotId: 'home-display-banner',    match: (c) => c.creativeFormat === 'BANNER_IMAGE' || c.creativeFormat === 'BANNER' },
    { slotId: 'home-display-sponsored', match: (c) => c.creativeFormat === 'SPONSORED_BRAND_IMAGE' || c.creativeFormat === 'SHOPPABLE' },
    { slotId: 'home-display-native',    match: (c) => c.creativeFormat === 'NATIVE_BANNER' || c.creativeFormat === 'NATIVE_IMAGE' }
];

class HomePage {
    /**
     * Render homepage
     */
    static render() {
        const pageType = Tracking.PAGE_TYPES.HOMEPAGE;
        const pageId = Tracking.getPageId(pageType);
        Debug.setPage({ type: 'home', id: pageId, path: location.hash });
        Tracking.trackPageView(pageId, pageType);

        const app = getEl('app');
        const rootCategories = CatalogManager.getRootCategories();

        if (rootCategories.length === 0) {
            app.innerHTML = `
                <div class="container fade-in">
                    <div class="page-header">
                        <h1 class="page-title">Welcome to ${escapeHtml(Settings.getSetting('siteName'))}</h1>
                    </div>

                    <div class="message message-info">
                        <p><strong>No catalog data loaded yet.</strong></p>
                        <p>Please go to the <a href="#/admin" style="text-decoration: underline;">Admin page</a> to import your categories and products.</p>
                    </div>

                    <a href="#/admin" class="btn btn-primary" style="margin-top: 16px;">
                        Go to Admin
                    </a>
                </div>
            `;
            return;
        }

        const products = CatalogManager.getProducts();
        const recommended = products.slice(0, 12);
        const tiles = rootCategories.slice(0, 7);

        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">

                    <div class="ad-zone-slot" id="home-display-banner"></div>
                    <div class="ad-zone-slot" id="home-display-sponsored"></div>

                    <h2 class="section-title">Shop by department</h2>
                    <div class="cat-tiles">
                        ${tiles.map(c => HomePage.#renderCatTile(c)).join('')}
                    </div>

                    <div class="ad-zone-slot" id="home-display-native"></div>

                    <h2 class="section-title">Recommended for you</h2>
                    <div class="prod-grid cols-6">
                        ${recommended.map(p => HomePage.#renderProductCard(p)).join('')}
                    </div>

                    <div style="height: 28px;"></div>

                    <div class="ad-zone-slot" id="home-sponsored-band"></div>
                </div>
            </div>
        `;

        HomePage.#wireProductCards();
        HomePage.#fetchAndRenderAds(pageId, pageType);
    }

    static #renderCatTile(category) {
        const imageUrl = CatalogManager.getCategoryIconImage(category);
        const name = category.content?.name || category.id;
        const productCount = HomePage.#countProductsInTree(category.id);
        return `
            <a class="cat-tile" href="#/category/${escapeHtml(category.id)}">
                <div class="cat-tile-icon">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" />
                </div>
                <div class="cat-tile-name">${escapeHtml(name)}</div>
                <div class="cat-tile-count">${productCount} items</div>
            </a>
        `;
    }

    static #renderProductCard(product) {
        const id = product.id;
        const name = product.content?.name || id;
        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);
        const image = product.content?.imageUrl
            || `https://placehold.co/300x300?text=${encodeURIComponent(id)}`;
        const promoPct = (price.hasPromo && price.regular)
            ? Math.round((1 - price.promo / price.regular) * 100)
            : 0;
        const finalPrice = price.hasPromo ? price.promo : price.regular;
        return `
            <a class="prod-card" href="#/product/${escapeHtml(id)}">
                ${promoPct > 0 ? `<span class="promo-chip">-${promoPct}%</span>` : ''}
                <div class="prod-thumb">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy"
                         onerror="this.onerror=null;this.src='https://placehold.co/300x300?text=${encodeURIComponent(id)}'" />
                </div>
                <div class="prod-body">
                    ${brand ? `<div class="prod-brand">${escapeHtml(brand)}</div>` : ''}
                    <div class="prod-name">${escapeHtml(name)}</div>
                    <div class="prod-price-row">
                        ${finalPrice != null ? `<span class="prod-price">${escapeHtml(formatPrice(finalPrice))}</span>` : ''}
                        ${price.hasPromo && price.regular
                            ? `<span class="prod-price-strike">${escapeHtml(formatPrice(price.regular))}</span>`
                            : ''}
                    </div>
                    <div class="prod-ship">FREE Delivery</div>
                </div>
            </a>
        `;
    }

    /**
     * Count products living in this category or any descendant.
     * Category IDs are hierarchical (e.g. "1", "1-1", "1-1-1"), so a product
     * whose categories array contains any id equal to rootId or starting with
     * `${rootId}-` belongs in this subtree.
     */
    static #countProductsInTree(rootId) {
        const prefix = `${rootId}-`;
        const products = CatalogManager.getProducts();
        let n = 0;
        for (const p of products) {
            const cats = p.content?.categories || [];
            if (cats.some(c => c === rootId || c.startsWith(prefix))) n++;
        }
        return n;
    }

    /**
     * Empty hook — product cards are anchor links so default navigation works.
     * Reserved for future per-card interactions (e.g. add-to-cart shortcut).
     */
    static #wireProductCards() {}

    /**
     * Fetch ads once, dispatch display creatives to the 3 named slots by
     * creativeFormat, then render the sponsored-products band.
     */
    static async #fetchAndRenderAds(pageId, pageType) {
        let adsData;
        try {
            adsData = await Tracking.requestAds(pageId, pageType, {});
        } catch (err) {
            console.warn('[HOME] requestAds failed', err);
            return;
        }
        if (!adsData) return;

        const display = adsData.display || [];

        for (const { slotId, match } of HOME_DISPLAY_SLOTS) {
            const el = getEl(slotId);
            if (!el) continue;
            const creative = display.find(c => c && match(c));
            if (creative) {
                Tracking.renderDisplayAds([creative], el, pageId);
            } else {
                el.innerHTML = '';
            }
        }

        const bandEl = getEl('home-sponsored-band');
        if (bandEl) {
            Tracking.renderSponsoredBand(adsData, bandEl, pageId);
        }
    }
}

export { HomePage };
