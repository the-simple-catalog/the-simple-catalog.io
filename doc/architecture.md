# Architecture

This document explains the code structure and architecture of the E-Commerce Demo application. Start here to understand how the SPA is organized and how data flows through the system.

**Intended audience**: All developers (especially those new to the codebase).

**Cross-references**:
- See [Conventions](./conventions.md) for coding standards and patterns
- See [Pages](./pages.md) for individual page documentation
- See [Router](./router.md) for detailed routing information
- See [Tracking & Ads](./tracking-and-ads.md) for external API integration

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Module Dependency Graph](#module-dependency-graph)
- [SPA Routing](#spa-routing-jsrouterjs)
- [Data Layer and localStorage](#data-layer-and-localstorage)
- [Core Modules](#core-modules)
- [Page Rendering Pattern](#page-rendering-pattern)
- [ES6 Class Patterns](#es6-class-patterns)
- [Application Startup](#application-startup)
- [Global Window Exports](#global-window-exports)
- [File Structure](#file-structure)

---

## High-Level Overview

The application is a **client-side Single Page Application (SPA)** built with plain HTML, CSS, and JavaScript. There is no backend server, no build step, and no framework. All data lives in the browser's `localStorage`.

```
Browser Request
     |
     v
index.html
     |
     +-- css/styles.css        (all styles)
     +-- js/app.js             (entry point, ES module)
           |
           +-- js/router.js        (hash-based routing)
           +-- js/catalog.js       (CatalogManager + Settings)
           +-- js/cart.js          (Cart)
           +-- js/tracking.js      (Tracking & Ads)
           +-- js/utils.js         (shared utilities)
           +-- js/pages/*.js       (page renderers)
```

The user opens `index.html` in a browser. A single `<script type="module">` tag loads `js/app.js`, which imports every other module. Navigation happens by changing the URL hash (`#/category/1-1`, `#/search?q=book`), which the Router intercepts and dispatches to the matching page renderer.

## Module Dependency Graph

```
app.js
  |-- router.js        (imports utils.js)
  |-- catalog.js       (imports utils.js)
  |-- cart.js          (imports catalog.js, tracking.js)
  |-- tracking.js      (imports catalog.js, utils.js)
  |-- pages/home.js    (imports utils.js, catalog.js, tracking.js)
  |-- pages/category.js(imports utils.js, catalog.js, cart.js, tracking.js)
  |-- pages/product.js (imports utils.js, catalog.js, cart.js, tracking.js)
  |-- pages/search.js  (imports utils.js, catalog.js, cart.js, tracking.js)
  |-- pages/cart.js    (imports utils.js, catalog.js, cart.js, tracking.js)
  |-- pages/checkout.js(imports utils.js, catalog.js, cart.js)
  |-- pages/orderconfirmation.js (imports utils.js, catalog.js, tracking.js)
  |-- pages/admin.js   (imports utils.js, catalog.js)
```

Key observation: `utils.js` is a leaf dependency with no imports of its own. `catalog.js` depends only on `utils.js`. `cart.js` has a circular-looking dependency on `tracking.js` (for add-to-cart events), but since all methods are static and called at runtime this works fine with ES modules.

## SPA Routing (`js/router.js`)

The Router is the backbone of navigation. It uses the browser's `hashchange` event to detect URL changes and dispatches to registered handler functions.

### How It Works

1. **Registration** -- During startup, `app.js` calls `Router.register(pattern, handler)` for each page:

```javascript
Router.register('/', (params) => HomePage.render(params));
Router.register('/category/:categoryId', (params) => CategoryPage.render(params));
Router.register('/product/:productId', (params) => ProductPage.render(params));
Router.register('/search', (params) => SearchPage.render(params));
```

2. **Initialization** -- `Router.init()` attaches a `hashchange` listener and resolves the current hash.

3. **Resolution** -- When the hash changes, `Router.resolve()` runs:
   - Parses the hash into a path and query parameters using `parseRoute()` from `utils.js`
   - Tries an exact match against registered routes
   - Falls back to pattern matching with `:param` segments
   - Shows a 404 page if nothing matches

4. **Pattern Matching** -- The `matchPattern()` method splits both the pattern and the path by `/`, then compares segment by segment. Segments starting with `:` become named parameters:

```javascript
// Pattern: '/category/:categoryId'
// Path:    '/category/1-2-3'
// Result:  { categoryId: '1-2-3' }
```

Query parameters (e.g., `?q=book`) are parsed separately by `parseRoute()` and merged into the params object.

### Route Table

| Pattern | Page Module | Example URL |
|---------|-------------|-------------|
| `/` | `HomePage` | `#/` |
| `/category/:categoryId` | `CategoryPage` | `#/category/1-1` |
| `/product/:productId` | `ProductPage` | `#/product/4123018513199-0` |
| `/search` | `SearchPage` | `#/search?q=manga` |
| `/cart` | `CartPage` | `#/cart` |
| `/checkout` | `CheckoutPage` | `#/checkout` |
| `/order-confirmation` | `OrderConfirmationPage` | `#/order-confirmation` |
| `/admin` | `AdminPage` | `#/admin` |

## Data Layer and localStorage

All persistent data is stored in `localStorage` as JSON strings. There is no database or API for data storage.

### Storage Keys

| Key | Manager | Contents |
|-----|---------|----------|
| `ecommerce_products` | `CatalogManager` | Array of product objects |
| `ecommerce_categories` | `CatalogManager` | Array of category objects |
| `ecommerce_cart` | `Cart` | Array of cart items (`{ productId, quantity, addedAt }`) |
| `ecommerce_settings` | `Settings` | Site configuration object |
| `user_tid` | `Settings` | User tracking ID (UUID) |

Temporary data uses `sessionStorage`:

| Key | Purpose |
|-----|---------|
| `previousUrl` | SPA referer tracking (previous page URL) |
| `lastOrder` | Order data passed from checkout to confirmation page |
| `search_history` | Recent search queries (last 100) |

### Data Flow Example: Adding a Product to Cart

```
User clicks "Add to Cart"
  |
  v
CategoryPage.addToCart(productId)
  |
  v
Cart.addItem(productId, 1)
  |
  +-- CatalogManager.getProductById(productId)    // validate product exists
  +-- Cart.getItems()                              // read current cart from localStorage
  +-- Cart.saveItems(items)                        // write updated cart to localStorage
  +-- window.updateCartCount()                     // update header badge
  +-- CatalogManager.getProductPrice(product)      // get price for tracking
  +-- Tracking.trackAddToCart(productId, qty, price)  // fire tracking event
```

## Core Modules

### CatalogManager (`js/catalog.js`)

Manages the product and category catalog. All methods are static. See [Conventions](./conventions.md) for the class pattern.

**Storage**: Products and categories are stored as raw JSON arrays in localStorage. Each read deserializes the full array; there is no in-memory cache for the data itself (only for category icon lookups).

**Key methods**:

| Method | Purpose |
|--------|---------|
| `getProducts()` / `getCategories()` | Load full arrays from localStorage |
| `saveProducts(products)` | Save with MAX_PRODUCTS limit enforcement (3000) |
| `importProducts(data, appendMode)` | Import from JSON with optional append/dedup |
| `importCategories(data)` | Import categories from JSON |
| `getProductById(id)` | Find single product by ID |
| `getCategoryById(id)` | Find single category by ID |
| `getProductsByCategory(categoryId)` | Filter products by category membership |
| `getChildCategories(parentId)` | Get direct children of a category |
| `getRootCategories()` | Get top-level categories (`parentId === 'root'`) |
| `searchProducts(query, minLength)` | Text search across name and description |
| `getCategoryPath(categoryId)` | Build breadcrumb array from root to category |
| `getCategoryIconImage(category)` | Find a representative product image for a category |

**Category hierarchy**: Categories form a tree. Each category has a `content.parentId` pointing to its parent. Root categories have `parentId: "root"`. The hierarchy is traversed by `getCategoryPath()` for breadcrumbs and `getChildCategories()` for subcategory listings.

### Settings (`js/catalog.js`)

Co-located with CatalogManager. Manages site configuration with defaults.

```javascript
static DEFAULT_SETTINGS = {
    siteName: 'E-Commerce Demo',
    trackingUrl: 'https://xxxxx.retail.mirakl.net',
    adsServerUrl: 'https://xxxxx.retailmedia.mirakl.net',
    t2sCustomerId: 'CUSTOMER_PUBLIC_ID',
    t2sPageIds: { search: 2000, category: 1400, product: 1200, cart: 1600, postPayment: 2400 },
    orderPrefix: 'ORDER_'
};
```

`Settings.get()` merges stored settings over defaults using the spread operator, so any key not explicitly saved falls back to its default.

The `Settings` class also manages the user tracking ID (TID) -- a UUID generated once and stored in localStorage under `user_tid`.

### Cart (`js/cart.js`)

Manages the shopping cart. All methods are static.

**Cart item structure**:
```javascript
{ productId: "4123018513199-0", quantity: 2, addedAt: "2026-02-14T10:30:00.000Z" }
```

The cart stores minimal references (just product IDs and quantities). Full product details are resolved at read time by `getItemsWithDetails()`, which joins each cart item with its product from `CatalogManager.getProductById()`.

After every mutation (add, remove, update, clear), the Cart calls `window.updateCartCount()` to refresh the header badge. This global function is exposed by `app.js`.

### Tracking (`js/tracking.js`)

Handles two external integrations:

1. **T2S Page View Tracking** -- Sends `POST` requests with `application/x-www-form-urlencoded` body to the T2S API endpoint
2. **Mirakl Ads API** -- Sends `POST` requests with JSON body to fetch sponsored product recommendations

All tracking calls are fire-and-forget: they do not block the UI and errors are caught silently. See the [T2S Tracking & Mirakl Ads API Integration](./tracking-and-ads.md) document for full API documentation, event payloads, and debugging guides.

### Router (`js/router.js`)

Implements hash-based SPA routing. See the [Router System](./router.md) document for complete details on route registration, pattern matching, and navigation.

### Utils (`js/utils.js`)

Pure utility functions with no state and no side effects (except `showMessage` which touches the DOM).

| Function | Purpose |
|----------|---------|
| `getEl(id)` | Shorthand for `document.getElementById()` |
| `createElement(tag, attrs, content)` | DOM element factory |
| `escapeHtml(str)` | XSS prevention via `textContent` -> `innerHTML` trick |
| `formatPrice(price)` | Format number as `$XX.XX` |
| `parseRoute()` | Parse `window.location.hash` into `{ path, params }` |
| `navigateTo(path)` | Set `window.location.hash` |
| `generateUUID()` | Wrapper around `crypto.randomUUID()` |
| `debounce(func, wait)` | Standard debounce |
| `showMessage(message, type)` | Show auto-dismissing notification |
| `generateProductBadges(product, isSponsored)` | Generate badge HTML (Sale, Sponsored, Marketplace) |

## Page Rendering Pattern

Every page module follows a consistent pattern to ensure predictable behavior, easy testing, and clean separation of concerns. This pattern is described in detail in the [Pages](./pages.md) document.

Every page module follows the same structure:

1. **ES6 class with static methods** -- No instances are created
2. **`render(params)` entry point** -- Called by the Router with matched parameters
3. **Direct DOM manipulation** -- Sets `innerHTML` on the `#app` element
4. **Tracking calls** -- Fires tracking events during render
5. **Async ad loading** -- Starts an ad request, renders placeholder, then replaces it when the response arrives

Example flow for `CategoryPage.render()`:

```javascript
class CategoryPage {
    static render(params) {
        const categoryId = params.categoryId;
        const category = CatalogManager.getCategoryById(categoryId);

        // 1. Fire tracking
        Tracking.trackCategoryView(categoryId);

        // 2. Start async ad request
        const sponsoredAdsPromise = Tracking.requestSponsoredProducts(
            Tracking.PAGE_IDS.CATEGORY, Tracking.PAGE_TYPES.CATEGORY, { categoryId }
        );

        // 3. Render page immediately with placeholder ads
        const app = getEl('app');
        app.innerHTML = `...page HTML with ${Tracking.renderEmptySponsoredSection()}...`;

        // 4. Replace placeholder when ads arrive
        sponsoredAdsPromise.then(adsData => {
            const container = document.getElementById('sponsored-container');
            if (container && adsData) {
                container.innerHTML = Tracking.renderSponsoredProducts(adsData);
                Tracking.attachSponsoredTracking(container);
            }
        });
    }
}
```

## ES6 Class Patterns

All modules use ES6 classes with static-only members. No module creates instances.

### Private Static Fields

Modules use the `#` prefix for internal state:

```javascript
class Router {
    static #routes = {};  // private route registry
}

class Cart {
    static #STORAGE_KEY = 'ecommerce_cart';  // private constant
}

class CatalogManager {
    static #categoryIconCache = {};  // private in-memory cache
}
```

### Public Constants

Exposed as regular static fields:

```javascript
class CatalogManager {
    static STORAGE_KEY_PRODUCTS = 'ecommerce_products';
    static MAX_PRODUCTS = 3000;
}

class Tracking {
    static PAGE_IDS = { HOMEPAGE: '1000', SEARCH: '2000', ... };
    static PAGE_TYPES = { HOMEPAGE: 'homepage', CATEGORY: 'category', ... };
}
```

### Why Static-Only Classes

The application has no need for multiple instances of any module. Each module manages a single concern (routing, cart, catalog, tracking) and operates on shared global state (localStorage, DOM). Static classes provide:

- Namespace isolation without polluting the global scope
- Clear public API surface
- Private state via `#` fields
- No instantiation boilerplate

## Application Startup

When the browser loads `index.html`, the following sequence executes:

```
1. Browser parses HTML, loads css/styles.css
2. Browser encounters <script type="module" src="js/app.js">
3. ES module loader resolves all imports (router, catalog, cart, tracking, pages, utils)
4. DOMContentLoaded fires
5. loadSiteSettings()         -- reads Settings, updates header site name
6. registerRoutes()           -- registers all 8 routes with Router
7. Router.init()              -- attaches hashchange listener, resolves current hash
8. updateCartCount()          -- reads Cart, updates header badge
9. initHeaderSearch()         -- attaches submit handler to search form
10. initCategoriesDropdown()  -- attaches click handlers, populates category menu
```

On step 7, `Router.resolve()` matches the current hash and calls the corresponding page's `render()` method, which replaces the contents of `<main id="app">`. See the [Router System](./router.md) document for details on how routing works.

## Global Window Exports

A few functions and classes are exposed on `window` for use in inline `onclick` handlers within rendered HTML:

```javascript
// From app.js
window.updateCartCount = updateCartCount;
window.populateCategoriesDropdown = populateCategoriesDropdown;
window.CategoryPage = CategoryPage;
window.ProductPage = ProductPage;
window.SearchPage = SearchPage;
window.AdminPage = AdminPage;
window.CartPage = CartPage;
window.CheckoutPage = CheckoutPage;
```

This is necessary because the page renderers generate HTML strings with `onclick="CategoryPage.addToCart('...')"` attributes. Since the HTML is set via `innerHTML`, the handlers need to reference globally accessible objects.

## File Structure

```
demo/
  index.html              -- single HTML shell
  css/
    styles.css            -- all styles, CSS custom properties for theming
  js/
    app.js                -- entry point, route registration, header init
    router.js             -- hash-based SPA routing
    catalog.js            -- CatalogManager + Settings classes
    cart.js               -- Cart class
    tracking.js           -- Tracking class (T2S + Ads)
    utils.js              -- shared utility functions
    pages/
      home.js             -- homepage with category grid
      category.js         -- category listing with subcategories and products
      product.js          -- product detail page
      search.js           -- search results page
      cart.js             -- shopping cart page
      checkout.js         -- checkout form page
      orderconfirmation.js -- post-payment confirmation
      admin.js            -- settings and catalog import
  catalog/
    categories_t2s.json   -- sample category data
    products_1P_t2s.json  -- sample 1P product data
    products_3P_t2s.json  -- sample 3P product data
  doc/
    architecture.md       -- this file
```
