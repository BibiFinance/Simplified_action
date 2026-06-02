/**
 * Dashboard favoris : stats, tableau avec dernières notations, suppression.
 */
(function () {
  const token = window.simplifiedAuth?.getToken?.();
  const loginRequired = document.getElementById('favoris-login-required');
  const content = document.getElementById('favoris-content');
  const tbody = document.getElementById('favoris-tbody');
  const statsEl = document.getElementById('dashboard-stats');
  const metaEl = document.getElementById('favoris-meta');
  const emptyEl = document.getElementById('favoris-empty');
  const premiumHint = document.getElementById('dashboard-premium-hint');

  function getAnalysisUrl(ticker) {
    return 'index.html?q=' + encodeURIComponent(ticker);
  }

  function formatDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  function renderStats(stats) {
    if (!statsEl || !stats) return;
    statsEl.innerHTML =
      '<div class="dashboard-stat-card">' +
      '<span class="dashboard-stat-value">' + stats.count + '</span>' +
      '<span class="dashboard-stat-label">Favoris</span></div>' +
      '<div class="dashboard-stat-card">' +
      '<span class="dashboard-stat-value">' + (stats.with_score || 0) + '</span>' +
      '<span class="dashboard-stat-label">Avec notation</span></div>' +
      '<div class="dashboard-stat-card">' +
      '<span class="dashboard-stat-value">' +
      (stats.average_score != null ? stats.average_score.toFixed(1) : '—') +
      '</span>' +
      '<span class="dashboard-stat-label">Score moyen</span></div>';
  }

  function loadDashboard() {
    if (!token) {
      if (loginRequired) loginRequired.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    if (loginRequired) loginRequired.hidden = true;
    if (content) content.hidden = false;
    if (tbody) tbody.innerHTML = '';

    fetch('/api/favorites/dashboard', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(function (res) {
        if (res.status === 401) {
          window.simplifiedAuth?.removeToken?.();
          if (loginRequired) loginRequired.hidden = false;
          if (content) content.hidden = true;
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        const items = data.items || [];
        renderStats(data.stats);
        if (metaEl) {
          metaEl.textContent =
            items.length + ' action(s) dans votre watchlist.' +
            (data.isPremium ? ' Compte Premium actif.' : '');
        }
        if (premiumHint) premiumHint.hidden = !!data.isPremium;
        if (emptyEl) emptyEl.hidden = items.length > 0;

        if (!tbody) return;
        items.forEach(function (item) {
          const tr = document.createElement('tr');
          const score =
            item.score_simplifie != null
              ? '<span class="dashboard-score">' + Number(item.score_simplifie).toFixed(1) + '</span>'
              : '<span class="dashboard-score dashboard-score--na">—</span>';
          tr.innerHTML =
            '<td><code>' + escapeHtml(item.ticker) + '</code></td>' +
            '<td>' + escapeHtml(item.name || item.ticker) + '</td>' +
            '<td>' + escapeHtml(item.secteur || '—') + '</td>' +
            '<td>' + score + '</td>' +
            '<td class="dashboard-date">' + escapeHtml(formatDate(item.date_calcul)) + '</td>' +
            '<td class="dashboard-actions">' +
            '<a href="' + getAnalysisUrl(item.ticker) + '" class="favoris-btn-analyze">Analyser</a> ' +
            '<button type="button" class="favoris-btn-remove" data-ticker="' +
            escapeHtml(item.ticker) +
            '">Retirer</button></td>';
          tbody.appendChild(tr);
          tr.querySelector('.favoris-btn-remove')?.addEventListener('click', function () {
            removeFavorite(item.ticker, tr);
          });
        });
      })
      .catch(function () {
        if (metaEl) metaEl.textContent = 'Erreur lors du chargement du dashboard.';
      });
  }

  function removeFavorite(ticker, row) {
    if (!token) return;
    fetch('/api/favorites/' + encodeURIComponent(ticker), {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function () {
        if (row && row.parentNode) row.remove();
        loadDashboard();
      })
      .catch(function () {});
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboard);
  } else {
    loadDashboard();
  }
})();
