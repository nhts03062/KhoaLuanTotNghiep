import type { PtMonthlyRewardPayoutStatus } from '@/app/types/types';
import type { Dayjs } from 'dayjs';

export const PT_PAYOUT_STATUS_LABELS: Record<
  PtMonthlyRewardPayoutStatus,
  string
> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  PAID: 'Đã thanh toán',
  VOID: 'Hủy',
};

export const PT_PAYOUT_STATUS_COLORS: Record<
  PtMonthlyRewardPayoutStatus,
  string
> = {
  DRAFT: 'default',
  APPROVED: 'blue',
  PAID: 'green',
  VOID: 'red',
};

export const PT_PAYOUT_STATUS_OPTIONS: Array<{
  value: PtMonthlyRewardPayoutStatus;
  label: string;
}> = (
  Object.keys(PT_PAYOUT_STATUS_LABELS) as PtMonthlyRewardPayoutStatus[]
).map((value) => ({
  value,
  label: PT_PAYOUT_STATUS_LABELS[value],
}));

export const monthKeyFromDayjs = (d: Dayjs): string => d.format('YYYY-MM');

export const formatMonthKeyVi = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  return `Tháng ${month}/${year}`;
};
