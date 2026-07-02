import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check } from 'phosphor-react-native';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';

export interface ChoiceItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
}

interface Props {
  visible: boolean;
  title: string;
  items: ChoiceItem[];
  selectedId?: string;
  onSelect: (item: ChoiceItem) => void;
  onClose: () => void;
}

export function ChoiceModal({ visible, title, items, selectedId, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[styles.row, selected && { backgroundColor: colors.primarySoft }]}
                >
                  {item.icon ? (
                    <View style={[styles.iconWrap, { backgroundColor: (item.color ?? colors.primary) + '22' }]}>
                      <AppIcon name={item.icon} size={20} color={item.color ?? colors.primary} />
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                    {item.sublabel ? (
                      <Text style={[styles.sublabel, { color: colors.textMuted }]}>
                        {item.sublabel}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <Check size={20} color={colors.primary} weight="bold" /> : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700', marginBottom: spacing.md, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, fontWeight: '600' },
  sublabel: { fontSize: 12, marginTop: 2 },
});
