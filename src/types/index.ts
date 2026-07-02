export type AccountType = 'cash' | 'bank' | 'credit_card' | 'e_wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isHidden: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note: string;
  date: string;
  receiptImage?: string;
  isRecurring: boolean;
  recurringId?: string;
  debtId?: string;
  createdAt: string;
}

export type DebtStatus = 'active' | 'completed';

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  paidInstallments: number;
  dueDay: number;
  accountId: string;
  status: DebtStatus;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // "2026-06"
}

export type RecurringFrequency = 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: string;
  isActive: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  currency: string;
  currencySymbol: string;
  theme: ThemeMode;
  monthStartDay: number;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "20:00"
  budgetWarningEnabled: boolean;
  debtReminderEnabled: boolean;
  debtReminderDaysBefore: number;
}

export interface TransactionFilter {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CategorySum {
  categoryId: string;
  total: number;
}
