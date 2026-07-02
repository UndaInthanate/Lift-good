import { CategorySum, Transaction, TransactionFilter } from '@/types';
import { getDb } from './database';

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  note: string | null;
  date: string;
  receipt_image: string | null;
  is_recurring: number;
  recurring_id: string | null;
  debt_id: string | null;
  created_at: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type as Transaction['type'],
    amount: row.amount,
    categoryId: row.category_id ?? '',
    accountId: row.account_id,
    toAccountId: row.to_account_id ?? undefined,
    note: row.note ?? '',
    date: row.date,
    receiptImage: row.receipt_image ?? undefined,
    isRecurring: row.is_recurring === 1,
    recurringId: row.recurring_id ?? undefined,
    debtId: row.debt_id ?? undefined,
    createdAt: row.created_at,
  };
}

function buildWhere(filter: TransactionFilter): { where: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (filter.type) {
    clauses.push('type = ?');
    params.push(filter.type);
  }
  if (filter.accountId) {
    clauses.push('(account_id = ? OR to_account_id = ?)');
    params.push(filter.accountId, filter.accountId);
  }
  if (filter.categoryId) {
    clauses.push('category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter.startDate) {
    clauses.push('date >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    clauses.push('date <= ?');
    params.push(filter.endDate);
  }
  if (filter.search) {
    clauses.push('note LIKE ?');
    params.push(`%${filter.search}%`);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function queryTransactions(
  filter: TransactionFilter = {},
  limit?: number,
): Promise<Transaction[]> {
  const { where, params } = buildWhere(filter);
  const limitSql = limit ? `LIMIT ${limit}` : '';
  const rows = await getDb().getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC ${limitSql}`,
    params,
  );
  return rows.map(rowToTransaction);
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const row = await getDb().getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  return row ? rowToTransaction(row) : null;
}

export async function insertTransaction(t: Transaction): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO transactions
      (id, type, amount, category_id, account_id, to_account_id, note, date,
       receipt_image, is_recurring, recurring_id, debt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.id,
      t.type,
      t.amount,
      t.categoryId || null,
      t.accountId,
      t.toAccountId ?? null,
      t.note,
      t.date,
      t.receiptImage ?? null,
      t.isRecurring ? 1 : 0,
      t.recurringId ?? null,
      t.debtId ?? null,
      t.createdAt,
    ],
  );
}

export async function updateTransaction(t: Transaction): Promise<void> {
  await getDb().runAsync(
    `UPDATE transactions SET
      type = ?, amount = ?, category_id = ?, account_id = ?, to_account_id = ?,
      note = ?, date = ?, receipt_image = ?
     WHERE id = ?`,
    [
      t.type,
      t.amount,
      t.categoryId || null,
      t.accountId,
      t.toAccountId ?? null,
      t.note,
      t.date,
      t.receiptImage ?? null,
      t.id,
    ],
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

/** Sum income / expense for a date range (transfers excluded). */
export async function sumByType(
  startDate: string,
  endDate: string,
): Promise<{ income: number; expense: number }> {
  const rows = await getDb().getAllAsync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) AS total FROM transactions
     WHERE date >= ? AND date <= ? AND type IN ('income', 'expense')
     GROUP BY type`,
    [startDate, endDate],
  );
  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (row.type === 'income') income = row.total;
    if (row.type === 'expense') expense = row.total;
  }
  return { income, expense };
}

/** Daily expense totals for a date range, keyed by YYYY-MM-DD. */
export async function dailyExpenseTotals(
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  const rows = await getDb().getAllAsync<{ d: string; total: number }>(
    `SELECT date AS d, SUM(amount) AS total FROM transactions
     WHERE date >= ? AND date <= ? AND type = 'expense'
     GROUP BY date`,
    [startDate, endDate],
  );
  const map: Record<string, number> = {};
  for (const row of rows) map[row.d] = row.total;
  return map;
}

/** Sums per category for a date range and type (transfers excluded). */
export async function sumByCategory(
  startDate: string,
  endDate: string,
  type: 'income' | 'expense',
): Promise<CategorySum[]> {
  const rows = await getDb().getAllAsync<{ category_id: string | null; total: number }>(
    `SELECT category_id, SUM(amount) AS total FROM transactions
     WHERE date >= ? AND date <= ? AND type = ?
     GROUP BY category_id ORDER BY total DESC`,
    [startDate, endDate, type],
  );
  return rows.map((r) => ({ categoryId: r.category_id ?? '', total: r.total }));
}

/** Monthly income vs expense over the calendar months intersecting the range. */
export async function monthlyTotals(
  startDate: string,
  endDate: string,
): Promise<{ month: string; income: number; expense: number }[]> {
  const rows = await getDb().getAllAsync<{ m: string; type: string; total: number }>(
    `SELECT substr(date, 1, 7) AS m, type, SUM(amount) AS total FROM transactions
     WHERE date >= ? AND date <= ? AND type IN ('income', 'expense')
     GROUP BY m, type ORDER BY m`,
    [startDate, endDate],
  );
  const map = new Map<string, { month: string; income: number; expense: number }>();
  for (const row of rows) {
    const entry = map.get(row.m) ?? { month: row.m, income: 0, expense: 0 };
    if (row.type === 'income') entry.income = row.total;
    else entry.expense = row.total;
    map.set(row.m, entry);
  }
  return Array.from(map.values());
}

/** Expense total for one category within a date range (budget usage). */
export async function categoryExpenseTotal(
  categoryId: string,
  startDate: string,
  endDate: string,
): Promise<number> {
  const row = await getDb().getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM transactions
     WHERE category_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
    [categoryId, startDate, endDate],
  );
  return row?.total ?? 0;
}

export async function existsRecurringOccurrence(
  recurringId: string,
  date: string,
): Promise<boolean> {
  const row = await getDb().getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM transactions WHERE recurring_id = ? AND date = ?',
    [recurringId, date],
  );
  return (row?.c ?? 0) > 0;
}

export async function getAllTransactionsForExport(): Promise<Transaction[]> {
  const rows = await getDb().getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY date ASC, created_at ASC',
  );
  return rows.map(rowToTransaction);
}
