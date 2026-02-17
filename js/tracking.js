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

import { Settings, CatalogManager } from "./catalog.js";
import { escapeHtml, formatPrice, generateProductBadges } from "./utils.js";

class Tracking {
  // JWT format: three base64url segments separated by dots, 50-2000 characters total
  static #JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  // Page type constants - values match the keys used in Settings.DEFAULT_SETTINGS.t2sPageIds
  static PAGE_TYPES = {
    HOMEPAGE: "homepage",
    CATEGORY: "category",
    PRODUCT: "product",
    CART: "cart",
    SEARCH: "search",
    POST_PAYMENT: "postPayment",
    PAYMENT: "payment",
  };

  // CORS Proxy configuration for authenticated Ads API calls
  static CORS_PROXY_URL = "https://proxycors-8kgt.onrender.com/proxy";
  static CORS_PROXY_HEALTH_ENDPOINT =
    "https://proxycors-8kgt.onrender.com/health";
  static CORS_PROXY_TIMEOUT = 5000; // 5 seconds timeout for health check

  /**
   * Get page ID from settings (configurable via Admin page)
   * @param {string} pageType - One of: 'homepage', 'category', 'product', 'cart', 'search', 'postPayment', 'payment'
   * @returns {number} Page ID from settings, falling back to Settings.DEFAULT_SETTINGS
   */
  static getPageId(pageType) {
    const settings = Settings.get();
    return (
      settings.t2sPageIds?.[pageType] ??
      Settings.DEFAULT_SETTINGS.t2sPageIds[pageType]
    );
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
    return (
      trimmed.length >= 50 &&
      trimmed.length <= 2000 &&
      this.#JWT_PATTERN.test(trimmed)
    );
  }

  /**
   * Build proxied URL for CORS-restricted endpoints
   * @param {string} targetUrl - The actual API endpoint URL
   * @returns {string} Proxied URL with encoded target
   *
   * @description Constructs a URL that routes through the CORS proxy.
   * Example: buildProxiedUrl('https://api.example.com/ads/v1')
   *          returns 'https://proxycors-8kgt.onrender.com?url=https%3A%2F%2Fapi.example.com%2Fads%2Fv1'
   */
  static buildProxiedUrl(targetUrl) {
    // Encode the target URL to ensure special characters are handled correctly
    const encodedUrl = encodeURIComponent(targetUrl);
    return `${this.CORS_PROXY_URL}?url=${encodedUrl}`;
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
        console.log(
          "⚠️ [TRACKING] Skipping: trackingUrl or customerId not configured",
        );
        return;
      }

      // Add current page URL
      eventData.url = window.location.href;

      // Add referer from sessionStorage (previous page in SPA)
      const previousUrl = sessionStorage.getItem("previousUrl");
      if (previousUrl) {
        eventData.referer = previousUrl;
      }

      // Store current URL for next navigation
      sessionStorage.setItem("previousUrl", window.location.href);

      // Build API URL
      const apiUrl = `${trackingUrl}/1.1/json/T/t`;

      // Build query parameters
      const params = new URLSearchParams();
      Object.keys(eventData).forEach((key) => {
        if (eventData[key] !== null && eventData[key] !== undefined) {
          params.append(key, eventData[key]);
        }
      });

