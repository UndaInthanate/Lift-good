import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';

interface Option<T extends string> {
  value: T;
  label: string;
  color?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        const activeColor = opt.color ?? colors.primary;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && { backgroundColor: activeColor }]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? '#FFFFFF' : colors.textSecondary },
                active && styles.labelActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
  labelActive: { fontWeight: '700' },
});
