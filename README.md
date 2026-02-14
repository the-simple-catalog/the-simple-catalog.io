# E-Commerce Demo Site

A static e-commerce website demo built for API integration demonstration purposes. This site allows you to:
- Track Mirakl T2S page views
- Display recommended products via Mirakl Ads API

## Features

### Pages
- **Homepage** - Displays root categories (Page ID: 1000)
- **Category Pages** - Shows subcategories and products (Page ID: 1400)
- **Product Pages** - Detailed product information (Page ID: 1200)
- **Search** - Product search functionality (Page ID: 2000)
- **Cart Page** -  Cart summary PageID: 1600
- **Payment Page** - Delivery and Payment info (fake payment: 4111-1111-1111-1111) PageID: 3200
- **OrderConfirmation** - Order confirmation page (Page ID: 2400)
- **Admin** - Catalog import and settings management - no page id

### Functionality
- 📦 **Catalog Management** - Import products and categories via JSON files
- 🛒 **Shopping Cart** - Add/remove items, persist across sessions
- 🔍 **Search** - Find products by name (minimum 3 characters)
- 📊 **Tracking** - Page view tracking (console.log )
- 🎯 **Ad Serving** - Sponsored products zones (console.log placeholder)
- 💾 **LocalStorage** - All data stored locally (max 3000 products)

## Getting Started

### 1. Start a Local Server

While you can open `index.html` directly, using a local server is recommended for proper module loading:

```bash
# Option 1: Python (recommended)
python3 -m http.server 8000
# Then open http://localhost:8000

# Option 2: Node.js
npx http-server -p 8000

# Option 3: Direct file (may have limitations)
open index.html
```

### 2. Import Catalog Data

1. Navigate to the **Admin** page (click "Admin" in the header)
2. Import the categories file:
   - Click "Choose File" under "Categories JSON File"
   - Select `catalog/categories_t2s.json`
   - Click "Import Categories"
3. Import the products file:
   - Click "Choose File" under "Products JSON File"
   - Select `catalog/products_1P_t2s.json` (or `products_3P_t2s.json`)
   - Click "Import Products"

### 3. Browse the Site

- Click on categories in the navigation menu
- Browse products in category pages
- Click products to view details
- Use the search bar to find products
- Add items to cart and proceed to checkout

## Catalog Files

The demo includes example catalog data:

- **`catalog/categories_t2s.json`** - ~700 categories
- **`catalog/products_1P_t2s.json`** - First-party products
- **`catalog/products_3P_t2s.json`** - Third-party products

Total: ~600 products available

## Tracking & Ad Serving

Fully integrated with Mirakl APIs (configure in Admin settings):

### T2S Page View Tracking
Real API integration that tracks:
- Page views (category, product, search, cart, order confirmation)
- Add-to-cart events with product details
- Post-payment events with order data
- All events sent to configured T2S Tracking URL

### Mirakl Ads API Integration
Real sponsored product serving:
- Fetches sponsored products from Mirakl Ads API
- Displays ads on category, search, and product pages
- Tracks impressions (on image load)
- Tracks clicks (on product link click)
- Falls back to "Ad Slot" placeholders when no ads returned

**Console Logging**: All tracking and ad events are logged with `📊 [TRACKING]` and `✅/⚠️ [AD SERVING]` prefixes for debugging

## Technical Details

### Architecture
- **Pure HTML/CSS/JavaScript** - No frameworks or build tools
- **Single Page Application (SPA)** - Hash-based routing
- **LocalStorage** - For catalog, cart, and settings
- **Responsive Design** - Mobile, tablet, and desktop support

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox

### File Structure
```
demo/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styles and themes
├── js/
│   ├── app.js              # Application entry point
│   ├── router.js           # SPA routing system
│   ├── utils.js            # Utility functions
│   ├── catalog.js          # Catalog management
│   ├── cart.js             # Shopping cart logic
│   ├── tracking.js         # Tracking & ad serving
│   └── pages/
│       ├── home.js              # Homepage
│       ├── category.js          # Category page
│       ├── product.js           # Product detail page
│       ├── search.js            # Search page
│       ├── cart.js              # Cart page
│       ├── checkout.js          # Checkout page
│       ├── orderconfirmation.js # Order confirmation
│       └── admin.js             # Admin page
└── catalog/                # Example catalog data
    ├── categories_t2s.json
    ├── products_1P_t2s.json
    └── products_3P_t2s.json
```

### Code Style
- Well-commented and structured for easy editing
- Modular page-based architecture
- Reusable utility functions
- Clear separation of concerns

## Customization

### Settings (Admin Page)
- **Site Name** - Customize the site branding
- **T2S Customer ID** - Your Mirakl customer identifier
- **T2S Tracking URL** - T2S Tracking API endpoint
- **Ads Server URL** - Mirakl Ads API endpoint
- **Catalog Import** - Upload categories and products JSON files
- **Clear Data** - Reset catalog and cart

### Styling
Edit `css/styles.css` to customize:
- Colors (CSS variables at the top)
- Spacing and layout
- Animations and transitions
- Responsive breakpoints

## Testing Checklist

- ✅ Import catalog data via Admin page
- ✅ Navigate through category hierarchy
- ✅ View product details
- ✅ Add products to cart
- ✅ Update cart quantities
- ✅ Search for products
- ✅ Complete checkout flow
- ✅ Verify tracking logs in console
- ✅ Verify ad serving logs in console
- ✅ Test responsive design on different screen sizes

## Browser Console

Open the browser console (F12) to see:
- 📊 `[TRACKING]` - T2S tracking events and API calls
- ✅ `[AD SERVING]` - Successful ad responses
- ⚠️ `[AD SERVING]` - Ad configuration warnings
- ❌ `[TRACKING/AD SERVING]` - API errors
- Cart operations and navigation events

## Notes

- All payment processing is mocked and always succeeds
- T2S Tracking and Ads APIs are fully integrated (configure in Admin)
- Cart and catalog data persist in localStorage
- Maximum 3000 products supported
- Test card: `4111111111111111` (always succeeds)

## Testing with Chrome DevTools MCP

The project includes `.mcp.json` for automated browser testing:

1. Start Chrome with remote debugging:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```

2. Run E2E tests using the test scenario in `doc/test/e2e-test-scenario.md`

3. MCP tools can interact with the site for automated testing

## API Configuration

To use the real Mirakl APIs:

1. Navigate to Admin page
2. Configure API settings:
   - T2S Customer ID
   - T2S Tracking URL (e.g., `https://tracking.example.com`)
   - Ads Server URL (e.g., `https://ads.example.com`)
3. Browse the site - all tracking and ad serving will use real API calls

---

Built with ❤️ for Mirakl API Integration demonstration
