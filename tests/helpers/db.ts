import bcrypt from "bcryptjs";
import { Role, WorkflowEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PREFIX = "test-p0-";
const TEST_PASSWORD = "test-p0-password";

export type P0Fixtures = {
  admin: { id: string; email: string };
  lawyerA: { id: string; email: string };
  lawyerB: { id: string; email: string };
  viewer: { id: string; email: string };
  clientId: string;
  matterAssignedId: string;
  matterHiddenId: string;
  documentAssignedId: string;
  documentTitle: string;
  hiddenMatterTitle: string;
};

export async function canConnectDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function upsertTestUser(
  email: string,
  name: string,
  role: Role,
  passwordHash: string
) {
  return prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role, active: true },
    update: {
      name,
      role,
      active: true,
      failedLoginCount: 0,
      lastFailedLoginAt: null,
      passwordHash,
    },
  });
}

export async function seedP0Fixtures(): Promise<P0Fixtures> {
  await cleanupP0Fixtures();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const admin = await upsertTestUser(
    `${PREFIX}admin@firm.local`,
    "P0 Admin",
    Role.ADMIN,
    passwordHash
  );
  const lawyerA = await upsertTestUser(
    `${PREFIX}lawyer-a@firm.local`,
    "P0 Lawyer A",
    Role.LAWYER,
    passwordHash
  );
  const lawyerB = await upsertTestUser(
    `${PREFIX}lawyer-b@firm.local`,
    "P0 Lawyer B",
    Role.LAWYER,
    passwordHash
  );
  const viewer = await upsertTestUser(
    `${PREFIX}viewer@firm.local`,
    "P0 Viewer",
    Role.VIEWER,
    passwordHash
  );

  // Ensure a default WorkflowStatus for MATTER exists so AUTH-010 can look it up.
  await prisma.workflowStatus.upsert({
    where: {
      entityType_name: {
        entityType: WorkflowEntityType.MATTER,
        name: `${PREFIX}Open`,
      },
    },
    create: {
      entityType: WorkflowEntityType.MATTER,
      name: `${PREFIX}Open`,
      labelEn: "Open",
      isDefault: true,
      active: true,
    },
    update: {
      isDefault: true,
      active: true,
    },
  });

  const client = await prisma.client.create({
    data: {
      displayName: `${PREFIX}Client Alpha`,
      clientType: "COMPANY",
      status: "ACTIVE",
    },
  });

  const matterAssigned = await prisma.matter.create({
    data: {
      clientId: client.id,
      title: `${PREFIX}Assigned Matter`,
      status: "OPEN",
      assignments: { create: { userId: lawyerA.id } },
    },
  });

  const hiddenMatterTitle = `${PREFIX}Hidden Matter Beta`;
  const matterHidden = await prisma.matter.create({
    data: {
      clientId: client.id,
      title: hiddenMatterTitle,
      status: "OPEN",
      assignments: { create: { userId: lawyerB.id } },
    },
  });

  const documentTitle = `${PREFIX}Privileged Doc Link`;
  const document = await prisma.documentLink.create({
    data: {
      clientId: client.id,
      matterId: matterHidden.id,
      title: documentTitle,
      url: "https://drive.google.com/file/d/test-p0-hidden",
      referenceType: "EXTERNAL_URL",
      provider: "GOOGLE_DRIVE",
      sensitivity: "CONFIDENTIAL",
    },
  });

  return {
    admin: { id: admin.id, email: admin.email },
    lawyerA: { id: lawyerA.id, email: lawyerA.email },
    lawyerB: { id: lawyerB.id, email: lawyerB.email },
    viewer: { id: viewer.id, email: viewer.email },
    clientId: client.id,
    matterAssignedId: matterAssigned.id,
    matterHiddenId: matterHidden.id,
    documentAssignedId: document.id,
    documentTitle,
    hiddenMatterTitle,
  };
}

/** Removes test clients/matters/docs/workflow-statuses only. Users remain (ActivityLog is immutable). */
export async function cleanupP0Fixtures(): Promise<void> {
  const clients = await prisma.client.findMany({
    where: { displayName: { startsWith: PREFIX } },
    select: { id: true },
  });
  const clientIds = clients.map((c) => c.id);

  if (clientIds.length > 0) {
    await prisma.documentLink.deleteMany({
      where: { clientId: { in: clientIds } },
    });
    await prisma.task.deleteMany({ where: { clientId: { in: clientIds } } });
    await prisma.matterAssignment.deleteMany({
      where: { matter: { clientId: { in: clientIds } } },
    });
    await prisma.matterGroupAssignment.deleteMany({
      where: { matter: { clientId: { in: clientIds } } },
    });
    await prisma.matter.deleteMany({ where: { clientId: { in: clientIds } } });
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  }

  // Clean up the test WorkflowStatus row.
  await prisma.workflowStatus.deleteMany({
    where: { name: { startsWith: PREFIX } },
  });
}

export { TEST_PASSWORD };
