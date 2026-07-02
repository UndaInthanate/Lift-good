import { create } from 'zustand';

/**
 * Transactions live in SQLite and are queried per-screen; this store only
 * carries a version counter so screens can re-query after any mutation.
 */
interface TransactionsState {
  version: number;
  bump: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
