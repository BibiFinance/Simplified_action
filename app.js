/**
 * Application Express (création et configuration).
 * Exportée pour permettre les tests avec supertest sans démarrer le serveur.
 * Le point d'entrée en production est server.js.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const stripe = require('./routes/stripe');
const { router: sp500Router } = require('./routes/sp500');
const { router: favoritesRouter } = require('./routes/favorites');
const app = express();

app.use(cors({ origin: true, credentials: true }));

// Webhook Stripe : body brut (avant express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripe.handleWebhook);

app.use(express.json());

// Stripe Checkout (avant static)
app.use('/api/stripe', stripe.router);

// Fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/sp500', sp500Router);
app.use('/api/favorites', favoritesRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

// Fallback : renvoyer index.html pour les routes SPA / deep links
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

module.exports = app;
