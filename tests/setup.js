/**
 * Configuration Jest : environnement de test.
 * On désactive la BDD et l'API Finnhub pour utiliser le mode mémoire (déterministe).
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.FINNHUB_API_KEY = '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
