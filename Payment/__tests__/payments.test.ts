import request from 'supertest';
import { app } from '../src/app';
import { getRedis, closeRedis } from '../src/redis';
import { signJwt } from '../src/services/token';

const user = { id: 'user-1', email: 'u1@example.com', name: 'U1' };
const token = `Bearer ${signJwt(user)}`;
const otherUser = { id: 'user-2', email: 'u2@example.com', name: 'U2' };
const otherToken = `Bearer ${signJwt(otherUser)}`;

beforeEach(async () => {
  const redis = getRedis();
  await redis.flushall();
});

afterAll(async () => {
  await closeRedis();
});

describe('Payments API', () => {
  it('requires auth', async () => {
    await request(app).get('/api/payments').expect(401);
  });

  it('creates, lists, updates, deletes a payment', async () => {
    const create = await request(app)
      .post('/api/payments')
      .set('Authorization', token)
      .send({
        title: 'Test', amount: 10.5, currency: 'USD', type: 'expense', category: 'groceries',
        tags: [], status: 'completed', date: new Date().toISOString(),
      })
      .expect(201);

    const payment = create.body.payment;
    expect(payment.id).toBeDefined();

    const list = await request(app)
      .get('/api/payments')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.payments).toHaveLength(1);

    const update = await request(app)
      .put(`/api/payments/${payment.id}`)
      .set('Authorization', token)
      .send({ amount: 20 })
      .expect(200);
    expect(update.body.payment.amount).toBe(20);

    await request(app)
      .delete(`/api/payments/${payment.id}`)
      .set('Authorization', token)
      .expect(204);

    const list2 = await request(app)
      .get('/api/payments')
      .set('Authorization', token)
      .expect(200);
    expect(list2.body.payments).toHaveLength(0);
  });

  it('bulk deletes only own payments', async () => {
    const p1 = await request(app)
      .post('/api/payments')
      .set('Authorization', token)
      .send({ title: 'A', amount: 1, currency: 'USD', type: 'income', category: 'salary', tags: [], status: 'completed', date: new Date().toISOString() })
      .expect(201);
    const p2 = await request(app)
      .post('/api/payments')
      .set('Authorization', token)
      .send({ title: 'B', amount: 2, currency: 'USD', type: 'expense', category: 'groceries', tags: [], status: 'completed', date: new Date().toISOString() })
      .expect(201);
    const other = await request(app)
      .post('/api/payments')
      .set('Authorization', otherToken)
      .send({ title: 'X', amount: 3, currency: 'USD', type: 'expense', category: 'rent', tags: [], status: 'completed', date: new Date().toISOString() })
      .expect(201);

    await request(app)
      .post('/api/payments/bulk-delete')
      .set('Authorization', token)
      .send({ ids: [p1.body.payment.id, p2.body.payment.id, other.body.payment.id] })
      .expect(204);

    const list = await request(app)
      .get('/api/payments')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.payments).toHaveLength(0);

    const listOther = await request(app)
      .get('/api/payments')
      .set('Authorization', otherToken)
      .expect(200);
    expect(listOther.body.payments).toHaveLength(1);
  });

  it('prevents cross-user update/delete', async () => {
    const create = await request(app)
      .post('/api/payments')
      .set('Authorization', token)
      .send({ title: 'Test', amount: 10, currency: 'USD', type: 'expense', category: 'groceries', tags: [], status: 'completed', date: new Date().toISOString() })
      .expect(201);

    await request(app)
      .put(`/api/payments/${create.body.payment.id}`)
      .set('Authorization', otherToken)
      .send({ amount: 99 })
      .expect(404);

    await request(app)
      .delete(`/api/payments/${create.body.payment.id}`)
      .set('Authorization', otherToken)
      .expect(404);
  });

  it('validates input', async () => {
    await request(app)
      .post('/api/payments')
      .set('Authorization', token)
      .send({ title: '', amount: -1 })
      .expect(400);
  });
});
