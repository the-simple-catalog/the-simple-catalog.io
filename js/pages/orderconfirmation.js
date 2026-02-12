// ===================================
// Order Confirmation Page - Post-payment confirmation
// ===================================

const OrderConfirmationPage = {
    /**
     * Render order confirmation page
     */
    render() {
        // Track page view
        Tracking.trackPageView(PAGE_IDS.ORDER_CONFIRMATION, PAGE_TYPES.POSTPAYMENT);

        const app = getEl('app');

        // Get last order from session storage
        const lastOrderStr = sessionStorage.getItem('lastOrder');

        if (!lastOrderStr) {
            app.innerHTML = `
                <div class="container fade-in">
                    <div class="page-header">
                        <h1 class="page-title">Order Confirmation</h1>
                    </div>

                    <div class="message message-info">
                        No recent order found
                    </div>

                    <a href="#/" class="btn btn-primary" style="margin-top: 16px;">
                        Go to Homepage
                    </a>
                </div>
            `;
            return;
        }

        const order = JSON.parse(lastOrderStr);
        const orderDate = new Date(order.timestamp);

        // Track post-payment
        const orderData = {
            orderId: order.orderId,
            total: order.total,
            items: order.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.subtotal / item.quantity
            }))
        };
        Tracking.trackPostPayment(orderData);

        app.innerHTML = `
            <div class="container fade-in">
                <div style="max-width: 800px; margin: 0 auto;">
                    <!-- Success Message -->
                    <div style="text-align: center; margin-bottom: 48px;">
                        <div style="width: 80px; height: 80px; background: var(--success-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h1 style="font-size: 32px; margin-bottom: 12px;">Order Confirmed!</h1>
                        <p style="font-size: 18px; color: var(--text-secondary);">
                            Thank you for your purchase
                        </p>
                    </div>

                    <!-- Order Details -->
                    <div style="background: var(--bg-primary); padding: 32px; border-radius: var(--radius-lg); margin-bottom: 24px;">
                        <h2 style="font-size: 20px; margin-bottom: 24px;">Order Details</h2>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                            <div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Order Number</div>
                                <div style="font-weight: 600;">${escapeHtml(order.orderId)}</div>
                            </div>
                            <div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 4px;">Order Date</div>
                                <div style="font-weight: 600;">${orderDate.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</div>
                            </div>
                        </div>

                        <!-- Order Items -->
                        <h3 style="font-size: 16px; margin-bottom: 16px;">Items Ordered (${order.items.length})</h3>
                        ${order.items.map(item => OrderConfirmationPage.renderOrderItem(item)).join('')}

                        <!-- Order Total -->
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid var(--border-color);">
                            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
                                <span>Total</span>
                                <span>${formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Next Steps -->
                    <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--radius-lg); margin-bottom: 24px;">
                        <h2 style="font-size: 18px; margin-bottom: 16px;">What's Next?</h2>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                                <div style="font-weight: 500;">📧 Order Confirmation Email</div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                                    You'll receive a confirmation email shortly
                                </div>
                            </li>
                            <li style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                                <div style="font-weight: 500;">📦 Preparing Your Order</div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                                    We're processing your order and will ship it soon
                                </div>
                            </li>
                            <li style="padding: 12px 0;">
                                <div style="font-weight: 500;">🚚 Shipping Updates</div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                                    You'll receive tracking information once shipped
                                </div>
                            </li>
                        </ul>
                    </div>

                    <!-- Actions -->
                    <div style="text-align: center;">
                        <a href="#/" class="btn btn-primary" style="padding: 14px 32px; text-decoration: none; display: inline-block;">
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render a single order item
     */
    renderOrderItem(item) {
        const product = item.product;
        const brand = CatalogManager.getProductBrand(product);

        return `
            <div style="display: grid; grid-template-columns: 60px 1fr auto; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                <img
                    src="${escapeHtml(product.content.imageUrl || '')}"
                    alt="${escapeHtml(product.content.name)}"
                    style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%228%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                />
                <div>
                    ${brand ? `<div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(brand)}</div>` : ''}
                    <div style="font-weight: 500;">${escapeHtml(product.content.name)}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                        Quantity: ${item.quantity}
                    </div>
                </div>
                <div style="text-align: right; font-weight: 600;">
                    ${formatPrice(item.subtotal)}
                </div>
            </div>
        `;
    }
};
