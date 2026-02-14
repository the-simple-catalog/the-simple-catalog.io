# Page Modules

All page modules live in `js/pages/` and follow the same pattern: an ES6 class with a static `render(params)` method that writes HTML into the `#app` container. Routes are registered in `js/app.js` via `Router.register()`. This document details each page's purpose, tracking behavior, and key methods.

**Intended audience**: Frontend developers modifying page logic or adding new pages.

**Cross-references**:
- See [Architecture](./architecture.md) for the page rendering pattern and data flow
- See [Router](./router.md) for how pages are registered and routed
- See [Conventions](./conventions.md) for code style and module patterns
- See [Tracking & Ads](./tracking-and-ads.md) for tracking event documentation

## Table of Contents

- [Page Summary](#page-summary)
- [HomePage](#homepage-jspagesHomejs)
- [CategoryPage](#categorypage-jspagescategoryjs)
- [ProductPage](#productpage-jspagesproductjs)
- [SearchPage](#searchpage-jspagessearchjs)
- [CartPage](#cartpage-jspagescartjs)
- [CheckoutPage](#checkoutpage-jspagescheckoutjs)
- [OrderConfirmationPage](#orderconfirmationpage-jspagesorderconfirmationjs)
- [AdminPage](#adminpage-jspagesadminjs)
- [Creating a New Page](#creating-a-new-page)

---

## Page Summary

| Page | File | Route | Page ID | Tracking | Sponsored Products |
|------|------|-------|---------|----------|--------------------|
| Home | `home.js` | `/` | `1000` | Page view | No |
| Category | `category.js` | `/category/:categoryId` | `1400` | Page view, category view | Yes |
| Product | `product.js` | `/product/:productId` | `1200` | Page view, product view | Yes |
| Search | `search.js` | `/search?q=...` | `2000` | Page view, search view | Yes (query >= 3 chars) |
| Cart | `cart.js` | `/cart` | `1600` | Page view | No |
| Checkout | `checkout.js` | `/checkout` | `3200` | None | No |
| Order Confirmation | `orderconfirmation.js` | `/order-confirmation` | `2400` | Page view, post-payment | No |
| Admin | `admin.js` | `/admin` | None | None | No |

---

## HomePage (`js/pages/home.js`)

**Route**: `#/`

**Purpose**: Landing page displaying a hero banner, feature highlights, and a grid of root category cards with product images.

**Render logic**:
1. Calls `Tracking.trackPageView()` with `PAGE_IDS.HOMEPAGE`.
2. Fetches root categories via `CatalogManager.getRootCategories()`.
3. If no categories exist, shows a prompt to import catalog data from the Admin page.
4. Otherwise renders: hero banner, four feature blocks (shipping, support, payment, offers), and a category card grid. Each card uses `CatalogManager.getCategoryIconImage()` to show a representative product image.

**Tracking**: Page view only (no category/product-level tracking).

**Sponsored products**: None.

---

## CategoryPage (`js/pages/category.js`)

**Route**: `#/category/:categoryId`

**Purpose**: Displays subcategories and products for a given category, with breadcrumb navigation.

**Render logic**:
1. Looks up the category via `CatalogManager.getCategoryById()`. Renders a not-found page if missing.
2. Fires tracking calls: `trackPageView()` and `trackCategoryView()`.
3. Initiates a sponsored products request via `Tracking.requestSponsoredProducts()`.
4. Builds breadcrumb from `CatalogManager.getCategoryPath()`.
5. Renders child subcategories (if any) as a card grid with product images.
6. Renders products in a card grid with brand, price (regular/promo), badges, and an "Add to Cart" button.
7. Inserts an empty sponsored section placeholder, then updates it asynchronously when the ads promise resolves.

**Tracking**: Page view + category view (with `categoryId` and `categoryName`).

**Sponsored products**: Yes. Requested with `PAGE_TYPES.CATEGORY` and `{ categoryId }` context.

**Key methods**:
- `renderBreadcrumb(path)` -- breadcrumb from category hierarchy
- `renderSubcategories(categories)` -- subcategory card grid
- `renderProductCard(product)` -- individual product card with badges, price, and add-to-cart
- `addToCart(productId)` -- delegates to `Cart.addItem()`, shows success/error toast

---

## ProductPage (`js/pages/product.js`)

**Route**: `#/product/:productId`

**Purpose**: Full product detail view with image, metadata, quantity selector, and add-to-cart functionality.

**Render logic**:
1. Looks up the product via `CatalogManager.getProductById()`. Renders not-found if missing.
2. Fires tracking: `trackPageView()` and `trackProductView()`.
3. Initiates a sponsored products request.
4. Builds breadcrumb from the product's first category.
5. Renders a two-column layout: product image (with badges) on the left, details on the right.
6. Details include: title, stock/sale/marketplace status indicators, price, product ID/SKU metadata, category/brand info, quantity selector (+/- buttons), add-to-cart button, and description.
7. Sponsored products section loads asynchronously below the detail grid.

**Tracking**: Page view + product view (with `productId` and `productName`).

**Sponsored products**: Yes. Requested with `PAGE_TYPES.PRODUCT` and `{ productId }` context.

**Key methods**:
- `increaseQuantity()` / `decreaseQuantity()` -- quantity input controls (range 1-99)
- `addToCart(productId)` -- reads quantity input, delegates to `Cart.addItem()`
- `renderBreadcrumb(path, product)` -- includes product name as final breadcrumb item

---

## SearchPage (`js/pages/search.js`)

**Route**: `#/search?q=...`

**Purpose**: Displays search results. The search input itself is in the site header; this page only shows results.

**Render logic**:
1. Reads query from `params.q`.
2. Fires `trackPageView()` with search context.
3. If a query exists, calls `logSearchQuery()` which tracks the search and stores history in localStorage.
4. Requests sponsored products only if query length >= 3 characters.
5. Renders breadcrumb, title with query, sponsored section (if applicable), and search results.
6. Search results logic: no query shows a prompt, query < 3 chars shows minimum length message, no results shows empty message, otherwise renders product card grid.

**Tracking**: Page view + search view (via `Tracking.trackSearchView(query, productIds)`). Also logs search history to `localStorage` key `search_history` (keeps last 100 entries).

**Sponsored products**: Yes, when query >= 3 characters. Requested with `PAGE_TYPES.SEARCH` and `{ searchQuery }` context.

**Key methods**:
- `logSearchQuery(query)` -- tracks search and persists to localStorage
- `renderSearchResults(query)` -- handles empty/short/no-results/results states
- `renderProductCard(product)` -- same card format as CategoryPage

---

## CartPage (`js/pages/cart.js`)

**Route**: `#/cart`

**Purpose**: Shopping cart summary with item list, quantity controls, and order total.

**Render logic**:
1. Fires `trackPageView()` with `PAGE_IDS.CART`.
2. Gets cart items via `Cart.getItemsWithDetails()` and totals via `Cart.getTotal()`.
3. Empty cart: shows a message and "Continue Shopping" link.
4. Non-empty cart: two-column layout with cart items on the left and cart summary (subtotal, shipping, tax, total) on the right.
5. Each cart item shows image, brand, name, unit price, quantity controls (+/- buttons), subtotal, and a remove link.

**Tracking**: Page view only.

**Sponsored products**: None.

**Key methods**:
- `renderCartItem(item)` -- individual line item with quantity controls
- `updateQuantity(productId, newQuantity)` -- updates via `Cart.updateQuantity()`, re-renders page
- `removeItem(productId)` -- removes via `Cart.removeItem()`, re-renders page

---

## CheckoutPage (`js/pages/checkout.js`)

**Route**: `#/checkout`

**Purpose**: Checkout form with shipping address and payment fields. Payment is mocked (always succeeds).

**Render logic**:
1. No tracking on this page (as per spec, page ID `3200` is not tracked).
2. Gets cart items and totals. Shows empty cart message if no items.
3. Two-column layout: shipping and payment forms on the left, order summary on the right.
4. Forms are pre-filled with test data (John Doe, test card `4111111111111111`).
5. "Place Order" button triggers `placeOrder()`.

**Order flow** (`placeOrder()`):
1. Validates shipping and payment forms via native HTML validation.
2. Shows "Processing order..." loading message.
3. After 1.5s simulated delay, shows success message with order ID (`orderPrefix + timestamp`).
4. After another 1.5s, stores order in `sessionStorage` (`lastOrder`), clears cart, and navigates to `/order-confirmation`.

**Tracking**: None.

**Sponsored products**: None.

---

## OrderConfirmationPage (`js/pages/orderconfirmation.js`)

**Route**: `#/order-confirmation`

**Purpose**: Post-payment confirmation page showing order details and triggering post-payment tracking.

**Render logic**:
1. Fires `trackPageView()` with `PAGE_IDS.ORDER_CONFIRMATION`.
2. Reads order from `sessionStorage.getItem('lastOrder')`. Shows "No recent order" message if missing.
3. Parses order data and fires `Tracking.trackPostPayment()` with order ID, total, and item details (product ID, quantity, price per unit).
4. Renders: success checkmark, order number, order date, itemized list with images, total, and "What's Next?" section.

**Tracking**: Page view + post-payment event (with full order data including line items).

**Sponsored products**: None.

---

## AdminPage (`js/pages/admin.js`)

**Route**: `#/admin`

**Purpose**: Site administration for catalog import, settings configuration, and tracking ID management.

**Render logic**: Renders five sections in a single-column layout:

1. **Import Catalog** -- File inputs for categories and products JSON, import mode toggle (replace/append), capacity indicator (shown at >= 90%), and clear catalog button.
2. **Catalog Statistics** -- Live counts of products, categories, and root categories.
3. **Site Settings** -- Site name configuration.
4. **T2S Tracking Configuration** -- Tracking URL, Ads Server URL, Customer ID, Page IDs (JSON), and Order Prefix.
5. **User Tracking ID (tID) Management** -- View current tID, generate new, reset, or set custom UUID.

**Import flow**:
- Categories: reads JSON file, shows animated progress bar (1.6s), calls `CatalogManager.importCategories()`, shows success banner with animated stat counters.
- Products: same flow with `CatalogManager.importProducts()`, supports replace/append modes, confirms before replacing existing products.

**Tracking**: None.

**Sponsored products**: None.

**Key methods**:
- `importCategories()` / `importProducts()` -- async file import with progress UI
- `clearCatalog()` -- confirm dialog then `CatalogManager.clearAll()`
- `saveSettings(event)` / `saveT2SSettings(event)` -- form submission handlers
- `generateNewTID()` / `resetTID()` / `saveCustomTID()` -- tID management
- `showProgressBar()` / `showSuccessBanner()` / `animateNumber()` -- animated import UI
- `updateProductCapacity()` -- capacity warning at 90%+ with pulse animation

**Injected styles**: The admin page injects its own `<style>` block (`#admin-styles`) for progress bars, success banners, capacity warnings, and related animations.

---

## Creating a New Page

1. **Create the module** at `js/pages/newpage.js`:

```javascript
import { getEl, escapeHtml } from '../utils.js';
import { Tracking } from '../tracking.js';

class NewPage {
    static render(params) {
        // Track page view (if needed)
        Tracking.trackPageView(pageId, pageType, context);

        const app = getEl('app');
        app.innerHTML = `
            <div class="container fade-in">
                <h1 class="page-title">New Page</h1>
            </div>
        `;
    }
}
export { NewPage };
```

2. **Register the route** in `js/app.js` inside `registerRoutes()`:

```javascript
Router.register('/new-page', (params) => NewPage.render(params));
```

3. **Load the script** in `index.html` before `app.js`:

```html
<script type="module" src="js/pages/newpage.js"></script>
```

4. **Add tracking** if the page should be tracked -- add a page ID constant in `Tracking.PAGE_IDS` and call the appropriate tracking methods in `render()`.

5. **Add sponsored products** if the page should show ads -- call `Tracking.requestSponsoredProducts()`, render an empty sponsored section, and update it when the promise resolves (see `category.js` for the pattern).

6. **Expose global methods** if the page uses `onclick` handlers in HTML templates, the class must be available on `window` (e.g., `window.NewPage = NewPage`).
