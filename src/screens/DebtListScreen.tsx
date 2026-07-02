import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CaretRight, CheckCircle, Plus } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { radius, spacing, useTheme } from '@/theme';
import { useDebtsStore } from '@/store/useDebtsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { computeDebt } from '@/utils/debt';
import { formatMoney, formatThaiDate } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DebtListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const debts = useDebtsStore((s) => s.debts);
  const load = useDebtsStore((s) => s.load);
  const settings = useSettingsStore((s) => s.settings);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const symbol = settings.currencySymbol;
  const active = debts.filter((d) => d.status === 'active');
  const completed = debts.filter((d) => d.status === 'completed');
  const totalRemaining = active.reduce((s, d) => s + computeDebt(d).remainingAmount, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>ยอดหนี้คงเหลือรวม</Text>
          <Text style={[styles.totalValue, { color: colors.expense }]}>
            {formatMoney(totalRemaining, symbol)}
          </Text>
          <Text style={[styles.totalSub, { color: colors.textMuted }]}>
            {active.length} รายการที่ยังผ่อนอยู่
          </Text>
        </Card>

        {debts.length === 0 ? (
          <EmptyState icon="handCoins" title="ยังไม่มีรายการหนี้" subtitle="เพิ่มหนี้ที่ต้องผ่อนเพื่อติดตามความคืบหน้า" />
        ) : null}

        {active.map((debt) => {
          const c = computeDebt(debt);
          return (
            <Pressable key={debt.id} onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}>
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.debtTop}>
                  <Text style={[styles.debtName, { color: colors.text }]}>{debt.name}</Text>
                  <CaretRight size={16} color={colors.textMuted} />
                </View>
                <ProgressBar percent={c.progressPercent} gradient height={10} />
                <View style={styles.debtRow}>
                  <Text style={[styles.debtDetail, { color: colors.textMuted }]}>
                    จ่ายแล้ว {formatMoney(c.paidAmount, symbol)} ({Math.round(c.progressPercent)}%)
                  </Text>
                  <Text style={[styles.debtDetail, { color: colors.expense, fontWeight: '700' }]}>
                    เหลือ {formatMoney(c.remainingAmount, symbol)}
                  </Text>
                </View>
                <View style={styles.debtRow}>
                  <Text style={[styles.debtDetail, { color: colors.textMuted }]}>
                    งวดละ {formatMoney(debt.monthlyPayment, symbol)}/เดือน
                  </Text>
                  <Text style={[styles.debtDetail, { color: colors.textSecondary }]}>
                    ครบกำหนด {formatThaiDate(c.nextDueDate)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}

        {completed.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ปิดหนี้แล้ว</Text>
            {completed.map((debt) => (
              <Pressable key={debt.id} onPress={() => navigation.navigate('DebtDetail', { id: debt.id })}>
                <Card style={[styles.completedCard]}>
                  <CheckCircle size={20} color={colors.success} weight="fill" />
                  <Text style={[styles.completedName, { color: colors.textSecondary }]}>
                    {debt.name}
                  </Text>
                  <Text style={[styles.debtDetail, { color: colors.textMuted }]}>
                    {formatMoney(debt.totalAmount, symbol)}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('DebtForm', undefined)}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Plus size={18} color={colors.primary} weight="bold" />
          <Text style={[styles.addText, { color: colors.primary }]}>เพิ่มหนี้ใหม่</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  totalCard: { alignItems: 'center', marginBottom: spacing.lg },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 28, fontWeight: '800', marginTop: spacing.xs },
  totalSub: { fontSize: 12, marginTop: spacing.xs },
  debtTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  debtName: { fontSize: 16, fontWeight: '700' },
  debtRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  debtDetail: { fontSize: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  completedName: { flex: 1, fontSize: 14, fontWeight: '600', textDecorationLine: 'line-through' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  addText: { fontSize: 14, fontWeight: '600' },
});
