import { Category } from '@/types';
import { getDb } from './database';

interface CategoryRow {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  is_default: number;
  is_hidden: number;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Category['type'],
    icon: row.icon ?? 'other',
    color: row.color ?? '#64748B',
    isDefault: row.is_default === 1,
    isHidden: row.is_hidden === 1,
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const rows = await getDb().getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY rowid');
  return rows.map(rowToCategory);
}

export async function insertCategory(category: Category): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO categories (id, name, type, icon, color, is_default, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      category.id,
      category.name,
      category.type,
      category.icon,
      category.color,
      category.isDefault ? 1 : 0,
      category.isHidden ? 1 : 0,
    ],
  );
}

export async function updateCategory(category: Category): Promise<void> {
  await getDb().runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, is_hidden = ? WHERE id = ?',
    [category.name, category.icon, category.color, category.isHidden ? 1 : 0, category.id],
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  // detach references first (FK constraints are ON)
  await db.runAsync('UPDATE transactions SET category_id = NULL WHERE category_id = ?', [id]);
  await db.runAsync('UPDATE recurring_transactions SET category_id = NULL WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM budgets WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function countCategoryTransactions(categoryId: string): Promise<number> {
  const row = await getDb().getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM transactions WHERE category_id = ?',
    [categoryId],
  );
  return row?.c ?? 0;
}
