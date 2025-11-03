import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  jwtKey: process.env.JWT_KEY || 'dev_jwt_key',
};
