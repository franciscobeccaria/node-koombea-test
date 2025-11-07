const API = 'http://localhost:3000';

// Get page ID from URL (/page/:id)
const pathParts = window.location.pathname.split('/');
const pageId = parseInt(pathParts[2]);

// State
let currentLinksPage = 1;
let currentLinkSize = 20;
let allLinksData = [];

// Check if user is logged in
if (!localStorage.getItem('accessToken')) {
  window.location.href = '/';
}

// Display username
const user = JSON.parse(localStorage.getItem('user'));
if (!user || !user.username) {
  localStorage.clear();
  window.location.href = '/';
} else {
  document.getElementById('userName').textContent = user.username;
}

// Load page detail
const loadPageDetail = async () => {
  const token = localStorage.getItem('accessToken');

  try {
    const res = await fetch(`${API}/pages/${pageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
  const token = localStorage.getItem('accessToken');
  const offset = (page - 1) * currentLinkSize;

  try {
    const res = await fetch(`${API}/pages/${pageId}/links?limit=${currentLinkSize}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  window.location.href = '/';
};

// Initialize
loadPageDetail();
