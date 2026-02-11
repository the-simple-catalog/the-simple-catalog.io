// ===================================
// Homepage - Display root categories
// ===================================

const HomePage = {
    /**
     * Render homepage
     */
    render() {
        // Track page view
        Tracking.trackPageView(PAGE_IDS.HOMEPAGE, PAGE_TYPES.HOMEPAGE);

        const app = getEl('app');
        const rootCategories = CatalogManager.getRootCategories();

        if (rootCategories.length === 0) {
            app.innerHTML = `
                <div class="container fade-in">
                    <div class="page-header">
                        <h1 class="page-title">Welcome to ${escapeHtml(Settings.getSetting('siteName'))}</h1>
                    </div>

                    <div class="message message-info">
                        <p><strong>No catalog data loaded yet.</strong></p>
                        <p>Please go to the <a href="#/admin" style="text-decoration: underline;">Admin page</a> to import your categories and products.</p>
                    </div>

                    <a href="#/admin" class="btn btn-primary" style="margin-top: 16px;">
                        Go to Admin
                    </a>
                </div>
            `;
            return;
        }

        // Render homepage with categories
        app.innerHTML = `
            <div class="container fade-in">
                <div class="page-header">
                    <h1 class="page-title">Welcome to ${escapeHtml(Settings.getSetting('siteName'))}</h1>
                    <p style="color: var(--text-secondary); margin-top: 8px;">
                        Browse our categories and discover great products
                    </p>
                </div>

                <div class="category-list">
                    ${rootCategories.map(category => HomePage.renderCategoryCard(category)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single category card
     */
    renderCategoryCard(category) {
        return `
            <a href="#/category/${category.id}" class="category-card">
                <div class="category-name">${escapeHtml(category.content.name)}</div>
            </a>
        `;
    }
};
