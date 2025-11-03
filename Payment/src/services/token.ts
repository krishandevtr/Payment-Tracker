import jwt from 'jsonwebtoken';
import { config } from '../config';

let helper: any = null;
try {
  const common = require('@dev_ticketing/common');
  helper = common?.jwthelper || common?.jwtHelper || common?.jwt || null;
} catch (_) {
  helper = null;
}

export function signJwt(payload: object): string {
  if (helper && typeof helper.sign === 'function') return helper.sign(payload);
  return jwt.sign(payload as any, config.jwtKey);
}

export function verifyJwt(token: string): any {
  if (helper && typeof helper.verify === 'function') return helper.verify(token);
  return jwt.verify(token, config.jwtKey);
}
