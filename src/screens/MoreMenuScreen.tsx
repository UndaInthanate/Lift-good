import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bank,
  Bell,
  Gear,
  HandCoins,
  PiggyBank,
  Repeat,
  Tag,
} from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { radius, spacing, useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  screen: keyof RootStackParamList;
}

export function MoreMenuScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const items: MenuItem[] = [
    {
      title: 'บัญชี',
      subtitle: 'เงินสด ธนาคาร e-Wallet',
      icon: <Bank size={26} color="#3B82F6" />,
      color: '#3B82F6',
      screen: 'Accounts',
    },
    {
      title: 'หมวดหมู่',
      subtitle: 'จัดการหมวดรายรับ-รายจ่าย',
      icon: <Tag size={26} color="#8B5CF6" />,
      color: '#8B5CF6',
      screen: 'Categories',
    },
    {
      title: 'งบประมาณ',
      subtitle: 'ตั้งวงเงินต่อหมวดต่อเดือน',
      icon: <PiggyBank size={26} color="#10B981" />,
      color: '#10B981',
      screen: 'Budget',
    },
    {
      title: 'จัดการหนี้',
      subtitle: 'ติดตามการผ่อนชำระ',
      icon: <HandCoins size={26} color="#F59E0B" />,
      color: '#F59E0B',
      screen: 'DebtList',
    },
    {
      title: 'รายการประจำ',
      subtitle: 'บันทึกอัตโนมัติเมื่อถึงกำหนด',
      icon: <Repeat size={26} color="#06B6D4" />,
      color: '#06B6D4',
      screen: 'Recurring',
    },
    {
      title: 'การแจ้งเตือน',
      subtitle: 'เตือนบันทึก งบ และหนี้',
      icon: <Bell size={26} color="#EC4899" />,
      color: '#EC4899',
      screen: 'NotificationSettings',
    },
    {
      title: 'ตั้งค่า',
      subtitle: 'ธีม สกุลเงิน นำเข้า/ส่งออก',
      icon: <Gear size={26} color="#64748B" />,
      color: '#64748B',
      screen: 'Settings',
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {items.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => navigation.navigate(item.screen as never)}
              style={[styles.cell, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.color + '1A' }]}>{item.icon}</View>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: {
    width: '47.8%',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11.5, lineHeight: 16 },
});
