import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
const branches = [
  {
    name: 'BestGym Quận 1',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '028 1234 5678',
    isActive: true,
  },
  {
    name: 'BestGym Quận 7',
    address: '456 Nguyễn Lương Bằng, Quận 7, TP.HCM',
    phone: '028 8765 4321',
    isActive: true,
  },
  {
    name: 'BestGym Bình Thạnh',
    address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    phone: '028 2345 6789',
    isActive: true,
  },
  {
    name: 'BestGym Thủ Đức',
    address: '321 Võ Văn Ngân, Thủ Đức, TP.HCM',
    phone: '028 3456 7890',
    isActive: true,
  },
  {
    name: 'BestGym Gò Vấp',
    address: '654 Quang Trung, Gò Vấp, TP.HCM',
    phone: '028 4567 8901',
    isActive: true,
  },
];

export async function seedBranch() {
  await prisma.branch.createMany({
    data: branches,
    skipDuplicates: true,
  });
  console.log('Seeded 5 branches.');
}
