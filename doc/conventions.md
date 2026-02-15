# Code Conventions and Standards

This document is the definitive reference for all code conventions, naming standards, patterns, and practices used in this project. All contributors must follow these conventions to maintain consistency across the codebase.

**Intended audience**: All developers contributing to this project.

**Cross-references**:
- See [Architecture](./architecture.md) for module structure and design patterns
- See [Pages](./pages.md) for page module examples
- See [Router](./router.md) for routing patterns
- See [Tracking & Ads](./tracking-and-ads.md) for API integration conventions

## Table of Contents

- [Language and Localization](#language-and-localization)
- [JavaScript Patterns](#javascript-patterns)
- [Naming Conventions](#naming-conventions)
- [Utility Function Usage](#utility-function-usage)
- [Security Practices](#security-practices)
- [Code Style and Commenting](#code-style-and-commenting)
- [Git Commit Conventions](#git-commit-conventions)
- [LocalStorage Key Naming](#localstorage-key-naming)
- [Browser Support Policy](#browser-support-policy)
- [File Organization](#file-organization)

---

## Language and Localization

- **All code and comments must be in English.** No French or other languages in source files.
- Variable names, function names, class names, documentation, and inline comments are all written in English.

---

## JavaScript Patterns

All modules in this project use modern JavaScript patterns to ensure consistency, clarity, and maintainability.

### ES6 Classes with Static Methods

Every module in this project is implemented as an ES6 class with static methods. Classes are used even when only a single instance exists because they provide better encapsulation, clearer intent, and IDE-friendly structure.

**Pattern:**

```javascript
class ModuleName {
    static PUBLIC_CONSTANT = 'value';   // Public static field
    static #privateField = {};          // Private static field

    /**
     * Description of method
     * @param {string} param - Parameter description
     * @returns {string} Return description
     */
    static methodName(param) {
        // Implementation
    }
}

export { ModuleName };
```

**Rules:**

- All modules use `class` syntax -- never plain objects or standalone functions for module APIs.
- Methods are `static` because these classes act as namespaces; they are never instantiated.
- Use private class fields (`#fieldName`) for internal state that should not be accessed from outside the class.
- Public constants use `UPPER_SNAKE_CASE` and are declared as static fields.
- Always export the class at the bottom of the file using named exports: `export { ClassName }`.

**Existing classes in the codebase:**

| Class | File | Purpose |
|---|---|---|
| `CatalogManager` | `js/catalog.js` | Product and category data management |
| `Settings` | `js/catalog.js` | Site configuration and user tracking ID |
| `Cart` | `js/cart.js` | Shopping cart operations |
| `Router` | `js/router.js` | Hash-based SPA routing |
| `Tracking` | `js/tracking.js` | T2S tracking and ads integration |
| `HomePage` | `js/pages/home.js` | Homepage rendering |
| `CategoryPage` | `js/pages/category.js` | Category page rendering |
| `ProductPage` | `js/pages/product.js` | Product detail page rendering |
| `SearchPage` | `js/pages/search.js` | Search results rendering |
| `CartPage` | `js/pages/cart.js` | Cart page rendering |
| `CheckoutPage` | `js/pages/checkout.js` | Checkout form rendering |
| `OrderConfirmationPage` | `js/pages/orderconfirmation.js` | Order confirmation rendering |
| `AdminPage` | `js/pages/admin.js` | Admin settings and import UI |

### Page Module Pattern

Every page follows the same structure:

```javascript
// ===================================
// PageName - Brief description
// ===================================

import { getEl, escapeHtml } from '../utils.js';
import { CatalogManager, Settings } from '../catalog.js';
import { Tracking } from '../tracking.js';

class PageName {
    /**
     * Render the page
     * @param {Object} params - Route parameters
     */
    static render(params) {
        const app = getEl('app');

        // 1. Track page view
        Tracking.trackPageView(pageId, pageType);

        // 2. Fetch data
        const data = CatalogManager.getSomeData();

        // 3. Update #app innerHTML
        app.innerHTML = `
            <div class="container fade-in">
                <!-- Page content -->
            </div>
        `;

        // 4. Attach event listeners if needed
    }
}

export { PageName };
```

**Rules:**

- Each page lives in `js/pages/<pagename>.js`.
- The class has a static `render(params)` method as its entry point.
- The render method updates the `#app` element's `innerHTML`.
- Tracking calls happen at the top of the render method.
- Template literals are used for HTML generation.

### Module Imports

Use ES6 module imports. Import only what is needed:

```javascript
import { getEl, escapeHtml, formatPrice } from '../utils.js';
import { CatalogManager, Settings } from '../catalog.js';
import { Cart } from '../cart.js';
import { Tracking } from '../tracking.js';
```

---

## Naming Conventions

Clear, consistent naming makes code easier to read and maintain. Follow these conventions across the project.

### Variables and Functions

- **camelCase** for all variables and functions: `productId`, `getProducts()`, `searchQuery`.
- Choose descriptive names that communicate intent: `getProductsByCategory()` not `getProdsByCat()`.

### Classes

- **PascalCase** for class names: `CatalogManager`, `HomePage`, `OrderConfirmationPage`.
- Page classes end with `Page`: `CategoryPage`, `SearchPage`, `CartPage`.

### Constants

- **UPPER_SNAKE_CASE** for class-level constants: `MAX_PRODUCTS`, `STORAGE_KEY_PRODUCTS`, `PAGE_IDS`.
- Declared as `static` fields on the class.

### Private Fields

- Prefixed with `#`: `#STORAGE_KEY`, `#routes`, `#categoryIconCache`.
- Always `static` in this codebase since classes are never instantiated.

### CSS Classes

- **kebab-case** for CSS class names: `product-card`, `hero-banner`, `category-dropdown-item`.
- BEM-like naming where it makes sense: `product-card-image`, `product-badge-sale`.

### HTML IDs

- **kebab-case** for element IDs: `app`, `site-name`, `header-search-form`, `categories-dropdown-btn`.

### LocalStorage Keys

- **snake_case** prefixed with `ecommerce_`: `ecommerce_products`, `ecommerce_cart`.
- See the [LocalStorage Key Naming](#localstorage-key-naming) section for the full list.

### File Names

- **lowercase** with no separators for page files: `home.js`, `category.js`, `orderconfirmation.js`.
- **lowercase** for other modules: `catalog.js`, `tracking.js`, `utils.js`, `router.js`, `app.js`.
- **kebab-case** for multi-word non-page files if needed.

---

## Utility Function Usage

The project provides a set of utility functions in `js/utils.js` to abstract common operations and ensure consistency across the codebase. **Always use these instead of raw DOM APIs.** This ensures security, consistency, and easier refactoring.

### `getEl(id)` -- Get Element by ID

Use instead of `document.getElementById()`:

```javascript
// Correct
const app = getEl('app');

// Incorrect
const app = document.getElementById('app');
```

### `createElement(tag, attrs, content)` -- Create DOM Elements

Use for programmatic DOM creation:

```javascript
const item = createElement('div', { className: 'category-dropdown-item' });
const link = createElement('a', { href: '#/product/123', className: 'btn' }, 'View');
```

Special attribute handling:
- `className` maps to `el.className`
- `onClick` attaches a click event listener
- All other attributes use `setAttribute()`

### `escapeHtml(str)` -- XSS Prevention

**Mandatory** when inserting any dynamic content into HTML. See [Security Practices](#security-practices).

```javascript
`<div class="product-name">${escapeHtml(product.content.name)}</div>`
```

### `formatPrice(price)` -- Currency Formatting

Always use for displaying prices to ensure consistent `$XX.XX` format:

```javascript
formatPrice(45.5)    // "$45.50"
formatPrice('7.5')   // "$7.50"
formatPrice(null)    // "$0.00"
```

### `navigateTo(path)` -- SPA Navigation

Use for programmatic navigation:

```javascript
navigateTo('/category/1-1');
navigateTo('/search?q=books');
```

### `generateUUID()` -- Unique Identifiers

Uses the native `crypto.randomUUID()` API:

```javascript
const id = generateUUID(); // "550e8400-e29b-41d4-a716-446655440000"
```

### `debounce(func, wait)` -- Rate Limiting

Use for input handlers that fire frequently:

```javascript
const handleSearch = debounce((query) => {
    // Search logic
}, 300);
```

### `showMessage(message, type)` -- User Notifications

Display temporary notification messages:

```javascript
showMessage('Product added to cart!', 'success');
showMessage('Error loading data', 'error');
showMessage('Loading...', 'info');
```

### `generateProductBadges(product, isSponsored)` -- Product Badges

Generates badge HTML for product cards:

```javascript
const badges = generateProductBadges(product, true); // Sale, Sponsored, Marketplace badges
```

---

## Security Practices

Security is critical in web applications. Follow these practices to prevent common vulnerabilities.

### XSS Prevention with `escapeHtml()`

**Rule: Always escape dynamic content before inserting it into HTML.**

The `escapeHtml()` function creates a temporary DOM text node to safely escape HTML entities. This prevents Cross-Site Scripting (XSS) attacks.

**What to escape:**

- Product names, descriptions, and brands
- Category names
- Search queries
- User input of any kind
- Any data from localStorage or external APIs
- URL parameters displayed in the UI

**Examples:**

```javascript
// Correct -- escaped
`<h1>${escapeHtml(category.content.name)}</h1>`
`<div class="product-name">${escapeHtml(productName)}</div>`
`<input value="${escapeHtml(searchQuery)}">`

// Incorrect -- unescaped (XSS vulnerability)
`<h1>${category.content.name}</h1>`
`<div class="product-name">${productName}</div>`
```

**When escaping is NOT needed:**

- Static HTML strings with no dynamic content
- Numeric values used in calculations (not displayed)
- CSS class names that are hardcoded in the source

### URL Encoding

Use `encodeURIComponent()` when inserting dynamic values into URLs:

```javascript
`https://placehold.co/250x250?text=${encodeURIComponent(categoryName)}`
`#/search?q=${encodeURIComponent(query)}`
```

### innerHTML Usage

When using `innerHTML` with template literals, every interpolated value that comes from data must be escaped:

```javascript
app.innerHTML = `
    <div class="product-name">${escapeHtml(name)}</div>
    <div class="product-price">${formatPrice(price)}</div>
`;
```

Note: `formatPrice()` returns a safe string (starts with `$` followed by digits), so it does not need additional escaping.

---

## Code Style and Commenting

### Section Headers

Every file begins with a section header:

```javascript
// ===================================
// Module Name - Brief description
// ===================================
```

### JSDoc Documentation

Every function has a JSDoc comment block:

```javascript
/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Object|null} Product object or null
 */
static getProductById(productId) {
    // ...
}
```

Include `@param` for every parameter and `@returns` for the return value. Use TypeScript-style type annotations: `{string}`, `{number}`, `{Object}`, `{Array}`, `{boolean}`, `{Function}`, `{void}`, `{*}`, `{string|null}`.

### Inline Comments

Use inline comments to explain non-obvious logic:

```javascript
// Fire-and-forget POST request
fetch(apiUrl, { ... }).catch(error => { ... });

// Use Map for efficient deduplication
const productsMap = new Map();
```

### Template Literals for HTML

Always use backtick template literals for HTML generation:

```javascript
app.innerHTML = `
    <div class="container fade-in">
        <h1 class="page-title">${escapeHtml(title)}</h1>
    </div>
`;
```

### Separation of Concerns

The codebase maintains clear boundaries:

- **Pages** (`js/pages/*.js`) -- rendering and page-level logic
- **Routing** (`js/router.js`) -- URL matching and navigation
- **Catalog** (`js/catalog.js`) -- data access and storage
- **Cart** (`js/cart.js`) -- shopping cart operations
- **Tracking** (`js/tracking.js`) -- analytics and ad serving
- **Utilities** (`js/utils.js`) -- shared helper functions
- **App** (`js/app.js`) -- initialization and route registration

---

## Git Commit Conventions

All commits use **gitmoji** prefixes to clearly indicate the type of change. This makes commit history scannable and improves collaboration.

### Format

```
<gitmoji> <subject>
```

The subject is a concise, imperative sentence describing the change. No period at the end.

### Gitmoji Reference

| Gitmoji | Code | Use When |
|---|---|---|
| :sparkles: | `:sparkles:` | New feature or enhancement |
| :bug: | `:bug:` | Bug fix |
| :wrench: | `:wrench:` | Configuration changes (settings, JSON files) |
| :memo: | `:memo:` | Documentation updates |
| :lipstick: | `:lipstick:` | UI/styling changes (CSS, HTML structure) |
| :recycle: | `:recycle:` | Code refactoring (no functional changes) |
| :zap: | `:zap:` | Performance improvements |
| :lock: | `:lock:` | Security fixes |
| :heavy_plus_sign: | `:heavy_plus_sign:` | Add dependency or file |
| :heavy_minus_sign: | `:heavy_minus_sign:` | Remove dependency or file |
| :art: | `:art:` | Code structure/formatting improvements |
| :rocket: | `:rocket:` | Deployment or production-related changes |
| :fire: | `:fire:` | Remove code, files, or features |
| :see_no_evil: | `:see_no_evil:` | Add or update .gitignore |
| :construction: | `:construction:` | Work in progress |
| :tada: | `:tada:` | Initial commit or major milestone |

### Examples

```
✨ Add sponsored products carousel on homepage
🐛 Fix cart total calculation rounding error
💄 Redesign admin import UI with progress animation
🔧 Update T2S tracking endpoint configuration
♻️ Refactor tracking module to use ES6 classes
📝 Update CLAUDE.md with gitmoji conventions
🙈 Add .claude/ to gitignore
```

### Choosing the Right Gitmoji

- Adding a brand new page or feature? Use **sparkles**.
- Fixing something that was broken? Use **bug**.
- Changing only CSS or HTML layout? Use **lipstick**.
- Restructuring code without changing behavior? Use **recycle**.
- Updating README, CLAUDE.md, or doc files? Use **memo**.
- Changing configuration or settings defaults? Use **wrench**.

---

## LocalStorage Key Naming

All localStorage keys follow the pattern `ecommerce_<purpose>` using snake_case:

| Key | Purpose | Managed By |
|---|---|---|
| `ecommerce_products` | Product catalog data (JSON array) | `CatalogManager` |
| `ecommerce_categories` | Category catalog data (JSON array) | `CatalogManager` |
| `ecommerce_cart` | Shopping cart items (JSON array) | `Cart` |
| `ecommerce_settings` | Site configuration (JSON object) | `Settings` |
| `user_tid` | User tracking ID (UUID string) | `Settings` |

**Rules:**

- Always access localStorage through the corresponding class methods, never directly.
- Each class defines its storage key as a private or public static field (e.g., `static #STORAGE_KEY = 'ecommerce_cart'`).
- Always wrap `localStorage` operations in try/catch blocks to handle quota errors or disabled storage.
- Always `JSON.parse()` / `JSON.stringify()` when reading/writing objects.
- Return sensible defaults (empty array `[]`, empty object `{}`) when data is missing or corrupt.

---

## Browser Support Policy

This project targets **modern browsers only**, primarily **Google Chrome**. This decision allows us to use modern APIs and features without compatibility shims, resulting in cleaner code and smaller bundle sizes.

### What to Use

- ES6+ syntax: classes, arrow functions, template literals, destructuring, spread/rest, `async`/`await`
- Native APIs: `fetch`, `crypto.randomUUID()`, `URLSearchParams`, `localStorage`, `sessionStorage`
- CSS Grid and Flexbox without vendor prefixes
- CSS custom properties (`var(--color-primary)`)
- ES modules (`import`/`export`)

### What NOT to Do

- Do not add polyfills or fallbacks for older browsers
- Do not add vendor prefixes to CSS (`-webkit-`, `-moz-`, etc.)
- Do not use CommonJS (`require()`, `module.exports`)
- Do not add compatibility libraries (jQuery, Babel, core-js)
- Do not check for feature support before using modern APIs

---

## File Organization

### Directory Structure

```
project-root/
  index.html          # Single HTML entry point
  css/
    styles.css        # All styles (CSS variables for theming)
  js/
    app.js            # Application entry point, route registration
    router.js         # SPA routing system
    catalog.js        # CatalogManager + Settings classes
    cart.js           # Cart class
    tracking.js       # Tracking class (T2S + Ads)
    utils.js          # Shared utility functions
    pages/
      home.js         # Homepage
      category.js     # Category listing
      product.js      # Product detail
      search.js       # Search results
      cart.js         # Cart page
      checkout.js     # Checkout form
      orderconfirmation.js  # Order confirmation
      admin.js        # Admin settings and import
  catalog/
    categories_t2s.json     # Example category data
    products_1P_t2s.json    # Example 1P product data
    products_3P_t2s.json    # Example 3P product data
  doc/
    *.md              # Documentation files
```

### Script Loading Order

Scripts are loaded in `index.html` as ES modules. The `app.js` file is the entry point and imports all other modules. The DOMContentLoaded event triggers initialization.

### Adding New Files

When adding a new page:

1. Create `js/pages/newpage.js` with the page class pattern
2. Register the route in `js/app.js` inside `registerRoutes()`
3. Import the page class at the top of `js/app.js`
4. No need to add `<script>` tags -- ES module imports handle loading

When adding a new utility:

1. Add the function to `js/utils.js`
2. Add it to the `export` block at the bottom of the file
3. Import it where needed
