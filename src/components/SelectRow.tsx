import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { FieldLabel } from './FormField';

interface Props {
  label: string;
  value?: string;
  placeholder?: string;
  icon?: string;
  iconColor?: string;
  onPress: () => void;
}

/** A tappable form row that opens a picker. */
export function SelectRow({ label, value, placeholder = 'เลือก', icon, iconColor, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={onPress}
        style={[styles.row, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: (iconColor ?? colors.primary) + '22' }]}>
            <AppIcon name={icon} size={18} color={iconColor ?? colors.primary} />
          </View>
        ) : null}
        <Text
          style={[styles.value, { color: value ? colors.text : colors.textMuted }]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <CaretRight size={16} color={colors.textMuted} />
      </Pressable>
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
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { flex: 1, fontSize: 15, fontWeight: '500' },
});
