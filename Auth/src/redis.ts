import Redis from 'ioredis';
import { config } from './config';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
