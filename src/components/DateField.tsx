import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarBlank } from 'phosphor-react-native';
import { radius, spacing, useTheme } from '@/theme';
import { FieldLabel } from './FormField';
import { formatThaiDateWithDay, toDateKey } from '@/utils/format';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  label: string;
  /** YYYY-MM-DD */
  value: string;
  onChange: (dateKey: string) => void;
}

export function DateField({ label, value, onChange }: Props) {
  const { colors, dark } = useTheme();
  const [show, setShow] = useState(false);
  const date = new Date(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) onChange(toDateKey(selected));
  };

  return (
    <View style={styles.container}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={() => setShow(true)}
        style={[styles.row, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <CalendarBlank size={18} color={colors.primary} />
        <Text style={[styles.value, { color: colors.text }]}>{formatThaiDateWithDay(value)}</Text>
      </Pressable>
      {show && Platform.OS === 'android' ? (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleChange} />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShow(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                themeVariant={dark ? 'dark' : 'light'}
                onChange={handleChange}
              />
              <PrimaryButton title="ตกลง" onPress={() => setShow(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  value: { fontSize: 15, fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
