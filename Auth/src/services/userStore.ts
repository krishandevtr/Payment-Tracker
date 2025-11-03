import { getRedis } from '../redis';
import { hashPassword, comparePassword } from '../utils/password';
import { kafkaProducer } from '../events/kafka';
import { randomUUID } from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const keyById = (id: string) => `user:${id}`;
const keyByEmail = (email: string) => `user:email:${email.toLowerCase()}`;

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const redis = getRedis();
  const id = await redis.get(keyByEmail(email));
  if (!id) return null;
  const json = await redis.get(keyById(id));
  return json ? (JSON.parse(json) as UserRecord) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const redis = getRedis();
  const json = await redis.get(keyById(id));
  return json ? (JSON.parse(json) as UserRecord) : null;
}

export async function createUser(name: string, email: string, password: string): Promise<UserRecord> {
  const redis = getRedis();
  const existing = await redis.get(keyByEmail(email));
  if (existing) {
    throw new Error('Email in use');
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: UserRecord = {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };
  const p = redis.multi();
  p.set(keyById(id), JSON.stringify(record));
  p.set(keyByEmail(email), id);
  await p.exec();

  // Publish user.created event (fire-and-forget)
  await kafkaProducer.publish('user.created', {
    id: record.id,
    name: record.name,
    email: record.email,
    createdAt: record.createdAt,
  });

  return record;
}

export async function validateUser(email: string, password: string): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await comparePassword(password, user.passwordHash);
  return ok ? user : null;
}
