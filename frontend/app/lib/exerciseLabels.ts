import type { Exercise } from '@/app/types/types';

export const muscleGroupLabels: Record<Exercise['muscleGroup'], string> = {
  CHEST: 'Ngực',
  BACK: 'Lưng',
  ARMS: 'Tay',
  LEGS: 'Chân',
  ABS: 'Bụng',
  CORE: 'Core',
  CARDIO: 'Cardio',
};

export const levelLabels: Record<Exercise['level'], string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
};
