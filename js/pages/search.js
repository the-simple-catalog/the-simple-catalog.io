// ===================================
// Search Page - Product search functionality
// ===================================

const SearchPage = {
    /**
     * Render search page
     * This page displays search results only. The search input is in the header.
     * Tracks all search queries for analytics purposes.
     */
    render(params) {
        const query = params.q || '';

        // Track page view
        Tracking.trackPageView(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
            searchQuery: query
        });

        // Log search query for analytics if query exists
        if (query) {
            this.logSearchQuery(query);
        }

        // Request sponsored products if there's a search query
        if (query.length >= 3) {
            Tracking.requestSponsoredProducts(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
                searchQuery: query
            });
        }

        const app = getEl('app');

        // Render results only - no search input on this page
        // Users search from the header search bar
        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    <div class="breadcrumb">
                        <a href="#/">Home</a>
                        <span class="breadcrumb-separator">/</span>
                        <span>Search Results</span>
                    </div>
                    ${query ? `<h1 class="page-title">Search Results for "${escapeHtml(query)}"</h1>` : '<h1 class="page-title">Search</h1>'}
                </div>

                <div id="search-results">
                    ${this.renderSearchResults(query)}
                </div>

                ${query.length >= 3 ? this.renderSponsoredSection() : ''}
            </div>
        `;
    },

    /**
     * Log search query for analytics
     * Stores search history in localStorage with timestamp and result count
     */
    logSearchQuery(query) {
        // Get search results count
        const products = CatalogManager.searchProducts(query);
        const resultCount = products.length;

        // Extract product IDs for tracking
        const productIds = products.map(p => p.id);

        // Track search view
        Tracking.trackSearchView(query, productIds);

        // Create search log entry
        const searchEntry = {
            timestamp: new Date().toISOString(),
            query: query,
            resultCount: resultCount
        };

        // Log to console
        console.log('[Search Tracking]', searchEntry);

        // Store in localStorage
        try {
            const searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
            searchHistory.push(searchEntry);

            // Keep only last 100 searches
            if (searchHistory.length > 100) {
                searchHistory.shift();
            }

            localStorage.setItem('search_history', JSON.stringify(searchHistory));
        } catch (e) {
            console.error('Failed to store search history:', e);
        }
    },

    /**
     * Render search results
     */
    renderSearchResults(query) {
        if (!query) {
            return `
                <div class="message message-info">
                    Use the search bar in the header to find products
                </div>
            `;
        }

        if (query.length < 3) {
            return `
                <div class="message message-info">
                    Please enter at least 3 characters to search
                </div>
            `;
        }

        const products = CatalogManager.searchProducts(query);

        if (products.length === 0) {
            return `
                <div class="message message-info">
                    No products found for "${escapeHtml(query)}"
                </div>
            `;
        }

        return `
            <div>
                <h2 style="font-size: 20px; margin-bottom: 16px;">
                    Found ${products.length} product${products.length !== 1 ? 's' : ''} for "${escapeHtml(query)}"
                </h2>
                <div class="product-grid">
                    ${products.map(product => this.renderProductCard(product)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single product card
     */
    renderProductCard(product) {
        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);

        return `
            <div class="product-card">
                <a href="#/product/${product.id}">
                    <img
                        src="${escapeHtml(product.content.imageUrl || '')}"
                        alt="${escapeHtml(product.content.name)}"
                        class="product-card-image"
                        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22250%22 height=%22250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                    />
                </a>
                <div class="product-card-content">
                    ${brand ? `<div class="product-brand">${escapeHtml(brand)}</div>` : ''}
                    <a href="#/product/${product.id}">
                        <div class="product-name">${escapeHtml(product.content.name)}</div>
                    </a>
                    <div class="product-price ${price.hasPromo ? 'product-price-promo' : ''}">
                        ${price.hasPromo ? `<span class="product-price-regular">${formatPrice(price.regular)}</span>` : ''}
                        ${formatPrice(price.hasPromo ? price.promo : price.regular)}
                    </div>
                    <button
                        class="btn btn-primary btn-full"
                        onclick="SearchPage.addToCart('${product.id}')"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render sponsored products section
     */
    renderSponsoredSection() {
        return `
            <div class="sponsored-section">
                <h2 class="sponsored-title">Sponsored Products</h2>
                <div class="sponsored-grid">
                    <div class="sponsored-placeholder">Ad Slot 1</div>
                    <div class="sponsored-placeholder">Ad Slot 2</div>
                    <div class="sponsored-placeholder">Ad Slot 3</div>
                    <div class="sponsored-placeholder">Ad Slot 4</div>
                </div>
            </div>
        `;
    },


    /**
     * Add product to cart
     */
    addToCart(productId) {
        const success = Cart.addItem(productId, 1);
        if (success) {
            showMessage('Product added to cart!', 'success');
        } else {
            showMessage('Error adding product to cart', 'error');
        }
    }
};
