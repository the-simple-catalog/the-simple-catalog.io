// ===================================
// Homepage - Display root categories
// ===================================

const HomePage = {
    /**
     * Render homepage
     */
    render() {
        // Track page view
        Tracking.trackPageView(PAGE_IDS.HOMEPAGE, PAGE_TYPES.HOMEPAGE);

        const app = getEl('app');
        const rootCategories = CatalogManager.getRootCategories();

        if (rootCategories.length === 0) {
            app.innerHTML = `
                <div class="container fade-in">
                    <div class="page-header">
                        <h1 class="page-title">Welcome to ${escapeHtml(Settings.getSetting('siteName'))}</h1>
                    </div>

                    <div class="message message-info">
                        <p><strong>No catalog data loaded yet.</strong></p>
                        <p>Please go to the <a href="#/admin" style="text-decoration: underline;">Admin page</a> to import your categories and products.</p>
                    </div>

                    <a href="#/admin" class="btn btn-primary" style="margin-top: 16px;">
                        Go to Admin
                    </a>
                </div>
            `;
            return;
        }

        // Render homepage with hero banner and category cards with product images
        // Structure:
        // 1. Hero Banner - Large gradient banner with CTA button
        // 2. Category Grid - Grid of clickable category cards with product images as icons
        app.innerHTML = `
            <div class="container fade-in">
                <!-- Hero Banner: Large visual banner with gradient background and decorative circles -->
                <!-- Provides visual impact and main call-to-action for the homepage -->
                <div class="hero-banner">
                    <div class="hero-content">
                        <!-- Site name as main heading -->
                        <h1 class="hero-title">Welcome to ${escapeHtml(Settings.getSetting('siteName'))}</h1>

                        <!-- Subtitle describing the site's value proposition -->
                        <p class="hero-subtitle">Discover amazing products across all categories</p>

                        <!-- Call-to-action button linking to search page -->
                        <a href="#/search" class="hero-cta">
                            Shop Now
                            <!-- Right arrow icon for visual indication -->
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Features Section: 4 feature blocks highlighting key benefits -->
                <section class="features-section">
                    <div class="features-grid">
                        <div class="features-item teal">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="1" y="3" width="15" height="13"></rect>
                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                </svg>
                            </div>
                            <div class="feature-text">
                                <h3>Free Shipping</h3>
                                <p>On orders over $50</p>
                            </div>
                        </div>

                        <div class="features-item green">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                </svg>
                            </div>
                            <div class="feature-text">
                                <h3>24/7 Support</h3>
                                <p>Always here to help</p>
                            </div>
                        </div>

                        <div class="features-item orange">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <path d="M9 12l2 2 4-4"></path>
                                </svg>
                            </div>
                            <div class="feature-text">
                                <h3>Secure Payment</h3>
                                <p>100% protected</p>
                            </div>
                        </div>

                        <div class="features-item cyan">
                            <div class="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                </svg>
                            </div>
                            <div class="feature-text">
                                <h3>Daily Offers</h3>
                                <p>Up to 70% off</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Categories Section: Grid of clickable category cards -->
                <h2 class="category-section-title">Shop by Category</h2>
                <div class="category-list">
                    ${rootCategories.map(category => {
                        // Get product image for this category using search algorithm
                        // Falls back to placeholder if no matching product found
                        const imageUrl = CatalogManager.getCategoryIconImage(category);
                        // Render category card with product image
                        return HomePage.renderCategoryCard(category, imageUrl);
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single category card with product image
     * Creates a clickable card that displays:
     * - Product image at the top (representative of the category)
     * - Category name below the image
     *
     * @param {Object} category - Category object from CatalogManager
     * @param {string} imageUrl - Product image URL or placeholder URL
     * @returns {string} HTML string for the category card
     *
     * Card Structure:
     * ┌─────────────┐
     * │  [Product]  │  <- Product image
     * │   Image     │
     * │    Books    │  <- Category name
     * └─────────────┘
     */
    renderCategoryCard(category, imageUrl) {
        return `
            <a href="#/category/${category.id}" class="category-card">
                <!-- Product image as category icon -->
                <img
                    src="${escapeHtml(imageUrl)}"
                    alt="${escapeHtml(category.content.name)}"
                    class="category-card-icon"
                />
                <!-- Category name (escaped for security) -->
                <div class="category-name">${escapeHtml(category.content.name)}</div>
            </a>
        `;
    }
};
