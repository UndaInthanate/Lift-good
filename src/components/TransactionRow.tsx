import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowsLeftRight } from 'phosphor-react-native';
import { Account, Category, Transaction } from '@/types';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { formatSignedMoney, formatMoney } from '@/utils/format';

interface Props {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  toAccount?: Account;
  currencySymbol: string;
  onPress?: () => void;
}

export function TransactionRow({
  transaction: t,
  category,
  account,
  toAccount,
  currencySymbol,
  onPress,
}: Props) {
  const { colors } = useTheme();

  let title: string;
  let iconEl: React.ReactNode;
  let amountEl: React.ReactNode;

  if (t.type === 'transfer') {
    title = `โอน: ${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`;
    iconEl = (
      <View style={[styles.iconWrap, { backgroundColor: colors.transfer + '22' }]}>
        <ArrowsLeftRight size={20} color={colors.transfer} />
      </View>
    );
    amountEl = (
      <Text style={[styles.amount, { color: colors.transfer }]}>
        {formatMoney(t.amount, currencySymbol)}
      </Text>
    );
  } else {
    const isIncome = t.type === 'income';
    title = category?.name ?? (isIncome ? 'รายรับ' : 'รายจ่าย');
    const color = category?.color ?? (isIncome ? colors.income : colors.expense);
    iconEl = (
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <AppIcon name={category?.icon ?? 'other'} size={20} color={color} />
      </View>
    );
    amountEl = (
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {formatSignedMoney(t.amount, isIncome, currencySymbol)}
      </Text>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      {iconEl}
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {t.note ? t.note : account?.name ?? ''}
          {t.note && account && t.type !== 'transfer' ? ` · ${account.name}` : ''}
        </Text>
      </View>
      {amountEl}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
