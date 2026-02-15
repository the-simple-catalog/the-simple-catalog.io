// ===================================
// Utility Functions
// ===================================

/**
 * Format price with currency symbol
 * @param {string|number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
    if (!price) return '$0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toFixed(2)}`;
}

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function getEl(id) {
    return document.getElementById(id);
}

/**
 * Create HTML element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {string|HTMLElement|Array} content - Content to append
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, content = null) {
    const el = document.createElement(tag);

    // Set attributes
    Object.keys(attrs).forEach(key => {
        if (key === 'className') {
            el.className = attrs[key];
        } else if (key === 'onClick') {
            el.addEventListener('click', attrs[key]);
        } else {
            el.setAttribute(key, attrs[key]);
        }
    });

    // Set content
    if (content) {
        if (typeof content === 'string') {
            el.innerHTML = content;
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child) el.appendChild(child);
            });
        } else {
            el.appendChild(content);
        }
    }

    return el;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show notification message
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info)
 */
function showMessage(message, type = 'info') {
    const container = getEl('app');
    if (!container) return;

    const messageEl = createElement('div', {
        className: `message message-${type} fade-in`
    }, escapeHtml(message));

    container.insertBefore(messageEl, container.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null}
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    return urlParams.get(param);
}

/**
 * Parse hash route
 * @returns {Object} Route object with path and params
 */
function parseRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);

    return {
        path: path || '/',
        params: Object.fromEntries(params)
    };
}

/**
 * Navigate to a route
 * @param {string} path - Route path
 */
function navigateTo(path) {
    window.location.hash = path;
}

/**
 * Generate a UUID v4 using native browser API
 * @returns {string} UUID v4 format string
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Generate product badges based on product data and sponsorship status
 * @param {Object} product - Product object from catalog
 * @param {boolean} isSponsored - Whether this is a sponsored product
 * @returns {string} HTML string with badge elements
 */
function generateProductBadges(product, isSponsored = false) {
    const badges = [];

    // SALE badge - Product has promotional price
    if (product?.content?.promoPrice) {
        badges.push('<span class="product-badge product-badge-sale">Sale</span>');
    }

    // SPONSORED badge - Marked as sponsored (ads)
    if (isSponsored) {
        badges.push('<span class="product-badge product-badge-sponsored">Sponsored</span>');
    }

    // MARKETPLACE badge - 3P (third-party) product
    if (product?.content?.partyTypes === '3P') {
        badges.push('<span class="product-badge product-badge-marketplace">Marketplace</span>');
    }

    return badges.length > 0
        ? `<div class="product-badges">${badges.join('')}</div>`
        : '';
}

// Export utility functions
export {
    formatPrice,
    getEl,
    createElement,
    escapeHtml,
    debounce,
    showMessage,
    getQueryParam,
    parseRoute,
    navigateTo,
    generateUUID,
    generateProductBadges
};
