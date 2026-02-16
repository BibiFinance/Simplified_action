/**
 * Routes API publiques (recherche, actualités RSS, etc.)
 * GET /api/search?q=... → Finnhub (recherche + quote + profil) + computeScore, avec cache
 * GET /api/news?ticker=... → flux RSS Yahoo Finance
 */

const express = require('express');
const Parser = require('rss-parser');
const finnhub = require('../lib/finnhub');
const { computeScore } = require('../lib/score');

const router = express.Router();
const rssParser = new Parser({ timeout: 10000 });

const YAHOO_RSS_BASE = 'https://finance.yahoo.com/rss/headline';

// Cache recherche (symbole ou requête -> { data, date }) pour limiter les appels Finnhub
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const newsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Réponse de secours si Finnhub indisponible ou sans clé
function fallbackSearch(q) {
  const ticker = q.length <= 5 ? q.toUpperCase() : q.slice(0, 4).toUpperCase();
  const entreprise = q.length > 5 ? q : `Entreprise ${q}`;
  const score = 5 + Math.random() * 5;
  return {
    ticker,
    entreprise,
    secteur: 'Technologie',
    score_simplifie: Math.round(score * 10) / 10,
    rendement: 2.4,
    risque: 0.6,
  };
}

// GET /api/search?q=AAPL ou "Apple" — Finnhub + notation automatique
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Paramètre q (recherche) requis.' });
  }

  const cacheKey = q.toUpperCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.date < SEARCH_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const key = finnhub.getApiKey();
  if (!key) {
    return res.json(fallbackSearch(q));
  }

  try {
    let symbol = q.length <= 5 ? q.toUpperCase() : null;
    let description = q;
    let sector = null;

    if (!symbol || q.length > 5) {
      const searchRes = await finnhub.search(q);
      const first = searchRes?.result?.find((r) => r.type === 'Common Stock' || !r.type);
      if (first) {
        symbol = first.symbol || first.displaySymbol || symbol;
        description = first.description || q;
      } else if (!symbol) {
        symbol = q.slice(0, 4).toUpperCase();
      }
    }

    const [quoteRes, profileRes] = await Promise.all([
      finnhub.quote(symbol),
      finnhub.companyProfile(symbol),
    ]);

    if (!quoteRes || typeof quoteRes.c !== 'number') {
      const fallback = fallbackSearch(q);
      fallback.ticker = symbol;
      fallback.entreprise = description;
      return res.json(fallback);
    }

    const profile = profileRes || {};
    const { score_simplifie, rendement, risque } = computeScore(quoteRes, profile);
    const entreprise = profile.name || description;
    const secteur = profile.finnhubIndustry || profile.industry || '—';

    const data = {
      ticker: symbol,
      entreprise,
      secteur,
      score_simplifie,
      rendement,
      risque,
    };
    searchCache.set(cacheKey, { data, date: Date.now() });
    res.json(data);
  } catch (err) {
    console.error('Finnhub search:', err.message);
    res.json(fallbackSearch(q));
  }
});

// GET /api/news?ticker=AAPL — actualités Yahoo Finance (flux RSS)
router.get('/news', async (req, res) => {
  const ticker = (req.query.ticker || '').trim().toUpperCase();
  if (!ticker) {
    return res.status(400).json({ error: 'Paramètre ticker requis (ex: AAPL).' });
  }

  const cached = newsCache.get(ticker);
  if (cached && Date.now() - cached.date < CACHE_TTL_MS) {
    return res.json({ ticker, source: 'Yahoo Finance', items: cached.items });
  }

  const url = `${YAHOO_RSS_BASE}?s=${encodeURIComponent(ticker)}`;
  try {
    const feed = await rssParser.parseURL(url);
    const items = (feed.items || []).slice(0, 10).map((item) => ({
      titre: item.title || '',
      url: item.link || '',
      resume: item.contentSnippet || item.content ? String(item.content).replace(/<[^>]+>/g, '').slice(0, 200) : '',
      date_publi: item.pubDate || null,
    }));
    newsCache.set(ticker, { items, date: Date.now() });
    res.json({ ticker, source: 'Yahoo Finance', items });
  } catch (err) {
    console.error('RSS Yahoo Finance:', err.message);
    res.status(502).json({
      error: 'Impossible de récupérer les actualités pour ce ticker.',
      items: [],
    });
  }
});

module.exports = router;
