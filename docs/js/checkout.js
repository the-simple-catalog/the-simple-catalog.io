/**
 * Checkout Page JavaScript
 * Handles functionality specific to the checkout page
 */

document.addEventListener('DOMContentLoaded', function() {
  // Page identifier for tracking
  const PAGE_ID = 'checkout';
  
  // Initialize categories menu
  initCategories();
  
  // Display order summary
  displayOrderSummary();
  
  // Setup checkout form
  setupCheckoutForm();
  
  // Add demo data button
  addDemoDataButton();
  
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
   * Display order summary in checkout
   */
  function displayOrderSummary() {
    // Get cart items
    const cartItems = Cart.getCartItems();
    
    // Get container for order items
    const checkoutItemsContainer = document.getElementById('checkout-items');
    if (!checkoutItemsContainer) return;
    
    // Check if cart is empty
    if (cartItems.length === 0) {
      // Show empty cart message
      const checkoutEmpty = document.getElementById('checkout-empty');
      const checkoutContents = document.getElementById('checkout-contents');
      
      if (checkoutEmpty && checkoutContents) {
        checkoutEmpty.classList.remove('hidden');
        checkoutContents.classList.add('hidden');
      }
      return;
    }
    
    // Show checkout contents
    const checkoutEmpty = document.getElementById('checkout-empty');
    const checkoutContents = document.getElementById('checkout-contents');
    
    if (checkoutEmpty && checkoutContents) {
      checkoutEmpty.classList.add('hidden');
      checkoutContents.classList.remove('hidden');
    }
    
    // Clear container
    checkoutItemsContainer.innerHTML = '';
    
    // Add each item to the summary
    cartItems.forEach(item => {
      const checkoutItem = createCheckoutItem(item);
      checkoutItemsContainer.appendChild(checkoutItem);
    });
    
    // Update order totals
    updateOrderTotals();
  }
  
  /**
   * Create a checkout item element
   * @param {Object} item - Cart item
   * @returns {HTMLElement} - Checkout item element
   */
  function createCheckoutItem(item) {
    const checkoutItem = document.createElement('div');
    checkoutItem.className = 'checkout-item';
    
    const itemImage = item.imageUrl || 'https://via.placeholder.com/60';
    
    checkoutItem.innerHTML = `
      <div class="checkout-item-image">
        <img src="${itemImage}" alt="${item.name}">
      </div>
      <div class="checkout-item-info">
        <div class="checkout-item-title">${item.name}</div>
        <div class="checkout-item-price">${Utils.formatPrice(item.price)}</div>
        <div class="checkout-item-quantity">Quantity: ${item.quantity}</div>
      </div>
    `;
    
    return checkoutItem;
  }
  
  /**
   * Update order totals
   */
  function updateOrderTotals() {
    const totals = Cart.calculateTotals();
    
    // Update subtotal
    const subtotalElement = document.getElementById('order-subtotal');
    if (subtotalElement) {
      subtotalElement.textContent = Utils.formatPrice(totals.subtotal);
    }
    
    // Update shipping
    const shippingElement = document.getElementById('order-shipping');
    if (shippingElement) {
      shippingElement.textContent = Utils.formatPrice(totals.shipping);
    }
    
    // Update tax
    const taxElement = document.getElementById('order-tax');
    if (taxElement) {
      taxElement.textContent = Utils.formatPrice(totals.tax);
    }
    
    // Update total
    const totalElement = document.getElementById('order-total');
    if (totalElement) {
      totalElement.textContent = Utils.formatPrice(totals.total);
    }
  }
  
  /**
   * Add a button to fill the form with demo data
   */
  function addDemoDataButton() {
    // Create the demo data button
    const demoButton = document.createElement('button');
    demoButton.type = 'button';
    demoButton.id = 'fill-demo-data';
    demoButton.className = 'btn secondary-btn';
    demoButton.innerHTML = '<i class="fas fa-magic"></i> Fill with Demo Data';
    
    // Find the form actions section
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      // Insert the button at the beginning of the form actions
      formActions.insertBefore(demoButton, formActions.firstChild);
      
      // Add event listener to the button
      demoButton.addEventListener('click', fillDemoData);
    }
  }
  
  /**
   * Fill the form with demo data
   */
  function fillDemoData() {
    // Shipping information
    document.getElementById('shipping-firstname').value = 'John';
    document.getElementById('shipping-lastname').value = 'Doe';
    document.getElementById('shipping-address').value = '123 Main St';
    document.getElementById('shipping-city').value = 'San Francisco';
    document.getElementById('shipping-state').value = 'CA';
    document.getElementById('shipping-zip').value = '94105';
    document.getElementById('shipping-country').value = 'US';
    document.getElementById('shipping-phone').value = '(555) 123-4567';
    
    // Payment information
    document.getElementById('card-name').value = 'John Doe';
    document.getElementById('card-number').value = '4111 1111 1111 1111';
    document.getElementById('card-expiry').value = '12/25';
    document.getElementById('card-cvv').value = '123';
    
    // Show toast confirmation
    if (typeof Config !== 'undefined' && Config.showToast) {
      Config.showToast('Demo data filled successfully!');
    }
  }
  
  /**
   * Setup checkout form submission
   */
  function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;
    
    checkoutForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form data
      const formData = {
        shipping: {
          firstName: document.getElementById('shipping-firstname').value,
          lastName: document.getElementById('shipping-lastname').value,
          address: document.getElementById('shipping-address').value,
          city: document.getElementById('shipping-city').value,
          state: document.getElementById('shipping-state').value,
          zip: document.getElementById('shipping-zip').value,
          country: document.getElementById('shipping-country').value,
          phone: document.getElementById('shipping-phone').value
        },
        payment: {
          cardNumber: document.getElementById('card-number').value,
          expiry: document.getElementById('card-expiry').value,
          cvv: document.getElementById('card-cvv').value,
          nameOnCard: document.getElementById('card-name').value
        }
      };
      
      // In a real application, we would validate the form and send the order to a server
      // Here we'll just simulate it
      
      // Show processing state
      const placeOrderBtn = document.querySelector('.form-actions .primary-btn');
      if (placeOrderBtn) {
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        placeOrderBtn.disabled = true;
      }
      
      // Simulate server processing
      setTimeout(() => {
        // Generate a random order number
        const orderNumber = 'ORD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        
        // Display order number
        const orderNumberElement = document.getElementById('order-number');
        if (orderNumberElement) {
          orderNumberElement.textContent = orderNumber;
        }
        
        // Show confirmation modal
        const orderConfirmation = document.getElementById('order-confirmation-modal');
        if (orderConfirmation) {
          orderConfirmation.classList.add('show');
        }
        
        // Clear the cart
        Cart.clearCart();
        
        // Reset button state
        if (placeOrderBtn) {
          placeOrderBtn.innerHTML = 'Place Order';
          placeOrderBtn.disabled = false;
        }
        
        // Setup confirmation modal continue shopping button
        const closeBtn = document.getElementById('close-order-confirmation');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            orderConfirmation.classList.remove('show');
            window.location.href = 'index.html';
          });
        }
      }, 2000);
    });
    
    // Format card inputs
    setupCardFormatter();
  }
  
  /**
   * Setup credit card input formatters
   */
  function setupCardFormatter() {
    // Card number formatter
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', function() {
        // Remove non-digits
        let value = this.value.replace(/\D/g, '');
        
        // Add spaces every 4 digits
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        // Limit to 19 characters (16 digits + 3 spaces)
        value = value.substring(0, 19);
        
        this.value = value;
      });
    }
    
    // Expiry date formatter
    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', function() {
        // Remove non-digits
        let value = this.value.replace(/\D/g, '');
        
        // Add slash after month
        if (value.length > 2) {
          value = value.substring(0, 2) + '/' + value.substring(2);
        }
        
        // Limit to 5 characters (MM/YY)
        value = value.substring(0, 5);
        
        this.value = value;
      });
    }
    
    // CVV formatter
    const cvvInput = document.getElementById('card-cvv');
    if (cvvInput) {
      cvvInput.addEventListener('input', function() {
        // Remove non-digits
        let value = this.value.replace(/\D/g, '');
        
        // Limit to 4 digits (for Amex, others are 3)
        value = value.substring(0, 4);
        
        this.value = value;
      });
    }
  }
}); 