import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { paymentCreateSchema, paymentUpdateSchema, bulkDeleteSchema } from '../validation/paymentSchemas';
import { listPayments, createPayment, updatePayment, deletePayment, bulkDeletePayments, getPayment } from '../services/paymentStore';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const items = await listPayments(req.user!.id);
  return res.json({ payments: items });
});

paymentsRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const parse = paymentCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  const record = await createPayment(req.user!.id, parse.data as any);
  return res.status(201).json({ payment: record });
});

paymentsRouter.put('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const parse = paymentUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  const existing = await getPayment(req.user!.id, id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const updated = await updatePayment(req.user!.id, id, parse.data as any);
  return res.json({ payment: updated });
});

paymentsRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const ok = await deletePayment(req.user!.id, id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.status(204).send();
});

paymentsRouter.post('/bulk-delete', async (req: AuthenticatedRequest, res) => {
  const parse = bulkDeleteSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });
  await bulkDeletePayments(req.user!.id, parse.data.ids);
  return res.status(204).send();
});
