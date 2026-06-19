// ===================================
// Checkout Page — Marketplace layout
// ===================================
//
// 2-col: shipping + payment forms (left) · sticky order summary (right).

import { getEl, escapeHtml, formatPrice, navigateTo } from '../utils.js';
import { Settings } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
import { Debug } from '../debug.js';

class CheckoutPage {
    static render() {
        Debug.setPage({
            type: 'checkout',
            id: Tracking.getPageId(Tracking.PAGE_TYPES.PAYMENT),
            path: location.hash
        });

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
                            <span>Checkout</span>
                        </div>
                        <h1 class="section-title">Checkout</h1>
                        <div class="empty">
                            <h3>Your cart is empty</h3>
                            <p>Add something to your cart before checking out.</p>
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
                        <a href="#/cart">Cart</a>
                        <span class="sep">/</span>
                        <span>Checkout</span>
                    </div>
                    <h1 class="section-title">Checkout</h1>

                    <div class="checkout-grid">
                        <div>
                            <section class="checkout-step">
                                <h2>Shipping Address</h2>
                                <form id="shipping-form">
                                    <div class="form-group">
                                        <label class="form-label">Full Name</label>
                                        <input type="text" class="form-input" id="ship-name" value="John Doe" required />
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Address</label>
                                        <input type="text" class="form-input" id="ship-address" value="123 Main Street" required />
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">City</label>
                                            <input type="text" class="form-input" id="ship-city" value="Paris" required />
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Postal Code</label>
                                            <input type="text" class="form-input" id="ship-postal" value="75001" required />
                                        </div>
                                    </div>
                                </form>
                            </section>

                            <section class="checkout-step">
                                <h2>Payment Information</h2>
                                <form id="payment-form">
                                    <div class="form-group">
                                        <label class="form-label">Card Number</label>
                                        <input type="text" class="form-input" id="card-number" value="4111111111111111" placeholder="1234 5678 9012 3456" required />
                                        <small style="font-size: 12px; color: var(--text-3);">Test card: 4111-1111-1111-1111</small>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Expiry Date</label>
                                            <input type="text" class="form-input" id="card-expiry" value="12/28" placeholder="MM/YY" required />
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">CVV</label>
                                            <input type="text" class="form-input" id="card-cvv" value="123" placeholder="123" required />
                                        </div>
                                    </div>
                                </form>
                            </section>
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
                                <button type="button" class="btn btn-primary btn-full" onclick="CheckoutPage.placeOrder()">
                                    Place Order
                                </button>
                                <a href="#/cart" class="btn btn-outline btn-full">Edit Cart</a>
                            </div>
                            <div id="checkout-message" style="margin-top: 12px;"></div>
                        </aside>
                    </div>
                </div>
            </div>
        `;
    }

    static placeOrder() {
        const messageDiv = getEl('checkout-message');
        const shippingForm = getEl('shipping-form');
        const paymentForm = getEl('payment-form');

        if (!shippingForm.checkValidity()) {
            shippingForm.reportValidity();
            return;
        }
        if (!paymentForm.checkValidity()) {
            paymentForm.reportValidity();
            return;
        }

        messageDiv.innerHTML = '<div class="loading">Processing order...</div>';

        // Mock 1.5s payment latency, then 1.5s success-banner pause for UX feel.
        setTimeout(() => {
            const orderId = Settings.get().orderPrefix + Date.now();
            messageDiv.innerHTML = `
                <div class="message message-success">
                    <strong>Order Placed Successfully!</strong>
                    <p style="margin-top: 8px; font-size: 14px;">Order ID: ${escapeHtml(orderId)}</p>
                </div>
            `;
            setTimeout(() => {
                // Hand off the order to OrderConfirmationPage via sessionStorage —
                // survives the navigation but is naturally scoped to this tab/session.
                sessionStorage.setItem('lastOrder', JSON.stringify({
                    orderId,
                    items: Cart.getItemsWithDetails(),
                    total: Cart.getTotal().total,
                    timestamp: new Date().toISOString()
                }));
                Cart.clear();
                navigateTo('/order-confirmation');
            }, 1500);
        }, 1500);
    }
}

export { CheckoutPage };
