/**
 * Configuration Module
 * Handles site-wide configuration and settings persistence
 */

const Config = (function() {
    // Default configuration values
    const DEFAULT_CONFIG = {
        siteName: 'ShopNow',
        miraklAdsUrl: 'https://api-xxx.eu1.retailmedia.mirakl.net/ads/v1',
        miraklAdsToken: ''
    };
    
    // Configuration storage key in localStorage
    const STORAGE_KEY = 'shopnow_config';
    
    /**
     * Load configuration from localStorage
     * @returns {Object} The current configuration
     */
    function getConfig() {
        try {
            const storedConfig = localStorage.getItem(STORAGE_KEY);
            if (storedConfig) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
        
        return { ...DEFAULT_CONFIG };
    }
    
    /**
     * Save configuration to localStorage
     * @param {Object} config - New configuration to save
     */
    function saveConfig(config) {
        try {
            const updatedConfig = { ...getConfig(), ...config };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
            
            // Dispatch an event so other components know the config has changed
            window.dispatchEvent(new CustomEvent('config-updated', { 
                detail: updatedConfig 
            }));
            
            return updatedConfig;
        } catch (error) {
            console.error('Error saving configuration:', error);
            return getConfig();
        }
    }
    
    /**
     * Reset configuration to defaults
     * @returns {Object} The default configuration
     */
    function resetToDefaults() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            
            // Dispatch an event so other components know the config has been reset
            window.dispatchEvent(new CustomEvent('config-updated', { 
                detail: DEFAULT_CONFIG 
            }));
            
            return { ...DEFAULT_CONFIG };
        } catch (error) {
            console.error('Error resetting configuration:', error);
            return getConfig();
        }
    }
    
    /**
     * Apply site name to all relevant elements
     * @param {string} siteName - The site name to apply
     */
    function applySiteName(siteName) {
        // Update page title
        document.title = `${siteName} - Online Shopping`;
        
        // Update site title in header
        const siteTitle = document.getElementById('site-title');
        if (siteTitle) {
            siteTitle.textContent = siteName;
        }
        
        // Update hero section
        const heroSiteName = document.getElementById('hero-site-name');
        if (heroSiteName) {
            heroSiteName.textContent = siteName;
        }
        
        // Update footer
        const footerSiteName = document.getElementById('footer-site-name');
        if (footerSiteName) {
            footerSiteName.textContent = siteName;
        }
    }
    
    /**
     * Initialize configuration UI elements
     */
    function initConfigUI() {
        // Find the modal elements
        const configModal = document.getElementById('config-modal');
        const configForm = document.getElementById('config-form');
        const closeBtn = document.getElementById('close-config-modal');
        const useDefaultBtn = document.getElementById('use-default');
        const settingsIcon = document.getElementById('settings-icon');
        
        // Load form values from current config
        function loadFormValues() {
            const config = getConfig();
            
            const siteName = document.getElementById('site-name');
            const miraklAdsUrl = document.getElementById('mirakl-ads-url');
            const miraklAdsToken = document.getElementById('mirakl-ads-token');
            
            if (siteName) siteName.value = config.siteName || DEFAULT_CONFIG.siteName;
            if (miraklAdsUrl) miraklAdsUrl.value = config.miraklAdsUrl || DEFAULT_CONFIG.miraklAdsUrl;
            if (miraklAdsToken) miraklAdsToken.value = config.miraklAdsToken || '';
        }
        
        // Toggle modal display
        function toggleModal() {
            if (configModal) {
                configModal.classList.toggle('show');
                
                if (configModal.classList.contains('show')) {
                    loadFormValues();
                }
            }
        }
        
        // Event listener for the settings icon
        if (settingsIcon) {
            settingsIcon.addEventListener('click', function(e) {
                e.preventDefault();
                toggleModal();
            });
        }
        
        // Event listener for the close button
        if (closeBtn) {
            closeBtn.addEventListener('click', toggleModal);
        }
        
        // Event listener for clicking outside the modal
        if (configModal) {
            configModal.addEventListener('click', function(e) {
                if (e.target === configModal) {
                    toggleModal();
                }
            });
        }
        
        // Event listener for the "Use Default" button
        if (useDefaultBtn) {
            useDefaultBtn.addEventListener('click', function(e) {
                e.preventDefault();
                resetToDefaults();
                loadFormValues();
                
                // Apply the default site name
                applySiteName(DEFAULT_CONFIG.siteName);
                
                // Show confirmation message
                showToast('Default configuration applied');
            });
        }
        
        // Event listener for the form submission
        if (configForm) {
            configForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const siteName = document.getElementById('site-name').value.trim() || DEFAULT_CONFIG.siteName;
                const miraklAdsUrl = document.getElementById('mirakl-ads-url').value.trim() || DEFAULT_CONFIG.miraklAdsUrl;
                const miraklAdsToken = document.getElementById('mirakl-ads-token').value.trim();
                
                // Save the new configuration
                saveConfig({
                    siteName,
                    miraklAdsUrl,
                    miraklAdsToken
                });
                
                // Apply the site name immediately
                applySiteName(siteName);
                
                // Initialize Mirakl Ads with new settings if available
                if (typeof MiraklAds !== 'undefined') {
                    MiraklAds.init({
                        adServerBaseUrl: miraklAdsUrl,
                        publisherBearerToken: miraklAdsToken
                    });
                }
                
                // Close the modal
                toggleModal();
                
                // Show confirmation message
                showToast('Configuration saved successfully');
            });
        }
        
        // Apply current site name on page load
        const config = getConfig();
        applySiteName(config.siteName);
    }
    
    /**
     * Show a toast notification
     * @param {string} message - Message to show
     * @param {number} duration - Duration in milliseconds
     */
    function showToast(message, duration = 3000) {
        // Check if a toast container already exists
        let toastContainer = document.querySelector('.toast-container');
        
        // Create toast container if it doesn't exist
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
            
            // Add CSS for the toast container and notifications
            const style = document.createElement('style');
            style.textContent = `
                .toast-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                }
                .toast {
                    background-color: var(--secondary-color);
                    color: white;
                    padding: 12px 20px;
                    border-radius: var(--radius);
                    margin-top: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    animation: fadeIn 0.3s, fadeOut 0.3s forwards;
                    animation-delay: 0s, ${(duration - 300) / 1000}s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // Add toast to the container
        toastContainer.appendChild(toast);
        
        // Remove toast after duration
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
    
    // Initialize when the DOM is loaded
    document.addEventListener('DOMContentLoaded', initConfigUI);
    
    // Public API
    return {
        getConfig,
        saveConfig,
        resetToDefaults,
        showToast,
        applySiteName
    };
})(); 
