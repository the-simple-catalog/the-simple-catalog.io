// ===================================
// Main Application Entry Point
// ===================================

// Import dependencies
import { getEl, escapeHtml, createElement } from './utils.js';
import { CatalogManager, Settings } from './catalog.js';
import { Cart } from './cart.js';
import { Router } from './router.js';
import { HomePage } from './pages/home.js';
import { CategoryPage } from './pages/category.js';
import { ProductPage } from './pages/product.js';
import { SearchPage } from './pages/search.js';
import { CartPage } from './pages/cart.js';
import { CheckoutPage } from './pages/checkout.js';
import { OrderConfirmationPage } from './pages/orderconfirmation.js';
import { AdminPage } from './pages/admin.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('E-Commerce Demo App Starting...');

    // Load site settings
    loadSiteSettings();

    // Register all routes
    registerRoutes();

    // Initialize router
    Router.init();

    // Update cart count in header
    updateCartCount();

    // Initialize header search and categories dropdown
    initHeaderSearch();
    initCategoriesDropdown();

    console.log('App initialized successfully');
});

/**
 * Load site settings from localStorage
 */
function loadSiteSettings() {
    const settings = Settings.get();

    // Update site name in header
    const siteNameEl = getEl('site-name');
    if (siteNameEl && settings.siteName) {
        siteNameEl.textContent = settings.siteName;
    }
}

/**
 * Register all application routes
 */
function registerRoutes() {
    // Homepage
    Router.register('/', (params) => HomePage.render(params));

    // Category page
    Router.register('/category/:categoryId', (params) => CategoryPage.render(params));

    // Product page
    Router.register('/product/:productId', (params) => ProductPage.render(params));

    // Search page
    Router.register('/search', (params) => SearchPage.render(params));

    // Cart page
    Router.register('/cart', (params) => CartPage.render(params));

    // Checkout page
    Router.register('/checkout', (params) => CheckoutPage.render(params));

    // Order confirmation page
    Router.register('/order-confirmation', (params) => OrderConfirmationPage.render(params));

    // Admin page
    Router.register('/admin', (params) => AdminPage.render(params));
}

/**
 * Initialize header search functionality
 * This function sets up the inline search bar in the header.
 * When the user submits the form, it navigates to the search page with the query parameter.
 *
 * Flow:
 * 1. Get references to the search form and input elements
 * 2. Add submit event listener to the form
 * 3. On submit: prevent default form submission, extract query text, navigate to search page
 */
function initHeaderSearch() {
    const searchForm = getEl('header-search-form');
    const searchInput = getEl('header-search-input');

    // Exit early if elements don't exist
    if (!searchForm || !searchInput) return;

    // Handle form submission
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission behavior
        const query = searchInput.value.trim();

        // Navigate to search page with query parameter if query is not empty
        if (query) {
            window.location.hash = `/search?q=${encodeURIComponent(query)}`;
        }
    });
}

/**
 * Initialize categories dropdown
 * This function sets up the "Explore All Categories" dropdown menu in the header.
 *
 * Features:
 * - Click the button to toggle dropdown open/close
 * - Click outside the dropdown to close it
 * - Automatically populates with categories from CatalogManager
 *
 * Interaction Pattern:
 * - CLICK button: open/close main dropdown (mobile-friendly)
 * - CLICK category name: navigate to category page
 */
function initCategoriesDropdown() {
    const dropdownBtn = getEl('categories-dropdown-btn');
    const dropdownMenu = getEl('categories-dropdown-menu');

    // Exit early if elements don't exist
    if (!dropdownBtn || !dropdownMenu) return;

    // Toggle dropdown visibility when button is clicked
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event from bubbling to document click handler
        dropdownMenu.classList.toggle('active'); // Toggle the 'active' class to show/hide dropdown
    });

    // Close dropdown when clicking outside of it
    document.addEventListener('click', function(e) {
        // Check if click is outside both the dropdown menu and button
        if (!dropdownMenu.contains(e.target) && e.target !== dropdownBtn) {
            dropdownMenu.classList.remove('active'); // Hide dropdown

            // Also close all nested subcategory panels that might be open
            const subPanels = dropdownMenu.querySelectorAll('.subcategory-panel');
            subPanels.forEach(panel => panel.classList.remove('active'));
        }
    });

    // Populate the dropdown with categories from the catalog
    populateCategoriesDropdown();
}

/**
 * Populate categories dropdown with root categories only
 * This function builds a simple flat dropdown menu with:
 * - Root categories with emoji icons
 * - Click handlers for navigation
 *
 * Category Structure:
 * [Icon] Category Name
 *
 * Interaction Logic:
 * - CLICK: Navigate to category page
 * - Simple flat list, no nesting
 */
function populateCategoriesDropdown() {
    const dropdownMenu = getEl('categories-dropdown-menu');
    if (!dropdownMenu) return;

    // Get all root categories (top-level categories with no parent)
    const categories = CatalogManager.getRootCategories();

    // Show message if no categories are loaded
    if (categories.length === 0) {
        dropdownMenu.innerHTML = '<div style="padding: 16px; color: var(--text-secondary); text-align: center;">No categories loaded</div>';
        return;
    }

    // Icon mapping: Maps category names to emoji icons
    // Fallback icon is used for unmapped categories
    const categoryIcons = {
        'Book': '📚',
        'Electronics': '💻',
        'Fashion': '👕',
        'Home': '🏠',
        'Sports': '⚽',
        'Toys': '🎮',
        'Beauty': '💄',
        'Food': '🍕'
    };

    // Clear existing content
    dropdownMenu.innerHTML = '';

    // Create dropdown items for each root category
    categories.forEach(category => {
        // Get icon for this category (use fallback if not mapped)
        const icon = categoryIcons[category.content.name] || '📦';

        // Create the dropdown item element
        const item = createElement('div', { className: 'category-dropdown-item' });

        // Create and append icon and name elements
        const iconEl = createElement('span', { className: 'category-dropdown-icon' }, icon);
        const nameEl = createElement('span', { className: 'category-dropdown-name' }, escapeHtml(category.content.name));

        item.appendChild(iconEl);
        item.appendChild(nameEl);

        // Navigate to category page on click
        item.addEventListener('click', function() {
            window.location.hash = `/category/${category.id}`;
            dropdownMenu.classList.remove('active'); // Close dropdown after navigation
        });

        // Add the completed item to the dropdown menu
        dropdownMenu.appendChild(item);
    });
}

/**
 * Update cart count badge in header
 */
function updateCartCount() {
    const cartCountEl = getEl('cart-count');
    if (cartCountEl) {
        const count = Cart.getItemCount();
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }
}

// Make updateCartCount available globally for cart operations
window.updateCartCount = updateCartCount;

// Make populateCategoriesDropdown available globally for catalog updates
window.populateCategoriesDropdown = populateCategoriesDropdown;

// Expose page classes globally for inline onclick handlers
window.CategoryPage = CategoryPage;
window.ProductPage = ProductPage;
window.SearchPage = SearchPage;
window.AdminPage = AdminPage;
window.CartPage = CartPage;
window.CheckoutPage = CheckoutPage;
