/**
 * API Favoris : liste, ajout, suppression (utilisateur connecté).
 * GET /api/favorites, POST /api/favorites, DELETE /api/favorites/:ticker
 */

const express = require('express');
const db = require('../lib/db');
const authRouter = require('./auth');
const authMiddleware = authRouter.authMiddleware;

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const list = await db.getFavorites(userId);
    res.json({ favorites: list });
  } catch (err) {
    console.error('Favorites list:', err.message);
    res.status(500).json({ error: 'Erreur lors du chargement des favoris.' });
  }
});

// GET /api/favorites/dashboard — favoris + dernières notations (étape 7)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const items = await db.getFavoritesDashboard(userId);
    const withScore = items.filter((i) => i.score_simplifie != null);
    const avgScore =
      withScore.length > 0
        ? Math.round(
            (withScore.reduce((s, i) => s + i.score_simplifie, 0) / withScore.length) * 10
          ) / 10
        : null;
    let isPremium = false;
    if (db.isConfigured()) {
      const sub = await db.getActiveSubscriptionByUserId(userId);
      isPremium = !!sub;
    }
    res.json({
      items,
      stats: {
        count: items.length,
        with_score: withScore.length,
        average_score: avgScore,
      },
      isPremium,
    });
  } catch (err) {
    console.error('Favorites dashboard:', err.message);
    res.status(500).json({ error: 'Erreur lors du chargement du dashboard.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const ticker = (req.body && req.body.ticker) ? String(req.body.ticker).trim() : '';
    if (!ticker) {
      return res.status(400).json({ error: 'Le ticker est requis.' });
    }
    const name = (req.body && req.body.name) ? String(req.body.name).trim() : ticker;
    const row = await db.addFavorite(userId, ticker, name);
    if (!row) {
      return res.status(500).json({ error: 'Impossible d\'ajouter le favori.' });
    }
    res.status(201).json({ favorite: { ticker: row.ticker, name: row.name } });
  } catch (err) {
    console.error('Favorites add:', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'ajout.' });
  }
});

router.delete('/:ticker', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const ticker = (req.params && req.params.ticker) ? String(req.params.ticker).trim() : '';
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker requis.' });
    }
    const removed = await db.removeFavorite(userId, ticker);
    res.json({ removed: !!removed });
  } catch (err) {
    console.error('Favorites remove:', err.message);
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

module.exports = { router };
