# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static e-commerce demo site built for Mirakl T2S Tracking and Ads API integration demonstration. It's a pure HTML/CSS/JavaScript Single Page Application (SPA) with no build tools, frameworks, or dependencies.

**Purpose**: Demonstrate integration of:
- Mirakl T2S page view tracking (T2S API)
- Mirakl Ads API for sponsored product recommendations

## Running the Site

**No build required** - this is a fully static site:

```bash
# Option 1: Simply open in browser
open index.html

# Option 2: Use Python's built-in server (recommended for testing)
python3 -m http.server 8000
# Then open http://localhost:8000

# Option 3: Use Node's http-server
npx http-server -p 8000
```

### First-Time Setup Flow

1. Open `index.html` in browser
2. Navigate to Admin page (click "Admin" in header)
3. Import catalog data:
   - Import `catalog/categories_t2s.json` (Categories JSON File)
   - Import `catalog/products_1P_t2s.json` or `catalog/products_3P_t2s.json` (Products JSON File)
4. Browse the site with ~600 products and ~700 categories

### Testing with Chrome DevTools MCP

The project includes `.mcp.json` configured for Chrome DevTools MCP server on port 9222:

```bash
# Start Chrome in debug mode
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# The MCP server config is in .mcp.json
```

## Architecture

### Core Concept: SPA with Hash-Based Routing

- **Single HTML file** (`index.html`) loads all JavaScript modules
- **Hash-based routing** (`#/category/123`, `#/search?q=book`) for navigation
- **LocalStorage** for all data persistence (catalog, cart, settings)
- **No backend** - all operations happen client-side

### Routing System (`js/router.js`)

Central router with pattern matching:
```javascript
Router.register('/category/:categoryId', (params) => CategoryPage.render(params));
```

Routes are registered in `js/app.js` `registerRoutes()` function. Each page module exports a `render()` function that takes params.

### Page Structure

Each page follows this pattern:
1. Located in `js/pages/*.js`
2. Implemented as class with static `render(params)` method
3. Render updates `#app` element innerHTML
4. Handles tracking and ad serving calls

Pages: `home.js`, `category.js`, `product.js`, `search.js`, `cart.js`, `checkout.js`, `orderconfirmation.js`, `admin.js`

### Data Management

**CatalogManager** (`js/catalog.js`):
- Manages products and categories in localStorage
- Provides query methods: `getProductById()`, `getRootCategories()`, `getProductsByCategory()`
- Handles catalog import from JSON files
- **Max 2000 products** (configurable via `MAX_PRODUCTS`)

**Cart** (`js/cart.js`):
- Shopping cart operations (add, remove, update quantity)
- Persists to localStorage
- Triggers T2S tracking for add-to-cart events

**Settings** (`js/utils.js` and localStorage):
- Site configuration (name, T2S URLs, customer ID)
- User tracking ID (TID) - generated UUID stored in localStorage
- Managed via Admin page

### Tracking & Ads Integration (`js/tracking.js`)

**T2S Tracking API**:
- Endpoint: `POST {trackingUrl}/1.1/json/T/t`
- Content-Type: `application/x-www-form-urlencoded`
- Tracks: page views, add-to-cart, post-payment (order confirmation)
- All events include: `cID`, `pageId`, `userId`, `userConsent`, `eventName`, `url`, `referer`

**Key Tracking Methods**:
- `Tracking.trackCategoryView(categoryId)` - Category page views
- `Tracking.trackSearchView(query, productIds)` - Search results
- `Tracking.trackProductView(productId)` - Product detail views
- `Tracking.trackAddToCart(productId, quantity, price)` - Cart additions
- `Tracking.trackPostPayment(orderData)` - Order confirmations

**Mirakl Ads API**:
- Endpoint (authenticated with valid JWT): `POST {adsServerUrl}/ads/v1`
- Endpoint (public without token or invalid token): `POST {adsServerUrl}/ads/v1/public/rendered-content`
- Headers: `x-customer-id`, `Content-Type: application/json`, `Authorization: Bearer {token}` (only with valid JWT)
- Token validation (STRICT): Must be valid JWT format (xxx.yyy.zzz), 50-2000 characters, base64url chars (A-Z, a-z, 0-9, ., -, _)
- Invalid tokens will ALWAYS use public endpoint (never authenticated)
- Returns sponsored products for category, search, and product pages
- Handles impression/click tracking

