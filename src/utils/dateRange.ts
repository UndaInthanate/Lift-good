import { toDateKey } from './format';

export interface DateRange {
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD inclusive
}

/**
 * Range of the "budget month" containing `ref`, where a month begins on
 * `monthStartDay` (e.g. 25 for salary cycles). Days beyond a month's length
 * clamp to the last day of that month.
 */
export function getMonthRange(ref: Date, monthStartDay: number): DateRange {
  const day = ref.getDate();
  let startYear = ref.getFullYear();
  let startMonth = ref.getMonth();
  if (day < clampDay(startYear, startMonth, monthStartDay)) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }
  const start = new Date(startYear, startMonth, clampDay(startYear, startMonth, monthStartDay));
  const endExclusive = new Date(startYear, startMonth + 1, clampDay(startYear, startMonth + 1, monthStartDay));
  const end = new Date(endExclusive.getTime() - 24 * 60 * 60 * 1000);
  return { start: toDateKey(start), end: toDateKey(end) };
}

function clampDay(year: number, month: number, day: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(day, daysInMonth);
}

/** Range for a budget month key like "2026-06" respecting monthStartDay. */
export function getMonthRangeForKey(monthKey: string, monthStartDay: number): DateRange {
  const [y, m] = monthKey.split('-').map(Number);
  const start = new Date(y, m - 1, clampDay(y, m - 1, monthStartDay));
  const endExclusive = new Date(y, m, clampDay(y, m, monthStartDay));
  const end = new Date(endExclusive.getTime() - 24 * 60 * 60 * 1000);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function getWeekRange(ref: Date): DateRange {
  // Week starts Monday
  const day = ref.getDay(); // 0 = Sunday
  const diffToMonday = (day + 6) % 7;
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - diffToMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function getYearRange(ref: Date): DateRange {
  return {
    start: toDateKey(new Date(ref.getFullYear(), 0, 1)),
    end: toDateKey(new Date(ref.getFullYear(), 11, 31)),
  };
}

export function getLastNDays(n: number, ref = new Date()): DateRange {
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (n - 1));
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + weeks * 7);
}

export function addYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() + years, date.getMonth(), 1);
}
