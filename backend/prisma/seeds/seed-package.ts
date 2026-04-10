import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { PackageUnit } from '../../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const packages = [
  {
    name: 'Gói phòng gym 1 tháng',
    unit: PackageUnit.MONTH,
    durationValue: 1,
    hasPt: false,
    ptSessionsIncluded: null as number | null,
    price: 599_000,
    description: 'Tập tự do không kèm PT',
  },
  {
    name: 'Gói gym + PT 1 tháng (8 buổi)',
    unit: PackageUnit.MONTH,
    durationValue: 1,
    hasPt: true,
    ptSessionsIncluded: 8,
    price: 2_490_000,
    description: '8 buổi tập có PT, chọn PT và lịch khi đặt từng buổi',
  },
];

export async function seedPackage() {
  for (const p of packages) {
    const existing = await prisma.package.findFirst({
      where: { name: p.name },
    });
    const data = {
      name: p.name,
      unit: p.unit,
      durationValue: p.durationValue,
      hasPt: p.hasPt,
      ptSessionsIncluded: p.hasPt ? p.ptSessionsIncluded : null,
      price: p.price,
      description: p.description,
      isActive: true,
    };
    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.package.create({ data });
    }
  }
  console.log(`Seeded ${packages.length} demo packages`);
}
