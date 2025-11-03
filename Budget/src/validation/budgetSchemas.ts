import { z } from 'zod';

export const budgetCreateSchema = z.object({
  category: z.enum([
    "salary","freelance","investment","other-income",
    "rent","utilities","groceries","transport","entertainment",
    "healthcare","education","shopping","subscription","other-expense"
  ]),
  amount: z.number().positive(),
  period: z.enum(["monthly","yearly"]),
  currency: z.string().min(1),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();
