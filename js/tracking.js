// ===================================
// Tracking & Ad Serving - T2S Integration
// ===================================
//
// T2S Tracking API Documentation
// ===============================
//
// Endpoint: POST {trackingUrl}/1.1/json/T/t
// Content-Type: application/x-www-form-urlencoded
//
// Common Fields (sent in ALL events):
// -----------------------------------
// - cID:         Customer ID (from settings)
// - pageId:      Page type identifier (1200=product, 1400=category, 1600=cart, 2000=search, 2400=post-payment)
// - userId:      User tracking ID (UUID stored in localStorage)
// - userConsent: User consent flag (always true)
// - eventName:   Event type (always "view")
// - url:         Current page URL (auto-added by sendTrackingEvent)
// - referer:     Previous page URL (auto-added if available)
//
// Event-Specific Fields:
// ----------------------
// Category View:
//   - categoryId:        Category being viewed
//   - pageNumber:        Page number (always 1)
//
// Search View:
//   - keywords:          Search query
//   - productId:         Pipe-separated product IDs in results
//
// Product View:
//   - productId:         Product being viewed
//
// Add to Cart:
//   - productId:         Product being added
//   - productsQuantity:  Quantity added
//   - basketAmount:      Total amount (quantity × unit price)
//
// Post-Payment:
//   - productId:         Pipe-separated product IDs
//   - productsQuantity:  Pipe-separated quantities
//   - priceList:         Pipe-separated amounts (quantity × unit price per product)
//   - basketAmount:      Order total
//   - orderId:           Order identifier
//
// Mirakl Ads API Documentation
// =============================
//
// Endpoint: POST {adsServerUrl}/ads/v1 (with valid JWT - authenticated)
//           POST {adsServerUrl}/ads/v1/public/rendered-content (without valid JWT - public)
// Content-Type: application/json
// Headers:
//   - x-customer-id: Customer ID (required)
//   - Content-Type: application/json (required)
//   - Authorization: Bearer {token} (only with valid JWT token)
//
// Token Validation (STRICT):
// - Token must be in valid JWT format (xxx.yyy.zzz - 3 parts separated by dots)
// - Token length must be between 50 and 2000 characters
// - Each segment must contain only base64url characters: A-Z, a-z, 0-9, hyphen (-), underscore (_)
// - Invalid tokens will ALWAYS use the public endpoint (never authenticated)
//
// Request Body:
// - pageId:      Page type identifier
// - userId:      User tracking ID
// - categoryId:  Category ID (for category pages)
// - keywords:    Search query (for search pages)
// - productId:   Product ID (for product pages)
//
// Response:
// - productAds:  Array of ad units with sponsored products
//
// ===================================

import { Settings, CatalogManager } from './catalog.js';
import { escapeHtml, formatPrice, generateProductBadges } from './utils.js';
import { SponsoredMedia } from './sponsoredMedia.js';
import { Debug } from './debug.js';

class Tracking {
    // JWT format: three base64url segments separated by dots, 50-2000 characters total
    static #JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

    // Static fixture served when settings.adsApiMockMode is on (Admin → Developer).
    // Path is relative to the site root, served alongside the static assets.
    static #ADS_MOCK_URL = 'doc/examples/ads01.json';

    // Page type constants - values match the keys used in Settings.DEFAULT_SETTINGS.t2sPageIds
    static PAGE_TYPES = {
        HOMEPAGE: 'homepage',
        CATEGORY: 'category',
        PRODUCT: 'product',
        CART: 'cart',
        SEARCH: 'search',
        POST_PAYMENT: 'postPayment',
        PAYMENT: 'payment'
    };

    /**
     * Get page ID from settings (configurable via Admin page)
     * @param {string} pageType - One of: 'homepage', 'category', 'product', 'cart', 'search', 'postPayment', 'payment'
     * @returns {number} Page ID from settings, falling back to Settings.DEFAULT_SETTINGS
     */
    static getPageId(pageType) {
        const settings = Settings.get();
        return settings.t2sPageIds?.[pageType] ?? Settings.DEFAULT_SETTINGS.t2sPageIds[pageType];
    }

