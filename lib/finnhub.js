/**
 * Client API Finnhub (étape 4)
 * Recherche, cours (quote), profil entreprise.
 * Clé API à définir dans .env : FINNHUB_API_KEY
 */

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function getApiKey() {
  return process.env.FINNHUB_API_KEY || '';
}

async function request(path, params = {}) {
  const key = getApiKey();
  if (!key) return null;
  const url = new URL(FINNHUB_BASE + path);
  url.searchParams.set('token', key);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Recherche de symboles (ex: "apple" -> AAPL, etc.)
 * @returns { count, result: [ { description, displaySymbol, symbol, type } ] } ou null
 */
async function search(q) {
  if (!q || !q.trim()) return null;
  return request('/search', { q: q.trim() });
}

/**
 * Cours actuel (quote)
 * @returns { c, d, dp, h, l, o, pc } (current, change, percent change, high, low, open, previous close) ou null
 */
async function quote(symbol) {
  if (!symbol || !symbol.trim()) return null;
  return request('/quote', { symbol: symbol.trim().toUpperCase() });
}

/**
 * Profil entreprise (secteur, nom, etc.)
 * @returns { name, finnhubIndustry, ... } ou null
 */
async function companyProfile(symbol) {
  if (!symbol || !symbol.trim()) return null;
  return request('/stock/profile2', { symbol: symbol.trim().toUpperCase() });
}

module.exports = {
  getApiKey,
  search,
  quote,
  companyProfile,
};
