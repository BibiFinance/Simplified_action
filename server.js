/**
 * Simplifiedaction – Serveur Express
 * Sert le frontend public/ et expose les routes API + Stripe.
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
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));

// Webhook Stripe : body brut (avant express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripe.handleWebhook);

app.use(express.json());

// Stripe Checkout (avant static)
app.use('/api/stripe', stripe.router);

// Fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Routes API (sp500 et favorites avant api pour que les sous-routes soient prises en charge)
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

app.listen(PORT, () => {
  console.log(`Simplifiedaction – http://localhost:${PORT}`);
});
