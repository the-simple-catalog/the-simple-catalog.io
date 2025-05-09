/**
 * Home Page JavaScript
 * Handles functionality specific to the home/index page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Page identifier for tracking
  const PAGE_ID = 'home';
  
  // Initialize categories menu
  initCategories();
  
  // Load popular categories
  loadPopularCategories();
  
  // Load featured products
  loadFeaturedProducts();
  
  // Initialize MiraklAds and load sponsored products
  MiraklAds.init();
  loadMiraklSponsoredProducts();
  
  /**
   * Initialize categories in the navigation menu
   */
  function initCategories() {
    // Fetch categories
    API.getCategories()
      .then(categories => {
        // Load categories into menu
        Utils.loadCategoriesMenu(categories);
      })
      .catch(error => {
        console.error('Error loading categories:', error);
      });
  }
  
  /**
   * Load featured categories into the featured categories section
   */
  async function loadFeaturedCategories() {
    const featuredCategoriesGrid = document.getElementById('featured-categories-grid');
    if (!featuredCategoriesGrid) return;
    
    try {
      // Show loading
      Utils.showLoading('featured-categories-grid', 'Loading categories...');
      
      // Get all categories
      const categories = await API.getCategories();
      
      // Sort categories by product count and take top 6
      const featuredCategories = categories
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 6);
        
      // Clear loading
      Utils.hideLoading('featured-categories-grid');
      
      // If no categories found, show message
      if (featuredCategories.length === 0) {
        featuredCategoriesGrid.innerHTML = '<p>No categories found</p>';
        return;
      }
      
      // Add categories to grid
      featuredCategories.forEach(category => {
        const categoryCard = Utils.createCategoryCard(category);
        featuredCategoriesGrid.appendChild(categoryCard);
      });
      
      // Track category impressions
      if (typeof Tracking !== 'undefined') {
        Tracking.trackEvent('category_impressions', {
          count: featuredCategories.length,
          category_ids: featuredCategories.map(c => c.id).join(',')
        });
      }
    } catch (error) {
      console.error('Error loading featured categories:', error);
      Utils.showError('featured-categories-grid', 'Failed to load categories. Please try again later.');
    }
  }
  
  /**
   * Load featured products into the featured products section
   */
  async function loadFeaturedProducts() {
    const featuredProductsGrid = document.getElementById('featured-products-grid');
    if (!featuredProductsGrid) return;
    
    try {
      // Show loading
      const productsLoading = document.getElementById('products-loading');
      if (productsLoading) {
        productsLoading.style.display = 'block';
      }
      
      // Get all products
      const allProducts = await API.getProducts();
      
      // Get 4 products with highest ratings as featured products
      const featuredProducts = allProducts
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      
      // Clear loading
      if (productsLoading) {
        productsLoading.style.display = 'none';
      }
      
      // If no products found, show message
      if (featuredProducts.length === 0) {
        featuredProductsGrid.innerHTML = '<p>No featured products found</p>';
        return;
      }
      
      // Clear grid before adding products
      featuredProductsGrid.innerHTML = '';
      
      // Add products to grid
      featuredProducts.forEach(product => {
        const productCard = Utils.createProductCard(product);
        featuredProductsGrid.appendChild(productCard);
      });
      
      // Track product impressions
      if (typeof Tracking !== 'undefined') {
        Tracking.trackEvent('product_impressions', {
          product_ids: featuredProducts.map(p => p.id).join(','),
          count: featuredProducts.length,
          placement: 'featured_products'
        });
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
      featuredProductsGrid.innerHTML = '<p class="error-message">Failed to load featured products. Please try again later.</p>';
    }
  }
  
  /**
   * Load sponsored products from Mirakl Ads API
   */
  async function loadMiraklSponsoredProducts() {
    try {
      // Get sponsored products data from Mirakl Ads for homepage
      const sponsoredData = await MiraklAds.getHomepageSponsoredProducts();
      
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
          ad_unit_ids: adUnitIds,
          placement: 'homepage'
        });
      }
    } catch (error) {
      console.error('Error loading Mirakl sponsored products:', error);
      // Fallback to regular sponsored products if Mirakl Ads fails
      loadSponsoredProducts();
    }
  }
  
  /**
   * Load popular categories
   */
  function loadPopularCategories() {
    const popularCategoriesGrid = document.getElementById('popular-categories-grid');
    if (!popularCategoriesGrid) return;
    
    // Show loading indicator
    const categoriesLoading = document.getElementById('categories-loading');
    if (categoriesLoading) {
      categoriesLoading.style.display = 'block';
    }
    
    // Fetch root categories first
    API.getRootCategories()
      .then(rootCategories => {
        // Hide loading indicator
        if (categoriesLoading) {
          categoriesLoading.style.display = 'none';
        }
        
        console.log('Loading popular categories from root categories:', rootCategories);
        
        if (rootCategories && rootCategories.length > 0) {
          // Clear container
          popularCategoriesGrid.innerHTML = '';
          
          // Sort by product count
          const sortedCategories = [...rootCategories].sort((a, b) => b.productCount - a.productCount);
          
          // Limit to top categories
          const topCategories = sortedCategories.slice(0, 4);
          console.log('Top categories selected:', topCategories.map(c => c.name));
          
          // Add each category
          topCategories.forEach(category => {
            if (!category || !category.name) {
              console.warn('Found invalid category:', category);
              return;
            }
            popularCategoriesGrid.appendChild(Utils.createCategoryCard(category));
          });
          
          // Track category impressions
          if (typeof Tracking !== 'undefined') {
            Tracking.trackEvent('category_impressions', {
              count: topCategories.length,
              category_ids: topCategories.map(c => c.id).join(','),
              placement: 'popular_categories'
            });
          }
        } else {
          // Fallback to all categories if no root categories
          API.getCategories()
            .then(allCategories => {
              if (allCategories && allCategories.length > 0) {
                // Clear container
                popularCategoriesGrid.innerHTML = '';
                
                // Sort by product count
                const sortedCategories = [...allCategories].sort((a, b) => b.productCount - a.productCount);
                
                // Limit to top categories
                const topCategories = sortedCategories.slice(0, 4);
                
                // Add each category
                topCategories.forEach(category => {
                  popularCategoriesGrid.appendChild(Utils.createCategoryCard(category));
                });
              } else {
                popularCategoriesGrid.innerHTML = '<p class="no-categories">No categories available.</p>';
              }
            })
            .catch(error => {
              console.error('Error loading all categories:', error);
              popularCategoriesGrid.innerHTML = '<p class="error-message">Failed to load categories.</p>';
            });
        }
      })
      .catch(error => {
        console.error('Error loading root categories:', error);
        if (categoriesLoading) {
          categoriesLoading.style.display = 'none';
        }
        
        // Fallback to all categories
        API.getCategories()
          .then(categories => {
            if (categories && categories.length > 0) {
              // Clear container
              popularCategoriesGrid.innerHTML = '';
              
              // Sort by product count and take top 4
              const topCategories = categories
                .sort((a, b) => b.productCount - a.productCount)
                .slice(0, 4);
                
              // Add each category
              topCategories.forEach(category => {
                popularCategoriesGrid.appendChild(Utils.createCategoryCard(category));
              });
            } else {
              popularCategoriesGrid.innerHTML = '<p class="no-categories">No categories available.</p>';
            }
          })
          .catch(err => {
            console.error('Error in fallback category loading:', err);
            popularCategoriesGrid.innerHTML = '<p class="error-message">Failed to load categories. Please try again later.</p>';
          });
      });
  }
}); 