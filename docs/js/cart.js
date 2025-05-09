/**
 * Cart Module - Handles all shopping cart operations
 */

const Cart = (function() {
    // Storage key for cart in localStorage
    const CART_STORAGE_KEY = 'shopnow_cart';
    
    // In-memory cart
    let cartItems = [];
    
    /**
     * Load cart from localStorage
     */
    function loadCart() {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                cartItems = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            cartItems = [];
        }
        
        updateCartCounter();
    }
    
    /**
     * Save cart to localStorage
     */
    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
        
        updateCartCounter();
        
        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { items: cartItems, itemCount: getItemCount(), total: getTotal() } 
        }));
    }
    
    /**
     * Update cart counter in header
     */
    function updateCartCounter() {
        const cartCounters = document.querySelectorAll('#cart-count');
        const itemCount = getItemCount();
        
        cartCounters.forEach(counter => {
            counter.textContent = itemCount;
            
            // Toggle visibility based on count
            if (itemCount === 0) {
                counter.classList.add('hidden');
            } else {
                counter.classList.remove('hidden');
            }
        });
    }
    
    /**
     * Get all cart items
     * @returns {Array} Array of cart items
     */
    function getItems() {
        return [...cartItems];
    }
    
    /**
     * Get all cart items (alias for getItems)
     * @returns {Array} Array of cart items
     */
    function getCartItems() {
        return getItems();
    }
    
    /**
     * Get total number of items in cart
     * @returns {number} Total item count
     */
    function getItemCount() {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }
    
    /**
     * Get total cart price
     * @returns {number} Total price
     */
    function getTotal() {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    /**
     * Format price as currency
     * @param {number} price - Price to format
     * @param {string} currency - Currency code (default: USD)
     * @returns {string} Formatted price
     */
    function formatPrice(price, currency = 'USD') {
        if (typeof price !== 'number') {
            price = parseFloat(price) || 0;
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    }
    
    /**
     * Check if product is in cart
     * @param {string} productId - Product ID to check
     * @returns {boolean} True if product is in cart
     */
    function isInCart(productId) {
        return cartItems.some(item => item.id === productId);
    }
    
    /**
     * Get cart item by product ID
     * @param {string} productId - Product ID to find
     * @returns {Object|null} Cart item or null if not found
     */
    function getItem(productId) {
        return cartItems.find(item => item.id === productId) || null;
    }
    
    /**
     * Add product to cart
     * @param {Object} product - Product to add
     * @param {number} quantity - Quantity to add
     * @returns {Object} Updated cart item
     */
    function addItem(product, quantity = 1) {
        if (!product || !product.id) {
            console.error('Invalid product:', product);
            return null;
        }
        
        const existingItem = getItem(product.id);
        
        if (existingItem) {
            // Update quantity if already in cart
            existingItem.quantity += quantity;
            
            // Track this cart add event
            if (typeof Tracking !== 'undefined') {
                Tracking.trackEvent('cart_update', {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: quantity,
                    price: product.price
                });
            }
        } else {
            // Add new item to cart
            const newItem = {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                imageUrl: product.imageUrl,
                quantity: quantity
            };
            
            cartItems.push(newItem);
            
            // Track this cart add event
            if (typeof Tracking !== 'undefined') {
                Tracking.trackEvent('cart_add', {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: quantity,
                    price: product.price
                });
            }
        }
        
        saveCart();
        
        // Show confirmation message
        Config.showToast(`${product.name} added to cart`);
        
        return existingItem || cartItems[cartItems.length - 1];
    }
    
    /**
     * Update item quantity
     * @param {string} productId - Product ID to update
     * @param {number} quantity - New quantity
     * @returns {Object|null} Updated cart item or null if not found
     */
    function updateItemQuantity(productId, quantity) {
        const item = getItem(productId);
        
        if (!item) {
            return null;
        }
        
        // Remove item if quantity is 0 or negative
        if (quantity <= 0) {
            return removeItem(productId);
        }
        
        // Update quantity
        item.quantity = quantity;
        saveCart();
        
        // Track this cart update event
        if (typeof Tracking !== 'undefined') {
            Tracking.trackEvent('cart_update', {
                product_id: productId,
                quantity: quantity,
                price: item.price
            });
        }
        
        return item;
    }
    
    /**
     * Remove item from cart
     * @param {string} productId - Product ID to remove
     * @returns {boolean} True if removed successfully
     */
    function removeItem(productId) {
        const initialLength = cartItems.length;
        cartItems = cartItems.filter(item => item.id !== productId);
        
        if (cartItems.length !== initialLength) {
            saveCart();
            
            // Track this cart remove event
            if (typeof Tracking !== 'undefined') {
                Tracking.trackEvent('cart_remove', {
                    product_id: productId
                });
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Clear all items from cart
     */
    function clearCart() {
        if (cartItems.length > 0) {
            cartItems = [];
            saveCart();
            
            // Track cart clear event
            if (typeof Tracking !== 'undefined') {
                Tracking.trackEvent('cart_clear');
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Calculate cart totals
     * @returns {Object} Cart totals object with subtotal, shipping, tax, and total
     */
    function calculateTotals() {
        const subtotal = getTotal();
        const shipping = subtotal > 0 ? 5.99 : 0; // Free shipping if cart is empty
        const taxRate = 0.08; // 8% tax rate
        const tax = subtotal * taxRate;
        const total = subtotal + shipping + tax;
        
        return {
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            total: total
        };
    }
    
    /**
     * Initialize cart module
     */
    function init() {
        loadCart();
        
        // Add event listeners for add-to-cart buttons
        document.addEventListener('click', function(event) {
            const addToCartBtn = event.target.closest('.add-to-cart');
            
            if (addToCartBtn && addToCartBtn.dataset.productId) {
                event.preventDefault();
                
                const productId = addToCartBtn.dataset.productId;
                
                // Get product details
                API.getProductById(productId).then(product => {
                    if (product) {
                        addItem(product, 1);
                    }
                });
            }
        });
    }
    
    // Public API
    return {
        init: init,
        getItems: getItems,
        getCartItems: getCartItems,
        getItem: getItem,
        getItemCount: getItemCount,
        getTotal: getTotal,
        formatPrice: formatPrice,
        isInCart: isInCart,
        addItem: addItem,
        updateItemQuantity: updateItemQuantity,
        removeItem: removeItem,
        clearCart: clearCart,
        calculateTotals: calculateTotals
    };
})();

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Cart.init();
}); 