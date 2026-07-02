import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Repeat } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useRecurringStore } from '@/store/useRecurringStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { nextDueDate } from '@/services/recurringService';
import { formatMoney, formatThaiDate } from '@/utils/format';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RecurringScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const items = useRecurringStore((s) => s.items);
  const load = useRecurringStore((s) => s.load);
  const update = useRecurringStore((s) => s.update);
  const remove = useRecurringStore((s) => s.remove);
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('ลบรายการประจำ', `ลบ "${name}"? รายการที่สร้างไปแล้วจะยังอยู่`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="ยังไม่มีรายการประจำ"
            subtitle="เช่น เงินเดือน ค่าเช่า ค่าเน็ต จะถูกบันทึกให้อัตโนมัติเมื่อถึงกำหนด"
          />
        ) : (
          items.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const color = item.type === 'income' ? colors.income : colors.expense;
            return (
              <Pressable
                key={item.id}
                onPress={() => navigation.navigate('RecurringForm', { id: item.id })}
                onLongPress={() => handleDelete(item.id, item.name)}
              >
                <Card style={[styles.row, { opacity: item.isActive ? 1 : 0.55 }]}>
                  <View style={[styles.iconWrap, { backgroundColor: (cat?.color ?? color) + '22' }]}>
                    {cat ? (
                      <AppIcon name={cat.icon} size={20} color={cat.color} />
                    ) : (
                      <Repeat size={20} color={color} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.detail, { color: colors.textMuted }]}>
                      {item.frequency === 'monthly'
                        ? `ทุกวันที่ ${item.dayOfMonth}`
                        : 'ทุกสัปดาห์'}
                      {item.isActive
                        ? ` · ครั้งถัดไป ${formatThaiDate(nextDueDate(item))}`
                        : ' · ปิดอยู่'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                    <Text style={[styles.amount, { color }]}>
                      {item.type === 'income' ? '+' : '-'}
                      {formatMoney(item.amount, settings.currencySymbol)}
                    </Text>
                    <Switch
                      value={item.isActive}
                      onValueChange={(v) => update({ ...item, isActive: v })}
                      trackColor={{ true: colors.primary }}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}

        <Pressable
          onPress={() => navigation.navigate('RecurringForm', undefined)}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Plus size={18} color={colors.primary} weight="bold" />
          <Text style={[styles.addText, { color: colors.primary }]}>เพิ่มรายการประจำ</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
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
