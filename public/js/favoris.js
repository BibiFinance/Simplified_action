/**
 * Page Mes favoris : liste, lien vers analyse, suppression.
 */
(function () {
  const token = window.simplifiedAuth?.getToken?.();
  const loginRequired = document.getElementById('favoris-login-required');
  const content = document.getElementById('favoris-content');
  const listEl = document.getElementById('favoris-list');
  const metaEl = document.getElementById('favoris-meta');
  const emptyEl = document.getElementById('favoris-empty');

  function getAnalysisUrl(ticker) {
    return 'index.html?q=' + encodeURIComponent(ticker);
  }

  function loadFavorites() {
    if (!token) {
      if (loginRequired) loginRequired.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    if (loginRequired) loginRequired.hidden = true;
    if (content) content.hidden = false;
    if (listEl) listEl.innerHTML = '';

    fetch('/api/favorites', {
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(function (res) {
        if (res.status === 401) {
          window.simplifiedAuth?.removeToken?.();
          if (loginRequired) loginRequired.hidden = false;
          if (content) content.hidden = true;
          return { favorites: [] };
        }
        return res.json();
      })
      .then(function (data) {
        const favorites = data.favorites || [];
        if (metaEl) metaEl.textContent = favorites.length + ' favori(s).';
        if (emptyEl) emptyEl.hidden = favorites.length > 0;

        if (!listEl) return;
        favorites.forEach(function (item) {
          const li = document.createElement('li');
          li.className = 'favoris-item';
          li.innerHTML =
            '<div class="favoris-item-info">' +
            '<span class="favoris-item-ticker">' + escapeHtml(item.ticker) + '</span>' +
            (item.name ? '<br><span class="favoris-item-name">' + escapeHtml(item.name) + '</span>' : '') +
            '</div>' +
            '<div class="favoris-item-actions">' +
            '<a href="' + getAnalysisUrl(item.ticker) + '" class="favoris-btn-analyze">Analyser</a>' +
            '<button type="button" class="favoris-btn-remove" data-ticker="' + escapeHtml(item.ticker) + '" aria-label="Retirer des favoris">Retirer</button>' +
            '</div>';
          listEl.appendChild(li);

          const removeBtn = li.querySelector('.favoris-btn-remove');
          if (removeBtn) {
            removeBtn.addEventListener('click', function () {
              removeFavorite(item.ticker, li);
            });
          }
        });
      })
      .catch(function () {
        if (metaEl) metaEl.textContent = 'Erreur lors du chargement.';
      });
  }

  function removeFavorite(ticker, listItem) {
    if (!token) return;
    fetch('/api/favorites/' + encodeURIComponent(ticker), {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        if (listItem && listItem.parentNode) listItem.remove();
        const items = listEl ? listEl.querySelectorAll('.favoris-item') : [];
        if (metaEl) metaEl.textContent = items.length + ' favori(s).';
        if (emptyEl) emptyEl.hidden = items.length > 0;
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
    document.addEventListener('DOMContentLoaded', loadFavorites);
  } else {
    loadFavorites();
  }
})();
