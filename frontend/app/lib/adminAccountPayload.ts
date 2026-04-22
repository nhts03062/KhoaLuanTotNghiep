import dayjs from 'dayjs';

import type { AdminUpdateUserRequest } from '@/app/types/types';

/** Payload PATCH admin cho user / PT (cùng schema BE). */
export function buildAdminUpdatePayload(
  values: Record<string, unknown>,
): AdminUpdateUserRequest {
  const payload: AdminUpdateUserRequest = {};

  if (typeof values.email === 'string' && values.email.trim()) {
    payload.email = values.email.trim();
  }
  if (typeof values.name === 'string' && values.name.trim()) {
    payload.name = values.name.trim();
  }
  if (values.gender) {
    payload.gender = values.gender as AdminUpdateUserRequest['gender'];
  }
  if (typeof values.phone === 'string' && values.phone.trim()) {
    payload.phone = values.phone.trim();
  }
  if (values.dateOfBirth) {
    payload.dateOfBirth = dayjs(values.dateOfBirth as dayjs.Dayjs).toISOString();
  }
  if (typeof values.avatar === 'string' && values.avatar.trim()) {
    payload.avatar = values.avatar.trim();
  }
  if (typeof values.height === 'number') payload.height = values.height;
  if (typeof values.weight === 'number') payload.weight = values.weight;
  if (values.fitnessGoal) {
    payload.fitnessGoal =
      values.fitnessGoal as AdminUpdateUserRequest['fitnessGoal'];
  }

  return payload;
}
