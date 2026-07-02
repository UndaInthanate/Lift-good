import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ChoiceModal } from '@/components/ChoiceModal';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { ACCOUNT_TYPE_LABELS } from '@/constants/defaults';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as accountRepo from '@/db/accountRepo';
import * as transactionRepo from '@/db/transactionRepo';
import { Transaction } from '@/types';
import { formatMoney } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';
import { useFocusEffect } from '@react-navigation/native';

export function AccountDetailScreen({ navigation, route }: RootScreenProps<'AccountDetail'>) {
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const version = useTransactionsStore((s) => s.version);
  const bump = useTransactionsStore((s) => s.bump);

  const account = accounts.find((a) => a.id === route.params.id);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [movePickerVisible, setMovePickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      transactionRepo.queryTransactions({ accountId: route.params.id }).then(setTransactions);
    }, [route.params.id, version]),
  );

  if (!account) return <Screen />;

  const otherAccounts = accounts.filter((a) => a.id !== account.id);

  const handleDelete = async () => {
    const count = await accountRepo.countAccountTransactions(account.id);
    if (count === 0) {
      Alert.alert('ลบบัญชี', `ลบบัญชี "${account.name}"?`, [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            await accountRepo.deleteAccount(account.id);
            await loadAccounts();
            navigation.goBack();
          },
        },
      ]);
      return;
    }
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบรายการทั้งหมด',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            'ยืนยันอีกครั้ง',
            `ลบบัญชีพร้อมรายการทั้งหมด ${count} รายการ? การกระทำนี้ย้อนกลับไม่ได้`,
            [
              { text: 'ยกเลิก', style: 'cancel' },
              {
                text: 'ลบทั้งหมด',
                style: 'destructive',
                onPress: async () => {
                  await accountRepo.deleteAccountTransactions(account.id);
                  await accountRepo.deleteAccount(account.id);
                  await loadAccounts();
                  bump();
                  navigation.goBack();
                },
              },
            ],
          ),
      },
    ];
    if (otherAccounts.length > 0) {
      buttons.push({ text: 'ย้ายรายการไปบัญชีอื่น', onPress: () => setMovePickerVisible(true) });
    }
    Alert.alert(
      'ลบบัญชี',
      `บัญชีนี้มี ${count} รายการผูกอยู่ ต้องย้ายหรือลบรายการเหล่านั้นก่อน`,
      buttons,
    );
  };

  const handleMoveAndDelete = async (targetId: string) => {
    await accountRepo.moveTransactions(account.id, targetId);
    await accountRepo.deleteAccount(account.id);
    await loadAccounts();
    bump();
    navigation.goBack();
  };

  return (
    <Screen>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Card style={styles.headerCard}>
              <View style={[styles.iconWrap, { backgroundColor: account.color + '22' }]}>
                <AppIcon name={account.icon} size={26} color={account.color} />
              </View>
              <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
              <Text style={[styles.accountType, { color: colors.textMuted }]}>
                {ACCOUNT_TYPE_LABELS[account.type]}
              </Text>
              <Text style={[styles.balance, { color: colors.text }]}>
                {formatMoney(account.balance, settings.currencySymbol)}
              </Text>
              <View style={styles.actionRow}>
                <PrimaryButton
                  title="แก้ไข"
                  variant="outline"
                  onPress={() => navigation.navigate('AccountForm', { id: account.id })}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title="โอนเงิน"
                  onPress={() => navigation.navigate('AddTransaction', { presetType: 'transfer' })}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              รายการของบัญชีนี้ ({transactions.length})
            </Text>
          </>
        }
        ListEmptyComponent={<EmptyState title="ยังไม่มีรายการในบัญชีนี้" />}
        renderItem={({ item }) => (
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
        )}
        ListFooterComponent={
          <PrimaryButton
            title="ลบบัญชีนี้"
            variant="danger"
            onPress={handleDelete}
            style={{ marginTop: spacing.xl }}
          />
        }
      />
      <ChoiceModal
        visible={movePickerVisible}
        title="ย้ายรายการไปยังบัญชี"
        items={otherAccounts.map((a) => ({ id: a.id, label: a.name, icon: a.icon, color: a.color }))}
        onSelect={(item) => handleMoveAndDelete(item.id)}
        onClose={() => setMovePickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerCard: { alignItems: 'center', paddingVertical: spacing.xl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  accountName: { fontSize: 18, fontWeight: '700' },
  accountType: { fontSize: 12, marginTop: 2 },
  balance: { fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignSelf: 'stretch' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  rowCard: { borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
});
