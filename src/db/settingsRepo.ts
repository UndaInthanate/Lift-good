import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import { getDb } from './database';

export async function loadSettings(): Promise<Settings> {
  const rows = await getDb().getAllAsync<{ key: string; value: string }>('SELECT * FROM settings');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const raw = map.get('app_settings');
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['app_settings', JSON.stringify(settings)],
  );
}

export async function getFlag(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setFlag(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}
