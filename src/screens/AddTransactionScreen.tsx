import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera, Image as ImageIcon, X } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { FormField } from '@/components/FormField';
import { SelectRow } from '@/components/SelectRow';
import { DateField } from '@/components/DateField';
import { ChoiceModal, ChoiceItem } from '@/components/ChoiceModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radius, spacing, useTheme } from '@/theme';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as transactionRepo from '@/db/transactionRepo';
import { createTransaction, editTransaction } from '@/services/transactionService';
import { checkBudgetAfterExpense } from '@/services/budgetAlertService';
import { pickReceiptImage, scanReceipt } from '@/services/receiptScanService';
import { Transaction, TransactionType } from '@/types';
import { generateId } from '@/utils/id';
import { formatMoney, todayKey } from '@/utils/format';
import { RootScreenProps } from '@/navigation/types';

export function AddTransactionScreen({ navigation, route }: RootScreenProps<'AddTransaction'>) {
  const { colors } = useTheme();
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const bump = useTransactionsStore((s) => s.bump);

  const editId = route.params?.editId;
  const [original, setOriginal] = useState<Transaction | null>(null);

  const [type, setType] = useState<TransactionType>(route.params?.presetType ?? 'expense');
  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayKey());
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [picker, setPicker] = useState<'category' | 'account' | 'toAccount' | null>(null);

  useEffect(() => {
    if (editId) {
      transactionRepo.getTransactionById(editId).then((t) => {
        if (!t) return;
        setOriginal(t);
        setType(t.type);
        setAmountText(String(t.amount));
        setCategoryId(t.categoryId);
        setAccountId(t.accountId);
        setToAccountId(t.toAccountId ?? '');
        setNote(t.note);
        setDate(t.date);
        setReceiptImage(t.receiptImage);
      });
    }
  }, [editId]);

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense') && !c.isHidden),
    [categories, type],
  );

  // reset category when switching between expense/income
  useEffect(() => {
    if (type === 'transfer') return;
    const current = categories.find((c) => c.id === categoryId);
    if (current && current.type !== type) setCategoryId('');
  }, [type, categoryId, categories]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const handleScanReceipt = () => {
    Alert.alert('สแกนสลิป', 'เลือกที่มาของรูป', [
      { text: 'ถ่ายรูป', onPress: () => doPick(true) },
      { text: 'เลือกจากคลังภาพ', onPress: () => doPick(false) },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  };

  const doPick = async (fromCamera: boolean) => {
    const uri = await pickReceiptImage(fromCamera);
    if (!uri) return;
    setReceiptImage(uri);
    const scanned = await scanReceipt(uri);
    if (scanned.amount) setAmountText(String(scanned.amount));
    if (scanned.date) setDate(scanned.date);
    if (!scanned.amount && !scanned.date) {
      Alert.alert('แนบรูปแล้ว', 'อ่านข้อมูลจากสลิปไม่ได้ กรุณากรอกจำนวนเงินและวันที่เอง');
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(amountText.replace(/,/g, ''));
    if (!isFinite(amount) || amount <= 0) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!accountId) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกบัญชี');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกหมวดหมู่');
      return;
    }
    if (type === 'transfer') {
      if (!toAccountId) {
        Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกบัญชีปลายทาง');
        return;
      }
      if (toAccountId === accountId) {
        Alert.alert('ไม่ถูกต้อง', 'บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน');
        return;
      }
    }

    setSaving(true);
    try {
      const t: Transaction = {
        id: original?.id ?? generateId(),
        type,
        amount,
        categoryId: type === 'transfer' ? '' : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        note,
        date,
        receiptImage,
        isRecurring: original?.isRecurring ?? false,
        recurringId: original?.recurringId,
        debtId: original?.debtId,
        createdAt: original?.createdAt ?? new Date().toISOString(),
      };
      if (original) {
        await editTransaction(original, t);
      } else {
        await createTransaction(t);
      }
      await loadAccounts();
      bump();
      if (type === 'expense') {
        checkBudgetAfterExpense(categoryId, selectedCategory, settings, date).catch(() => {});
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const accountItems: ChoiceItem[] = accounts.map((a) => ({
    id: a.id,
    label: a.name,
    sublabel: formatMoney(a.balance, settings.currencySymbol),
    icon: a.icon,
    color: a.color,
  }));
  const categoryItems: ChoiceItem[] = visibleCategories.map((c) => ({
    id: c.id,
    label: c.name,
    icon: c.icon,
    color: c.color,
  }));

  const typeColor =
    type === 'income' ? colors.income : type === 'transfer' ? colors.transfer : colors.expense;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SegmentedControl
            options={[
              { value: 'expense', label: 'รายจ่าย', color: colors.expense },
              { value: 'income', label: 'รายรับ', color: colors.income },
              { value: 'transfer', label: 'โอน', color: colors.transfer },
            ]}
            value={type}
            onChange={setType}
          />

          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={[styles.currencySymbol, { color: typeColor }]}>
              {settings.currencySymbol}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: typeColor }]}
            />
          </View>

          {type !== 'transfer' ? (
            <SelectRow
              label="หมวดหมู่"
              value={selectedCategory?.name}
              placeholder="เลือกหมวดหมู่"
              icon={selectedCategory?.icon}
              iconColor={selectedCategory?.color}
              onPress={() => setPicker('category')}
            />
          ) : null}

          <SelectRow
            label={type === 'transfer' ? 'จากบัญชี' : 'บัญชี'}
            value={selectedAccount?.name}
            placeholder="เลือกบัญชี"
            icon={selectedAccount?.icon}
            iconColor={selectedAccount?.color}
            onPress={() => setPicker('account')}
          />

          {type === 'transfer' ? (
            <SelectRow
              label="ไปยังบัญชี"
              value={selectedToAccount?.name}
              placeholder="เลือกบัญชีปลายทาง"
              icon={selectedToAccount?.icon}
              iconColor={selectedToAccount?.color}
              onPress={() => setPicker('toAccount')}
            />
          ) : null}

          <DateField label="วันที่" value={date} onChange={setDate} />

          <FormField
            label="บันทึกช่วยจำ"
            value={note}
            onChangeText={setNote}
            placeholder="เช่น ข้าวมันไก่ร้านประจำ"
          />

          {/* Receipt */}
          {type === 'expense' ? (
            <View style={{ marginBottom: spacing.lg }}>
              {receiptImage ? (
                <View style={styles.receiptWrap}>
                  <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                  <Pressable
                    onPress={() => setReceiptImage(undefined)}
                    style={[styles.removeReceipt, { backgroundColor: colors.danger }]}
                  >
                    <X size={14} color="#FFFFFF" weight="bold" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleScanReceipt}
                  style={[
                    styles.scanButton,
                    { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Camera size={20} color={colors.primary} />
                  <Text style={[styles.scanText, { color: colors.primary }]}>
                    สแกนสลิป / แนบใบเสร็จ
                  </Text>
                  <ImageIcon size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
          ) : null}

          <PrimaryButton
            title={original ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            onPress={handleSave}
            loading={saving}
            color={typeColor}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChoiceModal
        visible={picker === 'category'}
        title="เลือกหมวดหมู่"
        items={categoryItems}
        selectedId={categoryId}
        onSelect={(item) => setCategoryId(item.id)}
        onClose={() => setPicker(null)}
      />
      <ChoiceModal
        visible={picker === 'account'}
        title="เลือกบัญชี"
        items={accountItems}
        selectedId={accountId}
        onSelect={(item) => setAccountId(item.id)}
        onClose={() => setPicker(null)}
      />
      <ChoiceModal
        visible={picker === 'toAccount'}
        title="เลือกบัญชีปลายทาง"
        items={accountItems.filter((a) => a.id !== accountId)}
        selectedId={toAccountId}
        onSelect={(item) => setToAccountId(item.id)}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    gap: spacing.sm,
  },
  currencySymbol: { fontSize: 30, fontWeight: '700' },
  amountInput: { fontSize: 44, fontWeight: '800', minWidth: 140, textAlign: 'center' },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  scanText: { fontSize: 14, fontWeight: '600' },
  receiptWrap: { alignSelf: 'flex-start' },
  receiptImage: { width: 120, height: 160, borderRadius: radius.md },
  removeReceipt: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
