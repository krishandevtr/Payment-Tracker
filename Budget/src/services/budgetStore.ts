import { getRedis } from '../redis';
import { randomUUID } from 'crypto';
import { BudgetRecord } from '../types/budget';
import { kafkaProducer } from '../events/kafka';

const budgetKey = (id: string) => `budget:${id}`;
const userIndexKey = (userId: string) => `budgets:user:${userId}`; // set of ids
const uniqueKey = (userId: string, category: string, period: string) => `budget:unique:${userId}:${category}:${period}`;

export async function listBudgets(userId: string): Promise<BudgetRecord[]> {
  const redis = getRedis();
  const ids = await redis.smembers(userIndexKey(userId));
  if (ids.length === 0) return [];
  const pipe = redis.multi();
  ids.forEach((id) => pipe.get(budgetKey(id)));
  const results = (await pipe.exec()) as [Error | null, string | null][];
  const items: BudgetRecord[] = [];
  for (const [, json] of results) {
    if (json) items.push(JSON.parse(json));
  }
  items.sort((a, b) => a.category.localeCompare(b.category));
  return items;
}

export async function createBudget(userId: string, data: Omit<BudgetRecord, 'id'|'userId'|'createdAt'|'updatedAt'>): Promise<BudgetRecord> {
  const redis = getRedis();
  const unique = await redis.get(uniqueKey(userId, data.category, data.period));
  if (unique) throw new Error('Budget exists for category+period');
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: BudgetRecord = { id, userId, createdAt: now, updatedAt: now, ...data } as BudgetRecord;
  const p = redis.multi();
  p.set(budgetKey(id), JSON.stringify(record));
  p.sadd(userIndexKey(userId), id);
  p.set(uniqueKey(userId, data.category, data.period), id);
  await p.exec();
  await kafkaProducer.publish('budget.created', { id: record.id, userId: record.userId, category: record.category, period: record.period, amount: record.amount });
  return record;
}

export async function getBudget(userId: string, id: string): Promise<BudgetRecord | null> {
  const redis = getRedis();
  const json = await redis.get(budgetKey(id));
  if (!json) return null;
  const rec = JSON.parse(json) as BudgetRecord;
  if (rec.userId !== userId) return null;
  return rec;
}

export async function updateBudget(userId: string, id: string, updates: Partial<BudgetRecord>): Promise<BudgetRecord | null> {
  const redis = getRedis();
  const current = await getBudget(userId, id);
  if (!current) return null;

  // Handle uniqueness when changing category/period
  const newCategory = updates.category ?? current.category;
  const newPeriod = updates.period ?? current.period;
  if (newCategory !== current.category || newPeriod !== current.period) {
    const exists = await redis.get(uniqueKey(userId, newCategory, newPeriod));
    if (exists && exists !== id) throw new Error('Budget exists for category+period');
    // Remove old unique key
    await redis.del(uniqueKey(userId, current.category, current.period));
    // Set new unique key
    await redis.set(uniqueKey(userId, newCategory, newPeriod), id);
  }

  const updated: BudgetRecord = { ...current, ...updates, id: current.id, userId: current.userId, updatedAt: new Date().toISOString() };
  await redis.set(budgetKey(id), JSON.stringify(updated));
  await kafkaProducer.publish('budget.updated', { id: updated.id, userId: updated.userId });
  return updated;
}

export async function deleteBudget(userId: string, id: string): Promise<boolean> {
  const redis = getRedis();
  const current = await getBudget(userId, id);
  if (!current) return false;
  const p = redis.multi();
  p.del(budgetKey(id));
  p.srem(userIndexKey(userId), id);
  p.del(uniqueKey(userId, current.category, current.period));
  await p.exec();
  await kafkaProducer.publish('budget.deleted', { id, userId });
  return true;
}
