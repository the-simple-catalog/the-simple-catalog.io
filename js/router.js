// ===================================
// Router - SPA routing system
// ===================================

const Router = {
    routes: {},

    /**
     * Register a route handler
     * @param {string} path - Route path pattern
     * @param {Function} handler - Handler function
     */
    register(path, handler) {
        this.routes[path] = handler;
    },

    /**
     * Navigate to a specific route
     * @param {string} path - Route path
     */
    navigate(path) {
        window.location.hash = path;
    },

    /**
     * Match current route and execute handler
     */
    resolve() {
        const route = parseRoute();
        const path = route.path;

        // Try exact match first
        if (this.routes[path]) {
            this.routes[path](route.params);
            return;
        }

        // Try pattern matching
        for (let pattern in this.routes) {
            const match = this.matchPattern(pattern, path);
            if (match) {
                this.routes[pattern]({ ...route.params, ...match });
                return;
            }
        }

        // No match found - show 404
        this.show404();
    },

    /**
     * Match route pattern with path
     * @param {string} pattern - Route pattern with :param syntax
     * @param {string} path - Current path
     * @returns {Object|null} Matched parameters or null
     */
    matchPattern(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                // This is a parameter
                const paramName = patternParts[i].slice(1);
                params[paramName] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                // Parts don't match
                return null;
            }
        }

        return params;
    },

    /**
     * Show 404 page
     */
    show404() {
        const app = getEl('app');
        if (app) {
            app.innerHTML = `
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">404 - Page Not Found</h1>
                    </div>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="#/" class="btn btn-primary" style="margin-top: 20px;">Go to Homepage</a>
                </div>
            `;
        }
    },

    /**
     * Initialize router
     */
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.resolve());

        // Handle initial load
        if (!window.location.hash) {
            window.location.hash = '#/';
        } else {
            this.resolve();
        }
    }
};
