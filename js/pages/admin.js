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
        const messagesDivId = 'categories-messages';

        if (!fileInput.files || fileInput.files.length === 0) {
            AdminPage.showImportMessage('Please select a categories JSON file', 'error', messagesDivId);
            return;
        }

        try {
            const file = fileInput.files[0];
            const content = await AdminPage.readFileAsText(file);
            const data = JSON.parse(content);

            // Show progress bar
            AdminPage.showProgressBar(data.length, 'categories', messagesDivId);

            // Add slight delay to show animation (import is instant otherwise)
            await new Promise(resolve => setTimeout(resolve, 1600));

            const result = CatalogManager.importCategories(data);

            if (result.success) {
                AdminPage.showSuccessBanner(result, 'categories', messagesDivId);
                AdminPage.updateStats();

                // Reload main navigation to show new categories
                if (window.populateCategoriesDropdown) {
                    window.populateCategoriesDropdown();
                }
            } else {
                AdminPage.hideProgressBar(messagesDivId);
                AdminPage.showImportMessage(result.error, 'error', messagesDivId);
            }
        } catch (e) {
            AdminPage.hideProgressBar(messagesDivId);
            AdminPage.showImportMessage(`Error importing categories: ${e.message}`, 'error', messagesDivId);
        }
    }

    /**
     * Import products from file
     */
    static async importProducts() {
        const fileInput = getEl('products-file');
        const messagesDivId = 'products-messages';

        if (!fileInput.files || fileInput.files.length === 0) {
            AdminPage.showImportMessage('Please select a products JSON file', 'error', messagesDivId);
            return;
        }

        // Get selected import mode
        const checkedRadio = document.querySelector('input[name="import-mode"]:checked');
        const appendMode = checkedRadio?.value === 'append';

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
            AdminPage.showProgressBar(data.length, 'products', messagesDivId);

            // Add slight delay to show animation (import is instant otherwise)
            await new Promise(resolve => setTimeout(resolve, 1600));

            const result = CatalogManager.importProducts(data, appendMode);

            if (result.success) {
                AdminPage.showSuccessBanner(result, 'products', messagesDivId);
                AdminPage.updateStats();
                AdminPage.updateProductCapacity();

                // Clear file input to allow immediate next import
                fileInput.value = '';
            } else {
                AdminPage.hideProgressBar(messagesDivId);
                AdminPage.showImportMessage(result.error, 'error', messagesDivId);
            }
        } catch (e) {
            AdminPage.hideProgressBar(messagesDivId);
            AdminPage.showImportMessage(`Error importing products: ${e.message}`, 'error', messagesDivId);
        }
    }

    /**
     * Clear all catalog data
     */
    static clearCatalog() {
        if (!confirm('Are you sure you want to clear all catalog data? This cannot be undone.')) {
            return;
        }

        const messagesDivId = 'products-messages';
        const success = CatalogManager.clearAll();

        if (success) {
            AdminPage.showImportMessage('Catalog data cleared successfully', 'success', messagesDivId);
            AdminPage.updateStats();
            AdminPage.updateProductCapacity();

            // Reload main navigation
            if (window.loadMainNavigation) {
                window.loadMainNavigation();
            }
        } else {
            AdminPage.showImportMessage('Error clearing catalog data', 'error', messagesDivId);
        }
    }

    /**
     * Save settings
     */
    static saveSettings(event) {
        event.preventDefault();

        const siteName = getEl('setting-site-name').value;

        const success = Settings.save({ siteName });

        if (success) {
            // Update site name in header
            const siteNameEl = getEl('site-name');
            if (siteNameEl) {
                siteNameEl.textContent = siteName;
            }
            AdminPage.showTemporaryMessage('settings-message', 'Settings saved successfully!', 'success');
        } else {
            AdminPage.showTemporaryMessage('settings-message', 'Error saving settings', 'error');
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
        const fill = messagesDiv.querySelector('.progress-bar-fill');
        const progressText = messagesDiv.querySelector('.progress-text');
        const progressStatus = messagesDiv.querySelector('.progress-status');

        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            // Stop if elements were removed (e.g. error teardown)
            if (!fill.isConnected) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);

            // Smooth easing function (ease-out-cubic)
            const eased = 1 - Math.pow(1 - (progress / 100), 3);
            fill.style.width = `${eased * 100}%`;

            // Update text at milestones
            if (progress > 30 && progress < 35) {
                progressStatus.textContent = 'Validating data...';
            } else if (progress > 60 && progress < 65) {
                progressStatus.textContent = `Importing ${itemCount.toLocaleString()} items...`;
            } else if (progress > 90) {
                progressStatus.textContent = 'Finalizing...';
                progressText.textContent = 'Almost done!';
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
            progressEl.style.opacity = '0';
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
        let itemsIcon = '📦';

        if (type === 'products') {
            if (result.mode === 'append') {
                itemsText = `Added ${result.addedCount.toLocaleString()} new products`;
                itemsIcon = '➕';
            } else {
                itemsText = `Imported ${result.count.toLocaleString()} products`;
            }
        } else {
            itemsText = `Imported ${result.count.toLocaleString()} categories`;
            itemsIcon = '📂';
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
            AdminPage.animateNumber('banner-products', stats.productCount, 800);
            AdminPage.animateNumber('banner-categories', stats.categoryCount, 800);
        }, 400);

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            const banner = messagesDiv.querySelector('.import-success-banner');
            if (banner) {
                banner.style.opacity = '0';
                banner.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    messagesDiv.innerHTML = '';
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
     * Update product capacity indicator (smart display - only shows when >= 90%)
     */
    static updateProductCapacity() {
        const stats = CatalogManager.getStats();
        const maxProducts = CatalogManager.MAX_PRODUCTS;
        const currentCount = stats.productCount;
        const percentage = Math.round((currentCount / maxProducts) * 100);

        const capacityDiv = getEl('product-capacity');
        if (!capacityDiv) return;

        // Only show if >= 90% or at limit
        if (percentage < 90) {
            capacityDiv.style.display = 'none';
            return;
        }

        capacityDiv.style.display = 'block';

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
            capacityDiv.style.borderLeft = '4px solid #dc2626';
            capacityDiv.style.background = '#fef2f2';
            capacityDiv.classList.add('capacity-alert-pulse');
            capacityDiv.classList.remove('capacity-warning-pulse');
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
            capacityDiv.style.borderLeft = '4px solid #f97316';
            capacityDiv.style.background = '#fff7ed';
            capacityDiv.classList.add('capacity-warning-pulse');
            capacityDiv.classList.remove('capacity-alert-pulse');
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
                AdminPage.showTemporaryMessage('t2s-settings-message', 'Page IDs must be a JSON object', 'error');
                return;
            }
        } catch (e) {
            AdminPage.showTemporaryMessage('t2s-settings-message', 'Invalid JSON format for Page IDs', 'error');
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
            AdminPage.showTemporaryMessage('t2s-settings-message', 'T2S settings saved successfully!', 'success');
        } else {
            AdminPage.showTemporaryMessage('t2s-settings-message', 'Error saving T2S settings', 'error');
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
        AdminPage.showTemporaryMessage('tid-message', 'New tID generated successfully!', 'success');
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
        AdminPage.showTemporaryMessage('tid-message', 'tID reset successfully!', 'success');
    }

    /**
     * Save custom tID
     */
    static saveCustomTID() {
        const customTID = getEl('custom-tid').value.trim();

        if (!customTID) {
            AdminPage.showTemporaryMessage('tid-message', 'Please enter a custom tID', 'error');
            return;
        }

        const success = Settings.saveTID(customTID);

        if (success) {
            const tidInput = getEl('current-tid');
            if (tidInput) {
                tidInput.value = customTID;
            }
            getEl('custom-tid').value = '';
            AdminPage.showTemporaryMessage('tid-message', 'Custom tID saved successfully!', 'success');
        } else {
            AdminPage.showTemporaryMessage('tid-message', 'Invalid UUID format. Must match pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'error');
        }
    }

    /**
     * Show a temporary message in the given container, auto-dismissed after 3 seconds
     */
    static showTemporaryMessage(elementId, message, type) {
        const messageDiv = getEl(elementId);
        if (!messageDiv) return;

        messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
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
if (!document.getElementById('admin-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = adminStyles;
    document.head.appendChild(style);
}
export { AdminPage };
