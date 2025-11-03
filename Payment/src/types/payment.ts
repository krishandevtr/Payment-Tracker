export type PaymentType = "income" | "expense";
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";
export type PaymentCategory =
  | "salary" | "freelance" | "investment" | "other-income"
  | "rent" | "utilities" | "groceries" | "transport" | "entertainment"
  | "healthcare" | "education" | "shopping" | "subscription" | "other-expense";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  frequency: RecurringFrequency;
  interval: number;
  endDate?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  title: string;
  amount: number;
  currency: string;
  type: PaymentType;
  category: PaymentCategory;
  tags: string[];
  status: PaymentStatus;
  method?: string;
  merchant?: string;
  date: string;
  dueDate?: string;
  recurringRule?: RecurringRule;
  notes?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
