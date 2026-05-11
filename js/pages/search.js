// ===================================
// Search Page — Marketplace layout
// ===================================
//
// Layout:
//   1. Breadcrumb
//   2. Toolbar: results count + sort
//   3. BANNER_IMAGE display creatives           (#search-banner)
//   4. Sponsored Products band                  (#search-sponsored-band)
//   5. SPONSORED_BRAND_IMAGE creative           (#search-sbi, own mini-grid)
//   6. Search results grid (cols-5)             (#search-results)
//   7. NATIVE_BANNER display creatives          (#search-native)
//
// display[] is split by creativeFormat into 3 buckets — banner / sbi / native —
// each routed to its own slot. Same order as CategoryPage.

import { getEl, escapeHtml, formatPrice, showMessage, PLACEHOLDER_SVG } from '../utils.js';
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
        const hasQuery = query.length >= 3;
        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    <div class="crumbs">
                        <a href="#/">Home</a>
                        <span class="sep">/</span>
                        <span>Search results</span>
                    </div>

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

                    ${hasQuery ? `<div class="ad-zone-slot" id="search-banner"></div>` : ''}
                    ${hasQuery ? `<div class="ad-zone-slot" id="search-sponsored-band"></div>` : ''}
                    ${hasQuery ? `<div id="search-sbi"></div>` : ''}

                    <div id="search-results">
                        ${SearchPage.#renderResults(products, query, 'relevance')}
                    </div>

                    ${hasQuery ? `<div class="ad-zone-slot" id="search-native"></div>` : ''}
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

                const display = Array.isArray(adsData.display) ? adsData.display : [];
                const isBanner = (c) => c.creativeFormat === 'BANNER_IMAGE' || c.creativeFormat === 'BANNER';
                const isSbi    = (c) => c.creativeFormat === 'SPONSORED_BRAND_IMAGE' || c.creativeFormat === 'SHOPPABLE';
                const isNative = (c) => c.creativeFormat === 'NATIVE_BANNER' || c.creativeFormat === 'NATIVE_IMAGE';

                const banners  = display.filter(isBanner);
                const sbis     = display.filter(isSbi);
                const natives  = display.filter(isNative);

                const bannerSlot = getEl('search-banner');
                if (bannerSlot) Tracking.renderDisplayAds(banners, bannerSlot, pageId);

                const sbiSlot = getEl('search-sbi');
                if (sbiSlot) SearchPage.#renderSbiBlock(sbis[0], sbiSlot, pageId);

                const bandEl = getEl('search-sponsored-band');
                if (bandEl) Tracking.renderSponsoredBand(adsData, bandEl, pageId, { mode: 'grid' });

                const nativeSlot = getEl('search-native');
                if (nativeSlot) Tracking.renderDisplayAds(natives, nativeSlot, pageId);
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

    /**
     * Render the SPONSORED_BRAND_IMAGE creative as its own standalone block.
     * Mirrors CategoryPage.#renderSbiBlock — same visuals, same tracking.
     * The mini-grid uses .prod-grid.cols-5 to match the search results grid.
     */
    static #renderSbiBlock(sbi, slot, pageId) {
        if (!sbi || !slot) return;
        slot.innerHTML = `
            <div class="prod-grid cols-5">
                ${SearchPage.#renderSponsoredBrandZone(sbi)}
            </div>
        `;
        const unitId = `${pageId}-display-sponsored-brand-image`;
        const assetFormat = sbi?.creativeSet?.asset?.format;
        const unit = {
            kind: 'DISPLAY',
            id: unitId,
            creativeFormat: sbi.creativeFormat,
            formatCode: sbi.formatCode,
            adUnitSize: sbi.adUnitSize,
            assetFormat
        };
        Debug.register(unit);
        const zone = slot.querySelector('.sponsored-brand-zone');
        if (zone) Debug.wrap(zone, unit);
        Tracking.attachSponsoredTracking(slot);
    }

    /**
     * Build the leading sponsored-brand-zone for a SPONSORED_BRAND_IMAGE
     * creative — brand card + up to 2 attached products. Same shape as
     * CategoryPage.#renderSponsoredBrandZone.
     */
    static #renderSponsoredBrandZone(sbi) {
        if (!sbi) return '';
        const adId = sbi.adId || '';
        const brandImage = sbi.creativeSet?.asset?.url || '';
        const brandLabel = sbi.digitalServiceAct?.behalf || sbi.brand || sbi.brandName || 'Featured Brand';
        const brandLink = sbi.redirectionUrl || sbi.clickUrl || '#';
        const isExternal = !brandLink.startsWith('#');

        const attached = (sbi.products || []).slice(0, 2).map(p => {
            const pid = typeof p === 'string' ? p : p.productId;
            const product = CatalogManager.resolveProduct(pid);
            return product ? { product, adId: (typeof p === 'object' && p.adId) || adId } : null;
        }).filter(Boolean);

        const brandCard = `
            <a class="prod-card prod-card-sponsored-brand"
               href="${escapeHtml(brandLink)}"
               data-ad-click="${escapeHtml(adId)}"
               target="${isExternal ? '_blank' : '_self'}"
               rel="noopener">
                <span class="sp-chip">Sponsored</span>
                <div class="prod-thumb prod-thumb-brand">
                    ${brandImage
                        ? `<img class="prod-brand-img" src="${escapeHtml(brandImage)}" alt="${escapeHtml(brandLabel)}" data-ad-impression="${escapeHtml(adId)}" />`
                        : `<div class="prod-brand-ph">${escapeHtml(brandLabel)}</div>`}
                </div>
                <div class="prod-body">
                    <div class="prod-brand">${escapeHtml(brandLabel)}</div>
                    <div class="prod-name">Discover the brand</div>
                    <div class="prod-ship">Visit store</div>
                </div>
            </a>
        `;

        const productCards = attached.map(({ product, adId: pAdId }) =>
            SearchPage.#renderSponsoredProductCard(product, pAdId)
        ).join('');

        const span = 1 + attached.length;
        return `
            <div class="ad-zone sponsored-brand-zone" style="grid-column: span ${span};">
                ${brandCard}
                ${productCards}
            </div>
        `;
    }

    static #renderSponsoredProductCard(product, adId) {
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
            <a class="prod-card prod-card-sponsored" href="#/product/${escapeHtml(id)}"
               data-ad-click="${escapeHtml(adId || '')}">
                <span class="sp-chip">Sponsored</span>
                ${promoPct > 0 ? `<span class="promo-chip">-${promoPct}%</span>` : ''}
                <div class="prod-thumb">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy"
                         data-ad-impression="${escapeHtml(adId || '')}"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_SVG}'" />
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
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_SVG}'" />
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
