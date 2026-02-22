/**
 * Connexion PostgreSQL (étape 5)
 * Utilisé pour users (et plus tard favoris, etc.).
 * Si DATABASE_URL n'est pas défini, les routes auth restent en mémoire.
 */

const { Pool } = require('pg');

let pool = null;
let initDone = false;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) return null;
  pool = new Pool({
    connectionString: url,
    ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  return pool;
}

function isConfigured() {
  return !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
}

async function ensureUsersTable() {
  const p = getPool();
  if (!p || initDone) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      stripe_customer_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  initDone = true;
}

async function query(sql, params = []) {
  const p = getPool();
  if (!p) return null;
  await ensureUsersTable();
  const res = await p.query(sql, params);
  return res;
}

async function getUserByEmail(email) {
  const res = await query('SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (!res || res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
  };
}

async function getUserById(id) {
  const res = await query('SELECT id, email, stripe_customer_id FROM users WHERE id = $1', [id]);
  if (!res || res.rows.length === 0) return null;
  const r = res.rows[0];
  return { id: r.id, email: r.email, stripeCustomerId: r.stripe_customer_id };
}

async function updateUserStripeCustomerId(userId, stripeCustomerId) {
  const res = await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2 RETURNING id',
    [stripeCustomerId, userId]
  );
  return res && res.rows.length > 0;
}

let stripeTableDone = false;
async function ensureStripeSubscriptionsTable() {
  const p = getPool();
  if (!p || stripeTableDone) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS stripe_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
      stripe_price_id VARCHAR(255),
      status VARCHAR(50),
      current_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  stripeTableDone = true;
}

async function saveSubscription(userId, stripeSubscriptionId, stripePriceId, status, currentPeriodEnd) {
  await ensureUsersTable();
  await ensureStripeSubscriptionsTable();
  await query(
    `INSERT INTO stripe_subscriptions (user_id, stripe_subscription_id, stripe_price_id, status, current_period_end)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (stripe_subscription_id) DO UPDATE SET status = $4, current_period_end = $5, stripe_price_id = $3`,
    [userId, stripeSubscriptionId, stripePriceId || null, status || 'active', currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null]
  );
}

async function getActiveSubscriptionByUserId(userId) {
  await ensureStripeSubscriptionsTable();
  const res = await query(
    `SELECT id, status, current_period_end FROM stripe_subscriptions
     WHERE user_id = $1 AND status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > NOW())
     ORDER BY current_period_end DESC NULLS LAST LIMIT 1`,
    [userId]
  );
  return res && res.rows.length > 0 ? res.rows[0] : null;
}

async function getUserIdByStripeCustomerId(stripeCustomerId) {
  const res = await query('SELECT id FROM users WHERE stripe_customer_id = $1', [stripeCustomerId]);
  return res && res.rows.length > 0 ? res.rows[0].id : null;
}

async function createUser(email, passwordHash) {
  const res = await query(
    'INSERT INTO users (email, password_hash) VALUES (LOWER($1), $2) RETURNING id, email, created_at',
    [email.trim().toLowerCase(), passwordHash]
  );
  if (!res || res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    email: r.email,
    passwordHash,
    createdAt: r.created_at,
  };
}

