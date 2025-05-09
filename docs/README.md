# ShopNow E-commerce Demo

A demo e-commerce store built with vanilla JavaScript, HTML, and CSS to demonstrate technical functionality.

## Features

- Browse products by category
- View product details
- Add products to cart
- Search for products
- Responsive design

## Project Structure

```
demome/
├── css/
│   └── styles.css            # Main stylesheet
├── js/
│   ├── api.js                # API and data handling
│   ├── cart.js               # Shopping cart functionality
│   ├── category.js           # Category page logic
│   ├── config.js             # Site configuration
│   ├── home.js               # Homepage logic
│   ├── mirakl-ads.js         # Mirakl Ads integration
│   ├── product.js            # Product page logic
│   ├── search.js             # Search functionality
│   ├── tracking.js           # Analytics tracking
│   └── utils.js              # Utility functions
├── data/
│   ├── catalog_categories_en.csv  # Category catalog
│   ├── catalog_products_en.csv    # Product catalog
│   └── mirakl_ads.json       # Mock data for Mirakl Ads
├── index.html                # Homepage
├── product.html              # Product detail page
├── category.html             # Category listing page
├── search.html               # Search results page
└── cart.html                 # Shopping cart page
```

## Setup

1. Clone the repository
2. Open `index.html` in your browser or serve it using a local HTTP server

To serve using Python's built-in HTTP server:
```
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## API Functionality

The application loads product and category data from CSV files in the `data` directory. It includes:

- Product browsing
- Category navigation
- Product search
- Cart management
- Mirakl Ads integration for sponsored products

## Data Retrieval

The application uses different approaches for retrieving data:

### Product & Category Data

Product and category data are loaded from CSV files in the `data` directory:

- `catalog_products_en.csv` - Contains all product information
- `catalog_categories_en.csv` - Contains category hierarchy information

The loading and parsing logic is implemented in `js/api.js`:

1. **CSV Data Loading**:
   - The `fetchCSV()` function loads CSV data using fetch API
   - The `parseCSV()` function converts CSV text to JavaScript objects
   - Data is cached in memory after first load to improve performance

2. **Data Formatting**:
   - `formatProduct()` processes raw product data into formatted objects
   - `formatCategory()` standardizes category data structure

3. **API Functions**:
   - `getProducts()` - Fetches all products
   - `getCategories()` - Fetches all categories
   - `getRootCategories()` - Gets top-level categories
   - `getProductById()` - Fetches a specific product
   - `getProductsByCategory()` - Gets products for a category
   - `searchProducts()` - Searches products by keyword

### Sponsored Products & Display Media

Sponsored products and display ads are managed by the Mirakl Ads integration:

1. **API Connectivity**:
   - Real API calls are made to the Mirakl Ads API when a token is provided
   - Requests are sent to the configured endpoint
   - Each page type uses a different pageId (home: 1000, product: 1200, search: 2000, category: 1400)

2. **Fallback System**:
   - If no token is provided, the system falls back to mock data
   - Mock data is stored in `data/mirakl_ads.json`
   - The structure includes both product ads and display media ads

3. **Response Structure**:
   - Responses contain `productAds` (sponsored products) and `display` (retail media) arrays
   - Each ad unit has a unique `adUnitId` and specific properties based on ad type

## Customizing Data Sources

To modify how data is retrieved, you can customize the following components:

### Switching to a JSON API for Catalog

To change product and category data to come from a JSON API instead of CSV files:

1. Modify `js/api.js` to use a different data source:

```javascript
// Replace these constants
const API_BASE_URL = 'https://your-api-endpoint.com/api';
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/products`;
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;

// Replace fetchCSV with fetchJSON
async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching JSON:', error);
    throw error;
  }
}

// Update getProducts() function
async function getProducts() {
  if (cache.products) {
    return cache.products;
  }

  try {
    const productsData = await fetchJSON(PRODUCTS_ENDPOINT);
    cache.products = productsData.map(formatProduct);
    
    // Build lookup maps
    cache.products.forEach(product => {
      cache.productsById[product.id] = product;
    });
    
    // Update category product counts
    updateCategoryProductCounts();
    
    return cache.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    cache.products = [];
    return cache.products;
  }
}

// Similarly update getCategories() and other functions
```

2. Adjust the data formatting functions (`formatProduct()`, `formatCategory()`) to match your JSON API's structure.

### Customizing Mirakl Ads Integration

To modify how sponsored ads are retrieved:

1. Change the API endpoint in `js/config.js` default configuration:

```javascript
const DEFAULT_CONFIG = {
  siteName: 'ShopNow',
  miraklAdsUrl: 'https://your-ads-api-endpoint.com/api',
  miraklAdsToken: ''
};
```

2. To use a different mock data structure, replace `data/mirakl_ads.json` with your custom data.

3. To modify the API request format, update the `fetchSponsoredProducts()` function in `js/mirakl-ads.js`:

```javascript
async function fetchSponsoredProducts(params) {
  // If no token, use mock data
  if (!publisherBearerToken || publisherBearerToken === 'Bearer ') {
    console.log('Using mock data (no token provided)');
    return await getMockData();
  }
  
  // Customize API request format here
  const url = `${adServerBaseUrl}/your-endpoint`;
  
  // Transform params to match your API's expected format
  const customParams = {
    page: params.pageId,
    user: params.userId,
    // Add other custom parameters
  };
  
  const body = JSON.stringify(customParams);
  
  console.log('Making API request:', url, customParams);
  
  // Make API request
  try {
    const response = await fetch(url, {
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
    
    // Transform response if needed
    const rawData = await response.json();
    return transformResponseData(rawData);
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

// Add helper function to transform response if needed
function transformResponseData(rawData) {
  // Transform the API response to match the expected format
  return {
    pageId: rawData.pageIdentifier,
    productAds: rawData.sponsoredProducts || [],
    display: rawData.displayAds || []
  };
}
```

By following these customization patterns, you can adapt the application to work with various data sources and API formats while maintaining the same UI and functionality.

## Configuration

Click the gear icon in the header to configure:

- Site name
- Mirakl Ads API settings

## Mirakl Ads Integration

The demo features integration with Mirakl Ads for sponsored products and retail media display ads. It can:

- Display sponsored products on all pages
- Show retail media display ads
- Connect to the Mirakl Ads API with a bearer token
- Fall back to mock data when no API token is provided 
