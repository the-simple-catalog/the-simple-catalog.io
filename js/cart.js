// ===================================
// Shopping Cart Manager
// ===================================

import { CatalogManager } from './catalog.js';
import { Tracking } from './tracking.js';

class Cart {
    static #STORAGE_KEY = 'ecommerce_cart'; // Private

    /**
     * Get cart data from localStorage
     * @returns {Array} Array of cart items
     */
    static getItems() {
        try {
            const data = localStorage.getItem(Cart.#STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading cart:', e);
            return [];
        }
    }

    /**
     * Save cart data to localStorage
     * @param {Array} items - Array of cart items
     * @returns {boolean} Success status
     */
    static saveItems(items) {
        try {
            localStorage.setItem(Cart.#STORAGE_KEY, JSON.stringify(items));
            return true;
        } catch (e) {
            console.error('Error saving cart:', e);
            return false;
        }
    }

    /**
     * Add product to cart
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @returns {boolean} Success status
     */
    static addItem(productId, quantity = 1) {
        try {
            const product = CatalogManager.getProductById(productId);
            if (!product) {
                console.error('Product not found:', productId);
                return false;
            }

            const items = this.getItems();
            const existingItem = items.find(item => item.productId === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                items.push({
                    productId,
                    quantity,
                    addedAt: new Date().toISOString()
                });
            }

            this.saveItems(items);

            // Update cart count in header
            if (window.updateCartCount) {
                window.updateCartCount();
            }

            // Track add to cart
            const priceInfo = CatalogManager.getProductPrice(product);
            const finalPrice = priceInfo.promo || priceInfo.regular;
            if (finalPrice) {
                Tracking.trackAddToCart(productId, quantity, finalPrice);
            }

            return true;
        } catch (e) {
            console.error('Error adding to cart:', e);
            return false;
        }
    }

    /**
     * Remove product from cart
     * @param {string} productId - Product ID
     * @returns {boolean} Success status
     */
    static removeItem(productId) {
        try {
            const items = this.getItems();
            const filtered = items.filter(item => item.productId !== productId);
            this.saveItems(filtered);

            // Update cart count in header
            if (window.updateCartCount) {
                window.updateCartCount();
            }

            return true;
        } catch (e) {
            console.error('Error removing from cart:', e);
            return false;
        }
    }

    /**
     * Update item quantity
     * @param {string} productId - Product ID
     * @param {number} quantity - New quantity
     * @returns {boolean} Success status
     */
    static updateQuantity(productId, quantity) {
        try {
            if (quantity <= 0) {
                return this.removeItem(productId);
            }

            const items = this.getItems();
            const item = items.find(item => item.productId === productId);

            if (item) {
                item.quantity = quantity;
                this.saveItems(items);

                // Update cart count in header
                if (window.updateCartCount) {
                    window.updateCartCount();
                }

                return true;
            }

            return false;
        } catch (e) {
            console.error('Error updating quantity:', e);
            return false;
        }
    }

    /**
     * Get total item count in cart
     * @returns {number} Total count
     */
    static getItemCount() {
        const items = this.getItems();
        return items.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get cart with full product details
     * @returns {Array} Array of cart items with product details
     */
    static getItemsWithDetails() {
        const items = this.getItems();
        return items.map(item => {
            const product = CatalogManager.getProductById(item.productId);
            const price = CatalogManager.getProductPrice(product);

            return {
                ...item,
                product,
                price: price.hasPromo ? price.promo : price.regular,
                subtotal: (price.hasPromo ? price.promo : price.regular) * item.quantity
            };
        }).filter(item => item.product); // Filter out items with deleted products
    }

    /**
     * Calculate cart total
     * @returns {Object} Total information
     */
    static getTotal() {
        const items = this.getItemsWithDetails();
        const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

        return {
            subtotal,
            tax: 0, // Not implemented in this demo
            shipping: 0, // Not implemented in this demo
            total: subtotal
        };
    }

    /**
     * Clear cart
     * @returns {boolean} Success status
     */
    static clear() {
        try {
            localStorage.removeItem(Cart.#STORAGE_KEY);

            // Update cart count in header
            if (window.updateCartCount) {
                window.updateCartCount();
            }

            return true;
        } catch (e) {
            console.error('Error clearing cart:', e);
            return false;
        }
    }
}
export { Cart };
