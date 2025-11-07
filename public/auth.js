let isRefreshing = false;

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
      const refreshResponse = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      isRefreshing = false;

      if (refreshResponse.ok) {
        response = await fetch(url, config);
      } else {
        if (onAuthError) onAuthError();
        const errorData = await refreshResponse.json();
        throw new Error(errorData.message || 'Session expired, please login again');
      }
    } catch (err) {
      isRefreshing = false;
      if (onAuthError) onAuthError();
      throw err;
    }
  }

  return response;
}
