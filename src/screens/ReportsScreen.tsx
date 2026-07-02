import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { PieChart } from 'react-native-chart-kit';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { radius, spacing, useTheme } from '@/theme';
import { AppIcon } from '@/constants/icons';
import { useCategoriesStore } from '@/store/useCategoriesStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import * as transactionRepo from '@/db/transactionRepo';
import { CategorySum } from '@/types';
import {
  addMonths,
  addWeeks,
  addYears,
  DateRange,
  getMonthRange,
  getWeekRange,
  getYearRange,
} from '@/utils/dateRange';
import {
  formatMoney,
  formatThaiDate,
  formatThaiMonthYear,
  thaiMonthShort,
  toBuddhistYear,
} from '@/utils/format';

type Period = 'week' | 'month' | 'year';
type Direction = 'expense' | 'income';

const screenWidth = Dimensions.get('window').width;

export function ReportsScreen() {
  const { colors } = useTheme();
  const categories = useCategoriesStore((s) => s.categories);
  const settings = useSettingsStore((s) => s.settings);
  const version = useTransactionsStore((s) => s.version);

  const [period, setPeriod] = useState<Period>('month');
  const [direction, setDirection] = useState<Direction>('expense');
  const [refDate, setRefDate] = useState(new Date());
  const [sums, setSums] = useState<CategorySum[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; income: number; expense: number }[]>([]);

  const range: DateRange = useMemo(() => {
    if (period === 'week') return getWeekRange(refDate);
    if (period === 'year') return getYearRange(refDate);
    return getMonthRange(refDate, settings.monthStartDay);
  }, [period, refDate, settings.monthStartDay]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const categorySums = await transactionRepo.sumByCategory(range.start, range.end, direction);
        const year = getYearRange(refDate);
        const monthlyData = await transactionRepo.monthlyTotals(year.start, year.end);
        if (active) {
          setSums(categorySums);
          setMonthly(monthlyData);
        }
      })();
      return () => {
        active = false;
      };
    }, [range.start, range.end, direction, refDate, version]),
  );

  const shift = (dir: 1 | -1) => {
    if (period === 'week') setRefDate((d) => addWeeks(d, dir));
    else if (period === 'month') setRefDate((d) => addMonths(d, dir));
    else setRefDate((d) => addYears(d, dir));
  };

  const periodLabel =
    period === 'week'
      ? `${formatThaiDate(range.start)} - ${formatThaiDate(range.end)}`
      : period === 'month'
        ? formatThaiMonthYear(new Date(range.start))
        : `ปี ${toBuddhistYear(refDate.getFullYear())}`;

  const total = sums.reduce((s, c) => s + c.total, 0);
  const symbol = settings.currencySymbol;

  const pieData = sums.slice(0, 8).map((s) => {
    const cat = categories.find((c) => c.id === s.categoryId);
    return {
      name: cat?.name ?? 'ไม่ระบุ',
      population: s.total,
      color: cat?.color ?? '#64748B',
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    };
  });

  const maxMonthly = Math.max(1, ...monthly.flatMap((m) => [m.income, m.expense]));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SegmentedControl<Period>
          options={[
            { value: 'week', label: 'สัปดาห์' },
            { value: 'month', label: 'เดือน' },
            { value: 'year', label: 'ปี' },
          ]}
          value={period}
          onChange={setPeriod}
        />

        {/* Period navigator */}
        <View style={styles.periodRow}>
          <Pressable onPress={() => shift(-1)} style={[styles.arrow, { backgroundColor: colors.surface }]}>
            <CaretLeft size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.periodLabel, { color: colors.text }]}>{periodLabel}</Text>
          <Pressable onPress={() => shift(1)} style={[styles.arrow, { backgroundColor: colors.surface }]}>
            <CaretRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <SegmentedControl<Direction>
          options={[
            { value: 'expense', label: 'รายจ่าย', color: colors.expense },
            { value: 'income', label: 'รายรับ', color: colors.income },
          ]}
          value={direction}
          onChange={setDirection}
        />

        {/* Donut chart */}
        <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          {total === 0 ? (
            <EmptyState icon="chart" title="ไม่มีข้อมูลในช่วงนี้" />
          ) : (
            <>
              <PieChart
                data={pieData}
                width={screenWidth - spacing.lg * 4}
                height={190}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                chartConfig={{ color: () => colors.text }}
                absolute={false}
              />
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                รวม{direction === 'expense' ? 'รายจ่าย' : 'รายรับ'}
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  { color: direction === 'expense' ? colors.expense : colors.income },
                ]}
              >
                {formatMoney(total, symbol)}
              </Text>
            </>
          )}
        </Card>

        {/* Monthly income vs expense bars */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          รายรับ-รายจ่ายรายเดือน (ปี {toBuddhistYear(refDate.getFullYear())})
        </Text>
        <Card>
          {monthly.length === 0 ? (
            <EmptyState icon="chart" title="ไม่มีข้อมูล" />
          ) : (
            <View style={styles.monthlyChart}>
              {monthly.map((m) => {
                const monthIndex = parseInt(m.month.slice(5, 7), 10) - 1;
                return (
                  <View key={m.month} style={styles.monthCol}>
                    <View style={styles.monthBars}>
                      <View
                        style={[
                          styles.monthBar,
                          {
                            height: `${Math.max(2, (m.income / maxMonthly) * 100)}%`,
                            backgroundColor: colors.income,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.monthBar,
                          {
                            height: `${Math.max(2, (m.expense / maxMonthly) * 100)}%`,
                            backgroundColor: colors.expense,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.monthLabel, { color: colors.textMuted }]}>
                      {thaiMonthShort(monthIndex)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>รายรับ</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>รายจ่าย</Text>
          </View>
        </Card>

        {/* Category breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>สรุปตามหมวดหมู่</Text>
        <Card style={{ marginBottom: spacing.xxxl }}>
          {sums.length === 0 ? (
            <EmptyState icon="chart" title="ไม่มีข้อมูลในช่วงนี้" />
          ) : (
            sums.map((s) => {
              const cat = categories.find((c) => c.id === s.categoryId);
              const pct = total > 0 ? (s.total / total) * 100 : 0;
              const color = cat?.color ?? '#64748B';
              return (
                <View key={s.categoryId || 'none'} style={styles.breakdownRow}>
                  <View style={[styles.breakdownIcon, { backgroundColor: color + '22' }]}>
                    <AppIcon name={cat?.icon ?? 'other'} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.breakdownTop}>
                      <Text style={[styles.breakdownName, { color: colors.text }]}>
                        {cat?.name ?? 'ไม่ระบุ'}
                      </Text>
                      <Text style={[styles.breakdownAmount, { color: colors.text }]}>
                        {formatMoney(s.total, symbol)}
                      </Text>
                    </View>
                    <View style={styles.breakdownBottom}>
                      <View style={{ flex: 1 }}>
                        <ProgressBar percent={pct} color={color} height={6} />
                      </View>
                      <Text style={[styles.breakdownPct, { color: colors.textMuted }]}>
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: { fontSize: 15, fontWeight: '700' },
  totalLabel: { fontSize: 12, marginTop: spacing.sm },
  totalValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.md },
  monthlyChart: { flexDirection: 'row', height: 140, alignItems: 'flex-end' },
  monthCol: { flex: 1, alignItems: 'center', height: '100%' },
  monthBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
  },
  monthBar: { width: 7, borderRadius: 3 },
  monthLabel: { fontSize: 10, marginTop: spacing.xs },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, marginRight: spacing.md },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  breakdownIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownName: { fontSize: 14, fontWeight: '600' },
  breakdownAmount: { fontSize: 14, fontWeight: '700' },
  breakdownBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  breakdownPct: { fontSize: 11, width: 44, textAlign: 'right' },
});
