import { create } from 'zustand';
import { Account } from '@/types';
import * as accountRepo from '@/db/accountRepo';

interface AccountsState {
  accounts: Account[];
  load: () => Promise<void>;
  add: (account: Account) => Promise<void>;
  update: (account: Account) => Promise<void>;
  remove: (id: string) => Promise<void>;
  totalBalance: () => number;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  load: async () => {
    set({ accounts: await accountRepo.getAllAccounts() });
  },
  add: async (account) => {
    await accountRepo.insertAccount(account);
    await get().load();
  },
  update: async (account) => {
    await accountRepo.updateAccount(account);
    await get().load();
  },
  remove: async (id) => {
    await accountRepo.deleteAccount(id);
    await get().load();
  },
  totalBalance: () => get().accounts.reduce((sum, a) => sum + a.balance, 0),
}));
