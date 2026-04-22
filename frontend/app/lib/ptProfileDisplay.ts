import type { PtAccount } from '@/app/types/types';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80&auto=format&fit=crop';

const DEFAULT_HEIGHT_CM = 180;
const DEFAULT_WEIGHT_KG = 70;

export function resolvePtAvatarSrc(
  avatar?: string | null,
): string | undefined {
  const raw = avatar?.trim();
  if (!raw) return undefined;

  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  if (!base) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  if (raw.startsWith('/')) return `${base}${raw}`;
  return `${base}/${raw}`;
}

export function resolvePtAvatarSrcWithFallback(
  avatar?: string | null,
): string {
  return resolvePtAvatarSrc(avatar) ?? FALLBACK_AVATAR;
}

export function displayPtHeightCm(height?: number | null): string {
  if (height != null && height > 0) return `${height} cm`;
  return `${DEFAULT_HEIGHT_CM} cm`;
}

export function displayPtWeightKg(weight?: number | null): string {
  if (weight != null && weight > 0) return `${weight} kg`;
  return `${DEFAULT_WEIGHT_KG} kg`;
}

export function displayPtName(pt: Pick<PtAccount, 'email' | 'profile'>): string {
  return (
    pt.profile?.name?.trim() ||
    pt.email.split('@')[0]?.replace(/\./g, ' ') ||
    'Huấn luyện viên'
  );
}

export function genderLabelVi(gender?: string | null): string | null {
  if (!gender) return null;
  const u = gender.toUpperCase();
  if (u === 'MALE') return 'Nam';
  if (u === 'FEMALE') return 'Nữ';
  return gender;
}
