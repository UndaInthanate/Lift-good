import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { COLOR_PALETTE } from '@/constants/defaults';

export function IconPickerGrid({
  keys,
  selected,
  color,
  onSelect,
}: {
  keys: string[];
  selected: string;
  color: string;
  onSelect: (key: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {keys.map((key) => {
        const active = key === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[
              styles.iconCell,
              { backgroundColor: active ? color + '33' : colors.surfaceAlt },
              active && { borderColor: color, borderWidth: 2 },
            ]}
          >
            <AppIcon name={key} size={22} color={active ? color : colors.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function ColorPickerRow({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {COLOR_PALETTE.map((color) => {
        const active = color === selected;
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[styles.colorCell, { backgroundColor: color }]}
          >
            {active ? <Check size={18} color="#FFFFFF" weight="bold" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
