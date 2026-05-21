import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedWorkflowStatuses } from "./seed-workflow";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const email = process.env.SEED_ADMIN_EMAIL ?? "admin@firm.local";
    const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme";
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name: "Administrator",
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log(`Seeded admin user: ${email}`);
  }

  const tagCount = await prisma.tag.count();
  if (tagCount === 0) {
    await prisma.tag.createMany({
      data: [
        { name: "Urgent", color: "#dc2626" },
        { name: "Litigation", color: "#2563eb" },
        { name: "Corporate", color: "#059669" },
        { name: "Estate", color: "#7c3aed" },
      ],
    });
    console.log("Seeded sample tags");
  }

  const groupCount = await prisma.userGroup.count();
  if (groupCount === 0) {
    await prisma.userGroup.create({
      data: {
        name: "Litigation Team",
        description: "Default litigation practice group",
      },
    });
    console.log("Seeded sample user group");
  }

  await prisma.firmSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      firmName: "Firmedware",
      timezone: "Asia/Bangkok",
      defaultLanguage: "th",
    },
    update: {},
  });

  await seedWorkflowStatuses(prisma);

  await prisma.user.upsert({
    where: { email: "security-audit@firm.local" },
    create: {
      email: "security-audit@firm.local",
      name: "Security Audit",
      passwordHash: "$2a$12$invalidhashforauditonly00000000000000000000000",
      role: Role.ADMIN,
      active: false,
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
