/**
 * Tracking Module
 * Handles event tracking for analytics purposes
 */

const Tracking = (function() {
    // Debug mode flag (print tracking events to console)
    const DEBUG_MODE = true;
    
    // Queue for tracking events (in case analytics script hasn't loaded yet)
    const eventQueue = [];
    
    // Flag to indicate if analytics has been initialized
    let isInitialized = false;
    
    /**
     * Initialize tracking
     */
    function init() {
        if (isInitialized) return;
        
        // Setup listeners for common events
        setupCommonEventListeners();
        
        // Initialize global analytics object
        window.dataLayer = window.dataLayer || [];
        
        // Mark as initialized
        isInitialized = true;
        
        // Process any queued events
        processQueue();
        
        // Track page view
        trackPageView();
    }
    
    /**
     * Setup listeners for common events
     */
    function setupCommonEventListeners() {
        // Track clicks on product links
        document.addEventListener('click', function(e) {
            const productLink = e.target.closest('a[href^="product.html"]');
            if (productLink) {
                const productCard = productLink.closest('.product-card');
                if (productCard && productCard.dataset.productId) {
                    trackEvent('product_click', {
                        product_id: productCard.dataset.productId,
                        source: window.location.pathname
                    });
                }
            }
        });
    }
    
    /**
     * Track a generic event
     * @param {string} eventName - Name of the event
     * @param {Object} eventData - Additional data for the event
     */
    function trackEvent(eventName, eventData = {}) {
        if (!isInitialized) {
            // Queue the event if not initialized
            eventQueue.push({ name: eventName, data: eventData });
            init(); // Try to initialize
            return;
        }
        
        // Add timestamp to event data
        const eventWithTimestamp = {
            ...eventData,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            event: eventName
        };
        
        // In debug mode, log to console
        if (DEBUG_MODE) {
            console.log('📊 Tracking:', eventName, eventWithTimestamp);
        }
        
        // Push to dataLayer (for Google Analytics or other tools)
        if (window.dataLayer) {
            window.dataLayer.push(eventWithTimestamp);
        }
        
        // If you have a custom analytics endpoint, you could send there as well
        // sendToAnalyticsAPI(eventName, eventWithTimestamp);
    }
    
    /**
     * Process queued events
     */
    function processQueue() {
        while (eventQueue.length > 0) {
            const event = eventQueue.shift();
            trackEvent(event.name, event.data);
        }
    }
    
    /**
     * Track page view
     */
    function trackPageView() {
        // Get page information
        const path = window.location.pathname;
        const title = document.title;
        const url = window.location.href;
        
        // Parse URL parameters for additional context
        const urlParams = new URLSearchParams(window.location.search);
        
        // Create page data object
        const pageData = {
            path,
            title,
            url,
            referrer: document.referrer || ''
        };
        
        // Add specific data based on page type
        if (path.includes('product.html')) {
            const productId = urlParams.get('id');
            if (productId) {
                pageData.product_id = productId;
                trackProductView(productId);
            }
        } else if (path.includes('category.html')) {
            const categoryId = urlParams.get('id');
            if (categoryId) {
                pageData.category_id = categoryId;
            }
        } else if (path.includes('search.html')) {
            const query = urlParams.get('query');
            if (query) {
                pageData.search_query = query;
            }
        }
        
        // Track the page view
        trackEvent('page_view', pageData);
    }
    
    /**
     * Track product view
     * @param {string} productId - Product ID
     */
    function trackProductView(productId) {
        if (!productId) return;
        
        // Get product details
        API.getProductById(productId).then(product => {
            if (product) {
                trackEvent('product_view', {
                    product_id: product.id,
                    product_name: product.name,
                    product_price: product.price,
                    product_category: product.category1Name || ''
                });
            }
        }).catch(error => {
            console.error('Error tracking product view:', error);
        });
    }
    
    /**
     * Track product impression (viewed in a list)
     * @param {Array} products - List of products
     * @param {string} listName - Name of the list (e.g., "search results", "category products")
     */
    function trackProductImpressions(products, listName) {
        if (!Array.isArray(products) || products.length === 0) return;
        
        trackEvent('product_impressions', {
            list_name: listName,
            products: products.map(product => ({
                product_id: product.id,
                product_name: product.name,
                product_price: product.price,
                position: products.indexOf(product) + 1
            }))
        });
    }
    
    /**
     * Track search results
     * @param {string} query - Search query
     * @param {Array} results - Search results
     * @param {number} resultsCount - Total results count
     */
    function trackSearch(query, results, resultsCount) {
        trackEvent('search', {
            search_term: query,
            results_count: resultsCount
        });
        
        if (Array.isArray(results) && results.length > 0) {
            trackProductImpressions(results, 'search results');
        }
    }
    
    /**
     * Track add to cart
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity added
     * @param {number} price - Product price
     */
    function trackAddToCart(productId, quantity, price) {
        trackEvent('add_to_cart', {
            product_id: productId,
            quantity: quantity,
            price: price
        });
    }
    
    /**
     * Track cart view
     * @param {Array} cartItems - Items in cart
     * @param {number} cartTotal - Cart total
     */
    function trackCartView(cartItems, cartTotal) {
        if (!Array.isArray(cartItems)) return;
        
        trackEvent('cart_view', {
            items_count: cartItems.length,
            item_ids: cartItems.map(item => item.id).join(','),
            cart_total: cartTotal
        });
    }
    
    /**
     * Track checkout step
     * @param {number} step - Checkout step number
     * @param {Object} data - Additional checkout data
     */
    function trackCheckoutStep(step, data = {}) {
        trackEvent('checkout_step', {
            step: step,
            ...data
        });
    }
    
    /**
     * Track purchase
     * @param {string} orderId - Order ID
     * @param {number} total - Order total
     * @param {Array} items - Order items
     */
    function trackPurchase(orderId, total, items) {
        trackEvent('purchase', {
            transaction_id: orderId,
            value: total,
            items: items
        });
    }
    
    // Initialize when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        trackEvent,
        trackProductView,
        trackProductImpressions,
        trackSearch,
        trackAddToCart,
        trackCartView,
        trackCheckoutStep,
        trackPurchase
    };
})(); 