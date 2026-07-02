import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CategoryType, TransactionType } from '@/types';

export type RootStackParamList = {
  Tabs: undefined;
  Welcome: undefined;
  AddTransaction: { editId?: string; presetType?: TransactionType } | undefined;
  TransactionDetail: { id: string };
  Accounts: undefined;
  AccountDetail: { id: string };
  AccountForm: { id?: string } | undefined;
  Categories: undefined;
  CategoryForm: { id?: string; type: CategoryType };
  Budget: undefined;
  DebtList: undefined;
  DebtDetail: { id: string };
  DebtForm: { id?: string } | undefined;
  Recurring: undefined;
  RecurringForm: { id?: string } | undefined;
  NotificationSettings: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  AddTab: undefined;
  Reports: undefined;
  More: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
