# Fiche descriptive de réalisation professionnelle – E6 BTS SIO SLAM

**Projet : SimplifiedAction**  
**Contexte :** Plateforme web d’analyse d’actions financières à destination des investisseurs débutants, avec score simplifié et version professionnelle (abonnement).

---

## 1. Conditions de réalisation

### Besoin initial du projet

Le besoin identifié est double : d’une part, **simplifier l’accès aux données boursières** pour des personnes peu familiarisées avec la finance, et d’autre part, **fournir un indicateur de synthèse** (score) pour aider à la décision sans nécessiter des connaissances techniques. Les plateformes existantes sont souvent complexes ; SimplifiedAction vise à offrir une recherche par nom ou symbole d’action, un score compris entre 0 et 10, des indicateurs (rendement, risque) et des actualités, le tout avec une interface claire.

### Objectifs fonctionnels de l’application

- Permettre la **recherche d’une action** par nom d’entreprise ou ticker (ex. Apple, AAPL) et afficher un **score simplifié** (0 à 10), un indicateur de rendement et de risque.
- Proposer une **liste des actions du S&P 500** avec recherche, tri et pagination, et un accès direct à l’analyse de chaque action.
- Afficher des **actualités** liées à l’action consultée (flux RSS).
- Gérer des **comptes utilisateurs** : inscription, connexion, session sécurisée (JWT), page « Mon compte ».
- Permettre aux utilisateurs connectés d’**ajouter et supprimer des favoris** (watchlist).
- Proposer une **offre premium** (abonnement payant via Stripe) avec accès à des fonctionnalités avancées et statut « premium » enregistré en base.

### Création complète ou évolution

Il s’agit d’une **création complète** : l’application a été conçue et développée from scratch dans le cadre du projet. Des évolutions ont été apportées au fil des étapes (ajout des favoris, liste S&P 500, intégration Stripe, correctifs d’interface), mais le produit initial est une nouvelle réalisation.

### Contexte de réalisation

Le projet est réalisé dans le **contexte de la formation BTS SIO option SLAM** (Solutions Logicielles et Applications Métier), en vue de l’épreuve E6 (réalisation d’un projet). Il est mené en **autonomie** (ou en petit groupe selon l’organisation du lycée), avec un suivi pédagogique et une planification par étapes (modélisation, interface, backend, API, base de données, authentification, abonnements, favoris, tests). Le livrable doit démontrer les compétences du référentiel : conception, développement, gestion des données, maintenance et tests.

---

## 2. Ressources matérielles et logicielles

### Environnement de développement

- **Système d’exploitation** : Windows (ou Linux/macOS selon la machine de développement).
- **Éditeur / IDE** : Visual Studio Code (ou équivalent) pour l’édition du code, la navigation dans le projet et l’utilisation du terminal.
- **Runtime** : Node.js (version 18 ou supérieure) pour exécuter le serveur et les scripts (tests, seed).
- **Navigateur** : navigateur récent (Chrome, Firefox, Edge) pour tester l’interface et les appels API (fetch).

### Langages et frameworks

- **Frontend** : HTML5, CSS3, JavaScript (vanilla). Pas de framework front lourd ; les pages sont servies statiquement et les appels à l’API sont réalisés en JavaScript (fetch, gestion du token JWT pour les routes protégées).
- **Backend** : Node.js avec le framework **Express** pour les routes, les middlewares (CORS, JSON, fichiers statiques) et l’exposition des API REST.
- **API externe** : **Finnhub** pour la recherche de symboles, les cours (quote) et les profils d’entreprises. Les clés API sont stockées dans un fichier `.env` et jamais exposées au client.
- **Paiement** : **Stripe** (Checkout, webhooks) pour la gestion des abonnements de la version pro.
- **Actualités** : flux RSS Yahoo Finance (côté backend) pour les news par ticker.

### SGBD utilisé et justification

Le projet utilise **PostgreSQL** comme système de gestion de base de données.

**Pourquoi PostgreSQL plutôt que MongoDB ?**

- Les données du projet sont **structurées et relationnelles** : utilisateurs, abonnements (liés aux utilisateurs), favoris (utilisateur / action), actions, notations, flux d’actualités. Les contraintes d’intégrité (clés étrangères, unicité) et les jointures sont naturelles en SQL.
- **Cohérence et fiabilité** : les transactions et les contraintes (UNIQUE, NOT NULL, FOREIGN KEY) garantissent la cohérence des données (ex. un abonnement toujours lié à un utilisateur existant).
- **Adaptation au référentiel** : le BTS SIO met l’accent sur la modélisation de données et les SGBD relationnels ; PostgreSQL permet de présenter un schéma normalisé, des requêtes SQL et une documentation (schéma, types, relations) claire pour le dossier technique.
- **Écosystème** : le driver `pg` sous Node.js est mature ; la base peut être installée en local (Windows/Linux) ou sur un hébergeur (ex. OVH) pour la production.

