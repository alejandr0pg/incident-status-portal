import { PrismaClient, Role, Severity, IncidentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const saltRounds = 10;

  const adminHash = await bcrypt.hash('Admin1234!', saltRounds);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const userHash = await bcrypt.hash('User1234!', saltRounds);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userHash,
      role: Role.USER,
    },
  });

  await prisma.incident.createMany({
    data: [
      {
        title: 'Database Connection Failure',
        description:
          'Primary database cluster is experiencing connection timeouts affecting all services.',
        severity: Severity.CRITICAL,
        status: IncidentStatus.INVESTIGATING,
        impactedServices: ['api', 'auth', 'payments'],
        createdById: admin.id,
      },
      {
        title: 'Slow API Response Times',
        description:
          'API endpoints are responding 3x slower than normal due to increased traffic load.',
        severity: Severity.HIGH,
        status: IncidentStatus.OPEN,
        impactedServices: ['api'],
        createdById: regularUser.id,
      },
      {
        title: 'Email Notification Delays',
        description:
          'Email notifications are being delayed by up to 30 minutes due to queue backlog.',
        severity: Severity.LOW,
        status: IncidentStatus.RESOLVED,
        impactedServices: ['notifications'],
        createdById: regularUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully');
  console.log(`Admin: ${admin.email}`);
  console.log(`User: ${regularUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
