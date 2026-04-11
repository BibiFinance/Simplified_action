# Tests automatisés – SimplifiedAction

Ce document décrit la suite de tests automatisés du projet (BTS SIO – E6 SLAM).

---

## 1. Vue d’ensemble

- **Outil** : [Jest](https://jestjs.io/) (moteur de tests) + [supertest](https://github.com/visionmedia/supertest) (requêtes HTTP vers l’API).
- **Lancement** : `npm test`
- **Emplacement** : tous les fichiers de test sont dans le dossier **`tests/`** à la racine du projet.

Les tests s’exécutent **sans base de données** et **sans clé API Finnhub** : le fichier `tests/setup.js` force le mode mémoire (auth et favoris) et le fallback de recherche. Aucune configuration supplémentaire n’est nécessaire pour faire tourner la suite.

---

## 2. Structure des tests

```
tests/
├── setup.js        # Configuration Jest (NODE_ENV=test, pas de BDD, pas de Finnhub)
├── score.test.js   # Tests unitaires du calcul du score (lib/score.js)
└── api.test.js     # Tests d’intégration des routes API (sp500, search, auth, favorites)
```

- **`setup.js`** : exécuté avant les tests ; définit `NODE_ENV=test`, vide `DATABASE_URL` et `FINNHUB_API_KEY`, et fixe un `JWT_SECRET` de test.
- **`score.test.js`** : tests **unitaires** de la fonction `computeScore` (score simplifié 0–10, rendement, risque).
- **`api.test.js`** : tests **API** (supertest) sur les routes Express : S&P 500, recherche, inscription/connexion, favoris (GET/POST/DELETE).

---

## 3. Comment lancer les tests

### Prérequis

- Node.js >= 18.
- Dépendances installées : `npm install` (Jest et supertest sont en `devDependencies`).

### Commande

```bash
npm test
```

Sortie typique :

```
PASS  tests/score.test.js
PASS  tests/api.test.js
Test Suites: 2 passed, 2 total
Tests:       XX passed, XX total
```

Pour un seul fichier :

```bash
npx jest tests/score.test.js
npx jest tests/api.test.js
```

---

## 4. Détail des scénarios testés

### 4.1 Tests unitaires – `lib/score.js` (`score.test.js`)

| Test | Description |
|------|-------------|
| Structure de retour | La fonction renvoie bien `score_simplifie`, `rendement`, `risque`, `version_algo`. |
| Données invalides | Sans quote ou avec `quote.c` non numérique → score 5, rendement 0, risque 0,5. |
| Bornes du score | Le score reste entre 0 et 10 (cas extrêmes). |
| Variation positive | Une variation en % positive (`dp > 0`) donne un score plus élevé qu’avec `dp = 0`. |
| Rendement | Le rendement est la valeur absolue de `dp` arrondie à 2 décimales. |
| Profil optionnel | Un second argument `profile` (nom, secteur) est accepté sans erreur. |

### 4.2 Tests API – Routes Express (`api.test.js`)

#### S&P 500 – `GET /api/sp500/list`

- Réponse 200 avec `items`, `total`, `limit`, `offset`.
- Chaque élément possède au moins `symbol` et `name`.
- Paramètres de requête : `q`, `sort`, `order`, `page`, `limit`.

#### Recherche – `GET /api/search`

- Sans paramètre `q` → 400 et message d’erreur.
- Avec `q` (ex. `AAPL`) → 200 et objet contenant `ticker`, `score_simplifie`, `rendement`, `risque` (réel ou fallback si pas de clé Finnhub).

#### Auth – `POST /auth/register`

- Corps vide ou sans email/mot de passe → 400.
- Inscription valide → 201, avec `token` et `user` (id, email).
- Double inscription avec le même email → 409.

#### Auth – `POST /auth/login`

- Corps vide → 400.
- Identifiants inexistants ou faux → 401.
- Après inscription, login avec les mêmes identifiants → 200, `token` et `user`.

#### Favoris – `GET /api/favorites`

- Sans en-tête `Authorization: Bearer <token>` → 401.
- Avec token valide → 200 et tableau `favorites`.

#### Favoris – `POST /api/favorites`

- Sans token → 401.
- Sans `ticker` dans le corps → 400.
- Avec token et `ticker` (et optionnellement `name`) → 201 et objet `favorite`.

#### Favoris – `DELETE /api/favorites/:ticker`

- Sans token → 401.
- Avec token et ticker existant → 200 et `removed: true`.

---

## 5. Architecture technique (pour les tests)

- L’application Express est **exportée** par **`app.js`** (sans appel à `listen`). Le serveur « réel » est démarré par **`server.js`**, qui charge `app.js` et appelle `app.listen()`.
- Les tests chargent **`app.js`** et envoient des requêtes HTTP avec supertest ; aucun serveur réseau n’est lancé.
- En environnement de test, `DATABASE_URL` et `FINNHUB_API_KEY` sont vides : le module **`lib/db`** et les routes utilisent le **mode mémoire** (utilisateurs et favoris en RAM), et la route **`/api/search`** utilise le **fallback** (données simulées) au lieu d’appeler Finnhub.

---

## 6. Référence rapide

| Commande | Effet |
|----------|--------|
| `npm test` | Lance toute la suite Jest. |
| `npx jest tests/score.test.js` | Lance uniquement les tests du score. |
| `npx jest tests/api.test.js` | Lance uniquement les tests API. |
| `npx jest --verbose` | Affiche le détail de chaque test. |

---

## 7. Évolution possible

- Ajouter des tests pour **GET /auth/me** (avec/sans token).
- Tester **GET /api/news?ticker=** (réponse 400 si ticker absent, structure si présent).
- En cas d’utilisation d’une base de test : configurer une `DATABASE_URL` dédiée et des scripts de seed/nettoyage pour des tests d’intégration BDD.

Cette suite couvre les compétences « tests » du référentiel E6 (bloc 2) et démontre des tests **unitaires** (score) et **d’intégration API** (routes REST).
