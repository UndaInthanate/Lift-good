import { Transaction } from '@/types';
import * as accountRepo from '@/db/accountRepo';
import * as transactionRepo from '@/db/transactionRepo';

/** Apply a transaction's effect to account balances. */
async function applyBalance(t: Transaction, direction: 1 | -1): Promise<void> {
  if (t.type === 'expense') {
    await accountRepo.adjustBalance(t.accountId, -t.amount * direction);
  } else if (t.type === 'income') {
    await accountRepo.adjustBalance(t.accountId, t.amount * direction);
  } else if (t.type === 'transfer' && t.toAccountId) {
    await accountRepo.adjustBalance(t.accountId, -t.amount * direction);
    await accountRepo.adjustBalance(t.toAccountId, t.amount * direction);
  }
}

export async function createTransaction(t: Transaction): Promise<void> {
  await transactionRepo.insertTransaction(t);
  await applyBalance(t, 1);
}

/** Reverse old balance effect, apply the new one. */
export async function editTransaction(oldT: Transaction, newT: Transaction): Promise<void> {
  await applyBalance(oldT, -1);
  await transactionRepo.updateTransaction(newT);
  await applyBalance(newT, 1);
}

/** Delete and give the money back to the account(s). */
export async function removeTransaction(t: Transaction): Promise<void> {
  await applyBalance(t, -1);
  await transactionRepo.deleteTransaction(t.id);
}