// --- S&P 500 ---
let sp500TableDone = false;
async function ensureSp500Table() {
  const p = getPool();
  if (!p || sp500TableDone) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS sp500_companies (
      symbol VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sector VARCHAR(120),
      industry VARCHAR(120),
      is_pro BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sp500TableDone = true;
}

async function getSp500List(options = {}) {
  const p = getPool();
  if (!p) return null;
  await ensureSp500Table();
  const { q = '', sort = 'name', order = 'asc', limit = 50, offset = 0 } = options;
  const ord = (order === 'desc') ? 'DESC' : 'ASC';
  const sortCol = { name: 'name', ticker: 'symbol', sector: 'sector' }[sort] || 'name';
  let sql = `SELECT symbol, name, sector, industry, is_pro FROM sp500_companies WHERE 1=1`;
  const params = [];
  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    sql += ` AND (name ILIKE $${params.length} OR symbol ILIKE $${params.length})`;
  }
  sql += ` ORDER BY ${sortCol} ${ord}`;
  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const res = await p.query(sql, params);
  const countRes = await p.query(
    q && q.trim()
      ? `SELECT COUNT(*)::int AS total FROM sp500_companies WHERE name ILIKE $1 OR symbol ILIKE $1`
      : `SELECT COUNT(*)::int AS total FROM sp500_companies`,
    q && q.trim() ? [`%${q.trim()}%`] : []
  );
  const total = countRes && countRes.rows[0] ? countRes.rows[0].total : 0;
  return {
    items: (res.rows || []).map((r) => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector,
      industry: r.industry,
      is_pro: !!r.is_pro,
    })),
    total,
    limit,
    offset,
  };
}

async function refreshSp500(rows) {
  const p = getPool();
  if (!p) return false;
  await ensureSp500Table();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM sp500_companies');
    for (const r of rows) {
      if (!r.symbol) continue;
      await client.query(
        `INSERT INTO sp500_companies (symbol, name, sector, industry) VALUES ($1, $2, $3, $4)
         ON CONFLICT (symbol) DO UPDATE SET name = $2, sector = $3, industry = $4, updated_at = CURRENT_TIMESTAMP`,
        [r.symbol, r.name || r.symbol, r.sector || '—', r.industry || '—']
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// --- Favoris ---
const favoritesMemory = new Map(); // userId -> [{ ticker, name }]

let favoritesTableDone = false;
async function ensureFavoritesTable() {
  const p = getPool();
  if (!p || favoritesTableDone) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      ticker VARCHAR(20) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, ticker)
    )
  `);
  favoritesTableDone = true;
}

async function addFavorite(userId, ticker, name) {
  const t = String(ticker).trim().toUpperCase();
  const n = (name || ticker || '').trim().slice(0, 255);
  const p = getPool();
  if (!p) {
    const list = favoritesMemory.get(userId) || [];
    const idx = list.findIndex((f) => f.ticker.toUpperCase() === t);
    if (idx >= 0) list[idx].name = n;
    else list.unshift({ ticker: t, name: n });
    favoritesMemory.set(userId, list);
    return { ticker: t, name: n };
  }
  await ensureUsersTable();
  await ensureFavoritesTable();
  const res = await p.query(
    `INSERT INTO favorites (user_id, ticker, name) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, ticker) DO UPDATE SET name = $3 RETURNING id, ticker, name`,
    [userId, t, n]
  );
  return res && res.rows[0] ? res.rows[0] : null;
}

async function removeFavorite(userId, ticker) {
  const t = String(ticker).trim().toUpperCase();
  const p = getPool();
  if (!p) {
    const list = favoritesMemory.get(userId) || [];
    const before = list.length;
    const next = list.filter((f) => f.ticker.toUpperCase() !== t);
    favoritesMemory.set(userId, next);
    return next.length < before;
  }
  await ensureFavoritesTable();
  const res = await p.query(
    'DELETE FROM favorites WHERE user_id = $1 AND UPPER(TRIM(ticker)) = UPPER(TRIM($2)) RETURNING id',
    [userId, ticker]
  );
  return res && res.rowCount > 0;
}

async function getFavorites(userId) {
  const p = getPool();
  if (!p) {
    return (favoritesMemory.get(userId) || []).slice();
  }
  await ensureFavoritesTable();
  const res = await p.query(
    'SELECT ticker, name FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return (res.rows || []).map((r) => ({ ticker: r.ticker, name: r.name || r.ticker }));
}

module.exports = {
  isConfigured,
  getPool,
  query,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserStripeCustomerId,
  saveSubscription,
  getActiveSubscriptionByUserId,
  getUserIdByStripeCustomerId,
  ensureSp500Table,
  getSp500List,
  refreshSp500,
  ensureFavoritesTable,
  addFavorite,
  removeFavorite,
  getFavorites,
};
