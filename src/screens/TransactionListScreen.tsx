import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';
import { FunnelSimple, MagnifyingGlass, PencilSimple, Trash, X } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';
import { ChoiceModal, ChoiceItem } from '@/components/ChoiceModal';
import { radius, spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as transactionRepo from '@/db/transactionRepo';
import { removeTransaction } from '@/services/transactionService';
import { Transaction, TransactionType } from '@/types';
import { formatMoney, formatThaiDateWithDay, todayKey } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Section {
  title: string;
  total: number;
  data: Transaction[];
}

const TYPE_FILTERS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'expense', label: 'รายจ่าย' },
  { value: 'income', label: 'รายรับ' },
  { value: 'transfer', label: 'โอน' },
];

export function TransactionListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const version = useTransactionsStore((s) => s.version);
  const bump = useTransactionsStore((s) => s.bump);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [picker, setPicker] = useState<'account' | 'category' | null>(null);

  const reload = useCallback(async () => {
    const list = await transactionRepo.queryTransactions({
      type: typeFilter === 'all' ? undefined : typeFilter,
      accountId: accountFilter || undefined,
      categoryId: categoryFilter || undefined,
      search: search || undefined,
    });
    setTransactions(list);
  }, [typeFilter, accountFilter, categoryFilter, search]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload, version]),
  );

  const sections: Section[] = useMemo(() => {
    const map = new Map<string, Section>();
    for (const t of transactions) {
      let section = map.get(t.date);
      if (!section) {
        section = { title: t.date, total: 0, data: [] };
        map.set(t.date, section);
      }
      section.data.push(t);
      if (t.type === 'expense') section.total -= t.amount;
      if (t.type === 'income') section.total += t.amount;
    }
    return Array.from(map.values());
  }, [transactions]);

  const confirmDelete = (t: Transaction) => {
    Alert.alert('ลบรายการ', 'ลบรายการนี้และคืนยอดเงินกลับบัญชี?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await removeTransaction(t);
          await loadAccounts();
          bump();
          reload();
        },
      },
    ]);
  };

  const renderRightActions = (t: Transaction) => (
    <View style={styles.swipeActions}>
      <Pressable
        onPress={() => navigation.navigate('AddTransaction', { editId: t.id })}
        style={[styles.swipeButton, { backgroundColor: colors.transfer }]}
      >
        <PencilSimple size={20} color="#FFFFFF" />
      </Pressable>
      <Pressable
        onPress={() => confirmDelete(t)}
        style={[styles.swipeButton, { backgroundColor: colors.danger }]}
      >
        <Trash size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  const hasFilter = typeFilter !== 'all' || accountFilter || categoryFilter;
  const accountItems: ChoiceItem[] = [
    { id: '', label: 'ทุกบัญชี' },
    ...accounts.map((a) => ({ id: a.id, label: a.name, icon: a.icon, color: a.color })),
  ];
  const categoryItems: ChoiceItem[] = [
    { id: '', label: 'ทุกหมวดหมู่' },
    ...categories
      .filter((c) => !c.isHidden)
      .map((c) => ({ id: c.id, label: c.name, icon: c.icon, color: c.color })),
  ];

  return (
    <Screen>
      {/* Search + filter bar */}
      <View style={styles.toolbar}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MagnifyingGlass size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ค้นหาจากบันทึกช่วยจำ..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.chipsRow}>
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setTypeFilter(f.value)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setPicker('account')}
          style={[
            styles.chip,
            {
              backgroundColor: accountFilter ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <FunnelSimple size={14} color={accountFilter ? '#FFFFFF' : colors.textSecondary} />
          <Text
            style={[styles.chipText, { color: accountFilter ? '#FFFFFF' : colors.textSecondary }]}
          >
            {accountFilter ? accounts.find((a) => a.id === accountFilter)?.name : 'บัญชี'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPicker('category')}
          style={[
            styles.chip,
            {
              backgroundColor: categoryFilter ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <FunnelSimple size={14} color={categoryFilter ? '#FFFFFF' : colors.textSecondary} />
          <Text
            style={[styles.chipText, { color: categoryFilter ? '#FFFFFF' : colors.textSecondary }]}
          >
            {categoryFilter ? categories.find((c) => c.id === categoryFilter)?.name : 'หมวดหมู่'}
          </Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
        ListEmptyComponent={
          <EmptyState
            title={hasFilter || search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการ'}
            subtitle={hasFilter || search ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา' : undefined}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionDate, { color: colors.textSecondary }]}>
              {section.title === todayKey() ? 'วันนี้' : formatThaiDateWithDay(section.title)}
            </Text>
            <Text
              style={[
                styles.sectionTotal,
                { color: section.total >= 0 ? colors.income : colors.expense },
              ]}
            >
              {formatMoney(section.total, settings.currencySymbol)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
            <View style={[styles.rowCard, { backgroundColor: colors.surface }]}>
              <TransactionRow
                transaction={item}
                category={categories.find((c) => c.id === item.categoryId)}
                account={accounts.find((a) => a.id === item.accountId)}
                toAccount={accounts.find((a) => a.id === item.toAccountId)}
                currencySymbol={settings.currencySymbol}
                onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
              />
            </View>
          </Swipeable>
        )}
      />

      <ChoiceModal
        visible={picker === 'account'}
        title="กรองตามบัญชี"
        items={accountItems}
        selectedId={accountFilter}
        onSelect={(item) => setAccountFilter(item.id)}
        onClose={() => setPicker(null)}
      />
      <ChoiceModal
        visible={picker === 'category'}
        title="กรองตามหมวดหมู่"
        items={categoryItems}
        selectedId={categoryFilter}
        onSelect={(item) => setCategoryFilter(item.id)}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 14 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionDate: { fontSize: 13, fontWeight: '700' },
  sectionTotal: { fontSize: 13, fontWeight: '700' },
  rowCard: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  swipeActions: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  swipeButton: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginLeft: spacing.xs,
  },
});
