import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';

interface Props {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  onPress,
  color,
  disabled = false,
  loading = false,
  variant = 'solid',
  style,
}: Props) {
  const { colors } = useTheme();
  const base = color ?? (variant === 'danger' ? colors.danger : colors.primary);
  const solid = variant !== 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        solid
          ? { backgroundColor: base }
          : { borderWidth: 1.5, borderColor: base, backgroundColor: 'transparent' },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={solid ? '#FFFFFF' : base} />
      ) : (
        <Text style={[styles.title, { color: solid ? '#FFFFFF' : base }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700' },
});
