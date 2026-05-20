const pendingRequests = new Map();
const requestTimestamps = new Map();
const responseCache = new Map();

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getRequestKey(url, method, body) {
    if (method === 'POST' || method === 'PUT') {
        return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
    }
    return `${method}:${url}`;
}

export async function apiRequest(endpoint, options = {}, token = null) {
    const url = `${API_BASE}${endpoint}`;
    const method = options.method || 'GET';
    const requestKey = getRequestKey(url, method, options.body);
    const now = Date.now();

    // GET caching (5 seconds lifetime)
    if (method === 'GET') {
        const cached = responseCache.get(requestKey);
        if (cached && (now - cached.timestamp) < 5000) {
            return cached.data;
        }
    }

    // Submission throttling (300ms)
    const lastRequest = requestTimestamps.get(requestKey);
    if (lastRequest && (now - lastRequest) < 300 && method !== 'GET') {
        throw new Error('الرجاء الانتظار قبل إعادة المحاولة');
    }

    // Deduplicate identical pending requests
    if (pendingRequests.has(requestKey)) {
        if (method === 'GET') {
            await pendingRequests.get(requestKey);
            const cached = responseCache.get(requestKey);
            if (cached) return cached.data;
        }
        throw new Error('الرجاء الانتظار حتى اكتمال العملية السابقة');
    }

    requestTimestamps.set(requestKey, now);

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const fetchPromise = (async () => {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'حدث خطأ أثناء الاتصال بالخادم');
        }

        const data = await response.json();

        if (method === 'GET') {
            responseCache.set(requestKey, { data, timestamp: Date.now() });
        }

        return data;
    })();

    pendingRequests.set(requestKey, fetchPromise);

    try {
        return await fetchPromise;
    } finally {
        setTimeout(() => pendingRequests.delete(requestKey), 100);
    }
}

export const apiGet = (endpoint, token) => apiRequest(endpoint, { method: 'GET' }, token);
export const apiPost = (endpoint, data, token) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }, token);
export const apiPut = (endpoint, data, token) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) }, token);
export const apiDelete = (endpoint, token) => apiRequest(endpoint, { method: 'DELETE' }, token);
