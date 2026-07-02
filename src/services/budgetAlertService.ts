import { Budget, Category, Settings } from '@/types';
import * as budgetRepo from '@/db/budgetRepo';
import * as transactionRepo from '@/db/transactionRepo';
import * as settingsRepo from '@/db/settingsRepo';
import { getMonthRange } from '@/utils/dateRange';
import { toMonthKey } from '@/utils/format';
import { notifyNow } from './notificationService';

export type BudgetLevel = 'safe' | 'warning' | 'over';

export function budgetLevel(spent: number, amount: number): BudgetLevel {
  if (amount <= 0) return 'safe';
  const pct = (spent / amount) * 100;
  if (pct >= 100) return 'over';
  if (pct >= 70) return 'warning';
  return 'safe';
}

/**
 * After saving an expense, check its category budget and notify when crossing
 * 80% / 100%. Notify once per threshold per budget month (tracked via flags).
 */
export async function checkBudgetAfterExpense(
  categoryId: string,
  category: Category | undefined,
  settings: Settings,
  transactionDate: string,
): Promise<void> {
  if (!settings.budgetWarningEnabled || !categoryId) return;
  const refDate = new Date(transactionDate);
  const range = getMonthRange(refDate, settings.monthStartDay);
  const monthKey = toMonthKey(new Date(range.start));
  const budgets = await budgetRepo.getBudgetsForMonth(monthKey);
  const budget: Budget | undefined = budgets.find((b) => b.categoryId === categoryId);
  if (!budget || budget.amount <= 0) return;

  const spent = await transactionRepo.categoryExpenseTotal(categoryId, range.start, range.end);
  const pct = (spent / budget.amount) * 100;
  const name = category?.name ?? 'หมวดหมู่';

  if (pct >= 100) {
    const flagKey = `budget_alert_100_${budget.id}`;
    if ((await settingsRepo.getFlag(flagKey)) !== '1') {
      await settingsRepo.setFlag(flagKey, '1');
      await notifyNow(
        `งบ "${name}" เกินแล้ว! 🚨`,
        `ใช้ไปแล้ว ${Math.round(pct)}% ของงบประมาณเดือนนี้`,
      );
    }
  } else if (pct >= 80) {
    const flagKey = `budget_alert_80_${budget.id}`;
    if ((await settingsRepo.getFlag(flagKey)) !== '1') {
      await settingsRepo.setFlag(flagKey, '1');
      await notifyNow(
        `งบ "${name}" ใกล้หมดแล้ว ⚠️`,
        `ใช้ไปแล้ว ${Math.round(pct)}% ของงบประมาณเดือนนี้`,
      );
    }
  }
}
