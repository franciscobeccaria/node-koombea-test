const API = 'http://localhost:3000';
const authEl = document.getElementById('auth');
const dashboardEl = document.getElementById('dashboard');

// State
let currentPage = 1;
let currentPageSize = 20;

// Auth Functions
function showAuth() {
  authEl.style.display = 'block';
  dashboardEl.style.display = 'none';
}

function showDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('userName').textContent = user.email.split('@')[0];
  authEl.style.display = 'none';
  dashboardEl.style.display = 'block';
  loadPages(1);
}

// Login
document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Register
document.getElementById('registerBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Create Page
document.getElementById('createPageBtn').onclick = async () => {
  const url = document.getElementById('pageUrl').value;
  const token = localStorage.getItem('accessToken');

  try {
    const res = await fetch(`${API}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });
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
  const token = localStorage.getItem('accessToken');
  const offset = (page - 1) * currentPageSize;

  try {
    const res = await fetch(`${API}/pages?limit=${currentPageSize}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    renderPagesTable(data.data);
    renderPagesPagination(data.pagination.total, page);
  } catch (err) {
    document.getElementById('pagesTableBody').innerHTML = `<tr><td colspan="2" style="color:red;">${err.message}</td></tr>`;
  }
};

const renderPagesTable = (pages) => {
  const tbody = document.getElementById('pagesTableBody');

  if (pages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No pages found</td></tr>';
    return;
  }

  tbody.innerHTML = pages.map(page => `
    <tr onclick="window.location.href='/page/${page.id}'" style="cursor:pointer;">
      <td>${page.title}</td>
      <td>${page.linkCount}</td>
    </tr>
  `).join('');
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
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('authError').textContent = '';
  showAuth();
};

// Initialize
if (localStorage.getItem('accessToken')) {
  showDashboard();
} else {
  showAuth();
}
