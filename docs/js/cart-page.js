/**
 * Cart Page JavaScript
 * Handles functionality specific to the cart page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Page identifier for tracking
  const PAGE_ID = 'cart';
  
  // Initialize categories menu
  initCategories();
  
  // Display cart contents
  displayCart();
  
  // Load sponsored products (recommended for cart)
  loadSponsoredProducts();
  
  /**
   * Initialize categories in the navigation menu
   */
  function initCategories() {
    const categoriesMenu = document.getElementById('categories-menu');
    if (!categoriesMenu) return;
    
    // Show loading indicator
    Utils.showLoading(categoriesMenu);
    
    // Fetch categories
    API.getCategories()
      .then(categories => {
        // Load categories into menu
        Utils.loadCategoriesMenu(categories);
        
        // Hide loading indicator
        Utils.showLoading(categoriesMenu, false);
      })
      .catch(error => {
        console.error('Error loading categories:', error);
        Utils.showLoading(categoriesMenu, false);
        Utils.showError(categoriesMenu, 'Failed to load categories. Please try again later.');
      });
  }
  
  /**
   * Display cart contents
   */
  function displayCart() {
    // Get cart items
    const cartItems = Cart.getItems();
    
    // Get containers
    const emptyCartContainer = document.getElementById('cart-empty');
    const cartContentsContainer = document.getElementById('cart-contents');
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (!emptyCartContainer || !cartContentsContainer || !cartItemsContainer) {
      return;
    }
    
    // Clear items list
    cartItemsContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
      // Show empty cart message
      emptyCartContainer.classList.remove('hidden');
      cartContentsContainer.classList.add('hidden');
    } else {
      // Show cart items
      emptyCartContainer.classList.add('hidden');
      cartContentsContainer.classList.remove('hidden');
      
      // Create and add each cart item
      cartItems.forEach(item => {
        const row = createCartItemRow(item);
        cartItemsContainer.appendChild(row);
      });
      
      // Update cart totals
      updateCartTotals();
    }
  }
  
  /**
   * Create a cart item row
   * @param {Object} item - Cart item
   * @returns {HTMLElement} - Cart item row element
   */
  function createCartItemRow(item) {
    const row = document.createElement('tr');
    row.dataset.productId = item.id;
    
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const itemImage = item.imageUrl || 'https://via.placeholder.com/80';
    
    row.innerHTML = `
      <td data-label="Product">
        <div class="cart-product">
          <div class="cart-product-image">
            <img src="${itemImage}" alt="${item.name}">
          </div>
          <div class="cart-product-info">
            <a href="product.html?id=${item.id}" class="cart-product-title">${item.name}</a>
          </div>
        </div>
      </td>
      <td data-label="Price">${Utils.formatPrice(item.price)}</td>
      <td data-label="Quantity">
        <div class="cart-quantity">
          <input type="number" value="${item.quantity}" min="1" class="item-quantity" data-product-id="${item.id}">
        </div>
      </td>
      <td data-label="Total">${Utils.formatPrice(itemTotal)}</td>
      <td data-label="Actions">
        <button class="cart-remove" data-product-id="${item.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    
    // Setup event listeners
    setupCartItemEventListeners(row);
    
    return row;
  }
  
  /**
   * Setup event listeners for cart item row
   * @param {HTMLElement} row - Cart item row element
   */
  function setupCartItemEventListeners(row) {
    // Quantity input change
    const quantityInput = row.querySelector('.item-quantity');
    if (quantityInput) {
      quantityInput.addEventListener('change', function() {
        const productId = this.dataset.productId;
        const quantity = parseInt(this.value, 10);
        
        if (isNaN(quantity) || quantity <= 0) {
          this.value = 1;
          Cart.updateItemQuantity(productId, 1);
        } else {
          Cart.updateItemQuantity(productId, quantity);
        }
        
        // Update cart display
        displayCart();
      });
    }
    
    // Remove button click
    const removeButton = row.querySelector('.cart-remove');
    if (removeButton) {
      removeButton.addEventListener('click', function() {
        const productId = this.dataset.productId;
        Cart.removeItem(productId);
        
        // Update cart display
        displayCart();
      });
    }
  }
  
  /**
   * Update cart totals in the summary section
   */
  function updateCartTotals() {
    const totals = Cart.calculateTotals();
    
    // Update subtotal
    const subtotalElement = document.getElementById('cart-subtotal');
    if (subtotalElement) {
      subtotalElement.textContent = Utils.formatPrice(totals.subtotal);
    }
    
    // Update shipping
    const shippingElement = document.getElementById('cart-shipping');
    if (shippingElement) {
      shippingElement.textContent = Utils.formatPrice(totals.shipping);
    }
    
    // Update total
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      totalElement.textContent = Utils.formatPrice(totals.total);
    }
  }
  
  /**
   * Load sponsored products (recommended for cart)
   */
  function loadSponsoredProducts() {
    const sponsoredProductsGrid = document.getElementById('sponsored-products-grid');
    if (!sponsoredProductsGrid) return;
    
    // Show loading indicator
    Utils.showLoading(sponsoredProductsGrid);
    
    // Fetch sponsored products
    API.getSponsoredProducts(PAGE_ID, 4)
      .then(products => {
        if (products && products.length > 0) {
          // Clear container
          sponsoredProductsGrid.innerHTML = '';
          
          // Add each product
          products.forEach(product => {
            sponsoredProductsGrid.appendChild(Utils.createProductCard(product));
          });
          
          // Track sponsored views
          Tracking.trackSponsoredView(products, PAGE_ID);
        } else {
          sponsoredProductsGrid.innerHTML = '<p class="no-products">No recommended products available.</p>';
        }
        
        // Hide loading indicator
        Utils.showLoading(sponsoredProductsGrid, false);
      })
      .catch(error => {
        console.error('Error loading sponsored products:', error);
        Utils.showLoading(sponsoredProductsGrid, false);
        Utils.showError(sponsoredProductsGrid, 'Failed to load recommended products. Please try again later.');
      });
  }
}); 