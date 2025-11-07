let isRefreshing = false;
let tokenRefreshInterval = null;

/**
 * Refresh access token by calling /auth/refresh endpoint
 * @returns {Promise<boolean>} True if refresh successful, false otherwise
 */
async function refreshAccessToken() {
  try {
    const response = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return response.ok;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return false;
  }
}

/**
 * Start automatic token refresh interval
 * Refreshes token every 50 minutes (before 1 hour expiration)
 */
function startTokenRefreshInterval() {
  if (tokenRefreshInterval) return; // Already running

  const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  tokenRefreshInterval = setInterval(async () => {
    console.log('Proactive token refresh...');
    const success = await refreshAccessToken();
    if (success) {
      console.log('Token refreshed successfully');
    } else {
      console.warn('Token refresh failed, will retry on next request');
    }
  }, REFRESH_INTERVAL);
}

/**
 * Stop automatic token refresh interval
 */
function stopTokenRefreshInterval() {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

/**
 * Enhanced fetch wrapper with automatic token refresh on 401
 * Handles httpOnly cookies automatically (credentials: 'include')
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {function} onAuthError - Callback when auth fails after refresh attempt
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options = {}, onAuthError = null) {
  const config = {
    ...options,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;

    try {
      const refreshSuccess = await refreshAccessToken();

      isRefreshing = false;

      if (refreshSuccess) {
        response = await fetch(url, config);
      } else {
        if (onAuthError) onAuthError();
        throw new Error('Session expired, please login again');
      }
    } catch (err) {
      isRefreshing = false;
      if (onAuthError) onAuthError();
      throw err;
    }
  }

  return response;
}
