import { Debt } from '@/types';
import { toDateKey } from './format';

export interface DebtComputed {
  /** ยอดหนี้รวมดอกเบี้ย (ถ้ามี) */
  totalWithInterest: number;
  paidAmount: number;
  remainingAmount: number;
  remainingMonths: number;
  remainingYears: number;
  remainingMonthsAfterYears: number;
  progressPercent: number; // 0-100
  nextDueDate: string; // YYYY-MM-DD
  totalInstallments: number;
}

export function computeDebt(debt: Debt, now = new Date()): DebtComputed {
  const paidAmount = debt.paidInstallments * debt.monthlyPayment;

  let totalWithInterest = debt.totalAmount;
  if (debt.interestRate > 0 && debt.monthlyPayment > 0) {
    // simple interest over the planned term
    const plannedMonths = Math.ceil(debt.totalAmount / debt.monthlyPayment);
    const years = plannedMonths / 12;
    totalWithInterest = debt.totalAmount * (1 + (debt.interestRate / 100) * years);
  }

  const remainingAmount = Math.max(0, totalWithInterest - paidAmount);
  const remainingMonths =
    debt.monthlyPayment > 0 ? Math.ceil(remainingAmount / debt.monthlyPayment) : 0;
  const remainingYears = Math.floor(remainingMonths / 12);
  const remainingMonthsAfterYears = remainingMonths % 12;
  const progressPercent =
    totalWithInterest > 0 ? Math.min(100, (paidAmount / totalWithInterest) * 100) : 100;

  const totalInstallments =
    debt.monthlyPayment > 0 ? Math.ceil(totalWithInterest / debt.monthlyPayment) : 0;

  // next due date: the (paidInstallments + 1)-th installment counted from startDate
  const start = new Date(debt.startDate);
  const nextIndex = debt.paidInstallments; // 0-based index of next unpaid installment
  const dueMonth = new Date(start.getFullYear(), start.getMonth() + nextIndex, 1);
  const daysInMonth = new Date(dueMonth.getFullYear(), dueMonth.getMonth() + 1, 0).getDate();
  const nextDue = new Date(
    dueMonth.getFullYear(),
    dueMonth.getMonth(),
    Math.min(debt.dueDay, daysInMonth),
  );
  // if that already passed relative to "now" and debt is active, it is overdue — keep the date
  return {
    totalWithInterest,
    paidAmount,
    remainingAmount,
    remainingMonths,
    remainingYears,
    remainingMonthsAfterYears,
    progressPercent,
    nextDueDate: toDateKey(nextDue),
    totalInstallments,
  };
}

export type InstallmentStatus = 'paid' | 'overdue' | 'upcoming';

export interface InstallmentItem {
  index: number; // 1-based
  dueDate: string;
  status: InstallmentStatus;
}

/** Timeline of every installment from startDate through the full term. */
export function buildInstallmentTimeline(debt: Debt, now = new Date()): InstallmentItem[] {
  const computed = computeDebt(debt, now);
  const count = Math.max(computed.totalInstallments, debt.paidInstallments);
  const start = new Date(debt.startDate);
  const todayStr = toDateKey(now);
  const items: InstallmentItem[] = [];
  for (let i = 0; i < count; i++) {
    const month = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const due = new Date(month.getFullYear(), month.getMonth(), Math.min(debt.dueDay, daysInMonth));
    const dueStr = toDateKey(due);
    let status: InstallmentStatus;
    if (i < debt.paidInstallments) status = 'paid';
    else if (dueStr < todayStr) status = 'overdue';
    else status = 'upcoming';
    items.push({ index: i + 1, dueDate: dueStr, status });
  }
  return items;
}
