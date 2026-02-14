// ===================================
// Admin Page - Catalog import and settings
// ===================================

import { getEl, escapeHtml } from '../utils.js';
import { CatalogManager, Settings } from '../catalog.js';

class AdminPage {
    /**
     * Render admin page
     */
    static render() {
        const app = getEl('app');
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
                        <h2 style="margin-bottom: 16px; font-size: 20px;">Import Catalog</h2>

                        <div id="import-messages"></div>

                        <div class="form-group">
                            <label class="form-label">Categories JSON File</label>
                            <input type="file" id="categories-file" accept=".json" class="form-input" />
                            <button onclick="AdminPage.importCategories()" class="btn btn-primary" style="margin-top: 8px;">
                                Import Categories
                            </button>
                        </div>

                        <!-- Product Capacity Indicator -->
                        <div id="product-capacity" style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
                            <div style="font-size: 14px; margin-bottom: 4px;">
                                <strong>Product Capacity:</strong> <span id="capacity-current">0</span> / <span id="capacity-max">3000</span> products (<span id="capacity-percent">0</span>%)
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary);">
                                Available capacity: <span id="capacity-remaining">3000</span> slots
                            </div>
                        </div>

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
                        </div>

                        <div class="form-group">
                            <button onclick="AdminPage.clearCatalog()" class="btn btn-secondary">
                                Clear All Catalog Data
                            </button>
                        </div>
                    </div>

                    <!-- Catalog Statistics -->
                    <div class="admin-section">
                        <h2 style="margin-bottom: 16px; font-size: 20px;">Catalog Statistics</h2>
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
                        <h2 style="margin-bottom: 16px; font-size: 20px;">Site Settings</h2>

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
                        <h2 style="margin-bottom: 16px; font-size: 20px;">T2S Tracking Configuration</h2>

