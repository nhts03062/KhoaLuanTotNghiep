import type { AxiosError } from 'axios';

/** Lấy message từ lỗi axios sau khi interceptor reject. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr.response?.data?.message;

  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;

  return fallback;
}
