import { create } from 'zustand';
import { RecurringTransaction } from '@/types';
import * as recurringRepo from '@/db/recurringRepo';

interface RecurringState {
  items: RecurringTransaction[];
  load: () => Promise<void>;
  add: (item: RecurringTransaction) => Promise<void>;
  update: (item: RecurringTransaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  items: [],
  load: async () => {
    set({ items: await recurringRepo.getAllRecurring() });
  },
  add: async (item) => {
    await recurringRepo.insertRecurring(item);
    await get().load();
  },
  update: async (item) => {
    await recurringRepo.updateRecurring(item);
    await get().load();
  },
  remove: async (id) => {
    await recurringRepo.deleteRecurring(id);
    await get().load();
  },
}));
