import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { budgetsRouter } from './routes/budgets';

export const app = express();
app.use(cors());
app.use(json());

app.use('/api/budgets', budgetsRouter);

app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
