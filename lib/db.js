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
  const res = await query('SELECT id, email FROM users WHERE id = $1', [id]);
  if (!res || res.rows.length === 0) return null;
  const r = res.rows[0];
  return { id: r.id, email: r.email };
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

module.exports = {
  isConfigured,
  getPool,
  query,
  getUserByEmail,
  getUserById,
  createUser,
};
