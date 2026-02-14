// ===================================
// Catalog Manager - Handle products and categories
// ===================================

import { generateUUID } from './utils.js';

class CatalogManager {
    static STORAGE_KEY_PRODUCTS = 'ecommerce_products';
    static STORAGE_KEY_CATEGORIES = 'ecommerce_categories';
    static MAX_PRODUCTS = 3000;
    static #categoryIconCache = {}; // In-memory cache for category icons (private)

    // Synonyms mapping for category icon search fallback
    static CATEGORY_SYNONYMS = {
        'beauty': 'body care',
        'fashion': 'dress',
        'auto-moto': 'motorcycle',
        'hair': 'hair care'
    };

    /**
     * Load products from localStorage
     * @returns {Array} Array of products
     */
    static getProducts() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading products:', e);
            return [];
        }
    }

    /**
     * Load categories from localStorage
     * @returns {Array} Array of categories
     */
    static getCategories() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_CATEGORIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading categories:', e);
            return [];
        }
    }

    /**
     * Save products to localStorage
     * @param {Array} products - Array of products
     * @returns {boolean} Success status
     */
    static saveProducts(products) {
        try {
            if (products.length > this.MAX_PRODUCTS) {
                console.error(`Product limit exceeded. Cannot save ${products.length} products (max: ${this.MAX_PRODUCTS})`);
                return false;
            }
            localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
            return true;
        } catch (e) {
            console.error('Error saving products:', e);
            return false;
        }
    }

    /**
     * Save categories to localStorage
     * @param {Array} categories - Array of categories
     * @returns {boolean} Success status
     */
    static saveCategories(categories) {
        try {
            localStorage.setItem(this.STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
            return true;
        } catch (e) {
            console.error('Error saving categories:', e);
            return false;
        }
    }

    /**
     * Import products from JSON array
     * @param {Array} productsData - Raw products JSON array
     * @param {boolean} appendMode - If true, append to existing products; if false, replace all products
     * @returns {Object} Result with success status, count, and mode
     */
    static importProducts(productsData, appendMode = false) {
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

            let finalProducts;
            let addedCount = 0;

            if (appendMode) {
                // Append mode: merge with existing products, deduplicating by ID
                const existingProducts = this.getProducts();

                // Use Map for efficient deduplication
                const productsMap = new Map();

                // Add existing products to map
                existingProducts.forEach(product => {
                    productsMap.set(product.id, product);
                });

                // Add/update with new products (newer products overwrite)
                validProducts.forEach(product => {
                    const isNew = !productsMap.has(product.id);
                    productsMap.set(product.id, product);
                    if (isNew) {
                        addedCount++;
                    }
                });

                // Convert map back to array
                finalProducts = Array.from(productsMap.values());

                // Check if total would exceed limit
                if (finalProducts.length > this.MAX_PRODUCTS) {
                    const current = existingProducts.length;
                    const attempted = validProducts.length;
                    const wouldResult = finalProducts.length;
                    return {
                        success: false,
                        error: `Import would exceed maximum of ${this.MAX_PRODUCTS} products. Current: ${current}, Attempting to add: ${attempted}, Would result in: ${wouldResult}`
                    };
                }
            } else {
                // Replace mode: use only new products
                finalProducts = validProducts;
                addedCount = validProducts.length;
            }

            const success = this.saveProducts(finalProducts);

            // Clear icon cache after importing products
            CatalogManager.#categoryIconCache = {};

            const mode = appendMode ? 'append' : 'replace';
            let message;

            if (appendMode) {
                const duplicates = validProducts.length - addedCount;
                if (duplicates > 0) {
                    message = `Successfully appended products: ${addedCount} new products added, ${duplicates} duplicates updated. Total: ${finalProducts.length}`;
                } else {
                    message = `Successfully appended ${addedCount} products. Total: ${finalProducts.length}`;
                }
            } else {
                message = `Successfully replaced all products with ${validProducts.length} new products`;
            }

            return {
                success,
                count: validProducts.length,
                addedCount,
                mode,
                message
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Import categories from JSON array
     * @param {Array} categoriesData - Raw categories JSON array
     * @returns {Object} Result with success status and count
     */
    static importCategories(categoriesData) {
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

            // Clear icon cache after importing categories
            CatalogManager.#categoryIconCache = {};

            return {
                success,
                count: validCategories.length,
                message: `Successfully imported ${validCategories.length} categories`
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Get product by ID
     * @param {string} productId - Product ID
     * @returns {Object|null} Product object or null
     */
    static getProductById(productId) {
        const products = this.getProducts();
        return products.find(p => p.id === productId) || null;
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category object or null
     */
    static getCategoryById(categoryId) {
        const categories = this.getCategories();
        return categories.find(c => c.id === categoryId) || null;
    }

    /**
     * Get products by category ID
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of products
     */
    static getProductsByCategory(categoryId) {
        const products = this.getProducts();
        return products.filter(product => {
            const categories = product.content.categories || [];
            return categories.includes(categoryId);
        });
    }

    /**
     * Get child categories of a parent category
     * @param {string} parentId - Parent category ID
     * @returns {Array} Array of child categories
     */
    static getChildCategories(parentId) {
        const categories = this.getCategories();
        return categories.filter(cat => cat.content.parentId === parentId);
    }

    /**
     * Get root categories (parentId = "root")
     * @returns {Array} Array of root categories
     */
    static getRootCategories() {
        return this.getChildCategories('root');
    }

    /**
     * Search products by name
     * @param {string} query - Search query
     * @param {number} minLength - Minimum query length
     * @returns {Array} Array of matching products
     */
    static searchProducts(query, minLength = 3) {
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
    }

    /**
     * Get category breadcrumb path
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of category objects from root to current
     */
    static getCategoryPath(categoryId) {
        const path = [];
        let currentId = categoryId;

        while (currentId && currentId !== 'root') {
            const category = this.getCategoryById(currentId);
            if (!category) break;

            path.unshift(category);
            currentId = category.content.parentId;
        }

        return path;
    }

    /**
     * Get catalog statistics
     * @returns {Object} Statistics object
     */
    static getStats() {
        const products = this.getProducts();
        const categories = this.getCategories();

        return {
            productCount: products.length,
            categoryCount: categories.length,
            rootCategoryCount: this.getRootCategories().length
        };
    }

    /**
     * Clear all catalog data
     * @returns {boolean} Success status
     */
    static clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY_PRODUCTS);
            localStorage.removeItem(this.STORAGE_KEY_CATEGORIES);
            CatalogManager.#categoryIconCache = {};
            return true;
        } catch (e) {
            console.error('Error clearing catalog:', e);
            return false;
        }
    }

    /**
     * Clear the category icon cache
     * Useful for debugging and testing
     * @returns {boolean} Success status
     */
    static clearCategoryIconCache() {
        CatalogManager.#categoryIconCache = {};
        return true;
    }

    /**
     * Get product brand from characteristics
     * @param {Object} product - Product object
     * @returns {string|null} Brand name or null
     */
    static getProductBrand(product) {
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
    }

    /**
     * Get product price (considering promo)
     * @param {Object} product - Product object
     * @returns {Object} Price object with regular and promo prices
     */
    static getProductPrice(product) {
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

    /**
     * Get category icon image from a representative product
     * Searches for products matching the category name and returns the first product's image
     *
     * Algorithm:
     * 1. Split category name by space, comma, or dash to get words
     *    Example: "DVD, Blu-Ray" -> ["DVD", "Blu", "Ray"]
     *    Example: "Auto-Moto" -> ["Auto", "Moto"]
     * 2. For each word, check if there's a synonym first (priority)
     * 3. If synonym exists, search with synonym
     * 4. If no synonym or no results, search with original word
     * 5. If still no results, return placeholder image with category name
     *
     * @param {Object} category - Category object
     * @returns {string} Image URL of matching product or placeholder image
     */
    static getCategoryIconImage(category) {
        if (!category || !category.content || !category.content.name) {
            return 'https://placehold.co/250x250?text=Category';
        }

        // Check cache first
        const cacheKey = category.id;
        if (CatalogManager.#categoryIconCache[cacheKey]) {
            return CatalogManager.#categoryIconCache[cacheKey];
        }

        const categoryName = category.content.name;
        let imageUrl;

        // First, check if the full category name (lowercased) has a synonym
        const lowerCategoryName = categoryName.toLowerCase();
        const fullNameSynonym = this.CATEGORY_SYNONYMS[lowerCategoryName];
        if (fullNameSynonym) {
            const matchingProducts = this.searchProducts(fullNameSynonym, 1);
            if (matchingProducts.length > 0 && matchingProducts[0].content.imageUrl) {
                imageUrl = matchingProducts[0].content.imageUrl;
                CatalogManager.#categoryIconCache[cacheKey] = imageUrl;
                return imageUrl;
            }
        }

        // Split by space, comma, or dash and trim whitespace
        const words = categoryName.split(/[\s,\-]+/).map(w => w.trim()).filter(w => w);

        // Try each word, checking synonyms first
        for (const word of words) {
            if (!word) continue;

            const lowerWord = word.toLowerCase();

            // Try synonym first if it exists
            const synonym = this.CATEGORY_SYNONYMS[lowerWord];
            if (synonym) {
                const matchingProducts = this.searchProducts(synonym, 1);
                if (matchingProducts.length > 0 && matchingProducts[0].content.imageUrl) {
                    imageUrl = matchingProducts[0].content.imageUrl;
                    CatalogManager.#categoryIconCache[cacheKey] = imageUrl;
                    return imageUrl;
                }
            }

            // If no synonym or synonym didn't work, try original word
            const matchingProducts = this.searchProducts(word, 1);
            if (matchingProducts.length > 0 && matchingProducts[0].content.imageUrl) {
                imageUrl = matchingProducts[0].content.imageUrl;
                CatalogManager.#categoryIconCache[cacheKey] = imageUrl;
                return imageUrl;
            }
        }

        // Fallback to placeholder with category name
        const encodedName = encodeURIComponent(categoryName);
        imageUrl = `https://placehold.co/250x250?text=${encodedName}`;
        CatalogManager.#categoryIconCache[cacheKey] = imageUrl;
        return imageUrl;
    }
}

// Settings Manager for site configuration
class Settings {
    static #STORAGE_KEY = 'ecommerce_settings'; // Private

    // Minimal defaults - configure via Admin page for actual values
    static DEFAULT_SETTINGS = {
        siteName: 'E-Commerce Demo',
        trackingUrl: '',
        adsServerUrl: '',
        t2sCustomerId: '',
        t2sPageIds: {
            homepage: 1000,
            category: 1400,
            product: 1200,
            cart: 1600,
            search: 2000,
            postPayment: 2400,
            payment: 3200
        },
        orderPrefix: 'ORDER_'
    };

    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    static get() {
        try {
            const data = localStorage.getItem(Settings.#STORAGE_KEY);
            const stored = data ? JSON.parse(data) : {};
            return { ...Settings.DEFAULT_SETTINGS, ...stored };
        } catch (e) {
            console.error('Error loading settings:', e);
            return { ...Settings.DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    static save(settings) {
        try {
            const current = Settings.get();
            const updated = { ...current, ...settings };
            localStorage.setItem(Settings.#STORAGE_KEY, JSON.stringify(updated));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    }

    /**
     * Get a specific setting
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    static getSetting(key) {
        const settings = Settings.get();
        return settings[key];
    }

    /**
     * Get or create user tracking ID (tID)
     * @returns {string} User tID from localStorage or newly generated
     */
    static getTID() {
        try {
            let tid = localStorage.getItem('user_tid');
            if (!tid) {
                tid = generateUUID();
                localStorage.setItem('user_tid', tid);
            }
            return tid;
        } catch (e) {
            console.error('Error getting tID:', e);
            // Return a temporary UUID if localStorage fails
            return generateUUID();
        }
    }

    /**
     * Generate and save a new tracking ID
     * @returns {string} Newly generated tID
     */
    static generateNewTID() {
        try {
            const newTID = generateUUID();
            localStorage.setItem('user_tid', newTID);
            return newTID;
        } catch (e) {
            console.error('Error generating new tID:', e);
            return generateUUID();
        }
    }

    /**
     * Reset tID (alias for generateNewTID)
     * @returns {string} Newly generated tID
     */
    static resetTID() {
        return Settings.generateNewTID();
    }

    /**
     * Save a custom tID value
     * @param {string} customTID - Custom tID to save
     * @returns {boolean} Success status
     */
    static saveTID(customTID) {
        if (!customTID || typeof customTID !== 'string') {
            console.error('Invalid tID provided');
            return false;
        }

        // Basic UUID format validation (8-4-4-4-12 pattern)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(customTID)) {
            console.error('Invalid UUID format');
            return false;
        }

        try {
            localStorage.setItem('user_tid', customTID);
            return true;
        } catch (e) {
            console.error('Error saving custom tID:', e);
            return false;
        }
    }
}

// Export classes
export { CatalogManager, Settings };