                        <form id="t2s-settings-form" onsubmit="AdminPage.saveT2SSettings(event)">
                            <div class="form-group">
                                <label class="form-label">T2S Tracking URL</label>
                                <input
                                    type="text"
                                    id="setting-tracking-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.trackingUrl)}"
                                    placeholder="https://xxxxx.retail.mirakl.net"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Ads Server URL</label>
                                <input
                                    type="text"
                                    id="setting-ads-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerUrl)}"
                                    placeholder="https://xxxxx.retailmedia.mirakl.net"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">T2S Customer ID</label>
                                <input
                                    type="text"
                                    id="setting-customer-id"
                                    class="form-input"
                                    value="${escapeHtml(settings.t2sCustomerId || '')}"
                                    placeholder="CUSTOMER_PUBLIC_ID"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Page IDs Configuration (JSON)</label>
                                <textarea
                                    id="setting-page-ids"
                                    class="form-input"
                                    rows="6"
                                    placeholder='{"search": 2000, "category": 1400, "product": 1200, "cart": 1600, "postPayment": 2400}'
                                    style="font-family: monospace; font-size: 13px;"
                                >${JSON.stringify(settings.t2sPageIds || {}, null, 2)}</textarea>
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
                                    value="${escapeHtml(settings.orderPrefix || '')}"
                                    placeholder="ORDER_"
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
                        <h2 style="margin-bottom: 16px; font-size: 20px;">User Tracking ID (tID) Management</h2>

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
                </div>
            </div>
        `;

        // Initialize product capacity indicator
        AdminPage.updateProductCapacity();
    }

    /**
     * Import categories from file
     */
    static async importCategories() {
        const fileInput = getEl('categories-file');
        const messagesDiv = getEl('import-messages');

        if (!fileInput.files || fileInput.files.length === 0) {
            AdminPage.showImportMessage('Please select a categories JSON file', 'error');
            return;
        }

        try {
            const file = fileInput.files[0];
            const content = await AdminPage.readFileAsText(file);
            const data = JSON.parse(content);

            const result = CatalogManager.importCategories(data);

            if (result.success) {
                AdminPage.showImportMessage(result.message, 'success');
                AdminPage.updateStats();

                // Reload main navigation to show new categories
                if (window.populateCategoriesDropdown) {
                    window.populateCategoriesDropdown();
                }
            } else {
                AdminPage.showImportMessage(result.error, 'error');
            }
        } catch (e) {
            AdminPage.showImportMessage(`Error importing categories: ${e.message}`, 'error');
        }
    }

    /**
     * Import products from file
     */
    static async importProducts() {
        const fileInput = getEl('products-file');

        if (!fileInput.files || fileInput.files.length === 0) {
            AdminPage.showImportMessage('Please select a products JSON file', 'error');
            return;
        }

        // Get selected import mode
        const importModeRadios = document.getElementsByName('import-mode');
        let appendMode = false;
        for (const radio of importModeRadios) {
            if (radio.checked) {
                appendMode = radio.value === 'append';
                break;
            }
        }

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

            const result = CatalogManager.importProducts(data, appendMode);

            if (result.success) {
                AdminPage.showImportMessage(result.message, 'success');
                AdminPage.updateStats();
                AdminPage.updateProductCapacity();

                // Clear file input to allow immediate next import
                fileInput.value = '';
            } else {
                AdminPage.showImportMessage(result.error, 'error');
            }
        } catch (e) {
            AdminPage.showImportMessage(`Error importing products: ${e.message}`, 'error');
        }
    }

    /**
     * Clear all catalog data
     */
    static clearCatalog() {
        if (!confirm('Are you sure you want to clear all catalog data? This cannot be undone.')) {
            return;
        }

        const success = CatalogManager.clearAll();

        if (success) {
            AdminPage.showImportMessage('Catalog data cleared successfully', 'success');
            AdminPage.updateStats();
            AdminPage.updateProductCapacity();

            // Reload main navigation
            if (window.loadMainNavigation) {
                window.loadMainNavigation();
            }
        } else {
            AdminPage.showImportMessage('Error clearing catalog data', 'error');
        }
    }

    /**
     * Save settings
     */
    static saveSettings(event) {
        event.preventDefault();

        const siteName = getEl('setting-site-name').value;

        const success = Settings.save({
            siteName
        });

        const messageDiv = getEl('settings-message');

        if (success) {
            messageDiv.innerHTML = '<div class="message message-success fade-in">Settings saved successfully!</div>';

            // Update site name in header
            const siteNameEl = getEl('site-name');
            if (siteNameEl) {
                siteNameEl.textContent = siteName;
            }
        } else {
            messageDiv.innerHTML = '<div class="message message-error fade-in">Error saving settings</div>';
        }

        // Auto-remove message after 3 seconds
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }

    /**
     * Show import message
     */
    static showImportMessage(message, type) {
        const messagesDiv = getEl('import-messages');
        messagesDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messagesDiv.innerHTML = '';
        }, 5000);
    }

    /**
     * Update statistics display
     */
    static updateStats() {
        const stats = CatalogManager.getStats();

        const productsEl = getEl('stat-products');
        const categoriesEl = getEl('stat-categories');
        const rootCategoriesEl = getEl('stat-root-categories');

        if (productsEl) productsEl.textContent = stats.productCount;
        if (categoriesEl) categoriesEl.textContent = stats.categoryCount;
        if (rootCategoriesEl) rootCategoriesEl.textContent = stats.rootCategoryCount;
    }

    /**
     * Update product capacity indicator
     */
    static updateProductCapacity() {
        const stats = CatalogManager.getStats();
        const maxProducts = CatalogManager.MAX_PRODUCTS;
        const currentCount = stats.productCount;
        const percentage = Math.round((currentCount / maxProducts) * 100);
        const remaining = maxProducts - currentCount;

        // Update text elements
        const currentEl = getEl('capacity-current');
        const maxEl = getEl('capacity-max');
        const percentEl = getEl('capacity-percent');
        const remainingEl = getEl('capacity-remaining');

        if (currentEl) currentEl.textContent = currentCount;
        if (maxEl) maxEl.textContent = maxProducts;
        if (percentEl) percentEl.textContent = percentage;
        if (remainingEl) remainingEl.textContent = remaining;

        // Update color based on capacity
        const capacityDiv = getEl('product-capacity');
        if (capacityDiv) {
            let color;
            if (currentCount >= maxProducts) {
                // 100% - Red
                color = '#ef4444'; // red
            } else if (percentage >= 90) {
                // 90-99% - Orange
                color = '#f59e0b'; // orange
            } else {
                // 0-89% - Green
                color = '#10b981'; // green
            }

            // Apply color to the capacity indicator
            capacityDiv.style.borderLeft = `4px solid ${color}`;
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

        const trackingUrl = getEl('setting-tracking-url').value.trim();
        const adsServerUrl = getEl('setting-ads-url').value.trim();
        const customerId = getEl('setting-customer-id').value.trim();
        const pageIdsText = getEl('setting-page-ids').value.trim();
        const orderPrefix = getEl('setting-order-prefix').value.trim();

        // Validate page IDs JSON
        let pageIds;
        try {
            pageIds = JSON.parse(pageIdsText);
            if (typeof pageIds !== 'object' || Array.isArray(pageIds)) {
                AdminPage.showT2SMessage('Page IDs must be a JSON object', 'error');
                return;
            }
        } catch (e) {
            AdminPage.showT2SMessage('Invalid JSON format for Page IDs', 'error');
            return;
        }

        const success = Settings.save({
            trackingUrl,
            adsServerUrl,
            t2sCustomerId: customerId,
            t2sPageIds: pageIds,
            orderPrefix
        });

        if (success) {
            AdminPage.showT2SMessage('T2S settings saved successfully!', 'success');
        } else {
            AdminPage.showT2SMessage('Error saving T2S settings', 'error');
        }
    }

    /**
     * Generate new tID
     */
    static generateNewTID() {
        const newTID = Settings.generateNewTID();
        const tidInput = getEl('current-tid');
        if (tidInput) {
            tidInput.value = newTID;
        }
        AdminPage.showTIDMessage('New tID generated successfully!', 'success');
    }

    /**
     * Reset tID
     */
    static resetTID() {
        const newTID = Settings.resetTID();
        const tidInput = getEl('current-tid');
        if (tidInput) {
            tidInput.value = newTID;
        }
        AdminPage.showTIDMessage('tID reset successfully!', 'success');
    }

    /**
     * Save custom tID
     */
    static saveCustomTID() {
        const customTID = getEl('custom-tid').value.trim();

        if (!customTID) {
            AdminPage.showTIDMessage('Please enter a custom tID', 'error');
            return;
        }

        const success = Settings.saveTID(customTID);

        if (success) {
            const tidInput = getEl('current-tid');
            if (tidInput) {
                tidInput.value = customTID;
            }
            getEl('custom-tid').value = '';
            AdminPage.showTIDMessage('Custom tID saved successfully!', 'success');
        } else {
            AdminPage.showTIDMessage('Invalid UUID format. Must match pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'error');
        }
    }

    /**
     * Show T2S settings message
     */
    static showT2SMessage(message, type) {
        const messageDiv = getEl('t2s-settings-message');
        messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }

    /**
     * Show tID message
     */
    static showTIDMessage(message, type) {
        const messageDiv = getEl('tid-message');
        messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
}

// Add CSS for admin section
const adminStyles = `
    .admin-section {
        background: var(--bg-primary);
        padding: 24px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }
`;

// Inject styles if not already present
if (!document.getElementById('admin-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = adminStyles;
    document.head.appendChild(style);
}
export { AdminPage };
