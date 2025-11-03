// Jest setup for Payment service

jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  return RedisMock;
});

jest.mock('./src/events/kafka', () => ({
  kafkaProducer: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@dev_ticketing/common', () => {
  const jwt = require('jsonwebtoken');
  const JWT_KEY = process.env.JWT_KEY || 'test_jwt_key';
  return {
    jwthelper: {
      sign: (payload: any) => jwt.sign(payload, JWT_KEY),
      verify: (token: string) => jwt.verify(token, JWT_KEY),
    },
  };
});

process.env.JWT_KEY = process.env.JWT_KEY || 'test_jwt_key';
