# Simplifiedaction

Application web pour consulter un **score simplifié** des actions (recherche par nom ou ticker). Projet BTS SIO option SLAM.

## Démarrage

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Lancer le serveur** (sert le frontend + API)
   ```bash
   npm start
   ```
   Puis ouvrir http://localhost:3000

3. **Optionnel** : copier `.env.example` en `.env` et adapter `PORT`, `JWT_SECRET`, `FINNHUB_API_KEY`, `DATABASE_URL` (PostgreSQL pour persister les comptes ; sinon stockage en mémoire).

## Structure du projet

```
Simplifiedaction/
├── public/           # Frontend
│   ├── index.html    # Accueil + recherche + actualités RSS
│   ├── login.html, register.html, compte.html (auth)
│   ├── contact.html, liste-sp500.html
│   ├── css/          # style.css, pages.css
│   └── js/main.js, auth.js (token JWT, header connecté/invité)
├── lib/
│   ├── db.js         # PostgreSQL (users) ; table créée automatiquement si besoin
│   ├── finnhub.js    # Client API Finnhub (search, quote, profile)
│   └── score.js      # computeScore(quote, profile) — note 0–10
├── routes/
│   ├── api.js        # GET /api/search (Finnhub + cache), GET /api/news (RSS)
│   └── auth.js       # POST /auth/register, /auth/login, GET /auth/me (Argon2 + JWT, BDD ou mémoire)
├── server.js
├── .env.example      # PORT, JWT_SECRET, FINNHUB_API_KEY, DATABASE_URL
└── doc/
```

## API

| Méthode | Route | Description |
|---------|--------|-------------|
| GET | `/api/search?q=...` | Recherche (nom ou ticker) → Finnhub + score calculé ; cache 10 min. Sans clé = simulation. |
| GET | `/api/news?ticker=...` | Actualités RSS Yahoo Finance pour le ticker (ex. AAPL) |
| POST | `/auth/register` | Inscription (email, password) → JWT |
| POST | `/auth/login` | Connexion (email, password) → JWT |
| GET | `/auth/me` | Profil (header `Authorization: Bearer <token>`) |

Mots de passe hashés avec **Argon2** (ES02). Session = **JWT** (7 jours). Comptes : **PostgreSQL** si `DATABASE_URL` est défini, sinon **mémoire**.

## Base de données (étape 5)

- Définir `DATABASE_URL=postgresql://user:password@localhost:5432/simplifiedaction` dans `.env`.
- **Créer la base et le schéma** : voir **[doc/POSTGRESQL_SETUP.md](doc/POSTGRESQL_SETUP.md)** pour installer PostgreSQL, créer la base et exécuter `Simplifiedaction.sql` (toutes les tables du projet).
- Sans BDD, la table `users` est créée automatiquement au premier usage (seulement pour l’auth) ; pour le schéma complet (favoris, actions, etc.), exécuter `Simplifiedaction.sql` comme décrit dans le guide.

## Suite du projet

- **Étape 6** : Stripe (abonnements premium).
- **Étape 7** : Favoris + dashboard.
