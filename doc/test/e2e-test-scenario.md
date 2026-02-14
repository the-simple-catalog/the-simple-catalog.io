# E2E Test Scenario: E-Commerce Demo Flow

This document contains a complete end-to-end test scenario for the e-commerce demo site. Each step includes instructions and validation checks.

**Prerequisites:**
- Chrome running with remote debugging: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`
- MCP Chrome DevTools server configured (see `.mcp.json`)

---

## Test Flow Overview

1. Open the site
2. Import catalog data (categories and products)
3. Navigate homepage
4. Browse category pages
5. Add product to cart from category page
6. View product detail page
7. Add product to cart from product page
8. Complete checkout
9. Verify order confirmation

---

## Step 1: Open index.html

**Action:** Navigate to the site
```
Tool: mcp__chrome-devtools__new_page
URL: http://localhost:8000/index.html
```

**Validation:**
- Page loads successfully
- Title is "Mirakl E-commerce Demo"
- Header navigation is visible

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Homepage with "Mirakl E-commerce Demo" header visible
Expected: Navigation menu with "Home", "Categories", "Cart", "Admin" links
```

---

## Step 2: Navigate to Admin Page

**Action:** Click Admin link in header
```
Tool: mcp__chrome-devtools__take_snapshot
Find: Link with text "Admin"

Tool: mcp__chrome-devtools__click
Target: Admin link uid from snapshot
```

**Validation:**
- URL changes to `#/admin`
- Admin settings page displays
- Catalog import sections visible

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: "Admin Settings" heading
Expected: "Import Categories" and "Import Products" buttons
```

---

## Step 3: Import Categories Catalog

**Action:** Import categories JSON file
```
Tool: mcp__chrome-devtools__take_snapshot
Find: File input for categories (type="file")

Tool: mcp__chrome-devtools__upload_file
Target: Categories file input uid
File: catalog/categories_t2s.json
```

**Validation:**
- Success message appears: "Categories imported successfully"
- Category count displayed (should be ~700)

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Success message visible
Expected: Text showing "700+" categories imported
```

---

## Step 4: Import Products Catalog

**Action:** Import products JSON file
```
Tool: mcp__chrome-devtools__take_snapshot
Find: File input for products

Tool: mcp__chrome-devtools__upload_file
Target: Products file input uid
File: catalog/products_1P_t2s.json
```

**Validation:**
- Success message appears: "Products imported successfully"
- Product count displayed (should be 600-2000)

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Success message visible
Expected: Text showing product count imported
```

---

## Step 5: Navigate to Homepage

**Action:** Click Home link in header
```
Tool: mcp__chrome-devtools__take_snapshot
Find: Link with text "Home"

Tool: mcp__chrome-devtools__click
Target: Home link uid
```

**Validation:**
- URL is `#/` or `#/home`
- Homepage content displays
- Featured products visible

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Homepage with product grid
Expected: "Featured Products" or similar heading
Expected: Multiple product cards visible
```

---

## Step 6: Open Categories Dropdown

**Action:** Click on Categories dropdown in header
```
Tool: mcp__chrome-devtools__take_snapshot
Find: "Categories" dropdown button

Tool: mcp__chrome-devtools__click
Target: Categories dropdown uid
```

**Validation:**
- Dropdown menu opens
- Root categories listed (Books, Electronics, etc.)

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Dropdown menu expanded
Expected: Multiple category links visible
```

---

## Step 7: Select Root Category

**Action:** Click on a root category (e.g., "Books")
```
Tool: mcp__chrome-devtools__take_snapshot
Find: First category link in dropdown

Tool: mcp__chrome-devtools__click
Target: Category link uid
```

**Validation:**
- URL changes to `#/category/{categoryId}`
- Category page loads
- Subcategories and products displayed

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Category page with breadcrumbs
Expected: Subcategories section visible
Expected: Product grid with cards
```

---

## Step 8: Navigate to Subcategory

**Action:** Click on a subcategory card
```
Tool: mcp__chrome-devtools__take_snapshot
Find: First subcategory card/link

Tool: mcp__chrome-devtools__click
Target: Subcategory card uid
```

**Validation:**
- URL updates to subcategory ID
- Subcategory products displayed
- Breadcrumb trail updated

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Updated breadcrumbs showing parent > child
Expected: Different set of products
Expected: May show further subcategories
```

---

## Step 9: Add Product to Cart (from Category Page)

**Action:** Click "Add to Cart" button on first product card
```
Tool: mcp__chrome-devtools__take_snapshot
Find: "Add to Cart" button on product card

Tool: mcp__chrome-devtools__click
Target: Add to Cart button uid
includeSnapshot: true
```

**Validation:**
- Cart icon in header shows count badge (1)
- Success feedback (button changes or notification)
- Console logs tracking event: `📊 [TRACKING] add-to-cart`

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Cart badge showing "1" item
Expected: Add to Cart button shows feedback

Tool: mcp__chrome-devtools__list_console_messages
Expected: Tracking event logged for add-to-cart
```

---

## Step 10: Click on Product Card

**Action:** Click on a product card to view details
```
Tool: mcp__chrome-devtools__take_snapshot
Find: Product card (image or title)

Tool: mcp__chrome-devtools__click
Target: Product card uid
```

**Validation:**
- URL changes to `#/product/{productId}`
- Product detail page displays
- Product image, name, price, description visible
- Add to Cart button present

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Product detail page with large image
Expected: Product name as heading
Expected: Price displayed (e.g., "$XX.XX")
Expected: Description text
Expected: "Add to Cart" button
Expected: Quantity selector
```

---

## Step 11: Add Product to Cart (from Product Page)

**Action:** Set quantity and add to cart
```
Tool: mcp__chrome-devtools__take_snapshot
Find: Quantity input and Add to Cart button

