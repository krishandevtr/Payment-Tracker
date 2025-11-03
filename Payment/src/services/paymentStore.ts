import { getRedis } from '../redis';
import { randomUUID } from 'crypto';
import { PaymentRecord } from '../types/payment';
import { kafkaProducer } from '../events/kafka';

const userIndexKey = (userId: string) => `payments:user:${userId}`; // set of ids
const paymentKey = (id: string) => `payment:${id}`;

export async function listPayments(userId: string): Promise<PaymentRecord[]> {
  const redis = getRedis();
  const ids = await redis.smembers(userIndexKey(userId));
  if (ids.length === 0) return [];
  const pipe = redis.multi();
  ids.forEach((id) => pipe.get(paymentKey(id)));
  const results = (await pipe.exec()) as [Error | null, string | null][];
  const items: PaymentRecord[] = [];
  for (const [, json] of results) {
    if (json) items.push(JSON.parse(json));
  }
  // Sort by date desc for convenience
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}

export async function createPayment(userId: string, data: Omit<PaymentRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord> {
  const redis = getRedis();
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: PaymentRecord = { id, userId, createdAt: now, updatedAt: now, ...data } as PaymentRecord;
  const p = redis.multi();
  p.set(paymentKey(id), JSON.stringify(record));
  p.sadd(userIndexKey(userId), id);
  await p.exec();
  await kafkaProducer.publish('payment.created', { id: record.id, userId: record.userId, amount: record.amount, type: record.type, category: record.category, date: record.date });
  return record;
}

export async function getPayment(userId: string, id: string): Promise<PaymentRecord | null> {
  const redis = getRedis();
  const json = await redis.get(paymentKey(id));
  if (!json) return null;
  const record = JSON.parse(json) as PaymentRecord;
  if (record.userId !== userId) return null;
  return record;
}

export async function updatePayment(userId: string, id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
  const current = await getPayment(userId, id);
  if (!current) return null;
  const updated: PaymentRecord = { ...current, ...updates, id: current.id, userId: current.userId, updatedAt: new Date().toISOString() };
  const redis = getRedis();
  await redis.set(paymentKey(id), JSON.stringify(updated));
  await kafkaProducer.publish('payment.updated', { id: updated.id, userId: updated.userId });
  return updated;
}

export async function deletePayment(userId: string, id: string): Promise<boolean> {
  const current = await getPayment(userId, id);
  if (!current) return false;
  const redis = getRedis();
  const p = redis.multi();
  p.del(paymentKey(id));
  p.srem(userIndexKey(userId), id);
  await p.exec();
  await kafkaProducer.publish('payment.deleted', { id, userId });
  return true;
}

export async function bulkDeletePayments(userId: string, ids: string[]): Promise<number> {
  const redis = getRedis();
  const pipe = redis.multi();
  let count = 0;
  for (const id of ids) {
    pipe.get(paymentKey(id));
  }
  const results = (await pipe.exec()) as [Error | null, string | null][];
  // new pipe for deletions
  const delPipe = redis.multi();
  ids.forEach((id, idx) => {
    const json = results[idx][1];
    if (!json) return;
    const rec = JSON.parse(json!) as PaymentRecord;
    if (rec.userId !== userId) return;
    delPipe.del(paymentKey(id));
    delPipe.srem(userIndexKey(userId), id);
    count++;
  });
  await delPipe.exec();
  if (count > 0) await kafkaProducer.publish('payment.bulkDeleted', { userId, ids });
  return count;
}
