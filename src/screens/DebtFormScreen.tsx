import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { SelectRow } from '@/components/SelectRow';
import { DateField } from '@/components/DateField';
import { ChoiceModal } from '@/components/ChoiceModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useDebtsStore } from '@/store/useDebtsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Debt } from '@/types';
import { generateId } from '@/utils/id';
import { formatMoney, todayKey } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';

export function DebtFormScreen({ navigation, route }: RootScreenProps<'DebtForm'>) {
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const debts = useDebtsStore((s) => s.debts);
  const add = useDebtsStore((s) => s.add);
  const update = useDebtsStore((s) => s.update);
  const settings = useSettingsStore((s) => s.settings);

  const editing = route.params?.id ? debts.find((d) => d.id === route.params?.id) : undefined;

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startDate, setStartDate] = useState(todayKey());
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [dueDay, setDueDay] = useState('1');
  const [accountId, setAccountId] = useState('');
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setTotalAmount(String(editing.totalAmount));
      setInterestRate(String(editing.interestRate));
      setMonthlyPayment(String(editing.monthlyPayment));
      setStartDate(editing.startDate);
      setPaidInstallments(String(editing.paidInstallments));
      setDueDay(String(editing.dueDay));
      setAccountId(editing.accountId);
    }
  }, [editing?.id]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleSave = async () => {
    const total = parseFloat(totalAmount.replace(/,/g, ''));
    const monthly = parseFloat(monthlyPayment.replace(/,/g, ''));
    const rate = parseFloat(interestRate) || 0;
    const paid = parseInt(paidInstallments, 10) || 0;
    const due = parseInt(dueDay, 10);

    if (!name.trim()) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อหนี้');
    if (!isFinite(total) || total <= 0) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกยอดหนี้ทั้งหมด');
    if (!isFinite(monthly) || monthly <= 0) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกยอดผ่อนต่อเดือน');
    if (!isFinite(due) || due < 1 || due > 31) return Alert.alert('ไม่ถูกต้อง', 'วันครบกำหนดต้องอยู่ระหว่าง 1-31');
    if (!accountId) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกบัญชีที่ใช้จ่าย');

    const debt: Debt = {
      id: editing?.id ?? generateId(),
      name: name.trim(),
      totalAmount: total,
      interestRate: rate,
      monthlyPayment: monthly,
      startDate,
      paidInstallments: paid,
      dueDay: due,
      accountId,
      status: editing?.status ?? 'active',
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) await update(debt);
    else await add(debt);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="ชื่อหนี้"
          value={name}
          onChangeText={setName}
          placeholder='เช่น "ผ่อนรถ", "กู้ กยศ."'
        />
        <FormField
          label={`ยอดหนี้ทั้งหมด (${settings.currencySymbol})`}
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormField
              label="ดอกเบี้ย (% ต่อปี)"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label={`ผ่อนต่อเดือน (${settings.currencySymbol})`}
              value={monthlyPayment}
              onChangeText={setMonthlyPayment}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>
        <DateField label="วันที่เริ่มผ่อน (ย้อนหลังได้)" value={startDate} onChange={setStartDate} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormField
              label="จ่ายไปแล้ว (งวด)"
              value={paidInstallments}
              onChangeText={setPaidInstallments}
              keyboardType="number-pad"
              placeholder="0"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="ครบกำหนดทุกวันที่"
              value={dueDay}
              onChangeText={setDueDay}
              keyboardType="number-pad"
              placeholder="1-31"
            />
          </View>
        </View>
        <SelectRow
          label="บัญชีที่ใช้จ่าย"
          value={selectedAccount?.name}
          icon={selectedAccount?.icon}
          iconColor={selectedAccount?.color}
          onPress={() => setAccountPickerVisible(true)}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          เมื่อกด "จ่ายงวดนี้แล้ว" ระบบจะสร้างรายการรายจ่ายอัตโนมัติและหักเงินจากบัญชีนี้
        </Text>
        <PrimaryButton title={editing ? 'บันทึกการแก้ไข' : 'เพิ่มหนี้'} onPress={handleSave} />
      </ScrollView>
      <ChoiceModal
        visible={accountPickerVisible}
        title="เลือกบัญชี"
        items={accounts.map((a) => ({
          id: a.id,
          label: a.name,
          sublabel: formatMoney(a.balance, settings.currencySymbol),
          icon: a.icon,
          color: a.color,
        }))}
        selectedId={accountId}
        onSelect={(item) => setAccountId(item.id)}
        onClose={() => setAccountPickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', gap: spacing.md },
  hint: { fontSize: 12, marginBottom: spacing.lg, lineHeight: 18 },
});
