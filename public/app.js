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
  document.getElementById('accessToken').textContent = localStorage.getItem('accessToken');
  document.getElementById('refreshToken').textContent = localStorage.getItem('refreshToken');
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

// Test Protected Route: GET /pages con token
document.getElementById('testBtn').onclick = async () => {
  const token = localStorage.getItem('accessToken');

  try {
    const res = await fetch(`${API}/pages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    document.getElementById('testResult').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById('testResult').textContent = `Error: ${err.message}`;
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
} else {
  showAuth();
}
