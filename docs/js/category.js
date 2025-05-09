/**
 * Category Page JavaScript
 * Handles functionality specific to the category listing page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize category page
  initCategoryPage();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Initialize the category page
 */
async function initCategoryPage() {
  // Get category ID from URL
  const categoryId = Utils.getUrlParam('id');
  
  // Initialize categories menu
  initCategories();
  
  // Initialize Mirakl Ads
  MiraklAds.init();
  
  if (categoryId) {
    // Load category details and products
    await loadCategoryDetails(categoryId);
    
    // Load sponsored products using Mirakl Ads
    loadMiraklSponsoredProducts(categoryId);
    
    // Setup sorting
    setupSorting(categoryId);
  } else {
    // No category ID provided, load all categories
    await loadAllCategories();
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Sort dropdown
  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const categoryId = Utils.getUrlParam('id');
      loadCategoryProducts(categoryId, this.value);
    });
  }
}

/**
 * Initialize categories in the navigation menu
 */
function initCategories() {
  // Fetch root categories
  API.getRootCategories()
    .then(rootCategories => {
      // Load categories into menu
      Utils.loadCategoriesMenu(rootCategories);
    })
    .catch(error => {
      console.error('Error loading root categories:', error);
      // Fallback to all categories
      API.getCategories().then(categories => {
        Utils.loadCategoriesMenu(categories);
      });
    });
}

/**
 * Load category details and products
 * @param {string} categoryId - Category ID to load
 */
async function loadCategoryDetails(categoryId) {
  try {
    console.log('Loading category details for ID:', categoryId);
    
    // Remove URL encoding if present
    const decodedId = decodeURIComponent(categoryId);
    console.log('Decoded category ID:', decodedId);
    
    // Get category details
    const category = await API.getCategoryById(decodedId);
    console.log('Category lookup result:', category);
    
    if (!category) {
      document.querySelector('.category-header').innerHTML = `
        <h1>Category Not Found</h1>
        <p>The category you requested (ID: ${decodedId}) could not be found.</p>
        <a href="index.html" class="btn secondary-btn">Back to Home</a>
      `;
      return;
    }
    
    // Update page title
    document.title = `${category.name} - ShopNow`;
    
    // Update category title and description
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle) {
      categoryTitle.textContent = category.name;
    }
    
    const categoryDescription = document.getElementById('category-description');
    if (categoryDescription) {
      categoryDescription.textContent = category.description || `Browse our selection of ${category.name} products`;
    }
    
    // Update breadcrumbs
    const categoryBreadcrumbPath = document.getElementById('category-breadcrumb-path');
    if (categoryBreadcrumbPath) {
      categoryBreadcrumbPath.innerHTML = `
        <span>/</span>
        <a href="category.html">Categories</a>
        <span>/</span>
        <span>${category.name}</span>
      `;
    }
    
    // Load subcategories
    await loadSubcategories(category.id);
    
    // Load products in this category
    loadCategoryProducts(category.id); // Use the normalized ID from the category object
    
    // Track category view
    if (typeof Tracking !== 'undefined') {
      Tracking.trackEvent('category_view', {
        category_id: category.id,
        category_name: category.name
      });
    }
  } catch (error) {
    console.error('Error loading category details:', error);
    document.querySelector('.category-header').innerHTML = `
      <h1>Error</h1>
      <p>Failed to load category (ID: ${categoryId}). Please try again later.</p>
      <a href="index.html" class="btn secondary-btn">Back to Home</a>
    `;
  }
}

/**
 * Load subcategories for a parent category
 * @param {string} parentCategoryId - Parent category ID
 */
