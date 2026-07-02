import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'receipt', title, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
        <AppIcon name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxxl * 1.5, paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: spacing.xs, textAlign: 'center' },
});
