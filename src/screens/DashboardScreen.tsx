import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, TrendDown, TrendUp, Wallet } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';
import { radius, spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as transactionRepo from '@/db/transactionRepo';
import { Transaction } from '@/types';
import { formatMoney, formatThaiMonthYear, toDateKey, thaiMonthShort } from '@/utils/format';
import { getLastNDays, getMonthRange } from '@/utils/dateRange';
import { RootStackParamList, TabParamList } from '@/navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const version = useTransactionsStore((s) => s.version);

  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [weekBars, setWeekBars] = useState<{ label: string; value: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadAccounts();
        const range = getMonthRange(new Date(), settings.monthStartDay);
        const sums = await transactionRepo.sumByType(range.start, range.end);
        const recentTx = await transactionRepo.queryTransactions({}, 10);
        const last7 = getLastNDays(7);
        const daily = await transactionRepo.dailyExpenseTotals(last7.start, last7.end);
        const bars: { label: string; value: number }[] = [];
        const cursor = new Date(last7.start);
        for (let i = 0; i < 7; i++) {
          const key = toDateKey(cursor);
          bars.push({ label: `${cursor.getDate()}`, value: daily[key] ?? 0 });
          cursor.setDate(cursor.getDate() + 1);
        }
        if (active) {
          setSummary(sums);
          setRecent(recentTx);
          setWeekBars(bars);
        }
      })();
      return () => {
        active = false;
      };
    }, [settings.monthStartDay, version, loadAccounts]),
  );

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const net = summary.income - summary.expense;
  const maxBar = Math.max(1, ...weekBars.map((b) => b.value));
  const symbol = settings.currencySymbol;

  const isFocused = useIsFocused();

  return (
    <Screen>
      {isFocused ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.headerGradientStart, paddingTop: insets.top + spacing.xl },
          ]}
        >
          <View style={styles.headerRow}>
            <Wallet size={20} color="#6EE7B7" weight="fill" />
            <Text style={styles.headerLabel}>ยอดเงินรวมทุกบัญชี</Text>
          </View>
          <Text style={styles.totalAmount}>{formatMoney(total, symbol)}</Text>
          <Text style={styles.headerMonth}>{formatThaiMonthYear(new Date())}</Text>
        </View>

        {/* Month summary card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryTitleRow}>
                <TrendUp size={14} color={colors.income} weight="bold" />
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>รายรับ</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.income }]}>
                {formatMoney(summary.income, symbol)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryTitleRow}>
                <TrendDown size={14} color={colors.expense} weight="bold" />
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>รายจ่าย</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.expense }]}>
                {formatMoney(summary.expense, symbol)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>คงเหลือ</Text>
              <Text
                style={[styles.summaryValue, { color: net >= 0 ? colors.income : colors.expense }]}
              >
                {formatMoney(net, symbol)}
              </Text>
            </View>
          </View>
        </Card>

        {/* 7-day mini bar chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>รายจ่าย 7 วันล่าสุด</Text>
          <Card>
            <View style={styles.barChart}>
              {weekBars.map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(4, (bar.value / maxBar) * 100)}%`,
                          backgroundColor:
                            bar.value === maxBar && bar.value > 0
                              ? colors.expense
                              : colors.primary,
                          opacity: bar.value > 0 ? 1 : dark ? 0.25 : 0.35,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{bar.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Recent transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>รายการล่าสุด</Text>
            <Pressable onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.link, { color: colors.primary }]}>ดูทั้งหมด</Text>
            </Pressable>
          </View>
          <Card style={{ paddingVertical: spacing.xs }}>
            {recent.length === 0 ? (
              <EmptyState title="ยังไม่มีรายการ" subtitle='กดปุ่ม "+" เพื่อเพิ่มรายการแรก' />
            ) : (
              recent.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={categories.find((c) => c.id === t.categoryId)}
                  account={accounts.find((a) => a.id === t.accountId)}
                  toAccount={accounts.find((a) => a.id === t.toAccountId)}
                  currencySymbol={symbol}
                  onPress={() => navigation.navigate('TransactionDetail', { id: t.id })}
                />
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => navigation.navigate('AddTransaction', undefined)}
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.fabShadow }]}
      >
        <Plus size={26} color="#FFFFFF" weight="bold" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  totalAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: spacing.sm },
  headerMonth: { color: '#6EE7B7', fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  summaryCard: { marginHorizontal: spacing.lg, marginTop: -spacing.xxxl },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  divider: { width: StyleSheet.hairlineWidth, height: 36 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  link: { fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  barChart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '55%', borderRadius: 6 },
  barLabel: { fontSize: 11, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation: 8,
  },
});
