// ===================================
// Main Application Entry Point
// ===================================

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('E-Commerce Demo App Starting...');

    // Load site settings
    loadSiteSettings();

    // Register all routes
    registerRoutes();

    // Initialize router
    Router.init();

    // Update cart count in header
    updateCartCount();

    // Load main navigation
    loadMainNavigation();

    console.log('App initialized successfully');
});

/**
 * Load site settings from localStorage
 */
function loadSiteSettings() {
    const settings = Settings.get();

    // Update site name in header
    const siteNameEl = getEl('site-name');
    if (siteNameEl && settings.siteName) {
        siteNameEl.textContent = settings.siteName;
    }
}

/**
 * Register all application routes
 */
function registerRoutes() {
    // Homepage
    Router.register('/', (params) => HomePage.render(params));

    // Category page
    Router.register('/category/:categoryId', (params) => CategoryPage.render(params));

    // Product page
    Router.register('/product/:productId', (params) => ProductPage.render(params));

    // Search page
    Router.register('/search', (params) => SearchPage.render(params));

    // Cart page
    Router.register('/cart', (params) => CartPage.render(params));

    // Checkout page
    Router.register('/checkout', (params) => CheckoutPage.render(params));

    // Order confirmation page
    Router.register('/order-confirmation', (params) => OrderConfirmationPage.render(params));

    // Admin page
    Router.register('/admin', (params) => AdminPage.render(params));
}

/**
 * Load main navigation menu with root categories
 */
function loadMainNavigation() {
    const navEl = getEl('main-nav');
    if (!navEl) return;

    const categories = CatalogManager.getRootCategories();

    if (categories.length === 0) {
        navEl.innerHTML = '<span style="color: rgba(255,255,255,0.6);">No categories loaded</span>';
        return;
    }

    navEl.innerHTML = '';
    categories.forEach(category => {
        const link = createElement('a', {
            href: `#/category/${category.id}`
        }, escapeHtml(category.content.name));

        navEl.appendChild(link);
    });
}

/**
 * Update cart count badge in header
 */
function updateCartCount() {
    const cartCountEl = getEl('cart-count');
    if (cartCountEl) {
        const count = Cart.getItemCount();
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Make updateCartCount available globally for cart operations
window.updateCartCount = updateCartCount;

// Make loadMainNavigation available globally for catalog updates
window.loadMainNavigation = loadMainNavigation;
