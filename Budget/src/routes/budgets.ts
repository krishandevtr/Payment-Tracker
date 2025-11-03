import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { budgetCreateSchema, budgetUpdateSchema } from '../validation/budgetSchemas';
import { listBudgets, createBudget, updateBudget, deleteBudget, getBudget } from '../services/budgetStore';

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);

budgetsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const items = await listBudgets(req.user!.id);
  return res.json({ budgets: items });
});

budgetsRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parse = budgetCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const record = await createBudget(req.user!.id, parse.data as any);
    return res.status(201).json({ budget: record });
  } catch (err: any) {
    if (err.message.includes('Budget exists')) return res.status(400).json({ error: 'Duplicate budget for category and period' });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

budgetsRouter.put('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const parse = budgetUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  try {
    const existing = await getBudget(req.user!.id, id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await updateBudget(req.user!.id, id, parse.data as any);
    return res.json({ budget: updated });
  } catch (err: any) {
    if (err.message.includes('Budget exists')) return res.status(400).json({ error: 'Duplicate budget for category and period' });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

budgetsRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const ok = await deleteBudget(req.user!.id, id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.status(204).send();
});
