import { Router } from 'express';
import { registerSchema, loginSchema } from '../validation/authSchemas';
import { createUser, validateUser, findUserById } from '../services/userStore';
import { signJwt } from '../services/token';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { name, email, password } = parse.data;
  try {
    const user = await createUser(name, email, password);
    const token = signJwt({ id: user.id, email: user.email, name: user.name });
    const safeUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    if (err.message === 'Email in use') {
      return res.status(400).json({ error: 'Email in use' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const { email, password } = parse.data;
  const user = await validateUser(email, password);
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = signJwt({ id: user.id, email: user.email, name: user.name });
  const safeUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  return res.json({ user: safeUser, token });
});

authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = req.user!.id;
  const user = await findUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const safeUser = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  return res.json({ user: safeUser });
});
