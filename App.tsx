import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { darkColors, lightColors, Theme, ThemeContext } from '@/theme';
import { initDatabase } from '@/db/database';
import { runFirstLaunchSetup } from '@/services/firstLaunch';
import { processRecurringTransactions } from '@/services/recurringService';
import {
  scheduleDailyReminder,
  scheduleDebtReminders,
  scheduleRecurringReminders,
} from '@/services/notificationService';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAccountsStore } from '@/store/useAccountsStore';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useDebtsStore } from '@/store/useDebtsStore';
import { useRecurringStore } from '@/store/useRecurringStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const systemScheme = useColorScheme();
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const firstLaunch = await runFirstLaunchSetup();
        setShowWelcome(firstLaunch);

        await Promise.all([
          useSettingsStore.getState().load(),
          useAccountsStore.getState().load(),
          useCategoriesStore.getState().load(),
          useDebtsStore.getState().load(),
          useRecurringStore.getState().load(),
        ]);

        // create any recurring transactions that came due while the app was closed
        const created = await processRecurringTransactions();
        if (created > 0) {
          await useAccountsStore.getState().load();
          useTransactionsStore.getState().bump();
        }

        // refresh scheduled local notifications (best-effort)
        const s = useSettingsStore.getState().settings;
        scheduleDailyReminder(s).catch(() => {});
        scheduleDebtReminders(useDebtsStore.getState().debts, s).catch(() => {});
        scheduleRecurringReminders(useRecurringStore.getState().items).catch(() => {});
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const dark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemScheme === 'dark');

  const theme: Theme = useMemo(
    () => ({ colors: dark ? darkColors : lightColors, dark }),
    [dark],
  );

  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        primary: theme.colors.primary,
        border: theme.colors.border,
      },
    };
  }, [dark, theme]);

  if (!ready || !settingsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeContext.Provider value={theme}>
          <NavigationContainer theme={navTheme}>
            <StatusBar style={dark ? 'light' : 'dark'} />
            <RootNavigator showWelcome={showWelcome} />
          </NavigationContainer>
        </ThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
