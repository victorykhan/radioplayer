import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vawam.ca' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@vawam.ca',
      password: hashed,
      role: 'admin',
    },
  });

  console.log('Seeded:', admin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
