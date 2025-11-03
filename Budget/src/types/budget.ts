export type PaymentCategory =
  | "salary" | "freelance" | "investment" | "other-income"
  | "rent" | "utilities" | "groceries" | "transport" | "entertainment"
  | "healthcare" | "education" | "shopping" | "subscription" | "other-expense";

export type BudgetPeriod = "monthly" | "yearly";

export interface BudgetRecord {
  id: string;
  userId: string;
  category: PaymentCategory;
  amount: number;
  period: BudgetPeriod;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
