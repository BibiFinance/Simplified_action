/**
 * Simplifiedaction – Recherche d'action (nom ou ticker)
 * Appel API backend à venir : GET /api/search?q=...
 */

(function () {
  'use strict';

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const resultsSection = document.getElementById('results');
  const resultsContent = document.getElementById('results-content');
  const placeholderSection = document.getElementById('results-placeholder');
  const errorSection = document.getElementById('results-error');
  const errorBox = document.getElementById('error-box');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (!form || !input) return;

  // Menu mobile
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open);
    });
  }

  /**
   * Appel API recherche GET /api/search?q=...
   * Utilise l'origine actuelle si servie par le backend (npm start), sinon simulation locale.
   */
  async function searchAction(query) {
    const q = String(query).trim();
    if (!q) return null;

    const url = '/api/search?q=' + encodeURIComponent(q);
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(res.status === 404 ? 'Aucune action trouvée.' : 'Erreur serveur.');
      return res.json();
    } catch (err) {
      if (err.message && err.message.includes('serveur')) throw err;
      // Pas de backend (fichier ouvert en local) : simulation
      return {
        ticker: q.length <= 5 ? q.toUpperCase() : 'DEMO',
        entreprise: q,
        secteur: 'Technologie',
        score_simplifie: 7.2,
        rendement: 2.4,
        risque: 0.6
      };
    }
  }

  function showError(message) {
    if (errorBox) errorBox.textContent = message;
    if (errorSection) errorSection.hidden = false;
    if (resultsSection) resultsSection.hidden = true;
    if (placeholderSection) placeholderSection.hidden = true;
  }

  const newsBlock = document.getElementById('news-block');
  const newsList = document.getElementById('news-list');
  const newsSource = document.getElementById('news-source');
  const newsLoading = document.getElementById('news-loading');
  const newsError = document.getElementById('news-error');

  function showResults(data) {
    if (errorSection) errorSection.hidden = true;
    if (placeholderSection) placeholderSection.hidden = true;
    if (!resultsContent || !resultsSection) return;

    const ticker = data.ticker || '—';
    const name = data.entreprise || data.name || '—';
    const secteur = data.secteur || '';
    const score = data.score_simplifie != null ? Number(data.score_simplifie) : (data.note_globale != null ? Number(data.note_globale) : null);

    resultsContent.innerHTML =
      '<div class="card-action">' +
        '<div class="card-action-header">' +
          '<span class="card-action-ticker">' + escapeHtml(ticker) + '</span>' +
          '<span class="card-action-name">' + escapeHtml(name) + '</span>' +
        '</div>' +
        (secteur ? '<p class="card-action-meta">Secteur : ' + escapeHtml(secteur) + '</p>' : '') +
        '<div class="score-block">' +
          '<span class="score-label">Score simplifié</span>' +
          '<span class="score-value">' + (score != null ? score.toFixed(1) : '—') + '</span>' +
        '</div>' +
      '</div>';

    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (newsBlock && newsList && ticker !== '—') {
      loadNews(ticker);
    } else if (newsBlock) {
      newsBlock.hidden = true;
    }
  }

  async function loadNews(ticker) {
    if (!newsBlock || !newsList) return;
    newsBlock.hidden = false;
    if (newsLoading) newsLoading.hidden = false;
    if (newsError) newsError.hidden = true;
    newsList.innerHTML = '';

    try {
      const res = await fetch('/api/news?ticker=' + encodeURIComponent(ticker));
      const data = await res.json();
      if (newsLoading) newsLoading.hidden = true;
      if (newsSource) newsSource.textContent = '(' + (data.source || 'Yahoo Finance') + ')';
      if (!res.ok) {
        if (newsError) {
          newsError.textContent = data.error || 'Actualités indisponibles.';
          newsError.hidden = false;
        }
        return;
      }
      const items = data.items || [];
      if (items.length === 0) {
        newsList.innerHTML = '<li class="news-item news-item--empty">Aucune actualité récente pour ce ticker.</li>';
      } else {
        newsList.innerHTML = items.map(function (item) {
          const title = escapeHtml(item.titre || 'Sans titre');
          const url = (item.url || '').trim();
          const link = url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="news-item-link">' + title + '</a>' : '<span>' + title + '</span>';
          const date = item.date_publi ? '<time class="news-item-date">' + escapeHtml(item.date_publi) + '</time>' : '';
          return '<li class="news-item">' + link + (date ? ' ' + date : '') + '</li>';
        }).join('');
      }
    } catch (err) {
      if (newsLoading) newsLoading.hidden = true;
      if (newsError) {
        newsError.textContent = 'Impossible de charger les actualités.';
        newsError.hidden = false;
      }
    }
  }

  function showPlaceholder() {
    if (errorSection) errorSection.hidden = true;
    if (resultsSection) resultsSection.hidden = true;
    if (placeholderSection) placeholderSection.hidden = false;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setLoading(loading) {
    const btn = form.querySelector('.search-btn');
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.querySelector('.search-btn-text').textContent = 'Recherche…';
    } else {
      btn.disabled = false;
      btn.querySelector('.search-btn-text').textContent = 'Rechercher';
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    setLoading(true);
    showPlaceholder();

    try {
      const data = await searchAction(q);
      if (data) {
        showResults(data);
      } else {
        showError('Aucun résultat. Vérifiez le nom ou le ticker.');
      }
    } catch (err) {
      showError(err.message || 'Impossible d’effectuer la recherche. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  });
})();
