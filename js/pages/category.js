// ===================================
// Category Page - Display subcategories and products
// ===================================

const CategoryPage = {
    /**
     * Render category page
     */
    render(params) {
        const categoryId = params.categoryId;
        const category = CatalogManager.getCategoryById(categoryId);

        if (!category) {
            this.renderNotFound(categoryId);
            return;
        }

        // Track page view
        Tracking.trackPageView(PAGE_IDS.CATEGORY, PAGE_TYPES.CATEGORY, {
            categoryId,
            categoryName: category.content.name
        });

        // Track category view
        Tracking.trackCategoryView(categoryId);

        // Request sponsored products
        Tracking.requestSponsoredProducts(PAGE_IDS.CATEGORY, PAGE_TYPES.CATEGORY, {
            categoryId
        });

        const app = getEl('app');
        const breadcrumb = CatalogManager.getCategoryPath(categoryId);
        const childCategories = CatalogManager.getChildCategories(categoryId);
        const products = CatalogManager.getProductsByCategory(categoryId);

        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    ${CategoryPage.renderBreadcrumb(breadcrumb)}
                    <h1 class="page-title">${escapeHtml(category.content.name)}</h1>
                </div>

                ${childCategories.length > 0 ? CategoryPage.renderSubcategories(childCategories) : ''}

                ${products.length > 0 ? CategoryPage.renderProducts(products) : CategoryPage.renderNoProducts()}

                ${CategoryPage.renderSponsoredSection()}
            </div>
        `;
    },

    /**
     * Render breadcrumb navigation
     */
    renderBreadcrumb(path) {
        if (path.length === 0) return '';

        const breadcrumbHtml = [
            '<a href="#/">Home</a>',
            ...path.map(cat => `<a href="#/category/${cat.id}">${escapeHtml(cat.content.name)}</a>`)
        ].join('<span class="breadcrumb-separator">/</span>');

        return `<div class="breadcrumb">${breadcrumbHtml}</div>`;
    },

    /**
     * Render subcategories section with product images
     */
    renderSubcategories(categories) {
        return `
            <div style="margin-bottom: 32px;">
                <h2 style="font-size: 20px; margin-bottom: 16px;">Subcategories</h2>
                <div class="category-list">
                    ${categories.map(cat => {
                        const imageUrl = CatalogManager.getCategoryIconImage(cat);
                        return `
                            <a href="#/category/${cat.id}" class="category-card">
                                <img
                                    src="${escapeHtml(imageUrl)}"
                                    alt="${escapeHtml(cat.content.name)}"
                                    class="category-card-icon"
                                />
                                <div class="category-name">${escapeHtml(cat.content.name)}</div>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render products grid
     */
    renderProducts(products) {
        return `
            <div>
                <h2 style="font-size: 20px; margin-bottom: 16px;">Products</h2>
                <div class="product-grid">
                    ${products.map(product => CategoryPage.renderProductCard(product)).join('')}
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
                        onclick="CategoryPage.addToCart('${product.id}')"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render no products message
     */
    renderNoProducts() {
        return `
            <div class="message message-info">
                No products found in this category.
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
     * Render not found page
     */
    renderNotFound(categoryId) {
        const app = getEl('app');
        app.innerHTML = `
            <div class="container fade-in">
                <div class="message message-error">
                    Category not found: ${escapeHtml(categoryId)}
                </div>
                <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
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
