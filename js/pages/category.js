// ===================================
// Category Page — Marketplace layout
// ===================================
//
// Layout (mirrors the design bundle's CategoryPage):
//   1. Breadcrumb (Home > parents > current)
//   2. Sponsored Media leaderboard (BANNER / NATIVE_BANNER)
//   3. Two-column body:
//      - Sidebar: Categories tree (parents → current → subcats), Brand facet (visual only)
//      - Main: title + toolbar + product grid (cols-4) + sponsored band
//        SPONSORED_BRAND_IMAGE creatives are split off from display[] and
//        injected at the top of the grid as a brand-image hero + ≤2 sponsored
//        product cards (its attached products), so they read as the first
//        results of the listing.
//
// One Tracking.requestAds() call returns both productAds[] and display[].

import { getEl, escapeHtml, formatPrice, showMessage } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

// Decorative facets — Price/Brand/Seller checkboxes are visual-only (disabled).
// Real filtering would require wiring change handlers + re-rendering the grid.
const PRICE_BUCKETS = ['Under $25', '$25–$50', '$50–$100', 'Over $100'];

class CategoryPage {
    static render(params) {
        const categoryId = params.categoryId;
        const category = CatalogManager.getCategoryById(categoryId);

        if (!category) {
            CategoryPage.#renderNotFound(categoryId);
            return;
        }

        const pageType = Tracking.PAGE_TYPES.CATEGORY;
        const pageId = Tracking.getPageId(pageType);
        Debug.setPage({ type: 'category', id: pageId, path: location.hash, categoryId });
        Tracking.trackPageView(pageId, pageType, { categoryId, categoryName: category.content.name });
        Tracking.trackCategoryView(categoryId);

        const adsPromise = Tracking.requestAds(pageId, pageType, { categoryId });

        const ancestors = CategoryPage.#getAncestors(categoryId);
        const subcats = CatalogManager.getChildCategories(categoryId);
        const products = CategoryPage.#getProductsInTree(categoryId);
        const brands = CategoryPage.#topBrands(products, 8);

        const app = getEl('app');
        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    ${CategoryPage.#renderCrumbs(ancestors, category)}

                    <div class="ad-zone-slot" id="cat-display"></div>

                    <div class="layout-with-side">
                        <aside class="side">
                            <div class="side-section">
                                <h4>Categories</h4>
                                <div class="cat-tree">
                                    ${ancestors.map(a => `
                                        <a class="cat-tree-item" href="#/category/${escapeHtml(a.id)}">${escapeHtml(a.content.name)}</a>
                                    `).join('')}
                                    <a class="cat-tree-item is-active depth-1" href="#/category/${escapeHtml(category.id)}">${escapeHtml(category.content.name)}</a>
                                    ${subcats.map(s => `
                                        <a class="cat-tree-item depth-2" href="#/category/${escapeHtml(s.id)}">↳ ${escapeHtml(s.content.name)}</a>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="side-section">
                                <h4>Price</h4>
                                ${PRICE_BUCKETS.map(p => `
                                    <label class="facet"><input type="checkbox" disabled> ${escapeHtml(p)}</label>
                                `).join('')}
                            </div>
                            ${brands.length ? `
                                <div class="side-section">
                                    <h4>Brand</h4>
                                    ${brands.map(b => `
                                        <label class="facet">
                                            <input type="checkbox" disabled> ${escapeHtml(b.name)}
                                            <span class="count">${b.count}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            ` : ''}
                            <div class="side-section">
                                <h4>Seller</h4>
                                <label class="facet"><input type="checkbox" checked disabled> Direct</label>
                                <label class="facet"><input type="checkbox" checked disabled> Marketplace</label>
                            </div>
                        </aside>

                        <div>
                            <h1 class="section-title" style="margin-bottom: 4px;">${escapeHtml(category.content.name)}</h1>

                            <div class="toolbar">
                                <div class="toolbar-info"><strong>${products.length}</strong> results in <strong>${escapeHtml(category.content.name)}</strong></div>
                                <div class="toolbar-controls">
                                    <select id="cat-sort">
                                        <option value="featured">Sort: Featured</option>
                                        <option value="price-asc">Price: low to high</option>
                                        <option value="price-desc">Price: high to low</option>
                                    </select>
                                </div>
                            </div>

                            <div id="cat-grid">${CategoryPage.#renderGrid(products, 'featured', null)}</div>

                            <div style="height: 28px;"></div>

                            <div class="ad-zone-slot" id="cat-sponsored-band"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Holds the SBI creative once ads resolve so re-sorts can re-inject it.
        let sbiCreative = null;

        const sortSel = getEl('cat-sort');
        if (sortSel) {
            sortSel.addEventListener('change', () => {
                getEl('cat-grid').innerHTML = CategoryPage.#renderGrid(products, sortSel.value, sbiCreative);
                CategoryPage.#wireSponsoredBrandTracking(pageId);
            });
        }

        adsPromise.then(adsData => {
            if (!adsData) return;

            // SPONSORED_BRAND_IMAGE creatives are pulled out of display[] and
            // re-injected at the top of the product grid (brand image + its
            // attached products). Anything else (BANNER, NATIVE_BANNER, …)
            // stays in the leaderboard slot.
            const display = Array.isArray(adsData.display) ? adsData.display : [];
            const sbi = display.find(c =>
                c.creativeFormat === 'SPONSORED_BRAND_IMAGE' || c.creativeFormat === 'SHOPPABLE'
            );
            const otherDisplay = display.filter(c => c !== sbi);

            const slot = getEl('cat-display');
            if (slot) Tracking.renderDisplayAds(otherDisplay, slot, pageId);

            if (sbi) {
                sbiCreative = sbi;
                getEl('cat-grid').innerHTML = CategoryPage.#renderGrid(products, sortSel?.value || 'featured', sbi);
                CategoryPage.#wireSponsoredBrandTracking(pageId, sbi);
            }

            const bandEl = getEl('cat-sponsored-band');
            if (bandEl) Tracking.renderSponsoredBand(adsData, bandEl, pageId);
        }).catch(err => console.warn('[CATEGORY] requestAds failed', err));
    }

    /* ---------- helpers ---------- */

    static #getAncestors(categoryId) {
        const path = CatalogManager.getCategoryPath(categoryId);
        // getCategoryPath returns the full chain incl. current; ancestors = all but last
        return path.slice(0, -1);
    }

    // Category IDs are hierarchical ("1", "1-1", "1-1-1") — match this id or any
    // descendant by prefix so a product in "1-1-1" still appears under "1".
    static #getProductsInTree(rootId) {
        const prefix = `${rootId}-`;
        return CatalogManager.getProducts().filter(p => {
            const cats = p.content?.categories || [];
            return cats.some(c => c === rootId || c.startsWith(prefix));
        });
    }

    static #topBrands(products, max) {
        const counts = new Map();
        for (const p of products) {
            const b = CatalogManager.getProductBrand(p);
            if (!b) continue;
            counts.set(b, (counts.get(b) || 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, max)
            .map(([name, count]) => ({ name, count }));
    }

    static #renderCrumbs(ancestors, current) {
        const parts = [
            `<a href="#/">Home</a>`,
            ...ancestors.map(a => `<span class="sep">/</span><a href="#/category/${escapeHtml(a.id)}">${escapeHtml(a.content.name)}</a>`),
            `<span class="sep">/</span><span>${escapeHtml(current.content.name)}</span>`
        ];
        return `<div class="crumbs">${parts.join('')}</div>`;
    }

    static #renderGrid(products, sort, sbi) {
        const sbiCards = sbi ? CategoryPage.#renderSponsoredBrandZone(sbi) : '';
        const hasSbi = sbiCards.length > 0;

        if (products.length === 0 && !hasSbi) {
            return `
                <div class="empty">
                    <h3>No products yet</h3>
                    <p>This category has subcategories — pick one from the sidebar to browse.</p>
                </div>
            `;
        }
        const sorted = CategoryPage.#sortProducts(products, sort).slice(0, 24);
        return `
            <div class="prod-grid cols-4">
                ${sbiCards}
                ${sorted.map(p => CategoryPage.#renderProductCard(p)).join('')}
            </div>
        `;
    }

    /**
     * Build the leading "sponsored-brand-zone" for a SPONSORED_BRAND_IMAGE
     * creative. The zone is a single wrapper that takes the dbg outline +
     * badge once for the whole creative. It contains:
     *   1× brand-image card (sized to fit a normal grid card)
     *   + up to 2 sponsored product cards (the creative's attached products).
     * All cards carry data-ad-impression / data-ad-click so the existing
     * Tracking.attachSponsoredTracking pipeline picks them up.
     *
     * The wrapper uses subgrid + grid-column: span N so the inner cards stay
     * pixel-aligned with the surrounding regular products in the 4-col grid.
     */
    static #renderSponsoredBrandZone(sbi) {
        if (!sbi) return '';
        const adId = sbi.adId || '';
        const brandImage = sbi.creativeSet?.asset?.url || '';
        const brandLabel = sbi.digitalServiceAct?.behalf || sbi.brand || sbi.brandName || 'Featured Brand';
        const brandLink = sbi.redirectionUrl || sbi.clickUrl || '#';
        const isExternal = !brandLink.startsWith('#');

        // Resolve attached products (max 2) via SKU-prefix fallback — same
        // approach as Tracking.renderSponsoredBand.
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
            CategoryPage.#renderSponsoredProductCard(product, pAdId)
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
     * Wire impression/click tracking on the sponsored-brand-zone just inserted
     * into #cat-grid. Idempotent — Tracking.attachSponsoredTracking guards via
     * dataset flags. Also registers an entry in the debug sidebar and wraps
     * the zone wrapper (not each inner card) so the dashed outline + corner
     * badge appear once around the whole creative.
     */
    static #wireSponsoredBrandTracking(pageId, sbi) {
        const grid = getEl('cat-grid');
        if (!grid) return;
        if (sbi) {
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
            const zone = grid.querySelector(':scope > .prod-grid > .sponsored-brand-zone');
            if (zone) Debug.wrap(zone, unit);
        }
        Tracking.attachSponsoredTracking(grid);
    }

    static #sortProducts(products, sort) {
        if (sort === 'featured') return products;
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

    static #renderNotFound(categoryId) {
        const app = getEl('app');
        app.innerHTML = `
            <div class="container fade-in">
                <div class="message message-error">
                    Category not found: ${escapeHtml(categoryId)}
                </div>
                <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
            </div>
        `;
    }

    /**
     * Kept for backwards compatibility with any inline onclick handlers that
     * may still reference it from other pages. Currently unused inside this file.
     */
    static addToCart(productId) {
        const success = Cart.addItem(productId, 1);
        showMessage(success ? 'Product added to cart!' : 'Error adding product to cart',
                    success ? 'success' : 'error');
    }
}

export { CategoryPage };
