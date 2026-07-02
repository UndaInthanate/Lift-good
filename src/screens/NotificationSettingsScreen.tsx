import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { spacing, useTheme } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDebtsStore } from '@/store/useDebtsStore';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleDebtReminders,
} from '@/services/notificationService';

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const debts = useDebtsStore((s) => s.debts);

  const ensurePermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert('ไม่ได้รับอนุญาต', 'กรุณาเปิดการแจ้งเตือนในตั้งค่าของเครื่อง');
    }
    return granted;
  };

  const toggleDaily = async (value: boolean) => {
    if (value && !(await ensurePermission())) return;
    await update({ dailyReminderEnabled: value });
    await scheduleDailyReminder({ ...settings, dailyReminderEnabled: value });
  };

  const changeDailyTime = async (time: string) => {
    await update({ dailyReminderTime: time });
    if (settings.dailyReminderEnabled && /^\d{1,2}:\d{2}$/.test(time)) {
      await scheduleDailyReminder({ ...settings, dailyReminderTime: time });
    }
  };

  const toggleBudget = async (value: boolean) => {
    if (value && !(await ensurePermission())) return;
    await update({ budgetWarningEnabled: value });
  };

  const toggleDebt = async (value: boolean) => {
    if (value && !(await ensurePermission())) return;
    await update({ debtReminderEnabled: value });
    await scheduleDebtReminders(debts, { ...settings, debtReminderEnabled: value });
  };

  const changeDebtDays = async (text: string) => {
    const days = parseInt(text, 10);
    if (isFinite(days) && days >= 0 && days <= 30) {
      await update({ debtReminderDaysBefore: days });
      if (settings.debtReminderEnabled) {
        await scheduleDebtReminders(debts, { ...settings, debtReminderDaysBefore: days });
      }
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ marginBottom: spacing.lg }}>
          <SettingRow
            title="เตือนบันทึกรายจ่ายประจำวัน"
            subtitle={`ทุกวันเวลา ${settings.dailyReminderTime} น.`}
            value={settings.dailyReminderEnabled}
            onChange={toggleDaily}
          />
          {settings.dailyReminderEnabled ? (
            <FormField
              label="เวลาแจ้งเตือน (เช่น 20:00)"
              defaultValue={settings.dailyReminderTime}
              onEndEditing={(e) => changeDailyTime(e.nativeEvent.text)}
              placeholder="20:00"
              keyboardType="numbers-and-punctuation"
            />
          ) : null}
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <SettingRow
            title="เตือนงบประมาณ"
            subtitle="แจ้งเมื่อใช้งบถึง 80% และเกิน 100%"
            value={settings.budgetWarningEnabled}
            onChange={toggleBudget}
          />
        </Card>

        <Card>
          <SettingRow
            title="เตือนหนี้ครบกำหนด"
            subtitle={`เตือนล่วงหน้า ${settings.debtReminderDaysBefore} วัน`}
            value={settings.debtReminderEnabled}
            onChange={toggleDebt}
          />
          {settings.debtReminderEnabled ? (
            <FormField
              label="เตือนล่วงหน้า (วัน)"
              defaultValue={String(settings.debtReminderDaysBefore)}
              onEndEditing={(e) => changeDebtDays(e.nativeEvent.text)}
              keyboardType="number-pad"
              placeholder="3"
            />
          ) : null}
        </Card>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          รายการประจำจะแจ้งเตือนล่วงหน้า 1 วันโดยอัตโนมัติเมื่อเปิดใช้งานรายการนั้น
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SettingRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  note: { fontSize: 12, marginTop: spacing.lg, lineHeight: 18, textAlign: 'center' },
});