    /**
     * Validate whether a token string is a well-formed JWT.
     * A valid JWT has three base64url segments separated by dots and is 50-2000 characters long.
     * @param {string|null|undefined} token - Raw token string
     * @returns {boolean} True if the token passes structural JWT validation
     */
    static isValidJWT(token) {
        if (!token) return false;
        const trimmed = token.trim();
        return trimmed.length >= 50 &&
               trimmed.length <= 2000 &&
               this.#JWT_PATTERN.test(trimmed);
    }

    /**
     * Send tracking event to T2S API
     * @param {Object} eventData - Event data object with tracking parameters
     * @returns {void} Fire-and-forget
     *
     * @description Sends a POST request to {trackingUrl}/1.1/json/T/t with application/x-www-form-urlencoded body.
     * Automatically adds 'url' (current page) and 'referer' (previous page) to all events.
     *
     * Common fields added to all events:
     * - url: Current page URL (window.location.href)
     * - referer: Previous page URL (document.referrer) - only if available
     */
    static sendTrackingEvent(eventData) {
        try {
            const settings = Settings.get();
            const trackingUrl = settings.trackingUrl;
            const customerId = settings.t2sCustomerId;

            // Skip if tracking not configured
            if (!trackingUrl || !customerId) {
                console.log('⚠️ [TRACKING] Skipping: trackingUrl or customerId not configured');
                return;
            }

            // Add current page URL
            eventData.url = window.location.href;

            // Add referer from sessionStorage (previous page in SPA)
            const previousUrl = sessionStorage.getItem('previousUrl');
            if (previousUrl) {
                eventData.referer = previousUrl;
            }

            // Store current URL for next navigation
            sessionStorage.setItem('previousUrl', window.location.href);

            // Build API URL
            const apiUrl = `${trackingUrl}/1.1/json/T/t`;

            // Build query parameters
            const params = new URLSearchParams();
            Object.keys(eventData).forEach(key => {
                if (eventData[key] !== null && eventData[key] !== undefined) {
                    params.append(key, eventData[key]);
                }
            });

            // Fire-and-forget POST request
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            }).catch(error => {
                console.error('❌ [TRACKING] Error sending event:', error);
            });

