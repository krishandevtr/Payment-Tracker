import request from 'supertest';
import { app } from '../src/app';
import { getRedis, closeRedis } from '../src/redis';
import { signJwt } from '../src/services/token';

const user = { id: 'user-1', email: 'u1@example.com', name: 'U1' };
const token = `Bearer ${signJwt(user)}`;

beforeEach(async () => {
  const redis = getRedis();
  await redis.flushall();
});

afterAll(async () => {
  await closeRedis();
});

describe('Budgets API', () => {
  it('requires auth', async () => {
    await request(app).get('/api/budgets').expect(401);
  });

  it('creates, lists, updates, enforces uniqueness, deletes budgets', async () => {
    const create = await request(app)
      .post('/api/budgets')
      .set('Authorization', token)
      .send({ category: 'groceries', amount: 500, period: 'monthly', currency: 'USD' })
      .expect(201);

    expect(create.body.budget.id).toBeDefined();

    // Duplicate for same category+period should fail
    await request(app)
      .post('/api/budgets')
      .set('Authorization', token)
      .send({ category: 'groceries', amount: 600, period: 'monthly', currency: 'USD' })
      .expect(400);

    // Update amount
    const updated = await request(app)
      .put(`/api/budgets/${create.body.budget.id}`)
      .set('Authorization', token)
      .send({ amount: 550 })
      .expect(200);
    expect(updated.body.budget.amount).toBe(550);

    // List
    const list = await request(app)
      .get('/api/budgets')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.budgets).toHaveLength(1);

    // Delete
    await request(app)
      .delete(`/api/budgets/${create.body.budget.id}`)
      .set('Authorization', token)
      .expect(204);

    const list2 = await request(app)
      .get('/api/budgets')
      .set('Authorization', token)
      .expect(200);
    expect(list2.body.budgets).toHaveLength(0);
  });
});
