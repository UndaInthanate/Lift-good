import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChartPieSlice, HandCoins, Wallet } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radius, spacing, useTheme } from '@/theme';
import { RootScreenProps } from '@/navigation/types';

export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const features = [
    {
      icon: <Wallet size={24} color="#10B981" />,
      title: 'บันทึกรายรับ-รายจ่าย',
      detail: 'จดทุกบาทจากหลายบัญชี เงินสด ธนาคาร e-Wallet พร้อมสแกนสลิป',
    },
    {
      icon: <ChartPieSlice size={24} color="#3B82F6" />,
      title: 'รายงานและงบประมาณ',
      detail: 'ดูสรุปเป็นกราฟ ตั้งวงเงินต่อหมวด มีแจ้งเตือนเมื่อใกล้เกินงบ',
    },
    {
      icon: <HandCoins size={24} color="#F59E0B" />,
      title: 'ติดตามหนี้ผ่อนชำระ',
      detail: 'เห็นความคืบหน้า เหลืออีกกี่งวด พร้อมเตือนก่อนครบกำหนด',
    },
    {
      icon: <Bell size={24} color="#EC4899" />,
      title: 'ข้อมูลอยู่ในเครื่องคุณ',
      detail: 'ไม่ต้องสมัครสมาชิก ไม่มีเซิร์ฟเวอร์ ข้อมูลเป็นส่วนตัว 100%',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.headerGradientStart }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xxxl * 2, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Money</Text>
        <Text style={styles.subtitle}>จัดการการเงินส่วนตัว ง่าย ครบ จบในแอพเดียว</Text>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>{f.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDetail}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton
          title="เริ่มต้นใช้งาน"
          onPress={() => navigation.replace('Tabs')}
          style={{ marginTop: spacing.xxxl }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xxl },
  logo: { fontSize: 56, textAlign: 'center' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  features: { gap: spacing.xl },
  featureRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  featureDetail: { fontSize: 13, color: '#94A3B8', marginTop: 4, lineHeight: 19 },
});
