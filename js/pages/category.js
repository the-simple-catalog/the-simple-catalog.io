// ===================================
// Category Page — Marketplace layout
// ===================================
//
// Layout:
//   1. Breadcrumb (Home > parents > current)
//   2. Two-column body:
//      - Sidebar: Categories tree (parents → current → subcats), Brand facet (visual only)
//      - Main column — vertical stack:
//          a. Title + toolbar
//          b. BANNER_IMAGE display creatives        (#cat-banner)
//          c. Sponsored Products band               (#cat-sponsored-band)
//          d. SPONSORED_BRAND_IMAGE creative        (#cat-sbi, its own cols-6 mini-grid)
//          e. Category products grid (cols-6)       (#cat-grid)
//          f. NATIVE_BANNER display creatives       (#cat-native)
//
// display[] is split by creativeFormat into 3 buckets — banner / sbi / native —
// each routed to its own slot. One Tracking.requestAds() call returns both
// productAds[] and display[].

import { getEl, escapeHtml, formatPrice, showMessage, PLACEHOLDER_SVG } from '../utils.js';
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

                            <div class="ad-zone-slot" id="cat-banner"></div>

                            <div class="ad-zone-slot" id="cat-sponsored-band"></div>

                            <div id="cat-sbi"></div>

                            <div id="cat-grid">${CategoryPage.#renderGrid(products, 'featured')}</div>

                            <div class="ad-zone-slot" id="cat-native"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const sortSel = getEl('cat-sort');
        if (sortSel) {
            sortSel.addEventListener('change', () => {
                getEl('cat-grid').innerHTML = CategoryPage.#renderGrid(products, sortSel.value);
            });
        }

        adsPromise.then(adsData => {
            if (!adsData) return;

            // Split display[] by creativeFormat → 3 vertical slots in the main column.
            const display = Array.isArray(adsData.display) ? adsData.display : [];
            const isBanner = (c) => c.creativeFormat === 'BANNER_IMAGE' || c.creativeFormat === 'BANNER';
            const isSbi    = (c) => c.creativeFormat === 'SPONSORED_BRAND_IMAGE' || c.creativeFormat === 'SHOPPABLE';
            const isNative = (c) => c.creativeFormat === 'NATIVE_BANNER' || c.creativeFormat === 'NATIVE_IMAGE';

            const banners  = display.filter(isBanner);
            const sbis     = display.filter(isSbi);
            const natives  = display.filter(isNative);

            const bannerSlot = getEl('cat-banner');
            if (bannerSlot) Tracking.renderDisplayAds(banners, bannerSlot, pageId);

            const sbiSlot = getEl('cat-sbi');
            if (sbiSlot) CategoryPage.#renderSbiBlock(sbis[0], sbiSlot, pageId);

            const bandEl = getEl('cat-sponsored-band');
            if (bandEl) Tracking.renderSponsoredBand(adsData, bandEl, pageId, { mode: 'grid' });

            const nativeSlot = getEl('cat-native');
            if (nativeSlot) Tracking.renderDisplayAds(natives, nativeSlot, pageId);
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

    static #renderGrid(products, sort) {
        if (products.length === 0) {
            return `
                <div class="empty">
                    <h3>No products yet</h3>
                    <p>This category has subcategories — pick one from the sidebar to browse.</p>
                </div>
            `;
        }
        const sorted = CategoryPage.#sortProducts(products, sort).slice(0, 24);
        return `
            <div class="prod-grid cols-6">
                ${sorted.map(p => CategoryPage.#renderProductCard(p)).join('')}
            </div>
        `;
    }

    /**
     * Render the SPONSORED_BRAND_IMAGE creative as its own standalone block
     * (its own .prod-grid wrapper) — so it sits between the BANNER slot and
     * the Sponsored Products band, not inside the regular products grid.
     * The inner .sponsored-brand-zone keeps its subgrid + span behavior so
     * the brand card + attached products stay pixel-aligned within the row.
     * @param {Object|undefined} sbi
     * @param {HTMLElement} slot
     * @param {number|string} pageId
     */
    static #renderSbiBlock(sbi, slot, pageId) {
        if (!sbi || !slot) return;
        slot.innerHTML = `
            <div class="prod-grid cols-6">
                ${CategoryPage.#renderSponsoredBrandZone(sbi)}
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
