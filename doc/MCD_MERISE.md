# Modèle Conceptuel de Données (MCD) – Merise

**Projet : SimplifiedAction**
**BTS SIO – SLAM – Dossier technique E6**

---

## Représentation textuelle du MCD

```
┌──────────────────────┐                                         ┌──────────────────────┐
│      UTILISATEUR     │                                         │        ACTION        │
├──────────────────────┤                                         ├──────────────────────┤
│ id  (identifiant)    │                                         │ id  (identifiant)    │
│ email                │        ┌───────────────┐                │ ticker               │
│ password_hash        │        │   SOUSCRIRE   │                │ entreprise           │
│ stripe_customer_id   │───1,n──┤               ├──             │ secteur              │
│ created_at           │        │ stripe_sub_id │                │ rendement            │
│                      │        │ stripe_price  │                │ risque               │
│                      │        │ status        │                │                      │
│                      │        │ period_end    │                │                      │
│                      │        │ created_at    │                │                      │
│                      │        └───────────────┘                │                      │
│                      │                                         │                      │
│                      │        ┌───────────────┐                │                      │
│                      │        │   FAVORISER   │                │                      │
│                      │───1,n──┤               ├──1,n──────────│                      │
│                      │        │ created_at    │                │                      │
│                      │        └───────────────┘                │                      │
│                      │                                         │                      │
└──────────────────────┘                                         │                      │
                                                                 │                      │
                                ┌───────────────┐                │                      │
                                │    NOTER      │                │                      │
                                │               ├──1,n──────────│                      │
                                │ note_globale  │                │                      │
                                │ version_algo  │                │                      │
                                │ date_calcul   │                │                      │
                                └───────────────┘                │                      │
                                                                 │                      │
                                ┌───────────────┐                │                      │
                                │  CONCERNER    │                │                      │
                                │               ├──0,n──────────│                      │
                                └───────┬───────┘                └──────────────────────┘
                                        │
                                       0,n
                                        │
                                ┌───────┴──────────────┐
                                │      ACTUALITE       │
                                ├──────────────────────┤
                                │ id  (identifiant)    │
                                │ titre                │
                                │ source               │
                                │ url                  │
                                │ resume               │
                                │ date_publi           │
                                └──────────────────────┘
```

---

## Dictionnaire des entités

| Entité         | Description                                      | Identifiant |
|----------------|--------------------------------------------------|-------------|
| UTILISATEUR    | Personne inscrite sur la plateforme               | id          |
| ACTION         | Valeur boursière (ex. AAPL – Apple)               | id          |
| ACTUALITE      | Article d'actualité issu d'un flux RSS            | id          |

---

## Dictionnaire des associations

| Association | Entités reliées                | Cardinalités                  | Propriétés portées                                           |
|-------------|--------------------------------|-------------------------------|--------------------------------------------------------------|
| SOUSCRIRE   | UTILISATEUR — (abonnement)     | 1,1 — 0,n (un user → 0 ou n) | stripe_subscription_id, stripe_price_id, status, current_period_end, created_at |
| FAVORISER   | UTILISATEUR — ACTION           | 0,n — 0,n                    | created_at                                                   |
| NOTER       | (algo) — ACTION                | — 0,n (une action → n notes) | note_globale, version_algo, date_calcul                      |
| CONCERNER   | ACTUALITE — ACTION             | 0,n — 0,n                    | *(aucune)*                                                   |

---

## Détail des cardinalités

### SOUSCRIRE (UTILISATEUR → abonnement Stripe)
- Un **utilisateur** peut avoir **0 ou plusieurs** abonnements (historique).
- Chaque abonnement appartient à **1 seul** utilisateur.
- Cardinalités : UTILISATEUR (0,n) — SOUSCRIRE — (1,1)

### FAVORISER (UTILISATEUR ↔ ACTION)
- Un **utilisateur** peut mettre en favoris **0 ou plusieurs** actions.
- Une **action** peut être mise en favoris par **0 ou plusieurs** utilisateurs.
- Cardinalités : UTILISATEUR (0,n) — FAVORISER — ACTION (0,n)
- Contrainte : unicité du couple (user_id, action_id).

### NOTER (ACTION → notations/scores)
- Une **action** peut recevoir **0 ou plusieurs** notations (historique des scores calculés).
- Chaque notation porte sur **1 seule** action.
- Cardinalités : ACTION (0,n) — NOTER — (1,1)

### CONCERNER (ACTUALITE ↔ ACTION)
- Une **actualité** peut concerner **0 ou 1** action (liaison optionnelle).
- Une **action** peut être liée à **0 ou plusieurs** actualités.
- Cardinalités : ACTUALITE (0,1) — CONCERNER — ACTION (0,n)

---

## Règles de gestion

| # | Règle |
|---|-------|
| RG1 | Un utilisateur est identifié par un email unique et un mot de passe hashé (Argon2). |
| RG2 | Un utilisateur peut souscrire un abonnement premium via Stripe ; le statut (active, canceled, past_due) est mis à jour par webhook. |
| RG3 | Un utilisateur connecté peut ajouter ou retirer des actions de ses favoris (watchlist). |
| RG4 | Chaque action est identifiée par un ticker unique (ex. AAPL). |
| RG5 | Le score simplifié (0–10) est calculé à partir des données de marché (cours, variation, amplitude) ; chaque calcul est historisé (note, version de l'algorithme, date). |
| RG6 | Les actualités sont récupérées via flux RSS et peuvent être rattachées à une action par son ticker. |

---

## Table complémentaire hors MCD

| Table            | Rôle                                                   |
|------------------|--------------------------------------------------------|
| sp500_companies  | Liste statique des entreprises du S&P 500 (référentiel de données, pas de relation avec les entités métier). |

---

*Document destiné au dossier technique E6 – BTS SIO SLAM – Projet SimplifiedAction.*
