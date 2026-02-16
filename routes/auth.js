/**
 * Routes d'authentification (Étape 5 avec BDD)
 * POST /auth/register, POST /auth/login, GET /auth/me
 * Mots de passe hashés avec Argon2 (ES02). Session = JWT.
 * Si DATABASE_URL est défini → PostgreSQL ; sinon → mémoire.
 */

const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../lib/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Fallback mémoire si pas de BDD
const usersMemory = new Map();

function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const emailNorm = String(email).trim().toLowerCase();

    if (db.isConfigured()) {
      const existing = await db.getUserByEmail(emailNorm);
      if (existing) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
      }
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      const user = await db.createUser(emailNorm, passwordHash);
      if (!user) {
        return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
      }
      const token = createToken(user);
      return res.status(201).json({
        message: 'Compte créé.',
        token,
        user: { id: user.id, email: user.email },
      });
    }

    if (usersMemory.has(emailNorm)) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const id = usersMemory.size + 1;
    const user = { id, email: emailNorm, passwordHash, createdAt: new Date().toISOString() };
    usersMemory.set(emailNorm, user);
    const token = createToken(user);
    res.status(201).json({
      message: 'Compte créé.',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const emailNorm = String(email).trim().toLowerCase();

    if (db.isConfigured()) {
      const user = await db.getUserByEmail(emailNorm);
      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }
      const ok = await argon2.verify(user.passwordHash, password);
      if (!ok) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      }
      const token = createToken({ id: user.id, email: user.email });
      return res.json({
        token,
        user: { id: user.id, email: user.email },
      });
    }

    const user = usersMemory.get(emailNorm);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const token = createToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

// GET /auth/me (protégé)
router.get('/me', authMiddleware, async (req, res) => {
  const id = req.user.sub;
  const email = req.user.email;

  if (db.isConfigured()) {
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' });
    }
    return res.json({ user: { id: user.id, email: user.email } });
  }

  const emailNorm = email?.toLowerCase();
  const user = usersMemory.get(emailNorm);
  if (!user) {
    return res.status(401).json({ error: 'Utilisateur introuvable.' });
  }
  res.json({ user: { id: user.id, email: user.email } });
});

module.exports = router;
