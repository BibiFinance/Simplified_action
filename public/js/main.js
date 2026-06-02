/**
 * Simplifiedaction – Recherche d'action (nom ou ticker)
 * GET /api/search?q=... (JWT optionnel pour détails Premium)
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

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open);
    });
  }

  function getAuthHeaders() {
    const token =
      window.simplifiedAuth && window.simplifiedAuth.getToken && window.simplifiedAuth.getToken();
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  async function searchAction(query) {
    const q = String(query).trim();
    if (!q) return null;

    const url = '/api/search?q=' + encodeURIComponent(q);
    try {
      const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(res.status === 404 ? 'Aucune action trouvée.' : 'Erreur serveur.');
      return res.json();
    } catch (err) {
      if (err.message && err.message.includes('serveur')) throw err;
      return {
        ticker: q.length <= 5 ? q.toUpperCase() : 'DEMO',
        entreprise: q,
        secteur: 'Technologie',
        score_simplifie: 7.2,
        source: 'fallback',
        temps_reel: false,
        premium_required_for_details: true,
      };
    }
  }

  function formatDataSource(data) {
    if (data.source === 'finnhub' || data.temps_reel === true) {
      return 'Données temps réel (Finnhub)';
    }
    if (data.source === 'cache') {
      var age = data.cache_age_sec != null ? ' — cache ' + data.cache_age_sec + ' s' : '';
      return data.temps_reel
        ? 'Données Finnhub (mise en cache)' + age
        : 'Données en cache (origine dégradée)' + age;
    }
    if (data.source === 'fallback') {
      return 'Mode dégradé (données simulées, pas Finnhub)';
    }
    return '';
  }

  function buildPremiumDetailsHtml(data) {
    if (data.isPremium && data.rendement != null) {
      return (
        '<div class="score-details">' +
        '<h3 class="score-details-title">Analyse détaillée (Premium)</h3>' +
        '<div class="score-details-grid">' +
        '<p class="score-details-item"><strong>Rendement (variation)</strong>' +
        escapeHtml(String(data.rendement)) +
        ' %</p>' +
        '<p class="score-details-item"><strong>Risque (volatilité)</strong>' +
        escapeHtml(String(Math.round((data.risque || 0) * 100))) +
        ' %</p>' +
        '<p class="score-details-item"><strong>Algorithme</strong>v' +
        escapeHtml(data.version_algo || '1.0') +
        '</p></div>' +
        (data.explication
          ? '<p class="score-details-explication">' + escapeHtml(data.explication) + '</p>'
          : '') +
        '</div>'
      );
    }
    return (
      '<div class="score-details score-details--locked">' +
      '<h3 class="score-details-title">Analyse détaillée</h3>' +
      '<p class="score-details-explication">Réservée aux abonnés Premium : rendement, risque, explication de l’algorithme et historique complet.</p>' +
      '<a href="abonnements.html" class="btn btn--primary" style="margin-top:0.5rem;display:inline-block">Passer en Premium</a>' +
      '</div>'
    );
  }

  function loadNotationHistory(ticker) {
    return fetch('/api/notations/history?ticker=' + encodeURIComponent(ticker), {
      headers: getAuthHeaders(),
    })
      .then(function (res) {
        return res.json();
      })
      .catch(function () {
        return { items: [] };
      });
  }

  function buildHistoryHtml(historyData) {
    const items = historyData.items || [];
    if (items.length === 0) {
      return (
        '<div class="history-block">' +
        '<h3 class="history-block-title">Historique des notations</h3>' +
        '<p class="history-hint">Aucun calcul enregistré pour ce ticker. Relancez une recherche pour alimenter l’historique.</p>' +
        '</div>'
      );
    }
    var rows = items
      .map(function (item) {
        var date = item.date_calcul
          ? new Date(item.date_calcul).toLocaleString('fr-FR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—';
        return (
          '<li class="history-item">' +
          '<span class="history-item-score">' +
          (item.note_globale != null ? Number(item.note_globale).toFixed(1) : '—') +
          '/10</span>' +
          '<span>' +
          escapeHtml(date) +
          (item.version_algo ? ' · v' + escapeHtml(item.version_algo) : '') +
          '</span></li>'
        );
      })
      .join('');
    var hint = historyData.premium_required_for_full_history
      ? '<p class="history-hint">' +
        escapeHtml(historyData.message || '') +
        ' <a href="abonnements.html">Premium</a></p>'
      : '';
    return (
      '<div class="history-block">' +
      '<h3 class="history-block-title">Historique des notations</h3>' +
      '<ul class="history-list">' +
      rows +
      '</ul>' +
      hint +
      '</div>'
    );
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
    const score =
      data.score_simplifie != null
        ? Number(data.score_simplifie)
        : data.note_globale != null
          ? Number(data.note_globale)
          : null;

    var token = window.simplifiedAuth && window.simplifiedAuth.getToken && window.simplifiedAuth.getToken();
    var favoriteBtn = '';
    if (token && ticker && ticker !== '—') {
      favoriteBtn =
        '<p class="card-action-fav"><button type="button" class="btn-favorite" data-ticker="' +
        escapeHtml(ticker) +
        '" data-name="' +
        escapeHtml(name) +
        '">★ Ajouter aux favoris</button></p>';
    }

    resultsContent.innerHTML =
      '<div class="card-action">' +
      '<div class="card-action-header">' +
      '<span class="card-action-ticker">' +
      escapeHtml(ticker) +
      '</span>' +
      '<span class="card-action-name">' +
      escapeHtml(name) +
      '</span>' +
      (data.isPremium ? ' <span class="badge badge--premium">Premium</span>' : '') +
      '</div>' +
      (secteur ? '<p class="card-action-meta">Secteur : ' + escapeHtml(secteur) + '</p>' : '') +
      '<div class="score-block">' +
      '<span class="score-label">Score simplifié</span>' +
      '<span class="score-value">' +
      (score != null ? score.toFixed(1) : '—') +
      '</span></div>' +
      (data.source ? '<p class="card-action-meta card-action-source">' + formatDataSource(data) + '</p>' : '') +
      buildPremiumDetailsHtml(data) +
      '<div id="history-placeholder">Chargement de l’historique…</div>' +
      favoriteBtn +
      '</div>';

    var btn = resultsContent.querySelector('.btn-favorite');
    if (btn) {
      btn.addEventListener('click', function () {
        var t = btn.getAttribute('data-ticker');
        var n = btn.getAttribute('data-name') || t;
        var tok = window.simplifiedAuth && window.simplifiedAuth.getToken && window.simplifiedAuth.getToken();
        if (!tok || !t) return;
        btn.disabled = true;
        fetch('/api/favorites', {
          method: 'POST',
          headers: Object.assign(
            { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
            {}
          ),
          body: JSON.stringify({ ticker: t, name: n }),
        })
          .then(function (res) {
            return res.json();
          })
          .then(function () {
            btn.textContent = '✓ Ajouté aux favoris';
            btn.classList.add('btn-favorite--added');
          })
          .catch(function () {
            btn.disabled = false;
          });
      });
    }

    if (ticker && ticker !== '—') {
      loadNotationHistory(ticker).then(function (historyData) {
        var el = document.getElementById('history-placeholder');
        if (el) el.outerHTML = buildHistoryHtml(historyData);
      });
    }

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
        newsList.innerHTML =
          '<li class="news-item news-item--empty">Aucune actualité récente pour ce ticker.</li>';
      } else {
        newsList.innerHTML = items
          .map(function (item) {
            const title = escapeHtml(item.titre || 'Sans titre');
            const url = (item.url || '').trim();
            const link = url
              ? '<a href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener noreferrer" class="news-item-link">' +
                title +
                '</a>'
              : '<span>' + title + '</span>';
            const date = item.date_publi
              ? '<time class="news-item-date">' + escapeHtml(item.date_publi) + '</time>'
              : '';
            return '<li class="news-item">' + link + (date ? ' ' + date : '') + '</li>';
          })
          .join('');
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

  var urlQ = new URLSearchParams(window.location.search).get('q');
  if (urlQ && urlQ.trim()) {
    input.value = urlQ.trim();
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
})();