      // Fire-and-forget POST request
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }).catch((error) => {
        console.error("❌ [TRACKING] Error sending event:", error);
      });

      console.log("📊 [TRACKING] Event sent:", eventData);
    } catch (error) {
      console.error("❌ [TRACKING] Exception:", error);
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
      pageId: this.getPageId("category"),
      categoryId: categoryId,
      pageNumber: 1,
      userConsent: true,
      userId: Settings.getTID(),
      eventName: "view",
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
      pageId: this.getPageId("search"),
      keywords: searchQuery,
      userConsent: true,
      userId: Settings.getTID(),
      eventName: "view",
    };

    // Add product IDs if present (pipe-separated)
    if (productIds.length > 0) {
      eventData.productId = productIds.join("|");
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
      pageId: this.getPageId("product"),
      productId: productId,
      userConsent: true,
      userId: Settings.getTID(),
      eventName: "view",
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
      pageId: this.getPageId("cart"),
      productId: productId,
      userConsent: true,
      userId: Settings.getTID(),
      eventName: "view",
      basketAmount: price * quantity,
      productsQuantity: quantity,
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
    const productIds = orderData.items.map((item) => item.productId).join("|");
    const quantities = orderData.items.map((item) => item.quantity).join("|");
    const priceList = orderData.items
      .map((item) => item.quantity * item.price)
      .join("|");

    this.sendTrackingEvent({
      cID: Settings.get().t2sCustomerId,
      pageId: this.getPageId("postPayment"),
      productId: productIds,
      userConsent: true,
      userId: Settings.getTID(),
      eventName: "view",
      productsQuantity: quantities,
      priceList: priceList,
      basketAmount: orderData.total,
      orderId: orderData.orderId,
    });
  }

  /**
   * Track page view (backwards compatibility)
   * @param {string} pageId - Page ID
   * @param {string} pageType - Page type
   * @param {Object} additionalData - Additional tracking data
   */
  static trackPageView(pageId, pageType, additionalData = {}) {
    console.log("📊 [TRACKING] Page View:", {
      pageId,
      pageType,
      timestamp: new Date().toISOString(),
      ...additionalData,
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
      const adsUrl = settings.adsServerUrl;
      const customerId = settings.t2sCustomerId;
      const userId = Settings.getTID();

      if (!adsUrl || !customerId) {
        console.warn("⚠️ [AD SERVING] Ads not configured");
        return null;
      }

      // Build request body based on page type
      const requestBody = {
        pageId: parseInt(pageId),
        userId: userId,
      };

      // Add page-specific context
      if (pageType === Tracking.PAGE_TYPES.CATEGORY && context.categoryId) {
        requestBody.categoryId = context.categoryId;
      } else if (
        pageType === Tracking.PAGE_TYPES.SEARCH &&
        context.searchQuery
      ) {
        requestBody.keywords = context.searchQuery;
      } else if (
        pageType === Tracking.PAGE_TYPES.PRODUCT &&
        context.productId
      ) {
        requestBody.productId = context.productId;
      }

      // Build request headers
      const headers = {
        "x-customer-id": customerId,
        "Content-Type": "application/json",
      };

      // Use authenticated endpoint with Authorization header for valid JWTs,
      // otherwise fall back to the public endpoint without auth
      const token = settings.adsServerToken?.trim();
      const useProxy = settings.useAdsProxy !== false; // Default to true if not set
      let endpoint;
      let fetchUrl;

      if (this.isValidJWT(token)) {
        // Authenticated call
        endpoint = "/ads/v1";
        headers["Authorization"] = `Bearer ${token}`;

        if (useProxy) {
          // Route through CORS proxy
          const targetUrl = `${adsUrl}${endpoint}`;
          fetchUrl = this.buildProxiedUrl(targetUrl);
          console.log(
            "🔄 [AD SERVING] Using CORS proxy for authenticated request",
          );
        } else {
          // Direct call (proxy disabled)
          fetchUrl = `${adsUrl}${endpoint}`;
          console.log(
            "🔄 [AD SERVING] Direct authenticated request (proxy disabled)",
          );
        }
      } else {
        // Public call - direct to server (no proxy needed)
        endpoint = "/ads/v1/public/rendered-content";
        fetchUrl = `${adsUrl}${endpoint}`;
      }

      // Make API request
      const response = await fetch(fetchUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("❌ [AD SERVING] API error:", response.status);
        return null;
      }

      const data = await response.json();
      console.log("✅ [AD SERVING] Received ads:", data);
      return data;
    } catch (error) {
      console.error("❌ [AD SERVING] Exception:", error);
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
      eventName: "impression",
      adId: adId,
      userId: Settings.getTID(),
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
      eventName: "click",
      adId: adId,
      userId: Settings.getTID(),
    });
  }

  /**
   * Render sponsored products section
   * @param {Object} adsData - Response from Ads API
   * @returns {string} HTML string
   */
  static renderSponsoredProducts(adsData) {
    if (!adsData || !adsData.productAds || adsData.productAds.length === 0) {
      return this.renderEmptySponsoredSection();
    }

    const adUnitsHtml = adsData.productAds
      .map((adUnit) => this.renderAdUnit(adUnit))
      .join("");

    return `
            <div class="sponsored-section">
                <h2 class="sponsored-title">Sponsored Products</h2>
                ${adUnitsHtml}
            </div>
        `;
  }

  /**
   * Render a single ad unit
   * @param {Object} adUnit - Ad unit object with adUnitId, adUnitSize, and products array
   * @returns {string} HTML string
   */
  static renderAdUnit(adUnit) {
    const { adUnitId, adUnitSize, products } = adUnit;
    const slots = [];

    // Render actual sponsored products
    for (let i = 0; i < Math.min(products.length, adUnitSize); i++) {
      slots.push(this.renderSponsoredProduct(products[i]));
    }

    // Fill remaining slots with placeholders
    for (let i = products.length; i < adUnitSize; i++) {
      slots.push(this.renderEmptySlot());
    }

    return `
            <div class="sponsored-ad-unit" style="margin-bottom: 8px;">
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
                    Ad Unit: ${escapeHtml(adUnitId)}
                </div>
                <div class="sponsored-grid">
                    ${slots.join("")}
                </div>
            </div>
        `;
  }

  /**
   * Render a sponsored product card with tracking attributes
   * @param {string} productId - Product ID to look up in catalog
   * @param {string} adId - Ad tracking ID for impression/click events
   * @param {string} trackingPrefix - Data attribute prefix ("ad" or "media")
   * @param {Object} [options] - Additional rendering options
   * @param {Object} [options.digitalServiceAct] - DSA compliance info (shown as footer)
   * @param {boolean} [options.includeImpression] - Whether to add impression tracking to image
   * @param {boolean} [options.skipIfMissing] - Return empty string if product not in catalog
   * @returns {string} HTML string for the product card, or empty string if skipped
   * @private
   */
  static #renderSponsoredProductCard(
    productId,
    adId,
    trackingPrefix,
    options = {},
  ) {
    const product = CatalogManager.getProductById(productId);

    if (!product && options.skipIfMissing) {
      return "";
    }
    const imageUrl =
      product?.content.imageUrl ||
      `https://placehold.co/250x250?text=${encodeURIComponent(productId)}`;
    const productName = product?.content.name || productId;
    const price = product ? CatalogManager.getProductPrice(product) : null;
    const brand = product ? CatalogManager.getProductBrand(product) : null;
    const badges = product
      ? generateProductBadges(product, true)
      : '<div class="product-badges"><span class="product-badge product-badge-sponsored">Sponsored</span></div>';
    const description =
      product?.content.longDescription || product?.content.name || productId;

    const escapedProductId = escapeHtml(productId);
    const escapedAdId = escapeHtml(adId);
    const clickAttr = `data-${trackingPrefix}-click`;
    const impressionAttr = options.includeImpression
      ? `data-${trackingPrefix}-impression="${escapedAdId}"`
      : "";

    const dsaFooter = options.digitalServiceAct
      ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; font-family: var(--font-mono);">
                        Sponsored ${options.digitalServiceAct.sponsor ? `by ${escapeHtml(options.digitalServiceAct.sponsor)}` : ""}
                    </div>`
      : "";

    return `
            <div class="product-card">
                <div class="product-card-image-wrapper">
                    ${badges}
                    <a href="#/product/${escapedProductId}" ${clickAttr}="${escapedAdId}">
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(productName)}"
                            class="product-card-image"
                            ${impressionAttr}
                            onerror="this.src='https://placehold.co/250x250?text=${encodeURIComponent(productId)}'"
                        />
                    </a>
                    <div class="product-card-info-overlay">
                        <div class="product-card-overlay-description">${escapeHtml(description)}</div>
                        <a href="#/product/${escapedProductId}" ${clickAttr}="${escapedAdId}"
                           class="product-card-overlay-cta">
                            View Details
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </div>
                </div>
                <div class="product-card-content">
                    ${brand ? `<div class="product-brand">${escapeHtml(brand)}</div>` : ""}
                    <a href="#/product/${escapedProductId}" ${clickAttr}="${escapedAdId}">
                        <div class="product-name">${escapeHtml(productName)}</div>
                    </a>
                    ${
                      price
                        ? `
                        <div class="product-price ${price.hasPromo ? "product-price-promo" : ""}">
                            ${price.hasPromo ? `<span class="product-price-regular">${formatPrice(price.regular)}</span>` : ""}
                            ${formatPrice(price.hasPromo ? price.promo : price.regular)}
                        </div>
                    `
                        : ""
                    }
                    ${dsaFooter}
                </div>
            </div>
        `;
  }

  /**
   * Render a single sponsored product (from productAds response)
   * @param {Object} sponsoredProduct - Sponsored product object with productId, adId, digitalServiceAct
   * @returns {string} HTML string
   */
  static renderSponsoredProduct(sponsoredProduct) {
    const { productId, adId, digitalServiceAct } = sponsoredProduct;
    return this.#renderSponsoredProductCard(productId, adId, "ad", {
      digitalServiceAct,
      includeImpression: true,
    });
  }

  /**
   * Attach impression and click tracking listeners for a given data-attribute prefix.
   * @param {HTMLElement} container - The container element holding ad HTML
   * @param {string} prefix - Data attribute prefix ("ad" or "media")
   * @private
   */
  static #attachTrackingByPrefix(container, prefix) {
    if (!container) return;

    // Attach impression tracking on image load
    container.querySelectorAll(`[data-${prefix}-impression]`).forEach((img) => {
      const adId = img.dataset[`${prefix}Impression`];
      img.addEventListener("load", () =>
        Tracking.trackSponsoredImpression(adId),
      );
    });

    // Attach click tracking on ad links
    container.querySelectorAll(`[data-${prefix}-click]`).forEach((link) => {
      const adId = link.dataset[`${prefix}Click`];
      link.addEventListener("click", () => Tracking.trackSponsoredClick(adId));
    });
  }

  /**
   * Attach event listeners for sponsored product impression and click tracking
   * Call this after inserting sponsored product HTML into the DOM.
   * @param {HTMLElement} container - The container element holding sponsored product HTML
   */
  static attachSponsoredTracking(container) {
    this.#attachTrackingByPrefix(container, "ad");
  }

  /**
   * Render an empty ad slot placeholder
   * @returns {string} HTML string
   */
  static renderEmptySlot() {
    return '<div class="sponsored-placeholder">Ad Slot</div>';
  }

  /**
   * Render empty sponsored section with placeholders
   * @returns {string} HTML string
   */
  static renderEmptySponsoredSection() {
    return `
            <div class="sponsored-section">
                <h2 class="sponsored-title">Sponsored Products</h2>
                <div class="sponsored-grid">
                    ${this.renderEmptySlot()}
                    ${this.renderEmptySlot()}
                    ${this.renderEmptySlot()}
                    ${this.renderEmptySlot()}
                </div>
            </div>
        `;
  }

  // ===================================
  // Media Display Ads Rendering
  // ===================================
  //
  // Media displays are sponsored advertising media assets returned in the Ads API response
  // within the "display" array. There are three creative formats:
  //
  // 1. BANNER_IMAGE - Simple banner image ad
  // 2. SPONSORED_BRAND_IMAGE - Banner image with associated product cards
  // 3. NATIVE_BANNER - Generic format with custom attributes
  //
  // Each media display has:
  // - adUnitId: The zone identifier where the ad should appear
  // - adId: Tracking identifier for impression/click events
  // - creativeSet: Contains the asset(s) to display (image URLs, dimensions)
  // - redirectionUrl: URL to navigate to when clicked
  // - creativeFormat: One of the three format types above
  // - products: Array of product IDs (for SPONSORED_BRAND_IMAGE)
  // - digitalServiceAct: DSA compliance information
  //
  // ===================================

  /**
   * Render all media display ads from the Ads API response
   * @param {Object} adsData - Response from Ads API containing display array
   * @returns {string} HTML string with all media display ads rendered, or placeholder if no ads
   */
  static renderMediaDisplayAds(adsData) {
    if (!adsData || !adsData.display || adsData.display.length === 0) {
      return this.renderEmptyMediaSection(); // Show placeholder when no media display ads
    }

    const displayAdsHtml = adsData.display
      .map((displayAd) => this.renderMediaDisplayAd(displayAd))
      .join("");

    return `
            <div class="sponsored-section">
                <h2 class="sponsored-title">Sponsored Media</h2>
                ${displayAdsHtml}
            </div>
        `;
  }

  /**
   * Render a single media display ad based on its creative format
   * @param {Object} displayAd - Display ad object from Ads API
   * @returns {string} HTML string
   */
  static renderMediaDisplayAd(displayAd) {
    const { creativeFormat } = displayAd;

    switch (creativeFormat) {
      case "BANNER_IMAGE":
        return this.renderBannerImage(displayAd);
      case "SPONSORED_BRAND_IMAGE":
        return this.renderSponsoredBrandImage(displayAd);
      case "NATIVE_BANNER":
        return this.renderNativeBanner(displayAd);
      default:
        console.warn(
          `⚠️ [MEDIA DISPLAY] Unknown format: ${creativeFormat}`,
          displayAd,
        );
        return "";
    }
  }

  // Default banner dimensions used when format parsing fails
  static #DEFAULT_BANNER_DIMENSIONS = { width: 728, height: 90 };

  /**
   * Parse format dimensions string into width and height
   * @param {string} format - Format string in "width:height" format (e.g., "728:90")
   * @returns {{ width: number, height: number }} Parsed dimensions or defaults
   * @private
   */
  static #parseFormatDimensions(format) {
    if (!format || typeof format !== "string") {
      return { ...this.#DEFAULT_BANNER_DIMENSIONS };
    }

    const parts = format.split(":");
    if (parts.length !== 2) {
      return { ...this.#DEFAULT_BANNER_DIMENSIONS };
    }

    const width = parseInt(parts[0], 10);
    const height = parseInt(parts[1], 10);

    if (isNaN(width) || isNaN(height)) {
      return { ...this.#DEFAULT_BANNER_DIMENSIONS };
    }

    return { width, height };
  }

  /**
   * Render the clickable banner image portion shared by BANNER_IMAGE and SPONSORED_BRAND_IMAGE
   * @param {Object} params - Banner parameters
   * @param {string} params.adId - Ad tracking ID
   * @param {string} params.imageUrl - Banner image URL
   * @param {string} params.redirectionUrl - Click destination URL
   * @param {{ width: number, height: number }} params.dimensions - Image dimensions
   * @param {string} params.altText - Alt text for the image
   * @param {string} params.fallbackText - Placeholder text for onerror fallback
   * @returns {string} HTML string
   * @private
   */
  static #renderBannerImageHtml({
    adId,
    imageUrl,
    redirectionUrl,
    dimensions,
    altText,
    fallbackText,
  }) {
    const escapedAdId = escapeHtml(adId);
    return `
                <div class="media-display-banner" style="text-align: center;">
                    <a href="${escapeHtml(redirectionUrl)}"
                       data-media-click="${escapedAdId}"
                       target="_blank"
                       rel="noopener noreferrer">
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${altText}"
                            style="max-width: 100%; width: ${dimensions.width}px; height: ${dimensions.height}px; object-fit: cover; display: block; margin: 0 auto; border-radius: 8px;"
                            data-media-impression="${escapedAdId}"
                            onerror="this.src='https://placehold.co/${dimensions.width}x${dimensions.height}?text=${fallbackText}'"
                        />
                    </a>
                </div>`;
  }

  /**
   * Wrap media display ad content with the standard outer container, header, and footer
   * @param {string} adUnitId - Ad unit identifier
   * @param {string} formatName - Creative format label (e.g., "BANNER_IMAGE")
   * @param {string} innerHtml - Main content HTML to place between header and footer
   * @returns {string} HTML string
   * @private
   */
  static #wrapMediaDisplayAd(adUnitId, formatName, innerHtml) {
    return `
            <div class="media-display-ad" style="margin-bottom: 24px;">
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; font-family: var(--font-mono);">
                    Ad Unit: ${escapeHtml(adUnitId)} | Format: ${escapeHtml(formatName)}
                </div>
                ${innerHtml}
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px; text-align: center;">
                    Sponsored Media
                </div>
            </div>
        `;
  }

  /**
   * Extract banner image URL and parsed dimensions from a display ad's creativeSet
   * @param {Object} creativeSet - Creative set from display ad
   * @returns {{ imageUrl: string, dimensions: { width: number, height: number } }}
   * @private
   */
  static #extractBannerAsset(creativeSet) {
    const imageUrl = creativeSet?.asset?.url || "";
    const format = creativeSet?.asset?.format || "728:90";
    const dimensions = this.#parseFormatDimensions(format);
    return { imageUrl, dimensions };
  }

  /**
   * Render BANNER_IMAGE format - a simple clickable banner image ad
   * @param {Object} displayAd - Display ad object
   * @returns {string} HTML string
   */
  static renderBannerImage(displayAd) {
    const { adUnitId, adId, creativeSet, redirectionUrl } = displayAd;
    const { imageUrl, dimensions } = this.#extractBannerAsset(creativeSet);

    const bannerHtml = this.#renderBannerImageHtml({
      adId,
      imageUrl,
      redirectionUrl,
      dimensions,
      altText: "Sponsored Banner",
      fallbackText: "Banner+Image",
    });

    return this.#wrapMediaDisplayAd(adUnitId, "BANNER_IMAGE", bannerHtml);
  }

  /**
   * Render SPONSORED_BRAND_IMAGE format - banner image with associated product cards
   * @param {Object} displayAd - Display ad object
   * @returns {string} HTML string
   */
  static renderSponsoredBrandImage(displayAd) {
    const { adUnitId, adId, creativeSet, redirectionUrl, products } = displayAd;
    const { imageUrl, dimensions } = this.#extractBannerAsset(creativeSet);

    const bannerHtml = this.#renderBannerImageHtml({
      adId,
      imageUrl,
      redirectionUrl,
      dimensions,
      altText: "Sponsored Brand Banner",
      fallbackText: "Brand+Banner",
    });

    // Render product cards using the shared helper, skipping missing catalog entries
    let productsHtml = "";
    if (products && products.length > 0) {
      const productCards = products
        .map((productItem) => {
          const productAdId = productItem.adId || adId;
          const card = this.#renderSponsoredProductCard(
            productItem.productId,
            productAdId,
            "media",
            { skipIfMissing: true },
          );

          if (!card) {
            console.warn(
              `⚠️ [MEDIA DISPLAY] Product not found: ${productItem.productId}`,
            );
          }

          return card;
        })
        .filter(Boolean);

      if (productCards.length > 0) {
        productsHtml = `
                <div class="sponsored-grid" style="margin-top: 16px;">
                    ${productCards.join("")}
                </div>`;
      }
    }

    return this.#wrapMediaDisplayAd(
      adUnitId,
      "SPONSORED_BRAND_IMAGE",
      bannerHtml + productsHtml,
    );
  }

  /**
   * Render NATIVE_BANNER format - generic format with custom attributes (simplified)
   * @param {Object} displayAd - Display ad object
   * @returns {string} HTML string
   */
  static renderNativeBanner(displayAd) {
    const { adUnitId, adId, creativeSet, redirectionUrl } = displayAd;

    const attributes = creativeSet?.attributes || {};
    const attributeNames = Object.keys(attributes);
    const attributesList =
      attributeNames.length > 0 ? attributeNames.join(", ") : "No attributes";

    const innerHtml = `
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
                    Attributes: ${escapeHtml(attributesList)}
                </div>
                <div class="media-display-banner" style="text-align: center;">
                    <a href="${escapeHtml(redirectionUrl)}"
                       data-media-click="${escapeHtml(adId)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        <img
                            src="https://placehold.co/100x100?text=Native+Banner"
                            alt="Native Banner"
                            style="max-width: 100%; width: 100px; height: 100px; display: block; margin: 0 auto; border-radius: 8px;"
                        />
                    </a>
                </div>`;

    return this.#wrapMediaDisplayAd(adUnitId, "NATIVE_BANNER", innerHtml);
  }

  /**
   * Render empty media display section with placeholder image
   * @returns {string} HTML string
   */
  static renderEmptyMediaSection() {
    return `
            <div class="sponsored-section">
                <h2 class="sponsored-title">Sponsored Media</h2>
                <div style="display: flex; justify-content: center; align-items: center; padding: 20px 0;">
                    <img
                        src="https://placehold.co/600x100/FFFFFF/aaa/png?text=this empty space needs a media ads"
                        alt="Display your media Ads here"
                        style="max-width: 100%; height: auto; border-radius: 8px;"
                    />
                </div>
            </div>
        `;
  }

  /**
   * Attach event listeners for media display impression and click tracking
   * Call this after inserting media display HTML into the DOM.
   * @param {HTMLElement} container - The container element holding media display HTML
   */
  static attachMediaTracking(container) {
    this.#attachTrackingByPrefix(container, "media");
  }

  /**
   * Populate sponsored product and media display containers from an ads promise.
   * Handles rendering HTML and attaching tracking listeners for both container types.
   * @param {Promise<Object|null>} adsPromise - Promise resolving to Ads API response
   *
   * Expects the DOM to contain:
   * - #sponsored-container (for product ads)
   * - #media-sponsored-container (for media display ads)
   */
  static populateAdsContainers(adsPromise) {
    if (!adsPromise) return;

    adsPromise
      .then((adsData) => {
        if (!adsData) return;

        const sponsoredContainer = document.getElementById(
          "sponsored-container",
        );
        if (sponsoredContainer) {
          sponsoredContainer.innerHTML =
            Tracking.renderSponsoredProducts(adsData);
          Tracking.attachSponsoredTracking(sponsoredContainer);
        }

        const mediaContainer = document.getElementById(
          "media-sponsored-container",
        );
        if (mediaContainer) {
          mediaContainer.innerHTML = Tracking.renderMediaDisplayAds(adsData);
          Tracking.attachMediaTracking(mediaContainer);
        }
      })
      .catch((error) => {
        console.error("Failed to load ads:", error);
      });
  }
}

export { Tracking };
