import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  authUrl: process.env.AUTH_URL || 'http://localhost:4003',
  paymentUrl: process.env.PAYMENT_URL || 'http://localhost:4001',
  budgetUrl: process.env.BUDGET_URL || 'http://localhost:4002',
};
