// Environment configuration
// Dynamically set API base URL based on current origin
window.__API_BASE__ = (function () {
    try {
        const origin = window.location.origin;
        // If origin is valid and not 'null', use it
        if (origin && origin !== 'null') {
            return origin.replace(/\/$/, '') + '/api';
        }
        // Fallback to localhost for local development
        return 'http://localhost:5000/api';
    } catch (e) {
        console.error('Error setting API_BASE:', e);
        return 'http://localhost:5000/api';
    }
})();