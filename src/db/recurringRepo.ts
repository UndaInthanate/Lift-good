import { RecurringTransaction } from '@/types';
import { getDb } from './database';

interface RecurringRow {
  id: string;
  name: string;
  type: string;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  day_of_month: number | null;
  start_date: string;
  is_active: number;
}

function rowToRecurring(row: RecurringRow): RecurringTransaction {
  return {
    id: row.id,
    name: row.name,
    type: row.type as RecurringTransaction['type'],
    amount: row.amount,
    categoryId: row.category_id ?? '',
    accountId: row.account_id ?? '',
    frequency: row.frequency as RecurringTransaction['frequency'],
    dayOfMonth: row.day_of_month ?? 1,
    startDate: row.start_date,
    isActive: row.is_active === 1,
  };
}

export async function getAllRecurring(): Promise<RecurringTransaction[]> {
  const rows = await getDb().getAllAsync<RecurringRow>(
    'SELECT * FROM recurring_transactions ORDER BY rowid',
  );
  return rows.map(rowToRecurring);
}

export async function insertRecurring(r: RecurringTransaction): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO recurring_transactions
      (id, name, type, amount, category_id, account_id, frequency, day_of_month, start_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id,
      r.name,
      r.type,
      r.amount,
      r.categoryId || null,
      r.accountId || null,
      r.frequency,
      r.dayOfMonth,
      r.startDate,
      r.isActive ? 1 : 0,
    ],
  );
}

export async function updateRecurring(r: RecurringTransaction): Promise<void> {
  await getDb().runAsync(
    `UPDATE recurring_transactions SET
      name = ?, type = ?, amount = ?, category_id = ?, account_id = ?,
      frequency = ?, day_of_month = ?, start_date = ?, is_active = ?
     WHERE id = ?`,
    [
      r.name,
      r.type,
      r.amount,
      r.categoryId || null,
      r.accountId || null,
      r.frequency,
      r.dayOfMonth,
      r.startDate,
      r.isActive ? 1 : 0,
      r.id,
    ],
  );
}

export async function deleteRecurring(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
}
