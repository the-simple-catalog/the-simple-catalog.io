/**
 * Utils Module
 * Contains utility functions used across the application
 */

const Utils = (function() {
  /**
   * Format price with currency symbol
   * @param {number} price - Price to format
   * @param {string} currency - Currency code (default: USD)
   * @returns {string} - Formatted price
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
   * Get URL parameters as an object
   * @returns {Object} URL parameters
   */
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    
    if (queryString) {
      const pairs = queryString.split('&');
      
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
    }
    
    return params;
  }
  
  /**
   * Get a specific URL parameter
   * @param {string} name - Parameter name
   * @returns {string|null} Parameter value or null if not found
   */
  function getUrlParam(name) {
    const param = getUrlParams()[name];
    
    if (param) {
      // If the parameter is a string and is wrapped in quotes, remove them
      if (typeof param === 'string') {
        // First decode URI component to handle special characters
        const decoded = decodeURIComponent(param);
        
        // Then remove quotes if they exist
        if (decoded.startsWith('"') && decoded.endsWith('"')) {
          return decoded.substring(1, decoded.length - 1);
        }
        return decoded;
      }
      return param;
    }
    
    return null;
  }
  
  /**
   * Create HTML element for a product card
   * @param {Object} product - Product data
   * @param {boolean} isSponsoredZone - Is this for the sponsored zone
   * @returns {HTMLElement} Product card element
   */
  function createProductCard(product, isSponsoredZone = false) {
    if (!product) return null;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    // Build card HTML structure
    card.innerHTML = `
      <div class="product-image">
        <a href="product.html?id=${product.id}" class="product-image-link">
          <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
        </a>
        <div class="product-badges">
          ${product.isNew ? '<span class="product-badge badge-new">New</span>' : ''}
          ${product.isOnSale ? '<span class="product-badge badge-sale">Sale</span>' : ''}
          ${isSponsoredZone ? '<span class="product-badge badge-sponsored">Sponsored</span>' : ''}
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-category">${product.brand || product.category1Name || ''}</div>
        <div class="product-price">${Cart.formatPrice(product.price)}</div>
        <div class="product-rating">
          <div class="stars">
            ${generateStarRating(product.rating)}
          </div>
          <div class="reviews-count">(${product.reviewsCount})</div>
        </div>
        <div class="product-actions">
          <button class="btn primary-btn add-to-cart" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    
    // Add click event for tracking when the product is clicked
    const productLink = card.querySelector('.product-title a');
    if (productLink && typeof Tracking !== 'undefined') {
      productLink.addEventListener('click', function() {
        Tracking.trackEvent('product_click', {
          product_id: product.id,
          product_name: product.name,
          is_sponsored: isSponsoredZone
        });
      });
    }
    
    return card;
  }
  
  /**
   * Generate HTML for star rating
   * @param {number} rating - Rating value (0-5)
   * @returns {string} Star rating HTML
   */
  function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
      starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
  }
  
  /**
   * Create a category card element
   * @param {Object} category - Category data
   * @returns {HTMLElement} Category card element
   */
  function createCategoryCard(category) {
    if (!category) return null;
    
    const card = document.createElement('div');
    card.className = 'category-card';
    
    card.innerHTML = `
      <img class="category-image" src="${category.imageUrl}" alt="${category.name}" loading="lazy">
      <div class="category-overlay">
        <h3 class="category-name">${category.name}</h3>
        <div class="category-count">${category.productCount} Products</div>
      </div>
    `;
    
    // Make the whole card clickable
    card.addEventListener('click', function() {
      window.location.href = `category.html?id=${category.id}`;
      
      // Track category click
      if (typeof Tracking !== 'undefined') {
        Tracking.trackEvent('category_click', {
          category_id: category.id,
          category_name: category.name
        });
      }
    });
    
    return card;
  }
  
  /**
   * Create HTML for sponsored products section
   * @param {string} containerId - ID of container element
   * @param {number} count - Number of products to show
   * @param {string} categoryId - Optional category ID to filter products
   */
  async function loadSponsoredProducts(containerId, count = 4, categoryId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
      const sponsoredProducts = await API.getSponsoredProducts(count, categoryId);
      
      // Clear container
      container.innerHTML = '';
      
      // Add products
      sponsoredProducts.forEach(product => {
        const card = createProductCard(product, true);
        container.appendChild(card);
      });
      
      // Track impression
      if (typeof Tracking !== 'undefined') {
        Tracking.trackEvent('sponsored_impression', {
          product_ids: sponsoredProducts.map(p => p.id).join(','),
          count: sponsoredProducts.length,
          placement: containerId
        });
      }
    } catch (error) {
      console.error('Error loading sponsored products:', error);
      container.innerHTML = '<p>Failed to load sponsored products</p>';
    }
  }
  
  /**
   * Show loading spinner in a container
   * @param {string} containerId - ID of container element
   * @param {string} message - Loading message
   */
  function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Hide loading spinner and clear container
   * @param {string} containerId - ID of container element
   */
  function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loading = container.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }
  
  /**
   * Show error message in a container
   * @param {string} containerId - ID of container element
   * @param {string} message - Error message
   */
  function showError(containerId, message = 'An error occurred. Please try again.') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Truncate text to a certain length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength).trim() + '...';
  }
  
  /**
   * Format date string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date
   */
  function formatDate(date) {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Sort products by criteria
   * @param {Array} products - Products to sort
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted products
   */
  function sortProducts(products, sortBy = 'default') {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
        
      case 'price-desc':
        sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
        
      case 'name-asc':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
        
      case 'name-desc':
        sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
        
      case 'rating':
        sortedProducts.sort((a, b) => b.rating - a.rating);
        break;
        
      default:
        // Default sorting (relevance) - no change
        break;
    }
    
    return sortedProducts;
  }
  
  /**
   * Load categories into navigation menu
   * @param {Array} categories - List of category objects
   */
  function loadCategoriesMenu(categories) {
    const categoryMenu = document.getElementById('categories-menu');
    
    if (categoryMenu && categories && categories.length > 0) {
      console.log('Loading categories menu with', categories.length, 'categories');
      
      // Keep the first two items (Home and Cart) that are already there
      const homeCartLinks = categoryMenu.querySelectorAll('li:nth-child(-n+2)');
      if (homeCartLinks.length > 0) {
        categoryMenu.innerHTML = '';
        homeCartLinks.forEach(link => {
          categoryMenu.appendChild(link.cloneNode(true));
        });
      } else {
        // Add home and cart links if they don't exist
        categoryMenu.innerHTML = `
          <li><a href="index.html">Home</a></li>
          <li><a href="cart.html">Cart</a></li>
        `;
      }
      
      // Get root level categories (parentCategoryId is null)
      const rootCategories = categories.filter(category => !category.parentCategoryId);
      console.log('Found root categories:', rootCategories);
      
      // If we have root categories, use them, otherwise use top 5 categories
      const menuCategories = rootCategories.length > 0
        ? rootCategories.slice(0, 5)
        : categories.slice(0, 5);
      
      // Add categories to the menu
      menuCategories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="category.html?id=${category.id}">${category.name}</a>`;
        categoryMenu.appendChild(li);
      });
      
      // Add 'All Categories' as the last item if there are more categories
      if (categories.length > menuCategories.length) {
        const li = document.createElement('li');
        li.innerHTML = '<a href="category.html">All Categories</a>';
        categoryMenu.appendChild(li);
      }
    } else {
      console.warn('Could not load categories menu:', 
        categoryMenu ? 'Menu element exists' : 'Menu element missing', 
        categories ? `${categories.length} categories found` : 'No categories data');
    }
  }
  
  /**
   * Initialize UI elements that appear on multiple pages
   */
  function initCommonUI() {
    // Load categories for main navigation
    API.getRootCategories().then(rootCategories => {
      console.log('Initializing UI with root categories:', rootCategories);
      if (rootCategories && rootCategories.length > 0) {
        loadCategoriesMenu(rootCategories);
      } else {
        // Fallback to all categories if no root categories found
        API.getCategories().then(categories => {
          console.log('Falling back to all categories for menu');
          loadCategoriesMenu(categories);
        });
      }
    }).catch(error => {
      console.error('Error loading categories for menu:', error);
      // Fallback to all categories on error
      API.getCategories().then(categories => {
        loadCategoriesMenu(categories);
      });
    });
  }
  
  // Initialize common UI when DOM is loaded
  document.addEventListener('DOMContentLoaded', initCommonUI);
  
  // Return public methods
  return {
    formatPrice,
    getUrlParams,
    getUrlParam,
    createProductCard,
    createCategoryCard,
    loadSponsoredProducts,
    showLoading,
    hideLoading,
    showError,
    truncateText,
    formatDate,
    sortProducts,
    generateStarRating,
    loadCategoriesMenu
  };
})(); 