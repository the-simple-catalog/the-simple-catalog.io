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
// ===================================

const Tracking = {
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
    sendTrackingEvent(eventData) {
        try {
            const settings = Settings.get();
            const trackingUrl = settings.trackingUrl;
            const customerId = settings.t2sCustomerId;

            // Skip if tracking not configured
            if (!trackingUrl || !customerId) {
                console.log('⚠️ [TRACKING] Skipping: trackingUrl or customerId not configured');
                return;
            }

            // Add current page URL and referer to all events
            eventData.url = window.location.href;
            if (document.referrer) {
                eventData.referer = document.referrer;
            }

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
    },

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
    trackCategoryView(categoryId) {
        const settings = Settings.get();
        const pageIdValue = settings.t2sPageIds?.category || 1400;

        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            pageId: pageIdValue,
            categoryId: categoryId,
            pageNumber: 1,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view'
        });
    },

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
    trackSearchView(searchQuery, productIds = []) {
        const settings = Settings.get();
        const pageIdValue = settings.t2sPageIds?.search || 2000;

        const eventData = {
            cID: settings.t2sCustomerId,
            pageId: pageIdValue,
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
    },

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
    trackProductView(productId) {
        const settings = Settings.get();
        const pageIdValue = settings.t2sPageIds?.product || 1200;

        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            pageId: pageIdValue,
            productId: productId,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view'
        });
    },

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
    trackAddToCart(productId, quantity, price) {
        const settings = Settings.get();
        const pageIdValue = settings.t2sPageIds?.cart || 1600;

        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            pageId: pageIdValue,
            productId: productId,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view',
            basketAmount: price * quantity,
            productsQuantity: quantity
        });
    },

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
    trackPostPayment(orderData) {
        const settings = Settings.get();
        const pageIdValue = settings.t2sPageIds?.postPayment || 2400;

        // Extract product IDs, quantities, and priceList (quantity × unit price) (pipe-separated)
        const productIds = orderData.items.map(item => item.productId).join('|');
        const quantities = orderData.items.map(item => item.quantity).join('|');
        const priceList = orderData.items.map(item => item.quantity * item.price).join('|');

        this.sendTrackingEvent({
            cID: settings.t2sCustomerId,
            pageId: pageIdValue,
            productId: productIds,
            userConsent: true,
            userId: Settings.getTID(),
            eventName: 'view',
            productsQuantity: quantities,
            priceList: priceList,
            basketAmount: orderData.total,
            orderId: orderData.orderId
        });
    },

    /**
     * Track page view (backwards compatibility)
     * @param {string} pageId - Page ID
     * @param {string} pageType - Page type
     * @param {Object} additionalData - Additional tracking data
     */
    trackPageView(pageId, pageType, additionalData = {}) {
        console.log('📊 [TRACKING] Page View:', {
            pageId,
            pageType,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    },

    /**
     * Request sponsored products (placeholder for backwards compatibility)
     * @param {string} pageId - Page ID
     * @param {string} pageType - Page type
     * @param {Object} context - Additional context
     * @returns {Array} Empty array
     */
    requestSponsoredProducts(pageId, pageType, context = {}) {
        console.log('🎯 [AD SERVING] Request Sponsored Products:', {
            pageId,
            pageType,
            context,
            timestamp: new Date().toISOString()
        });
        return [];
    }
};

// Page IDs as constants for consistency
const PAGE_IDS = {
    HOMEPAGE: '1000',
    SEARCH: '2000',
    CATEGORY: '1400',
    PRODUCT: '1200',
    CART: '1600',
    PAYMENT: '3200',
    ORDER_CONFIRMATION: '2400'
};

// Page types for tracking
const PAGE_TYPES = {
    HOMEPAGE: 'homepage',
    CATEGORY: 'category',
    SEARCH: 'search',
    PRODUCT: 'product',
    CART: 'cart',
    PAYMENT: 'payment',
    POSTPAYMENT: 'postpayment'
};
