import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface Props {
  children?: React.ReactNode;
  style?: ViewStyle;
  /** include top safe-area padding (for screens without a native header) */
  padTop?: boolean;
}

export function Screen({ children, style, padTop = false }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: padTop ? insets.top : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
