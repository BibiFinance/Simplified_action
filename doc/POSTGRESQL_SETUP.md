# Créer une base PostgreSQL avec le schéma Simplifiedaction

Ce guide explique comment créer une base PostgreSQL et y exécuter le fichier **Simplifiedaction.sql** (même contenu que le schéma du projet).

---

## 1. Installer PostgreSQL

### Sur Windows
- Télécharge l’installateur : https://www.postgresql.org/download/windows/
- Lance l’installation, note le **mot de passe** que tu choisis pour l’utilisateur `postgres`.
- Optionnel : coche **pgAdmin** pour avoir une interface graphique.

### Sur Mac (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Avec Docker
```bash
docker run -d --name postgres-simplified -e POSTGRES_PASSWORD=monmotdepasse -e POSTGRES_DB=simplifiedaction -p 5432:5432 postgres:16
```
(Remplace `monmotdepasse` par ton mot de passe.)

---

## 2. Créer la base et (optionnel) un utilisateur

### Option A : Ligne de commande (psql)

Ouvre un terminal et connecte-toi à PostgreSQL avec l’utilisateur par défaut `postgres` :

**Windows** (après installation, psql est dans le PATH ou dans `C:\Program Files\PostgreSQL\16\bin`) :
```bash
psql -U postgres
```

**Mac / Linux** :
```bash
psql -U postgres
# ou si ton user système = user postgres :
psql postgres
```

Puis dans le prompt `postgres=#` :

```sql
-- Créer la base
CREATE DATABASE simplifiedaction;

-- (Optionnel) Créer un utilisateur dédié
CREATE USER simplified_user WITH PASSWORD 'ton_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE simplifiedaction TO simplified_user;

-- Se connecter à la nouvelle base pour exécuter le schéma
\c simplifiedaction
```

### Option B : Avec pgAdmin (interface graphique)

1. Ouvre **pgAdmin**, connecte-toi au serveur (mot de passe `postgres`).
2. Clic droit sur **Databases** → **Create** → **Database**.
3. Nom : `simplifiedaction` → **Save**.
4. Tu pourras exécuter le script SQL dans cette base (étape 3).

---

## 3. Exécuter le fichier Simplifiedaction.sql

Le fichier **Simplifiedaction.sql** à la racine du projet contient tout le schéma (tables, clés étrangères, index).

### Méthode 1 : Ligne de commande (psql)

Dans un terminal, à la racine du projet (là où se trouve `Simplifiedaction.sql`) :

**Windows (PowerShell)** :
```powershell
cd C:\Users\pivet\Documents\Simplifiedaction
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d simplifiedaction -f Simplifiedaction.sql
```
(Adapte le chemin vers `psql.exe` si ta version est 15 ou autre.)

**Mac / Linux** :
```bash
cd /chemin/vers/Simplifiedaction
psql -U postgres -d simplifiedaction -f Simplifiedaction.sql
```

Si tu as créé un utilisateur dédié :
```bash
psql -U simplified_user -d simplifiedaction -f Simplifiedaction.sql
```
(Il te demandera le mot de passe.)

### Méthode 2 : Avec pgAdmin

1. Dans pgAdmin, ouvre la base **simplifiedaction**.
2. Menu **Tools** → **Query Tool** (ou clic droit sur la base → **Query Tool**).
3. Ouvre le fichier **Simplifiedaction.sql** (bouton dossier / File → Open).
4. Clique sur **Execute** (icône play).

### Méthode 3 : Copier-coller

1. Ouvre **Simplifiedaction.sql** dans un éditeur de texte.
2. Copie tout le contenu.
3. Dans pgAdmin → Query Tool sur la base **simplifiedaction**, colle le contenu et exécute.

---

## 4. Vérifier que les tables existent

Dans psql ou pgAdmin (Query Tool) sur la base `simplifiedaction` :

```sql
\dt
```

Tu dois voir : `users`, `stripe_subscriptions`, `actions`, `notations`, `favoris`, `flux_news`.

---

## 5. Brancher l’application (DATABASE_URL)

Dans ton fichier **.env** à la racine du projet :

```env
DATABASE_URL=postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/simplifiedaction
```

Si tu as créé un utilisateur dédié :

```env
DATABASE_URL=postgresql://simplified_user:ton_mot_de_passe@localhost:5432/simplifiedaction
```

Format général :  
`postgresql://UTILISATEUR:MOT_DE_PASSE@HOST:PORT/NOM_DE_LA_BASE`

- **HOST** : `localhost` en local, ou l’adresse du serveur (ex. OVH).
- **PORT** : en général `5432`.

Redémarre le serveur Node (`npm start`) : les inscriptions et connexions seront enregistrées dans PostgreSQL.

---

## Résumé des commandes (exemple Windows, user postgres)

```powershell
# 1. Se connecter à PostgreSQL
psql -U postgres

# 2. Dans psql :
CREATE DATABASE simplifiedaction;
\c simplifiedaction

# 3. Quitter psql
\q

# 4. Exécuter le schéma (depuis le dossier du projet)
psql -U postgres -d simplifiedaction -f Simplifiedaction.sql

# 5. Dans .env
# DATABASE_URL=postgresql://postgres:MotDePasse@localhost:5432/simplifiedaction
```

C’est tout : tu as une base PostgreSQL avec le même contenu (structure) que **Simplifiedaction.sql**.
