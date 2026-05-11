// ===================================
// Cart Page — Marketplace layout
// ===================================
//
// Layout: 2-column (cart-list + sticky summary), classic dense marketplace.

import { getEl, escapeHtml, formatPrice, getSeller, PLACEHOLDER_SVG } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

class CartPage {
    static render() {
        const pageType = Tracking.PAGE_TYPES.CART;
        const pageId = Tracking.getPageId(pageType);
        Debug.setPage({ type: 'cart', id: pageId, path: location.hash });
        Tracking.trackPageView(pageId, pageType);

        const app = getEl('app');
        const items = Cart.getItemsWithDetails();
        const totals = Cart.getTotal();

        if (items.length === 0) {
            app.innerHTML = `
                <div class="page page-pad fade-in">
                    <div class="container">
                        <div class="crumbs">
                            <a href="#/">Home</a>
                            <span class="sep">/</span>
                            <span>Cart</span>
                        </div>
                        <h1 class="section-title">Shopping Cart</h1>
                        <div class="empty">
                            <h3>Your cart is empty</h3>
                            <p>Browse departments to find something you'll love.</p>
                        </div>
                        <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Continue Shopping</a>
                    </div>
                </div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    <div class="crumbs">
                        <a href="#/">Home</a>
                        <span class="sep">/</span>
                        <span>Cart</span>
                    </div>
                    <h1 class="section-title">Shopping Cart (${items.length} ${items.length === 1 ? 'item' : 'items'})</h1>

                    <div class="cart-grid">
                        <div class="cart-list">
                            ${items.map(item => CartPage.#renderCartItem(item)).join('')}
                        </div>

                        <aside class="summary">
                            <h3>Order Summary</h3>
                            <div class="summary-row">
                                <span>Subtotal (${items.length} items)</span>
                                <strong>${escapeHtml(formatPrice(totals.subtotal))}</strong>
                            </div>
                            <div class="summary-row">
                                <span>Shipping</span>
                                <span>FREE</span>
                            </div>
                            <div class="summary-row">
                                <span>Tax</span>
                                <span>${escapeHtml(formatPrice(totals.tax))}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total</span>
                                <span>${escapeHtml(formatPrice(totals.total))}</span>
                            </div>
                            <div class="summary-actions">
                                <a href="#/checkout" class="btn btn-primary btn-full">Proceed to Checkout</a>
                                <a href="#/" class="btn btn-outline btn-full">Continue Shopping</a>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        `;

        CartPage.#wireActions();
    }

    /**
     * Single delegated click handler on the cart list. Reads productId from
     * data-cart-id (set at render time, properly escaped) instead of inlining
     * it into an onclick="…" attribute — closes the XSS vector that existed
     * when the catalog id contained quote characters.
     */
    static #wireActions() {
        const list = document.querySelector('.cart-list');
        if (!list) return;
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-cart-action]');
            if (!btn) return;
            const action = btn.dataset.cartAction;
            const id = btn.dataset.cartId;
            if (!id) return;
            if (action === 'remove') {
                CartPage.removeItem(id);
                return;
            }
            const current = Cart.getItems().find(i => i.productId === id);
            if (!current) return;
            const next = current.quantity + (action === 'inc' ? 1 : -1);
            CartPage.updateQuantity(id, next);
        });
    }

    static #renderCartItem(item) {
        const product = item.product;
        const id = product.id;
        const name = product.content?.name || id;
        const brand = CatalogManager.getProductBrand(product);
        const seller = getSeller(product);
        const image = product.content?.imageUrl
            || `https://placehold.co/200x200?text=${encodeURIComponent(id)}`;
        return `
            <div class="cart-row">
                <a class="cart-thumb" href="#/product/${escapeHtml(id)}">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_SVG}'" />
                </a>
                <div>
                    <a class="cart-name" href="#/product/${escapeHtml(id)}">${escapeHtml(name)}</a>
                    <div class="cart-meta">
                        ${brand ? `${escapeHtml(brand)} · ` : ''}
                        ${escapeHtml(formatPrice(item.price))} each
                    </div>
                    ${seller === '3P' ? `
                        <div class="mp-chip mp-chip-sm">
                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M3 9l1-5h16l1 5"></path>
                                <path d="M5 9v11h14V9"></path>
                                <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"></path>
                            </svg>
                            Marketplace
                        </div>
                    ` : ''}
                    <div class="cart-actions">
                        <div class="cart-qty-stepper">
                            <button type="button" data-cart-action="dec" data-cart-id="${escapeHtml(id)}">−</button>
                            <span class="qty">${item.quantity}</span>
                            <button type="button" data-cart-action="inc" data-cart-id="${escapeHtml(id)}">+</button>
                        </div>
                        <button type="button" data-cart-action="remove" data-cart-id="${escapeHtml(id)}">Remove</button>
                    </div>
                </div>
                <div class="cart-row-price">${escapeHtml(formatPrice(item.subtotal))}</div>
            </div>
        `;
    }

    // Full re-render on every cart mutation — fine at this scale (max ~20 lines)
    // and keeps the totals/summary card in sync without per-cell DOM patching.
    static updateQuantity(productId, newQuantity) {
        Cart.updateQuantity(productId, newQuantity);
        CartPage.render();
    }

    static removeItem(productId) {
        Cart.removeItem(productId);
        CartPage.render();
    }
}

export { CartPage };
