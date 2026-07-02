import { Category, Settings } from '@/types';

export const COLOR_PALETTE: string[] = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#64748B',
];

type DefaultCategory = Omit<Category, 'id'>;

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'อาหาร', type: 'expense', icon: 'food', color: '#F97316', isDefault: true, isHidden: false },
  { name: 'เครื่องดื่ม', type: 'expense', icon: 'drink', color: '#A855F7', isDefault: true, isHidden: false },
  { name: 'เดินทาง', type: 'expense', icon: 'transport', color: '#3B82F6', isDefault: true, isHidden: false },
  { name: 'ที่อยู่อาศัย', type: 'expense', icon: 'housing', color: '#14B8A6', isDefault: true, isHidden: false },
  { name: 'ค่าน้ำ-ค่าไฟ', type: 'expense', icon: 'utilities', color: '#EAB308', isDefault: true, isHidden: false },
  { name: 'ช้อปปิ้ง', type: 'expense', icon: 'shopping', color: '#EC4899', isDefault: true, isHidden: false },
  { name: 'สุขภาพ', type: 'expense', icon: 'health', color: '#EF4444', isDefault: true, isHidden: false },
  { name: 'บันเทิง', type: 'expense', icon: 'entertainment', color: '#8B5CF6', isDefault: true, isHidden: false },
  { name: 'การศึกษา', type: 'expense', icon: 'education', color: '#0EA5E9', isDefault: true, isHidden: false },
  { name: 'ของใช้', type: 'expense', icon: 'household', color: '#84CC16', isDefault: true, isHidden: false },
  { name: 'โทรศัพท์/อินเทอร์เน็ต', type: 'expense', icon: 'internet', color: '#06B6D4', isDefault: true, isHidden: false },
  { name: 'อื่นๆ', type: 'expense', icon: 'other', color: '#64748B', isDefault: true, isHidden: false },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'เงินเดือน', type: 'income', icon: 'salary', color: '#10B981', isDefault: true, isHidden: false },
  { name: 'ฟรีแลนซ์', type: 'income', icon: 'freelance', color: '#6366F1', isDefault: true, isHidden: false },
  { name: 'ขายของ', type: 'income', icon: 'selling', color: '#F59E0B', isDefault: true, isHidden: false },
  { name: 'ดอกเบี้ย', type: 'income', icon: 'interest', color: '#22C55E', isDefault: true, isHidden: false },
  { name: 'ของขวัญ/ได้รับ', type: 'income', icon: 'gift', color: '#F43F5E', isDefault: true, isHidden: false },
  { name: 'อื่นๆ', type: 'income', icon: 'other', color: '#64748B', isDefault: true, isHidden: false },
];

export const DEFAULT_SETTINGS: Settings = {
  currency: 'THB',
  currencySymbol: '฿',
  theme: 'system',
  monthStartDay: 1,
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
  budgetWarningEnabled: true,
  debtReminderEnabled: true,
  debtReminderDaysBefore: 3,
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'เงินสด',
  bank: 'บัญชีธนาคาร',
  credit_card: 'บัตรเครดิต',
  e_wallet: 'e-Wallet',
};
