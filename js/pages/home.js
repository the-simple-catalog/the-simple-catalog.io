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

        // Icon mapping: Maps category names to emoji icons for visual enhancement
        // These icons appear above category names in the category cards
        // Fallback icon (📦) is used in renderCategoryCard for unmapped categories
        const categoryIcons = {
            'Book': '📚',        // Books category
            'Electronics': '💻',  // Electronics category
            'Fashion': '👕',      // Fashion/Clothing category
            'Home': '🏠',         // Home & Living category
            'Sports': '⚽',       // Sports & Outdoors category
            'Toys': '🎮',         // Toys & Games category
            'Beauty': '💄',       // Beauty & Personal Care category
            'Food': '🍕'          // Food & Beverages category
        };

        // Render homepage with hero banner and icon-enhanced category cards
        // Structure:
        // 1. Hero Banner - Large gradient banner with CTA button
        // 2. Category Grid - Grid of clickable category cards with icons
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

                <!-- Categories Section: Grid of clickable category cards -->
                <h2 class="category-section-title">Shop by Category</h2>
                <div class="category-list">
                    ${rootCategories.map(category => {
                        // Get icon for this category, use fallback (📦) if not mapped
                        const icon = categoryIcons[category.content.name] || '📦';
                        // Render category card with icon and name
                        return HomePage.renderCategoryCard(category, icon);
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single category card with icon
     * Creates a clickable card that displays:
     * - Large emoji icon at the top (48px)
     * - Category name below the icon
     *
     * @param {Object} category - Category object from CatalogManager
     * @param {string} icon - Emoji icon to display (e.g., '📚', '💻', '📦')
     * @returns {string} HTML string for the category card
     *
     * Card Structure:
     * ┌─────────────┐
     * │     📚      │  <- Icon (48px emoji)
     * │    Books    │  <- Category name
     * └─────────────┘
     */
    renderCategoryCard(category, icon) {
        return `
            <a href="#/category/${category.id}" class="category-card">
                <!-- Emoji icon displayed at 48px -->
                <div class="category-card-icon">${icon}</div>
                <!-- Category name (escaped for security) -->
                <div class="category-name">${escapeHtml(category.content.name)}</div>
            </a>
        `;
    }
};
