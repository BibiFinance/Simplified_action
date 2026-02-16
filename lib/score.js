/**
 * Calcul du score simplifié (étape 4)
 * Basé sur le cours Finnhub : variation en %, volatilité (high-low).
 * Score entre 0 et 10.
 */

const VERSION_ALGO = '1.0';

/**
 * Calcule la note globale à partir des données de cotation et du profil.
 * @param {Object} quote - { c, d, dp, h, l, o, pc } (Finnhub quote)
 * @param {Object} profile - { name, finnhubIndustry } (optionnel)
 * @returns { { score_simplifie: number, rendement: number, risque: number, version_algo: string } }
 */
function computeScore(quote, profile = {}) {
  if (!quote || typeof quote.c !== 'number') {
    return {
      score_simplifie: 5,
      rendement: 0,
      risque: 0.5,
      version_algo: VERSION_ALGO,
    };
  }

  const c = quote.c;
  const dp = typeof quote.dp === 'number' ? quote.dp : 0; // variation en %
  const h = quote.h;
  const l = quote.l;

  // Rendement : on utilise la variation en % (ex: 2.5 => rendement 2.5)
  const rendement = Math.round(Math.abs(dp) * 100) / 100;

  // Risque : volatilité intraday (écart high-low) normalisée par le cours, entre 0 et 1
  let risque = 0.5;
  if (c > 0 && typeof h === 'number' && typeof l === 'number' && h > l) {
    const volatility = (h - l) / c;
    risque = Math.min(1, Math.round(volatility * 50) / 100); // typiquement 0.01-0.05 => risque 0.5-0.5
    risque = Math.max(0, Math.min(1, 0.3 + volatility * 2));
  }

  // Score : base 5, bonus/malus selon variation %, léger malus si forte volatilité
  // dp en % : +5% => +0.5, -5% => -0.5
  let score = 5 + (dp / 10) - (risque * 0.5);
  score = Math.max(0, Math.min(10, score));
  score = Math.round(score * 10) / 10;

  return {
    score_simplifie: score,
    rendement,
    risque: Math.round(risque * 100) / 100,
    version_algo: VERSION_ALGO,
  };
}

module.exports = {
  computeScore,
  VERSION_ALGO,
};
