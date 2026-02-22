/**
 * API S&P 500 : liste statique (fichier data/sp500.json).
 * GET /api/sp500/list?q=&sort=name|ticker|sector&order=asc|desc&page=1&limit=50
 */

const path = require('path');
const fs = require('fs');
const express = require('express');

const router = express.Router();

const DATA_PATH = path.join(__dirname, '..', 'data', 'sp500.json');

// Liste en mémoire, chargée une fois au démarrage
let staticList = [];

function loadStaticList() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    staticList = Array.isArray(data) ? data : [];
  } catch (err) {
    staticList = [];
  }
}

loadStaticList();

// GET /api/sp500/list
router.get('/list', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const sort = (req.query.sort || 'name').toLowerCase();
    const order = (req.query.order || 'asc').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const sortCol = { name: 'name', ticker: 'symbol', sector: 'sector' }[sort] || 'name';
    const asc = order !== 'desc';

    let items = staticList.slice();
    if (q) {
      const lower = q.toLowerCase();
      items = items.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(lower)) ||
          (r.symbol && r.symbol.toLowerCase().includes(lower))
      );
    }
    const total = items.length;
    const collator = new Intl.Collator('fr');
    items.sort((a, b) => {
      const aVal = a[sortCol] || '';
      const bVal = b[sortCol] || '';
      return asc ? collator.compare(aVal, bVal) : collator.compare(bVal, aVal);
    });
    const paginated = items.slice(offset, offset + limit);
    res.json({
      items: paginated.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        sector: r.sector,
        industry: r.industry,
        is_pro: !!r.is_pro,
      })),
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('SP500 list:', err.message);
    res.status(500).json({ error: 'Erreur lors du chargement de la liste.' });
  }
});

module.exports = { router };
