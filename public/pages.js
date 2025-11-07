const API = 'http://localhost:3000';

// Get page ID from URL (/page/:id)
const pathParts = window.location.pathname.split('/');
const pageId = parseInt(pathParts[2]);

// State
let currentLinksPage = 1;
let currentLinkSize = 20;
let allLinksData = [];

// Check if user is logged in by checking if user data exists
const user = JSON.parse(localStorage.getItem('user'));
if (!user || !user.username) {
  // If not logged in locally, try to verify with the API
  apiFetch(`${API}/pages`, {}, () => {
    localStorage.clear();
    window.location.href = '/';
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Not authenticated');
      }
    })
    .catch(() => {
      localStorage.clear();
      window.location.href = '/';
    });
} else {
  // Display username
  document.getElementById('userName').textContent = user.username;
}

// Load page detail
const loadPageDetail = async () => {
  try {
    const res = await apiFetch(`${API}/pages/${pageId}`, {}, () => window.location.href = '/');
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    document.getElementById('pageTitle').textContent = data.title;
    loadPageLinks(1);
  } catch (err) {
    document.getElementById('pageTitle').textContent = 'Error loading page';
    console.error(err);
  }
};

// Load page links
const loadPageLinks = async (page = 1) => {
  currentLinksPage = page;
  const offset = (page - 1) * currentLinkSize;

  try {
    const res = await apiFetch(`${API}/pages/${pageId}/links?limit=${currentLinkSize}&offset=${offset}`, {}, () => window.location.href = '/');
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    allLinksData = data.data;
    renderLinksTable(data.data);
    renderLinksPagination(data.pagination.total, page);
  } catch (err) {
    const tbody = document.getElementById('linksTableBody');
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = `Error: ${err.message}`;
    td.style.color = 'red';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
};

const renderLinksTable = (links) => {
  const tbody = document.getElementById('linksTableBody');
  tbody.innerHTML = '';

  if (links.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'No links found';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  links.forEach((link) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => window.open(link.href, '_blank');

    const textTd = document.createElement('td');
    textTd.textContent = link.text || '(no text)';

    const urlTd = document.createElement('td');
    urlTd.textContent = link.href;

    tr.appendChild(textTd);
    tr.appendChild(urlTd);
    tbody.appendChild(tr);
  });
};

const renderLinksPagination = (total, currentPageNum) => {
  const totalPages = Math.ceil(total / currentLinkSize);
  const paginationEl = document.getElementById('linksPagination');

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = '<button onclick="previousLinksPage()" ' + (currentPageNum === 1 ? 'disabled' : '') + '>Previous</button>';

  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="loadPageLinks(${i})" class="${i === currentPageNum ? 'active' : ''}">${i}</button>`;
  }

  html += '<button onclick="nextLinksPage()" ' + (currentPageNum === totalPages ? 'disabled' : '') + '>Next</button>';

  paginationEl.innerHTML = html;
};

function previousLinksPage() {
  if (currentLinksPage > 1) {
    loadPageLinks(currentLinksPage - 1);
  }
}

function nextLinksPage() {
  loadPageLinks(currentLinksPage + 1);
}

// Logout
document.getElementById('logoutBtn').onclick = async () => {
  try {
    // Call logout endpoint to clear server-side cookies
    await apiFetch(`${API}/auth/logout`, {
      method: 'POST',
    }, () => window.location.href = '/');
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Clear client-side data
  localStorage.clear();
  window.location.href = '/';
};

// Initialize
if (user && user.username) {
  loadPageDetail();
}
