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
                                <label class="form-label">T2S Tracking URL</label>
                                <input
                                    type="text"
                                    id="setting-tracking-url"
                                    class="form-input"
                                    value="${escapeHtml(settings.trackingUrl)}"
                                    placeholder="Not used for now"
                                />
                                <small style="color: var(--text-secondary); font-size: 12px;">
                                    Currently using console.log for tracking
                                </small>
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
