import type { AdminAnalyticsMetricKey } from '@/app/types/types';
import { formatNumber } from '@/app/utils/common';

export type GroupBy = 'day' | 'month' | 'year';

export const formatVnd = (value: number | null | undefined): string => {
  const num = Number(value ?? 0);
  return `${formatNumber(num)} đ`;
};

export const formatPct = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '—';
  if (value > 0) return `+${value}%`;
  return `${value}%`;
};

export type PctTagColor = 'green' | 'red' | 'default';

export const pctColor = (value: number | null | undefined): PctTagColor => {
  if (value == null || Number.isNaN(value)) return 'default';
  if (value > 0) return 'green';
  if (value < 0) return 'red';
  return 'default';
};

export interface KpiDefItem {
  key: AdminAnalyticsMetricKey;
  label: string;
  formatter: (value: number | null | undefined) => string;
  accent: string;
  hint?: string;
}

export const KPI_DEF: KpiDefItem[] = [
  {
    key: 'grossRevenue',
    label: 'Doanh thu gộp',
    formatter: formatVnd,
    accent: 'from-blue-50 to-blue-100/60',
    hint: 'Tổng giá gói trong khoảng',
  },
  {
    key: 'activeRevenue',
    label: 'Doanh thu active',
    formatter: formatVnd,
    accent: 'from-emerald-50 to-emerald-100/60',
    hint: 'Doanh thu gói đang ACTIVE',
  },
  {
    key: 'purchasesCount',
    label: 'Lượt mua gói',
    formatter: (n) => formatNumber(Number(n ?? 0)),
    accent: 'from-violet-50 to-violet-100/60',
    hint: 'Số lượt purchase',
  },
  {
    key: 'ptAcceptedSessions',
    label: 'Buổi PT đã nhận',
    formatter: (n) => formatNumber(Number(n ?? 0)),
    accent: 'from-amber-50 to-amber-100/60',
    hint: 'Lịch PT trạng thái ACCEPTED',
  },
  {
    key: 'newUsers',
    label: 'User mới',
    formatter: (n) => formatNumber(Number(n ?? 0)),
    accent: 'from-rose-50 to-rose-100/60',
    hint: 'Account user tạo trong kỳ',
  },
  {
    key: 'activePackages',
    label: 'Gói active',
    formatter: (n) => formatNumber(Number(n ?? 0)),
    accent: 'from-cyan-50 to-cyan-100/60',
    hint: 'Gói user đang còn hiệu lực',
  },
  {
    key: 'checkins',
    label: 'Check-in',
    formatter: (n) => formatNumber(Number(n ?? 0)),
    accent: 'from-lime-50 to-lime-100/60',
    hint: 'Lượt check-in vào chi nhánh',
  },
];

const VI_MONTH = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
];

export const formatBucket = (bucket: string, groupBy: GroupBy): string => {
  if (!bucket) return '';
  if (groupBy === 'year') return bucket;
  if (groupBy === 'month') {
    const [y, m] = bucket.split('-');
    if (y && m) return `${VI_MONTH[Number(m) - 1] ?? m}/${y}`;
    return bucket;
  }
  const [, m, d] = bucket.split('-');
  if (m && d) return `${d}/${m}`;
  return bucket;
};

export const GROUP_BY_LABEL: Record<GroupBy, string> = {
  day: 'Theo ngày',
  month: 'Theo tháng',
  year: 'Theo năm',
};

export const PACKAGE_DONUT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#0ea5e9',
];
