// ===================================
// Admin Page - Catalog import and settings
// ===================================

import { getEl, escapeHtml } from "../utils.js";
import { CatalogManager, Settings } from "../catalog.js";

// ===================================
// Default Configuration Placeholders
// CHANGE THESE VALUES to update all default placeholders in the admin UI.
// Page ID defaults are managed in Settings.DEFAULT_SETTINGS (catalog.js).
// ===================================
export const DEFAULT_T2S_CUSTOMER_ID = "CUSTOMER_PUBLIC_ID";
export const DEFAULT_TRACKING_URL = "https://xxxxx.retail.mirakl.net";
export const DEFAULT_ADS_SERVER_URL = "https://xxxxx.retailmedia.mirakl.net";
export const DEFAULT_ORDER_PREFIX = "ORDER_";

class AdminPage {
  /**
   * Render admin page
   * Checks for URL parameters and imports settings before rendering the form.
   */
  static render() {
    const app = getEl("app");

    // Import settings from URL parameters before rendering form
    const urlImported = AdminPage.loadSettingsFromUrl();

    const settings = Settings.get();
    const stats = CatalogManager.getStats();

    app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    <div class="breadcrumb">
                        <a href="#/">Home</a>
                        <span class="breadcrumb-separator">/</span>
                        <span>Admin</span>
                    </div>
                    <h1 class="page-title">Admin & Settings</h1>
                </div>

                <div style="display: grid; gap: 24px; max-width: 800px;">
                    <!-- Catalog Import Section -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">📦 Import Catalog</h2>

                        <div class="form-group">
                            <label class="form-label">Categories JSON File</label>
                            <input type="file" id="categories-file" accept=".json" class="form-input" />
                            <button onclick="AdminPage.importCategories()" class="btn btn-primary" style="margin-top: 8px;">
                                Import Categories
                            </button>
                            <div id="categories-messages" style="margin-top: 16px;"></div>
                        </div>

                        <!-- Product Capacity Indicator (shown only when >= 90% or at limit) -->
                        <div id="product-capacity" style="display: none; margin-bottom: 16px; padding: 14px 16px; border-radius: var(--radius-lg); transition: all var(--transition-base);"></div>

                        <div class="form-group">
                            <label class="form-label">Products JSON File</label>

                            <!-- Import Mode Selection -->
                            <div style="margin-bottom: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                                <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">Import Mode:</div>
                                <label style="display: flex; align-items: start; margin-bottom: 8px; cursor: pointer;">
                                    <input type="radio" name="import-mode" value="replace" checked style="margin-right: 8px; margin-top: 3px;" />
                                    <div>
                                        <strong>Replace all products</strong>
                                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                                            Clears existing products and imports new catalog
                                        </div>
                                    </div>
                                </label>
                                <label style="display: flex; align-items: start; cursor: pointer;">
                                    <input type="radio" name="import-mode" value="append" style="margin-right: 8px; margin-top: 3px;" />
                                    <div>
                                        <strong>Append to existing products</strong>
                                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                                            Adds new products to existing catalog (duplicates by ID will be updated)
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <input type="file" id="products-file" accept=".json" class="form-input" />
                            <button onclick="AdminPage.importProducts()" class="btn btn-primary" style="margin-top: 8px;">
                                Import Products
                            </button>
                            <div id="products-messages" style="margin-top: 16px;"></div>
                        </div>

                        <div class="form-group">
                            <button onclick="AdminPage.clearCatalog()" class="btn btn-secondary">
                                Clear All Catalog Data
                            </button>
                        </div>
                    </div>

                    <!-- Catalog Statistics -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">📊 Catalog Statistics</h2>
                        <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px;">
                            <div style="display: grid; gap: 12px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Products:</span>
                                    <strong id="stat-products">${stats.productCount}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Categories:</span>
                                    <strong id="stat-categories">${stats.categoryCount}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Root Categories:</span>
                                    <strong id="stat-root-categories">${stats.rootCategoryCount}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Site Settings -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">⚙️ Site Settings</h2>

                        <form id="settings-form" onsubmit="AdminPage.saveSettings(event)">
                            <div class="form-group">
                                <label class="form-label">Site Name</label>
                                <input
                                    type="text"
                                    id="setting-site-name"
                                    class="form-input"
                                    value="${escapeHtml(settings.siteName)}"
                                    placeholder="E-Commerce Demo"
                                />
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save Settings
                            </button>
                        </form>

                        <div id="settings-message"></div>
                    </div>

                    <!-- T2S Configuration -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔧 T2S Tracking Configuration</h2>

                        <form id="t2s-settings-form" onsubmit="AdminPage.saveT2SSettings(event)">
                            <div class="form-group">
                                <label class="form-label">T2S Tracking URL</label>
                                <input
                                    type="text"
                                    id="setting-tracking-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.trackingUrl || DEFAULT_TRACKING_URL)}"
                                    placeholder="${DEFAULT_TRACKING_URL}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Ads Server URL</label>
                                <input
                                    type="text"
                                    id="setting-ads-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerUrl || DEFAULT_ADS_SERVER_URL)}"
                                    placeholder="${DEFAULT_ADS_SERVER_URL}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Ads Server Token (Optional - JWT only)</label>
                                <input
                                    type="text"
                                    id="setting-ads-token"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerToken || "")}"
                                    placeholder="Leave empty to use public endpoint"
                                />

                            </div>

                            <div class="form-group">
                                <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                                    <input
                                        type="checkbox"
                                        id="setting-use-ads-proxy"
                                        ${settings.useAdsProxy !== false ? "checked" : ""}
                                        style="width: auto; margin: 0;"
                                    />
                                    <span>Use CORS Proxy for Authenticated Ads API Calls</span>
                                </label>
                                <small style="color: var(--text-secondary); font-size: 12px; margin-left: 24px;">
                                    When enabled, authenticated calls route through a proxy to bypass CORS restrictions
                                </small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">T2S Customer ID</label>
                                <input
                                    type="text"
                                    id="setting-customer-id"
                                    class="form-input"
                                    value="${escapeHtml(settings.t2sCustomerId || DEFAULT_T2S_CUSTOMER_ID)}"
                                    placeholder="${DEFAULT_T2S_CUSTOMER_ID}"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Page IDs Configuration (JSON)</label>
                                <textarea
                                    id="setting-page-ids"
                                    class="form-input"
                                    rows="6"
                                    placeholder='${JSON.stringify(Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2)}'
                                    style="font-family: monospace; font-size: 13px;"
                                >${JSON.stringify(settings.t2sPageIds || Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2)}</textarea>
                                <small style="color: var(--text-secondary); font-size: 12px;">
                                    JSON object with page type to page ID mappings
                                </small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Order Prefix</label>
                                <input
                                    type="text"
                                    id="setting-order-prefix"
                                    class="form-input"
                                    value="${escapeHtml(settings.orderPrefix || "")}"
                                    placeholder="${DEFAULT_ORDER_PREFIX}"
                                />
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save T2S Settings
                            </button>
                        </form>

                        <div id="t2s-settings-message"></div>
                    </div>

                    <!-- tID Management -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔑 User Tracking ID (tID) Management</h2>

                        <div class="form-group">
                            <label class="form-label">Current tID</label>
                            <input
                                type="text"
                                id="current-tid"
                                class="form-input"
                                value="${Settings.getTID()}"
                                readonly
                                style="font-family: monospace; background: var(--bg-secondary); cursor: not-allowed;"
                            />
                        </div>

                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <button onclick="AdminPage.generateNewTID()" class="btn btn-primary">
                                Generate New tID
                            </button>
                            <button onclick="AdminPage.resetTID()" class="btn btn-secondary">
                                Reset tID
                            </button>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Custom tID (UUID format)</label>
                            <div style="display: flex; gap: 12px;">
                                <input
                                    type="text"
                                    id="custom-tid"
                                    class="form-input"
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    style="font-family: monospace; flex: 1;"
                                />
                                <button onclick="AdminPage.saveCustomTID()" class="btn btn-primary">
                                    Save Custom
                                </button>
                            </div>
                            <small style="color: var(--text-secondary); font-size: 12px;">
                                Must be valid UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000)
                            </small>
                        </div>

                        <div id="tid-message"></div>
                    </div>

                    <!-- Configuration Export -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">📤 Configuration Export</h2>

                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; line-height: 1.5;">
                            Generate a shareable URL with your current Ads/T2S configuration. This allows you to back up settings or share them with team members.
                        </p>

                        <!-- Security Warning (hidden by default) -->
                        <div id="export-token-warning" style="display: none; background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px;">
                            <div style="display: flex; align-items: start; gap: 10px;">
                                <span style="font-size: 18px;">🔐</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px;">Security Warning</div>
                                    <div style="font-size: 13px; color: var(--text-secondary);">
                                        The generated URL includes your Ads Server Token. Only share this URL with trusted team members.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                                <input
                                    type="checkbox"
                                    id="export-include-token"
                                    checked
                                    style="width: auto; margin: 0;"
                                />
                                <span>Include Ads Server Token in URL</span>
                            </label>
                            <small style="color: var(--text-secondary); font-size: 12px; margin-left: 24px;">
                                Uncheck to exclude the token for safer sharing
                            </small>
                        </div>

                        <div class="form-group" style="position: relative;">
                            <label class="form-label">Generated URL</label>
                            <textarea
                                id="export-url"
                                class="form-input"
                                readonly
                                rows="4"
                                placeholder="Click 'Generate URL' to create a shareable configuration link"
                                style="font-family: monospace; font-size: 13px; background: var(--bg-secondary); cursor: text; resize: vertical; padding-right: 80px;"
                            ></textarea>
                            <button
                                id="copy-export-url-btn"
                                onclick="AdminPage.copyExportUrl()"
                                class="btn btn-primary"
                                style="display: none; position: absolute; top: 34px; right: 8px; padding: 6px 12px; font-size: 13px; z-index: 10;"
                            >
                                Copy
                            </button>
                        </div>

                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <button onclick="AdminPage.generateExportUrl()" class="btn btn-primary">
                                Generate URL
                            </button>
                            <button id="clear-export-btn" onclick="AdminPage.clearExportUrl()" class="btn btn-secondary" style="display: none;">
                                Clear
                            </button>
                        </div>

                        <div id="export-message"></div>
                    </div>
                </div>
            </div>
        `;

    // Initialize product capacity indicator
    AdminPage.updateProductCapacity();

    // Ping CORS proxy health endpoint to wake it up preemptively
    AdminPage.pingProxyHealth();

    // Show success notification if settings were imported from URL
    if (urlImported) {
      AdminPage.showTemporaryMessage(
        "t2s-settings-message",
        "Settings imported from URL parameters",
        "success",
      );
    }

    // Add event listener for export token checkbox (auto-regenerate URL on change)
    const exportTokenCheckbox = getEl("export-include-token");
    if (exportTokenCheckbox) {
      exportTokenCheckbox.addEventListener("change", () => {
        const exportUrlTextarea = getEl("export-url");
        // Only regenerate if URL already exists
        if (exportUrlTextarea && exportUrlTextarea.value.trim()) {
          AdminPage.generateExportUrl();
        }
      });
    }
  }

  /**
   * Import categories from file
   */
  static async importCategories() {
    const fileInput = getEl("categories-file");
    const messagesDivId = "categories-messages";

    if (!fileInput.files || fileInput.files.length === 0) {
      AdminPage.showImportMessage(
        "Please select a categories JSON file",
        "error",
        messagesDivId,
      );
      return;
    }

    try {
      const file = fileInput.files[0];
      const content = await AdminPage.readFileAsText(file);
      const data = JSON.parse(content);

      // Show progress bar
      AdminPage.showProgressBar(data.length, "categories", messagesDivId);

      // Add slight delay to show animation (import is instant otherwise)
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const result = CatalogManager.importCategories(data);

      if (result.success) {
        AdminPage.showSuccessBanner(result, "categories", messagesDivId);
        AdminPage.updateStats();

        // Reload main navigation to show new categories
        if (window.populateCategoriesDropdown) {
          window.populateCategoriesDropdown();
        }
      } else {
        AdminPage.hideProgressBar(messagesDivId);
        AdminPage.showImportMessage(result.error, "error", messagesDivId);
      }
    } catch (e) {
      AdminPage.hideProgressBar(messagesDivId);
      AdminPage.showImportMessage(
        `Error importing categories: ${e.message}`,
        "error",
        messagesDivId,
      );
    }
  }

  /**
   * Import products from file
   */
  static async importProducts() {
    const fileInput = getEl("products-file");
    const messagesDivId = "products-messages";

    if (!fileInput.files || fileInput.files.length === 0) {
      AdminPage.showImportMessage(
        "Please select a products JSON file",
        "error",
        messagesDivId,
      );
      return;
    }

    // Get selected import mode
    const checkedRadio = document.querySelector(
      'input[name="import-mode"]:checked',
    );
    const appendMode = checkedRadio?.value === "append";

    // Show confirmation dialog for replace mode if products exist
    if (!appendMode) {
      const stats = CatalogManager.getStats();
      if (stats.productCount > 0) {
        const confirmMessage = `⚠️ This will DELETE all ${stats.productCount} existing products and replace them with the imported catalog.`;
        if (!confirm(confirmMessage)) {
          return; // User cancelled
        }
      }
    }

    try {
      const file = fileInput.files[0];
      const content = await AdminPage.readFileAsText(file);
      const data = JSON.parse(content);

      // Show progress bar
      AdminPage.showProgressBar(data.length, "products", messagesDivId);

      // Add slight delay to show animation (import is instant otherwise)
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const result = CatalogManager.importProducts(data, appendMode);

      if (result.success) {
        AdminPage.showSuccessBanner(result, "products", messagesDivId);
        AdminPage.updateStats();
        AdminPage.updateProductCapacity();

        // Clear file input to allow immediate next import
        fileInput.value = "";
      } else {
        AdminPage.hideProgressBar(messagesDivId);
        AdminPage.showImportMessage(result.error, "error", messagesDivId);
      }
    } catch (e) {
      AdminPage.hideProgressBar(messagesDivId);
      AdminPage.showImportMessage(
        `Error importing products: ${e.message}`,
        "error",
        messagesDivId,
      );
    }
  }

  /**
   * Clear all catalog data
   */
  static clearCatalog() {
    if (
      !confirm(
        "Are you sure you want to clear all catalog data? This cannot be undone.",
      )
    ) {
      return;
    }

    const messagesDivId = "products-messages";
    const success = CatalogManager.clearAll();

    if (success) {
      AdminPage.showImportMessage(
        "Catalog data cleared successfully",
        "success",
        messagesDivId,
      );
      AdminPage.updateStats();
      AdminPage.updateProductCapacity();

      // Reload main navigation
      if (window.loadMainNavigation) {
        window.loadMainNavigation();
      }
    } else {
      AdminPage.showImportMessage(
        "Error clearing catalog data",
        "error",
        messagesDivId,
      );
    }
  }

  /**
   * Save settings
   */
  static saveSettings(event) {
    event.preventDefault();

    const siteName = getEl("setting-site-name").value;

    const success = Settings.save({ siteName });

    if (success) {
      // Update site name in header
      const siteNameEl = getEl("site-name");
      if (siteNameEl) {
        siteNameEl.textContent = siteName;
      }
      AdminPage.showTemporaryMessage(
        "settings-message",
        "Settings saved successfully!",
        "success",
      );
    } else {
      AdminPage.showTemporaryMessage(
        "settings-message",
        "Error saving settings",
        "error",
      );
    }
  }

  /**
   * Show animated progress bar during import
   */
  static showProgressBar(itemCount, type, messagesDivId) {
    const messagesDiv = getEl(messagesDivId);
    if (!messagesDiv) return;

    messagesDiv.innerHTML = `
            <div id="${messagesDivId}-progress" class="import-progress">
                <div class="progress-icon">📦</div>
                <div class="progress-text">Importing ${type}...</div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill"></div>
                </div>
                <div class="progress-status">Processing ${itemCount.toLocaleString()} items...</div>
            </div>
        `;

    // Animate progress from 0 to 100% over 1.5 seconds using requestAnimationFrame
    const fill = messagesDiv.querySelector(".progress-bar-fill");
    const progressText = messagesDiv.querySelector(".progress-text");
    const progressStatus = messagesDiv.querySelector(".progress-status");

    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      // Stop if elements were removed (e.g. error teardown)
      if (!fill.isConnected) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      // Smooth easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress / 100, 3);
      fill.style.width = `${eased * 100}%`;

      // Update text at milestones
      if (progress > 30 && progress < 35) {
        progressStatus.textContent = "Validating data...";
      } else if (progress > 60 && progress < 65) {
        progressStatus.textContent = `Importing ${itemCount.toLocaleString()} items...`;
      } else if (progress > 90) {
        progressStatus.textContent = "Finalizing...";
        progressText.textContent = "Almost done!";
      }

      if (progress < 100) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Hide progress bar
   */
  static hideProgressBar(messagesDivId) {
    const messagesDiv = getEl(messagesDivId);
    if (!messagesDiv) return;

    const progressEl = messagesDiv.querySelector('[id$="-progress"]');
    if (progressEl) {
      progressEl.style.opacity = "0";
      setTimeout(() => progressEl.remove(), 300);
    }
  }

  /**
   * Show success banner with animated stats
   */
  static showSuccessBanner(result, type, messagesDivId) {
    AdminPage.hideProgressBar(messagesDivId);

    const messagesDiv = getEl(messagesDivId);
    if (!messagesDiv) return;
    const stats = CatalogManager.getStats();

    let itemsText;
    let itemsIcon = "📦";

    if (type === "products") {
      if (result.mode === "append") {
        itemsText = `Added ${result.addedCount.toLocaleString()} new products`;
        itemsIcon = "➕";
      } else {
        itemsText = `Imported ${result.count.toLocaleString()} products`;
      }
    } else {
      itemsText = `Imported ${result.count.toLocaleString()} categories`;
      itemsIcon = "📂";
    }

    messagesDiv.innerHTML = `
            <div class="import-success-banner">
                <div class="success-checkmark">✓</div>
                <div class="success-content">
                    <div class="success-title">Import Successful!</div>
                    <div class="success-stats">
                        <div class="stat-item">
                            <span class="stat-icon">${itemsIcon}</span>
                            <span class="stat-text">${itemsText}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📊</span>
                            <span class="stat-text">Total: <strong id="banner-products">0</strong> products, <strong id="banner-categories">0</strong> categories</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Animate numbers counting up
    setTimeout(() => {
      AdminPage.animateNumber("banner-products", stats.productCount, 800);
      AdminPage.animateNumber("banner-categories", stats.categoryCount, 800);
    }, 400);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      const banner = messagesDiv.querySelector(".import-success-banner");
      if (banner) {
        banner.style.opacity = "0";
        banner.style.transform = "translateY(-20px)";
        setTimeout(() => {
          messagesDiv.innerHTML = "";
        }, 400);
      }
    }, 6000);
  }

  /**
   * Animate number counting up from 0 to target
   */
  static animateNumber(elementId, target, duration) {
    const element = getEl(elementId);
    if (!element) return;

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out-cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(target * eased).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show import message (for errors)
   */
  static showImportMessage(message, type, messagesDivId) {
    const messagesDiv = getEl(messagesDivId);
    if (!messagesDiv) return;

    messagesDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messagesDiv.innerHTML = "";
    }, 5000);
  }

  /**
   * Update statistics display
   */
  static updateStats() {
    const stats = CatalogManager.getStats();

    const productsEl = getEl("stat-products");
    const categoriesEl = getEl("stat-categories");
    const rootCategoriesEl = getEl("stat-root-categories");

    if (productsEl) productsEl.textContent = stats.productCount;
    if (categoriesEl) categoriesEl.textContent = stats.categoryCount;
    if (rootCategoriesEl)
      rootCategoriesEl.textContent = stats.rootCategoryCount;
  }

  /**
   * Update product capacity indicator (smart display - only shows when >= 90%)
   */
  static updateProductCapacity() {
    const stats = CatalogManager.getStats();
    const maxProducts = CatalogManager.MAX_PRODUCTS;
    const currentCount = stats.productCount;
    const percentage = Math.round((currentCount / maxProducts) * 100);

    const capacityDiv = getEl("product-capacity");
    if (!capacityDiv) return;

    // Only show if >= 90% or at limit
    if (percentage < 90) {
      capacityDiv.style.display = "none";
      return;
    }

    capacityDiv.style.display = "block";

    // Update content based on capacity level
    if (currentCount >= maxProducts) {
      // 100% - Red alert with pulse animation
      capacityDiv.innerHTML = `
                <div style="font-size: 15px; font-weight: 600; color: #dc2626; margin-bottom: 6px;">
                    🚫 Capacity limit reached: ${currentCount.toLocaleString()} / ${maxProducts.toLocaleString()} products
                </div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                    Cannot import more products. Delete existing products to free up space.
                </div>
            `;
      capacityDiv.style.borderLeft = "4px solid #dc2626";
      capacityDiv.style.background = "#fef2f2";
      capacityDiv.classList.add("capacity-alert-pulse");
      capacityDiv.classList.remove("capacity-warning-pulse");
    } else {
      // 90-99% - Orange warning with subtle pulse
      const remaining = maxProducts - currentCount;
      capacityDiv.innerHTML = `
                <div style="font-size: 15px; font-weight: 600; color: #ea580c; margin-bottom: 6px;">
                    ⚠️ Approaching capacity: ${currentCount.toLocaleString()} / ${maxProducts.toLocaleString()} products (${percentage}%)
                </div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                    ${remaining.toLocaleString()} products remaining before limit
                </div>
            `;
      capacityDiv.style.borderLeft = "4px solid #f97316";
      capacityDiv.style.background = "#fff7ed";
      capacityDiv.classList.add("capacity-warning-pulse");
      capacityDiv.classList.remove("capacity-alert-pulse");
    }
  }

  /**
   * Read file as text
   */
  static readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  /**
   * Save T2S settings
   */
  static saveT2SSettings(event) {
    event.preventDefault();

    const trackingUrl = getEl("setting-tracking-url").value.trim();
    const adsServerUrl = getEl("setting-ads-url").value.trim();
    const adsServerToken = getEl("setting-ads-token").value.trim();
    const useAdsProxy = getEl("setting-use-ads-proxy").checked;
    const customerId = getEl("setting-customer-id").value.trim();
    const pageIdsText = getEl("setting-page-ids").value.trim();
    const orderPrefix = getEl("setting-order-prefix").value.trim();

    // Validate page IDs JSON
    let pageIds;
    try {
      pageIds = JSON.parse(pageIdsText);
      if (typeof pageIds !== "object" || Array.isArray(pageIds)) {
        AdminPage.showTemporaryMessage(
          "t2s-settings-message",
          "Page IDs must be a JSON object",
          "error",
        );
        return;
      }
    } catch (e) {
      AdminPage.showTemporaryMessage(
        "t2s-settings-message",
        "Invalid JSON format for Page IDs",
        "error",
      );
      return;
    }

    const success = Settings.save({
      trackingUrl,
      adsServerUrl,
      adsServerToken,
      useAdsProxy,
      t2sCustomerId: customerId,
      t2sPageIds: pageIds,
      orderPrefix,
    });

    if (success) {
      AdminPage.showTemporaryMessage(
        "t2s-settings-message",
        "T2S settings saved successfully!",
        "success",
      );
    } else {
      AdminPage.showTemporaryMessage(
        "t2s-settings-message",
        "Error saving T2S settings",
        "error",
      );
    }
  }

  /**
   * Generate new tID
   */
  static generateNewTID() {
    const newTID = Settings.generateNewTID();
    const tidInput = getEl("current-tid");
    if (tidInput) {
      tidInput.value = newTID;
    }
    AdminPage.showTemporaryMessage(
      "tid-message",
      "New tID generated successfully!",
      "success",
    );
  }

  /**
   * Reset tID
   */
  static resetTID() {
    const newTID = Settings.resetTID();
    const tidInput = getEl("current-tid");
    if (tidInput) {
      tidInput.value = newTID;
    }
    AdminPage.showTemporaryMessage(
      "tid-message",
      "tID reset successfully!",
      "success",
    );
  }

  /**
   * Save custom tID
   */
  static saveCustomTID() {
    const customTID = getEl("custom-tid").value.trim();

    if (!customTID) {
      AdminPage.showTemporaryMessage(
        "tid-message",
        "Please enter a custom tID",
        "error",
      );
      return;
    }

    const success = Settings.saveTID(customTID);

    if (success) {
      const tidInput = getEl("current-tid");
      if (tidInput) {
        tidInput.value = customTID;
      }
      getEl("custom-tid").value = "";
      AdminPage.showTemporaryMessage(
        "tid-message",
        "Custom tID saved successfully!",
        "success",
      );
    } else {
      AdminPage.showTemporaryMessage(
        "tid-message",
        "Invalid UUID format. Must match pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "error",
      );
    }
  }

  // ===================================
  // URL Parameter Loading & Validation
  // ===================================

  /**
   * Validate a URL string
   * Must start with http:// or https:// and contain a valid domain.
   * Rejects malicious patterns (javascript:, data:, etc.)
   * @param {string} url - URL string to validate
   * @returns {boolean} True if valid
   */
  static validateUrl(url) {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();

    // Must start with http:// or https://
    if (!/^https?:\/\//i.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Invalid URL scheme:", trimmed);
      return false;
    }

    // Reject dangerous schemes embedded in the URL
    if (/javascript:/i.test(trimmed) || /data:/i.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Rejected malicious URL pattern:", trimmed);
      return false;
    }

    // Basic domain validation: must have at least one dot after the scheme
    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        console.warn("⚠️ [ADMIN] Invalid domain in URL:", trimmed);
        return false;
      }
    } catch {
      console.warn("⚠️ [ADMIN] Malformed URL:", trimmed);
      return false;
    }

    return true;
  }

  /**
   * Validate a customer ID string
   * Alphanumeric, dashes, and underscores only. Max 100 characters.
   * @param {string} id - Customer ID to validate
   * @returns {boolean} True if valid
   */
  static validateCustomerId(id) {
    if (!id || typeof id !== "string") return false;
    const trimmed = id.trim();

    if (trimmed.length > 100) {
      console.warn(
        "⚠️ [ADMIN] Customer ID too long (max 100):",
        trimmed.length,
      );
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Invalid customer ID characters:", trimmed);
      return false;
    }

    return true;
  }

  /**
   * Validate a bearer token string
   * Alphanumeric, dashes, underscores, and dots only. Max 2000 characters.
   * @param {string} token - Token to validate
   * @returns {boolean} True if valid
   */
  static validateToken(token) {
    if (!token || typeof token !== "string") return false;
    const trimmed = token.trim();

    if (trimmed.length > 2000) {
      console.warn("⚠️ [ADMIN] Token too long (max 2000):", trimmed.length);
      return false;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Invalid token characters");
      return false;
    }

    return true;
  }

  /**
   * Load settings from URL parameters and save to localStorage
   * Supported parameters: customerId, trackingUrl, adsServerUrl, adsToken, orderPrefix, useAdsProxy
   * Empty parameters are ignored. Invalid parameters are skipped with console warnings.
   * @returns {boolean} True if at least one parameter was imported
   */
  static loadSettingsFromUrl() {
    // Parse query string from hash-based URL (e.g., #/admin?customerId=...)
    const hash = window.location.hash || "";
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return false;

    const queryString = hash.substring(queryIndex + 1);
    const urlParams = new URLSearchParams(queryString);

    // Track which settings were imported
    const importedSettings = {};
    let importCount = 0;

    // customerId → t2sCustomerId
    const customerId = urlParams.get("customerId");
    if (customerId && customerId.trim()) {
      if (AdminPage.validateCustomerId(customerId)) {
        importedSettings.t2sCustomerId = customerId.trim();
        importCount++;
      } else {
        console.warn("⚠️ [ADMIN] Skipping invalid customerId parameter");
      }
    }

    // trackingUrl → trackingUrl
    const trackingUrl = urlParams.get("trackingUrl");
    if (trackingUrl && trackingUrl.trim()) {
      if (AdminPage.validateUrl(trackingUrl)) {
        importedSettings.trackingUrl = trackingUrl.trim();
        importCount++;
      } else {
        console.warn("⚠️ [ADMIN] Skipping invalid trackingUrl parameter");
      }
    }

    // adsServerUrl → adsServerUrl
    const adsServerUrl = urlParams.get("adsServerUrl");
    if (adsServerUrl && adsServerUrl.trim()) {
      if (AdminPage.validateUrl(adsServerUrl)) {
        importedSettings.adsServerUrl = adsServerUrl.trim();
        importCount++;
      } else {
        console.warn("⚠️ [ADMIN] Skipping invalid adsServerUrl parameter");
      }
    }

    // adsToken → adsServerToken
    const adsToken = urlParams.get("adsToken");
    if (adsToken && adsToken.trim()) {
      if (AdminPage.validateToken(adsToken)) {
        importedSettings.adsServerToken = adsToken.trim();
        importCount++;
      } else {
        console.warn("⚠️ [ADMIN] Skipping invalid adsToken parameter");
      }
    }

    // orderPrefix → orderPrefix (no strict validation, just trim)
    const orderPrefix = urlParams.get("orderPrefix");
    if (orderPrefix && orderPrefix.trim()) {
      importedSettings.orderPrefix = orderPrefix.trim();
      importCount++;
    }

    // useAdsProxy → useAdsProxy (boolean parameter)
    const useAdsProxy = urlParams.get("useAdsProxy");
    if (useAdsProxy !== null) {
      const value = useAdsProxy.toLowerCase();
      if (value === "true" || value === "1") {
        importedSettings.useAdsProxy = true;
        importCount++;
      } else if (value === "false" || value === "0") {
        importedSettings.useAdsProxy = false;
        importCount++;
      } else {
        console.warn(
          "⚠️ [ADMIN] Skipping invalid useAdsProxy parameter (must be true/false)",
        );
      }
    }

    // Save imported settings if any were valid
    if (importCount > 0) {
      Settings.save(importedSettings);
      console.log(
        `✅ [ADMIN] Imported ${importCount} setting(s) from URL:`,
        Object.keys(importedSettings),
      );
      return true;
    }

    return false;
  }

  /**
   * Show a temporary message in the given container, auto-dismissed after 3 seconds
   */
  static showTemporaryMessage(elementId, message, type) {
    const messageDiv = getEl(elementId);
    if (!messageDiv) return;

    messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

    setTimeout(() => {
      messageDiv.innerHTML = "";
    }, 3000);
  }

  /**
   * Ping CORS proxy health endpoint to wake it up
   * Fire-and-forget async call with timeout
   *
   * @description The CORS proxy (Render.com free tier) goes to sleep after 15 minutes
   * of inactivity and takes ~50 seconds to wake up. This preemptive ping ensures
   * the proxy is ready when users need to make authenticated Ads API calls.
   */
  static pingProxyHealth() {
    // Import Tracking class to access proxy constants
    import("../tracking.js")
      .then((module) => {
        const Tracking = module.Tracking;
        const healthUrl = Tracking.CORS_PROXY_HEALTH_ENDPOINT;
        const timeout = Tracking.CORS_PROXY_TIMEOUT;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Fire-and-forget fetch with timeout
        fetch(healthUrl, {
          method: "GET",
          signal: controller.signal,
        })
          .then(() => {
            console.log("✅ [ADMIN] CORS proxy health check succeeded");
          })
          .catch((error) => {
            // Ignore errors - this is just a wake-up call
            if (error.name === "AbortError") {
              console.log(
                "⏱️ [ADMIN] CORS proxy health check timed out (proxy may be starting)",
              );
            } else {
              console.log(
                "⚠️ [ADMIN] CORS proxy health check failed (proxy may be starting):",
                error.message,
              );
            }
          })
          .finally(() => {
            clearTimeout(timeoutId);
          });
      })
      .catch((err) => {
        console.error("❌ [ADMIN] Failed to import Tracking module:", err);
      });
  }

  // ===================================
  // Configuration Export
  // ===================================

  /**
   * Generate export URL with current T2S configuration
   * Builds a shareable URL with query parameters for all non-default settings
   */
  static generateExportUrl() {
    const settings = Settings.get();
    const includeToken = getEl("export-include-token").checked;

    // Build URL parameters for non-default settings
    const params = new URLSearchParams();

    // Add customerId if not default
    if (
      settings.t2sCustomerId &&
      settings.t2sCustomerId !== DEFAULT_T2S_CUSTOMER_ID
    ) {
      params.append("customerId", settings.t2sCustomerId);
    }

    // Add trackingUrl if not default
    if (settings.trackingUrl && settings.trackingUrl !== DEFAULT_TRACKING_URL) {
      params.append("trackingUrl", settings.trackingUrl);
    }

    // Add adsServerUrl if not default
    if (
      settings.adsServerUrl &&
      settings.adsServerUrl !== DEFAULT_ADS_SERVER_URL
    ) {
      params.append("adsServerUrl", settings.adsServerUrl);
    }

    // Add adsToken if checkbox checked and token exists
    if (includeToken && settings.adsServerToken) {
      params.append("adsToken", settings.adsServerToken);
    }

    // Add orderPrefix if not default
    if (settings.orderPrefix && settings.orderPrefix !== DEFAULT_ORDER_PREFIX) {
      params.append("orderPrefix", settings.orderPrefix);
    }

    // Add useAdsProxy only if false (true is default)
    if (settings.useAdsProxy === false) {
      params.append("useAdsProxy", "false");
    }

    // Construct full URL
    const baseUrl = `${window.location.origin}${window.location.pathname}#/admin`;
    const queryString = params.toString();
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    // Display URL in textarea
    const urlTextarea = getEl("export-url");
    if (urlTextarea) {
      urlTextarea.value = fullUrl;
    }

    // Show copy button and clear button
    const copyBtn = getEl("copy-export-url-btn");
    const clearBtn = getEl("clear-export-btn");
    if (copyBtn) copyBtn.style.display = "block";
    if (clearBtn) clearBtn.style.display = "block";

    // Show/hide security warning based on token inclusion
    const tokenWarning = getEl("export-token-warning");
    if (tokenWarning) {
      tokenWarning.style.display =
        includeToken && settings.adsServerToken ? "block" : "none";
    }

    console.log("📤 [ADMIN] Generated export URL:", fullUrl);
  }

  /**
   * Copy export URL to clipboard
   * Shows success feedback and handles fallback for unsupported browsers
   */
  static copyExportUrl() {
    const urlTextarea = getEl("export-url");
    const url = urlTextarea ? urlTextarea.value : "";

    if (!url) {
      AdminPage.showTemporaryMessage(
        "export-message",
        "No URL to copy. Generate a URL first.",
        "error",
      );
      return;
    }

    // Try modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          // Success feedback
          const copyBtn = getEl("copy-export-url-btn");
          if (copyBtn) {
            const originalText = copyBtn.textContent;
            const originalBg = copyBtn.style.background;
            copyBtn.textContent = "✓ Copied!";
            copyBtn.style.background = "var(--success-color)";

            // Reset button after 2 seconds
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = originalBg;
            }, 2000);
          }

          AdminPage.showTemporaryMessage(
            "export-message",
            "URL copied to clipboard!",
            "success",
          );
          console.log("✅ [ADMIN] Export URL copied to clipboard");
        })
        .catch((err) => {
          console.error("❌ [ADMIN] Failed to copy URL:", err);
          AdminPage.showTemporaryMessage(
            "export-message",
            "Failed to copy URL. Please select and copy manually.",
            "error",
          );
        });
    } else {
      // Fallback: select text for manual copy
      urlTextarea.select();
      urlTextarea.setSelectionRange(0, url.length);
      AdminPage.showTemporaryMessage(
        "export-message",
        "URL selected. Press Cmd+C (Mac) or Ctrl+C (Windows) to copy.",
        "success",
      );
      console.log("⚠️ [ADMIN] Clipboard API not supported, text selected");
    }
  }

  /**
   * Clear export URL textarea and reset UI
   */
  static clearExportUrl() {
    const urlTextarea = getEl("export-url");
    const copyBtn = getEl("copy-export-url-btn");
    const clearBtn = getEl("clear-export-btn");
    const tokenWarning = getEl("export-token-warning");
    const messageDiv = getEl("export-message");

    if (urlTextarea) urlTextarea.value = "";
    if (copyBtn) copyBtn.style.display = "none";
    if (clearBtn) clearBtn.style.display = "none";
    if (tokenWarning) tokenWarning.style.display = "none";
    if (messageDiv) messageDiv.innerHTML = "";

    console.log("🧹 [ADMIN] Export URL cleared");
  }
}

