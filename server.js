/**
 * Simplifiedaction – Point d'entrée serveur
 * Démarre l'application Express (définie dans app.js).
 */

const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Simplifiedaction – http://localhost:${PORT}`);
});
