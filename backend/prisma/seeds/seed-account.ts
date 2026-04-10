import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { AccountStatus, Gender, Role } from '../../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password123!';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function seedAccount() {
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // 1 Admin
  const admin = await prisma.account.upsert({
    where: { email: 'admin@bestgym.com' },
    update: {},
    create: {
      email: 'admin@bestgym.com',
      password: hashedPassword,
      status: AccountStatus.ACTIVE,
      role: Role.ADMIN,
    },
  });
  await prisma.profile.upsert({
    where: { accountId: admin.id },
    update: {},
    create: {
      accountId: admin.id,
      name: 'Admin',
    },
  });
  console.log('Seeded 1 admin account:', admin.email);

  // 5 PT accounts + profile
  const ptEmails = [
    'pt1@bestgym.com',
    'pt2@bestgym.com',
    'pt3@bestgym.com',
    'pt4@bestgym.com',
    'pt5@bestgym.com',
  ];
  const ptNames = [
    'Nguyễn Văn PT 1',
    'Trần Thị PT 2',
    'Lê Văn PT 3',
    'Phạm Thị PT 4',
    'Hoàng Văn PT 5',
  ];

  for (let i = 0; i < ptEmails.length; i++) {
    const account = await prisma.account.upsert({
      where: { email: ptEmails[i] },
      update: {},
      create: {
        email: ptEmails[i],
        password: hashedPassword,
        status: AccountStatus.ACTIVE,
        role: Role.PT,
      },
    });
    await prisma.profile.upsert({
      where: { accountId: account.id },
      update: {},
      create: {
        accountId: account.id,
        name: ptNames[i],
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        phone: `090123400${i + 1}`,
      },
    });
  }
  console.log('Seeded 5 PT accounts with profiles.');

  // 3 User accounts
  const userEmails = [
    'user1@bestgym.com',
    'user2@bestgym.com',
    'user3@bestgym.com',
  ];
  for (const email of userEmails) {
    const account = await prisma.account.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        status: AccountStatus.ACTIVE,
        role: Role.USER,
      },
    });
    await prisma.profile.upsert({
      where: { accountId: account.id },
      update: {},
      create: {
        accountId: account.id,
        name: 'User',
      },
    });
  }
  console.log('Seeded 3 user accounts.');

  console.log('Default password for all accounts:', DEFAULT_PASSWORD);
}
