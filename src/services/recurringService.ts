import { RecurringTransaction, Transaction } from '@/types';
import * as recurringRepo from '@/db/recurringRepo';
import * as transactionRepo from '@/db/transactionRepo';
import { createTransaction } from './transactionService';
import { toDateKey } from '@/utils/format';
import { generateId } from '@/utils/id';

/**
 * All due dates of a recurring item from its startDate through today.
 * Monthly: every month on dayOfMonth (clamped to month length).
 * Weekly: every 7 days from startDate.
 */
function dueDatesUntilToday(r: RecurringTransaction, now = new Date()): string[] {
  const today = toDateKey(now);
  const start = new Date(r.startDate);
  const dates: string[] = [];

  if (r.frequency === 'weekly') {
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (toDateKey(cursor) <= today) {
      dates.push(toDateKey(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    let year = start.getFullYear();
    let month = start.getMonth();
    for (;;) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const due = new Date(year, month, Math.min(r.dayOfMonth, daysInMonth));
      const dueKey = toDateKey(due);
      if (dueKey > today) break;
      if (dueKey >= toDateKey(start)) dates.push(dueKey);
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      if (dates.length > 600) break; // safety cap
    }
  }
  return dates;
}

/**
 * Called on app start: create any missed occurrences of active recurring items.
 * Returns the number of transactions created.
 */
export async function processRecurringTransactions(now = new Date()): Promise<number> {
  const items = await recurringRepo.getAllRecurring();
  let created = 0;
  for (const r of items) {
    if (!r.isActive || !r.accountId) continue;
    const dueDates = dueDatesUntilToday(r, now);
    for (const date of dueDates) {
      const exists = await transactionRepo.existsRecurringOccurrence(r.id, date);
      if (exists) continue;
      const t: Transaction = {
        id: generateId(),
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId,
        accountId: r.accountId,
        note: r.name,
        date,
        isRecurring: true,
        recurringId: r.id,
        createdAt: new Date().toISOString(),
      };
      await createTransaction(t);
      created += 1;
    }
  }
  return created;
}

/** Next due date of a recurring item (for display / notifications). */
export function nextDueDate(r: RecurringTransaction, now = new Date()): string {
  const today = toDateKey(now);
  if (r.frequency === 'weekly') {
    const cursor = new Date(r.startDate);
    while (toDateKey(cursor) <= today) cursor.setDate(cursor.getDate() + 7);
    return toDateKey(cursor);
  }
  let year = now.getFullYear();
  let month = now.getMonth();
  for (let i = 0; i < 24; i++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const due = new Date(year, month, Math.min(r.dayOfMonth, daysInMonth));
    const dueKey = toDateKey(due);
    if (dueKey > today && dueKey >= r.startDate) return dueKey;
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return today;
}
