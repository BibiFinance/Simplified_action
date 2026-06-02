/**
 * Détection du statut Premium à partir du JWT (optionnel sur les routes publiques).
 */

const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

async function getPremiumStatusFromRequest(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { isPremium: false, userId: null, email: null };
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.sub;
    if (!db.isConfigured()) {
      return { isPremium: false, userId, email: payload.email || null };
    }
    const subscription = await db.getActiveSubscriptionByUserId(userId);
    return {
      isPremium: !!subscription,
      userId,
      email: payload.email || null,
    };
  } catch {
    return { isPremium: false, userId: null, email: null };
  }
}

module.exports = { getPremiumStatusFromRequest };
