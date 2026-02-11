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
- 📊 **Tracking** - Page view tracking (console.log placeholder)
- 🎯 **Ad Serving** - Sponsored products zones (console.log placeholder)
- 💾 **LocalStorage** - All data stored locally (max 1000 products)

## Getting Started

### 1. Open the Site

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

No server required - it's a fully static site!

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

Currently implemented as console.log placeholders:

### Page View Tracking
Every page logs tracking information:
```javascript
{
  pageId: "1000",
  pageType: "homepage",
  timestamp: "2026-02-11T..."
}
```

### Ad Serving Requests
Category, Search, and Product pages log ad serving requests:
```javascript
{
  pageId: "1400",
  pageType: "category",
  context: { categoryId: "1-1" },
  timestamp: "2026-02-11T..."
}
```

**Sponsored Products Zones** display 4 grey placeholders on:
- Category pages
- Search results
- Product details

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
│       ├── home.js         # Homepage
│       ├── category.js     # Category page
│       ├── product.js      # Product detail page
│       ├── search.js       # Search page
│       ├── checkout.js     # Checkout page
│       └── admin.js        # Admin page
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
- **T2S Tracking URL** - For future API integration
- **Ads Server URL** - For future API integration

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
- 📊 Tracking events (page views)
- 🎯 Ad serving requests
- Any errors or warnings

## Notes

- All payment processing is mocked and always succeeds
- No actual API calls are made yet (placeholder console.logs)
- Cart and catalog data persist in localStorage
- Maximum 1000 products supported

## Future Integration

To integrate with real APIs:

1. Update `js/tracking.js` - Replace console.log with actual API calls
2. Update settings in Admin page with real API URLs
3. Process sponsored product responses and render real ads

---

Built with ❤️ for API Integration demonstration
