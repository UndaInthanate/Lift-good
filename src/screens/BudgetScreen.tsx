import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CaretLeft, CaretRight, Plus } from 'phosphor-react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ChoiceModal } from '@/components/ChoiceModal';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as budgetRepo from '@/db/budgetRepo';
import * as transactionRepo from '@/db/transactionRepo';
import { budgetLevel } from '@/services/budgetAlertService';
import { Budget } from '@/types';
import { getMonthRangeForKey } from '@/utils/dateRange';
import { formatMoney, formatThaiMonthYear, toMonthKey } from '@/utils/format';
import { generateId } from '@/utils/id';

interface BudgetWithUsage extends Budget {
  spent: number;
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(y, m - 1 + delta, 1));
}

export function BudgetScreen() {
  const { colors } = useTheme();
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const version = useTransactionsStore((s) => s.version);

  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const [budgets, setBudgets] = useState<BudgetWithUsage[]>([]);
  const [prevMonthHasBudgets, setPrevMonthHasBudgets] = useState(false);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorCategoryId, setEditorCategoryId] = useState('');
  const [editorAmount, setEditorAmount] = useState('');
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const reload = useCallback(async () => {
    const list = await budgetRepo.getBudgetsForMonth(monthKey);
    const range = getMonthRangeForKey(monthKey, settings.monthStartDay);
    const withUsage: BudgetWithUsage[] = [];
    for (const b of list) {
      const spent = await transactionRepo.categoryExpenseTotal(b.categoryId, range.start, range.end);
      withUsage.push({ ...b, spent });
    }
    withUsage.sort((a, b) => b.spent / (b.amount || 1) - a.spent / (a.amount || 1));
    setBudgets(withUsage);
    const prev = await budgetRepo.getBudgetsForMonth(shiftMonthKey(monthKey, -1));
    setPrevMonthHasBudgets(prev.length > 0 && list.length === 0);
  }, [monthKey, settings.monthStartDay]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload, version]),
  );

  const openEditor = (categoryId = '', amount = '') => {
    setEditorCategoryId(categoryId);
    setEditorAmount(amount);
    setEditorVisible(true);
  };

  const saveBudget = async () => {
    const amount = parseFloat(editorAmount.replace(/,/g, ''));
    if (!editorCategoryId) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!isFinite(amount) || amount <= 0) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกวงเงินให้ถูกต้อง');
      return;
    }
    await budgetRepo.upsertBudget({
      id: generateId(),
      categoryId: editorCategoryId,
      amount,
      month: monthKey,
    });
    setEditorVisible(false);
    reload();
  };

  const copyFromLastMonth = async () => {
    const prev = await budgetRepo.getBudgetsForMonth(shiftMonthKey(monthKey, -1));
    for (const b of prev) {
      await budgetRepo.upsertBudget({
        id: generateId(),
        categoryId: b.categoryId,
        amount: b.amount,
        month: monthKey,
      });
    }
    reload();
  };

  const deleteBudget = (b: Budget) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    Alert.alert('ลบงบประมาณ', `ลบงบของหมวด "${cat?.name ?? '-'}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await budgetRepo.deleteBudget(b.id);
          reload();
        },
      },
    ]);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense' && !c.isHidden);
  const availableCategories = expenseCategories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id) || c.id === editorCategoryId,
  );
  const editorCategory = categories.find((c) => c.id === editorCategoryId);
  const symbol = settings.currencySymbol;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Month navigator */}
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setMonthKey((k) => shiftMonthKey(k, -1))}
            style={[styles.arrow, { backgroundColor: colors.surface }]}
          >
            <CaretLeft size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {formatThaiMonthYear(monthDate)}
          </Text>
          <Pressable
            onPress={() => setMonthKey((k) => shiftMonthKey(k, 1))}
            style={[styles.arrow, { backgroundColor: colors.surface }]}
          >
            <CaretRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {budgets.length > 0 ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>งบรวมเดือนนี้</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatMoney(totalSpent, symbol)} / {formatMoney(totalBudget, symbol)}
              </Text>
            </View>
            <ProgressBar
              percent={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
              color={
                budgetLevel(totalSpent, totalBudget) === 'over'
                  ? colors.danger
                  : budgetLevel(totalSpent, totalBudget) === 'warning'
                    ? colors.warning
                    : colors.success
              }
            />
          </Card>
        ) : null}

        {budgets.length === 0 ? (
          <>
            <EmptyState
              icon="piggy"
              title="ยังไม่ได้ตั้งงบประมาณเดือนนี้"
              subtitle="ตั้งวงเงินรายจ่ายต่อหมวดเพื่อคุมค่าใช้จ่าย"
            />
            {prevMonthHasBudgets ? (
              <PrimaryButton
                title="คัดลอกงบจากเดือนก่อน"
                variant="outline"
                onPress={copyFromLastMonth}
                style={{ marginBottom: spacing.md }}
              />
            ) : null}
          </>
        ) : (
          budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
            const level = budgetLevel(b.spent, b.amount);
            const barColor =
              level === 'over' ? colors.danger : level === 'warning' ? colors.warning : colors.success;
            const remaining = b.amount - b.spent;
            return (
              <Pressable
                key={b.id}
                onPress={() => openEditor(b.categoryId, String(b.amount))}
                onLongPress={() => deleteBudget(b)}
              >
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.budgetTop}>
                    <View style={[styles.iconWrap, { backgroundColor: (cat?.color ?? '#64748B') + '22' }]}>
                      <AppIcon name={cat?.icon ?? 'other'} size={18} color={cat?.color ?? '#64748B'} />
                    </View>
                    <Text style={[styles.budgetName, { color: colors.text }]}>
                      {cat?.name ?? 'ไม่ระบุ'}
                    </Text>
                    <Text style={[styles.budgetPct, { color: barColor }]}>{Math.round(pct)}%</Text>
                  </View>
                  <ProgressBar percent={pct} color={barColor} />
                  <View style={styles.budgetBottom}>
                    <Text style={[styles.budgetDetail, { color: colors.textMuted }]}>
                      ใช้ไป {formatMoney(b.spent, symbol)} จาก {formatMoney(b.amount, symbol)}
                    </Text>
                    <Text
                      style={[
                        styles.budgetDetail,
                        { color: remaining >= 0 ? colors.success : colors.danger, fontWeight: '700' },
                      ]}
                    >
                      {remaining >= 0
                        ? `เหลือ ${formatMoney(remaining, symbol)}`
                        : `เกิน ${formatMoney(-remaining, symbol)}`}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}

        <Pressable onPress={() => openEditor()} style={[styles.addButton, { borderColor: colors.primary }]}>
          <Plus size={18} color={colors.primary} weight="bold" />
          <Text style={[styles.addText, { color: colors.primary }]}>ตั้งงบประมาณหมวดใหม่</Text>
        </Pressable>
      </ScrollView>

      {/* Budget editor modal */}
      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setEditorVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>ตั้งงบประมาณ</Text>
            <Pressable
              onPress={() => setCategoryPickerVisible(true)}
              style={[styles.categorySelect, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            >
              {editorCategory ? (
                <>
                  <AppIcon name={editorCategory.icon} size={18} color={editorCategory.color} />
                  <Text style={[styles.categorySelectText, { color: colors.text }]}>
                    {editorCategory.name}
                  </Text>
                </>
              ) : (
                <Text style={[styles.categorySelectText, { color: colors.textMuted }]}>
                  เลือกหมวดหมู่
                </Text>
              )}
            </Pressable>
            <TextInput
              value={editorAmount}
              onChangeText={setEditorAmount}
              placeholder="วงเงินต่อเดือน"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text },
              ]}
            />
            <PrimaryButton title="บันทึก" onPress={saveBudget} />
          </Pressable>
        </Pressable>
      </Modal>

      <ChoiceModal
        visible={categoryPickerVisible}
        title="เลือกหมวดหมู่"
        items={availableCategories.map((c) => ({ id: c.id, label: c.name, icon: c.icon, color: c.color }))}
        selectedId={editorCategoryId}
        onSelect={(item) => setEditorCategoryId(item.id)}
        onClose={() => setCategoryPickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  arrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 13, fontWeight: '700' },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  budgetName: { flex: 1, fontSize: 14, fontWeight: '600' },
  budgetPct: { fontSize: 14, fontWeight: '800' },
  budgetBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  budgetDetail: { fontSize: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  addText: { fontSize: 14, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  categorySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
  },
  categorySelectText: { fontSize: 15, fontWeight: '500' },
  amountInput: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md + 2,
    fontSize: 15,
  },
});
