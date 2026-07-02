import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, EyeSlash, PencilSimple, Plus, Trash } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import * as categoryRepo from '@/db/categoryRepo';
import { CategoryType } from '@/types';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const categories = useCategoriesStore((s) => s.categories);
  const load = useCategoriesStore((s) => s.load);
  const update = useCategoriesStore((s) => s.update);
  const remove = useCategoriesStore((s) => s.remove);

  const [tab, setTab] = useState<CategoryType>('expense');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const list = categories.filter((c) => c.type === tab);

  const handleDelete = async (id: string, name: string) => {
    const count = await categoryRepo.countCategoryTransactions(id);
    Alert.alert(
      'ลบหมวดหมู่',
      count > 0
        ? `หมวด "${name}" มี ${count} รายการผูกอยู่ รายการเหล่านั้นจะกลายเป็น "ไม่ระบุหมวด" ลบเลย?`
        : `ลบหมวด "${name}"?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => remove(id) },
      ],
    );
  };

  return (
    <Screen>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <SegmentedControl<CategoryType>
          options={[
            { value: 'expense', label: 'รายจ่าย', color: colors.expense },
            { value: 'income', label: 'รายรับ', color: colors.income },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {list.map((cat) => (
          <View
            key={cat.id}
            style={[
              styles.row,
              { backgroundColor: colors.surface, opacity: cat.isHidden ? 0.5 : 1 },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
              <AppIcon name={cat.icon} size={20} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{cat.name}</Text>
              {cat.isDefault ? (
                <Text style={[styles.badge, { color: colors.textMuted }]}>หมวดเริ่มต้น</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => update({ ...cat, isHidden: !cat.isHidden })}
              style={styles.actionButton}
            >
              {cat.isHidden ? (
                <EyeSlash size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textSecondary} />
              )}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('CategoryForm', { id: cat.id, type: tab })}
              style={styles.actionButton}
            >
              <PencilSimple size={18} color={colors.transfer} />
            </Pressable>
            {!cat.isDefault ? (
              <Pressable onPress={() => handleDelete(cat.id, cat.name)} style={styles.actionButton}>
                <Trash size={18} color={colors.danger} />
              </Pressable>
            ) : (
              <View style={styles.actionButton} />
            )}
          </View>
        ))}

        <Pressable
          onPress={() => navigation.navigate('CategoryForm', { type: tab })}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Plus size={18} color={colors.primary} weight="bold" />
          <Text style={[styles.addText, { color: colors.primary }]}>เพิ่มหมวดหมู่ใหม่</Text>
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
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600' },
  badge: { fontSize: 11, marginTop: 2 },
  actionButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
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
