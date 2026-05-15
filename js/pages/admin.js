// ===================================
// Admin Page - Catalog import and settings
// ===================================

import { getEl, escapeHtml } from "../utils.js";
import { CatalogManager, Settings } from "../catalog.js";
import { Debug } from "../debug.js";
import { EnvironmentSelector } from "../environmentSelector.js";

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

    // Import settings from URL parameters before rendering form.
    // `urlImported` is { count, catalogKeys: Set<string> } so we can auto-fetch
    // only the catalog URLs that came from the URL this navigation.
    const urlImported = AdminPage.loadSettingsFromUrl();

    const settings = Settings.get();
    const stats = CatalogManager.getStats();

    app.innerHTML = `
            <div class="page page-pad fade-in">
            <div class="container">
                <div class="crumbs">
                    <a href="#/">Home</a>
                    <span class="sep">/</span>
                    <span>Admin</span>
                </div>
                <h1 class="section-title" style="font-size: 24px; margin-bottom: 16px;">Admin &amp; Settings</h1>

                <div style="display: grid; gap: 24px; max-width: 800px;">
                    <!-- 1. Ads & T2S Customer Configuration (first) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔧 Ads &amp; T2S - Customer Configuration</h2>

                        <form id="t2s-settings-form" onsubmit="AdminPage.saveT2SSettings(event)">

                            <!-- Blue zone: 3 fields filled by Quick Preset -->
                            <div class="zone-connection">
                                <div class="zone-title">🌍 Connection — filled by Quick Preset</div>
                                <div id="env-selector-container"></div>
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
                                    <label class="form-label">T2S Tracking URL</label>
                                    <input
                                        type="text"
                                        id="setting-tracking-url"
                                        class="form-input"
                                        value="${escapeHtml(settings.trackingUrl || DEFAULT_TRACKING_URL)}"
                                        placeholder="${DEFAULT_TRACKING_URL}"
                                    />
                                </div>

                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">Ads Server URL</label>
                                    <input
                                        type="text"
                                        id="setting-ads-url"
                                        class="form-input"
                                        value="${escapeHtml(settings.adsServerUrl || DEFAULT_ADS_SERVER_URL)}"
                                        placeholder="${DEFAULT_ADS_SERVER_URL}"
                                    />
                                </div>
                            </div>

                            <!-- Grey zone: fields not set by preset -->
                            <div class="zone-manual">
                                <div class="zone-title">⚙️ Manual settings — not set by preset</div>
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
                                    <label class="form-label">Page IDs Configuration (JSON)</label>
                                    <textarea
                                        id="setting-page-ids"
                                        class="form-input"
                                        rows="6"
                                        placeholder='${escapeHtml(JSON.stringify(Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}'
                                        style="font-family: monospace; font-size: 13px;"
                                    >${escapeHtml(JSON.stringify(settings.t2sPageIds || Settings.DEFAULT_SETTINGS.t2sPageIds, null, 2))}</textarea>
                                    <small style="color: var(--text-secondary); font-size: 12px;">
                                        JSON object with page type to page ID mappings
                                    </small>
                                </div>

                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">Order Prefix</label>
                                    <input
                                        type="text"
                                        id="setting-order-prefix"
                                        class="form-input"
                                        value="${escapeHtml(settings.orderPrefix || "")}"
                                        placeholder="${DEFAULT_ORDER_PREFIX}"
                                    />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save T2S Settings
                            </button>
                        </form>

                        <div id="t2s-settings-message"></div>
                    </div>

                    <!-- 2. Import from URL (primary flow) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🌐 Import catalog from URL</h2>

                        <!-- Import Mode (shared via name="import-mode") -->
                        <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
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

                        <div class="form-group">
                            <label class="form-label">Categories URL</label>
                            <input type="text" id="categories-url" class="form-input"
                                   placeholder="https://example.com/categories.json"
                                   value="${escapeHtml(settings.categoriesUrl || "")}" />
                            <button onclick="AdminPage.importCategoriesFromUrl()" class="btn btn-primary" style="margin-top: 8px;">
                                Import Categories from URL
                            </button>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Product URL 1</label>
                            <input type="text" id="products-url" class="form-input"
                                   placeholder="https://example.com/products_1P.json"
                                   value="${escapeHtml(settings.productsUrl || "")}" />

                            <label class="form-label" style="margin-top: 12px;">Product URL 2 (Optional)</label>
                            <input type="text" id="products-url2" class="form-input"
                                   placeholder="https://example.com/products_3P.json"
                                   value="${escapeHtml(settings.productsUrl2 || "")}" />
                            <small style="color: var(--text-secondary); font-size: 12px; margin-top: 4px; display: block;">
                                Second URL will be auto-appended if provided
                            </small>

                            <button onclick="AdminPage.importProductsFromUrl()" class="btn btn-primary" style="margin-top: 8px;">
                                Import Products from URL
                            </button>
                        </div>
                    </div>

                    <!-- Shared progress / result messages for both URL and File flows -->
                    <div id="categories-messages"></div>
                    <div id="products-messages"></div>

                    <!-- Import from File (rare fallback — collapsed by default) -->
                    <details class="admin-section admin-section--collapsible">
                        <summary style="cursor: pointer; font-size: 16px; font-weight: 600; color: var(--text-secondary); list-style: none; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 12px;">▸</span>
                            <span>📁 Import from File <small style="font-weight: 400; color: var(--text-secondary);">(rare — fallback when URL is not available)</small></span>
                        </summary>

                        <div style="margin-top: 16px;">
                            <!-- Import Mode (shared name="import-mode" — flips both sections in sync) -->
                            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
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

                            <div class="form-group">
                                <label class="form-label">Categories JSON File</label>
                                <input type="file" id="categories-file" accept=".json" class="form-input" />
                                <button onclick="AdminPage.importCategories()" class="btn btn-secondary" style="margin-top: 8px;">
                                    Import Categories from File
                                </button>
                            </div>

                            <!-- Product Capacity Indicator (shown only when >= 90% or at limit) -->
                            <div id="product-capacity" style="display: none; margin-bottom: 16px; padding: 14px 16px; border-radius: var(--radius-lg); transition: all var(--transition-base);"></div>

                            <div class="form-group">
                                <label class="form-label">Products JSON File</label>
                                <input type="file" id="products-file" accept=".json" class="form-input" />
                                <button onclick="AdminPage.importProducts()" class="btn btn-secondary" style="margin-top: 8px;">
                                    Import Products from File
                                </button>
                            </div>
                        </div>
                    </details>

                    <!-- Catalog actions -->
                    <div class="admin-section" style="padding: 16px;">
                        <button onclick="AdminPage.clearCatalog()" class="btn btn-secondary">
                            Clear All Catalog Data
                        </button>
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

                    <!-- Developer Tools (theme + debug overlay) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🛠 Developer</h2>

                        <div class="form-group">
                            <label class="form-label">Theme</label>
                            <div class="theme-switcher" id="theme-switcher">
                                ${['slate', 'warm', 'modern'].map(name => `
                                    <button type="button"
                                            class="theme-chip ${settings.theme === name ? 'is-active' : ''}"
                                            data-theme="${name}"
                                            onclick="AdminPage.setTheme('${name}')">
                                        ${name.charAt(0).toUpperCase() + name.slice(1)}
                                    </button>
                                `).join('')}
                            </div>
                            <small style="color: var(--text-secondary); font-size: 12px;">
                                Switches the visual theme across all pages instantly.
                            </small>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                <input type="checkbox" id="setting-debug-mode" ${settings.debugMode ? 'checked' : ''}
                                       onchange="AdminPage.toggleDebug(this.checked)" />
                                <span>Debug overlay</span>
                            </label>
                            <small style="color: var(--text-secondary); font-size: 12px;">
                                Shows a fixed sidebar listing the current page's ad units, plus a dashed outline
                                and corner badge on every ad zone (kind · adUnitId · creativeFormat · size).
                            </small>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                <input type="checkbox" id="setting-ads-api-mock-mode" ${settings.adsApiMockMode ? 'checked' : ''}
                                       onchange="AdminPage.toggleAdsApiMockMode(this.checked)" />
                                <span>Ads API mock mode</span>
                            </label>
                            <small style="color: var(--text-secondary); font-size: 12px;">
                                When on, the Ads API call is short-circuited and the front-end receives
                                <code>doc/examples/ads01.json</code> as the response — useful for testing every
                                template visually without backend setup. Console logs are prefixed with 🧪.
                            </small>
                        </div>
                    </div>

                    <!-- 8. tID Management -->
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

                    <!-- 9. Advanced (CORS proxy) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">🔒 Advanced</h2>

                        <form id="advanced-settings-form" onsubmit="AdminPage.saveAdvancedSettings(event)">
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
                                <div id="proxy-advanced-config" style="display: ${settings.useAdsProxy !== false ? 'block' : 'none'}; margin-top: 10px; margin-left: 24px; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary);">
                                    <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Proxy Configuration</div>
                                    <div class="form-group" style="margin-bottom: 10px;">
                                        <label class="form-label" style="font-size: 13px;">Proxy URL</label>
                                        <input
                                            type="text"
                                            id="setting-cors-proxy-url"
                                            class="form-input"
                                            value="${escapeHtml(settings.corsProxyUrl || Settings.DEFAULT_SETTINGS.corsProxyUrl)}"
                                            placeholder="${escapeHtml(Settings.DEFAULT_SETTINGS.corsProxyUrl)}"
                                        />
                                    </div>
                                    <div class="form-group" style="margin-bottom: 0;">
                                        <label class="form-label" style="font-size: 13px;">Health Endpoint URL</label>
                                        <input
                                            type="text"
                                            id="setting-cors-proxy-health-url"
                                            class="form-input"
                                            value="${escapeHtml(settings.corsProxyHealthUrl || Settings.DEFAULT_SETTINGS.corsProxyHealthUrl)}"
                                            placeholder="${escapeHtml(Settings.DEFAULT_SETTINGS.corsProxyHealthUrl)}"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary">
                                Save Advanced Settings
                            </button>
                        </form>

                        <div id="advanced-settings-message"></div>
                    </div>

                    <!-- 10. Configuration Export (last) -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">📤 Configuration Export</h2>

                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; line-height: 1.5;">
                            Generate a shareable URL containing the current configuration (T2S, Ads, catalog URLs).
                            Open the link on another machine to import everything in one shot.
                        </p>

                        <div id="export-token-warning" style="display: none; background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px;">
                            <div style="display: flex; align-items: start; gap: 10px;">
                                <span style="font-size: 18px;">🔐</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px;">Security Warning</div>
                                    <div style="font-size: 13px; color: var(--text-secondary);">
                                        The generated URL includes your Ads Server Token. Only share with trusted recipients.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="export-include-token" checked style="width: auto; margin: 0;" />
                                <span>Include Ads Server Token in URL</span>
                            </label>
                            <small style="color: var(--text-secondary); font-size: 12px; margin-left: 24px;">
                                Uncheck to exclude the token for safer sharing.
                            </small>
                        </div>

                        <div class="form-group" style="position: relative;">
                            <label class="form-label">Generated URL</label>
                            <textarea id="export-url" class="form-input" readonly rows="4"
                                      placeholder="Click 'Generate URL' to create a shareable configuration link"
                                      style="font-family: monospace; font-size: 13px; background: var(--bg-secondary); cursor: text; resize: vertical; padding-right: 80px;"></textarea>
                            <button id="copy-export-url-btn" onclick="AdminPage.copyExportUrl()" class="btn btn-primary"
                                    style="display: none; position: absolute; top: 34px; right: 8px; padding: 6px 12px; font-size: 13px; z-index: 10;">
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
            </div>
        `;

    // Initialize product capacity indicator
    AdminPage.updateProductCapacity();

    // Ping CORS proxy health endpoint to wake it up preemptively
    AdminPage.pingProxyHealth();

    // Load environment presets and render the Quick Preset selector in T2S section
    EnvironmentSelector.load().then(envs => EnvironmentSelector.render('env-selector-container', envs));

    // Toggle advanced proxy config visibility with the checkbox
    const proxyCheckbox = getEl('setting-use-ads-proxy');
    const proxyAdvanced = getEl('proxy-advanced-config');
    if (proxyCheckbox && proxyAdvanced) {
        proxyCheckbox.addEventListener('change', () => {
            proxyAdvanced.style.display = proxyCheckbox.checked ? 'block' : 'none';
        });
    }

    // Show success notification if settings were imported from URL
    if (urlImported && urlImported.count > 0) {
      AdminPage.showTemporaryMessage(
        "t2s-settings-message",
        "Settings imported from URL parameters",
        "success",
      );
    }

    // Auto-fetch catalogs when the URL provided them on THIS navigation.
    // We only trigger on URL-param presence, not on previously-stored settings,
    // so refreshing a clean /admin URL never re-fetches.
    if (urlImported && urlImported.catalogKeys?.size > 0) {
      if (urlImported.catalogKeys.has("categoriesUrl")) {
        AdminPage.importCategoriesFromUrl();
      }
      if (
        urlImported.catalogKeys.has("productsUrl") ||
        urlImported.catalogKeys.has("productsUrl2")
      ) {
        AdminPage.importProductsFromUrl();
      }
    }

    // Re-generate the export URL whenever the token checkbox flips.
    const exportTokenCheckbox = getEl("export-include-token");
    if (exportTokenCheckbox) {
      exportTokenCheckbox.addEventListener("change", () => {
        const exportUrlTextarea = getEl("export-url");
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
   * Fetch + parse JSON from a remote URL. Validates the URL first.
   */
  static async #fetchJsonFromUrl(url, label = "URL") {
    if (!AdminPage.validateUrl(url)) {
      throw new Error(`Invalid URL format for ${label}. URL must start with http:// or https://`);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${label}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  static #updateProgressStatus(messagesDivId, text) {
    const messagesDiv = getEl(messagesDivId);
    if (!messagesDiv) return;
    const statusEl = messagesDiv.querySelector(".progress-status");
    if (statusEl) statusEl.textContent = text;
  }

  static #formatImportError(error, type) {
    const isNetworkError =
      error.name === "TypeError" ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch");
    if (isNetworkError) {
      return `Network error: ${error.message}. Check URL and CORS settings.`;
    }
    return `Error importing ${type}: ${error.message}`;
  }

  /**
   * Import categories from URL
   */
  static async importCategoriesFromUrl() {
    const urlInput = getEl("categories-url");
    const messagesDivId = "categories-messages";

    if (!urlInput || !urlInput.value.trim()) {
      AdminPage.showImportMessage("Please enter a categories URL", "error", messagesDivId);
      return;
    }

    const url = urlInput.value.trim();
    if (!AdminPage.validateUrl(url)) {
      AdminPage.showImportMessage(
        "Invalid URL format. URL must start with http:// or https://",
        "error",
        messagesDivId,
      );
      return;
    }

    try {
      AdminPage.showProgressBar(0, "categories", messagesDivId);
      AdminPage.#updateProgressStatus(messagesDivId, "Fetching from URL...");

      const data = await AdminPage.#fetchJsonFromUrl(url);

      AdminPage.showProgressBar(data.length, "categories", messagesDivId);
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const result = CatalogManager.importCategories(data);

      if (result.success) {
        AdminPage.showSuccessBanner(result, "categories", messagesDivId);
        AdminPage.updateStats();
        Settings.save({ categoriesUrl: url });
        if (window.populateCategoriesDropdown) window.populateCategoriesDropdown();
      } else {
        AdminPage.hideProgressBar(messagesDivId);
        AdminPage.showImportMessage(result.error, "error", messagesDivId);
      }
    } catch (e) {
      AdminPage.hideProgressBar(messagesDivId);
      AdminPage.showImportMessage(
        AdminPage.#formatImportError(e, "categories"),
        "error",
        messagesDivId,
      );
    }
  }

  /**
   * Import products from URL(s). Two URLs supported — second always appends.
   * Honors the Replace / Append radio for the first URL.
   */
  static async importProductsFromUrl() {
    const urlInput1 = getEl("products-url");
    const urlInput2 = getEl("products-url2");
    const messagesDivId = "products-messages";

    if (!urlInput1 || !urlInput1.value.trim()) {
      AdminPage.showImportMessage("Please enter at least one product URL", "error", messagesDivId);
      return;
    }

    const url1 = urlInput1.value.trim();
    const url2 = urlInput2 ? urlInput2.value.trim() : "";

    if (!AdminPage.validateUrl(url1)) {
      AdminPage.showImportMessage(
        "Invalid URL format for Product URL 1. URL must start with http:// or https://",
        "error",
        messagesDivId,
      );
      return;
    }

    if (url2 && !AdminPage.validateUrl(url2)) {
      AdminPage.showImportMessage(
        "Invalid URL format for Product URL 2. URL must start with http:// or https://",
        "error",
        messagesDivId,
      );
      return;
    }

    const checkedRadio = document.querySelector('input[name="import-mode"]:checked');
    const appendMode = checkedRadio?.value === "append";

    if (!appendMode) {
      const stats = CatalogManager.getStats();
      if (stats.productCount > 0) {
        const confirmMessage = `⚠️ This will DELETE all ${stats.productCount} existing products and replace them with the imported catalog.`;
        if (!confirm(confirmMessage)) return;
      }
    }

    try {
      // === URL 1 ===
      AdminPage.showProgressBar(0, "products", messagesDivId);
      AdminPage.#updateProgressStatus(messagesDivId, "Fetching from URL 1...");

      const data1 = await AdminPage.#fetchJsonFromUrl(url1, "URL 1");

      AdminPage.showProgressBar(data1.length, "products", messagesDivId);
      await new Promise((resolve) => setTimeout(resolve, 1600));

      const result1 = CatalogManager.importProducts(data1, appendMode);
      if (!result1.success) {
        AdminPage.hideProgressBar(messagesDivId);
        AdminPage.showImportMessage(result1.error, "error", messagesDivId);
        return;
      }

      // === URL 2 (always append) ===
      let result2 = null;
      if (url2) {
        AdminPage.#updateProgressStatus(messagesDivId, "Fetching from URL 2...");
        const data2 = await AdminPage.#fetchJsonFromUrl(url2, "URL 2");

        AdminPage.showProgressBar(data2.length, "products", messagesDivId);
        await new Promise((resolve) => setTimeout(resolve, 1600));

        result2 = CatalogManager.importProducts(data2, true);
        if (!result2.success) {
          AdminPage.hideProgressBar(messagesDivId);
          AdminPage.showImportMessage(
            `URL 1 imported successfully, but URL 2 failed: ${result2.error}`,
            "error",
            messagesDivId,
          );
          return;
        }
      }

      const finalResult = url2 && result2 ? result2 : result1;
      AdminPage.showSuccessBanner(finalResult, "products", messagesDivId);
      AdminPage.updateStats();
      AdminPage.updateProductCapacity();

      Settings.save({ productsUrl: url1, productsUrl2: url2 });
    } catch (e) {
      AdminPage.hideProgressBar(messagesDivId);
      AdminPage.showImportMessage(
        AdminPage.#formatImportError(e, "products"),
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
   * Set the active theme (Slate / Warm / Modern).
   * Settings.save applies the side effect on documentElement.
   */
  static setTheme(name) {
    if (!['slate', 'warm', 'modern'].includes(name)) return;
    Settings.save({ theme: name });

    // Update chip active state without re-rendering the whole page
    const switcher = getEl('theme-switcher');
    if (switcher) {
      switcher.querySelectorAll('.theme-chip').forEach(chip => {
        chip.classList.toggle('is-active', chip.dataset.theme === name);
      });
    }
  }

  /**
   * Toggle the debug overlay (sidebar + ad-zone outlines).
   */
  static toggleDebug(checked) {
    Debug.setEnabled(!!checked);
  }

  /**
   * Toggle Ads API mock mode (short-circuits requestSponsoredProducts to serve ads01.json).
   */
  static toggleAdsApiMockMode(checked) {
    Settings.save({ adsApiMockMode: !!checked });
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
  /**
   * Ping CORS proxy health endpoint to wake it up
   * Fire-and-forget. The proxy (Render.com free tier) sleeps after 15 min of inactivity.
   */
  static pingProxyHealth() {
    import('../tracking.js')
      .then((module) => {
        const Tracking = module.Tracking;
        const healthUrl = Settings.get().corsProxyHealthUrl;
        const timeout = Tracking.CORS_PROXY_TIMEOUT;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        fetch(healthUrl, { method: 'GET', signal: controller.signal })
          .then(() => {
            console.log('✅ [ADMIN] CORS proxy health check succeeded');
          })
          .catch((error) => {
            if (error.name === 'AbortError') {
              console.log('⏱️ [ADMIN] CORS proxy health check timed out (proxy may be starting)');
            } else {
              console.log('⚠️ [ADMIN] CORS proxy health check failed:', error.message);
            }
          })
          .finally(() => clearTimeout(timeoutId));
      })
      .catch((err) => {
        console.error('❌ [ADMIN] Failed to import Tracking module:', err);
      });
  }

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
   * Save advanced settings (CORS proxy configuration)
   */
  static saveAdvancedSettings(event) {
    event.preventDefault();

    const useAdsProxy = getEl("setting-use-ads-proxy").checked;
    const corsProxyUrl = getEl("setting-cors-proxy-url")?.value.trim() || '';
    const corsProxyHealthUrl = getEl("setting-cors-proxy-health-url")?.value.trim() || '';

    const success = Settings.save({
      useAdsProxy,
      corsProxyUrl: corsProxyUrl || Settings.DEFAULT_SETTINGS.corsProxyUrl,
      corsProxyHealthUrl: corsProxyHealthUrl || Settings.DEFAULT_SETTINGS.corsProxyHealthUrl,
    });

    if (success) {
      AdminPage.showTemporaryMessage(
        "advanced-settings-message",
        "Advanced settings saved successfully!",
        "success",
      );
    } else {
      AdminPage.showTemporaryMessage(
        "advanced-settings-message",
        "Error saving advanced settings",
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

    // Length cap — defense against query-string stuffing and oversized input.
    if (trimmed.length > 2048) {
      console.warn("⚠️ [ADMIN] URL too long (max 2048):", trimmed.length);
      return false;
    }

    // Must start with http:// or https://
    if (!/^https?:\/\//i.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Invalid URL scheme:", trimmed);
      return false;
    }

    // Reject dangerous schemes embedded in the URL (defense in depth — the
    // scheme regex above already catches this, but the literal check stops
    // bypasses like "https://...?next=javascript:..." being mis-flagged).
    if (/^\s*(javascript|data|file|vbscript):/i.test(trimmed)) {
      console.warn("⚠️ [ADMIN] Rejected dangerous URL scheme:", trimmed);
      return false;
    }

    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname) {
        console.warn("⚠️ [ADMIN] Missing hostname in URL:", trimmed);
        return false;
      }
      // Hostname must be a dotted name (foo.bar) OR localhost / 127.0.0.1.
      const isLocal = parsed.hostname === "localhost" || /^127(\.\d+){3}$/.test(parsed.hostname);
      if (!isLocal && !parsed.hostname.includes(".")) {
        console.warn("⚠️ [ADMIN] Invalid domain in URL:", trimmed);
        return false;
      }
      // Block credentials in the URL (https://user:pass@host) — common phishing vector.
      if (parsed.username || parsed.password) {
        console.warn("⚠️ [ADMIN] URL credentials not allowed:", trimmed);
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
   * Load settings from URL parameters and save to localStorage.
   * Supported: customerId, trackingUrl, adsServerUrl, adsToken, orderPrefix,
   * categoriesUrl, productsUrl, productsUrl2.
   * Empty params are ignored. Invalid params are skipped with console warnings.
   * @returns {{count: number, catalogKeys: Set<string>}}
   *   - count: how many settings were imported
   *   - catalogKeys: subset that triggers auto-fetch (categoriesUrl/productsUrl/productsUrl2)
   */
  static loadSettingsFromUrl() {
    const empty = { count: 0, catalogKeys: new Set() };
    // Parse query string from hash-based URL (e.g., #/admin?customerId=...)
    const hash = window.location.hash || "";
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return empty;

    const queryString = hash.substring(queryIndex + 1);
    const urlParams = new URLSearchParams(queryString);

    // Track which settings were imported
    const importedSettings = {};
    const catalogKeys = new Set();
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

    // categoriesUrl / productsUrl / productsUrl2 → persisted so the form
    // re-renders with the URLs pre-filled. Auto-fetch is triggered after render.
    const categoriesUrl = urlParams.get("categoriesUrl");
    if (categoriesUrl && categoriesUrl.trim() && AdminPage.validateUrl(categoriesUrl)) {
      importedSettings.categoriesUrl = categoriesUrl.trim();
      catalogKeys.add("categoriesUrl");
      importCount++;
    } else if (categoriesUrl) {
      console.warn("⚠️ [ADMIN] Skipping invalid categoriesUrl parameter");
    }

    const productsUrl = urlParams.get("productsUrl");
    if (productsUrl && productsUrl.trim() && AdminPage.validateUrl(productsUrl)) {
      importedSettings.productsUrl = productsUrl.trim();
      catalogKeys.add("productsUrl");
      importCount++;
    } else if (productsUrl) {
      console.warn("⚠️ [ADMIN] Skipping invalid productsUrl parameter");
    }

    const productsUrl2 = urlParams.get("productsUrl2");
    if (productsUrl2 && productsUrl2.trim() && AdminPage.validateUrl(productsUrl2)) {
      importedSettings.productsUrl2 = productsUrl2.trim();
      catalogKeys.add("productsUrl2");
      importCount++;
    } else if (productsUrl2) {
      console.warn("⚠️ [ADMIN] Skipping invalid productsUrl2 parameter");
    }

    // Save imported settings if any were valid
    if (importCount > 0) {
      Settings.save(importedSettings);
      console.log(
        `✅ [ADMIN] Imported ${importCount} setting(s) from URL:`,
        Object.keys(importedSettings),
      );
      return { count: importCount, catalogKeys };
    }

    return empty;
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

  // ===================================
  // Configuration Export
  // ===================================

  /**
   * Build a shareable /admin URL with the current configuration encoded as
   * query parameters. Only non-default values are included to keep the URL short.
   */
  static generateExportUrl() {
    const settings = Settings.get();
    const includeToken = getEl("export-include-token")?.checked ?? true;
    const params = new URLSearchParams();

    if (settings.t2sCustomerId && settings.t2sCustomerId !== DEFAULT_T2S_CUSTOMER_ID) {
      params.append("customerId", settings.t2sCustomerId);
    }
    if (settings.trackingUrl && settings.trackingUrl !== DEFAULT_TRACKING_URL) {
      params.append("trackingUrl", settings.trackingUrl);
    }
    if (settings.adsServerUrl && settings.adsServerUrl !== DEFAULT_ADS_SERVER_URL) {
      params.append("adsServerUrl", settings.adsServerUrl);
    }
    if (includeToken && settings.adsServerToken) {
      params.append("adsToken", settings.adsServerToken);
    }
    if (settings.orderPrefix && settings.orderPrefix !== DEFAULT_ORDER_PREFIX) {
      params.append("orderPrefix", settings.orderPrefix);
    }
    // Catalog URLs: read live from the inputs so the exported URL reflects
    // whatever the user currently sees in the form (including the defaults
    // we pre-filled), not just previously-saved Settings.
    const categoriesUrlInput = getEl("categories-url")?.value.trim() || settings.categoriesUrl;
    const productsUrlInput = getEl("products-url")?.value.trim() || settings.productsUrl;
    const productsUrl2Input = getEl("products-url2")?.value.trim() || settings.productsUrl2;
    if (categoriesUrlInput) params.append("categoriesUrl", categoriesUrlInput);
    if (productsUrlInput) params.append("productsUrl", productsUrlInput);
    if (productsUrl2Input) params.append("productsUrl2", productsUrl2Input);

    const baseUrl = `${window.location.origin}${window.location.pathname}#/admin`;
    const queryString = params.toString();
    const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const urlTextarea = getEl("export-url");
    if (urlTextarea) urlTextarea.value = fullUrl;

    const copyBtn = getEl("copy-export-url-btn");
    const clearBtn = getEl("clear-export-btn");
    if (copyBtn) copyBtn.style.display = "block";
    if (clearBtn) clearBtn.style.display = "block";

    const tokenWarning = getEl("export-token-warning");
    if (tokenWarning) {
      tokenWarning.style.display = includeToken && settings.adsServerToken ? "block" : "none";
    }

    console.log("📤 [ADMIN] Generated export URL:", fullUrl);
  }

  /**
   * Copy the generated export URL to the clipboard.
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

    // Decide the post-copy message: warn if the token is actually present.
    // We check both that the checkbox is on AND that a non-empty token exists.
    const includeToken = getEl("export-include-token")?.checked ?? true;
    const hasToken = !!Settings.get().adsServerToken;
    const tokenInClipboard = includeToken && hasToken;
    const successMessage = tokenInClipboard
      ? "⚠️ URL copied — contains your Ads Server Token. Share only with trusted recipients."
      : "URL copied to clipboard!";
    const successType = tokenInClipboard ? "warning" : "success";

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          const copyBtn = getEl("copy-export-url-btn");
          if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => {
              copyBtn.textContent = originalText;
            }, 2000);
          }
          AdminPage.showTemporaryMessage("export-message", successMessage, successType);
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
      urlTextarea.select();
      urlTextarea.setSelectionRange(0, url.length);
      AdminPage.showTemporaryMessage(
        "export-message",
        tokenInClipboard
          ? "⚠️ URL selected — contains your Ads Server Token. Press Cmd+C / Ctrl+C to copy."
          : "URL selected. Press Cmd+C (Mac) or Ctrl+C (Windows) to copy.",
        successType,
      );
    }
  }

  /**
   * Clear the export URL textarea and reset the export UI.
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
  }
}

// Add CSS for admin section and import animations
const adminStyles = `
    .admin-section {
        background: var(--surface);
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border);
    }

    /* Two-zone layout inside T2S Configuration */
    .zone-connection {
        border: 1px solid #90cdf4;
        background: #ebf8ff;
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 14px;
    }

    .zone-connection .zone-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #2b6cb0;
        margin-bottom: 12px;
    }

    .zone-manual {
        border: 1px solid var(--border);
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 14px;
    }

    .zone-manual .zone-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }

    /* Collapsible card (e.g. File import — kept secondary) */
    details.admin-section--collapsible {
        padding: 14px 20px;
    }
    details.admin-section--collapsible summary::-webkit-details-marker {
        display: none;
    }
    details.admin-section--collapsible > summary > span:first-child {
        display: inline-block;
        transition: transform 0.18s ease;
    }
    details.admin-section--collapsible[open] > summary > span:first-child {
        transform: rotate(90deg);
    }

    /* Theme switcher chips (Developer card) */
    .theme-switcher {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 8px;
    }

    .theme-chip {
        padding: 8px 16px;
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-family: var(--font-heading);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .theme-chip:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    .theme-chip.is-active {
        background: var(--accent);
        border-color: var(--accent);
        color: #FFFFFF;
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
