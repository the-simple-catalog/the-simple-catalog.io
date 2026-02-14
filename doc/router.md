# Router System

The application uses a hash-based Single Page Application (SPA) router implemented in `js/router.js`. All navigation happens client-side by changing the URL hash fragment — no server requests are made when switching pages.

**Intended audience**: Frontend developers understanding the routing system or adding new routes.

**Cross-references**:
- See [Architecture](./architecture.md) for high-level SPA design
- See [Pages](./pages.md) for page registration and handler patterns
- See [Conventions](./conventions.md) for ES6 class and naming conventions

## Table of Contents

- [How It Works](#how-it-works)
- [Route Registration](#route-registration)
- [Pattern Matching](#pattern-matching)
- [Query Parameter Parsing](#query-parameter-parsing)
- [Navigation](#navigation)
- [Initialization](#initialization)
- [Adding a New Route](#adding-a-new-route)
- [Referer Tracking](#referer-tracking)
- [API Reference](#api-reference)

---

## How It Works

The router listens for `hashchange` events on the `window` object. When the URL hash changes (e.g., from `#/` to `#/category/1-1`), the router:

1. Parses the hash into a **path** and **query parameters**
2. Tries to match the path against registered route patterns
3. Extracts dynamic parameters from the URL
4. Calls the matching handler function with the combined parameters

```
URL: http://localhost:8000/#/category/1-1?sort=price
                            ^^^^^^^^^^^^^^^^^^^^^^^^
                            hash fragment

Parsed as:
  path:   "/category/1-1"
  params: { sort: "price" }

Matched against pattern: "/category/:categoryId"

Handler receives: { sort: "price", categoryId: "1-1" }
```

---

## Route Registration

Routes are registered during application startup in `js/app.js` inside the `registerRoutes()` function using `Router.register(pattern, handler)`. Each route is a mapping between a URL pattern and a handler function (typically a page's `render()` method).

```javascript
// Exact path — no dynamic segments
Router.register('/', (params) => HomePage.render(params));
Router.register('/cart', (params) => CartPage.render(params));
Router.register('/checkout', (params) => CheckoutPage.render(params));

// Dynamic segments — :paramName captures a URL segment
Router.register('/category/:categoryId', (params) => CategoryPage.render(params));
Router.register('/product/:productId', (params) => ProductPage.render(params));

// Query parameters — parsed automatically from ?key=value
Router.register('/search', (params) => SearchPage.render(params));
// URL #/search?q=book -> params = { q: "book" }
```

Each handler is a function that receives a `params` object containing both URL path parameters and query string parameters merged together.

---

## Pattern Matching

When a hash change occurs, the router needs to find which registered route matches the new URL path. It uses a two-step matching strategy in `Router.resolve()`:

### Step 1: Exact Match

The path is compared directly against registered route keys. This handles static routes like `/`, `/cart`, `/checkout`, and `/search`.

### Step 2: Pattern Match

If no exact match is found, the router iterates over all registered patterns and calls `Router.matchPattern(pattern, path)`. This method:

1. Splits both the pattern and the path by `/`
2. Checks that they have the **same number of segments**
3. Compares each segment:
   - If the pattern segment starts with `:`, it is a **dynamic parameter** — the corresponding path segment is captured
   - Otherwise, the segments must match exactly

```javascript
// Pattern: "/category/:categoryId"
// Path:    "/category/1-1"
//
// Segment 0: "" === ""              -> match
// Segment 1: "category" === "category" -> match
// Segment 2: ":categoryId" starts with ":" -> capture categoryId = "1-1"
//
// Result: { categoryId: "1-1" }
```

If no route matches at all, the router renders a **404 page**.

---

## Query Parameter Parsing

Query parameters are extracted from the hash by the `parseRoute()` utility in `js/utils.js`:

```javascript
// URL hash: #/search?q=book&page=2
//
// parseRoute() returns:
// {
//   path: "/search",
//   params: { q: "book", page: "2" }
// }
```

The router merges these query params with any path params extracted during pattern matching, so handlers always receive a single unified `params` object.

---

## Navigation

There are three ways to trigger navigation:

### 1. Direct hash assignment (most common)

```javascript
window.location.hash = `/category/${categoryId}`;
```

### 2. Router.navigate()

```javascript
Router.navigate('/cart');
```

### 3. HTML anchor links

```html
<a href="#/product/123">View Product</a>
```

All three methods change the URL hash, which fires the `hashchange` event and triggers `Router.resolve()`.

---

## Initialization

The router is initialized in `js/app.js` during `DOMContentLoaded`:

```javascript
Router.init();
```

`Router.init()` does two things:

1. **Registers the `hashchange` listener** — every future hash change calls `Router.resolve()`
2. **Handles the initial page load**:
   - If no hash is present, redirects to `#/` (homepage)
   - If a hash already exists (e.g., user refreshed on `#/product/123`), resolves it immediately

---

## Adding a New Route

To add a new page to the application:

### 1. Create the page module

Create `js/pages/mypage.js` with a class that has a static `render(params)` method:

```javascript
import { getEl, escapeHtml } from '../utils.js';

class MyPage {
    static render(params) {
        const app = getEl('app');
        app.innerHTML = `
            <div class="container">
                <h1 class="page-title">My New Page</h1>
                <p>Parameter value: ${escapeHtml(params.myParam || '')}</p>
            </div>
        `;
    }
}

export { MyPage };
```

### 2. Register the route in app.js

Import the page module and add a route in `registerRoutes()`:

```javascript
import { MyPage } from './pages/mypage.js';

// Inside registerRoutes():
Router.register('/mypage/:myParam', (params) => MyPage.render(params));
```

### 3. Navigate to it

```javascript
window.location.hash = '/mypage/hello';
// MyPage.render() receives { myParam: "hello" }
```

No changes to `index.html` are needed since the app uses ES module imports.

---

## Referer Tracking

The application tracks the previous page URL in `sessionStorage` for the T2S tracking `referer` field. Each page's `render()` method stores the current URL before sending tracking events, so the next page can read it as the referer. This is handled at the page level, not in the router itself.

---

## API Reference

| Method | Description |
|--------|-------------|
| `Router.register(pattern, handler)` | Register a route pattern with its handler function |
| `Router.navigate(path)` | Programmatically navigate to a path |
| `Router.resolve()` | Parse the current hash and invoke the matching handler |
| `Router.matchPattern(pattern, path)` | Match a path against a pattern, return extracted params or `null` |
| `Router.show404()` | Render the 404 page into `#app` |
| `Router.init()` | Start the router (listen for hash changes, resolve initial route) |
