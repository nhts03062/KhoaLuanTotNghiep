export const formatNumber = (number: number) => {
  return number.toLocaleString('vi-VN');
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

/** Backend: `1` = Thứ 2 (đầu tuần làm việc), tăng dần tới `7` = Chủ nhật. */
const DAY_OF_WEEK_VI: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật',
};

/**
 * Quy đổi `dayOfWeek` (1–7) sang nhãn tiếng Việt.
 * Một số API dùng `0` = Chủ nhật — cũng được hỗ trợ.
 */
export function formatDayOfWeekVietnamese(dayOfWeek: number): string {
  if (dayOfWeek === 0) return 'Chủ nhật';
  const label = DAY_OF_WEEK_VI[dayOfWeek];
  if (label) return label;
  return `Ngày ${dayOfWeek}`;
}

/** Giá trị gửi API: 1–7 (1 = Thứ 2 … 7 = Chủ nhật). Dùng cho Select/Radio. */
export const DAY_OF_WEEK_SELECT_OPTIONS = (
  [1, 2, 3, 4, 5, 6, 7] as const
).map((value) => ({
  value,
  label: DAY_OF_WEEK_VI[value],
}));
