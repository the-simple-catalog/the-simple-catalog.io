# T2S Tracking & Mirakl Ads API Integration

This document describes how the demo site integrates with the Mirakl T2S Tracking API and the Mirakl Ads API for sponsored products. All integration code lives in `js/tracking.js` inside the `Tracking` class.

**Intended audience**: Backend/API developers, data analysts, and advanced frontend developers.

**Cross-references**:
- See [Architecture](./architecture.md) for the Tracking module in the module dependency graph
- See [Pages](./pages.md) for which pages fire which tracking events
- See [Conventions](./conventions.md) for code patterns and security practices

## Table of Contents

- [Overview](#overview)
- [Quick Start: Configuring Tracking & Ads](#quick-start-configuring-tracking--ads)
- [T2S Tracking API](#t2s-tracking-api)
  - [Endpoint and Transport](#endpoint-and-transport)
  - [Common Fields](#common-fields)
  - [Event Types](#event-types)
  - [SPA Referer Handling](#spa-referer-handling)
- [Mirakl Ads API](#mirakl-ads-api)
  - [Requesting Sponsored Products](#requesting-sponsored-products)
  - [Request Payloads by Page Type](#request-payloads-by-page-type)
  - [Response Structure](#response-structure)
  - [Rendering Sponsored Products](#rendering-sponsored-products)
  - [Impression and Click Tracking](#impression-and-click-tracking)
- [Event Tracking Flow by Page](#event-tracking-flow-by-page)
- [Configuration](#configuration)
- [How to Add a New Tracking Event](#how-to-add-a-new-tracking-event)
- [How to Modify Sponsored Products](#how-to-modify-sponsored-products)
- [Debugging](#debugging)

---

## Overview

The integration consists of two independent systems:

1. **T2S Tracking API** -- Sends page view and conversion events to the Mirakl analytics backend. All calls are fire-and-forget `POST` requests that never block the UI.
2. **Mirakl Ads API** -- Fetches sponsored product recommendations and renders them on category, search, and product pages. Includes impression and click tracking for each ad.

Both systems read their configuration (endpoint URLs, customer ID) from `Settings` in `js/catalog.js`, which persists to `localStorage` and is editable from the Admin page.

---

## Quick Start: Configuring Tracking & Ads

To enable tracking and sponsored product ads:

1. Open the **Admin** page (`#/admin`)
2. Scroll to **T2S Tracking Configuration**
3. Fill in:
   - **Tracking URL**: Your T2S API endpoint (default: `https://xxxxx.retail.mirakl.net`)
   - **Ads Server URL**: Your Mirakl Ads API endpoint (default: `https://xxxxx.retailmedia.mirakl.net`)
   - **T2S Customer ID**: Your Mirakl customer identifier
4. Click **Save Settings**

After configuration, browse the site normally:
- **Tracking** will fire automatically on category, product, and search pages
- **Sponsored products** will display on applicable pages
- Check the browser console (F12) for `[TRACKING]` and `[AD SERVING]` logs

---

## T2S Tracking API

### Endpoint and Transport

| Property       | Value                                                  |
| -------------- | ------------------------------------------------------ |
| **URL**        | `POST {trackingUrl}/1.1/json/T/t`                      |
| **Content-Type** | `application/x-www-form-urlencoded`                  |
| **Method**     | Fire-and-forget (no `await`, errors are caught and logged) |

The base `trackingUrl` comes from settings.

### Common Fields

Every tracking event includes these fields, assembled automatically by `Tracking.sendTrackingEvent()`:

| Field          | Description                                          | Source                                |
| -------------- | ---------------------------------------------------- | ------------------------------------- |
| `cID`          | Customer ID                                          | `settings.t2sCustomerId`              |
| `pageId`       | Numeric page type identifier                         | Passed per event (see table below)    |
| `userId`       | Persistent user tracking ID (UUID)                   | `Settings.getTID()` (localStorage)    |
| `userConsent`  | Consent flag                                         | Always `true`                         |
| `eventName`    | Event type                                           | `"view"` for all standard events      |
| `url`          | Current page URL                                     | `window.location.href` (auto-added)   |
| `referer`      | Previous page URL                                    | `sessionStorage` (auto-added, SPA)    |

**Page ID constants** (defined in `Tracking.PAGE_IDS`):

| Constant             | Value  | Used On                |
| -------------------- | ------ | ---------------------- |
| `HOMEPAGE`           | `1000` | Homepage (no tracking) |
| `CATEGORY`           | `1400` | Category page          |
| `PRODUCT`            | `1200` | Product detail page    |
| `SEARCH`             | `2000` | Search results page    |
| `CART`               | `1600` | Add-to-cart events     |
| `PAYMENT`            | `3200` | Checkout (not tracked) |
| `ORDER_CONFIRMATION` | `2400` | Post-payment page      |

These values are configurable via `settings.t2sPageIds`.

### Event Types

#### Category View

Triggered when a user navigates to a category page.

**Method:** `Tracking.trackCategoryView(categoryId)`
**Called from:** `js/pages/category.js` in `CategoryPage.render()`

| Field        | Value                          |
| ------------ | ------------------------------ |
| `categoryId` | The category being viewed      |
| `pageNumber` | Always `1`                     |

**Example payload:**

```
cID=CUSTOMER_PUBLIC_ID&pageId=1400&categoryId=1-2-3&pageNumber=1&userConsent=true&userId=abc-def-123&eventName=view&url=http%3A%2F%2Flocalhost%3A8000%2F%23%2Fcategory%2F1-2-3&referer=http%3A%2F%2Flocalhost%3A8000%2F%23%2F
```

#### Search View

Triggered when search results are displayed with a query of 3+ characters.

**Method:** `Tracking.trackSearchView(searchQuery, productIds)`
**Called from:** `js/pages/search.js` in `SearchPage.logSearchQuery()`

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| `keywords`  | The search query string                            |
| `productId` | Pipe-separated product IDs from results (`A|B|C`)  |

**Example payload:**

```
cID=CUSTOMER_PUBLIC_ID&pageId=2000&keywords=manga&productId=4123018513199-0|4123018513200-0&userConsent=true&userId=abc-def-123&eventName=view&url=...
```

#### Product View

Triggered when a user opens a product detail page.

**Method:** `Tracking.trackProductView(productId)`
**Called from:** `js/pages/product.js` in `ProductPage.render()`

| Field       | Value                  |
| ----------- | ---------------------- |
| `productId` | The product being viewed |

#### Add to Cart

Triggered when a product is added to the cart (from any page).

**Method:** `Tracking.trackAddToCart(productId, quantity, price)`
**Called from:** `js/cart.js` in `Cart.addItem()`

| Field              | Value                              |
| ------------------ | ---------------------------------- |
| `productId`        | The product being added            |
| `productsQuantity` | Quantity added                     |
| `basketAmount`     | Total amount (`quantity * price`)   |

#### Post-Payment (Order Confirmation)

Triggered when the order confirmation page renders.

**Method:** `Tracking.trackPostPayment(orderData)`
**Called from:** `js/pages/orderconfirmation.js` in `OrderConfirmationPage.render()`

| Field              | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `productId`        | Pipe-separated product IDs (`PROD1|PROD2`)                   |
| `productsQuantity` | Pipe-separated quantities (`2|1`)                            |
| `priceList`        | Pipe-separated line totals, each = `quantity * unitPrice` (`90|45.50`) |
| `basketAmount`     | Order total                                                  |
| `orderId`          | Unique order identifier (e.g. `ORDER_1707849123456`)         |

**Example with 3 products:**

```
Product A: qty=2, unitPrice=45.00   -> priceList item = 90.00
Product B: qty=1, unitPrice=45.50   -> priceList item = 45.50
Product C: qty=3, unitPrice=40.00   -> priceList item = 120.00

Result:
  productId        = PROD_A|PROD_B|PROD_C
  productsQuantity = 2|1|3
  priceList        = 90|45.50|120
  basketAmount     = 255.50
  orderId          = ORDER_1707849123456
```

### SPA Referer Handling

In a single-page application, `document.referrer` does not update on hash-based navigation. The `Tracking` class works around this:

1. On every tracking call, the current `window.location.href` is stored in `sessionStorage` under the key `previousUrl`.
2. On the next tracking call, that stored URL is read and attached as the `referer` field.
3. This gives accurate page-to-page referer chains within the SPA.

This logic is in `sendTrackingEvent()` (lines 98-108 of `js/tracking.js`).

---

## Mirakl Ads API

### Requesting Sponsored Products

| Property         | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| **URL**          | `POST {adsServerUrl}/ads/v1/public/rendered-content`           |
| **Content-Type** | `application/json`                                            |
| **Headers**      | `x-customer-id: {t2sCustomerId}`                              |
| **Method**       | `async` / `await` (returns a Promise)                         |

The base `adsServerUrl` comes from settings (default: `https://xxxxx.retailmedia.mirakl.net`).

**Method:** `Tracking.requestSponsoredProducts(pageId, pageType, context)`

### Request Payloads by Page Type

All requests include `pageId` (integer) and `userId` (string). Additional fields depend on the page type:

**Category page:**

```json
{
  "pageId": 1400,
  "userId": "abc-def-123",
  "categoryId": "1-2-3"
}
```

**Search page:**

```json
{
  "pageId": 2000,
  "userId": "abc-def-123",
  "keywords": "manga"
}
```

**Product page:**

```json
{
  "pageId": 1200,
  "userId": "abc-def-123",
  "productId": "4123018513199-0"
}
```

### Response Structure

The Ads API returns a JSON object with this shape:

```json
{
  "productAds": [
    {
      "adUnitId": "unit-abc-123",
      "adUnitSize": 4,
      "products": [
        {
          "productId": "4123018513199-0",
          "adId": "ad-xyz-789",
          "digitalServiceAct": {
            "sponsor": "BrandName"
          }
        }
      ]
    }
  ]
}
```

| Field                          | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `productAds`                   | Array of ad units returned for this page                  |
| `productAds[].adUnitId`        | Identifier for the ad placement                           |
| `productAds[].adUnitSize`      | Number of slots in this ad unit (e.g. 4)                  |
| `productAds[].products`        | Array of sponsored products filling those slots           |
| `products[].productId`         | Product ID (matched against local catalog)                |
| `products[].adId`              | Ad identifier used for impression/click tracking          |
| `products[].digitalServiceAct` | DSA transparency info (optional `sponsor` field)          |

### Rendering Sponsored Products

The rendering pipeline works as follows:

1. **`Tracking.renderSponsoredProducts(adsData)`** -- Takes the full API response and returns an HTML string. Iterates over `productAds` and calls `renderAdUnit()` for each.

2. **`Tracking.renderAdUnit(adUnit)`** -- Renders one ad unit. Fills slots with actual products up to `adUnitSize`, then fills remaining slots with empty placeholders.

3. **`Tracking.renderSponsoredProduct(sponsoredProduct)`** -- Renders a single sponsored product card. Looks up the product in the local catalog via `CatalogManager.getProductById()` to get name, image, price, and brand. Falls back to placeholder data if the product is not found locally.

4. **`Tracking.renderEmptySponsoredSection()`** -- Returns a grid of 4 "Ad Slot" placeholders. Used as the initial state before ads load, and when no ads are returned.

Each sponsored product card includes:
- A "Sponsored" badge
- Product image, name, brand, and price
- A "Sponsored by {sponsor}" label from the DSA data
- `data-ad-impression` attribute on the image (for impression tracking)
- `data-ad-click` attribute on all links (for click tracking)

### Impression and Click Tracking

After inserting sponsored product HTML into the DOM, call:

```javascript
Tracking.attachSponsoredTracking(containerElement);
```

This method:
- Finds all elements with `data-ad-impression` and adds an `onload` listener to the image that fires `Tracking.trackSponsoredImpression(adId)`.
- Finds all elements with `data-ad-click` and adds a `click` listener that fires `Tracking.trackSponsoredClick(adId)`.

Both methods call `sendTrackingEvent()` with:
- `eventName: "impression"` or `eventName: "click"`
- `adId: {adId}`
- `cID` and `userId` as usual

---

## Event Tracking Flow by Page

### Category Page (`js/pages/category.js`)

```
User navigates to #/category/1-2-3
    |
    +-- Tracking.trackPageView(1400, "category", {...})   // Console log only
    +-- Tracking.trackCategoryView("1-2-3")               // POST to T2S API
    +-- Tracking.requestSponsoredProducts(1400, "category", {categoryId: "1-2-3"})
            |
            +-- Render empty sponsored section immediately
            +-- When promise resolves:
                    +-- Tracking.renderSponsoredProducts(adsData)
                    +-- Tracking.attachSponsoredTracking(container)
```

### Product Page (`js/pages/product.js`)

```
User navigates to #/product/4123018513199-0
    |
    +-- Tracking.trackPageView(1200, "product", {...})     // Console log only
    +-- Tracking.trackProductView("4123018513199-0")       // POST to T2S API
    +-- Tracking.requestSponsoredProducts(1200, "product", {productId: "4123018513199-0"})
            |
            +-- Render empty sponsored section immediately
            +-- When promise resolves:
                    +-- Tracking.renderSponsoredProducts(adsData)
                    +-- Tracking.attachSponsoredTracking(container)
```

### Search Page (`js/pages/search.js`)

```
User navigates to #/search?q=manga
    |
    +-- Tracking.trackPageView(2000, "search", {...})      // Console log only
    +-- SearchPage.logSearchQuery("manga")
    |       |
    |       +-- CatalogManager.searchProducts("manga")     // Get matching product IDs
    |       +-- Tracking.trackSearchView("manga", productIds)  // POST to T2S API
    |
    +-- Tracking.requestSponsoredProducts(2000, "search", {searchQuery: "manga"})
            |                                               // Only if query >= 3 chars
            +-- Render empty sponsored section immediately
            +-- When promise resolves:
                    +-- Tracking.renderSponsoredProducts(adsData)
                    +-- Tracking.attachSponsoredTracking(container)
```

### Add to Cart (any page, via `js/cart.js`)

```
User clicks "Add to Cart"
    |
    +-- Cart.addItem(productId, quantity)
            |
            +-- CatalogManager.getProductPrice(product)    // Get unit price
            +-- Tracking.trackAddToCart(productId, quantity, unitPrice)  // POST to T2S API
```

### Order Confirmation (`js/pages/orderconfirmation.js`)

```
User completes checkout, redirected to #/order-confirmation
    |
    +-- Tracking.trackPageView(2400, "postpayment")        // Console log only
    +-- Tracking.trackPostPayment({
            orderId: "ORDER_...",
            total: 255.50,
            items: [
                { productId: "PROD_A", quantity: 2, price: 45.00 },
                ...
            ]
        })                                                 // POST to T2S API
```

---

## Configuration

All tracking and ads settings are managed via the Admin page and stored in `localStorage` under `ecommerce_settings`. Relevant fields:

| Setting            | Default                                                   | Description                          |
| ------------------ | --------------------------------------------------------- | ------------------------------------ |
| `trackingUrl`      | `https://xxxxx.euw1.retail.mirakl.net`              | Base URL for T2S tracking API        |
| `adsServerUrl`     | `https://xxxxx.retailmedia.mirakl.net`       | Base URL for Mirakl Ads API          |
| `t2sCustomerId`    | `CUSTOMER_PUBLIC_ID`                                     | Customer ID sent in headers/payloads |
| `t2sPageIds`       | `{search: 2000, category: 1400, product: 1200, ...}`     | Page ID overrides                    |
| `orderPrefix`      | `ORDER_`                                                  | Prefix for generated order IDs       |

The user tracking ID (`userId` / TID) is a separate UUID stored in `localStorage` under `user_tid`. It is generated once per browser and persists indefinitely. The `Settings.getTID()` method handles creation and retrieval.

---

## How to Add a New Tracking Event

1. **Add a static method** to the `Tracking` class in `js/tracking.js`:

```javascript
/**
 * Track wishlist addition
 * @param {string} productId - Product ID
 */
static trackWishlistAdd(productId) {
    const settings = Settings.get();
    const pageIdValue = settings.t2sPageIds?.wishlist || 1800; // New page ID

    this.sendTrackingEvent({
        cID: settings.t2sCustomerId,
        pageId: pageIdValue,
        productId: productId,
        userConsent: true,
        userId: Settings.getTID(),
        eventName: 'view'
    });
}
```

2. **Call the method** from the appropriate page or module:

```javascript
import { Tracking } from '../tracking.js';

// When user adds to wishlist
Tracking.trackWishlistAdd(productId);
```

3. **Add the page ID** to `Settings.DEFAULT_SETTINGS.t2sPageIds` if it uses a new page type:

```javascript
t2sPageIds: {
    search: 2000,
    category: 1400,
    product: 1200,
    cart: 1600,
    postPayment: 2400,
    wishlist: 1800          // New
}
```

4. **Update `Tracking.PAGE_IDS`** to add the constant:

```javascript
static PAGE_IDS = {
    // ...existing entries...
    WISHLIST: '1800'
};
```

Key rules:
- Always include `cID`, `pageId`, `userId`, `userConsent`, and `eventName` in the event data.
- The `url` and `referer` fields are added automatically by `sendTrackingEvent()`.
- Use `Settings.getTID()` for the user ID -- never generate your own.
- The `eventName` is `"view"` for all standard page/action events.

---

## How to Modify Sponsored Products

### Adding a new page type for ads

1. Add a context case in `requestSponsoredProducts()`:

```javascript
// In Tracking.requestSponsoredProducts()
} else if (pageType === Tracking.PAGE_TYPES.WISHLIST && context.productIds) {
    requestBody.productIds = context.productIds;
}
```

2. Call it from the page's render method:

```javascript
const sponsoredAdsPromise = Tracking.requestSponsoredProducts(
    Tracking.PAGE_IDS.WISHLIST,
    Tracking.PAGE_TYPES.WISHLIST,
    { productIds: ['PROD_A', 'PROD_B'] }
);
```

3. Follow the standard pattern for rendering (render placeholder first, update on promise resolution):

```javascript
// In the page HTML template
<div id="sponsored-container">
    ${Tracking.renderEmptySponsoredSection()}
</div>

// After inserting HTML into the DOM
sponsoredAdsPromise.then(adsData => {
    const container = document.getElementById('sponsored-container');
    if (container && adsData) {
        container.innerHTML = Tracking.renderSponsoredProducts(adsData);
        Tracking.attachSponsoredTracking(container);
    }
}).catch(error => {
    console.error('Failed to load sponsored products:', error);
});
```

### Modifying the sponsored product card layout

Edit `Tracking.renderSponsoredProduct()` in `js/tracking.js`. The method receives a `sponsoredProduct` object from the API and looks up the full product from `CatalogManager`. Modify the returned HTML template to change the card layout.

### Changing the number of placeholder slots

Edit `Tracking.renderEmptySponsoredSection()` to change the number of `renderEmptySlot()` calls (default: 4).

### Changing how impressions are tracked

Impressions fire when the product image `load` event fires. To change this (e.g. to use an `IntersectionObserver` for viewport-based tracking), modify `Tracking.attachSponsoredTracking()`.

---

## Debugging

### Browser Console Prefixes

Open Chrome DevTools (F12) and look for these log prefixes:

| Prefix                    | Meaning                                          |
| ------------------------- | ------------------------------------------------ |
| `[TRACKING] Event sent:`  | A tracking event was successfully dispatched      |
| `[TRACKING] Skipping:`    | Tracking URL or customer ID is not configured     |
| `[TRACKING] Error:`       | The `fetch()` call to the T2S API failed          |
| `[TRACKING] Exception:`   | An unexpected error in tracking code              |
| `[AD SERVING] Received:`  | Ads API returned a successful response            |
| `[AD SERVING] Ads not configured` | Ads URL or customer ID is missing          |
| `[AD SERVING] API error:` | Ads API returned a non-200 status code            |
| `[AD SERVING] Exception:` | An unexpected error in ads code                   |

### Checking Tracking Payloads

1. Open Chrome DevTools > **Network** tab.
2. Filter by `t` (the tracking endpoint path).
3. Navigate to a page.
4. Click the request to see the full `x-www-form-urlencoded` body.
5. Verify the `cID`, `pageId`, `productId`, `userId`, and other fields.

### Checking Ads Requests

1. Open Chrome DevTools > **Network** tab.
2. Filter by `rendered-content`.
3. Navigate to a category, search, or product page.
4. Inspect the request body (JSON) and the response (JSON).
5. Verify `x-customer-id` header is present.

### Common Issues

| Symptom                              | Cause                                              | Fix                                                  |
| ------------------------------------ | -------------------------------------------------- | ---------------------------------------------------- |
| No tracking events fire              | `trackingUrl` or `t2sCustomerId` not set           | Configure in Admin > Settings                        |
| No ads appear (only placeholders)    | `adsServerUrl` not set, or API returns empty data  | Configure in Admin > Settings, check API response    |
| `referer` field is missing           | First page load has no previous URL in session     | Expected behavior on first navigation                |
| Sponsored products show "Ad Slot"    | API returned fewer products than `adUnitSize`      | Expected behavior, empty slots are placeholders      |
| Impression not tracked               | Image failed to load (broken URL)                  | Check product `imageUrl` in catalog data             |
| CORS errors in console               | Browser blocking cross-origin requests to API      | Ensure API allows the origin, or use a proxy         |
| `userId` changes between sessions    | `localStorage` was cleared                         | Expected -- TID is re-generated on clear             |

### Verifying the Full Flow

To verify end-to-end tracking:

1. Configure settings in the Admin page (tracking URL, ads URL, customer ID).
2. Navigate to a category page -- expect one `trackCategoryView` event and one ads request.
3. Click a product -- expect one `trackProductView` event and one ads request.
4. Add to cart -- expect one `trackAddToCart` event.
5. Complete checkout -- expect one `trackPostPayment` event on the confirmation page.
6. Check the Network tab for all outgoing requests.
7. Check the Console tab for all log messages.
