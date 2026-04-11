/**
 * Tests API – Routes Express (sp500, search, auth, favorites)
 * Utilise supertest contre l'app exportée par app.js (mode mémoire si pas de BDD).
 */

const request = require('supertest');
const app = require('../app');

describe('GET /api/sp500/list', () => {
  test('répond 200 et renvoie items, total, limit, offset', async () => {
    const res = await request(app).get('/api/sp500/list').query({ limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('offset');
  });

  test('chaque item a symbol, name, sector (ou champs attendus)', async () => {
    const res = await request(app).get('/api/sp500/list').query({ limit: 5 });
    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(item).toHaveProperty('symbol');
      expect(item).toHaveProperty('name');
    }
  });

  test('accepte query q, sort, order, page, limit', async () => {
    const res = await request(app)
      .get('/api/sp500/list')
      .query({ q: 'apple', sort: 'name', order: 'asc', page: 1, limit: 20 });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(20);
  });
});

describe('GET /api/search', () => {
  test('sans paramètre q renvoie 400', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('avec q renvoie 200 et un objet avec ticker, score_simplifie (ou fallback)', async () => {
    const res = await request(app).get('/api/search').query({ q: 'AAPL' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ticker');
    expect(res.body).toHaveProperty('score_simplifie');
    expect(res.body).toHaveProperty('rendement');
    expect(res.body).toHaveProperty('risque');
  });
});

describe('POST /auth/register', () => {
  const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  test('sans email ou mot de passe renvoie 400', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('inscription valide renvoie 201, token et user', async () => {
    const email = unique();
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'TestPass123!' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(email);
  });

  test('double inscription même email renvoie 409', async () => {
    const email = unique();
    await request(app).post('/auth/register').send({ email, password: 'TestPass123!' });
    const res = await request(app).post('/auth/register').send({ email, password: 'OtherPass456!' });
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  test('sans email ou mot de passe renvoie 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('identifiants invalides renvoie 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'inconnu@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('après inscription, login renvoie 200 et token', async () => {
    const email = unique();
    const password = 'TestPass123!';
    await request(app).post('/auth/register').send({ email, password });
    const res = await request(app).post('/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });
});

describe('GET /api/favorites', () => {
  test('sans token renvoie 401', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  test('avec token valide renvoie 200 et tableau favorites', async () => {
    const email = `test-${Date.now()}@example.com`;
    const reg = await request(app).post('/auth/register').send({ email, password: 'TestPass123!' });
    const token = reg.body.token;
    const res = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('favorites');
    expect(Array.isArray(res.body.favorites)).toBe(true);
  });
});

describe('POST /api/favorites', () => {
  test('sans token renvoie 401', async () => {
    const res = await request(app).post('/api/favorites').send({ ticker: 'AAPL' });
    expect(res.status).toBe(401);
  });

  test('sans ticker renvoie 400', async () => {
    const email = `test-${Date.now()}@example.com`;
    const reg = await request(app).post('/auth/register').send({ email, password: 'TestPass123!' });
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('avec token et ticker renvoie 201 et favorite', async () => {
    const email = `test-${Date.now()}@example.com`;
    const reg = await request(app).post('/auth/register').send({ email, password: 'TestPass123!' });
    const res = await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ ticker: 'MSFT', name: 'Microsoft' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('favorite');
    expect(res.body.favorite.ticker).toBe('MSFT');
  });
});

describe('DELETE /api/favorites/:ticker', () => {
  test('sans token renvoie 401', async () => {
    const res = await request(app).delete('/api/favorites/AAPL');
    expect(res.status).toBe(401);
  });

  test('avec token renvoie 200 et removed', async () => {
    const email = `test-${Date.now()}@example.com`;
    const reg = await request(app).post('/auth/register').send({ email, password: 'TestPass123!' });
    const token = reg.body.token;
    await request(app).post('/api/favorites').set('Authorization', `Bearer ${token}`).send({ ticker: 'GOOGL' });
    const res = await request(app).delete('/api/favorites/GOOGL').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('removed');
  });
});
