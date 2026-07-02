import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { FormField, FieldLabel } from '@/components/FormField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SelectRow } from '@/components/SelectRow';
import { DateField } from '@/components/DateField';
import { ChoiceModal } from '@/components/ChoiceModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useRecurringStore } from '@/store/useRecurringStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { RecurringFrequency, RecurringTransaction } from '@/types';
import { generateId } from '@/utils/id';
import { formatMoney, todayKey } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';

export function RecurringFormScreen({ navigation, route }: RootScreenProps<'RecurringForm'>) {
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const categories = useCategoriesStore((s) => s.categories);
  const items = useRecurringStore((s) => s.items);
  const add = useRecurringStore((s) => s.add);
  const update = useRecurringStore((s) => s.update);
  const settings = useSettingsStore((s) => s.settings);

  const editing = route.params?.id ? items.find((i) => i.id === route.params?.id) : undefined;

  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(todayKey());
  const [picker, setPicker] = useState<'category' | 'account' | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setAccountId(editing.accountId);
      setFrequency(editing.frequency);
      setDayOfMonth(String(editing.dayOfMonth));
      setStartDate(editing.startDate);
    }
  }, [editing?.id]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type && !c.isHidden),
    [categories, type],
  );

  useEffect(() => {
    const current = categories.find((c) => c.id === categoryId);
    if (current && current.type !== type) setCategoryId('');
  }, [type, categoryId, categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    const day = parseInt(dayOfMonth, 10);
    if (!name.trim()) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อรายการ');
    if (!isFinite(amt) || amt <= 0) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกจำนวนเงิน');
    if (!categoryId) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกหมวดหมู่');
    if (!accountId) return Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกบัญชี');
    if (frequency === 'monthly' && (!isFinite(day) || day < 1 || day > 31)) {
      return Alert.alert('ไม่ถูกต้อง', 'วันที่ต้องอยู่ระหว่าง 1-31');
    }

    const item: RecurringTransaction = {
      id: editing?.id ?? generateId(),
      name: name.trim(),
      type,
      amount: amt,
      categoryId,
      accountId,
      frequency,
      dayOfMonth: frequency === 'monthly' ? day : new Date(startDate).getDate(),
      startDate,
      isActive: editing?.isActive ?? true,
    };
    if (editing) await update(item);
    else await add(item);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="ชื่อรายการ"
          value={name}
          onChangeText={setName}
          placeholder='เช่น "เงินเดือน", "ค่าเช่าห้อง"'
        />
        <FieldLabel>ประเภท</FieldLabel>
        <View style={{ marginBottom: spacing.lg }}>
          <SegmentedControl<'expense' | 'income'>
            options={[
              { value: 'expense', label: 'รายจ่าย', color: colors.expense },
              { value: 'income', label: 'รายรับ', color: colors.income },
            ]}
            value={type}
            onChange={setType}
          />
        </View>
        <FormField
          label={`จำนวนเงิน (${settings.currencySymbol})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <SelectRow
          label="หมวดหมู่"
          value={selectedCategory?.name}
          icon={selectedCategory?.icon}
          iconColor={selectedCategory?.color}
          onPress={() => setPicker('category')}
        />
        <SelectRow
          label="บัญชี"
          value={selectedAccount?.name}
          icon={selectedAccount?.icon}
          iconColor={selectedAccount?.color}
          onPress={() => setPicker('account')}
        />
        <FieldLabel>ความถี่</FieldLabel>
        <View style={{ marginBottom: spacing.lg }}>
          <SegmentedControl<RecurringFrequency>
            options={[
              { value: 'monthly', label: 'รายเดือน' },
              { value: 'weekly', label: 'รายสัปดาห์' },
            ]}
            value={frequency}
            onChange={setFrequency}
          />
        </View>
        {frequency === 'monthly' ? (
          <FormField
            label="ทุกวันที่ (1-31)"
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
            keyboardType="number-pad"
            placeholder="1"
          />
        ) : (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            รายสัปดาห์จะทำซ้ำทุก 7 วันนับจากวันที่เริ่มต้น
          </Text>
        )}
        <DateField label="วันที่เริ่มต้น" value={startDate} onChange={setStartDate} />
        {editing ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            การแก้ไขจำนวนเงินมีผลตั้งแต่งวดถัดไป รายการที่สร้างไปแล้วไม่เปลี่ยน
          </Text>
        ) : null}
        <PrimaryButton title={editing ? 'บันทึกการแก้ไข' : 'เพิ่มรายการประจำ'} onPress={handleSave} />
      </ScrollView>

      <ChoiceModal
        visible={picker === 'category'}
        title="เลือกหมวดหมู่"
        items={visibleCategories.map((c) => ({ id: c.id, label: c.name, icon: c.icon, color: c.color }))}
        selectedId={categoryId}
        onSelect={(item) => setCategoryId(item.id)}
        onClose={() => setPicker(null)}
      />
      <ChoiceModal
        visible={picker === 'account'}
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
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hint: { fontSize: 12, marginBottom: spacing.lg, lineHeight: 18 },
});
