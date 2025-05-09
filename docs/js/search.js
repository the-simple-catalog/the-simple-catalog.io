/**
 * Search Page JavaScript
 * Handles functionality specific to the search results page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize search page
  initSearchPage();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize categories
  initCategories();
  
  // Initialize Mirakl Ads
  MiraklAds.init();
});

/**
 * Initialize the search page
 */
function initSearchPage() {
  // Get query from URL
  const query = Utils.getUrlParam('query');
  
  // Update search input with query
  const searchInput = document.querySelector('.search-bar input[name="query"]');
  if (searchInput && query) {
    searchInput.value = query;
  }
  
  if (query) {
    // Perform search
    performSearch(query);
    
    // Load sponsored products related to search using Mirakl Ads
    loadMiraklSponsoredProducts(query);
  } else {
    // No query provided, show all products
    loadAllProducts();
    
    // Load generic sponsored products using Mirakl Ads
    loadMiraklSponsoredProducts();
  }
  
  // Load categories for filter dropdown
  loadCategoriesFilter();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Sort dropdown
  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const query = Utils.getUrlParam('query');
      const categoryFilter = document.getElementById('category-filter');
      const categoryId = categoryFilter ? categoryFilter.value : '';
      
      if (query) {
        performSearch(query, this.value, categoryId);
      } else {
        showAllProducts(this.value, categoryId);
      }
    });
  }
  
  // Category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      const query = Utils.getUrlParam('query');
      const sortSelect = document.getElementById('sort-by');
      const sortBy = sortSelect ? sortSelect.value : 'default';
      
      if (query) {
        performSearch(query, sortBy, this.value);
      } else {
        showAllProducts(sortBy, this.value);
      }
    });
  }
}

/**
 * Load categories for the filter dropdown
 */
async function loadCategoriesFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;
  
  try {
    // Get all categories
    const categories = await API.getCategories();
    
    // Sort by name
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add options
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading categories for filter:', error);
  }
}

/**
 * Perform search with the given query
 * @param {string} query - Search query
 * @param {string} sortBy - Sort method
 * @param {string} categoryId - Category filter
 */
async function performSearch(query, sortBy = 'default', categoryId = '') {
  // Show loading
  const searchResults = document.getElementById('search-results');
  const searchLoading = document.getElementById('search-loading');
  const noResults = document.getElementById('no-results');
  
  if (searchResults) searchResults.innerHTML = '';
  if (searchLoading) searchLoading.classList.remove('hidden');
  if (noResults) noResults.classList.add('hidden');
  
  try {
    // Search products
    let results = await API.searchProducts(query);
    
    // Filter by category if needed
    if (categoryId) {
      results = results.filter(product => product.categoryId === categoryId);
    }
    
    // Sort results
    results = Utils.sortProducts(results, sortBy);
    
    // Update results info
    document.getElementById('search-results-info').textContent = 
      `Showing ${results.length} results for: "${query}"`;
    
    // Hide loading
    if (searchLoading) searchLoading.classList.add('hidden');
    
    // Display results or no results message
    if (results.length === 0) {
      if (noResults) noResults.classList.remove('hidden');
    } else {
      displaySearchResults(results);
    }
    
    // Track search
    if (typeof Tracking !== 'undefined') {
      Tracking.trackSearch(query, results, results.length);
    }
  } catch (error) {
    console.error('Error performing search:', error);
    if (searchLoading) searchLoading.classList.add('hidden');
    
    // Show error message
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="search-error">
          <p>An error occurred while searching. Please try again.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Show all products (when no search query is provided)
 * @param {string} sortBy - Sort method
 * @param {string} categoryId - Category filter
 */
async function showAllProducts(sortBy = 'default', categoryId = '') {
  // Show loading
  const searchResults = document.getElementById('search-results');
  const searchLoading = document.getElementById('search-loading');
  const noResults = document.getElementById('no-results');
  
  if (searchResults) searchResults.innerHTML = '';
  if (searchLoading) searchLoading.classList.remove('hidden');
  if (noResults) noResults.classList.add('hidden');
  
  try {
    // Get all products
    let products = await API.getProducts();
    
    // Filter by category if needed
    if (categoryId) {
      products = products.filter(product => product.categoryId === categoryId);
    }
    
    // Sort products
    products = Utils.sortProducts(products, sortBy);
    
    // Update results info
    document.getElementById('search-results-info').textContent = 
      `Showing all products${categoryId ? ' in selected category' : ''}`;
    
    // Hide loading
    if (searchLoading) searchLoading.classList.add('hidden');
    
    // Display results or no results message
    if (products.length === 0) {
      if (noResults) noResults.classList.remove('hidden');
    } else {
      displaySearchResults(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    if (searchLoading) searchLoading.classList.add('hidden');
    
    // Show error message
    if (searchResults) {
      searchResults.innerHTML = `
        <div class="search-error">
          <p>An error occurred while loading products. Please try again.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Display search results
 * @param {Array} results - Products to display
 */
function displaySearchResults(results) {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) return;
  
  // Clear previous results
  searchResults.innerHTML = '';
  
  // Create product cards
  results.forEach(product => {
    const productCard = Utils.createProductCard(product);
    searchResults.appendChild(productCard);
  });
}

/**
 * Load sponsored products using Mirakl Ads API
 * @param {string} [keywords] - Search keywords (optional)
 */
async function loadMiraklSponsoredProducts(keywords) {
  try {
    // Get sponsored products data from Mirakl Ads for search page
    let sponsoredData;
    
    if (keywords) {
      sponsoredData = await MiraklAds.getSearchPageSponsoredProducts(keywords);
    } else {
      // If no keywords, use generic search page sponsored products
      sponsoredData = await MiraklAds.getSearchPageSponsoredProducts('');
    }
    
    // Render ad units in the sponsored zone
    await MiraklAds.renderAdUnits(
      sponsoredData, 
      '#sponsored-products-grid',
      '#retail-media-container'
    );
    
    // Track sponsored ad impression
    if (typeof Tracking !== 'undefined') {
      const adUnitIds = sponsoredData.productAds.map(unit => unit.adUnitId).join(',');
      Tracking.trackEvent('mirakl_sponsored_impression', {
        page_id: sponsoredData.pageId,
        keywords: keywords || '',
        ad_unit_ids: adUnitIds,
        placement: 'search_results'
      });
    }
  } catch (error) {
    console.error('Error loading Mirakl sponsored products:', error);
    // Fallback to regular sponsored products
    loadSponsoredProducts();
  }
} 