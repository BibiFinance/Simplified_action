/**
 * Stripe – abonnements (étape 6)
 * POST /api/stripe/create-checkout-session (créer session, rediriger vers Stripe Checkout)
 * POST /api/stripe/webhook (événements Stripe : mise à jour BDD)
 */

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const db = require('../lib/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Connectez-vous pour souscrire un abonnement.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' });
  }
}

async function syncSubscriptionForUser(userId, customerId, subscriptionId) {
  if (!db.isConfigured()) {
    console.warn('DATABASE_URL manquant : abonnement Stripe non enregistré');
    return false;
  }
  if (!subscriptionId) return false;

  if (customerId) await db.updateUserStripeCustomerId(userId, customerId);

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await db.saveSubscription(
    userId,
    sub.id,
    sub.items?.data[0]?.price?.id,
    sub.status,
    sub.current_period_end
  );
  return sub.status === 'active' || sub.status === 'trialing';
}

async function syncFromCheckoutSession(session, expectedUserId) {
  const metadataUserId = session.metadata?.user_id || session.subscription_data?.metadata?.user_id;
  if (metadataUserId && String(metadataUserId) !== String(expectedUserId)) {
    const err = new Error('Session incompatible avec ce compte.');
    err.status = 403;
    throw err;
  }

  const paid = session.payment_status === 'paid' || session.status === 'complete';
  if (!paid) return { synced: false, pending: true };

  await syncSubscriptionForUser(expectedUserId, session.customer, session.subscription);
  const subscription = await db.getActiveSubscriptionByUserId(expectedUserId);
  return { synced: true, isPremium: !!subscription };
}

// POST /api/stripe/create-checkout-session — créé une session Stripe Checkout (abonnement)
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Paiement non configuré (STRIPE_PRICE_ID).' });
  }

  const userId = req.user.sub;
  const email = req.user.email;
  const baseUrl = req.protocol + '://' + req.get('host');

  try {
    let customerId = null;
    if (db.isConfigured()) {
      const user = await db.getUserById(userId);
      customerId = user?.stripeCustomerId || null;
    }

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: baseUrl + '/compte.html?success=1&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/abonnements.html?cancel=1',
      subscription_data: { metadata: { user_id: String(userId) } },
      metadata: { user_id: String(userId) },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout:', err.message, err.code || '');
    let message = 'Impossible de créer la session de paiement.';
    if (err.type === 'StripeAuthenticationError') {
      message = 'Clé API Stripe invalide. Vérifiez STRIPE_SECRET_KEY dans .env.';
    } else if (err.type === 'StripeInvalidRequestError' && err.message) {
      if (err.message.includes('price') || err.message.includes('No such price')) {
        message = 'Tarif Stripe introuvable. Vérifiez STRIPE_PRICE_ID dans .env (ex. price_xxx).';
      } else {
        message = err.message;
      }
    } else if (err.message) {
      message = err.message;
    }
    res.status(500).json({ error: message });
  }
});

// POST /api/stripe/verify-session — confirme le paiement au retour de Stripe Checkout
router.post('/verify-session', authMiddleware, async (req, res) => {
  const sessionId = req.body?.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id requis.' });
  }
  if (!db.isConfigured()) {
    return res.status(503).json({
      error: 'Base de données non configurée. Définissez DATABASE_URL dans .env pour activer Premium.',
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));
    const result = await syncFromCheckoutSession(session, req.user.sub);
    if (result.pending) {
      return res.json({ isPremium: false, pending: true });
    }
    return res.json({ isPremium: result.isPremium });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Stripe verify-session:', err.message);
    return res.status(500).json({ error: 'Impossible de vérifier le paiement.' });
  }
});

// POST /api/stripe/webhook — reçu par Stripe (body brut pour signature)
function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET manquant');
    return res.status(200).send();
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature invalide:', err.message);
    return res.status(400).send('Webhook Error');
  }

  (async () => {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      let userId = session.metadata?.user_id;

      if (db.isConfigured() && (userId || customerId)) {
        let uid = userId ? parseInt(userId, 10) : null;
        if (!uid && customerId) uid = await db.getUserIdByStripeCustomerId(customerId);
        if (uid) {
          await syncSubscriptionForUser(uid, customerId, subscriptionId);
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      if (!db.isConfigured()) return;
      const userId = await db.getUserIdByStripeCustomerId(sub.customer);
      if (userId) {
        await syncSubscriptionForUser(userId, sub.customer, sub.id);
      }
    }
  })().catch((e) => console.error('Webhook handler:', e));

  res.status(200).send();
}

module.exports = { router, handleWebhook };
