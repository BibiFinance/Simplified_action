/**
 * Tests unitaires – Calcul du score simplifié (lib/score.js)
 */

const { computeScore, VERSION_ALGO } = require('../lib/score');

describe('computeScore', () => {
  test('retourne une structure avec score_simplifie, rendement, risque, version_algo', () => {
    const quote = { c: 100, dp: 2, h: 102, l: 98 };
    const result = computeScore(quote);
    expect(result).toHaveProperty('score_simplifie');
    expect(result).toHaveProperty('rendement');
    expect(result).toHaveProperty('risque');
    expect(result).toHaveProperty('version_algo', VERSION_ALGO);
  });

  test('sans quote valide retourne score 5 et rendement 0', () => {
    expect(computeScore(null)).toEqual({
      score_simplifie: 5,
      rendement: 0,
      risque: 0.5,
      version_algo: VERSION_ALGO,
    });
    expect(computeScore({})).toEqual({
      score_simplifie: 5,
      rendement: 0,
      risque: 0.5,
      version_algo: VERSION_ALGO,
    });
    expect(computeScore({ c: 'invalid' })).toEqual({
      score_simplifie: 5,
      rendement: 0,
      risque: 0.5,
      version_algo: VERSION_ALGO,
    });
  });

  test('score reste entre 0 et 10', () => {
    const low = computeScore({ c: 100, dp: -100, h: 100, l: 50 });
    const high = computeScore({ c: 100, dp: 100, h: 100, l: 100 });
    expect(low.score_simplifie).toBeGreaterThanOrEqual(0);
    expect(high.score_simplifie).toBeLessThanOrEqual(10);
  });

  test('variation positive (dp > 0) augmente le score par rapport à dp = 0', () => {
    const neutral = computeScore({ c: 100, dp: 0, h: 101, l: 99 });
    const positive = computeScore({ c: 100, dp: 5, h: 105, l: 99 });
    expect(positive.score_simplifie).toBeGreaterThan(neutral.score_simplifie);
  });

  test('rendement est la valeur absolue de dp arrondie', () => {
    const r = computeScore({ c: 100, dp: 2.456, h: 102, l: 98 });
    expect(r.rendement).toBe(2.46);
  });

  test('accepte un profil optionnel sans erreur', () => {
    const quote = { c: 100, dp: 1, h: 101, l: 99 };
    const withProfile = computeScore(quote, { name: 'Apple', finnhubIndustry: 'Technology' });
    expect(withProfile.score_simplifie).toBeDefined();
    expect(withProfile.version_algo).toBe(VERSION_ALGO);
  });
});
