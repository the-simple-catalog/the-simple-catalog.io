// ===================================
// Search Page - Product search functionality
// ===================================

const SearchPage = {
    /**
     * Render search page
     */
    render(params) {
        const query = params.q || '';

        // Track page view
        Tracking.trackPageView(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
            searchQuery: query
        });

        // Request sponsored products if there's a search query
        if (query.length >= 3) {
            Tracking.requestSponsoredProducts(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
                searchQuery: query
            });
        }

        const app = getEl('app');

        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    <div class="breadcrumb">
                        <a href="#/">Home</a>
                        <span class="breadcrumb-separator">/</span>
                        <span>Search</span>
                    </div>
                    <h1 class="page-title">Search Products</h1>
                </div>

                <div style="margin-bottom: 32px;">
                    <div style="max-width: 600px;">
                        <div class="form-group">
                            <input
                                type="text"
                                id="search-input"
                                class="form-input"
                                placeholder="Search for products (minimum 3 characters)..."
                                value="${escapeHtml(query)}"
                                style="font-size: 16px; padding: 12px 16px;"
                            />
                        </div>
                    </div>
                </div>

                <div id="search-results">
                    ${this.renderSearchResults(query)}
                </div>

                ${query.length >= 3 ? this.renderSponsoredSection() : ''}
            </div>
        `;

        // Add event listener for search input
        const searchInput = getEl('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('input', debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
    },

    /**
     * Render search results
     */
    renderSearchResults(query) {
        if (!query) {
            return `
                <div class="message message-info">
                    Enter a search term to find products
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
     * Handle search input
     */
    handleSearch(query) {
        // Update URL with search query
        const newUrl = query ? `#/search?q=${encodeURIComponent(query)}` : '#/search';
        window.history.replaceState(null, '', newUrl);

        // Update search results
        const resultsDiv = getEl('search-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = this.renderSearchResults(query);
        }

        // Track and request sponsored products if query is valid
        if (query.length >= 3) {
            Tracking.trackPageView(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
                searchQuery: query
            });

            Tracking.requestSponsoredProducts(PAGE_IDS.SEARCH, PAGE_TYPES.SEARCH, {
                searchQuery: query
            });

            // Show/add sponsored section if not present
            const container = resultsDiv?.parentElement;
            if (container && !container.querySelector('.sponsored-section')) {
                const sponsoredHtml = this.renderSponsoredSection();
                container.insertAdjacentHTML('beforeend', sponsoredHtml);
            }
        } else {
            // Remove sponsored section if query is too short
            const sponsoredSection = document.querySelector('.sponsored-section');
            if (sponsoredSection) {
                sponsoredSection.remove();
            }
        }
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
