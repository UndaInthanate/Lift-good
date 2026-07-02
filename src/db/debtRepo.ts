import { Debt } from '@/types';
import { getDb } from './database';

interface DebtRow {
  id: string;
  name: string;
  total_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  paid_installments: number;
  due_day: number;
  account_id: string | null;
  status: string;
  created_at: string;
}

function rowToDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    name: row.name,
    totalAmount: row.total_amount,
    interestRate: row.interest_rate,
    monthlyPayment: row.monthly_payment,
    startDate: row.start_date,
    paidInstallments: row.paid_installments,
    dueDay: row.due_day,
    accountId: row.account_id ?? '',
    status: row.status as Debt['status'],
    createdAt: row.created_at,
  };
}

export async function getAllDebts(): Promise<Debt[]> {
  const rows = await getDb().getAllAsync<DebtRow>(
    "SELECT * FROM debts ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, created_at DESC",
  );
  return rows.map(rowToDebt);
}

export async function insertDebt(debt: Debt): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO debts
      (id, name, total_amount, interest_rate, monthly_payment, start_date,
       paid_installments, due_day, account_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      debt.id,
      debt.name,
      debt.totalAmount,
      debt.interestRate,
      debt.monthlyPayment,
      debt.startDate,
      debt.paidInstallments,
      debt.dueDay,
      debt.accountId || null,
      debt.status,
      debt.createdAt,
    ],
  );
}

export async function updateDebt(debt: Debt): Promise<void> {
  await getDb().runAsync(
    `UPDATE debts SET
      name = ?, total_amount = ?, interest_rate = ?, monthly_payment = ?,
      start_date = ?, paid_installments = ?, due_day = ?, account_id = ?, status = ?
     WHERE id = ?`,
    [
      debt.name,
      debt.totalAmount,
      debt.interestRate,
      debt.monthlyPayment,
      debt.startDate,
      debt.paidInstallments,
      debt.dueDay,
      debt.accountId || null,
      debt.status,
      debt.id,
    ],
  );
}

export async function deleteDebt(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM debts WHERE id = ?', [id]);
}
