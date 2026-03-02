/**
 * Hash-based Router for Vismo Dashboard
 * Handles navigation between Dashboard, Project Viewer, and Settings
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.history = [];

    // Handle hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());

    // Handle initial route on load
    window.addEventListener('load', () => this.handleRouteChange());
  }

  /**
   * Register a route handler
   * @param {string} path - Route path (e.g., '/', '/viewer/:id', '/projects/:id')
   * @param {Function} handler - Function to call when route is activated
   * @param {Function} cleanup - Function to call when route is deactivated (optional)
   */
  register(path, handler, cleanup = null) {
    this.routes[path] = { handler, cleanup };
  }

  /**
   * Extract route parameters from URL and route pattern
   * @param {string} pattern - Route pattern (e.g., '/viewer/:id')
   * @param {string} url - Current URL path
   * @returns {Object} Object containing extracted parameters
   */
  extractParams(pattern, url) {
    const patternParts = pattern.split('/').filter(p => p);
    const urlParts = url.split('/').filter(p => p);

    if (patternParts.length !== urlParts.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = urlParts[i];
      } else if (patternParts[i] !== urlParts[i]) {
        return null;
      }
    }

    return params;
  }

  /**
   * Find matching route and parameters
   * @param {string} url - Current URL path
   * @returns {Object} { route, path, params } or null if no match
   */
  matchRoute(url) {
    // Exact match first
    if (this.routes[url]) {
      return { route: this.routes[url], path: url, params: {} };
    }

    // Pattern match
    for (const [path, route] of Object.entries(this.routes)) {
      const params = this.extractParams(path, url);
      if (params !== null) {
        return { route, path, params };
      }
    }

    return null;
  }

  /**
   * Handle route change when hash changes
   */
  async handleRouteChange() {
    const hash = window.location.hash.slice(1); // Remove '#'
    const route = hash || '/'; // Default to dashboard

    console.log(`🔄 Router: navigating to ${route}`);

    const match = this.matchRoute(route);

    if (!match) {
      console.warn(`❌ Router: no match for route "${route}"`);
      // Default to dashboard if no match
      window.location.hash = '#/';
      return;
    }

    // Clean up previous route
    if (this.currentRoute && this.currentRoute.cleanup) {
      try {
        this.currentRoute.cleanup();
      } catch (err) {
        console.error('Error cleaning up previous route:', err);
      }
    }

    // Execute new route handler
    try {
      this.currentRoute = match.route;
      await match.route.handler(match.params);
      this.history.push({ route, timestamp: Date.now(), params: match.params });
    } catch (err) {
      console.error(`Error handling route "${route}":`, err);
      // Default to dashboard on error
      window.location.hash = '#/';
    }
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path to navigate to
   * @param {Object} params - Optional parameters to include in URL
   */
  navigate(path, params = {}) {
    let hash = path;

    // Replace URL parameters
    for (const [key, value] of Object.entries(params)) {
      hash = hash.replace(`:${key}`, value);
    }

    window.location.hash = `#${hash}`;
  }

  /**
   * Get current route path
   * @returns {string} Current route path without hash
   */
  getCurrentRoute() {
    return window.location.hash.slice(1) || '/';
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }

  /**
   * Check if a route is currently active
   * @param {string} routePath - Route path to check
   * @returns {boolean} True if route is active
   */
  isActive(routePath) {
    const current = this.getCurrentRoute();
    if (current === routePath) return true;

    // Pattern matching for dynamic routes
    return this.matchRoute(current)?.path === routePath;
  }

  /**
   * Get route history
   * @returns {Array} Array of visited routes
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Clear route history
   */
  clearHistory() {
    this.history = [];
  }
}

// Export singleton instance
export const router = new Router();

// Export class for testing
export default Router;