// Add CSS for admin section and import animations
const adminStyles = `
    .admin-section {
        background: var(--bg-primary);
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }

    /* ===================================
       Import Progress Bar
       =================================== */
    .import-progress {
        background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
        padding: 24px;
        border-radius: var(--radius-lg);
        margin-bottom: 20px;
        border: 2px solid var(--primary-light);
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1);
        animation: slideInDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        transition: opacity 0.3s ease;
    }

    .progress-icon {
        font-size: 32px;
        text-align: center;
        margin-bottom: 12px;
        animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .progress-text {
        font-size: 17px;
        font-weight: 600;
        color: var(--primary-dark);
        margin-bottom: 16px;
        text-align: center;
        font-family: var(--font-heading);
    }

    .progress-bar-container {
        width: 100%;
        height: 10px;
        background: var(--bg-secondary);
        border-radius: 20px;
        overflow: hidden;
        margin-bottom: 12px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .progress-bar-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
        border-radius: 20px;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .progress-bar-fill::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 1.5s infinite;
    }

    .progress-status {
        font-size: 14px;
        color: var(--text-secondary);
        text-align: center;
        font-weight: 500;
    }

    /* ===================================
       Success Banner
       =================================== */
    .import-success-banner {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid var(--success-color);
        border-radius: var(--radius-lg);
        padding: 28px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
        animation: slideInDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .success-checkmark {
        width: 56px;
        height: 56px;
        min-width: 56px;
        background: var(--success-color);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        animation: checkmarkPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
    }

    .success-content {
        flex: 1;
    }

    .success-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--success-color);
        margin-bottom: 12px;
        font-family: var(--font-heading);
    }

    .success-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary);
    }

    .stat-icon {
        font-size: 18px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .stat-text {
        line-height: 1.4;
    }

    .stat-text strong {
        color: var(--primary-dark);
        font-weight: 700;
    }

    /* ===================================
       Capacity Warnings
       =================================== */
    .capacity-warning-pulse {
        animation: warningPulse 2s ease-in-out infinite;
    }

    .capacity-alert-pulse {
        animation: alertPulse 1.5s ease-in-out infinite;
    }

    /* ===================================
       Animations
       =================================== */
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes bounceIn {
        0% {
            opacity: 0;
            transform: scale(0.3);
        }
        50% {
            opacity: 1;
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }

    @keyframes checkmarkPop {
        0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
        }
        70% {
            transform: scale(1.2) rotate(10deg);
        }
        100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }
    }

    @keyframes shimmer {
        0% {
            left: -100%;
        }
        100% {
            left: 100%;
        }
    }

    @keyframes warningPulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.2);
        }
        50% {
            box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
        }
    }

    @keyframes alertPulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3);
        }
        50% {
            box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
        }
    }

    /* ===================================
       Responsive
       =================================== */
    @media (max-width: 768px) {
        .import-success-banner {
            flex-direction: column;
            text-align: center;
        }

        .success-checkmark {
            width: 48px;
            height: 48px;
            min-width: 48px;
            font-size: 28px;
        }

        .success-title {
            font-size: 18px;
        }

        .stat-item {
            justify-content: center;
            font-size: 14px;
        }
    }
`;

// Inject styles if not already present
if (!document.getElementById("admin-styles")) {
  const style = document.createElement("style");
  style.id = "admin-styles";
  style.textContent = adminStyles;
  document.head.appendChild(style);
}
export { AdminPage };
