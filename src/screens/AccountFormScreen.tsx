import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { FormField, FieldLabel } from '@/components/FormField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconPickerGrid, ColorPickerRow } from '@/components/IconColorPicker';
import { spacing } from '@/theme';
import { ACCOUNT_ICON_KEYS } from '@/constants/icons';
import { useAccountsStore } from '@/store/useAccountsStore';
import { Account, AccountType } from '@/types';
import { generateId } from '@/utils/id';
import { RootScreenProps } from '@/navigation/types';

export function AccountFormScreen({ navigation, route }: RootScreenProps<'AccountForm'>) {
  const accounts = useAccountsStore((s) => s.accounts);
  const add = useAccountsStore((s) => s.add);
  const update = useAccountsStore((s) => s.update);

  const editing = route.params?.id ? accounts.find((a) => a.id === route.params?.id) : undefined;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balanceText, setBalanceText] = useState('0');
  const [icon, setIcon] = useState('cash');
  const [color, setColor] = useState('#10B981');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setBalanceText(String(editing.balance));
      setIcon(editing.icon);
      setColor(editing.color);
    }
  }, [editing?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อบัญชี');
      return;
    }
    const balance = parseFloat(balanceText.replace(/,/g, '')) || 0;
    const account: Account = {
      id: editing?.id ?? generateId(),
      name: name.trim(),
      type,
      balance,
      icon,
      color,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) await update(account);
    else await add(account);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="ชื่อบัญชี"
          value={name}
          onChangeText={setName}
          placeholder='เช่น "กสิกร", "เงินสด"'
        />
        <FieldLabel>ประเภทบัญชี</FieldLabel>
        <SegmentedControl<AccountType>
          options={[
            { value: 'cash', label: 'เงินสด' },
            { value: 'bank', label: 'ธนาคาร' },
            { value: 'credit_card', label: 'บัตรเครดิต' },
            { value: 'e_wallet', label: 'e-Wallet' },
          ]}
          value={type}
          onChange={setType}
        />
        <FormField
          label={editing ? 'ยอดเงินคงเหลือ' : 'ยอดเงินเริ่มต้น'}
          value={balanceText}
          onChangeText={setBalanceText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          style={{ marginTop: 0 }}
        />
        <FieldLabel>ไอคอน</FieldLabel>
        <IconPickerGrid keys={ACCOUNT_ICON_KEYS} selected={icon} color={color} onSelect={setIcon} />
        <FieldLabel>สี</FieldLabel>
        <ColorPickerRow selected={color} onSelect={setColor} />
        <PrimaryButton title={editing ? 'บันทึกการแก้ไข' : 'เพิ่มบัญชี'} onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xs },
});
