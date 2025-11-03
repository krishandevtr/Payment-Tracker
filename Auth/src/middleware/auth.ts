import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../services/token';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; name?: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice('Bearer '.length);
  try {
    const payload = verifyJwt(token) as any;
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
