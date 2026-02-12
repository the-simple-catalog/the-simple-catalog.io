// ===================================
// Admin Page - Catalog import and settings
// ===================================

const AdminPage = {
    /**
     * Render admin page
     */
    render() {
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

                        <div class="form-group">
                            <label class="form-label">Products JSON File</label>
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

                            <div class="form-group">
                                <label class="form-label">Ads Server URL</label>
                                <input
                                    type="text"
                                    id="setting-ads-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.adsServerUrl)}"
                                    placeholder="Not used for now"
                                />
                                <small style="color: var(--text-secondary); font-size: 12px;">
                                    Currently using console.log for ad serving
                                </small>
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
    },

    /**
     * Import categories from file
     */
    async importCategories() {
        const fileInput = getEl('categories-file');
        const messagesDiv = getEl('import-messages');

        if (!fileInput.files || fileInput.files.length === 0) {
            this.showImportMessage('Please select a categories JSON file', 'error');
            return;
        }

        try {
            const file = fileInput.files[0];
            const content = await this.readFileAsText(file);
            const data = JSON.parse(content);

            const result = CatalogManager.importCategories(data);

            if (result.success) {
                this.showImportMessage(result.message, 'success');
                this.updateStats();

                // Reload main navigation to show new categories
                if (window.loadMainNavigation) {
                    window.loadMainNavigation();
                }
            } else {
                this.showImportMessage(result.error, 'error');
            }
        } catch (e) {
            this.showImportMessage(`Error importing categories: ${e.message}`, 'error');
        }
    },

    /**
     * Import products from file
     */
    async importProducts() {
        const fileInput = getEl('products-file');

        if (!fileInput.files || fileInput.files.length === 0) {
            this.showImportMessage('Please select a products JSON file', 'error');
            return;
        }

        try {
            const file = fileInput.files[0];
            const content = await this.readFileAsText(file);
            const data = JSON.parse(content);

            const result = CatalogManager.importProducts(data);

            if (result.success) {
                this.showImportMessage(result.message, 'success');
                this.updateStats();
            } else {
                this.showImportMessage(result.error, 'error');
            }
        } catch (e) {
            this.showImportMessage(`Error importing products: ${e.message}`, 'error');
        }
    },

    /**
     * Clear all catalog data
     */
    clearCatalog() {
        if (!confirm('Are you sure you want to clear all catalog data? This cannot be undone.')) {
            return;
        }

        const success = CatalogManager.clearAll();

        if (success) {
            this.showImportMessage('Catalog data cleared successfully', 'success');
            this.updateStats();

            // Reload main navigation
            if (window.loadMainNavigation) {
                window.loadMainNavigation();
            }
        } else {
            this.showImportMessage('Error clearing catalog data', 'error');
        }
    },

    /**
     * Save settings
     */
    saveSettings(event) {
        event.preventDefault();

        const siteName = getEl('setting-site-name').value;
        const trackingUrl = getEl('setting-tracking-url').value;
        const adsServerUrl = getEl('setting-ads-url').value;

        const success = Settings.save({
            siteName,
            trackingUrl,
            adsServerUrl
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
    },

    /**
     * Show import message
     */
    showImportMessage(message, type) {
        const messagesDiv = getEl('import-messages');
        messagesDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messagesDiv.innerHTML = '';
        }, 5000);
    },

    /**
     * Update statistics display
     */
    updateStats() {
        const stats = CatalogManager.getStats();

        const productsEl = getEl('stat-products');
        const categoriesEl = getEl('stat-categories');
        const rootCategoriesEl = getEl('stat-root-categories');

        if (productsEl) productsEl.textContent = stats.productCount;
        if (categoriesEl) categoriesEl.textContent = stats.categoryCount;
        if (rootCategoriesEl) rootCategoriesEl.textContent = stats.rootCategoryCount;
    },

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * Save T2S settings
     */
    saveT2SSettings(event) {
        event.preventDefault();

        const trackingUrl = getEl('setting-tracking-url').value.trim();
        const customerId = getEl('setting-customer-id').value.trim();
        const pageIdsText = getEl('setting-page-ids').value.trim();
        const orderPrefix = getEl('setting-order-prefix').value.trim();

        // Validate page IDs JSON
        let pageIds;
        try {
            pageIds = JSON.parse(pageIdsText);
            if (typeof pageIds !== 'object' || Array.isArray(pageIds)) {
                this.showT2SMessage('Page IDs must be a JSON object', 'error');
                return;
            }
        } catch (e) {
            this.showT2SMessage('Invalid JSON format for Page IDs', 'error');
            return;
        }

        const success = Settings.save({
            trackingUrl,
            t2sCustomerId: customerId,
            t2sPageIds: pageIds,
            orderPrefix
        });

        if (success) {
            this.showT2SMessage('T2S settings saved successfully!', 'success');
        } else {
            this.showT2SMessage('Error saving T2S settings', 'error');
        }
    },

    /**
     * Generate new tID
     */
    generateNewTID() {
        const newTID = Settings.generateNewTID();
        const tidInput = getEl('current-tid');
        if (tidInput) {
            tidInput.value = newTID;
        }
        this.showTIDMessage('New tID generated successfully!', 'success');
    },

    /**
     * Reset tID
     */
    resetTID() {
        const newTID = Settings.resetTID();
        const tidInput = getEl('current-tid');
        if (tidInput) {
            tidInput.value = newTID;
        }
        this.showTIDMessage('tID reset successfully!', 'success');
    },

    /**
     * Save custom tID
     */
    saveCustomTID() {
        const customTID = getEl('custom-tid').value.trim();

        if (!customTID) {
            this.showTIDMessage('Please enter a custom tID', 'error');
            return;
        }

        const success = Settings.saveTID(customTID);

        if (success) {
            const tidInput = getEl('current-tid');
            if (tidInput) {
                tidInput.value = customTID;
            }
            getEl('custom-tid').value = '';
            this.showTIDMessage('Custom tID saved successfully!', 'success');
        } else {
            this.showTIDMessage('Invalid UUID format. Must match pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'error');
        }
    },

    /**
     * Show T2S settings message
     */
    showT2SMessage(message, type) {
        const messageDiv = getEl('t2s-settings-message');
        messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    },

    /**
     * Show tID message
     */
    showTIDMessage(message, type) {
        const messageDiv = getEl('tid-message');
        messageDiv.innerHTML = `<div class="message message-${type} fade-in">${escapeHtml(message)}</div>`;

        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
};

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
