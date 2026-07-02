import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  /** 0-100 */
  percent: number;
  color?: string;
  height?: number;
  /** green→yellow→red gradient steps by progress (debt progress bars) */
  gradient?: boolean;
}

export function ProgressBar({ percent, color, height = 8, gradient = false }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(100, percent));

  let fillColor = color ?? colors.primary;
  if (gradient) {
    if (clamped < 34) fillColor = '#EF4444';
    else if (clamped < 67) fillColor = '#F59E0B';
    else fillColor = '#10B981';
  }

  const segments = gradient ? buildGradientSegments(clamped) : null;

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt, height, borderRadius: height / 2 }]}>
      {segments ? (
        <View style={[styles.fillRow, { width: `${clamped}%`, borderRadius: height / 2 }]}>
          {segments.map((seg, i) => (
            <View key={i} style={{ flex: seg.flex, backgroundColor: seg.color }} />
          ))}
        </View>
      ) : (
        <View
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: fillColor,
            borderRadius: height / 2,
          }}
        />
      )}
    </View>
  );
}

/** Approximate a green→yellow→red gradient with color bands inside the fill. */
function buildGradientSegments(percent: number): { flex: number; color: string }[] {
  const bands = ['#10B981', '#34D399', '#A3E635', '#FACC15', '#F59E0B', '#F97316', '#EF4444'];
  const visible = Math.max(1, Math.ceil((percent / 100) * bands.length));
  return bands.slice(0, visible).map((color) => ({ flex: 1, color }));
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fillRow: { flexDirection: 'row', height: '100%', overflow: 'hidden' },
});
