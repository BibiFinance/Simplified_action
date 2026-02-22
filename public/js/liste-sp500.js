/**
 * Liste S&P 500 : recherche, tri, pagination, lien vers analyse.
 */

(function () {
  const tbody = document.getElementById('sp500-tbody');
  const loadingRow = document.getElementById('sp500-loading');
  const searchInput = document.getElementById('sp500-search');
  const metaEl = document.getElementById('sp500-meta');
  const paginationEl = document.getElementById('sp500-pagination');
  const prevBtn = document.getElementById('sp500-prev');
  const nextBtn = document.getElementById('sp500-next');
  const pageInfoEl = document.getElementById('sp500-page-info');

  let state = {
    sort: 'name',
    order: 'asc',
    page: 1,
    limit: 50,
    total: 0,
    searchDebounce: null,
  };

  function getAnalysisUrl(ticker) {
    const base = window.location.pathname.replace(/\/[^/]*$/, '') || '';
    return (base.includes('liste-sp500') ? 'index.html' : '/') + '?q=' + encodeURIComponent(ticker);
  }

  function fetchList() {
    const q = (searchInput && searchInput.value || '').trim();
    const params = new URLSearchParams({
      q,
      sort: state.sort,
      order: state.order,
      page: String(state.page),
      limit: String(state.limit),
    });
    return fetch('/api/sp500/list?' + params.toString())
      .then((res) => {
        if (!res.ok) throw new Error('Erreur chargement');
        return res.json();
      });
  }

  function renderRows(items) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!items || items.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" class="sp500-empty">Aucun résultat.</td>';
      tbody.appendChild(tr);
      return;
    }
    items.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = 'sp500-row';
      tr.dataset.ticker = row.symbol;
      tr.innerHTML =
        '<td class="sp500-name">' + escapeHtml(row.name) + '</td>' +
        '<td class="sp500-ticker"><code>' + escapeHtml(row.symbol) + '</code>' +
        (row.is_pro ? ' <span class="sp500-badge-pro">Pro</span>' : '') + '</td>' +
        '<td class="sp500-sector">' + escapeHtml(row.sector) + '</td>' +
        '<td class="sp500-industry">' + escapeHtml(row.industry) + '</td>' +
        '<td class="sp500-action"><a href="' + getAnalysisUrl(row.symbol) + '" class="sp500-btn-analyze">Analyser</a></td>';
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.sp500-btn-analyze')) return;
        window.location.href = getAnalysisUrl(row.symbol);
      });
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateMeta(total) {
    state.total = total;
    if (!metaEl) return;
    const start = total === 0 ? 0 : (state.page - 1) * state.limit + 1;
    const end = Math.min(state.page * state.limit, total);
    metaEl.textContent = total === 0 ? 'Aucun résultat' : total + ' entreprise(s) · Affichage ' + start + '–' + end;
  }

  function updatePagination() {
    const totalPages = Math.ceil(state.total / state.limit) || 1;
    if (!paginationEl) return;
    if (totalPages <= 1) {
      paginationEl.hidden = true;
      return;
    }
    paginationEl.hidden = false;
    if (pageInfoEl) {
      pageInfoEl.textContent = 'Page ' + state.page + ' / ' + totalPages;
    }
    if (prevBtn) {
      prevBtn.disabled = state.page <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = state.page >= totalPages;
    }
  }

  function setLoading(loading) {
    if (loadingRow) loadingRow.style.display = loading ? 'table-row' : 'none';
    if (tbody && !loading) {
      const rows = tbody.querySelectorAll('.sp500-row, .sp500-empty, .sp500-error-row');
      rows.forEach((r) => r.remove());
    }
  }

  function showError(message, withRetry) {
    if (!tbody) return;
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'sp500-error-row';
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'sp500-error';
    td.innerHTML = message + (withRetry ? ' <button type="button" class="sp500-btn-retry">Réessayer</button>' : '');
    tr.appendChild(td);
    tbody.appendChild(tr);
    if (withRetry) {
      const btn = td.querySelector('.sp500-btn-retry');
      if (btn) btn.addEventListener('click', function () { load(); });
    }
    updateMeta(0);
    updatePagination();
  }

  function load() {
    setLoading(true);
    fetchList()
      .then((data) => {
        setLoading(false);
        if (data.error_message && (!data.items || data.items.length === 0)) {
          showError(data.error_message, true);
          return;
        }
        renderRows(data.items || []);
        updateMeta(data.total ?? 0);
        updatePagination();
      })
      .catch(() => {
        setLoading(false);
        showError('Impossible de charger la liste. Réessayez plus tard.', true);
      });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(state.searchDebounce);
      state.searchDebounce = setTimeout(() => {
        state.page = 1;
        load();
      }, 280);
    });
  }

  document.querySelectorAll('.sp500-sort').forEach((btn) => {
    btn.addEventListener('click', () => {
      const col = btn.closest('th');
      const sortKey = col && col.dataset.sort;
      if (!sortKey) return;
      if (state.sort === sortKey) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = sortKey;
        state.order = 'asc';
      }
      state.page = 1;
      document.querySelectorAll('.sp500-th').forEach((th) => {
        th.classList.remove('sp500-sort--asc', 'sp500-sort--desc');
        if (th.dataset.sort === state.sort) {
          th.classList.add(state.order === 'asc' ? 'sp500-sort--asc' : 'sp500-sort--desc');
        }
      });
      load();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        load();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.page < Math.ceil(state.total / state.limit)) {
        state.page++;
        load();
      }
    });
  }

  load();
})();
