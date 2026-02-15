// ===================================
// Cart Page - Shopping cart summary
// ===================================

import { getEl, escapeHtml, formatPrice } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';

class CartPage {
    /**
     * Render cart page
     */
    static render() {
        // Track page view
        const pageType = Tracking.PAGE_TYPES.CART;
        Tracking.trackPageView(Tracking.getPageId(pageType), pageType);

        const app = getEl('app');
        const items = Cart.getItemsWithDetails();
        const totals = Cart.getTotal();

        if (items.length === 0) {
            app.innerHTML = `
                <div class="container fade-in">
                    <div class="page-header">
                        <div class="breadcrumb">
                            <a href="#/">Home</a>
                            <span class="breadcrumb-separator">/</span>
                            <span>Cart</span>
                        </div>
                        <h1 class="page-title">Shopping Cart</h1>
                    </div>

                    <div class="message message-info">
                        Your cart is empty
                    </div>

                    <a href="#/" class="btn btn-primary" style="margin-top: 16px;">
                        Continue Shopping
                    </a>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    <div class="breadcrumb">
                        <a href="#/">Home</a>
                        <span class="breadcrumb-separator">/</span>
                        <span>Cart</span>
                    </div>
                    <h1 class="page-title">Shopping Cart</h1>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px;">
                    <!-- Left: Cart Items -->
                    <div>
                        <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg);">
                            <h2 style="font-size: 20px; margin-bottom: 16px;">Cart Items (${items.length})</h2>
                            ${items.map(item => CartPage.renderCartItem(item)).join('')}
                        </div>
                    </div>

                    <!-- Right: Cart Summary -->
                    <div>
                        <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg); position: sticky; top: 100px;">
                            <h2 style="font-size: 20px; margin-bottom: 16px;">Cart Summary</h2>

                            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>Subtotal (${items.length} items)</span>
                                    <strong>${formatPrice(totals.subtotal)}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--text-secondary); font-size: 14px;">
                                    <span>Shipping</span>
                                    <span>FREE</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 14px;">
                                    <span>Tax</span>
                                    <span>${formatPrice(totals.tax)}</span>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; margin-bottom: 24px;">
                                <span>Total</span>
                                <span>${formatPrice(totals.total)}</span>
                            </div>

                            <a
                                href="#/checkout"
                                class="btn btn-primary btn-full"
                                style="padding: 14px; text-align: center; text-decoration: none; display: block;"
                            >
                                Proceed to Checkout
                            </a>

                            <a
                                href="#/"
                                class="btn btn-secondary btn-full"
                                style="padding: 14px; text-align: center; text-decoration: none; display: block; margin-top: 12px;"
                            >
                                Continue Shopping
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a single cart item
     */
    static renderCartItem(item) {
        const product = item.product;
        const brand = CatalogManager.getProductBrand(product);

        return `
            <div style="display: grid; grid-template-columns: 80px 1fr auto auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--border-color);">
                <img
                    src="${escapeHtml(product.content.imageUrl || '')}"
                    alt="${escapeHtml(product.content.name)}"
                    style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2210%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                />
                <div>
                    ${brand ? `<div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(brand)}</div>` : ''}
                    <div style="font-weight: 500;">${escapeHtml(product.content.name)}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                        ${formatPrice(item.price)} each
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button
                        onclick="CartPage.updateQuantity('${product.id}', ${item.quantity - 1})"
                        class="btn btn-secondary"
                        style="padding: 4px 12px;"
                    >-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button
                        onclick="CartPage.updateQuantity('${product.id}', ${item.quantity + 1})"
                        class="btn btn-secondary"
                        style="padding: 4px 12px;"
                    >+</button>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; margin-bottom: 8px;">
                        ${formatPrice(item.subtotal)}
                    </div>
                    <button
                        onclick="CartPage.removeItem('${product.id}')"
                        style="color: var(--error-color); font-size: 12px; text-decoration: underline; background: none; border: none; cursor: pointer;"
                    >Remove</button>
                </div>
            </div>
        `;
    }

    /**
     * Update item quantity
     */
    static updateQuantity(productId, newQuantity) {
        Cart.updateQuantity(productId, newQuantity);
        CartPage.render(); // Re-render page
    }

    /**
     * Remove item from cart
     */
    static removeItem(productId) {
        Cart.removeItem(productId);
        CartPage.render(); // Re-render page
    }
}
export { CartPage };
