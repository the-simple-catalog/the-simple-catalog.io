/**
 * Mirakl Ads Module
 * Handles the Mirakl Ads API integration for sponsored products
 */

const MiraklAds = (function() {
  // Configuration values
  let adServerBaseUrl = '';
  let publisherBearerToken = '';
  
  // Page IDs
  const PAGE_IDS = {
    HOMEPAGE: 1000,
    PRODUCT_PAGE: 1200,
    SEARCH_PAGE: 2000,
    CATEGORY_PAGE: 1400
  };
  
  // Cache for product data
  const productCache = {};
  
  // Session ID for user
  let sessionId = null;
  
  /**
   * Initialize the Mirakl Ads module
   * @param {Object} config - Configuration object
   */
  function init(config = {}) {
    // Set configuration values if provided
    if (config.adServerBaseUrl) {
      adServerBaseUrl = config.adServerBaseUrl;
    }
    
    if (config.publisherBearerToken) {
      publisherBearerToken = config.publisherBearerToken.startsWith('Bearer ') 
        ? config.publisherBearerToken 
        : `Bearer ${config.publisherBearerToken}`;
    }
    
    // Generate a session ID for this user if not already done
    sessionId = sessionId || generateSessionId();
    
    console.log('Mirakl Ads initialized with session ID:', sessionId);
    
    // Add event listeners to update config when site config changes
    window.addEventListener('config-updated', function(e) {
      updateConfig(e.detail);
    });
    
    // Get current config
    if (typeof Config !== 'undefined') {
      const currentConfig = Config.getConfig();
      updateConfig(currentConfig);
    }
  }
  
  /**
   * Update configuration from site config
   * @param {Object} siteConfig - Site configuration
   */
  function updateConfig(siteConfig) {
    if (siteConfig.miraklAdsUrl) {
      adServerBaseUrl = siteConfig.miraklAdsUrl;
    }
    
    if (siteConfig.miraklAdsToken) {
      publisherBearerToken = siteConfig.miraklAdsToken.startsWith('Bearer ') 
        ? siteConfig.miraklAdsToken 
        : `Bearer ${siteConfig.miraklAdsToken}`;
    }
  }
  
  /**
   * Generate a unique session ID for the user
   * @returns {string} UUID
   */
  function generateSessionId() {
    // Check if we already have a session ID in localStorage
    const storedId = localStorage.getItem('mirakl_session_id');
    if (storedId) {
      return storedId;
    }
    
    // Generate new UUID
    const uuid = 'user-' + Math.random().toString(36).substring(2, 15);
    
    // Store in localStorage
    localStorage.setItem('mirakl_session_id', uuid);
    
    return uuid;
  }
  
  /**
   * Get sponsored products for the homepage
   * @returns {Promise<Object>} - Promise resolving to sponsored products data
   */
  async function getHomepageSponsoredProducts() {
    try {
      return await fetchSponsoredProducts({
        pageId: PAGE_IDS.HOMEPAGE,
        userId: sessionId
      });
    } catch (error) {
      console.error('Error fetching homepage sponsored products:', error);
      // For demo/testing, fallback to regular products
      return await getFallbackSponsoredProducts('homepage');
    }
  }
  
  /**
   * Get sponsored products for a product page
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Promise resolving to sponsored products data
   */
  async function getProductPageSponsoredProducts(productId) {
    try {
      return await fetchSponsoredProducts({
        pageId: PAGE_IDS.PRODUCT_PAGE,
        userId: sessionId,
        productId: productId
      });
    } catch (error) {
      console.error('Error fetching product page sponsored products:', error);
      // For demo/testing, fallback to regular products
      return await getFallbackSponsoredProducts('productPage');
    }
  }
  
  /**
   * Get sponsored products for a search page
   * @param {string} keywords - Search keywords
   * @returns {Promise<Object>} - Promise resolving to sponsored products data
   */
  async function getSearchPageSponsoredProducts(keywords) {
    try {
      return await fetchSponsoredProducts({
        pageId: PAGE_IDS.SEARCH_PAGE,
        userId: sessionId,
        keywords: keywords
      });
    } catch (error) {
      console.error('Error fetching search page sponsored products:', error);
      // For demo/testing, fallback to regular products
      return await getFallbackSponsoredProducts('searchPage');
    }
  }
  
  /**
   * Get sponsored products for a category page
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Promise resolving to sponsored products data
   */
  async function getCategoryPageSponsoredProducts(categoryId) {
    try {
      return await fetchSponsoredProducts({
        pageId: PAGE_IDS.CATEGORY_PAGE,
        userId: sessionId,
        categoryId: categoryId
      });
    } catch (error) {
      console.error('Error fetching category page sponsored products:', error);
      // For demo/testing, fallback to regular products
      return await getFallbackSponsoredProducts('categoryPage');
    }
  }
  
  /**
   * Fetch sponsored products from the Mirakl Ads API
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Promise resolving to sponsored products data
   */
  async function fetchSponsoredProducts(params) {
    // If no token, use mock data
    if (!publisherBearerToken || publisherBearerToken === 'Bearer ') {
      console.log('Using mock data (no token provided)');
      return await getMockData();
    }
    
    // Build request URL and body
    // Ensure the URL ends with /ads/v1 path
    const targetUrl = adServerBaseUrl.endsWith('/ads/v1') 
      ? adServerBaseUrl 
      : `${adServerBaseUrl}/ads/v1`;
    
    // Use proxy service to avoid CORS issues
    const proxyUrl = `https://proxycors-8kgt.onrender.com/proxy?url=${encodeURIComponent(targetUrl)}`;
    
    const body = JSON.stringify(params);
    
    console.log('Making API request to Mirakl Ads:', targetUrl);
    console.log('Using proxy URL to avoid CORS issues:', proxyUrl);
    console.log('Request parameters:', params);
    
    // Make API request
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': publisherBearerToken
        },
        body: body
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      return data;
    } catch (error) {
      console.error('Error calling Mirakl Ads API:', error);
      throw error;
    }
  }
  
  /**
   * Get mock data from mirakl_ads.json
   * @returns {Promise<Object>} - Promise resolving to mock data
   */
  async function getMockData() {
    try {
      console.log('Fetching mock data from mirakl_ads.json');
      const response = await fetch('data/mirakl_ads.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch mock data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Mock data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching mock data:', error);
      // Return minimal mock structure
      return {
        pageId: 1200,
        productAds: [],
        display: []
      };
    }
  }
  
  /**
   * Get fallback sponsored products when API fails
   * @param {string} pageType - Page type
   * @returns {Promise<Object>} - Promise resolving to fallback data
   */
  async function getFallbackSponsoredProducts(pageType) {
    // Try to get mock data first
    try {
      return await getMockData();
    } catch (mockError) {
      console.error('Error getting mock data:', mockError);
      
      // If mock data fails, generate fallback structure with regular products
      const products = await API.getSponsoredProducts(4);
      
      let pageId;
      switch (pageType) {
        case 'homepage':
          pageId = PAGE_IDS.HOMEPAGE;
          break;
        case 'productPage':
          pageId = PAGE_IDS.PRODUCT_PAGE;
          break;
        case 'searchPage':
          pageId = PAGE_IDS.SEARCH_PAGE;
          break;
        case 'categoryPage':
          pageId = PAGE_IDS.CATEGORY_PAGE;
          break;
        default:
          pageId = PAGE_IDS.HOMEPAGE;
      }
      
      // Convert regular products to sponsored product format
      const adProducts = products.map(product => ({
        id: product.id,
        type: 'PRODUCT',
        adId: `mock-ad-${product.id}`,
        productId: product.id
      }));
      
      return {
        pageId: pageId,
        productAds: [{
          adUnitId: `${pageId}-fallback-1`,
          index: 1,
          adUnitSize: adProducts.length,
          products: adProducts
        }],
        display: []
      };
    }
  }
  
  /**
   * Create a sponsored products ad unit
   * @param {Object} adUnit - Ad unit data from the API
   * @returns {HTMLElement} - HTML element for the ad unit
   */
  async function createAdUnit(adUnit) {
    if (!adUnit || !adUnit.products || adUnit.products.length === 0) {
      console.log('Empty ad unit, skipping:', adUnit);
      return null;
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = 'ad-unit';
    container.dataset.adUnitId = adUnit.adUnitId;
    
    // Add header with "Ads sponsored" label
    const header = document.createElement('div');
    header.className = 'ad-unit-header';
    header.innerHTML = '<span class="ad-unit-sponsored-label">Ads sponsored</span>';
    container.appendChild(header);
    
    // Create grid for products
    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';
    container.appendChild(productsGrid);
    
    // If there are no products or not enough to fill the unit, get regular products
    const sponsoredProducts = adUnit.products || [];
    let regularProducts = [];
    
    if (sponsoredProducts.length < adUnit.adUnitSize) {
      // Calculate how many regular products we need
      const regularCount = adUnit.adUnitSize - sponsoredProducts.length;
      regularProducts = await API.getSponsoredProducts(regularCount);
    }
    
    // Render sponsored products first
    for (const sponsoredProduct of sponsoredProducts) {
      try {
        console.log('Getting product details for:', sponsoredProduct);
        
        // Get product ID - might be in either id or productId field
        const productId = sponsoredProduct.productId || sponsoredProduct.id;
        
        // Get full product details
        const product = await API.getProductById(productId);
        
        if (product) {
          // Enhance product with sponsored data
          product.isSponsored = true;
          product.sponsoredData = sponsoredProduct;
          
          // Render product
          const productElement = Utils.createProductCard(product, true);
          
          if (productElement) {
            productsGrid.appendChild(productElement);
          }
        } else {
          console.warn(`Product not found for ID: ${productId}`);
        }
      } catch (error) {
        console.error(`Error rendering sponsored product:`, error);
      }
    }
    
    // Fill remaining slots with regular products
    for (const product of regularProducts) {
      try {
        const productElement = Utils.createProductCard(product, false);
        
        if (productElement) {
          productsGrid.appendChild(productElement);
        }
      } catch (error) {
        console.error(`Error rendering regular product ${product.id}:`, error);
      }
    }
    
    return container;
  }

  /**
   * Create a display ad element based on the provided display ad data
   * @param {Object} displayAd - The display ad data from the API
   * @returns {HTMLElement} - HTML element for the display ad
   */
  function createDisplayAd(displayAd) {
    if (!displayAd || !displayAd.adUnitId) {
      console.log('Invalid display ad, skipping:', displayAd);
      return null;
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = 'display-ad-unit';
    container.dataset.adUnitId = displayAd.adUnitId;
    
    // Check if this is a reserved deal
    const isReserved = displayAd.adUnitId.toLowerCase().includes('reserved');
    
    // Add reserved badge if applicable
    if (isReserved) {
      const reservedBadge = document.createElement('div');
      reservedBadge.className = 'reserved-deal-badge';
      reservedBadge.textContent = 'Reserved Deal';
      container.appendChild(reservedBadge);
    }
    
    // Add header with ad format information
    const header = document.createElement('div');
    header.className = 'display-ad-header';
    
    const formatLabel = document.createElement('div');
    formatLabel.className = 'display-ad-format';
    formatLabel.textContent = `Format: ${displayAd.creativeFormat || 'Unknown'}`;
    
    const idLabel = document.createElement('div');
    idLabel.className = 'display-ad-id';
    idLabel.textContent = `Ad Unit ID: ${displayAd.adUnitId}`;
    
    header.appendChild(formatLabel);
    header.appendChild(idLabel);
    container.appendChild(header);
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'display-ad-content';
    
    // Handle different creative formats
    const format = displayAd.creativeFormat;
    
    if ((format === 'SPONSORED_BRAND_IMAGE' || format === 'BANNER_IMAGE') && 
        displayAd.creativeSet && displayAd.creativeSet.asset && displayAd.creativeSet.asset.url) {
      // For SPONSORED_BRAND_IMAGE and BANNER_IMAGE formats - display the asset directly
      const imgUrl = displayAd.creativeSet.asset.url;
      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `${format} Ad`;
      img.className = 'display-ad-image';
      content.appendChild(img);
      
      // If there are associated products (for SPONSORED_BRAND_IMAGE)
      if (format === 'SPONSORED_BRAND_IMAGE' && displayAd.products && displayAd.products.length > 0) {
        const productsLabel = document.createElement('div');
        productsLabel.className = 'display-ad-products-label';
        productsLabel.textContent = `Associated Products: ${displayAd.products.length}`;
        content.appendChild(productsLabel);
      }
    } else if (format === 'NATIVE_BANNER' && displayAd.creativeSet && displayAd.creativeSet.attributes) {
      // For NATIVE_BANNER format - handle dynamic attributes
      const attributes = displayAd.creativeSet.attributes;
      const attributesContainer = document.createElement('div');
      attributesContainer.className = 'native-banner-attributes';
      
      // Process each attribute
      for (const [key, value] of Object.entries(attributes)) {
        // If attribute is an object with url property, it's a media asset
        if (value && typeof value === 'object' && value.url) {
          const img = document.createElement('img');
          img.src = value.url;
          img.alt = `${key} image`;
          img.className = 'display-ad-image';
          attributesContainer.appendChild(img);
        } else if (value !== null && value !== undefined) {
          // For non-media attributes, display as key-value pair
          const attrElement = document.createElement('div');
          attrElement.className = 'attribute-pair';
          
          const keyElement = document.createElement('span');
          keyElement.className = 'attribute-key';
          keyElement.textContent = key + ': ';
          
          const valueElement = document.createElement('span');
          valueElement.className = 'attribute-value';
          valueElement.textContent = value.toString();
          
          attrElement.appendChild(keyElement);
          attrElement.appendChild(valueElement);
          attributesContainer.appendChild(attrElement);
        }
      }
      
      content.appendChild(attributesContainer);
    } else {
      // For other formats or when creative content is missing
      const placeholderText = document.createElement('div');
      placeholderText.className = 'display-ad-placeholder';
      placeholderText.textContent = `[${displayAd.creativeFormat || 'Unknown Format'} Ad]`;
      
      // Add additional info if available
      if (displayAd.adId) {
        const adIdInfo = document.createElement('div');
        adIdInfo.className = 'display-ad-info';
        adIdInfo.textContent = `Ad ID: ${displayAd.adId}`;
        placeholderText.appendChild(adIdInfo);
      }
      
      content.appendChild(placeholderText);
    }
    
    container.appendChild(content);
    
    // Add footer with "Sponsored" label
    const footer = document.createElement('div');
    footer.className = 'display-ad-footer';
    footer.innerHTML = '<span class="display-ad-sponsored-label">Ads sponsored</span>';
    
    // If we have a digitalServiceAct object, add transparency info
    if (displayAd.digitalServiceAct) {
      const dsa = displayAd.digitalServiceAct;
      if (dsa.behalf) {
        const dsaInfo = document.createElement('div');
        dsaInfo.className = 'dsa-info';
        dsaInfo.textContent = `On behalf of: ${dsa.behalf}`;
        footer.appendChild(dsaInfo);
      }
    }
    
    container.appendChild(footer);
    
    // Make container clickable if redirectionUrl is available
    if (displayAd.redirectionUrl) {
      container.style.cursor = 'pointer';
      container.addEventListener('click', function(e) {
        // Don't trigger if clicking on a link inside the ad
        if (e.target.tagName !== 'A') {
          window.open(displayAd.redirectionUrl, '_blank');
        }
      });
    }
    
    return container;
  }
  
  /**
   * Render display ads in the retail media section
   * @param {Array} displayAds - Display ads data from the API
   * @param {string} containerSelector - CSS selector for the container
   */
  function renderDisplayAds(displayAds, containerSelector) {
    if (!displayAds || !displayAds.length || !containerSelector) {
      console.log('No display ads to render or container selector not provided');
      return;
    }
    
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error(`Container not found: ${containerSelector}`);
      return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    console.log('Rendering display ads:', displayAds);
    
    // Create "Retail Media" section title
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = 'Retail Media';
    container.appendChild(sectionTitle);
    
    // Create a grid for display ads
    const displayAdsGrid = document.createElement('div');
    displayAdsGrid.className = 'display-ads-grid';
    container.appendChild(displayAdsGrid);
    
    // Render each display ad
    displayAds.forEach(displayAd => {
      try {
        const displayAdElement = createDisplayAd(displayAd);
        if (displayAdElement) {
          displayAdsGrid.appendChild(displayAdElement);
        }
      } catch (error) {
        console.error(`Error rendering display ad:`, error);
      }
    });
    
    // If no display ads were rendered, hide the container
    if (!displayAdsGrid.children.length) {
      container.style.display = 'none';
    } else {
      container.style.display = 'block';
    }
  }

  /**
   * Render all ad units for a page
   * @param {Object} adsData - Response data from the API
   * @param {string} containerSelector - CSS selector for the product ads container
   * @param {string} displayContainerSelector - CSS selector for the display ads container
   */
  async function renderAdUnits(adsData, containerSelector, displayContainerSelector) {
    if (!adsData) {
      console.error('Missing required data for rendering ad units');
      return;
    }
    
    // Render product ads if available
    if (adsData.productAds && containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) {
        console.error(`Container not found: ${containerSelector}`);
      } else {
        // Clear the container
        container.innerHTML = '';
        
        console.log('Rendering product ad units:', adsData.productAds);
        
        // Render each ad unit
        for (const adUnit of adsData.productAds) {
          try {
            const adUnitElement = await createAdUnit(adUnit);
            if (adUnitElement) {
              container.appendChild(adUnitElement);
            }
          } catch (error) {
            console.error(`Error rendering ad unit:`, error);
          }
        }
        
        // If no ad units were rendered, hide the container
        if (!container.children.length) {
          container.style.display = 'none';
        } else {
          container.style.display = 'block';
        }
      }
    }
    
    // Render display ads if available
    if (adsData.display && adsData.display.length > 0 && displayContainerSelector) {
      renderDisplayAds(adsData.display, displayContainerSelector);
    }
  }
  
  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);
  
  return {
    init,
    getHomepageSponsoredProducts,
    getProductPageSponsoredProducts,
    getSearchPageSponsoredProducts,
    getCategoryPageSponsoredProducts,
    renderAdUnits,
    renderDisplayAds
  };
})(); 