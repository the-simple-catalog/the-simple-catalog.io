// ===================================
// Order Confirmation Page — Marketplace layout
// ===================================

import { getEl, escapeHtml, formatPrice, PLACEHOLDER_SVG } from '../utils.js';
import { CatalogManager } from '../catalog.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

class OrderConfirmationPage {
    static render() {
        const pageType = Tracking.PAGE_TYPES.POST_PAYMENT;
        const pageId = Tracking.getPageId(pageType);
        Debug.setPage({ type: 'order', id: pageId, path: location.hash });
        Tracking.trackPageView(pageId, pageType);

        const app = getEl('app');
        // 'lastOrder' is set by CheckoutPage.placeOrder before navigating here.
        // Missing key = direct visit / refresh after order — show empty state.
        const lastOrderStr = sessionStorage.getItem('lastOrder');

        if (!lastOrderStr) {
            app.innerHTML = `
                <div class="page page-pad fade-in">
                    <div class="container">
                        <div class="crumbs">
                            <a href="#/">Home</a>
                            <span class="sep">/</span>
                            <span>Order confirmation</span>
                        </div>
                        <h1 class="section-title">Order Confirmation</h1>
                        <div class="empty">
                            <h3>No recent order found</h3>
                            <p>Place an order to see its confirmation here.</p>
                        </div>
                        <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
                    </div>
                </div>
            `;
            return;
        }

        const order = JSON.parse(lastOrderStr);
        const orderDate = new Date(order.timestamp);
        const dateFormatted = orderDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Track post-payment
        Tracking.trackPostPayment({
            orderId: order.orderId,
            total: order.total,
            items: order.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.subtotal / item.quantity
            }))
        });

        app.innerHTML = `
            <div class="page page-pad fade-in">
                <div class="container">
                    <div style="max-width: 800px; margin: 0 auto;">
                        <div class="oc-hero">
                            <div class="oc-check">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h1 class="oc-title">Order Confirmed!</h1>
                            <p class="oc-sub">Thank you for your purchase</p>
                        </div>

                        <section class="checkout-step">
                            <h2>Order Details</h2>
                            <dl class="oc-meta">
                                <div class="oc-meta-row">
                                    <dt>Order Number</dt>
                                    <dd><code>${escapeHtml(order.orderId)}</code></dd>
                                </div>
                                <div class="oc-meta-row">
                                    <dt>Order Date</dt>
                                    <dd>${escapeHtml(dateFormatted)}</dd>
                                </div>
                            </dl>

                            <h3 class="oc-items-title">Items Ordered (${order.items.length})</h3>
                            <div class="oc-items">
                                ${order.items.map(item => OrderConfirmationPage.#renderOrderItem(item)).join('')}
                            </div>

                            <div class="summary-row total" style="margin-top: 16px;">
                                <span>Total</span>
                                <span>${escapeHtml(formatPrice(order.total))}</span>
                            </div>
                        </section>

                        <section class="checkout-step">
                            <h2>What's next?</h2>
                            <ul class="oc-next">
                                <li><strong>Order confirmation email</strong> — you'll receive a confirmation shortly.</li>
                                <li><strong>Preparing your order</strong> — we're processing it and will ship it soon.</li>
                                <li><strong>Shipping updates</strong> — tracking information will follow once shipped.</li>
                            </ul>
                        </section>

                        <div style="text-align: center; margin-top: 8px;">
                            <a href="#/" class="btn btn-primary">Continue Shopping</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static #renderOrderItem(item) {
        const product = item.product;
        const id = product.id;
        const name = product.content?.name || id;
        const brand = CatalogManager.getProductBrand(product);
        const image = product.content?.imageUrl
            || `https://placehold.co/200x200?text=${encodeURIComponent(id)}`;
        return `
            <div class="cart-row">
                <div class="cart-thumb">
                    <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_SVG}'" />
                </div>
                <div>
                    ${brand ? `<div class="cart-meta">${escapeHtml(brand)}</div>` : ''}
                    <div class="cart-name">${escapeHtml(name)}</div>
                    <div class="cart-meta">Quantity: ${item.quantity}</div>
                </div>
                <div class="cart-row-price">${escapeHtml(formatPrice(item.subtotal))}</div>
            </div>
        `;
    }
}

export { OrderConfirmationPage };