**Sponsored Products Rendering**:
- `Tracking.requestSponsoredProducts(pageId, pageType, context)` - Fetches ads
- `Tracking.renderSponsoredProducts(adsData)` - Renders ad units
- Shows 4-slot grid with "Ad Slot" placeholders when no ads returned
- Tracks impressions (on image load) and clicks (on product link click)

## Page Types & IDs

Consistent page IDs used across tracking and ads:
- **Homepage**: `1000` (no tracking, no ads)
- **Category**: `1400` (tracked, has ads)
- **Product**: `1200` (tracked, has ads)
- **Search**: `2000` (tracked, has ads)
- **Cart**: `1600` (tracked, no ads)
- **Payment**: `3200` (not tracked, no ads)
- **Order Confirmation**: `2400` (tracked, no ads)
- **Admin**: No page ID (settings only)

These are configurable in Settings (`t2sPageIds` object).

## Catalog Data Format

### Products (`catalog/products_*.json`)

Array of product objects:
```json
{
  "action": "upsert",
  "type": "product",
  "id": "4123018513199-0",
  "content": {
    "sku": "4123018513199-1P",
    "name": "Product Name",
    "longDescription": "Description",
    "imageUrl": "https://...",
    "regularPrice": "7.5",
    "promoPrice": null,
    "categories": ["1-1-1"],
    "stockQuantity": 100,
    "characteristics": [
      {
        "id": "INSIGHT_BRAND",
        "values": [{ "value": "BrandName" }]
      }
    ]
  }
}
```

**Important fields**:
- `id`: Product identifier (used in APIs)
- `content.categories`: Array of category IDs (product shows in all)
- `content.regularPrice` / `content.promoPrice`: Pricing
- `content.characteristics[INSIGHT_BRAND]`: Brand name

### Categories (`catalog/categories_*.json`)

Array of category objects:
```json
{
  "type": "category",
  "action": "upsert",
  "id": "1-1",
  "content": {
    "name": "Manga and comics",
    "parentId": "1",
    "status": "enabled"
  }
}
```

**Hierarchy**:
- `parentId: "root"` → Root categories (shown in header dropdown)
- Other `parentId` values create hierarchy
- Categories are ordered root-to-leaf in the file

## Code Conventions

### Utility Functions (`js/utils.js`)

Always use provided utilities:
- `getEl(id)` instead of `document.getElementById()`
- `createElement(tag, attrs, content)` for DOM creation
- `escapeHtml(str)` for XSS prevention (always escape user input)
- `formatPrice(price)` for consistent $XX.XX formatting
- `navigateTo(path)` for routing navigation
- `generateUUID()` for unique IDs

### Security

- Always use `escapeHtml()` when inserting user-provided content or catalog data into HTML
- Never use innerHTML with unescaped strings
- Product/category names, search queries, etc. must be escaped

### Code Style

- **All code and comments must be in English** - No French or other languages
- Extensively commented with section headers (`// ===================================`)
- Each function has JSDoc-style documentation
- Clear separation of concerns (pages, routing, catalog, cart, tracking)
- Use template literals for HTML generation
- Consistent naming: camelCase for functions/variables

### Modern JavaScript Patterns

- **Use ES6 Classes**: All modules (CatalogManager, Cart, Router, Tracking, Settings, and page objects) are implemented as ES6 classes with static methods
- **Private Fields**: Use private class fields (`#fieldName`) for internal state that shouldn't be accessed externally
- **Static Methods**: All utility classes use static methods since they don't need instance state
- Example class structure:
```javascript
class CatalogManager {
    static #privateCache = {}; // Private static field
    static PUBLIC_CONSTANT = 'value'; // Public constant

    static getProducts() {
        // Static method
        return [];
    }
}
```
- **Class Benefits**: Better encapsulation, clearer intent, easier to refactor, and IDE-friendly
- When adding new modules, always use class syntax with static methods

### Git Commit Conventions

All commits must use gitmoji prefixes to clearly indicate the type of change:

**Format**: `<gitmoji> <subject>`

Example: `✨ Add product filtering by brand`

**Common gitmojis**:
- ✨ `:sparkles:` - New feature or enhancement
- 🐛 `:bug:` - Bug fix
- 🔧 `:wrench:` - Configuration changes (settings, JSON files)
- 📝 `:memo:` - Documentation updates
- 💄 `:lipstick:` - UI/styling changes (CSS, HTML structure)
- ♻️ `:recycle:` - Code refactoring (no functional changes)
- ⚡ `:zap:` - Performance improvements
- 🔒 `:lock:` - Security fixes
- ➕ `:heavy_plus_sign:` - Add dependency or file
- ➖ `:heavy_minus_sign:` - Remove dependency or file
- 🎨 `:art:` - Code structure/formatting improvements
- 🚀 `:rocket:` - Deployment or production-related changes
- 🔥 `:fire:` - Remove code, files, or features
- 🙈 `:see_no_evil:` - Add or update .gitignore
- 🚧 `:construction:` - Work in progress
- 🎉 `:tada:` - Initial commit or major milestone

