import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowsLeftRight } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as transactionRepo from '@/db/transactionRepo';
import { removeTransaction } from '@/services/transactionService';
import { Transaction } from '@/types';
import { formatMoney, formatSignedMoney, formatThaiDateWithDay } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';

export function TransactionDetailScreen({ navigation, route }: RootScreenProps<'TransactionDetail'>) {
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const bump = useTransactionsStore((s) => s.bump);

  const [t, setT] = useState<Transaction | null>(null);

  useFocusEffect(
    useCallback(() => {
      transactionRepo.getTransactionById(route.params.id).then(setT);
    }, [route.params.id]),
  );

  if (!t) return <Screen />;

  const category = categories.find((c) => c.id === t.categoryId);
  const account = accounts.find((a) => a.id === t.accountId);
  const toAccount = accounts.find((a) => a.id === t.toAccountId);
  const symbol = settings.currencySymbol;

  const isTransfer = t.type === 'transfer';
  const isIncome = t.type === 'income';
  const mainColor = isTransfer ? colors.transfer : isIncome ? colors.income : colors.expense;
  const iconColor = category?.color ?? mainColor;

  const handleDelete = () => {
    Alert.alert('ลบรายการ', 'ลบรายการนี้และคืนยอดเงินกลับบัญชี?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await removeTransaction(t);
          await loadAccounts();
          bump();
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
            {isTransfer ? (
              <ArrowsLeftRight size={28} color={colors.transfer} />
            ) : (
              <AppIcon name={category?.icon ?? 'other'} size={28} color={iconColor} />
            )}
          </View>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {isTransfer ? 'โอนเงินระหว่างบัญชี' : category?.name ?? '-'}
          </Text>
          <Text style={[styles.amount, { color: mainColor }]}>
            {isTransfer
              ? formatMoney(t.amount, symbol)
              : formatSignedMoney(t.amount, isIncome, symbol)}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatThaiDateWithDay(t.date)}
          </Text>
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <DetailRow label={isTransfer ? 'จากบัญชี' : 'บัญชี'} value={account?.name ?? '-'} />
          {isTransfer ? <DetailRow label="ไปยังบัญชี" value={toAccount?.name ?? '-'} /> : null}
          {t.note ? <DetailRow label="บันทึกช่วยจำ" value={t.note} /> : null}
          {t.isRecurring ? <DetailRow label="ประเภท" value="รายการประจำ (อัตโนมัติ)" /> : null}
          {t.debtId ? <DetailRow label="ประเภท" value="ชำระหนี้" /> : null}
        </Card>

        {t.receiptImage ? (
          <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
              สลิป / ใบเสร็จ
            </Text>
            <Image source={{ uri: t.receiptImage }} style={styles.receiptImage} />
          </Card>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            title="แก้ไขรายการ"
            onPress={() => navigation.navigate('AddTransaction', { editId: t.id })}
            variant="outline"
          />
          <PrimaryButton title="ลบรายการ" onPress={handleDelete} variant="danger" />
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerCard: { alignItems: 'center', paddingVertical: spacing.xxl },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  categoryName: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 34, fontWeight: '800', marginTop: spacing.sm },
  date: { fontSize: 13, marginTop: spacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    gap: spacing.lg,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  receiptLabel: { fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  receiptImage: { width: 220, height: 300, borderRadius: radius.md },
  actions: { marginTop: spacing.xl, gap: spacing.md },
});
