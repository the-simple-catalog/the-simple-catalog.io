// ===================================
// Checkout Page - Payment and shipping info
// ===================================

import { getEl, formatPrice, navigateTo } from '../utils.js';
import { Settings } from '../catalog.js';
import { Cart } from '../cart.js';

class CheckoutPage {
    /**
     * Render checkout page
     */
    static render() {
        // No tracking on checkout page (as per spec)

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
                            <span>Checkout</span>
                        </div>
                        <h1 class="page-title">Checkout</h1>
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
                        <span>Checkout</span>
                    </div>
                    <h1 class="page-title">Checkout</h1>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px;">
                    <!-- Left: Forms -->
                    <div>
                        <!-- Shipping Address -->
                        <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg); margin-bottom: 24px;">
                            <h2 style="font-size: 20px; margin-bottom: 16px;">Shipping Address</h2>
                            <form id="shipping-form">
                                <div class="form-group">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-input" id="ship-name" value="John Doe" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Address</label>
                                    <input type="text" class="form-input" id="ship-address" value="123 Main Street" required />
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
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
                        </div>

                        <!-- Payment -->
                        <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg);">
                            <h2 style="font-size: 20px; margin-bottom: 16px;">Payment Information</h2>
                            <form id="payment-form">
                                <div class="form-group">
                                    <label class="form-label">Card Number</label>
                                    <input type="text" class="form-input" id="card-number" value="4111111111111111" placeholder="1234 5678 9012 3456" required />
                                    <small style="font-size: 12px; color: var(--text-secondary);">Test card: 4111-1111-1111-1111</small>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
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
                        </div>
                    </div>

                    <!-- Right: Order Summary -->
                    <div>
                        <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg); position: sticky; top: 100px;">
                            <h2 style="font-size: 20px; margin-bottom: 16px;">Order Summary</h2>

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

                            <a href="#/cart" style="font-size: 14px; color: var(--primary-color); text-decoration: none; display: block; margin-bottom: 16px;">
                                ← Edit Cart
                            </a>

                            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; margin-bottom: 24px;">
                                <span>Total</span>
                                <span>${formatPrice(totals.total)}</span>
                            </div>

                            <button
                                onclick="CheckoutPage.placeOrder()"
                                class="btn btn-primary btn-full"
                                style="padding: 14px;"
                            >
                                Place Order
                            </button>

                            <div id="checkout-message" style="margin-top: 16px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Place order (mocked - always succeeds)
     */
    static placeOrder() {
        const messageDiv = getEl('checkout-message');

        // Validate forms
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

        // Show loading
        messageDiv.innerHTML = '<div class="loading">Processing order...</div>';

        // Simulate API call
        setTimeout(() => {
            // Mock successful payment
            const orderId = Settings.get().orderPrefix + Date.now();

            messageDiv.innerHTML = `
                <div class="message message-success">
                    <strong>Order Placed Successfully!</strong>
                    <p style="margin-top: 8px; font-size: 14px;">Order ID: ${orderId}</p>
                </div>
            `;

            // Redirect to order confirmation
            setTimeout(() => {
                // Store order for confirmation page
                sessionStorage.setItem('lastOrder', JSON.stringify({
                    orderId,
                    items: Cart.getItemsWithDetails(),
                    total: Cart.getTotal().total,
                    timestamp: new Date().toISOString()
                }));

                // Clear cart
                Cart.clear();

                // Navigate to order confirmation
                navigateTo('/order-confirmation');
            }, 1500);
        }, 1500);
    }
}
export { CheckoutPage };
