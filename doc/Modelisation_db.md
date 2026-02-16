## 📊 Types numériques

- `INT` : entier (id, compteurs)
- `BIGINT` : entier très grand (IDs externes si besoin)
- `FLOAT` / `REAL` : décimal approximatif (statistiques, scores)
- `DECIMAL(p,s)` / `NUMERIC(p,s)` : décimal précis
    
    👉 **à utiliser pour montants financiers**
    
    ex : `DECIMAL(10,2)`
    

---

## 📅 Dates et heures

- `DATE` : date seule
- `TIME` : heure seule
- `TIMESTAMP` : date + heure (logs, création)
- `DATETIME` : équivalent selon SGBD

👉 pour audit / traçabilité → `TIMESTAMP`

---

## 📚 Texte

- `CHAR(n)` : taille fixe (codes ISO, pays)
- `VARCHAR(n)` : variable (email, nom, ticker)
- `TEXT` : texte long (résumé news)

Bonnes pratiques BTS :

- email → `VARCHAR(255)`
- ticker → `VARCHAR(10)`
- nom entreprise → `VARCHAR(150)`

---

## 📦 Binaire

- `BLOB` : fichiers
- `VARBINARY` : données brutes

(peu utile pour ton projet — tu peux dire : stockage externe recommandé)

---

## ✅ Booléen

- `BOOLEAN` / `BOOL`
- valeurs : TRUE / FALSE

---

## Relations SQL (dbdiagram)

- `<` = one-to-many
- `>` = many-to-one
- = one-to-one
- `<>` = many-to-many (via table de liaison)
- Différentes tables
    - Users
    - stripe_subscriptions
    - Actions
    - notations
    - Favoris
    - **flux_news**