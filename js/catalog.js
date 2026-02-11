// ===================================
// Catalog Manager - Handle products and categories
// ===================================

const CatalogManager = {
    STORAGE_KEY_PRODUCTS: 'ecommerce_products',
    STORAGE_KEY_CATEGORIES: 'ecommerce_categories',
    MAX_PRODUCTS: 1000,

    /**
     * Load products from localStorage
     * @returns {Array} Array of products
     */
    getProducts() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading products:', e);
            return [];
        }
    },

    /**
     * Load categories from localStorage
     * @returns {Array} Array of categories
     */
    getCategories() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_CATEGORIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading categories:', e);
            return [];
        }
    },

    /**
     * Save products to localStorage
     * @param {Array} products - Array of products
     * @returns {boolean} Success status
     */
    saveProducts(products) {
        try {
            if (products.length > this.MAX_PRODUCTS) {
                console.warn(`Product limit exceeded. Trimming to ${this.MAX_PRODUCTS}`);
                products = products.slice(0, this.MAX_PRODUCTS);
            }
            localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
            return true;
        } catch (e) {
            console.error('Error saving products:', e);
            return false;
        }
    },

    /**
     * Save categories to localStorage
     * @param {Array} categories - Array of categories
     * @returns {boolean} Success status
     */
    saveCategories(categories) {
        try {
            localStorage.setItem(this.STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
            return true;
        } catch (e) {
            console.error('Error saving categories:', e);
            return false;
        }
    },

    /**
     * Import products from JSON array
     * @param {Array} productsData - Raw products JSON array
     * @returns {Object} Result with success status and count
     */
    importProducts(productsData) {
        try {
            if (!Array.isArray(productsData)) {
                return { success: false, error: 'Invalid data format. Expected array.' };
            }

            // Validate and process products
            const validProducts = productsData.filter(item => {
                return item && item.type === 'product' && item.id && item.content;
            });

            if (validProducts.length === 0) {
                return { success: false, error: 'No valid products found in data.' };
            }

            const success = this.saveProducts(validProducts);

            return {
                success,
                count: validProducts.length,
                message: `Successfully imported ${validProducts.length} products`
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Import categories from JSON array
     * @param {Array} categoriesData - Raw categories JSON array
     * @returns {Object} Result with success status and count
     */
    importCategories(categoriesData) {
        try {
            if (!Array.isArray(categoriesData)) {
                return { success: false, error: 'Invalid data format. Expected array.' };
            }

            // Validate and process categories
            const validCategories = categoriesData.filter(item => {
                return item && item.type === 'category' && item.id && item.content;
            });

            if (validCategories.length === 0) {
                return { success: false, error: 'No valid categories found in data.' };
            }

            const success = this.saveCategories(validCategories);

            return {
                success,
                count: validCategories.length,
                message: `Successfully imported ${validCategories.length} categories`
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Get product by ID
     * @param {string} productId - Product ID
     * @returns {Object|null} Product object or null
     */
    getProductById(productId) {
        const products = this.getProducts();
        return products.find(p => p.id === productId) || null;
    },

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category object or null
     */
    getCategoryById(categoryId) {
        const categories = this.getCategories();
        return categories.find(c => c.id === categoryId) || null;
    },

    /**
     * Get products by category ID
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of products
     */
    getProductsByCategory(categoryId) {
        const products = this.getProducts();
        return products.filter(product => {
            const categories = product.content.categories || [];
            return categories.includes(categoryId);
        });
    },

    /**
     * Get child categories of a parent category
     * @param {string} parentId - Parent category ID
     * @returns {Array} Array of child categories
     */
    getChildCategories(parentId) {
        const categories = this.getCategories();
        return categories.filter(cat => cat.content.parentId === parentId);
    },

    /**
     * Get root categories (parentId = "root")
     * @returns {Array} Array of root categories
     */
    getRootCategories() {
        return this.getChildCategories('root');
    },

    /**
     * Search products by name
     * @param {string} query - Search query
     * @param {number} minLength - Minimum query length
     * @returns {Array} Array of matching products
     */
    searchProducts(query, minLength = 3) {
        if (!query || query.length < minLength) {
            return [];
        }

        const products = this.getProducts();
        const lowerQuery = query.toLowerCase();

        return products.filter(product => {
            const name = (product.content.name || '').toLowerCase();
            const description = (product.content.shortDescription || '').toLowerCase();
            return name.includes(lowerQuery) || description.includes(lowerQuery);
        });
    },

    /**
     * Get category breadcrumb path
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of category objects from root to current
     */
    getCategoryPath(categoryId) {
        const path = [];
        let currentId = categoryId;

        while (currentId && currentId !== 'root') {
            const category = this.getCategoryById(currentId);
            if (!category) break;

            path.unshift(category);
            currentId = category.content.parentId;
        }

        return path;
    },

    /**
     * Get catalog statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const products = this.getProducts();
        const categories = this.getCategories();

        return {
            productCount: products.length,
            categoryCount: categories.length,
            rootCategoryCount: this.getRootCategories().length
        };
    },

    /**
     * Clear all catalog data
     * @returns {boolean} Success status
     */
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY_PRODUCTS);
            localStorage.removeItem(this.STORAGE_KEY_CATEGORIES);
            return true;
        } catch (e) {
            console.error('Error clearing catalog:', e);
            return false;
        }
    },

    /**
     * Get product brand from characteristics
     * @param {Object} product - Product object
     * @returns {string|null} Brand name or null
     */
    getProductBrand(product) {
        if (!product || !product.content || !product.content.characteristics) {
            return null;
        }

        const brandChar = product.content.characteristics.find(
            char => char.id === 'INSIGHT_BRAND' || char.name === 'INSIGHT_BRAND'
        );

        if (brandChar && brandChar.values && brandChar.values.length > 0) {
            return brandChar.values[0].value || brandChar.values[0].id;
        }

        return null;
    },

    /**
     * Get product price (considering promo)
     * @param {Object} product - Product object
     * @returns {Object} Price object with regular and promo prices
     */
    getProductPrice(product) {
        if (!product || !product.content) {
            return { regular: null, promo: null };
        }

        const regular = product.content.regularPrice;
        const promo = product.content.promoPrice;

        return {
            regular: regular ? parseFloat(regular) : null,
            promo: promo ? parseFloat(promo) : null,
            hasPromo: promo !== null && promo !== undefined
        };
    }
};

// Settings Manager for site configuration
const Settings = {
    STORAGE_KEY: 'ecommerce_settings',

    DEFAULT_SETTINGS: {
        siteName: 'E-Commerce Demo',
        trackingUrl: '',
        adsServerUrl: ''
    },

    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    get() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const stored = data ? JSON.parse(data) : {};
            return { ...this.DEFAULT_SETTINGS, ...stored };
        } catch (e) {
            console.error('Error loading settings:', e);
            return { ...this.DEFAULT_SETTINGS };
        }
    },

    /**
     * Save settings
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    save(settings) {
        try {
            const current = this.get();
            const updated = { ...current, ...settings };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    /**
     * Get a specific setting
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    getSetting(key) {
        const settings = this.get();
        return settings[key];
    }
};
