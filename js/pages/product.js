// ===================================
// Product Detail Page
// ===================================

import { getEl, escapeHtml, formatPrice, showMessage, generateProductBadges } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';

class ProductPage {
    /**
     * Render product page
     */
    static render(params) {
        const productId = params.productId;
        const product = CatalogManager.getProductById(productId);

        if (!product) {
            ProductPage.renderNotFound(productId);
            return;
        }

        const pageType = Tracking.PAGE_TYPES.PRODUCT;

        // Track page view
        Tracking.trackPageView(Tracking.getPageId(pageType), pageType, {
            productId,
            productName: product.content.name,
        });

        // Track product view
        Tracking.trackProductView(productId);

        // Request sponsored products
        const sponsoredAdsPromise = Tracking.requestSponsoredProducts(
            Tracking.getPageId(pageType), pageType, { productId }
        );

        const app = getEl('app');
        const brand = CatalogManager.getProductBrand(product);
        const price = CatalogManager.getProductPrice(product);
        const badges = generateProductBadges(product, false);

        // Get category for breadcrumb
        const categoryId = product.content.categories?.[0];
        let breadcrumb = [];
        if (categoryId) {
            breadcrumb = CatalogManager.getCategoryPath(categoryId);
        }

        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    ${ProductPage.renderBreadcrumb(breadcrumb, product)}
                </div>

                <div class="product-detail-grid">
                    <div class="product-detail-image-container">
                        ${badges}
                        <img
                            src="${escapeHtml(product.content.imageUrl || '')}"
                            alt="${escapeHtml(product.content.name)}"
                            class="product-detail-image"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22600%22 height=%22600%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        />
                    </div>

                    <div>
                        <h1 class="product-detail-title">
                            ${escapeHtml(product.content.name)}
                        </h1>

                        <div class="product-status-row">
                            ${product.content.stockQuantity ? `
                                <div class="product-stock-status">
                                    <svg class="stock-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"/>
                                    </svg>
                                    <span>In Stock</span>
                                </div>
                            ` : ''}
                            ${price.hasPromo ? `
                                <div class="product-sale-status">
                                    <svg class="sale-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                                        <path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/>
                                    </svg>
                                    <span>Sale</span>
                                </div>
                            ` : ''}
                            ${product.content.partyTypes === '3P' ? `
                                <div class="product-marketplace-status">
                                    <svg class="marketplace-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                                    </svg>
                                    <span>Marketplace</span>
                                </div>
                            ` : ''}
                        </div>

                        <div class="product-detail-price">
                            ${price.hasPromo ? `<span class="original-price">${formatPrice(price.regular)}</span>` : ''}
                            ${formatPrice(price.hasPromo ? price.promo : price.regular)}
                        </div>

                        <div class="product-metadata">
                            <div class="product-metadata-group product-metadata-technical">
                                <div class="product-metadata-item">
                                    <span class="label">ID:</span>
                                    <span class="value">${escapeHtml(product.id)}</span>
                                </div>
                                <div class="product-metadata-item">
                                    <span class="label">SKU:</span>
                                    <span class="value">${escapeHtml(product.content.sku || 'N/A')}</span>
                                </div>
                            </div>

                            ${(categoryId || brand) ? `
                            <div class="product-metadata-group product-metadata-descriptive">
                                ${categoryId ? `
                                <div class="product-metadata-item">
                                    <span class="label">Category:</span>
                                    <span class="value">${escapeHtml(breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].content.name : 'General')}</span>
                                </div>
                                ` : ''}
                                ${brand ? `
                                <div class="product-metadata-item">
                                    <span class="label">Brand:</span>
                                    <span class="value">${escapeHtml(brand)}</span>
                                </div>
                                ` : ''}
                            </div>
                            ` : ''}
                        </div>

                        <div class="quantity-selector">
                            <label>Quantity:</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <div class="quantity-controls">
                                    <button class="quantity-btn quantity-decrease" onclick="ProductPage.decreaseQuantity()">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 13H5v-2h14v2z"/>
                                        </svg>
                                    </button>
                                    <input type="text"
                                           id="product-quantity"
                                           value="1"
                                           readonly
                                           class="quantity-input">
                                    <button class="quantity-btn quantity-increase" onclick="ProductPage.increaseQuantity()">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    class="btn btn-primary"
                                    onclick="ProductPage.addToCart('${product.id}')"
                                    style="flex: 1;"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>

                        ${product.content.longDescription ? `
                            <div class="product-detail-description">
                                <h2 style="font-size: 20px; margin-bottom: 12px;">Description</h2>
                                <p style="color: var(--text-secondary); line-height: 1.6;">
                                    ${escapeHtml(product.content.longDescription)}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div id="sponsored-container">
                    ${Tracking.renderEmptySponsoredSection()}
                </div>

                <div id="media-sponsored-container">
                    ${Tracking.renderEmptyMediaSection()}
                </div>
            </div>
        `;

        // Populate both sponsored product and media display containers when ads load
        Tracking.populateAdsContainers(sponsoredAdsPromise);
    }

    /**
     * Render breadcrumb navigation
     */
    static renderBreadcrumb(path, product) {
        const breadcrumbParts = ['<a href="#/">Home</a>'];

        path.forEach(cat => {
            breadcrumbParts.push(
                `<a href="#/category/${cat.id}">${escapeHtml(cat.content.name)}</a>`
            );
        });

        breadcrumbParts.push(`<span>${escapeHtml(product.content.name)}</span>`);

        return `<div class="breadcrumb">${breadcrumbParts.join('<span class="breadcrumb-separator">/</span>')}</div>`;
    }

    /**
     * Render not found page
     */
    static renderNotFound(productId) {
        const app = getEl('app');
        app.innerHTML = `
            <div class="container fade-in">
                <div class="message message-error">
                    Product not found: ${escapeHtml(productId)}
                </div>
                <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
            </div>
        `;
    }

    /**
     * Increase quantity value in the quantity input
     */
    static increaseQuantity() {
        const input = getEl('product-quantity');
        if (!input) return;
        const currentQty = parseInt(input.value) || 1;
        if (currentQty < 99) {
            input.value = currentQty + 1;
        }
    }

    /**
     * Decrease quantity value in the quantity input
     */
    static decreaseQuantity() {
        const input = getEl('product-quantity');
        if (!input) return;
        const currentQty = parseInt(input.value) || 1;
        if (currentQty > 1) {
            input.value = currentQty - 1;
        }
    }

    /**
     * Add product to cart with quantity
     */
    static addToCart(productId) {
        const quantityInput = getEl('product-quantity');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        if (quantity < 1) {
            showMessage('Please enter a valid quantity', 'error');
            return;
        }

        const success = Cart.addItem(productId, quantity);
        if (success) {
            showMessage(`Added ${quantity} item(s) to cart!`, 'success');
        } else {
            showMessage('Error adding product to cart', 'error');
        }
    }
}
export { ProductPage };
