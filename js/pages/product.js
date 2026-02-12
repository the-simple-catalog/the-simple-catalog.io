// ===================================
// Product Detail Page
// ===================================

const ProductPage = {
  /**
   * Render product page
   */
  render(params) {
    const productId = params.productId;
    const product = CatalogManager.getProductById(productId);

    if (!product) {
      this.renderNotFound(productId);
      return;
    }

    // Track page view
    Tracking.trackPageView(PAGE_IDS.PRODUCT, PAGE_TYPES.PRODUCT, {
      productId,
      productName: product.content.name,
    });

    // Track product view
    Tracking.trackProductView(productId);

    // Request sponsored products
    const sponsoredAdsPromise = Tracking.requestSponsoredProducts(
      PAGE_IDS.PRODUCT, PAGE_TYPES.PRODUCT, { productId }
    );

    const app = getEl("app");
    const brand = CatalogManager.getProductBrand(product);
    const price = CatalogManager.getProductPrice(product);

    // Get category for breadcrumb
    const categoryId = product.content.categories?.[0];
    let breadcrumb = [];
    if (categoryId) {
      breadcrumb = CatalogManager.getCategoryPath(categoryId);
    }

    app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    ${ProductPage.renderBreadcrumb(breadcrumb, product)}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
                    <!-- Product Image -->
                    <div>
                        <img
                            src="${escapeHtml(product.content.imageUrl || "")}"
                            alt="${escapeHtml(product.content.name)}"
                            style="width: 100%; border-radius: 12px; box-shadow: var(--shadow-md);"
                            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22600%22 height=%22600%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'"
                        />
                    </div>

                    <!-- Product Info -->
                    <div>
                        ${brand ? `<div style="color: var(--text-secondary); margin-bottom: 8px;">Brand: ${escapeHtml(brand)}</div>` : ""}
                        <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 16px;">
                            ${escapeHtml(product.content.name)}
                        </h1>

                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
                            <div>Fw Product Id: ${escapeHtml(product.id)}</div>
                            ${product.content.sku ? `<div>SKU: ${escapeHtml(product.content.sku)}</div>` : ""}
                        </div>

                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 24px; color: ${price.hasPromo ? "var(--error-color)" : "var(--text-primary)"};">
                            ${price.hasPromo ? `<span style="font-size: 20px; text-decoration: line-through; color: var(--text-secondary); margin-right: 12px;">${formatPrice(price.regular)}</span>` : ""}
                            ${formatPrice(price.hasPromo ? price.promo : price.regular)}
                        </div>

                        ${
                          product.content.stockQuantity
                            ? `
                            <div style="color: var(--success-color); margin-bottom: 16px;">
                                ✓ In Stock (${product.content.stockQuantity} available)
                            </div>
                        `
                            : ""
                        }

                        <div style="margin-bottom: 24px;">
                            <label class="form-label">Quantity</label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input
                                    type="number"
                                    id="product-quantity"
                                    class="form-input"
                                    value="1"
                                    min="1"
                                    max="${product.content.stockQuantity || 999}"
                                    style="width: 100px;"
                                />
                                <button
                                    class="btn btn-primary"
                                    onclick="ProductPage.addToCart('${product.id}')"
                                    style="flex: 1;"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>

                        ${
                          product.content.longDescription
                            ? `
                            <div style="margin-top: 32px;">
                                <h2 style="font-size: 20px; margin-bottom: 12px;">Description</h2>
                                <p style="color: var(--text-secondary); line-height: 1.6;">
                                    ${escapeHtml(product.content.longDescription)}
                                </p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>

                <div id="sponsored-container">
                    ${Tracking.renderEmptySponsoredSection()}
                </div>
            </div>
        `;

    // Update sponsored section when ads load
    sponsoredAdsPromise.then(adsData => {
      const container = document.getElementById('sponsored-container');
      if (container && adsData) {
        container.innerHTML = Tracking.renderSponsoredProducts(adsData);
      }
    }).catch(error => {
      console.error('Failed to load sponsored products:', error);
    });
  },

  /**
   * Render breadcrumb navigation
   */
  renderBreadcrumb(path, product) {
    const breadcrumbParts = ['<a href="#/">Home</a>'];

    path.forEach((cat) => {
      breadcrumbParts.push(
        `<a href="#/category/${cat.id}">${escapeHtml(cat.content.name)}</a>`,
      );
    });

    breadcrumbParts.push(`<span>${escapeHtml(product.content.name)}</span>`);

    return `<div class="breadcrumb">${breadcrumbParts.join('<span class="breadcrumb-separator">/</span>')}</div>`;
  },

  /**
   * Render not found page
   */
  renderNotFound(productId) {
    const app = getEl("app");
    app.innerHTML = `
            <div class="container fade-in">
                <div class="message message-error">
                    Product not found: ${escapeHtml(productId)}
                </div>
                <a href="#/" class="btn btn-primary" style="margin-top: 16px;">Go to Homepage</a>
            </div>
        `;
  },

  /**
   * Add product to cart with quantity
   */
  addToCart(productId) {
    const quantityInput = getEl("product-quantity");
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (quantity < 1) {
      showMessage("Please enter a valid quantity", "error");
      return;
    }

    const success = Cart.addItem(productId, quantity);
    if (success) {
      showMessage(`Added ${quantity} item(s) to cart!`, "success");
    } else {
      showMessage("Error adding product to cart", "error");
    }
  },
};
