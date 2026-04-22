import type { Rule } from 'antd/es/form';
import dayjs, { type Dayjs } from 'dayjs';

const NAME_MIN = 2;
const NAME_MAX = 100;
const HEIGHT_MIN = 50;
const HEIGHT_MAX = 300;
const WEIGHT_MIN = 20;
const WEIGHT_MAX = 500;
const MIN_AGE = 13;
const MAX_AGE = 100;

const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;
const AVATAR_URL_PATTERN =
  /^(https?:\/\/|data:image\/|\/?[\w./-]+\.(jpg|jpeg|png|gif|webp)(\?.*)?$)/i;

function normalizePhone(value: string): string {
  return value.replace(/\s/g, '');
}

function isValidVnPhone(value: string): boolean {
  const v = normalizePhone(value);
  return /^0\d{9,10}$/.test(v) || /^\+84\d{9,10}$/.test(v);
}

function isValidAvatarUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return true;
  } catch {
    return AVATAR_URL_PATTERN.test(trimmed);
  }
}

function validateOptionalNumber(
  value: unknown,
  min: number,
  max: number,
  message: string,
): Promise<void> {
  if (value === null || value === undefined || value === '') {
    return Promise.resolve();
  }
  if (typeof value === 'number' && value >= min && value <= max) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(message));
}

function validateDateOfBirth(value: Dayjs | null | undefined): Promise<void> {
  if (!value) return Promise.resolve();
  const d = dayjs(value);
  if (!d.isValid()) {
    return Promise.reject(new Error('Ngày sinh không hợp lệ'));
  }
  if (d.isAfter(dayjs(), 'day')) {
    return Promise.reject(new Error('Ngày sinh không được ở tương lai'));
  }
  const age = dayjs().diff(d, 'year');
  if (age < MIN_AGE) {
    return Promise.reject(
      new Error(`Bạn phải từ ${MIN_AGE} tuổi trở lên`),
    );
  }
  if (age > MAX_AGE) {
    return Promise.reject(
      new Error(`Ngày sinh không hợp lệ (tối đa ${MAX_AGE} tuổi)`),
    );
  }
  return Promise.resolve();
}

export const profileFieldRules = {
  email: [
    { required: true, message: 'Vui lòng nhập email' },
    { type: 'email', message: 'Email không hợp lệ' },
  ] satisfies Rule[],

  name: [
    { required: true, message: 'Vui lòng nhập họ và tên' },
    { whitespace: true, message: 'Họ và tên không được chỉ có khoảng trắng' },
    { min: NAME_MIN, max: NAME_MAX, message: `Họ và tên từ ${NAME_MIN}–${NAME_MAX} ký tự` },
    {
      pattern: NAME_PATTERN,
      message: 'Họ và tên chỉ gồm chữ cái và khoảng trắng',
    },
  ] satisfies Rule[],

  phone: [
    {
      validator: async (_rule, value: string | undefined) => {
        if (!value?.trim()) return;
        if (!isValidVnPhone(value)) {
          throw new Error('Số điện thoại không hợp lệ (VD: 09xxxxxxxx)');
        }
      },
    },
  ] satisfies Rule[],

  dateOfBirth: [
    {
      validator: async (_rule, value: Dayjs | null | undefined) => {
        await validateDateOfBirth(value);
      },
    },
  ] satisfies Rule[],

  avatar: [
    {
      validator: async (_rule, value: string | undefined) => {
        if (!value?.trim()) return;
        if (!isValidAvatarUrl(value)) {
          throw new Error(
            'URL avatar không hợp lệ (http/https, đường dẫn /uploads/... hoặc URL ảnh)',
          );
        }
      },
    },
  ] satisfies Rule[],

  height: [
    {
      validator: async (_rule, value: number | null | undefined) => {
        await validateOptionalNumber(
          value,
          HEIGHT_MIN,
          HEIGHT_MAX,
          `Chiều cao từ ${HEIGHT_MIN}–${HEIGHT_MAX} cm`,
        );
      },
    },
  ] satisfies Rule[],

  weight: [
    {
      validator: async (_rule, value: number | null | undefined) => {
        await validateOptionalNumber(
          value,
          WEIGHT_MIN,
          WEIGHT_MAX,
          `Cân nặng từ ${WEIGHT_MIN}–${WEIGHT_MAX} kg`,
        );
      },
    },
  ] satisfies Rule[],
} as const;