async function loadSubcategories(parentCategoryId) {
  try {
    console.log('Loading subcategories for parent ID:', parentCategoryId);
    
    // Get all categories
    const allCategories = await API.getCategories();
    
    // Filter subcategories (categories with parentCategoryId = current category id)
    const subcategories = allCategories.filter(cat => {
      // Handle various formats of parentCategoryId
      return cat.parentCategoryId === parentCategoryId ||
             cat.parentCategoryId === `"${parentCategoryId}"` ||
             `"${cat.parentCategoryId}"` === parentCategoryId;
    });
    
    console.log('Found subcategories:', subcategories);
    
    // Get category content container instead of sidebar
    const categoryContent = document.querySelector('.category-content');
    const productsContainer = document.getElementById('category-products');
    if (!categoryContent || !productsContainer) return;
    
    // Check if we have subcategories
    if (subcategories.length === 0) {
      return; // Skip displaying subcategories section
    }
    
    // Sort subcategories by name
    const sortedSubcategories = [...subcategories].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    // Create subcategories section
    const subcategoriesSection = document.createElement('div');
    subcategoriesSection.className = 'subcategories-section';
    
    // Add section header
    const sectionHeader = document.createElement('h3');
    sectionHeader.textContent = 'Subcategories';
    subcategoriesSection.appendChild(sectionHeader);
    
    // Create grid for subcategories
    const subcategoriesGrid = document.createElement('div');
    subcategoriesGrid.className = 'categories-grid';
    
    // Add each subcategory to the grid
    sortedSubcategories.forEach(subcat => {
      // Create placehoder image URL
      const imageUrl = subcat.imageUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(subcat.name)}`;
      
      // Create category card
      const categoryCard = document.createElement('div');
      categoryCard.className = 'category-card';
      categoryCard.innerHTML = `
        <img class="category-image" src="${imageUrl}" alt="${subcat.name}" loading="lazy">
        <div class="category-overlay">
          <h3 class="category-name">${subcat.name}</h3>
          <div class="category-count">${subcat.productCount || 0} Products</div>
        </div>
      `;
      
      // Add click event to navigate to the subcategory
      categoryCard.addEventListener('click', function() {
        window.location.href = `category.html?id=${subcat.id}`;
      });
      
      subcategoriesGrid.appendChild(categoryCard);
    });
    
    // Add grid to section
    subcategoriesSection.appendChild(subcategoriesGrid);
    
    // Insert subcategories section before products container
    categoryContent.insertBefore(subcategoriesSection, productsContainer);
    
  } catch (error) {
    console.error('Error loading subcategories:', error);
  }
}

/**
 * Load all categories when no specific category is selected
 */
async function loadAllCategories() {
  try {
    // Update page title
    document.title = 'All Categories - ShopNow';
    
    // Update breadcrumbs
    const breadcrumbPath = document.getElementById('category-breadcrumb-path');
    if (breadcrumbPath) {
      breadcrumbPath.innerHTML = `
        <span>/</span>
        <span>All Categories</span>
      `;
    }
    
    // Update category title
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle) {
      categoryTitle.textContent = 'All Categories';
    }
    
    // Update category description
    const categoryDescription = document.getElementById('category-description');
    if (categoryDescription) {
      categoryDescription.textContent = 'Browse all product categories';
    }
    
    // Hide sort controls as they're not needed for category listing
    const filterControls = document.querySelector('.filter-controls');
    if (filterControls) {
      filterControls.style.display = 'none';
    }
    
    // Hide subcategories sidebar
    const sidebar = document.querySelector('.category-sidebar');
    if (sidebar) {
      sidebar.style.display = 'none';
    }
    
    // Get all categories
    const categories = await API.getCategories();
    
    // Get container for products/categories
    const categoryProducts = document.getElementById('category-products');
    if (!categoryProducts) return;
    
    // Clear loading message
    const productsLoading = document.getElementById('products-loading');
    if (productsLoading) {
      productsLoading.style.display = 'none';
    }
    
    // Create category grid
    const categoriesGrid = document.createElement('div');
    categoriesGrid.className = 'categories-grid';
    
    // Sort categories by name
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add each category
    sortedCategories.forEach(category => {
      categoriesGrid.appendChild(Utils.createCategoryCard(category));
    });
    
    // Clear container and add categories
    categoryProducts.innerHTML = '';
    categoryProducts.appendChild(categoriesGrid);
    
    // Track categories view
    if (typeof Tracking !== 'undefined') {
      Tracking.trackEvent('all_categories_view', {
        count: categories.length
      });
    }
  } catch (error) {
    console.error('Error loading all categories:', error);
    const categoryProducts = document.getElementById('category-products');
    if (categoryProducts) {
      categoryProducts.innerHTML = `
        <div class="error-message">
          <p>Failed to load categories. Please try again later.</p>
          <a href="index.html" class="btn secondary-btn">Back to Home</a>
        </div>
      `;
    }
  }
}

/**
 * Load products for a category
 * @param {string} categoryId - Category ID
 * @param {string} sortBy - Sorting method
 */
async function loadCategoryProducts(categoryId, sortBy = 'default') {
  const productContainer = document.getElementById('category-products');
  if (!productContainer) return;
  
  try {
    // Show loading
    const productsLoading = document.getElementById('products-loading');
    if (productsLoading) {
      productsLoading.style.display = 'block';
    }
    
    // Get products in this category
    const products = await API.getProductsByCategory(categoryId);
    
    // Hide loading
    if (productsLoading) {
      productsLoading.style.display = 'none';
    }
    
    // Check if we have products
    if (!products || products.length === 0) {
      productContainer.innerHTML = `
        <div class="no-products">
          <p>No products found in this category.</p>
          <a href="index.html" class="btn secondary-btn">Continue Shopping</a>
        </div>
      `;
      
      // Hide the "no results" message if it exists
      const noResults = document.getElementById('no-results');
      if (noResults) {
        noResults.classList.remove('hidden');
      }
      
      return;
    }
    
    // Sort products if needed
    const sortedProducts = Utils.sortProducts(products, sortBy);
    
    // Clear container
    productContainer.innerHTML = '';
    
    // Add products section header
    const productsHeader = document.createElement('h3');
    productsHeader.className = 'products-section-header';
    productsHeader.textContent = 'Products';
    productContainer.appendChild(productsHeader);
    
    // Add product count
    const productCount = document.createElement('div');
    productCount.className = 'product-count';
    productCount.innerHTML = `<p>${products.length} ${products.length === 1 ? 'product' : 'products'} found</p>`;
    productContainer.appendChild(productCount);
    
    // Create products grid
    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';
    
    // Add products
    sortedProducts.forEach(product => {
      const productCard = Utils.createProductCard(product);
      if (productCard) {
        productsGrid.appendChild(productCard);
      }
    });
    
    // Add grid to container
    productContainer.appendChild(productsGrid);
    
    // Hide the "no results" message if it exists
    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.classList.add('hidden');
    }
    
    // Track product impressions
    if (typeof Tracking !== 'undefined') {
      Tracking.trackEvent('product_impressions', {
        product_ids: sortedProducts.map(p => p.id).join(','),
        count: sortedProducts.length,
        category_id: categoryId
      });
    }
  } catch (error) {
    console.error('Error loading category products:', error);
    
    // Hide loading
    const productsLoading = document.getElementById('products-loading');
    if (productsLoading) {
      productsLoading.style.display = 'none';
    }
    
    productContainer.innerHTML = `
      <div class="error-message">
        <p>Failed to load products. Please try again later.</p>
        <a href="index.html" class="btn secondary-btn">Back to Home</a>
      </div>
    `;
  }
}

/**
 * Load sponsored products for this category using Mirakl Ads
 * @param {string} categoryId - Category ID
 */
async function loadMiraklSponsoredProducts(categoryId) {
  try {
    // Get sponsored products data from Mirakl Ads for category page
    const sponsoredData = await MiraklAds.getCategoryPageSponsoredProducts(categoryId);
    
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
        category_id: categoryId,
        ad_unit_ids: adUnitIds,
        placement: 'category_page'
      });
    }
  } catch (error) {
    console.error('Error loading Mirakl sponsored products:', error);
    // Fallback to regular sponsored products if Mirakl Ads fails
    loadSponsoredProducts(categoryId);
  }
}

/**
 * Setup sorting functionality
 * @param {string} categoryId - Category ID
 */
function setupSorting(categoryId) {
  const sortSelect = document.getElementById('sort-by');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', () => {
    loadCategoryProducts(categoryId, sortSelect.value);
  });
}