/* ============================================
   AskOli — Admin Dashboard Controller
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_PASSWORD = 'jidikun2026';

  // ── DOM References ──
  const loginGate = document.getElementById('admin-login-gate');
  const adminMain = document.getElementById('admin-main');
  const loginForm = document.getElementById('login-form');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  const navBtns = document.querySelectorAll('.admin-nav-btn');
  const sections = document.querySelectorAll('.admin-section');

  // Knowledge Base section
  const kbTableBody = document.getElementById('kb-table-body');
  const kbSearch = document.getElementById('kb-search');
  const kbFilter = document.getElementById('kb-filter');
  const addEntryBtn = document.getElementById('add-entry-btn');

  // Stats
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statDraft = document.getElementById('stat-draft');
  const statCategories = document.getElementById('stat-categories');

  // Modal
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const entryForm = document.getElementById('entry-form');
  const entryId = document.getElementById('entry-id');
  const entryTitle = document.getElementById('entry-title');
  const entryCategory = document.getElementById('entry-category');
  const entryContent = document.getElementById('entry-content');
  const entrySource = document.getElementById('entry-source');
  const entryStatus = document.getElementById('entry-status');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalCancelBtn = document.getElementById('modal-cancel');

  // Delete confirm modal
  const deleteBackdrop = document.getElementById('delete-backdrop');
  const deleteConfirmBtn = document.getElementById('delete-confirm');
  const deleteCancelBtn = document.getElementById('delete-cancel');
  const deleteCloseBtn = document.getElementById('delete-close');
  let pendingDeleteId = null;

  // Toast
  const toast = document.getElementById('admin-toast');
  let toastTimeout = null;

  // ── Initialize particles ──
  Particles.init('particles-canvas');

  // ── Auth ──
  function _checkAuth() {
    return sessionStorage.getItem('askoli_admin') === 'true';
  }

  function _login(password) {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('askoli_admin', 'true');
      loginGate.classList.add('hidden');
      adminMain.classList.add('active');
      _refresh();
      return true;
    }
    return false;
  }

  function _logout() {
    sessionStorage.removeItem('askoli_admin');
    adminMain.classList.remove('active');
    loginGate.classList.remove('hidden');
    loginPassword.value = '';
  }

  // Check existing session
  if (_checkAuth()) {
    loginGate.classList.add('hidden');
    adminMain.classList.add('active');
    _refresh();
  }

  // ── Login form ──
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (_login(loginPassword.value)) {
      loginError.classList.remove('visible');
    } else {
      loginError.classList.add('visible');
      loginPassword.value = '';
      loginPassword.focus();
    }
  });

  logoutBtn.addEventListener('click', _logout);

  // ── Navigation ──
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.forEach(s => {
        s.classList.toggle('active', s.id === target);
      });
      if (target === 'section-knowledge') {
        _renderTable();
      }
    });
  });

  // ── Stats ──
  function _updateStats() {
    const stats = KnowledgeBase.getStats();
    statTotal.textContent = stats.total;
    statActive.textContent = stats.active;
    statDraft.textContent = stats.draft;
    statCategories.textContent = stats.categories;
  }

  // ── Category filter dropdown ──
  function _populateFilters() {
    const cats = KnowledgeBase.getCategories();

    // Table filter
    kbFilter.innerHTML = '<option value="">All Categories</option>';
    cats.forEach(cat => {
      kbFilter.innerHTML += `<option value="${_escapeHtml(cat)}">${_escapeHtml(cat)}</option>`;
    });

    // Form category dropdown
    entryCategory.innerHTML = '';
    cats.forEach(cat => {
      entryCategory.innerHTML += `<option value="${_escapeHtml(cat)}">${_escapeHtml(cat)}</option>`;
    });
  }

  // ── Table Rendering ──
  function _renderTable() {
    const query = kbSearch.value.trim();
    const category = kbFilter.value;

    let results;
    if (query) {
      results = KnowledgeBase.searchEntries(query, category || null);
    } else {
      let entries = KnowledgeBase.getAllEntries();
      if (category) {
        entries = entries.filter(e => e.category === category);
      }
      results = entries.map(e => ({ entry: e, score: 0 }));
    }

    if (results.length === 0) {
      kbTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <p>No entries found.</p>
          </td>
        </tr>
      `;
      return;
    }

    kbTableBody.innerHTML = results.map(({ entry }) => `
      <tr>
        <td class="table-title">${_escapeHtml(entry.title)}</td>
        <td><span class="table-category">${_escapeHtml(entry.category)}</span></td>
        <td>${_escapeHtml(entry.source || '—')}</td>
        <td><span class="table-status ${entry.status}">${entry.status === 'active' ? '● Active' : '◌ Draft'}</span></td>
        <td>${_formatDate(entry.lastUpdated)}</td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn edit" data-id="${entry.id}" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="table-action-btn delete" data-id="${entry.id}" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-2 14H7L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach listeners
    kbTableBody.querySelectorAll('.table-action-btn.edit').forEach(btn => {
      btn.addEventListener('click', () => _openEditModal(btn.dataset.id));
    });
    kbTableBody.querySelectorAll('.table-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', () => _openDeleteConfirm(btn.dataset.id));
    });
  }

  // ── Search & Filter ──
  kbSearch.addEventListener('input', _debounce(_renderTable, 300));
  kbFilter.addEventListener('change', _renderTable);

  // ── Add Entry ──
  addEntryBtn.addEventListener('click', () => {
    _openAddModal();
  });

  // ── Modal Logic ──
  function _openAddModal() {
    modalTitle.textContent = 'Add New Entry';
    entryId.value = '';
    entryTitle.value = '';
    entryCategory.value = KnowledgeBase.getCategories()[0] || '';
    entryContent.value = '';
    entrySource.value = '';
    entryStatus.value = 'active';
    modalBackdrop.classList.add('active');
  }

  function _openEditModal(id) {
    const entry = KnowledgeBase.getEntry(id);
    if (!entry) return;

    modalTitle.textContent = 'Edit Entry';
    entryId.value = entry.id;
    entryTitle.value = entry.title;
    entryCategory.value = entry.category;
    entryContent.value = entry.content;
    entrySource.value = entry.source || '';
    entryStatus.value = entry.status;
    modalBackdrop.classList.add('active');
  }

  function _closeModal() {
    modalBackdrop.classList.remove('active');
  }

  modalCloseBtn.addEventListener('click', _closeModal);
  modalCancelBtn.addEventListener('click', _closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) _closeModal();
  });

  // ── Form Submit ──
  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      title: entryTitle.value.trim(),
      category: entryCategory.value,
      content: entryContent.value.trim(),
      source: entrySource.value.trim(),
      status: entryStatus.value
    };

    if (!data.title || !data.content) {
      _showToast('Please fill in the required fields.', true);
      return;
    }

    if (entryId.value) {
      // Update
      KnowledgeBase.updateEntry(entryId.value, data);
      _showToast('Entry updated successfully!');
    } else {
      // Add
      KnowledgeBase.addEntry(data);
      _showToast('Entry added successfully!');
    }

    _closeModal();
    _refresh();
  });

  // ── Delete ──
  function _openDeleteConfirm(id) {
    pendingDeleteId = id;
    deleteBackdrop.classList.add('active');
  }

  function _closeDeleteConfirm() {
    deleteBackdrop.classList.remove('active');
    pendingDeleteId = null;
  }

  deleteConfirmBtn.addEventListener('click', () => {
    if (pendingDeleteId) {
      KnowledgeBase.deleteEntry(pendingDeleteId);
      _showToast('Entry deleted.');
      _closeDeleteConfirm();
      _refresh();
    }
  });

  deleteCancelBtn.addEventListener('click', _closeDeleteConfirm);
  deleteCloseBtn.addEventListener('click', _closeDeleteConfirm);
  deleteBackdrop.addEventListener('click', (e) => {
    if (e.target === deleteBackdrop) _closeDeleteConfirm();
  });

  // ── Toast ──
  function _showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.className = 'toast visible' + (isError ? ' error' : '');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  // ── Refresh everything ──
  function _refresh() {
    _updateStats();
    _populateFilters();
    _renderTable();
  }

  // ── Utilities ──
  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function _formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function _debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }
});
