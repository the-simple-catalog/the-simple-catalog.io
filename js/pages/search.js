// ===================================
// Search Page — Marketplace layout
// ===================================
//
// Layout (mirrors the design bundle's SearchPage):
//   1. Breadcrumb
//   2. Sponsored Media leaderboard (BANNER preferred)
//   3. Toolbar: results count + sort
//   4. Sponsored Products band  (ABOVE results, per design)
//   5. Product grid (cols-5)

import { getEl, escapeHtml, formatPrice, showMessage } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

class SearchPage {
    static render(params) {
        const query = (params.q || '').trim();
        const pageType = Tracking.PAGE_TYPES.SEARCH;
        const pageId = Tracking.getPageId(pageType);

        Debug.setPage({ type: 'search', id: pageId, path: location.hash, searchKeyword: query });
        Tracking.trackPageView(pageId, pageType, { searchQuery: query });

        if (query) SearchPage.#logSearchQuery(query);

        // Min 3 chars before hitting the ads API + searching — avoids noisy
        // single-letter queries and matches CatalogManager.searchProducts default.
        const adsPromise = query.length >= 3
            ? Tracking.requestAds(pageId, pageType, { searchQuery: query })
            : null;

        const products = query.length >= 3 ? CatalogManager.searchProducts(query) : [];

        const app = getEl('app');
        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    <div class="crumbs">
                        <a href="#/">Home</a>
                        <span class="sep">/</span>
                        <span>Search results</span>
                    </div>

                    ${query.length >= 3 ? `<div class="ad-zone-slot" id="search-display"></div>` : ''}

                    <div class="toolbar">
                        <div class="toolbar-info">
                            ${query.length === 0
                                ? `<span>Type a query above to start searching.</span>`
                                : query.length < 3
                                    ? `<span>Please enter at least 3 characters.</span>`
                                    : `<strong>${products.length}</strong> results for <strong>"${escapeHtml(query)}"</strong>`
                            }
                        </div>
                        <div class="toolbar-controls">
                            <select id="search-sort">
                                <option value="relevance">Sort: Relevance</option>
                                <option value="price-asc">Price: low to high</option>
                                <option value="price-desc">Price: high to low</option>
                            </select>
                        </div>
                    </div>

                    ${query.length >= 3 ? `<div class="ad-zone-slot" id="search-sponsored-band"></div>` : ''}

                    <div id="search-results">
                        ${SearchPage.#renderResults(products, query, 'relevance')}
                    </div>
                </div>
            </div>
        `;

        const sortSel = getEl('search-sort');
        if (sortSel) {
            sortSel.addEventListener('change', () => {
                const wrap = getEl('search-results');
                if (wrap) wrap.innerHTML = SearchPage.#renderResults(products, query, sortSel.value);
            });
        }

        if (adsPromise) {
            adsPromise.then(adsData => {
                if (!adsData) return;
                // Render ALL display creatives — see CategoryPage for the why.
                const slot = getEl('search-display');
                if (slot) Tracking.renderDisplayAds(adsData.display, slot, pageId);
                const bandEl = getEl('search-sponsored-band');
                if (bandEl) Tracking.renderSponsoredBand(adsData, bandEl, pageId);
            }).catch(err => console.warn('[SEARCH] requestAds failed', err));
        }
    }

    /* ---------- helpers ---------- */

    static #logSearchQuery(query) {
        const products = CatalogManager.searchProducts(query);
        const productIds = products.map(p => p.id);
        Tracking.trackSearchView(query, productIds);

        try {
            const history = JSON.parse(localStorage.getItem('search_history') || '[]');
            history.push({ timestamp: new Date().toISOString(), query, resultCount: products.length });
            if (history.length > 100) history.shift();
            localStorage.setItem('search_history', JSON.stringify(history));
        } catch (e) {
            console.warn('[SEARCH] Failed to store history', e);
        }
    }

    static #renderResults(products, query, sort) {
        if (query.length === 0) {
            return `<div class="empty"><h3>Search anything</h3><p>Try a brand, product, or category name.</p></div>`;
        }
        if (query.length < 3) {
            return `<div class="empty"><h3>Type a longer query</h3><p>Search needs at least 3 characters.</p></div>`;
        }
        if (products.length === 0) {
            return `<div class="empty"><h3>No results for "${escapeHtml(query)}"</h3><p>Try different keywords or browse departments.</p></div>`;
        }

        const sorted = SearchPage.#sortProducts(products, sort).slice(0, 20);
        return `
            <div class="prod-grid cols-5">
                ${sorted.map(p => SearchPage.#renderProductCard(p)).join('')}
            </div>
        `;
    }

    static #sortProducts(products, sort) {
        if (sort === 'relevance') return products;
        const arr = [...products];
        const priceOf = (p) => {
            const pp = CatalogManager.getProductPrice(p);
            return pp.hasPromo ? pp.promo : pp.regular || 0;
        };
        if (sort === 'price-asc') arr.sort((a, b) => priceOf(a) - priceOf(b));
        if (sort === 'price-desc') arr.sort((a, b) => priceOf(b) - priceOf(a));
        return arr;
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
     * Kept for backwards compatibility (no inline buttons in the new layout).
     */
    static addToCart(productId) {
        const success = Cart.addItem(productId, 1);
        showMessage(success ? 'Product added to cart!' : 'Error adding product to cart',
                    success ? 'success' : 'error');
    }
}

export { SearchPage };
