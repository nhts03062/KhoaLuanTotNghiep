import { PrismaService } from 'src/prisma/prisma.service';

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'HIGH';

export class AiToolHandlers {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(accountIdFromJwt: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { accountId: accountIdFromJwt },
      select: {
        name: true,
        height: true,
        weight: true,
        fitnessGoal: true,
        gender: true,
        dateOfBirth: true,
      },
    });

    return (
      profile ?? { name: null, height: null, weight: null, fitnessGoal: null }
    );
  }

  async listPackages(args: { hasPt?: boolean; unit?: 'DAY' | 'MONTH' }) {
    return this.prisma.package.findMany({
      where: {
        isActive: true,
        ...(typeof args.hasPt === 'boolean' ? { hasPt: args.hasPt } : {}),
        ...(args.unit ? { unit: args.unit } : {}),
      },
      select: {
        id: true,
        name: true,
        unit: true,
        durationValue: true,
        hasPt: true,
        price: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async listPrograms(args: {
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    daysPerWeek?: number;
  }) {
    return this.prisma.program.findMany({
      where: {
        isActive: true,
        ...(args.level ? { level: args.level } : {}),
        ...(args.daysPerWeek ? { daysPerWeek: args.daysPerWeek } : {}),
      },
      select: {
        id: true,
        name: true,
        level: true,
        daysPerWeek: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  calcNutritionMacros(args: {
    weightKg: number;
    heightCm: number;
    goal: string;
    activityLevel?: ActivityLevel;
  }) {
    const w = args.weightKg;

    const act = args.activityLevel ?? 'MODERATE';
    const actFactor =
      act === 'SEDENTARY'
        ? 28
        : act === 'LIGHT'
          ? 30
          : act === 'MODERATE'
            ? 32
            : 34;

    let calories = Math.round(w * actFactor);

    if (args.goal === 'LOSE_WEIGHT') calories = Math.round(calories * 0.85);
    if (args.goal === 'GAIN_MUSCLE') calories = Math.round(calories * 1.1);

    const protein = Math.round(w * (args.goal === 'GAIN_MUSCLE' ? 2.2 : 1.8)); // g/day
    const fat = Math.round((calories * 0.25) / 9); // 25% calories from fat
    const carbs = Math.max(
      0,
      Math.round((calories - protein * 4 - fat * 9) / 4),
    );

    return { calories, macros: { protein, fat, carbs }, activityLevel: act };
  }
}