MongoDB conviendrait davantage à des données très variables ou à des logiques orientées document ; ici, le modèle relationnel est plus adapté.

### Système de gestion de versions

**Git** est utilisé pour la gestion de versions. Le code source est hébergé sur **GitHub** (dépôt du projet). Les commits permettent de suivre l’avancement (étapes, correctifs, évolutions) et de justifier les choix (historique des modifications, par exemple pour la partie « correction ou évolution » de l’E6).

### Types d’appareils pour les tests

L’application peut être testée sur :

- **Ordinateur** (desktop) : Windows, macOS ou Linux, via un navigateur moderne ; le design responsive (CSS) permet une utilisation confortable sur différentes résolutions.
- **Tablette et smartphone** : les pages sont conçues pour s’adapter aux petites largeurs d’écran (media queries, mise en page flexible).
- **En local** : le serveur tourne sur la machine de développement (ex. `http://localhost:3000`) ; les tests sont réalisés sur le même appareil ou en réseau local selon la configuration.

---

## 3. Modalités d’accès à l’application

### Stockage du code source

Le code source est stocké dans un **dépôt Git sur GitHub** (organisation ou compte personnel selon le choix du candidat). Le dépôt contient l’ensemble des fichiers du projet : frontend (`public/`), backend (routes, lib, `app.js`, `server.js`), schéma SQL (`Simplifiedaction.sql`), documentation (`doc/`), fichiers de configuration (`package.json`, `.env.example`) et suite de tests (`tests/`). Le fichier `.env` (clés secrètes) n’est pas versionné ; seul `.env.example` est fourni comme modèle.

### Lancement en environnement local

1. **Cloner le dépôt** (ou récupérer les sources) puis ouvrir un terminal dans le dossier du projet.
2. **Installer les dépendances** : `npm install`.
3. **Configurer l’environnement** (optionnel pour un premier test) : copier `.env.example` en `.env` et renseigner au minimum `PORT` (ex. 3000), `JWT_SECRET`, et éventuellement `FINNHUB_API_KEY`, `DATABASE_URL` (PostgreSQL), `STRIPE_*` pour les fonctionnalités complètes.
4. **Démarrer le serveur** : `npm start` (commande qui exécute `node server.js`).
5. **Ouvrir un navigateur** à l’adresse indiquée (par défaut `http://localhost:3000`).

Sans base de données configurée, l’application fonctionne en **mode mémoire** (utilisateurs et favoris non persistés après redémarrage) ; avec une base PostgreSQL créée et `DATABASE_URL` renseigné, les données sont persistées.

### Accès à l’application

- **En local** : après `npm start`, accès via `http://localhost:3000` (ou le port défini dans `.env`).
- **En production** (si déployée) : accès via l’URL du serveur (ex. nom de domaine ou IP), idéalement en HTTPS après mise en place d’un certificat (Let’s Encrypt).

### Comptes de test pour une démonstration

- **Compte utilisateur classique** : créer un compte via la page d’inscription avec une adresse e-mail de test (ex. `demo@example.com`) et un mot de passe conforme à la politique (ex. `Demo123!`). Ce compte permet de tester la connexion, la page « Mon compte », les favoris et la liste S&P 500.
- **Compte premium** : pour démontrer l’abonnement, utiliser les **clés de test Stripe** (mode test) et effectuer un paiement avec la carte de test fournie par Stripe (ex. `4242 4242 4242 4242`). Après le webhook, `GET /auth/me` retourne `isPremium: true` et les fonctionnalités réservées aux abonnés sont accessibles.
- Il est possible de documenter un couple **login / mot de passe** dédié à la démo dans le dossier technique (sans exposer de vrais comptes de production).

---

## 4. Description technique de la réalisation

### Principales fonctionnalités de l’application

- **Recherche d’action** : saisie d’un nom ou d’un ticker ; appel à l’API Finnhub (recherche, cours, profil) ; calcul du score simplifié (0–10), du rendement et du risque ; affichage du résultat et des actualités (RSS). Cache côté serveur pour limiter les appels API.
- **Liste S&P 500** : page dédiée avec tableau (symbole, nom, secteur, industrie), recherche, tri (nom, ticker, secteur), pagination ; lien « Analyser » vers la fiche de chaque action.
- **Authentification** : inscription (email, mot de passe), connexion, déconnexion ; session gérée par JWT (token dans le stockage local côté client) ; page « Mon compte » et route protégée `GET /auth/me` (profil + statut premium).
- **Favoris** : pour les utilisateurs connectés, ajout et suppression de favoris par ticker ; page « Favoris » listant les actions mises en watchlist ; API `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:ticker` (protégées par JWT).
- **Abonnement premium** : page abonnements avec bouton « S’abonner » ; création de session Stripe Checkout ; après paiement, webhook Stripe met à jour la base (table `stripe_subscriptions`) ; le backend expose le statut premium via `GET /auth/me`.

### Architecture logicielle

L’architecture est de type **client-serveur** avec une **API REST** :

