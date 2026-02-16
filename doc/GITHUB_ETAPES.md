# Pushes GitHub par grande étape

À chaque **grosse étape** du projet, faire un push vers le dépôt GitHub.

## Sécurité : ne jamais pousser d’infos sensibles

- Le fichier **`.env`** est dans le `.gitignore` → il ne sera **jamais** commité (clés API, JWT_SECRET, DATABASE_URL).
- **`.env.example`** contient uniquement des **placeholders** (pas de vraies clés ni mots de passe).
- Avant chaque push : vérifier avec `git status` qu’aucun `.env` ou fichier avec secrets n’apparaît. En cas de doute : `git check-ignore -v .env` doit confirmer que `.env` est ignoré.

## 1. Créer le dépôt sur GitHub

1. Va sur [github.com](https://github.com) → **New repository**.
2. Nom du repo : par ex. **Simplifiedaction** (ou simplifiedaction).
3. Ne coche **pas** « Initialize with README » (le projet en a déjà un).
4. Créer le dépôt, puis copier l’URL du repo (ex. `https://github.com/TON_USER/Simplifiedaction.git`).

## 2. Configurer Git (une seule fois sur ta machine)

Si ce n’est pas déjà fait :

```bash
git config --global user.email "ton@email.com"
git config --global user.name "Ton Nom"
```

## 3. Brancher ce projet au repo (une seule fois)

Dans le terminal, à la racine du projet :

```bash
git remote add origin https://github.com/TON_USER/Simplifiedaction.git
```

Remplace `TON_USER` par ton identifiant GitHub.

## 4. Premier commit et push (étape 2 – Interface Web publique)

À la racine du projet :

```bash
git add -A
git commit -m "Etape 2 - Interface Web publique (accueil, recherche, responsive)"
git branch -M main
git push -u origin main
```

## 5. Aux étapes suivantes

À chaque **grande étape** terminée :

```bash
git add -A
git commit -m "Étape X – Titre court de l’étape"
git push origin main
```

### Exemples de messages de commit par étape

| Étape | Message de commit suggéré |
|-------|---------------------------|
| 2 (fait) | `Étape 2 – Interface Web publique (accueil, recherche, responsive)` |
| 3 | `Étape 3 – Backend Node.js Express (routes, auth)` |
| 4 | `Étape 4 – Finnhub + notation + cache` |
| 5 | `Étape 5 – Authentification et comptes utilisateurs` |
| 6 | `Étape 6 – Abonnements Stripe` |
| 7 | `Étape 7 – Favoris et dashboard utilisateur` |
| 8 | `Étape 8 – Sécurité, accessibilité, tests` |
| 9 | `Étape 9 – Déploiement OVH` |

## 6. Fichiers ignorés (`.gitignore`)

Actuellement exclus du repo : `Etapes.md`, `Pages.md`, `referentiel_bts.md`, `Modelisation_db.mds`, `Simplifiedaction.sql`, `documentation.md`.

Pour **versionner aussi** la doc et le schéma SQL : retire ces lignes du `.gitignore`, puis `git add` et commit.
