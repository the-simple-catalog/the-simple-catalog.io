/**
 * Product Detail Page JavaScript
 * Handles functionality specific to the product detail page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get product ID from URL
  const productId = Utils.getUrlParam('id');
  
  // Page identifier for tracking
  const PAGE_ID = `product-${productId}`;
  
  // Initialize
  if (productId) {
    // Initialize categories menu
    initCategories();
    
    // Initialize Mirakl Ads
    MiraklAds.init();
    
    // Load product details
    loadProductDetails(productId);
    
    // Load sponsored products using Mirakl Ads
    loadMiraklSponsoredProducts(productId);
    
    // Setup quantity controls
    setupQuantityControls();
    
    // Setup add to cart button
    setupAddToCartButton(productId);
  } else {
    // No product ID provided, redirect to home
    window.location.href = 'index.html';
  }
  
  /**
   * Initialize categories in the navigation menu
   */
  function initCategories() {
    const categoriesMenu = document.getElementById('categories-menu');
    if (!categoriesMenu) return;
    
    // Show loading indicator
    Utils.showLoading(categoriesMenu);
    
    // Fetch categories
    API.getCategories()
      .then(categories => {
        // Load categories into menu
        Utils.loadCategoriesMenu(categories);
        
        // Hide loading indicator
        Utils.showLoading(categoriesMenu, false);
      })
      .catch(error => {
        console.error('Error loading categories:', error);
        Utils.showLoading(categoriesMenu, false);
        Utils.showError(categoriesMenu, 'Failed to load categories. Please try again later.');
      });
  }
  
  /**
   * Load product details
   * @param {string} productId - Product ID
   */
  function loadProductDetails(productId) {
    // Show loading indicator
    const productLoading = document.getElementById('product-loading');
    if (productLoading) {
      productLoading.style.display = 'block';
    }
    
    // Fetch product details
    API.getProductById(productId)
      .then(product => {
        if (product) {
          // Update page title
          document.title = `${product.name} - ShopNow`;
          
          // Update product details
          updateProductDetails(product);
          
          // Track product view
          if (typeof Tracking !== 'undefined') {
            Tracking.trackEvent('product_view', {
              product_id: product.id,
              product_name: product.name
            });
          }
          
          // Get category details to update breadcrumbs
          if (product.categoryId) {
            updateCategoryBreadcrumb(product.categoryId);
          }
        } else {
          console.error('Product not found');
          if (productLoading) {
            productLoading.innerHTML = '<p class="error-message">Product not found</p>';
          }
        }
        
        // Hide loading indicator
        if (productLoading) {
          productLoading.style.display = 'none';
        }
      })
      .catch(error => {
        console.error('Error loading product details:', error);
        if (productLoading) {
          productLoading.innerHTML = '<p class="error-message">Failed to load product details. Please try again later.</p>';
        }
      });
  }
  
  /**
   * Update product details in the UI
   * @param {Object} product - Product data
   */
  function updateProductDetails(product) {
    // Update main product image
    const mainImage = document.getElementById('product-main-image');
    if (mainImage) {
      mainImage.src = product.imageUrl || 'https://via.placeholder.com/500';
      mainImage.alt = product.name;
    }
    
    // Update product thumbnails
    const thumbnailsContainer = document.getElementById('product-thumbnails');
    if (thumbnailsContainer) {
      // For now, just create a thumbnail of the main image
      thumbnailsContainer.innerHTML = `
        <div class="thumbnail active">
          <img src="${product.imageUrl}" alt="${product.name}">
        </div>
      `;
    }
    
    // Update product title
    const productTitle = document.getElementById('product-title');
    if (productTitle) {
      productTitle.textContent = product.name;
    }
    
    // Update product brand
    const productBrand = document.getElementById('product-brand');
    if (productBrand) {
      productBrand.textContent = product.brand || '';
    }
    
    // Update product price
    const productPrice = document.getElementById('product-price');
    if (productPrice) {
      productPrice.textContent = Utils.formatPrice(product.price);
    }
    
    // Update product rating
    const productRating = document.getElementById('product-rating');
    if (productRating) {
      const starsContainer = productRating.querySelector('.stars');
      if (starsContainer) {
        starsContainer.innerHTML = Utils.generateStarRating(product.rating);
      }
      
      const reviewsCount = productRating.querySelector('.reviews-count');
      if (reviewsCount) {
        reviewsCount.textContent = `(${product.reviewsCount || 0} reviews)`;
      }
    }
    
    // Update product description
    const productDescription = document.getElementById('product-description');
    if (productDescription) {
      productDescription.innerHTML = `<p>${product.description || 'No description available.'}</p>`;
    }
    
    // Update product meta data
    const productSku = document.getElementById('product-sku');
    if (productSku) {
      productSku.textContent = product.id || 'N/A';
    }
    
    const productEan = document.getElementById('product-ean');
    if (productEan) {
      productEan.textContent = product.ean || 'N/A';
    }
    
    // Update product details tab content
    const productDetailsContent = document.getElementById('product-details-content');
    if (productDetailsContent) {
      productDetailsContent.innerHTML = product.description || 
        '<p>This product doesn\'t have detailed information available.</p>';
    }
    
    // Update product specifications tab content
    const productSpecsContent = document.getElementById('product-specs-content');
    if (productSpecsContent) {
      let specsHtml = '<table class="specs-table">';
      
      specsHtml += `<tr><td><strong>SKU</strong></td><td>${product.id || 'N/A'}</td></tr>`;
      specsHtml += `<tr><td><strong>Brand</strong></td><td>${product.brand || 'N/A'}</td></tr>`;
      specsHtml += `<tr><td><strong>EAN</strong></td><td>${product.ean || 'N/A'}</td></tr>`;
      
      if (product.category1Name) {
        specsHtml += `<tr><td><strong>Category</strong></td><td>${product.category1Name}</td></tr>`;
      }
      
      specsHtml += '</table>';
      
      productSpecsContent.innerHTML = specsHtml;
    }
  }
  
  /**
   * Update category information in breadcrumb
   * @param {string} categoryId - Category ID
   */
  function updateCategoryBreadcrumb(categoryId) {
    API.getCategoryById(categoryId)
      .then(category => {
        if (category) {
          const breadcrumbPath = document.getElementById('product-breadcrumb-path');
          if (breadcrumbPath) {
            breadcrumbPath.innerHTML = `
              <span>/</span>
              <a href="category.html?id=${category.id}">${category.name}</a>
              <span>/</span>
              <span id="current-product">${document.getElementById('product-title').textContent}</span>
            `;
          }
        }
      })
      .catch(error => {
        console.error('Error loading category for breadcrumb:', error);
      });
  }
  
  /**
   * Load sponsored products (cross-sell) using Mirakl Ads API
   * @param {string} productId - Product ID
   */
  async function loadMiraklSponsoredProducts(productId) {
    try {
      // Get sponsored products data from Mirakl Ads for product page
      const sponsoredData = await MiraklAds.getProductPageSponsoredProducts(productId);
      
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
          product_id: productId,
          ad_unit_ids: adUnitIds,
          placement: 'product_page_crosssell'
        });
      }
    } catch (error) {
      console.error('Error loading Mirakl sponsored products:', error);
      // Fallback to regular sponsored products if Mirakl Ads fails
      loadSponsoredProducts(productId);
    }
  }
  
  /**
   * Setup quantity controls
   */
  function setupQuantityControls() {
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('quantity');
    
    if (decreaseBtn && increaseBtn && quantityInput) {
      // Decrease quantity
      decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value, 10) || 1;
        const newValue = Math.max(1, currentValue - 1);
        quantityInput.value = newValue;
      });
      
      // Increase quantity
      increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value, 10) || 1;
        const newValue = currentValue + 1;
        quantityInput.value = newValue;
      });
      
      // Ensure input is valid
      quantityInput.addEventListener('change', () => {
        const currentValue = parseInt(quantityInput.value, 10);
        if (isNaN(currentValue) || currentValue < 1) {
          quantityInput.value = 1;
        }
      });
    }
  }
  
  /**
   * Setup add to cart button
   * @param {string} productId - Product ID
   */
  function setupAddToCartButton(productId) {
    const addToCartBtn = document.getElementById('add-to-cart');
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', () => {
      const quantityInput = document.getElementById('quantity');
      const quantity = parseInt(quantityInput?.value || '1', 10);
      
      // Get product details and add to cart
      API.getProductById(productId)
        .then(product => {
          if (product) {
            // Add to cart
            Cart.addItem(product, quantity);
            
            // Show confirmation
            showAddToCartConfirmation(product, quantity);
            
            // Track add to cart event
            if (typeof Tracking !== 'undefined') {
              Tracking.trackEvent('add_to_cart', {
                product_id: productId,
                quantity: quantity
              });
            }
          } else {
            console.error('Product not found');
            alert('Failed to add item to cart. Product not found.');
          }
        })
        .catch(error => {
          console.error('Error adding to cart:', error);
          alert('Failed to add item to cart. Please try again.');
        });
    });
  }
  
  /**
   * Show add to cart confirmation
   * @param {Object} product - Product object
   * @param {number} quantity - Quantity added
   */
  function showAddToCartConfirmation(product, quantity) {
    // Show confirmation modal
    const confirmationContent = document.getElementById('cart-confirmation-content');
    const confirmationModal = document.getElementById('cart-confirmation-modal');
    
    if (confirmationContent && confirmationModal) {
      confirmationContent.innerHTML = `
        <div class="cart-confirmation-item">
          <img src="${product.imageUrl || 'https://via.placeholder.com/80'}" alt="${product.name}">
          <div class="cart-confirmation-details">
            <h3>${product.name}</h3>
            <p>Quantity: ${quantity}</p>
            <p>Price: ${Utils.formatPrice(product.price * quantity)}</p>
          </div>
        </div>
      `;
      
      // Show modal
      confirmationModal.style.display = 'block';
      
      // Setup close button
      const closeBtn = document.getElementById('close-cart-confirmation');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          confirmationModal.style.display = 'none';
        });
      }
      
      // Setup continue shopping button
      const continueBtn = document.getElementById('continue-shopping');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          confirmationModal.style.display = 'none';
        });
      }
    } else {
      // Fallback: show alert
      alert(`Added ${quantity} ${product.name} to cart.`);
    }
  }
}); 