import { z } from 'zod';
import { PaymentCategory, PaymentStatus, PaymentType } from '../types/payment';

export const paymentCreateSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  type: z.enum(["income", "expense"]) as z.ZodType<PaymentType>,
  category: z.enum([
    "salary","freelance","investment","other-income",
    "rent","utilities","groceries","transport","entertainment",
    "healthcare","education","shopping","subscription","other-expense"
  ]) as z.ZodType<PaymentCategory>,
  tags: z.array(z.string()).default([]),
  status: z.enum(["pending","completed","failed","cancelled"]) as z.ZodType<PaymentStatus>,
  method: z.string().optional(),
  merchant: z.string().optional(),
  date: z.string(),
  dueDate: z.string().optional(),
  recurringRule: z.object({
    frequency: z.enum(["daily","weekly","monthly","yearly"]),
    interval: z.number().int().positive(),
    endDate: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
