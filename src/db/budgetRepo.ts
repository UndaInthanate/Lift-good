import { Budget } from '@/types';
import { getDb } from './database';

interface BudgetRow {
  id: string;
  category_id: string;
  amount: number;
  month: string;
}

function rowToBudget(row: BudgetRow): Budget {
  return { id: row.id, categoryId: row.category_id, amount: row.amount, month: row.month };
}

export async function getBudgetsForMonth(month: string): Promise<Budget[]> {
  const rows = await getDb().getAllAsync<BudgetRow>('SELECT * FROM budgets WHERE month = ?', [
    month,
  ]);
  return rows.map(rowToBudget);
}

export async function upsertBudget(budget: Budget): Promise<void> {
  const db = getDb();
  const existing = await db.getFirstAsync<BudgetRow>(
    'SELECT * FROM budgets WHERE category_id = ? AND month = ?',
    [budget.categoryId, budget.month],
  );
  if (existing) {
    await db.runAsync('UPDATE budgets SET amount = ? WHERE id = ?', [budget.amount, existing.id]);
  } else {
    await db.runAsync('INSERT INTO budgets (id, category_id, amount, month) VALUES (?, ?, ?, ?)', [
      budget.id,
      budget.categoryId,
      budget.amount,
      budget.month,
    ]);
  }
}

export async function deleteBudget(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}