Tool: mcp__chrome-devtools__fill
Target: Quantity input uid
Value: "2"

Tool: mcp__chrome-devtools__click
Target: Add to Cart button uid
includeSnapshot: true
```

**Validation:**
- Cart badge updates (shows 3 total: 1 + 2)
- Button feedback or success message
- Console logs add-to-cart event

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Cart badge showing "3" items

Tool: mcp__chrome-devtools__list_console_messages
Expected: New tracking event for add-to-cart with quantity 2
```

---

## Step 12: Navigate to Cart Page

**Action:** Click cart icon/link in header
```
Tool: mcp__chrome-devtools__take_snapshot
Find: Cart link or icon

Tool: mcp__chrome-devtools__click
Target: Cart link uid
```

**Validation:**
- URL changes to `#/cart`
- Cart page displays
- Shows 2 line items (or 1 if same product added twice)
- Total quantities and prices calculated

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Cart page heading
Expected: Product line items with images and names
Expected: Quantity controls
Expected: Subtotal and total displayed
Expected: "Proceed to Checkout" button
```

---

## Step 13: Proceed to Checkout

**Action:** Click "Proceed to Checkout" button
```
Tool: mcp__chrome-devtools__take_snapshot
Find: "Proceed to Checkout" button

Tool: mcp__chrome-devtools__click
Target: Checkout button uid
```

**Validation:**
- URL changes to `#/checkout`
- Checkout form displays
- Shows order summary

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Checkout form with fields:
  - Name
  - Email
  - Address
  - City
  - Postal Code
  - Card Number
  - Expiry
  - CVV
Expected: Order summary sidebar with products and total
Expected: "Place Order" button
```

---

## Step 14: Fill Checkout Form

**Action:** Complete all required fields
```
Tool: mcp__chrome-devtools__take_snapshot
Find: All form input fields

Tool: mcp__chrome-devtools__fill_form
Elements:
  - name: "John Doe"
  - email: "john.doe@example.com"
  - address: "123 Test Street"
  - city: "Paris"
  - postalCode: "75001"
  - cardNumber: "4111111111111111"
  - cardExpiry: "12/25"
  - cardCvv: "123"
```

**Validation:**
- All fields populated
- No validation errors
- Place Order button enabled

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: All fields filled with test data
Expected: Place Order button is clickable
```

---

## Step 15: Place Order

**Action:** Submit order
```
Tool: mcp__chrome-devtools__take_snapshot
Find: "Place Order" button

Tool: mcp__chrome-devtools__click
Target: Place Order button uid
```

**Validation:**
- Order processes (simulated)
- Redirects to order confirmation
- URL changes to `#/orderconfirmation`

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: Loading state or immediate redirect

Tool: mcp__chrome-devtools__wait_for
Text: "Thank you"
Timeout: 5000
```

---

## Step 16: Verify Order Confirmation

**Action:** Check order confirmation page
```
Tool: mcp__chrome-devtools__take_snapshot
```

**Validation:**
- Order confirmation page displays
- Order ID shown
- Order summary with products
- Thank you message
- Cart badge reset to 0
- Console logs post-payment tracking event

**Test:**
```
Tool: mcp__chrome-devtools__take_snapshot
Expected: "Order Confirmation" or "Thank You" heading
Expected: Order ID displayed (format: ORD-XXXXXXXXX)
Expected: Order summary with products and total
Expected: Customer information displayed
Expected: Cart badge shows "0" or is hidden

Tool: mcp__chrome-devtools__list_console_messages
Expected: Tracking event: "📊 [TRACKING] post-payment"

Tool: mcp__chrome-devtools__evaluate_script
Function: |
  () => {
    const cart = localStorage.getItem('ecommerce_cart');
    return cart ? JSON.parse(cart) : null;
  }
Expected: Cart is empty or null
```

---

## Test Summary Checklist

After completing all steps, verify:

- [ ] Catalog imported successfully (categories + products)
- [ ] Homepage displays with products
- [ ] Category navigation works (root → subcategory)
- [ ] Add to cart from category page works
- [ ] Product detail page displays correctly
- [ ] Add to cart from product page works with quantity
- [ ] Cart shows correct items and quantities
- [ ] Checkout form accepts all inputs
- [ ] Order can be placed successfully
- [ ] Order confirmation shows order details
- [ ] Cart is cleared after order
- [ ] Tracking events logged throughout flow:
  - Page views (category, product, cart, order confirmation)
  - Add-to-cart events (2 occurrences)
  - Post-payment event

---

## Notes

- **Test Data:** Uses `catalog/products_1P_t2s.json` (1P products)
- **Alternative:** Can use `catalog/products_3P_t2s.json` (3P marketplace products)
- **Tracking:** Watch browser console for `📊 [TRACKING]` logs
- **Ads:** If ads configured, sponsored products will appear on category/product/search pages
- **LocalStorage:** Test creates real data - may want to clear between runs
- **Test Card:** `4111111111111111` always succeeds (no real payment processing)

---

## Cleanup (Optional)

To reset the test environment:

```javascript
// Run in browser console
localStorage.clear();
location.reload();
```

Or via MCP:

```
Tool: mcp__chrome-devtools__evaluate_script
Function: () => { localStorage.clear(); location.reload(); }
```

---

**Test Duration:** ~2-3 minutes for complete flow
**Last Updated:** 2026-02-14
