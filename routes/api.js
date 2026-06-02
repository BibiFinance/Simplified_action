/**
 * Routes API publiques (recherche, actualités RSS, etc.)
 * GET /api/search?q=... → Finnhub + score (détails réservés Premium si JWT)
 * GET /api/notations/history?ticker=... → historique des scores en BDD
 * GET /api/news?ticker=... → flux RSS Yahoo Finance
 */

const express = require('express');
const Parser = require('rss-parser');
const finnhub = require('../lib/finnhub');
const db = require('../lib/db');
const { computeScore, getScoreExplanation, VERSION_ALGO } = require('../lib/score');
const { getPremiumStatusFromRequest } = require('../lib/premium');

const router = express.Router();
const rssParser = new Parser({ timeout: 10000 });

const YAHOO_RSS_BASE = 'https://finance.yahoo.com/rss/headline';

const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

const newsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function persistScoreHistory(data) {
  if (!db.isConfigured()) return;
  try {
    await db.saveSearchScore({
      ticker: data.ticker,
      entreprise: data.entreprise,
      secteur: data.secteur,
      score_simplifie: data.score_simplifie,
      rendement: data.rendement,
      risque: data.risque,
      version_algo: VERSION_ALGO,
    });
  } catch (err) {
    console.error('Historique notation:', err.message);
  }
}

function buildClientResponse(data, isPremium, extra = {}) {
  const base = {
    ticker: data.ticker,
    entreprise: data.entreprise,
    secteur: data.secteur,
    score_simplifie: data.score_simplifie,
    source: data.source,
    temps_reel: data.temps_reel,
    isPremium: !!isPremium,
    ...extra,
  };
  if (isPremium) {
    return {
      ...base,
      rendement: data.rendement,
      risque: data.risque,
      version_algo: VERSION_ALGO,
      explication: getScoreExplanation(data),
    };
  }
  return {
    ...base,
    premium_required_for_details: true,
  };
}

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
    source: 'fallback',
    temps_reel: false,
  };
}

// GET /api/notations/history?ticker=AAPL — historique en BDD (détails complets si Premium)
router.get('/notations/history', async (req, res) => {
  const ticker = (req.query.ticker || '').trim();
  if (!ticker) {
    return res.status(400).json({ error: 'Paramètre ticker requis.' });
  }
  const { isPremium } = await getPremiumStatusFromRequest(req);
  const limit = isPremium ? 15 : 3;
  const items = db.isConfigured()
    ? await db.getNotationHistoryByTicker(ticker, limit)
    : [];
  res.json({
    ticker: ticker.toUpperCase(),
    items,
    isPremium,
    premium_required_for_full_history: !isPremium,
    message: isPremium
      ? null
      : 'Historique limité (3 entrées). Passez en Premium pour l’historique complet.',
  });
});

// GET /api/search?q=AAPL ou "Apple"
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Paramètre q (recherche) requis.' });
  }

  const { isPremium } = await getPremiumStatusFromRequest(req);
  const cacheKey = q.toUpperCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.date < SEARCH_CACHE_TTL_MS) {
    return res.json(
      buildClientResponse(cached.data, isPremium, {
        source: 'cache',
        temps_reel: cached.data.temps_reel === true,
        cache_age_sec: Math.round((Date.now() - cached.date) / 1000),
      })
    );
  }

  const key = finnhub.getApiKey();
  if (!key) {
    return res.json(buildClientResponse(fallbackSearch(q), isPremium));
  }

  try {
    const searchRes = await finnhub.search(q);
    const first = searchRes?.result?.find((r) => r.type === 'Common Stock' || !r.type);
    let symbol = first ? (first.symbol || first.displaySymbol) : null;
    const description = first?.description || q;
    if (!symbol) {
      symbol = q.toUpperCase();
    }

    const [quoteRes, profileRes] = await Promise.all([
      finnhub.quote(symbol),
      finnhub.companyProfile(symbol),
    ]);

    if (!quoteRes || typeof quoteRes.c !== 'number') {
      const fallback = fallbackSearch(q);
      fallback.ticker = symbol;
      fallback.entreprise = description;
      return res.json(buildClientResponse(fallback, isPremium));
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
      source: 'finnhub',
      temps_reel: true,
    };
    await persistScoreHistory(data);
    searchCache.set(cacheKey, { data, date: Date.now() });
    res.json(buildClientResponse(data, isPremium));
  } catch (err) {
    console.error('Finnhub search:', err.message);
    res.json(buildClientResponse(fallbackSearch(q), isPremium));
  }
});

// GET /api/news?ticker=AAPL
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
      resume: item.contentSnippet || item.content
        ? String(item.content).replace(/<[^>]+>/g, '').slice(0, 200)
        : '',
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
