const API = 'http://localhost:3000';
const authEl = document.getElementById('auth');
const dashboardEl = document.getElementById('dashboard');

function showAuth() {
  authEl.style.display = 'block';
  dashboardEl.style.display = 'none';
}

function showDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('userName').textContent = user.email.split('@')[0];
  authEl.style.display = 'none';
  dashboardEl.style.display = 'block';
}

// Login: POST /auth/login
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

    // Guardar tokens en localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Register: POST /auth/register
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

    // Guardar tokens y user info
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    showDashboard();
  } catch (err) {
    document.getElementById('authError').textContent = err.message;
  }
};

// Create page: POST /pages
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
    loadPages(token);
    alert(`Page created! ID: ${data.id}, Links found: ${data.linkCount}`);
  } catch (err) {
    document.getElementById('createError').textContent = err.message;
  }
};

// List pages: GET /pages
const loadPages = async (token) => {
  try {
    const res = await fetch(`${API}/pages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    const html = data.data.map(page => `
      <div style="border:1px solid #ddd; padding:10px; margin:5px 0;">
        <p><strong>${page.title}</strong></p>
        <p>${page.url}</p>
        <p>Links: ${page.linkCount} | Created: ${new Date(page.createdAt).toLocaleDateString()}</p>
      </div>
    `).join('');

    document.getElementById('pagesList').innerHTML = html || '<p>No pages found</p>';
  } catch (err) {
    document.getElementById('pagesList').innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
};

// Get page detail: GET /pages/:id
document.getElementById('getPageBtn').onclick = async () => {
  const pageId = document.getElementById('pageId').value;
  const token = localStorage.getItem('accessToken');

  if (!pageId) {
    document.getElementById('pageDetails').textContent = 'Enter a page ID';
    return;
  }

  try {
    const res = await fetch(`${API}/pages/${pageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    document.getElementById('pageDetails').innerHTML = `
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>URL:</strong> ${data.url}</p>
      <p><strong>Title:</strong> ${data.title}</p>
      <p><strong>Links:</strong> ${data.linkCount}</p>
    `;
  } catch (err) {
    document.getElementById('pageDetails').textContent = `Error: ${err.message}`;
  }
};

// Get page links: GET /pages/:id/links
document.getElementById('getLinksBtn').onclick = async () => {
  const pageId = document.getElementById('linksPageId').value;
  const token = localStorage.getItem('accessToken');

  if (!pageId) {
    document.getElementById('linksList').textContent = 'Enter a page ID';
    return;
  }

  try {
    const res = await fetch(`${API}/pages/${pageId}/links`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    const html = data.data.map(link => `
      <div style="border:1px solid #eee; padding:8px; margin:5px 0;">
        <p><a href="${link.href}" target="_blank">${link.text || 'No text'}</a></p>
        <p style="font-size:12px; color:#666;">${link.href}</p>
      </div>
    `).join('');

    document.getElementById('linksList').innerHTML = html || '<p>No links found</p>';
  } catch (err) {
    document.getElementById('linksList').innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
};

// Logout: limpiar localStorage y volver a auth
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  document.getElementById('authError').textContent = '';
  showAuth();
};

// Check si ya hay sesión activa
if (localStorage.getItem('accessToken')) {
  showDashboard();
  loadPages(localStorage.getItem('accessToken'));
} else {
  showAuth();
}
