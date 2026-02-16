/**
 * Simplifiedaction – Serveur Express (Étape 3)
 * Sert le frontend public/ et expose les routes API.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS : autoriser le frontend (même origine si servi par ce serveur)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
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
