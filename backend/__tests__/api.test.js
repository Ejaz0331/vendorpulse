const request = require('supertest');
const app = require('../server');

describe('Production Readiness & API Smoke Tests', () => {
  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('POST /api/auth/login without credentials should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('required');
  });

  it('PUT /api/config with invalid weights sum should return 400', async () => {
    const res = await request(app)
      .put('/api/config')
      .send({ weights: { delivery: 50, quality: 10 } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('100%');
  });

  it('GET /api/nonexistent should return 404 JSON', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain('not found');
  });
});
