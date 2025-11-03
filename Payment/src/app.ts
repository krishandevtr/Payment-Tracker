import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { paymentsRouter } from './routes/payments';

export const app = express();
app.use(cors());
app.use(json());

app.use('/api/payments', paymentsRouter);

app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
