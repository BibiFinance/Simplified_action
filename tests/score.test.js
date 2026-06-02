/**
 * Tests unitaires – lib/score.js (computeScore)
 */

const { computeScore, getScoreExplanation, VERSION_ALGO } = require('../lib/score');

describe('computeScore', () => {
  test('sans quote valide renvoie score 5 par défaut', () => {
    const r = computeScore(null);
    expect(r.score_simplifie).toBe(5);
    expect(r.version_algo).toBe(VERSION_ALGO);
  });

  test('quote positive augmente le score', () => {
    const r = computeScore({ c: 100, dp: 5, h: 102, l: 98 });
    expect(r.score_simplifie).toBeGreaterThan(5);
    expect(r.rendement).toBe(5);
  });

  test('score reste entre 0 et 10', () => {
    const r = computeScore({ c: 50, dp: 50, h: 100, l: 1 });
    expect(r.score_simplifie).toBeLessThanOrEqual(10);
    expect(r.score_simplifie).toBeGreaterThanOrEqual(0);
  });
});

describe('getScoreExplanation', () => {
  test('retourne une chaîne explicative', () => {
    const text = getScoreExplanation({ score_simplifie: 7.2, rendement: 1.5, risque: 0.4 });
    expect(typeof text).toBe('string');
    expect(text).toContain('7.2');
  });
});