            console.log('📊 [TRACKING] Event sent:', eventData);
        } catch (error) {
            console.error('❌ [TRACKING] Exception:', error);
        }
    }

    /**
     * Track category view
     * @param {string} categoryId - Category ID
     *
     * API Fields Sent:
     * - cID: Customer ID (from settings.t2sCustomerId)
     * - pageId: Page type identifier (1400 = category)
     * - categoryId: The category being viewed
     * - pageNumber: Page number (always 1)
     * - userConsent: User consent flag (always true)
     * - userId: User tracking ID (UUID from localStorage)
     * - eventName: Event type (always "view")
     * - url: Current page URL (auto-added)
     * - referer: Previous page URL (auto-added if available)
     */
    static trackCategoryView(categoryId) {
        this.sendTrackingEvent({
            cID: Settings.get().t2sCustomerId,
            pageId: this.getPageId('category'),
            categoryId: categoryId,
            pageNumber: 1,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view'
        });
    }

    /**
     * Track search view
     * @param {string} searchQuery - Search query string
     * @param {Array<string>} productIds - Array of product IDs in search results
     *
     * API Fields Sent:
     * - cID: Customer ID (from settings.t2sCustomerId)
     * - pageId: Page type identifier (2000 = search)
     * - keywords: Search query string
     * - productId: Pipe-separated list of product IDs in results (e.g., "PROD1|PROD2|PROD3")
     * - userConsent: User consent flag (always true)
     * - userId: User tracking ID (UUID from localStorage)
     * - eventName: Event type (always "view")
     * - url: Current page URL (auto-added)
     * - referer: Previous page URL (auto-added if available)
     */
    static trackSearchView(searchQuery, productIds = []) {
        const eventData = {
            cID: Settings.get().t2sCustomerId,
            pageId: this.getPageId('search'),
            keywords: searchQuery,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view'
        };

        // Add product IDs if present (pipe-separated)
        if (productIds.length > 0) {
            eventData.productId = productIds.join('|');
        }

        this.sendTrackingEvent(eventData);
    }

    /**
     * Track product view
     * @param {string} productId - Product ID
     *
     * API Fields Sent:
     * - cID: Customer ID (from settings.t2sCustomerId)
     * - pageId: Page type identifier (1200 = product)
     * - productId: The product being viewed
     * - userConsent: User consent flag (always true)
     * - userId: User tracking ID (UUID from localStorage)
     * - eventName: Event type (always "view")
     * - url: Current page URL (auto-added)
     * - referer: Previous page URL (auto-added if available)
     */
    static trackProductView(productId) {
        this.sendTrackingEvent({
            cID: Settings.get().t2sCustomerId,
            pageId: this.getPageId('product'),
            productId: productId,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view'
        });
    }

    /**
     * Track add to cart
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity added
     * @param {number} price - Product unit price
     *
     * API Fields Sent:
     * - cID: Customer ID (from settings.t2sCustomerId)
     * - pageId: Page type identifier (1600 = cart)
     * - productId: The product being added
     * - basketAmount: Total amount (quantity × unit price)
     * - productsQuantity: Quantity being added
     * - userConsent: User consent flag (always true)
     * - userId: User tracking ID (UUID from localStorage)
     * - eventName: Event type (always "view")
     * - url: Current page URL (auto-added)
     * - referer: Previous page URL (auto-added if available)
     */
    static trackAddToCart(productId, quantity, price) {
        this.sendTrackingEvent({
            cID: Settings.get().t2sCustomerId,
            pageId: this.getPageId('cart'),
            productId: productId,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view',
            basketAmount: price * quantity,
            productsQuantity: quantity
        });
    }

    /**
     * Track post-payment (order confirmation)
     * @param {Object} orderData - Order data object
     * @param {string} orderData.orderId - Order ID (e.g., "ORDER_1707849123456")
     * @param {number} orderData.total - Order total amount
     * @param {Array} orderData.items - Array of order items with productId, quantity, price (unit price)
     *
     * API Fields Sent:
     * - cID: Customer ID (from settings.t2sCustomerId)
     * - pageId: Page type identifier (2400 = post-payment)
     * - productId: Pipe-separated list of product IDs (e.g., "PROD1|PROD2|PROD3")
     * - productsQuantity: Pipe-separated list of quantities (e.g., "2|1|3")
     * - priceList: Pipe-separated list of (quantity × unit price) for each product (e.g., "90.00|45.50|120.00")
     *              This represents the total amount for each line item, mandatory for discount handling
     * - basketAmount: Total order amount (sum of all line items)
     * - orderId: Unique order identifier
     * - userConsent: User consent flag (always true)
     * - userId: User tracking ID (UUID from localStorage)
     * - eventName: Event type (always "view")
     * - url: Current page URL (auto-added)
     * - referer: Previous page URL (auto-added if available)
     *
     * Example with 3 products:
     * - Product A: quantity=2, unitPrice=45 → priceList item = 90
     * - Product B: quantity=1, unitPrice=45.50 → priceList item = 45.50
     * - Product C: quantity=3, unitPrice=40 → priceList item = 120
     * Result: priceList="90|45.50|120", productsQuantity="2|1|3", basketAmount=255.50
     */
    static trackPostPayment(orderData) {
        // Extract product IDs, quantities, and priceList (quantity x unit price) (pipe-separated)
        const productIds = orderData.items.map(item => item.productId).join('|');
        const quantities = orderData.items.map(item => item.quantity).join('|');
        const priceList = orderData.items.map(item => item.quantity * item.price).join('|');

        this.sendTrackingEvent({
            cID: Settings.get().t2sCustomerId,
            pageId: this.getPageId('postPayment'),
            productId: productIds,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view',
            productsQuantity: quantities,
            priceList: priceList,
            basketAmount: orderData.total,
            orderId: orderData.orderId
        });
    }

    /**
     * Track page view (backwards compatibility)
     * @param {string} pageId - Page ID
     * @param {string} pageType - Page type
     * @param {Object} additionalData - Additional tracking data
     */
    static trackPageView(pageId, pageType, additionalData = {}) {
        console.log('📊 [TRACKING] Page View:', {
            pageId,
            pageType,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    /**
     * Request sponsored products from Ads API
     * @param {string} pageId - Page ID
     * @param {string} pageType - Page type
     * @param {Object} context - Additional context (categoryId, searchQuery, productId)
     * @returns {Promise<Object|null>} Promise resolving to ads data or null on error
     */
    static async requestSponsoredProducts(pageId, pageType, context = {}) {
        try {
            const settings = Settings.get();

            // Ads API mock mode — bypass the real backend and serve the
            // captured ads01.json fixture. The setting is toggled from the
            // Admin Developer card. Console lines use the 🧪 prefix so it's
            // obvious the response did not come from the live API.
            if (settings.adsApiMockMode) {
                return await this.#loadMockAdsResponse();
            }

            const adsUrl = settings.adsServerUrl;
            const customerId = settings.t2sCustomerId;
            const userId = Settings.getTID();

            if (!adsUrl || !customerId) {
                console.warn('⚠️ [AD SERVING] Ads not configured');
                return null;
            }

            // Build request body based on page type
            const requestBody = {
                pageId: parseInt(pageId),
                userId: userId
            };

            // Add page-specific context
            if (pageType === Tracking.PAGE_TYPES.CATEGORY && context.categoryId) {
                requestBody.categoryId = context.categoryId;
            } else if (pageType === Tracking.PAGE_TYPES.SEARCH && context.searchQuery) {
                requestBody.keywords = context.searchQuery;
            } else if (pageType === Tracking.PAGE_TYPES.PRODUCT && context.productId) {
                requestBody.productId = context.productId;
            }

            // Build request headers
            const headers = {
                'x-customer-id': customerId,
                'Content-Type': 'application/json'
            };

            // Use authenticated endpoint with Authorization header for valid JWTs,
            // otherwise fall back to the public endpoint without auth
            const token = settings.adsServerToken?.trim();
            let endpoint;
            if (this.isValidJWT(token)) {
                endpoint = '/ads/v1';
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                endpoint = '/ads/v1/public/rendered-content';
            }

            // Make API request
            const response = await fetch(`${adsUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error('❌ [AD SERVING] API error:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('✅ [AD SERVING] Received ads:', data);
            return data;

        } catch (error) {
            console.error('❌ [AD SERVING] Exception:', error);
            return null;
        }
    }

    /**
     * Track sponsored product impression
     * @param {string} adId - Ad ID from the Ads API
     */
    static trackSponsoredImpression(adId) {
        const settings = Settings.get();
        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            eventName: 'impression',
            adId: adId,
            userId: Settings.getTID()
        });
    }

    /**
     * Track sponsored product click
     * @param {string} adId - Ad ID from the Ads API
     */
    static trackSponsoredClick(adId) {
        const settings = Settings.get();
        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            eventName: 'click',
            adId: adId,
            userId: Settings.getTID()
        });
    }

    /**
     * Alias used by new page code — same shape as requestSponsoredProducts
     * but the response may include both productAds[] and display[].
     */
    static async requestAds(pageId, pageType, context = {}) {
        return this.requestSponsoredProducts(pageId, pageType, context);
    }

    /**
     * Fetch the static ads01.json fixture used by Ads API mock mode.
     * Returns the parsed JSON, or null if the file can't be reached.
     * @returns {Promise<Object|null>}
     */
    static async #loadMockAdsResponse() {
        try {
            const response = await fetch(this.#ADS_MOCK_URL);
            if (!response.ok) {
                console.error('🧪 [AD SERVING] Mock fetch failed:', response.status);
                return null;
            }
            const data = await response.json();
            console.log('🧪 [AD SERVING] Ads API mock mode — using ads01.json', data);
            return data;
        } catch (error) {
            console.error('🧪 [AD SERVING] Mock exception:', error);
            return null;
        }
    }

    /**
     * Render the unified Sponsored Products band (Shoppable carousel).
     *
     * Inserts a static "Shop now" CTA card as the first item, followed by one
     * `.sm-shop-prod` per sponsored product. Each ad unit is registered with
     * Debug and wrapped with the dashed-outline + corner badge.
     *
     * @param {Object} adsData          response from /ads/v1
     * @param {HTMLElement} container   element to render into (replaces innerHTML)
     * @param {number|string} pageId    current page id (used for badge ids)
     */
    static renderSponsoredBand(adsData, container, pageId) {
        if (!container) return;

        const productAds = adsData?.productAds || [];
        if (productAds.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Each ad unit in productAds becomes its own band — usually there's just one.
        const bandsHtml = productAds.map((adUnit, idx) => {
            // resolveProduct (not getProductById) — Mirakl Ads IDs use a different
            // middle segment than the catalog (e.g. "...-0-master" vs "...-1000-master"),
            // so exact lookup misses; SKU-prefix fallback recovers the catalog product.
            const products = (adUnit.products || []).map(sp => {
                const p = CatalogManager.resolveProduct(sp.productId);
                return p ? { product: p, adId: sp.adId, sponsor: sp.digitalServiceAct?.sponsor } : null;
            }).filter(Boolean);

            const cardsHtml = products.map(({ product, adId }) =>
                this.#bandCard(product, adId)
            ).join('');

            const unitId = `${pageId}-product-${idx}`;
            return `
                <div class="ad-zone" data-unit-id="${escapeHtml(unitId)}">
                    <div class="sm-shoppable sponso-band">
                        <div class="sm-shop-head">
                            <div class="sm-shop-title">Sponsored Products</div>
                            <div class="sm-shop-tag">Sponsored</div>
                        </div>
                        <div class="sm-shop-body">
                            <button class="sm-shop-prev" type="button" aria-label="Previous" hidden>‹</button>
                            <div class="sm-shop-scroller">
                                <a class="sponso-shop-now" href="#/search">
                                    <h3>Shop now.</h3>
                                    <p>Hand-picked sponsored products tailored to this page.</p>
                                    <span class="sponso-cta">
                                        Browse all
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </span>
                                </a>
                                ${cardsHtml}
                            </div>
                            <button class="sm-shop-next" type="button" aria-label="Next" hidden>›</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = bandsHtml;

        // Register + wrap each unit for the debug overlay.
        productAds.forEach((adUnit, idx) => {
            const unitId = `${pageId}-product-${idx}`;
            const slotEl = container.querySelector(`.ad-zone[data-unit-id="${CSS.escape(unitId)}"]`);
            const productIds = (adUnit.products || []).map(sp => sp.productId);
            Debug.register({
                kind: 'PRODUCT',
                id: unitId,
                creativeFormat: 'PRODUCT_ADS',
                adUnitSize: adUnit.adUnitSize,
                productsCount: adUnit.adUnitSize,
                productIds,
                served: productIds.length
            });
            if (slotEl) {
                Debug.wrap(slotEl, {
                    kind: 'PRODUCT',
                    id: unitId,
                    creativeFormat: 'PRODUCT_ADS',
                    adUnitSize: adUnit.adUnitSize
                });
            }
        });

        // Wire scroller arrows + impression/click handlers.
        SponsoredMedia.activateShoppableScrollers(container);
        this.attachSponsoredTracking(container);
    }

    /**
     * Render display creatives returned in adsData.display[].
     * One ad-zone per creative; rendering is delegated to SponsoredMedia.
     * @param {Array} displayAds
     * @param {HTMLElement} container
     * @param {number|string} pageId
     */
    static renderDisplayAds(displayAds, container, pageId) {
        if (!container) return;
        const list = displayAds || [];
        if (list.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = list.map(c => SponsoredMedia.render(c)).join('');

        // Register + wrap each creative for the debug overlay.
        list.forEach((creative, idx) => {
            const unitId = `${pageId}-display-${idx}`;
            const zones = container.querySelectorAll('.ad-zone');
            const slotEl = zones[idx];
            // assetFormat: dimensions string from creativeSet.asset.format (e.g. "300:250")
            // — surfaced on the badge so users can see the served asset's exact size.
            const assetFormat = creative?.creativeSet?.asset?.format;
            Debug.register({
                kind: 'DISPLAY',
                id: unitId,
                creativeFormat: creative.creativeFormat,
                formatCode: creative.formatCode,
                adUnitSize: creative.adUnitSize,
                assetFormat
            });
            if (slotEl) {
                Debug.wrap(slotEl, {
                    kind: 'DISPLAY',
                    id: unitId,
                    creativeFormat: creative.creativeFormat,
                    assetFormat
                });
            }
        });

        SponsoredMedia.activateShoppableScrollers(container);
        this.attachSponsoredTracking(container);
    }

    /**
     * Sponsored-band card markup (used inside .sm-shop-scroller).
     * @param {Object} product - full product object from catalog
     * @param {string} adId
     * @returns {string} HTML
     */
    static #bandCard(product, adId) {
        const id = product.id;
        const name = product.content.name || id;
        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);
        const image = product.content.imageUrl || `https://placehold.co/220x220?text=${encodeURIComponent(id)}`;
        return `
            <div class="sm-shop-prod">
                <a href="#/product/${escapeHtml(id)}" data-ad-click="${escapeHtml(adId || '')}">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}"
                         data-ad-impression="${escapeHtml(adId || '')}"
                         onerror="this.src='https://placehold.co/220x220?text=${encodeURIComponent(id)}'" />
                    <div class="sm-shop-info">
                        ${brand ? `<div class="sm-shop-brand">${escapeHtml(brand)}</div>` : ''}
                        <div class="sm-shop-name">${escapeHtml(name)}</div>
                        <div class="sm-shop-line"></div>
                        <div class="sm-shop-prices">
                            ${price.hasPromo ? `<span class="sm-shop-strike">${escapeHtml(formatPrice(price.regular))}</span>` : ''}
                            <span class="sm-shop-price ${price.hasPromo ? 'has-promo' : ''}">
                                ${escapeHtml(formatPrice(price.hasPromo ? price.promo : price.regular))}
                            </span>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    /**
     * Attach impression + click handlers to any element with
     * data-ad-impression / data-ad-click attributes inside the container.
     * Idempotent — uses dataset flags so the same element is never bound twice.
     * @param {HTMLElement} container
     */
    static attachSponsoredTracking(container) {
        if (!container) return;

        container.querySelectorAll('[data-ad-impression]').forEach(img => {
            if (img.dataset.impressionWired === '1') return;
            img.dataset.impressionWired = '1';
            const adId = img.dataset.adImpression;
            if (!adId) return;
            // Image already loaded? fire immediately, otherwise on load.
            if (img.tagName === 'IMG' && img.complete && img.naturalWidth > 0) {
                Tracking.trackSponsoredImpression(adId);
            } else {
                img.addEventListener('load', () => Tracking.trackSponsoredImpression(adId), { once: true });
            }
        });

        container.querySelectorAll('[data-ad-click]').forEach(link => {
            if (link.dataset.clickWired === '1') return;
            link.dataset.clickWired = '1';
            const adId = link.dataset.adClick;
            if (!adId) return;
            link.addEventListener('click', () => Tracking.trackSponsoredClick(adId));
        });
    }
}

export { Tracking };
