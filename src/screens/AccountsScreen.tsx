import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CaretRight, Plus } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { ACCOUNT_TYPE_LABELS } from '@/constants/defaults';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatMoney } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AccountsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const load = useAccountsStore((s) => s.load);
  const settings = useSettingsStore((s) => s.settings);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>ยอดรวมทุกบัญชี</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {formatMoney(total, settings.currencySymbol)}
          </Text>
        </Card>

        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => navigation.navigate('AccountDetail', { id: account.id })}
          >
            <Card style={styles.accountCard}>
              <View style={[styles.iconWrap, { backgroundColor: account.color + '22' }]}>
                <AppIcon name={account.icon} size={22} color={account.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
                <Text style={[styles.accountType, { color: colors.textMuted }]}>
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.accountBalance,
                    { color: account.balance >= 0 ? colors.text : colors.expense },
                  ]}
                >
                  {formatMoney(account.balance, settings.currencySymbol)}
                </Text>
              </View>
              <CaretRight size={16} color={colors.textMuted} />
            </Card>
          </Pressable>
        ))}

        <Pressable
          onPress={() => navigation.navigate('AccountForm', undefined)}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Plus size={18} color={colors.primary} weight="bold" />
          <Text style={[styles.addText, { color: colors.primary }]}>เพิ่มบัญชีใหม่</Text>
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
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountType: { fontSize: 12, marginTop: 2 },
  accountBalance: { fontSize: 15, fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  addText: { fontSize: 14, fontWeight: '600' },
});
