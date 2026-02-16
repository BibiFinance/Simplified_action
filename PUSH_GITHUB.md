# Créer le repo GitHub et pousser le projet

Suis ces étapes **dans l’ordre** (une seule fois pour la config Git, puis à chaque nouveau repo si besoin).

---

## 1. Configurer ton identité Git (une seule fois)

Ouvre un terminal (PowerShell ou CMD) et exécute :

```powershell
git config --global user.email "ton@email.com"
git config --global user.name "Ton Nom"
```

Remplace par ton **vrai email** (celui de ton compte GitHub) et ton **nom**.

---

## 2. Créer le dépôt sur GitHub

1. Va sur **https://github.com** et connecte-toi.
2. Clique sur le **+** en haut à droite → **New repository**.
3. **Repository name** : `Simplifiedaction` (ou `simplifiedaction`).
4. Laisse **Public**.
5. **Ne coche pas** « Add a README file » (le projet en a déjà un).
6. Clique sur **Create repository**.
7. Sur la page du nouveau dépôt, **copie l’URL** du repo, par exemple :
   - `https://github.com/TON_USER/Simplifiedaction.git`
   - ou `git@github.com:TON_USER/Simplifiedaction.git`

Remplace **TON_USER** par ton identifiant GitHub.

---

## 3. Commit puis push (dans le dossier du projet)

Ouvre un terminal **dans le dossier du projet** (`C:\Users\pivet\Documents\Simplifiedaction`) et exécute :

```powershell
cd C:\Users\pivet\Documents\Simplifiedaction

git add -A
git commit -m "Simplifiedaction: frontend, backend, auth, Finnhub, BDD, doc"

git remote add origin https://github.com/TON_USER/Simplifiedaction.git
git branch -M main
git push -u origin main
```

**Remplace `TON_USER`** par ton identifiant GitHub dans l’URL du `git remote add`.

Si tu as déjà ajouté le remote avant :  
`git remote add origin ...` peut afficher "remote origin already exists". Dans ce cas, utilise seulement :

```powershell
git branch -M main
git push -u origin main
```

---

## 4. Vérifier

Rafraîchis la page du dépôt sur GitHub : tu dois voir tous les fichiers du projet (sans le fichier `.env`, qui est ignoré).

Tu peux ensuite supprimer ce fichier `PUSH_GITHUB.md` si tu veux, ou le garder pour référence.
