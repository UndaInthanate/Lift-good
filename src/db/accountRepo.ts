import { Account } from '@/types';
import { getDb } from './database';

interface AccountRow {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string | null;
  icon: string | null;
  created_at: string;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    balance: row.balance,
    color: row.color ?? '#10B981',
    icon: row.icon ?? 'cash',
    createdAt: row.created_at,
  };
}

export async function getAllAccounts(): Promise<Account[]> {
  const rows = await getDb().getAllAsync<AccountRow>(
    'SELECT * FROM accounts ORDER BY created_at ASC',
  );
  return rows.map(rowToAccount);
}

export async function insertAccount(account: Account): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO accounts (id, name, type, balance, color, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [account.id, account.name, account.type, account.balance, account.color, account.icon, account.createdAt],
  );
}

export async function updateAccount(account: Account): Promise<void> {
  await getDb().runAsync(
    'UPDATE accounts SET name = ?, type = ?, balance = ?, color = ?, icon = ? WHERE id = ?',
    [account.name, account.type, account.balance, account.color, account.icon, account.id],
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const db = getDb();
  // detach references first (FK constraints are ON)
  await db.runAsync('UPDATE debts SET account_id = NULL WHERE account_id = ?', [id]);
  await db.runAsync('UPDATE recurring_transactions SET account_id = NULL WHERE account_id = ?', [id]);
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

export async function adjustBalance(accountId: string, delta: number): Promise<void> {
  await getDb().runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
    delta,
    accountId,
  ]);
}

export async function countAccountTransactions(accountId: string): Promise<number> {
  const row = await getDb().getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM transactions WHERE account_id = ? OR to_account_id = ?',
    [accountId, accountId],
  );
  return row?.c ?? 0;
}

/** Move all transactions from one account to another (used before deleting an account). */
export async function moveTransactions(fromId: string, toId: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE transactions SET account_id = ? WHERE account_id = ?', [toId, fromId]);
  await db.runAsync('UPDATE transactions SET to_account_id = ? WHERE to_account_id = ?', [
    toId,
    fromId,
  ]);
}

export async function deleteAccountTransactions(accountId: string): Promise<void> {
  await getDb().runAsync(
    'DELETE FROM transactions WHERE account_id = ? OR to_account_id = ?',
    [accountId, accountId],
  );
}
