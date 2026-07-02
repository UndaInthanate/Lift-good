import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Clock, WarningCircle } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radius, spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useDebtsStore } from '@/store/useDebtsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { buildInstallmentTimeline, computeDebt } from '@/utils/debt';
import { formatMoney, formatThaiDate } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';

export function DebtDetailScreen({ navigation, route }: RootScreenProps<'DebtDetail'>) {
  const { colors } = useTheme();
  const debts = useDebtsStore((s) => s.debts);
  const payInstallment = useDebtsStore((s) => s.payInstallment);
  const closeDebt = useDebtsStore((s) => s.closeDebt);
  const removeDebt = useDebtsStore((s) => s.remove);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const bump = useTransactionsStore((s) => s.bump);

  const debt = debts.find((d) => d.id === route.params.id);
  const computed = useMemo(() => (debt ? computeDebt(debt) : null), [debt]);
  const timeline = useMemo(() => (debt ? buildInstallmentTimeline(debt) : []), [debt]);

  if (!debt || !computed) return <Screen />;

  const symbol = settings.currencySymbol;
  const account = accounts.find((a) => a.id === debt.accountId);
  const isActive = debt.status === 'active';
  const fullyPaid = computed.remainingAmount <= 0;

  const handlePay = () => {
    const fallbackCategory =
      categories.find((c) => c.type === 'expense' && c.name === 'อื่นๆ') ??
      categories.find((c) => c.type === 'expense');
    Alert.alert(
      'จ่ายงวดนี้แล้ว',
      `บันทึกการจ่ายงวดที่ ${debt.paidInstallments + 1} จำนวน ${formatMoney(debt.monthlyPayment, symbol)} หักจากบัญชี "${account?.name ?? '-'}"?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: async () => {
            await payInstallment(debt, fallbackCategory?.id ?? '');
            await loadAccounts();
            bump();
          },
        },
      ],
    );
  };

  const handleClose = () => {
    Alert.alert('ปิดหนี้', `ปิดหนี้ "${debt.name}" เป็นสถานะเสร็จสิ้น?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ปิดหนี้', onPress: () => closeDebt(debt) },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('ลบหนี้', 'ลบรายการหนี้นี้? (รายการจ่ายที่บันทึกไว้จะยังอยู่)', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await removeDebt(debt.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.name, { color: colors.text }]}>{debt.name}</Text>
          {!isActive ? (
            <Text style={[styles.completedBadge, { color: colors.success }]}>✅ ปิดหนี้แล้ว</Text>
          ) : null}
          <View style={{ marginVertical: spacing.md }}>
            <ProgressBar percent={computed.progressPercent} gradient height={12} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            จ่ายแล้ว {Math.round(computed.progressPercent)}% ({debt.paidInstallments}/
            {computed.totalInstallments} งวด)
          </Text>

          <View style={[styles.statGrid, { borderColor: colors.border }]}>
            <StatCell
              label="ยอดหนี้ทั้งหมด"
              value={formatMoney(computed.totalWithInterest, symbol)}
              sub={debt.interestRate > 0 ? `รวมดอกเบี้ย ${debt.interestRate}%/ปี` : undefined}
            />
            <StatCell label="จ่ายไปแล้ว" value={formatMoney(computed.paidAmount, symbol)} color={colors.success} />
            <StatCell label="คงเหลือ" value={formatMoney(computed.remainingAmount, symbol)} color={colors.expense} />
            <StatCell
              label="เหลืออีก"
              value={
                computed.remainingMonths <= 0
                  ? 'ครบแล้ว'
                  : computed.remainingYears > 0
                    ? `${computed.remainingYears} ปี ${computed.remainingMonthsAfterYears} เดือน`
                    : `${computed.remainingMonths} เดือน`
              }
            />
          </View>

          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>ผ่อนต่อเดือน</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatMoney(debt.monthlyPayment, symbol)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>บัญชีที่จ่าย</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{account?.name ?? '-'}</Text>
          </View>
          {isActive ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>งวดถัดไปครบกำหนด</Text>
              <Text style={[styles.infoValue, { color: colors.warning }]}>
                {formatThaiDate(computed.nextDueDate)}
              </Text>
            </View>
          ) : null}
        </Card>

        {isActive ? (
          <View style={styles.actions}>
            {!fullyPaid ? (
              <PrimaryButton
                title={`จ่ายงวดนี้แล้ว (${formatMoney(debt.monthlyPayment, symbol)})`}
                onPress={handlePay}
              />
            ) : null}
            <View style={styles.actionRow}>
              <PrimaryButton
                title="แก้ไข"
                variant="outline"
                onPress={() => navigation.navigate('DebtForm', { id: debt.id })}
                style={{ flex: 1 }}
              />
              <PrimaryButton title="ปิดหนี้" variant="outline" color={colors.success} onPress={handleClose} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        {/* Installment timeline */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>ไทม์ไลน์การผ่อน</Text>
        <Card>
          {timeline.map((item) => {
            const icon =
              item.status === 'paid' ? (
                <CheckCircle size={20} color={colors.success} weight="fill" />
              ) : item.status === 'overdue' ? (
                <WarningCircle size={20} color={colors.danger} weight="fill" />
              ) : (
                <Clock size={20} color={colors.textMuted} />
              );
            const label =
              item.status === 'paid'
                ? 'จ่ายแล้ว'
                : item.status === 'overdue'
                  ? 'ค้างจ่าย'
                  : 'ยังไม่ถึงกำหนด';
            const labelColor =
              item.status === 'paid'
                ? colors.success
                : item.status === 'overdue'
                  ? colors.danger
                  : colors.textMuted;
            return (
              <View key={item.index} style={styles.timelineRow}>
                {icon}
                <Text style={[styles.timelineIndex, { color: colors.text }]}>
                  งวดที่ {item.index}
                </Text>
                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                  {formatThaiDate(item.dueDate)}
                </Text>
                <Text style={[styles.timelineStatus, { color: labelColor }]}>{label}</Text>
              </View>
            );
          })}
        </Card>

        <PrimaryButton title="ลบหนี้นี้" variant="danger" onPress={handleDelete} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

function StatCell({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? colors.text }]}>{value}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  name: { fontSize: 20, fontWeight: '800' },
  completedBadge: { fontSize: 13, fontWeight: '700', marginTop: spacing.xs },
  progressText: { fontSize: 13, fontWeight: '600' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  statCell: { width: '50%', paddingVertical: spacing.sm },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  statSub: { fontSize: 10, marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.md },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  timelineIndex: { fontSize: 14, fontWeight: '600', width: 70 },
  timelineDate: { flex: 1, fontSize: 13 },
  timelineStatus: { fontSize: 12, fontWeight: '700' },
});
