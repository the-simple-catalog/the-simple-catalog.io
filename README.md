# 🛒 E-Commerce Demo

> A fully static e-commerce Single Page Application built to demonstrate **Mirakl T2S Tracking** and **Mirakl Ads API** integration. No frameworks, no build tools, no backend — just pure HTML, CSS, and JavaScript.

**🌐 Live Demo**: [https://the-simple-catalog.github.io/the-simple-catalog.io](https://the-simple-catalog.github.io/the-simple-catalog.io)

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Catalog Data Format](#-catalog-data-format)
- [Configuration](#-configuration)
- [Debugging](#-debugging)
- [Testing with Chrome DevTools MCP](#-testing-with-chrome-devtools-mcp)
- [Notes](#-notes)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **T2S Page View Tracking** | Real-time page view, add-to-cart, and post-payment event tracking via the Mirakl T2S API |
| 🎯 **Sponsored Products (Ads API)** | Fetch and display sponsored product ads on category, search, and product pages with impression and click tracking |
| 📦 **Catalog Import** | Import products and categories from T2S-format JSON files through the Admin UI |
| 🔍 **Product Search** | Full-text search across the product catalog |
| 🛒 **Shopping Cart** | Persistent cart with add, remove, and quantity management |
| 💳 **Checkout Flow** | Complete purchase flow from cart to order confirmation (simulated payments) |
| 📱 **Responsive Design** | Mobile, tablet, and desktop layouts with modern CSS Grid and Flexbox |
| ⚡ **Zero Dependencies** | No npm, no build step — open `index.html` and go |

---

## 🚀 Quick Start

### 1. Start a local server

```bash
# Recommended: Python
python3 -m http.server 8000

# Alternative: Node.js
npx http-server -p 8000
```

Then open **http://localhost:8000** in your browser.

### 2. Import your catalog

> ⚠️ **Required**: The site needs product and category data in **Mirakl T2S catalog format** to function. Sample files are included in the `catalog/` directory.

1. Click **Admin** in the site header
2. Under **Import Categories**, upload `catalog/categories_t2s.json`
3. Under **Import Products**, upload `catalog/products_1P_t2s.json` and/or `catalog/products_3P_t2s.json`

You should now have **~700 categories** and **~1000 products** loaded.

### 3. Browse and explore

- Use the **Explore All Categories** dropdown to navigate the category tree
- Click on products to view details and add them to your cart
- Search for products using the header search bar
- Complete a checkout with the test card number `4111 1111 1111 1111`

### 4. (Optional) Configure Mirakl APIs

To enable live tracking and sponsored product recommendations:

1. Go to the **Admin** page (`#/admin`)
2. Scroll to **T2S Tracking Configuration** and set:
   - **T2S Customer ID** (required): Your Mirakl customer identifier
   - **Tracking URL** (required): Your T2S API endpoint
   - **Ads Server URL** (required): Your Mirakl Ads API endpoint
3. Click **Save Settings**
4. Browse the site — all tracking and ad serving calls will hit the configured endpoints

For detailed API payloads and debugging, see [Tracking & Ads Configuration](doc/tracking-and-ads.md#configuration)

---

## 🏗️ Project Structure

```
demo/
├── index.html                  # Single HTML entry point
├── css/
│   └── styles.css              # All styles (CSS variables, Grid, Flexbox)
├── js/
│   ├── app.js                  # Application entry point & route registration
│   ├── router.js               # Hash-based SPA router
│   ├── utils.js                # Shared utilities (escapeHtml, formatPrice, etc.)
│   ├── catalog.js              # CatalogManager & Settings classes
│   ├── cart.js                 # Shopping cart logic
│   ├── tracking.js             # T2S Tracking & Ads API integration
│   └── pages/
│       ├── home.js             # Homepage (Page ID: 1000)
│       ├── category.js         # Category page (Page ID: 1400)
│       ├── product.js          # Product detail (Page ID: 1200)
│       ├── search.js           # Search results (Page ID: 2000)
│       ├── cart.js             # Cart page (Page ID: 1600)
│       ├── checkout.js         # Checkout/payment (Page ID: 3200)
│       ├── orderconfirmation.js# Order confirmation (Page ID: 2400)
│       └── admin.js            # Admin settings & catalog import
├── catalog/                    # Sample T2S-format catalog data
│   ├── categories_t2s.json     # ~700 categories
│   ├── products_1P_t2s.json    # First-party products
│   └── products_3P_t2s.json    # Third-party marketplace products
└── doc/                        # Developer documentation
    ├── architecture.md         # Architecture & data flow
    ├── tracking-and-ads.md     # T2S Tracking & Ads API reference
    ├── pages.md                # Page modules documentation
    ├── conventions.md          # Code conventions & standards
    └── test/
        └── e2e-test-scenario.md# End-to-end test scenario
```

---

## 📖 Documentation

Detailed developer documentation is available in the `doc/` directory. Start with your role:

### Overview

| Document | Purpose |
|----------|---------|
| [How It Works](doc/how-it-works.md) | How a static site works without a backend — architecture diagrams, settings mechanism, and security model |

### For Backend/API Developers

| Document | Purpose |
|----------|---------|
| [Tracking & Ads](doc/tracking-and-ads.md) | Complete reference for T2S Tracking API and Mirakl Ads API integration, payloads, and debugging |
| [Configuration](#-configuration) | How to set up tracking and ads endpoints |

### For Frontend Developers

| Document | Purpose |
|----------|---------|
| [Architecture](doc/architecture.md) | SPA architecture, routing system, data management, and module interactions |
| [Pages](doc/pages.md) | Documentation for all page modules, their rendering logic, and tracking behavior |
| [Router](doc/router.md) | Hash-based SPA routing system and pattern matching |
| [Conventions](doc/conventions.md) | Code style, naming conventions, security practices, and contribution guidelines |

### For QA/Testing

| Document | Purpose |
|----------|---------|
| [E2E Test Scenario](doc/test/e2e-test-scenario.md) | Step-by-step end-to-end test flow using Chrome DevTools MCP |

---

## 🔧 Debugging

Open the browser console (F12) to monitor API activity:

| Prefix | Meaning | Action |
|--------|---------|--------|
| `📊 [TRACKING]` | T2S tracking event fired | Verify in Network tab for payload |
| `✅ [AD SERVING]` | Sponsored products received | Check Network > Filter `rendered-content` |
| `⚠️ [AD SERVING]` | Ad configuration incomplete | Check Admin page settings |
| `❌ [TRACKING/AD SERVING]` | API call failed | Check endpoint URLs and CORS settings |

**Quick troubleshooting**: See the [Debugging](doc/tracking-and-ads.md#debugging) section in the Tracking & Ads documentation for detailed error resolution.

---

## 🧪 Testing with Chrome DevTools MCP

The project includes a `.mcp.json` configuration for automated browser testing:

```bash
# Start Chrome with remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

Then follow the test scenario in [`doc/test/e2e-test-scenario.md`](doc/test/e2e-test-scenario.md) to run the full E2E flow.

---

## 📋 Catalog Data Format

The site expects catalog files in **Mirakl T2S format**. Each file is a JSON array of objects.

### Products Format

```json
{
  "action": "upsert",
  "type": "product",
  "id": "4123018513199-0",
  "content": {
    "sku": "4123018513199-1P",
    "name": "Product Name",
    "longDescription": "Description",
    "imageUrl": "https://example.com/image.jpg",
    "regularPrice": "7.50",
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

**Required fields**:
- `id` — Unique product identifier
- `content.name` — Product name (displayed in UI)
- `content.regularPrice` — Base price
- `content.categories` — Array of category IDs (product appears in all)
- `content.imageUrl` — Product image URL

### Categories Format

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

**Required fields**:
- `id` — Unique category identifier
- `content.name` — Category display name
- `content.parentId` — Parent category ID (`"root"` for top-level categories)

**See also**: Sample files in `catalog/` directory for complete data examples.

---

## ⚙️ Configuration

All settings are managed through the **Admin** page (`#/admin`). Settings are persisted in `localStorage` and survive page reloads.

### Site Settings

| Setting | Description | Example |
|---------|-------------|---------|
| **Site Name** | Displayed in the page header | `My E-Commerce Store` |

### T2S Tracking Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| **T2S Customer ID** | Mirakl customer identifier used in all tracking requests | `CUSTOMER_PUBLIC_ID` |
| **Tracking URL** | T2S Tracking API endpoint base URL | `https://xxxxx.retail.mirakl.net` |
| **Ads Server URL** | Mirakl Ads API endpoint base URL | `https://xxxxx.retailmedia.mirakl.net` |

For detailed API configuration and debugging, see the [Tracking & Ads Configuration](doc/tracking-and-ads.md#configuration) section.

---

## 📝 Important Notes

| Topic | Note |
|-------|------|
| **Payments** | Checkout always succeeds with any test card number (e.g., `4111 1111 1111 1111`). No real payment processing occurs. |
| **Data Storage** | All data (catalog, cart, settings, user ID) is stored in the browser's `localStorage`. Clearing browser data will reset everything. |
| **Product Limit** | Maximum 3000 products configurable in `js/catalog.js` (`MAX_PRODUCTS`) due to localStorage constraints. |
| **Browser Support** | Targets modern Chrome. Uses ES6+, CSS Grid, Flexbox, and native browser APIs (no polyfills). |
| **Tracking & Ads** | All API calls are fire-and-forget and never block the UI. Errors are caught and logged to the console. |
| **User ID** | A unique tracking ID (TID) is generated once per browser and stored in `localStorage`. Reset in Admin page if needed. |

---

## ⚠️ Disclaimer

<sub>This demo application is provided as a reference implementation example only. It is **not official integration documentation** for the Mirakl Ads API or Mirakl T2S Tracking API. For official API documentation, integration guidelines, and best practices, please consult the official Mirakl developer documentation or contact Mirakl support.</sub>

---
