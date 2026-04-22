import type { FitnessGoal } from '@/app/types/types';

type GoalKey = FitnessGoal;

const FITNESS_GOAL_MAP: Record<
  GoalKey,
  { label: string; specialty: string; intro: string }
> = {
  LOSE_WEIGHT: {
    label: 'Giảm cân',
    specialty: 'Huấn luyện giảm mỡ & định hình cơ bắp',
    intro:
      'Tập trung giảm tỷ lệ mỡ, cải thiện vóc dáng và sức bền tim mạch. Lộ trình kết hợp cardio có kiểm soát, tập sức kháng phù hợp trình độ và theo dõi thói quen sinh hoạt để duy trì kết quả lâu dài.',
  },
  GAIN_MUSCLE: {
    label: 'Tăng cơ',
    specialty: 'Huấn luyện tăng cơ & sức mạnh',
    intro:
      'Chuyên xây dựng khối cơ và sức mạnh theo từng giai đoạn: kỹ thuật nâng tạ, tăng tải dần, phục hồi và giãn cơ. Phù hợp người muốn tăng số đo, cải thiện thể lực và hình thể rõ ràng hơn.',
  },
  IMPROVE_HEALTH: {
    label: 'Cải thiện sức khỏe',
    specialty: 'Huấn luyện sức khỏe & vận động an toàn',
    intro:
      'Ưu tiên vận động an toàn, linh hoạt khớp và thói quen tập bền vững. Phù hợp người mới tập, phục hồi sau chấn thương nhẹ hoặc muốn nâng cao sức khỏe tổng thể, giảm mệt mỏi và tăng năng lượng hằng ngày.',
  },
  MAINTAIN_WEIGHT: {
    label: 'Duy trì cân nặng',
    specialty: 'Huấn luyện duy trì thể trạng & lối sống chủ động',
    intro:
      'Giữ ổn định cân nặng và thể chất qua tập luyện cân bằng, không quá tải. Tập trung thói quen, giữ cơ và sức khỏe tim mạch, phù hợp người đã đạt mục tiêu và muốn duy trì lâu dài.',
  },
};

const FALLBACK_SPECIALTY = 'Huấn luyện viên chuyên nghiệp';
const FALLBACK_INTRO =
  'Đồng hành cùng hội viên trong từng buổi tập, tư vấn kỹ thuật và theo dõi tiến độ phù hợp mục tiêu cá nhân.';

function normalizeGoal(raw?: string | null): GoalKey | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toUpperCase();
  if (key in FITNESS_GOAL_MAP) return key as GoalKey;
  return null;
}

export function fitnessGoalLabel(goal?: string | null): string | null {
  const k = normalizeGoal(goal);
  return k ? FITNESS_GOAL_MAP[k].label : null;
}

export function fitnessGoalSpecialty(goal?: string | null): string {
  const k = normalizeGoal(goal);
  return k ? FITNESS_GOAL_MAP[k].specialty : FALLBACK_SPECIALTY;
}

export function fitnessGoalIntroParagraph(goal?: string | null): string {
  const k = normalizeGoal(goal);
  return k ? FITNESS_GOAL_MAP[k].intro : FALLBACK_INTRO;
}

/** Đoạn giới thiệu chuyên môn đầy đủ — nhúng tên PT */
export function ptExpertiseIntro(
  ptName: string,
  goal?: string | null,
): string {
  const name = ptName.trim() || 'Huấn luyện viên';
  const specialty = fitnessGoalSpecialty(goal);
  const intro = fitnessGoalIntroParagraph(goal);
  return `${name} là ${specialty.toLowerCase()} tại PowerFit. ${intro}`;
}
