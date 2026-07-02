const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

let numberFormatter: Intl.NumberFormat | null = null;

function getFormatter(): Intl.NumberFormat {
  if (!numberFormatter) {
    numberFormatter = new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return numberFormatter;
}

/** ฿12,500.00 */
export function formatMoney(amount: number, symbol = '฿'): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${getFormatter().format(Math.abs(amount))}`;
}

/** +฿12,500.00 / -฿12,500.00 */
export function formatSignedMoney(amount: number, positive: boolean, symbol = '฿'): string {
  return `${positive ? '+' : '-'}${symbol}${getFormatter().format(Math.abs(amount))}`;
}

export function toBuddhistYear(year: number): number {
  return year + 543;
}

/** "29 มิ.ย. 2569" */
export function formatThaiDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${toBuddhistYear(d.getFullYear())}`;
}

/** "อา. 29 มิ.ย. 2569" */
export function formatThaiDateWithDay(isoDate: string): string {
  const d = new Date(isoDate);
  return `${THAI_DAYS_SHORT[d.getDay()]} ${formatThaiDate(isoDate)}`;
}

/** "มิถุนายน 2569" */
export function formatThaiMonthYear(date: Date): string {
  return `${THAI_MONTHS_FULL[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}

/** "มิ.ย." */
export function thaiMonthShort(monthIndex: number): string {
  return THAI_MONTHS_SHORT[monthIndex];
}

/** "29/06/2569" */
export function formatThaiDateSlash(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${toBuddhistYear(d.getFullYear())}`;
}

/** local YYYY-MM-DD */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-06" */
export function toMonthKey(date: Date): string {
  return toDateKey(date).slice(0, 7);
}

export function todayKey(): string {
  return toDateKey(new Date());
}
