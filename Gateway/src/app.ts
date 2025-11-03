import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config';

export const app = express();
app.use(cors());

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Proxies
app.use(
  ['/api/auth', '/api/auth/*'],
  createProxyMiddleware({ target: config.authUrl, changeOrigin: true })
);

app.use(
  ['/api/payments', '/api/payments/*'],
  createProxyMiddleware({ target: config.paymentUrl, changeOrigin: true })
);

app.use(
  ['/api/budgets', '/api/budgets/*'],
  createProxyMiddleware({ target: config.budgetUrl, changeOrigin: true })
);

// 404 fallback
app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
