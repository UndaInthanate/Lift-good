import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';

interface Props extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...inputProps }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
      />
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.textSecondary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
});
