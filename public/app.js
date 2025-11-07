const API = 'http://localhost:3000';
const authEl = document.getElementById('auth');
const dashboardEl = document.getElementById('dashboard');

// State
let currentPage = 1;
let currentPageSize = 20;
let autoRefreshInterval = null;
let hasProcessingPages = false;

// Auth Functions
function showAuth() {
  authEl.style.display = 'block';
  dashboardEl.style.display = 'none';
}

function showDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('userName').textContent = user.username;
  authEl.style.display = 'none';
  dashboardEl.style.display = 'block';
  loadPages(1);
}

// Login
document.getElementById('loginBtn').onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await apiFetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, showAuth);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Store only user data, tokens are in httpOnly cookies
    localStorage.setItem('user', JSON.stringify(data.user));
    document.getElementById('authError').textContent = '';
    // Start automatic token refresh
    startTokenRefreshInterval();
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Register
document.getElementById('registerBtn').onclick = async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await apiFetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, showAuth);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    // Store only user data, tokens are in httpOnly cookies
    localStorage.setItem('user', JSON.stringify(data.user));
    document.getElementById('authError').textContent = '';
    // Start automatic token refresh
    startTokenRefreshInterval();
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Create Page
document.getElementById('createPageBtn').onclick = async () => {
  const url = document.getElementById('pageUrl').value;

  try {
    const res = await apiFetch(`${API}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    }, showAuth);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    document.getElementById('pageUrl').value = '';
    document.getElementById('createError').textContent = '';
    currentPage = 1;
    loadPages(1);
  } catch (err) {
    document.getElementById('createError').textContent = err.message;
  }
};

// Load Pages
const loadPages = async (page = 1) => {
  currentPage = page;
  const offset = (page - 1) * currentPageSize;

  try {
    const res = await apiFetch(`${API}/pages?limit=${currentPageSize}&offset=${offset}`, {}, showAuth);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    renderPagesTable(data.data);
    renderPagesPagination(data.pagination.total, page);
  } catch (err) {
    document.getElementById('pagesTableBody').innerHTML = `<tr><td colspan="4" style="color:red;">${err.message}</td></tr>`;
  }
};

const renderPagesTable = (pages) => {
  const tbody = document.getElementById('pagesTableBody');

  if (pages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No pages found</td></tr>';
    hasProcessingPages = false;
    return;
  }

  // Check if any page is processing
  hasProcessingPages = pages.some(page => page.status === 'processing');

  tbody.innerHTML = pages.map(page => {
    const statusBadge = `<span class="status-badge status-${page.status}">${page.status}</span>`;
    return `
    <tr onclick="window.location.href='/page/${page.id}'" style="cursor:pointer;">
      <td>${page.title}</td>
      <td>${page.linkCount}</td>
      <td>${statusBadge}</td>
      <td>${new Date(page.createdAt).toLocaleDateString()}</td>
    </tr>
  `;
  }).join('');

  // Setup auto-refresh if pages are processing
  setupAutoRefresh();
};

const renderPagesPagination = (total, currentPageNum) => {
  const totalPages = Math.ceil(total / currentPageSize);
  const paginationEl = document.getElementById('pagesPagination');

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = '<button onclick="previousPage()" ' + (currentPageNum === 1 ? 'disabled' : '') + '>Previous</button>';

  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="loadPages(${i})" class="${i === currentPageNum ? 'active' : ''}">${i}</button>`;
  }

  html += '<button onclick="nextPage()" ' + (currentPageNum === totalPages ? 'disabled' : '') + '>Next</button>';

  paginationEl.innerHTML = html;
};

function previousPage() {
  if (currentPage > 1) {
    loadPages(currentPage - 1);
  }
}

function nextPage() {
  loadPages(currentPage + 1);
}

// Logout
document.getElementById('logoutBtn').onclick = async () => {
  try {
    // Call logout endpoint to clear server-side cookies
    await apiFetch(`${API}/auth/logout`, {
      method: 'POST',
    }, showAuth);
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Stop automatic token refresh
  stopTokenRefreshInterval();
  // Clear client-side data
  localStorage.clear();
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('authError').textContent = '';
  showAuth();
};

// Auto-refresh for processing pages
function setupAutoRefresh() {
  // Clear existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }

  // Only set up interval if there are processing pages
  if (hasProcessingPages) {
    autoRefreshInterval = setInterval(() => {
      loadPages(currentPage);
    }, 3000); // Refresh every 3 seconds
  }
}

// Initialize
if (localStorage.getItem('user')) {
  showDashboard();
} else {
  showAuth();
}
