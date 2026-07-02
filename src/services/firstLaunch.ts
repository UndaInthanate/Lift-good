import { Account } from '@/types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_SETTINGS,
} from '@/constants/defaults';
import * as accountRepo from '@/db/accountRepo';
import * as categoryRepo from '@/db/categoryRepo';
import * as settingsRepo from '@/db/settingsRepo';
import { generateId } from '@/utils/id';

const FIRST_LAUNCH_KEY = 'first_launch_done';

/** Seed default data on first launch. Returns true if this was the first launch. */
export async function runFirstLaunchSetup(): Promise<boolean> {
  const done = await settingsRepo.getFlag(FIRST_LAUNCH_KEY);
  if (done === '1') return false;

  for (const cat of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
    await categoryRepo.insertCategory({ ...cat, id: generateId() });
  }

  const cashAccount: Account = {
    id: generateId(),
    name: 'เงินสด',
    type: 'cash',
    balance: 0,
    color: '#10B981',
    icon: 'cash',
    createdAt: new Date().toISOString(),
  };
  await accountRepo.insertAccount(cashAccount);

  await settingsRepo.saveSettings({ ...DEFAULT_SETTINGS });
  await settingsRepo.setFlag(FIRST_LAUNCH_KEY, '1');
  return true;
}
