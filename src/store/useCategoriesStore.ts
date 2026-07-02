import { create } from 'zustand';
import { Category } from '@/types';
import * as categoryRepo from '@/db/categoryRepo';

interface CategoriesState {
  categories: Category[];
  load: () => Promise<void>;
  add: (category: Category) => Promise<void>;
  update: (category: Category) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byId: (id: string) => Category | undefined;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  load: async () => {
    set({ categories: await categoryRepo.getAllCategories() });
  },
  add: async (category) => {
    await categoryRepo.insertCategory(category);
    await get().load();
  },
  update: async (category) => {
    await categoryRepo.updateCategory(category);
    await get().load();
  },
  remove: async (id) => {
    await categoryRepo.deleteCategory(id);
    await get().load();
  },
  byId: (id) => get().categories.find((c) => c.id === id),
}));
