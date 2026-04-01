/**
 * API Utilities
 * Common API-related functions used across the application
 */

// Track pending requests to prevent duplicates
const pendingRequests = new Map();
const requestTimestamps = new Map();
const responseCache = new Map();

/**
 * Get the API base URL
 * @returns {string} API base URL
 */
const API_BASE = (function () {
    if (window.__API_BASE__) return window.__API_BASE__;
    try {
        const origin = window.location.origin;
        if (!origin || origin === 'null') return 'http://localhost:5000/api';
        return origin.replace(/\/$/, '') + '/api';
    } catch (e) {
        return 'http://localhost:5000/api';
    }
})();

/**
 * Generate a unique key for a request
 */
function getRequestKey(url, method, body) {
    // For POST/PUT requests, include body in key
    if (method === 'POST' || method === 'PUT') {
        const bodyStr = body ? JSON.stringify(body) : '';
        return `${method}:${url}:${bodyStr}`;
    }
    // For GET/DELETE, just use method and URL
    return `${method}:${url}`;
}

/**
 * Make an authenticated API request with smart deduplication
 * @param {string} url - API endpoint URL
 * @param {object} options - Request options
 * @returns {Promise<object>} Parsed JSON data (not Response object)
 */
async function makeApiRequest(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body;
    
    // Generate request key
    const requestKey = getRequestKey(url, method, body);
    
    // For GET requests, check if we have a cached response
    // This allows parallel requests to share the same data
    const now = Date.now();
    if (method === 'GET') {
        const cached = responseCache.get(requestKey);
        if (cached && (now - cached.timestamp) < 5000) {
            console.log('✓ Using cached response:', url);
            // Return cached data wrapped in response-like object
            return Promise.resolve({
                ok: true,
                status: 200,
                data: cached.data,
                json: async () => cached.data
            });
        }
    }
    
    // Check timestamp to prevent accidental rapid duplicates (within 300ms)
    // Only for POST/PUT/DELETE - GET requests can be parallel
    const lastRequest = requestTimestamps.get(requestKey);
    if (lastRequest && (now - lastRequest) < 300 && method !== 'GET') {
        console.warn('⚠️ Duplicate request blocked (too fast):', method, url);
        throw new Error('الرجاء الانتظار قبل إعادة المحاولة');
    }
    
    // Check if this exact request is already pending
    if (pendingRequests.has(requestKey)) {
        // For GET requests, wait for the pending request and share the cached result
        if (method === 'GET') {
            console.log('ℹ️ Waiting for pending GET request:', url);
            const pendingPromise = pendingRequests.get(requestKey);
            // Wait for it to complete, then return from cache
            await pendingPromise;
            const cached = responseCache.get(requestKey);
            if (cached) {
                return {
                    ok: true,
                    status: 200,
                    data: cached.data,
                    json: async () => cached.data
                };
            }
        }
        // For POST/PUT/DELETE, block duplicates
        console.warn('⚠️ Duplicate request blocked (already pending):', method, url);
        throw new Error('الرجاء الانتظار حتى اكتمال العملية السابقة');
    }
    
    // Update timestamp
    requestTimestamps.set(requestKey, now);
    
    // Make the request and parse JSON immediately
    const requestPromise = authManager.makeAuthenticatedRequest(url, options)
        .then(async (response) => {
            // Parse JSON once
            const data = response.ok ? await response.json() : null;
            
            // For GET requests, cache the parsed data
            if (method === 'GET' && response.ok && data) {
                responseCache.set(requestKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                // Clean up old cache entries (older than 5 seconds)
                setTimeout(() => {
                    const cutoff = Date.now() - 5000;
                    for (const [key, cached] of responseCache.entries()) {
                        if (cached.timestamp < cutoff) {
                            responseCache.delete(key);
                        }
                    }
                }, 5000);
            }
            
            // Return response-like object with parsed data
            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: data,
                json: async () => data
            };
        })
        .finally(() => {
            // Remove from pending after completion
            setTimeout(() => {
                pendingRequests.delete(requestKey);
            }, 100);
            
            // Clean up old timestamps (older than 5 seconds)
            setTimeout(() => {
                const cutoff = Date.now() - 5000;
                for (const [key, timestamp] of requestTimestamps.entries()) {
                    if (timestamp < cutoff) {
                        requestTimestamps.delete(key);
                    }
                }
            }, 5000);
        });
    
    // Store in pending requests
    pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
}

/**
 * Generic GET request
 * @param {string} endpoint - API endpoint
 * @param {boolean} showLoading - Show global loader (default: false)
 * @returns {Promise<any>} Response data
 */
async function apiGet(endpoint, showLoading = false) {
    if (showLoading && typeof showLoader === 'function') showLoader('جاري تحميل البيانات...');
    
    try {
        const response = await makeApiRequest(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `فشل في تحميل البيانات من ${endpoint}`);
        }
        return response.json();
    } finally {
        if (showLoading && typeof hideLoader === 'function') hideLoader();
    }
}

/**
 * Generic POST request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data to send
 * @param {boolean} showLoading - Show global loader (default: false)
 * @returns {Promise<any>} Response data
 */
async function apiPost(endpoint, data, showLoading = false) {
    if (showLoading && typeof showLoader === 'function') showLoader('جاري الحفظ...');
    
    try {
        const response = await makeApiRequest(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `فشل في إضافة البيانات`);
        }
        return response.json();
    } finally {
        if (showLoading && typeof hideLoader === 'function') hideLoader();
    }
}

/**
 * Generic PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data to send
 * @returns {Promise<any>} Response data
 */
async function apiPut(endpoint, data) {
    const response = await makeApiRequest(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشل في تحديث البيانات`);
    }
    return response.json();
}

/**
 * Generic DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Response data
 */
async function apiDelete(endpoint) {
    const response = await makeApiRequest(`${API_BASE}${endpoint}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `فشل في حذف البيانات`);
    }
    return response.json();
}

/**
 * Load projects/clients data
 * @returns {Promise<Array>} Projects data
 */
async function loadProjectsData() {
    try {
        const data = await apiGet('/clients');
        return data.clients || data.data || data || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

// Export functions for global use
window.API_BASE = API_BASE;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.loadProjectsData = loadProjectsData;