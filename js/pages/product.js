// ===================================
// Product Detail Page (PDP) — Marketplace layout
// ===================================
//
// Layout (mirrors the design bundle's ProductPage):
//   - 4-col grid at ≥1280px: thumbs (80px) · main image (1fr) · info-mid (320px) · sticky buybox (360px)
//   - Row 2 spans full width: "About this item" with editorial lead + facts grid
//   - Below the grid: leaderboard ad + related products + sponsored band

import { getEl, escapeHtml, formatPrice, showMessage, getSeller } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22600%22 height=%22600%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E`;

class ProductPage {
    static render(params) {
        const productId = params.productId;
        const product = CatalogManager.getProductById(productId);

        if (!product) {
            ProductPage.#renderNotFound(productId);
            return;
        }

        const pageType = Tracking.PAGE_TYPES.PRODUCT;
        const pageId = Tracking.getPageId(pageType);
        Debug.setPage({ type: 'product', id: pageId, path: location.hash, productId });
        Tracking.trackPageView(pageId, pageType, { productId, productName: product.content.name });
        Tracking.trackProductView(productId);

        const adsPromise = Tracking.requestAds(pageId, pageType, { productId });

        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);
        const seller = getSeller(product);

        const categoryId = product.content.categories?.[0];
        const ancestors = categoryId ? CatalogManager.getCategoryPath(categoryId) : [];
        const categoryLeaf = ancestors.length ? ancestors[ancestors.length - 1] : null;

        const stockQty = product.content.stockQuantity ?? 0;
        const stockLabel = stockQty <= 0 ? 'Out of stock'
            : stockQty < 10 ? `Only ${stockQty} left in stock`
            : 'In stock';
        const stockClass = stockQty <= 0 ? 'pdp-stock-out'
            : stockQty < 10 ? 'pdp-stock-low'
            : 'pdp-stock-ok';

        const finalPrice = price.hasPromo ? price.promo : price.regular;
        const promoPct = (price.hasPromo && price.regular)
            ? Math.round((1 - price.promo / price.regular) * 100)
            : 0;

        const productImage = product.content.imageUrl || '';
        const longDesc = product.content.longDescription || `${product.content.name} — a confident addition to any collection. Crafted with care and finished to high standards, it balances everyday usability with thoughtful detail.`;

        const formatChar = product.content.characteristics?.find(c => /format/i.test(c.id || c.name || ''));
        const formatValue = formatChar?.values?.[0]?.value || formatChar?.values?.[0]?.id || 'Standard';

        const app = getEl('app');
        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    ${ProductPage.#renderCrumbs(ancestors, product)}

                    <div class="pdp-grid">
                        <div class="pdp-thumbs">
                            ${[0, 1, 2, 3].map((i) => `
                                <div class="pdp-thumb ${i === 0 ? 'is-active' : ''}">
                                    <img src="${escapeHtml(productImage)}"
                                         alt="${escapeHtml(product.content.name)}"
                                         onerror="this.src='${PLACEHOLDER_SVG}'" />
                                </div>
                            `).join('')}
                        </div>

                        <div class="pdp-main">
                            <img src="${escapeHtml(productImage)}"
                                 alt="${escapeHtml(product.content.name)}"
                                 onerror="this.src='${PLACEHOLDER_SVG}'" />
                        </div>

                        <div class="pdp-info-mid">
                            ${brand ? `<div class="pdp-brand">Visit the ${escapeHtml(brand)} store</div>` : ''}
                            <h1 class="pdp-name">${escapeHtml(product.content.name)}</h1>
                            ${seller === '3P' ? `
                                <div class="mp-chip mp-chip-pdp" title="Sold by a marketplace seller">
                                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M3 9l1-5h16l1 5"></path>
                                        <path d="M5 9v11h14V9"></path>
                                        <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"></path>
                                    </svg>
                                    Sold by Marketplace seller
                                </div>
                            ` : ''}

                            <div class="pdp-rating-row">
                                <span class="stars">★★★★☆</span>
                                <span>4.5</span>
                                <span class="ratings">128 ratings</span>
                                <span class="muted">| 1,200+ bought in past month</span>
                            </div>

                            <div class="pdp-price-row">
                                <span class="pdp-price">${escapeHtml(formatPrice(finalPrice))}</span>
                                ${price.hasPromo && price.regular ? `
                                    <span class="pdp-strike">${escapeHtml(formatPrice(price.regular))}</span>
                                    <span class="pdp-save">Save ${promoPct}%</span>
                                ` : ''}
                            </div>

                            <div class="pdp-meta">
                                <dl class="pdp-meta-grid">
                                    <div class="pdp-meta-row">
                                        <dt>Product&nbsp;ID</dt>
                                        <dd><code>${escapeHtml(product.id)}</code></dd>
                                    </div>
                                    ${product.content.sku && product.content.sku !== product.id ? `
                                        <div class="pdp-meta-row">
                                            <dt>SKU</dt>
                                            <dd><code>${escapeHtml(product.content.sku)}</code></dd>
                                        </div>
                                    ` : ''}
                                    ${brand ? `
                                        <div class="pdp-meta-row">
                                            <dt>Brand</dt>
                                            <dd><strong>${escapeHtml(brand)}</strong></dd>
                                        </div>
                                    ` : ''}
                                    ${categoryLeaf ? `
                                        <div class="pdp-meta-row">
                                            <dt>Category</dt>
                                            <dd><a href="#/category/${escapeHtml(categoryLeaf.id)}">${escapeHtml(categoryLeaf.content.name)}</a></dd>
                                        </div>
                                    ` : ''}
                                    <div class="pdp-meta-row">
                                        <dt>Availability</dt>
                                        <dd>
                                            <span class="pdp-stock ${stockClass}">
                                                <span class="pdp-stock-dot"></span>
                                                ${escapeHtml(stockLabel)}
                                            </span>
                                        </dd>
                                    </div>
                                    <div class="pdp-meta-row">
                                        <dt>Sold by</dt>
                                        <dd>
                                            ${seller === '3P' ? `
                                                <span class="pdp-seller-line">
                                                    <strong>${escapeHtml(brand || 'Marketplace seller')}</strong>
                                                    <span class="mp-chip mp-chip-inline">Marketplace</span>
                                                </span>
                                            ` : `
                                                <span class="pdp-seller-line">
                                                    <strong>Marketplace Direct</strong>
                                                    <span class="pdp-1p-badge">1P</span>
                                                </span>
                                            `}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <!-- Format variants are static demo data; the catalog has no real variants. -->
                            <div>
                                <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">Format</div>
                                <div class="pdp-variants">
                                    ${['Standard', 'Premium', 'Collector'].map((v, i) => `
                                        <button type="button" class="pdp-variant ${i === 0 ? 'is-active' : ''}">${escapeHtml(v)}</button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="pdp-buybox-col">
                            <div class="pdp-buybox-price">${escapeHtml(formatPrice(finalPrice))}</div>
                            ${price.hasPromo && price.regular ? `
                                <div class="pdp-buybox-row">was <s>${escapeHtml(formatPrice(price.regular))}</s></div>
                            ` : ''}
                            <div class="pdp-buybox-row">FREE delivery <strong>tomorrow</strong> if ordered within 4 hrs</div>
                            <div class="pdp-buybox-stock">${escapeHtml(stockLabel)}</div>
                            <hr />
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 13px;">Quantity:</span>
                                <div class="pdp-qty-stepper">
                                    <button type="button" onclick="ProductPage.decreaseQuantity()">−</button>
                                    <input type="text" id="product-quantity" value="1" readonly />
                                    <button type="button" onclick="ProductPage.increaseQuantity()">+</button>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-full"
                                    onclick="ProductPage.addToCart('${escapeHtml(product.id)}')"
                                    ${stockQty <= 0 ? 'disabled' : ''}>
                                ${stockQty <= 0 ? 'Out of stock' : 'Add to Cart'}
                            </button>
                            <button class="btn btn-outline btn-full"
                                    onclick="ProductPage.buyNow('${escapeHtml(product.id)}')"
                                    ${stockQty <= 0 ? 'disabled' : ''}>
                                Buy Now
                            </button>
                        </div>

                        <div class="pdp-desc-block">
                            <header class="pdp-desc-h">
                                <h2 class="pdp-desc-title">About this item</h2>
                            </header>
                            <div class="pdp-desc-body">
                                <p class="pdp-desc-lead">${escapeHtml(longDesc)}</p>
                                <dl class="pdp-desc-facts">
                                    <div class="pdp-desc-fact"><dt>Format</dt><dd>${escapeHtml(formatValue)}</dd></div>
                                    <div class="pdp-desc-fact"><dt>Shipping</dt><dd>Free with orders over $25</dd></div>
                                    <div class="pdp-desc-fact"><dt>Returns</dt><dd>30-day refund or replacement</dd></div>
                                    <div class="pdp-desc-fact"><dt>Warranty</dt><dd>Standard manufacturer warranty</dd></div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 24px;" class="ad-zone-slot" id="pdp-display"></div>

                    <div class="ad-zone-slot" id="pdp-sponsored-band"></div>
                </div>
            </div>
        `;

        adsPromise.then(adsData => {
            if (!adsData) return;
            // Render ALL display creatives — Mirakl Ads can return multiple
            // (e.g. leaderboard + reserved deals strip). Stacking surfaces every
            // adUnitId both on the page and in the debug sidebar.
            const slot = getEl('pdp-display');
            if (slot) Tracking.renderDisplayAds(adsData.display, slot, pageId);
            const bandEl = getEl('pdp-sponsored-band');
            if (bandEl) Tracking.renderSponsoredBand(adsData, bandEl, pageId);
        }).catch(err => console.warn('[PDP] requestAds failed', err));
    }

    /* ---------- helpers ---------- */

    static #renderCrumbs(ancestors, product) {
        const parts = [`<a href="#/">Home</a>`];
        ancestors.forEach(a => {
            parts.push(`<span class="sep">/</span><a href="#/category/${escapeHtml(a.id)}">${escapeHtml(a.content.name)}</a>`);
        });
        parts.push(`<span class="sep">/</span><span>${escapeHtml(product.content.name)}</span>`);
        return `<div class="crumbs">${parts.join('')}</div>`;
    }

    static #renderNotFound(productId) {
        const app = getEl('app');
        app.innerHTML = `
            <div class="container fade-in">
                <div class="message message-error">
                    Product not found: ${escapeHtml(productId)}
                </div>
                <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
            </div>
        `;
    }

    static increaseQuantity() {
        const input = getEl('product-quantity');
        if (!input) return;
        const currentQty = parseInt(input.value) || 1;
        if (currentQty < 99) input.value = currentQty + 1;
    }

    static decreaseQuantity() {
        const input = getEl('product-quantity');
        if (!input) return;
        const currentQty = parseInt(input.value) || 1;
        if (currentQty > 1) input.value = currentQty - 1;
    }

    static addToCart(productId) {
        const quantityInput = getEl('product-quantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        if (quantity < 1) {
            showMessage('Please enter a valid quantity', 'error');
            return;
        }
        const success = Cart.addItem(productId, quantity);
        showMessage(success ? `Added ${quantity} item(s) to cart!` : 'Error adding product to cart',
                    success ? 'success' : 'error');
    }

    // Adds to cart THEN navigates — order matters so the cart shows the new line.
    static buyNow(productId) {
        ProductPage.addToCart(productId);
        location.hash = '#/cart';
    }
}

export { ProductPage };