**Examples**:
- `✨ Add sponsored products carousel on homepage`
- `🐛 Fix cart total calculation rounding error`
- `💄 Redesign admin import UI with progress animation`
- `🔧 Update T2S tracking endpoint configuration`
- `♻️ Refactor tracking module to use ES6 classes`
- `📝 Update CLAUDE.md with gitmoji conventions`
- `🙈 Add .claude/ to gitignore`

### Browser Support

- **Target modern browsers only** - Primarily Google Chrome
- Use modern JavaScript features (ES6+, async/await, fetch, etc.)
- Don't add polyfills or fallbacks for old browsers
- CSS Grid and Flexbox without vendor prefixes
- Native browser APIs preferred (crypto.randomUUID, URLSearchParams, etc.)

### LocalStorage Keys

- Products: `ecommerce_products`
- Categories: `ecommerce_categories`
- Cart: `ecommerce_cart`
- Settings: `ecommerce_settings`
- User TID: `ecommerce_tid`

## Common Development Tasks

### Adding a New Page

1. Create `js/pages/newpage.js` with render function
2. Register route in `js/app.js` `registerRoutes()`
3. Add tracking call if needed (refer to tracking.js constants)
4. Load script in `index.html` before `app.js`

### Adding Tracking for New Event

1. Add static method to `Tracking` class in `js/tracking.js`
2. Call `Tracking.sendTrackingEvent(eventData)` with required fields
3. Include: `cID`, `pageId`, `userId`, `userConsent`, `eventName`
4. Test in console - should log event and make API call (if configured)

### Modifying Catalog Logic

All catalog operations go through `CatalogManager` in `js/catalog.js`:
- To add methods: add static methods to the CatalogManager class
- Query methods should filter/map the products/categories arrays
- Always validate data before saving to localStorage
- Honor `MAX_PRODUCTS` limit (currently 2000)

### Testing Tracking Integration

1. Configure T2S settings in Admin page:
   - Customer ID (`t2sCustomerId`)
   - Tracking URL (`trackingUrl`)
   - Ads Server URL (`adsServerUrl`)
2. Open browser console (F12)
3. Navigate pages - look for `📊 [TRACKING]` logs
4. For ads: look for `✅ [AD SERVING]` or `⚠️ [AD SERVING]` logs
5. Check Network tab for actual API calls

### Working with Sponsored Products

Sponsored products appear on category, search, and product pages:
1. Call `await Tracking.requestSponsoredProducts(pageId, pageType, context)`
2. Render with `Tracking.renderSponsoredProducts(adsData)`
3. Insert rendered HTML into page (usually before product grid)
4. Impression tracking fires on image load
5. Click tracking fires on product link click

## Important Files Reference

- `index.html` - Main HTML with header, app container, and script loading order
- `js/app.js` - Application entry point, route registration, header initialization
- `js/router.js` - Hash-based SPA routing system
- `js/tracking.js` - T2S Tracking & Ads API integration (most complex file)
- `js/catalog.js` - Product/category data management
- `js/cart.js` - Shopping cart operations
- `js/utils.js` - Shared utility functions
- `js/pages/*.js` - Individual page render logic
- `css/styles.css` - All styles with CSS variables for theming
- `catalog/*.json` - Example catalog data for import

## Browser Console Debugging

Open DevTools console (F12) to see:
- `📊 [TRACKING]` - Tracking events sent to T2S API
- `✅ [AD SERVING]` - Successful ad responses
- `⚠️ [AD SERVING]` - Ad configuration warnings
- `❌ [TRACKING/AD SERVING]` - Errors in API calls
- Cart operations and navigation events

## Notes

- **No payment processing** - checkout always succeeds with test card
- **Fire-and-forget tracking** - tracking calls don't block UI
- **Catalog size limits** - 2000 products max (localStorage constraints)
- **SPA referer tracking** - Uses sessionStorage to track previous page for referer field
- **User ID persistence** - Generated once per browser via localStorage (TID)
- **Ad slot fallbacks** - Shows "Ad Slot" placeholders when no sponsored products returned
