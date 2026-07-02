import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/components/Screen';
import { FormField, FieldLabel } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { IconPickerGrid, ColorPickerRow } from '@/components/IconColorPicker';
import { spacing } from '@/theme';
import { CATEGORY_ICON_KEYS } from '@/constants/icons';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { Category } from '@/types';
import { generateId } from '@/utils/id';
import { RootScreenProps } from '@/navigation/types';

export function CategoryFormScreen({ navigation, route }: RootScreenProps<'CategoryForm'>) {
  const categories = useCategoriesStore((s) => s.categories);
  const add = useCategoriesStore((s) => s.add);
  const update = useCategoriesStore((s) => s.update);

  const editing = route.params.id ? categories.find((c) => c.id === route.params.id) : undefined;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('other');
  const [color, setColor] = useState('#10B981');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setIcon(editing.icon);
      setColor(editing.color);
    }
  }, [editing?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อหมวดหมู่');
      return;
    }
    const category: Category = {
      id: editing?.id ?? generateId(),
      name: name.trim(),
      type: editing?.type ?? route.params.type,
      icon,
      color,
      isDefault: editing?.isDefault ?? false,
      isHidden: editing?.isHidden ?? false,
    };
    if (editing) await update(category);
    else await add(category);
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormField
          label="ชื่อหมวดหมู่"
          value={name}
          onChangeText={setName}
          placeholder='เช่น "อาหาร", "เดินทาง"'
        />
        <FieldLabel>ไอคอน</FieldLabel>
        <IconPickerGrid keys={CATEGORY_ICON_KEYS} selected={icon} color={color} onSelect={setIcon} />
        <FieldLabel>สี</FieldLabel>
        <ColorPickerRow selected={color} onSelect={setColor} />
        <PrimaryButton title={editing ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'} onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
});
