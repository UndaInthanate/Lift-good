import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Debt, RecurringTransaction, Settings } from '@/types';
import { computeDebt } from '@/utils/debt';
import { nextDueDate } from './recurringService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'การแจ้งเตือน',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

const DAILY_REMINDER_ID = 'daily-reminder';

export async function scheduleDailyReminder(settings: Settings): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  if (!settings.dailyReminderEnabled) return;
  const [hour, minute] = settings.dailyReminderTime.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'บันทึกรายจ่ายวันนี้หรือยัง? 📝',
      body: 'อย่าลืมบันทึกรายรับ-รายจ่ายประจำวันของคุณ',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hour ?? 20,
      minute: minute ?? 0,
    },
  });
}

/** Fire an immediate local notification (budget warnings). */
export async function notifyNow(title: string, body: string): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

function debtNotificationId(debtId: string): string {
  return `debt-due-${debtId}`;
}

/** Schedule a reminder N days before the next due date of each active debt. */
export async function scheduleDebtReminders(debts: Debt[], settings: Settings): Promise<void> {
  await ensureAndroidChannel();
  for (const debt of debts) {
    await Notifications.cancelScheduledNotificationAsync(debtNotificationId(debt.id)).catch(
      () => {},
    );
  }
  if (!settings.debtReminderEnabled) return;
  const now = new Date();
  for (const debt of debts) {
    if (debt.status !== 'active') continue;
    const computed = computeDebt(debt, now);
    const due = new Date(computed.nextDueDate);
    const remindAt = new Date(
      due.getFullYear(),
      due.getMonth(),
      due.getDate() - settings.debtReminderDaysBefore,
      9,
      0,
    );
    if (remindAt.getTime() <= now.getTime()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: debtNotificationId(debt.id),
      content: {
        title: `ใกล้ครบกำหนดชำระ: ${debt.name} ⏰`,
        body: `งวดถัดไปครบกำหนดวันที่ ${due.getDate()} อย่าลืมชำระนะ`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
    });
  }
}

function recurringNotificationId(id: string): string {
  return `recurring-${id}`;
}

/** Remind 1 day before each active recurring item's next occurrence. */
export async function scheduleRecurringReminders(items: RecurringTransaction[]): Promise<void> {
  await ensureAndroidChannel();
  const now = new Date();
  for (const item of items) {
    await Notifications.cancelScheduledNotificationAsync(recurringNotificationId(item.id)).catch(
      () => {},
    );
    if (!item.isActive) continue;
    const due = new Date(nextDueDate(item, now));
    const remindAt = new Date(due.getFullYear(), due.getMonth(), due.getDate() - 1, 9, 0);
    if (remindAt.getTime() <= now.getTime()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: recurringNotificationId(item.id),
      content: {
        title: `รายการประจำ: ${item.name} 🔁`,
        body: 'จะถูกบันทึกอัตโนมัติพรุ่งนี้',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
    });
  }
}