- **Client (frontend)** : pages HTML/CSS/JS servies en statique par Express ; le JavaScript envoie des requêtes (fetch) vers les routes API du serveur et gère l’affichage (formulaires, résultats, navigation, token JWT).
- **Serveur (backend)** : application Express (Node.js) qui assure la logique métier, les appels aux services externes (Finnhub, Stripe, RSS) et l’accès à la base de données. Les routes sont organisées par domaine : API recherche/actualités (`/api`), authentification (`/auth`), favoris (`/api/favorites`), S&P 500 (`/api/sp500`), Stripe (`/api/stripe`).
- **Base de données** : PostgreSQL pour la persistance des utilisateurs, abonnements et favoris (et éventuellement actions, notations, flux_news selon le schéma).
- **API externes** : Finnhub (données boursières), Stripe (paiements), Yahoo Finance (RSS). Les clés sensibles restent côté serveur (.env).

Schéma conceptuel : **Navigateur → Serveur Express → PostgreSQL** ; **Serveur Express → Finnhub / Stripe / RSS**.

### Structure de la base de données principale

Le schéma (fichier `Simplifiedaction.sql`) comporte les tables suivantes (résumé) :

- **users** : identifiant, email (unique), hash du mot de passe, `stripe_customer_id` (optionnel), date de création. Stocke les comptes utilisateurs.
- **stripe_subscriptions** : liaison avec `users` (user_id) ; identifiant d’abonnement Stripe, price_id, statut (active, canceled, etc.), fin de période ; permet de savoir si un utilisateur est premium.
- **actions** : ticker (unique), nom d’entreprise, secteur, rendement, risque ; représentation des actions (données issues de l’API ou enrichies).
- **notations** : liaison avec une action (action_id) ; note globale, version de l’algorithme, date de calcul ; historique des scores.
- **favoris** : liaison user_id / action_id (unicité sur le couple) ; date d’ajout ; watchlist par utilisateur.
- **flux_news** : titre, source, URL (unique), résumé, date de publication, liaison optionnelle à une action ; stockage des actualités.

Les clés étrangères assurent l’intégrité référentielle (ex. un favori pointe vers un utilisateur et une action existants). En pratique, le module `lib/db.js` peut créer automatiquement des tables simplifiées (users, favorites avec ticker/name) si le schéma évolue ; le fichier SQL reste la référence pour la modélisation du dossier.

### Types de tests pour valider l’application

- **Tests unitaires** : réalisés avec **Jest** sur la logique métier pure, sans base ni réseau. Exemple : la fonction `computeScore` (lib/score.js) est testée pour différentes entrées (quote valide, invalide, bornes du score, rendement, profil optionnel). Voir `tests/score.test.js`.
- **Tests d’intégration API** : avec **Jest** et **supertest**, les routes Express sont sollicitées en HTTP (sans démarrer de serveur réseau). Sont testées notamment : `GET /api/sp500/list` (structure de réponse), `GET /api/search` (paramètre q requis, structure), `POST /auth/register` et `POST /auth/login` (validation, token, conflit 409), `GET/POST/DELETE /api/favorites` (401 sans token, 200/201 avec token). Voir `tests/api.test.js` et `doc/TESTS_AUTOMATISES.md`.
- **Tests manuels** : parcours complets documentés (inscription, connexion, recherche, favoris, liste S&P 500, abonnement en mode test Stripe) pour valider le comportement côté interface et les cas non couverts par les tests automatisés.
- **Environnement de test** : la suite Jest s’exécute avec `NODE_ENV=test`, sans base de données ni clé Finnhub (mode mémoire et fallback), afin d’obtenir des résultats reproductibles. Commande : `npm test`.

### Contraintes ergonomiques pour les utilisateurs débutants

- **Simplicité de la recherche** : un seul champ de recherche (nom ou ticker) ; pas de jargon obligatoire (ex. « Apple » ou « AAPL »).
- **Score lisible** : note sur 10 avec indicateurs rendement / risque, présentés de façon claire (libellés, mise en forme) pour éviter la surcharge d’information.
- **Navigation explicite** : liens visibles vers l’accueil, la liste S&P 500, les favoris (si connecté), Mon compte, Connexion/Déconnexion ; état de connexion visible (affichage conditionnel des blocs « invité » / « connecté »).
- **Feedback utilisateur** : messages d’erreur ou de succès (inscription, connexion, ajout de favori) ; indication de chargement lors des appels API si nécessaire.
- **Responsive design** : mise en page adaptée aux écrans mobiles et tablettes (taille des boutons, lisibilité, tableau S&P 500 consultable sur petit écran).
- **Sécurité sans complexité** : mot de passe hashé (Argon2), session par JWT ; l’utilisateur n’a pas à gérer la technique, tout en bénéficiant d’une application sécurisée.

---

*Document rédigé pour le dossier technique de l’épreuve E6 – BTS SIO option SLAM – Projet SimplifiedAction.*
