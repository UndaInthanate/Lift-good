import { create } from 'zustand';
import { Debt, Transaction } from '@/types';
import * as debtRepo from '@/db/debtRepo';
import { createTransaction } from '@/services/transactionService';
import { generateId } from '@/utils/id';
import { todayKey } from '@/utils/format';

interface DebtsState {
  debts: Debt[];
  load: () => Promise<void>;
  add: (debt: Debt) => Promise<void>;
  update: (debt: Debt) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Mark next installment paid: bump counter + auto-create expense transaction. */
  payInstallment: (debt: Debt, expenseCategoryId: string) => Promise<void>;
  closeDebt: (debt: Debt) => Promise<void>;
}

export const useDebtsStore = create<DebtsState>((set, get) => ({
  debts: [],
  load: async () => {
    set({ debts: await debtRepo.getAllDebts() });
  },
  add: async (debt) => {
    await debtRepo.insertDebt(debt);
    await get().load();
  },
  update: async (debt) => {
    await debtRepo.updateDebt(debt);
    await get().load();
  },
  remove: async (id) => {
    await debtRepo.deleteDebt(id);
    await get().load();
  },
  payInstallment: async (debt, expenseCategoryId) => {
    const t: Transaction = {
      id: generateId(),
      type: 'expense',
      amount: debt.monthlyPayment,
      categoryId: expenseCategoryId,
      accountId: debt.accountId,
      note: `จ่ายงวด ${debt.name} (งวดที่ ${debt.paidInstallments + 1})`,
      date: todayKey(),
      isRecurring: false,
      debtId: debt.id,
      createdAt: new Date().toISOString(),
    };
    await createTransaction(t);
    await debtRepo.updateDebt({ ...debt, paidInstallments: debt.paidInstallments + 1 });
    await get().load();
  },
  closeDebt: async (debt) => {
    await debtRepo.updateDebt({ ...debt, status: 'completed' });
    await get().load();
  },
}));
