/**
 * API Module - Handles all data fetching and caching
 */

const API = (function() {
    // Cache for API responses
    const cache = {
        categories: null,
        products: null,
        productsById: {},
        productsByCategory: {}
    };

    // Base API URLs
    const API_BASE_URL = 'data';
    const PRODUCTS_CSV = `${API_BASE_URL}/catalog_products_en.csv`;
    const CATEGORIES_CSV = `${API_BASE_URL}/catalog_categories_en.csv`;

    /**
     * Parse CSV data into JSON
     * @param {string} csvText - CSV text content
     * @returns {Array} - Array of objects representing rows
     */
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(header => {
            // Clean up headers (remove quotes)
            return header.replace(/^"(.*)"$/, '$1');
        });
        
        console.log("CSV Headers:", headers);
        
        return lines.slice(1).filter(line => line.trim()).map((line, lineIndex) => {
            // Handle commas inside quoted values
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            // Parse the line character by character to handle quoted values
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            // Push the last value
            values.push(currentValue);
            
            // Create object from headers and values
            const obj = {};
            headers.forEach((header, i) => {
                // Clean up values (remove quotes, etc.)
                let value = values[i] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                
                // Handle empty parentCategoryId properly
                if (header === 'parentCategoryId' && (value === '' || value === '""' || !value)) {
                    value = null;
                }
                
                obj[header] = value;
            });
            
            // Add debugging for the first few rows
            if (lineIndex < 5) {
                console.log(`CSV Row ${lineIndex + 1}:`, obj);
            }
            
            return obj;
        });
    }

    /**
     * Fetch and parse CSV file
     * @param {string} url - URL of the CSV file
     * @returns {Promise<Array>} - Parsed JSON data
     */
    async function fetchCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            return parseCSV(text);
        } catch (error) {
            console.error('Error fetching CSV:', error);
            throw error;
        }
    }

    /**
     * Format product data
     * @param {Object} product - Raw product data
     * @returns {Object} - Formatted product data
     */
    function formatProduct(product) {
        // Generate a random price between $15 and $300
        const price = product.price ? parseFloat(product.price) : (Math.random() * 285 + 15).toFixed(2);
        
        return {
            id: product.id,
            name: product.name,
            description: product.description || `Description for ${product.name}`,
            categoryId: product.categoryId,
            price: price,
            rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Random rating between 3 and 5
            reviewsCount: Math.floor(Math.random() * 1000), // Random number of reviews
            brand: product.brand || '',
            ean: product.ean || '',
            upcCode: product.upcCode || '',
            category1Name: product.category1Name || '',
            category2Name: product.category2Name || '',
            category3Name: product.category3Name || '',
            imageUrl: product.mediaUrl || `https://via.placeholder.com/500?text=${encodeURIComponent(product.name)}`,
            isNew: Math.random() > 0.85, // 15% chance of being "new"
            isOnSale: Math.random() > 0.7 // 30% chance of being "on sale"
        };
    }

    /**
     * Format category data
     * @param {Object} category - Raw category data
     * @returns {Object} - Formatted category data
     */
    function formatCategory(category) {
        // Normalize the category ID by removing quotes if present
        const id = category.id ? category.id.replace(/^"(.*)"$/, '$1') : null;
        const parentCategoryId = category.parentCategoryId ? 
            category.parentCategoryId.replace(/^"(.*)"$/, '$1') : null;
        
        return {
            id: id,
            name: category.name || 'Unknown Category',
            description: category.description || '',
            parentCategoryId: parentCategoryId,
            imageUrl: category.imageUrl || `https://via.placeholder.com/500?text=${encodeURIComponent(category.name || 'Category')}`,
            productCount: 0 // Will be updated after fetching products
        };
    }

    /**
     * Get all categories
     * @returns {Promise<Array>} - Array of category objects
     */
    async function getCategories() {
        if (cache.categories) {
            return cache.categories;
        }

        try {
            const categoriesData = await fetchCSV(CATEGORIES_CSV).catch(() => []);
            cache.categories = categoriesData.map(formatCategory);
            
            // If we have already loaded products, update the product counts for categories
            if (cache.products) {
                updateCategoryProductCounts();
            }
            
            return cache.categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to empty array
            cache.categories = [];
            return cache.categories;
        }
    }
    
    /**
     * Get root categories (categories without a parent)
     * @returns {Promise<Array>} - Array of root category objects
     */
    async function getRootCategories() {
        const categories = await getCategories();
        
        // Root categories have null, undefined, or empty parentCategoryId
        const rootCats = categories.filter(category => 
            !category.parentCategoryId || 
            category.parentCategoryId === '' || 
            category.parentCategoryId === 'null'
        );
        
        console.log('Found root categories:', rootCats);
        
        if (rootCats.length === 0) {
            console.warn('No root categories found, this may indicate a data issue');
        }
        
        return rootCats;
    }

    /**
     * Get category by ID
     * @param {string} id - Category ID
     * @returns {Promise<Object|null>} - Category object or null if not found
     */
    async function getCategoryById(id) {
        if (!id) return null;
        
        // Remove quotes if they exist
        const cleanId = id.replace(/^"(.*)"$/, '$1');
        console.log(`Looking for category with clean ID: ${cleanId} (original: ${id})`);
        
        // If categories are already cached, return the matching one
        if (cache.categories) {
            // Try both with and without quotes
            const category = cache.categories.find(category => 
                category.id === cleanId || 
                category.id === `"${cleanId}"` || 
                `"${category.id}"` === cleanId
            );
            console.log(`Found category for ID ${cleanId}:`, category);
            return category || null;
        }
        
        // Load all categories if not already cached
        const categories = await getCategories();
        const category = categories.find(category => 
            category.id === cleanId || 
            category.id === `"${cleanId}"` || 
            `"${category.id}"` === cleanId
        );
        console.log(`Found category for ID ${cleanId}:`, category);
        return category || null;
    }

    /**
     * Get all products
     * @returns {Promise<Array>} - Array of product objects
     */
    async function getProducts() {
        if (cache.products) {
            return cache.products;
        }

        try {
            const productsData = await fetchCSV(PRODUCTS_CSV);
            cache.products = productsData.map(formatProduct);
            
            // Build lookup maps
            cache.products.forEach(product => {
                cache.productsById[product.id] = product;
                
                if (!cache.productsByCategory[product.categoryId]) {
                    cache.productsByCategory[product.categoryId] = [];
                }
                cache.productsByCategory[product.categoryId].push(product);
            });
            
            // If we have already loaded categories, update the product counts
            if (cache.categories) {
                updateCategoryProductCounts();
            }
            
            return cache.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            // Fallback to empty array
            cache.products = [];
            return cache.products;
        }
    }

    /**
     * Update the product count for each category
     */
    function updateCategoryProductCounts() {
        if (!cache.categories || !cache.products) return;
        
        // Reset all counts
        cache.categories.forEach(category => {
            category.productCount = cache.productsByCategory[category.id]?.length || 0;
        });
    }

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Promise<Object>} - Product object
     */
    async function getProductById(id) {
        if (cache.productsById[id]) {
            return cache.productsById[id];
        }
        
        // Load all products if not already cached
        await getProducts();
        return cache.productsById[id] || null;
    }

    /**
     * Get products by category ID
     * @param {string} categoryId - Category ID
     * @returns {Promise<Array>} - Array of product objects in that category
     */
    async function getProductsByCategory(categoryId) {
        if (!categoryId) return [];
        
        // Normalize category ID (remove quotes if present)
        const cleanCategoryId = categoryId.replace(/^"(.*)"$/, '$1');
        console.log(`Looking for products with category ID: ${cleanCategoryId}`);
        
        if (cache.productsByCategory[cleanCategoryId]) {
            return cache.productsByCategory[cleanCategoryId];
        }
        
        // Load all products if not already cached
        await getProducts();
        
        // Try with both clean and original ID
        return cache.productsByCategory[cleanCategoryId] || 
               cache.productsByCategory[categoryId] || 
               [];
    }

    /**
     * Search products
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Array of matching product objects
     */
    async function searchProducts(query) {
        if (!query || query.trim() === '') {
            return [];
        }
        
        const searchTerm = query.toLowerCase();
        
        // Load all products if not already cached
        const products = await getProducts();
        
        return products.filter(product => {
            return (
                product.name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
                (product.category1Name && product.category1Name.toLowerCase().includes(searchTerm)) ||
                (product.category2Name && product.category2Name.toLowerCase().includes(searchTerm)) ||
                (product.category3Name && product.category3Name.toLowerCase().includes(searchTerm))
            );
        });
    }

    /**
     * Get sponsored products (random selection)
     * @param {number} count - Number of sponsored products to return
     * @param {string} [categoryId] - Optional category to pull products from
     * @returns {Promise<Array>} - Array of random product objects
     */
    async function getSponsoredProducts(count = 4, categoryId = null) {
        // Load all products if not already cached
        let products = await getProducts();
        
        // If categoryId is provided, filter by it
        if (categoryId) {
            products = await getProductsByCategory(categoryId);
        }
        
        // Return random selection
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Clear the cache (useful for testing or forcing fresh data)
     */
    function clearCache() {
        cache.categories = null;
        cache.products = null;
        cache.productsById = {};
        cache.productsByCategory = {};
    }

    return {
        getCategories,
        getRootCategories,
        getCategoryById,
        getProducts,
        getProductById,
        getProductsByCategory,
        searchProducts,
        getSponsoredProducts,
        clearCache
    };
})(); 