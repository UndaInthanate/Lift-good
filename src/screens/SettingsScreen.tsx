import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CaretRight, DownloadSimple, Trash, UploadSimple } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { FieldLabel, FormField } from '@/components/FormField';
import { ChoiceModal } from '@/components/ChoiceModal';
import { spacing, useTheme } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { useDebtsStore } from '@/store/useDebtsStore';
import { useRecurringStore } from '@/store/useRecurringStore';
import { exportTransactionsCsv, importTransactionsCsv } from '@/services/csvService';
import { wipeDatabase } from '@/db/database';
import { runFirstLaunchSetup } from '@/services/firstLaunch';
import { ThemeMode } from '@/types';

const CURRENCIES = [
  { id: 'THB', label: 'บาทไทย (THB)', symbol: '฿' },
  { id: 'USD', label: 'ดอลลาร์สหรัฐ (USD)', symbol: '$' },
  { id: 'EUR', label: 'ยูโร (EUR)', symbol: '€' },
  { id: 'JPY', label: 'เยนญี่ปุ่น (JPY)', symbol: '¥' },
];

export function SettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const loadSettings = useSettingsStore((s) => s.load);
  const accounts = useAccountsStore((s) => s.accounts);
  const loadAccounts = useAccountsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.categories);
  const loadCategories = useCategoriesStore((s) => s.load);
  const bump = useTransactionsStore((s) => s.bump);
  const loadDebts = useDebtsStore((s) => s.load);
  const loadRecurring = useRecurringStore((s) => s.load);

  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportTransactionsCsv(accounts, categories);
    } catch {
      Alert.alert('ผิดพลาด', 'ส่งออกไฟล์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const result = await importTransactionsCsv(accounts, categories);
      if (result) {
        await loadAccounts();
        bump();
        Alert.alert(
          'นำเข้าเสร็จสิ้น',
          `นำเข้า ${result.imported} รายการ${result.skipped > 0 ? ` (ข้าม ${result.skipped} รายการ)` : ''}`,
        );
      }
    } catch {
      Alert.alert('ผิดพลาด', 'นำเข้าไฟล์ไม่สำเร็จ ตรวจสอบรูปแบบไฟล์ CSV');
    } finally {
      setBusy(false);
    }
  };

  const handleWipe = () => {
    Alert.alert('ล้างข้อมูลทั้งหมด', 'ข้อมูลทุกอย่างจะถูกลบถาวร ทั้งรายการ บัญชี หนี้ และงบประมาณ', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ดำเนินการต่อ',
        style: 'destructive',
        onPress: () =>
          Alert.alert('ยืนยันอีกครั้ง', 'แน่ใจหรือไม่? การกระทำนี้ย้อนกลับไม่ได้', [
            { text: 'ยกเลิก', style: 'cancel' },
            {
              text: 'ลบทั้งหมด',
              style: 'destructive',
              onPress: async () => {
                await wipeDatabase();
                await runFirstLaunchSetup();
                await Promise.all([
                  loadSettings(),
                  loadAccounts(),
                  loadCategories(),
                  loadDebts(),
                  loadRecurring(),
                ]);
                bump();
                Alert.alert('เสร็จสิ้น', 'ล้างข้อมูลและตั้งค่าเริ่มต้นใหม่แล้ว');
              },
            },
          ]),
      },
    ]);
  };

  const currentCurrency = CURRENCIES.find((c) => c.id === settings.currency);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ marginBottom: spacing.lg }}>
          <FieldLabel>ธีม</FieldLabel>
          <SegmentedControl<ThemeMode>
            options={[
              { value: 'light', label: 'สว่าง' },
              { value: 'dark', label: 'มืด' },
              { value: 'system', label: 'ตามระบบ' },
            ]}
            value={settings.theme}
            onChange={(theme) => update({ theme })}
          />

          <View style={{ height: spacing.lg }} />
          <FieldLabel>สกุลเงิน</FieldLabel>
          <Pressable
            onPress={() => setCurrencyPickerVisible(true)}
            style={[styles.selectRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
          >
            <Text style={[styles.selectText, { color: colors.text }]}>
              {currentCurrency?.label ?? settings.currency} ({settings.currencySymbol})
            </Text>
            <CaretRight size={16} color={colors.textMuted} />
          </Pressable>

          <View style={{ height: spacing.lg }} />
          <FormField
            label="วันเริ่มต้นเดือน (1-28 เช่น 25 ตามรอบเงินเดือน)"
            defaultValue={String(settings.monthStartDay)}
            keyboardType="number-pad"
            onEndEditing={(e) => {
              const day = parseInt(e.nativeEvent.text, 10);
              if (isFinite(day) && day >= 1 && day <= 28) {
                update({ monthStartDay: day });
              } else {
                Alert.alert('ไม่ถูกต้อง', 'วันเริ่มต้นเดือนต้องอยู่ระหว่าง 1-28');
              }
            }}
          />
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <ActionRow
            icon={<UploadSimple size={20} color={colors.primary} />}
            title="ส่งออก CSV"
            subtitle="ส่งออกรายการทั้งหมดเป็นไฟล์ .csv"
            onPress={handleExport}
            disabled={busy}
          />
          <ActionRow
            icon={<DownloadSimple size={20} color={colors.transfer} />}
            title="นำเข้า CSV"
            subtitle="นำเข้ารายการจากไฟล์ .csv (รูปแบบเดียวกับที่ส่งออก)"
            onPress={handleImport}
            disabled={busy}
          />
        </Card>

        <Card>
          <ActionRow
            icon={<Trash size={20} color={colors.danger} />}
            title="ล้างข้อมูลทั้งหมด"
            subtitle="ลบทุกอย่างและเริ่มต้นใหม่"
            titleColor={colors.danger}
            onPress={handleWipe}
            disabled={busy}
          />
        </Card>

        <Text style={[styles.version, { color: colors.textMuted }]}>
          Money — จัดการการเงินส่วนตัว v1.0.0{'\n'}ข้อมูลทั้งหมดเก็บในเครื่องของคุณเท่านั้น
        </Text>
      </ScrollView>

      <ChoiceModal
        visible={currencyPickerVisible}
        title="เลือกสกุลเงิน"
        items={CURRENCIES.map((c) => ({ id: c.id, label: c.label, sublabel: c.symbol }))}
        selectedId={settings.currency}
        onSelect={(item) => {
          const currency = CURRENCIES.find((c) => c.id === item.id);
          if (currency) update({ currency: currency.id, currencySymbol: currency.symbol });
        }}
        onClose={() => setCurrencyPickerVisible(false)}
      />
    </Screen>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  titleColor,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  titleColor?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.actionRow, (pressed || disabled) && { opacity: 0.6 }]}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: titleColor ?? colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <CaretRight size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
  },
  selectText: { fontSize: 15, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionSubtitle: { fontSize: 12, marginTop: 2 },
  version: { fontSize: 12, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
