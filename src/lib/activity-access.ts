import { EntityType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/rbac";
import { clientWhereForUser, isAdmin } from "@/lib/rbac";
import { notDeleted } from "@/lib/soft-delete";

export async function isMatterAssignee(
  userId: string,
  matterId: string
): Promise<boolean> {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, ...notDeleted },
    select: { id: true },
  });
  if (!matter) return false;

  const direct = await prisma.matterAssignment.count({
    where: { matterId, userId },
  });
  if (direct > 0) return true;

  const viaGroup = await prisma.matterGroupAssignment.count({
    where: {
      matterId,
      group: {
        active: true,
        ...notDeleted,
        members: { some: { userId } },
      },
    },
  });
  return viaGroup > 0;
}

async function getMatterIdForEntity(
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  switch (entityType) {
    case EntityType.MATTER: {
      const matter = await prisma.matter.findFirst({
        where: { id: entityId, ...notDeleted },
        select: { id: true },
      });
      return matter?.id ?? null;
    }
    case EntityType.DOCUMENT_LINK: {
      const doc = await prisma.documentLink.findFirst({
        where: { id: entityId, ...notDeleted },
        select: { matterId: true },
      });
      return doc?.matterId ?? null;
    }
    case EntityType.TASK: {
      const task = await prisma.task.findFirst({
        where: { id: entityId, ...notDeleted },
        select: { matterId: true },
      });
      return task?.matterId ?? null;
    }
    case EntityType.BILLING_RECORD: {
      const billing = await prisma.billingRecord.findFirst({
        where: { id: entityId, ...notDeleted },
        select: { matterId: true, clientId: true },
      });
      return billing?.matterId ?? null;
    }
    default:
      return null;
  }
}

export async function canViewEntityActivity(
  user: SessionUser,
  entityType: EntityType,
  entityId: string
): Promise<boolean> {
  if (isAdmin(user)) return true;

  if (entityType === EntityType.CLIENT) return false;
  if (entityType === EntityType.USER || entityType === EntityType.TAG) {
    return false;
  }

  if (entityType === EntityType.BILLING_RECORD) {
    const billing = await prisma.billingRecord.findFirst({
      where: { id: entityId, ...notDeleted },
      select: { matterId: true, clientId: true },
    });
    if (!billing) return false;
    if (billing.matterId) {
      return isMatterAssignee(user.id, billing.matterId);
    }
    const count = await prisma.client.count({
      where: { id: billing.clientId, ...clientWhereForUser(user) },
    });
    return count > 0;
  }

  const matterId = await getMatterIdForEntity(entityType, entityId);
  if (!matterId) return false;

  return isMatterAssignee(user.id, matterId);
}

export async function getEntityActivityForUser(
  user: SessionUser,
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  const allowed = await canViewEntityActivity(user, entityType, entityId);
  if (!allowed) return [];

  return prisma.activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function getMatterIdsForUser(userId: string): Promise<string[]> {
  const [direct, viaGroup] = await Promise.all([
    prisma.matterAssignment.findMany({
      where: { userId, matter: notDeleted },
      select: { matterId: true },
    }),
    prisma.matterGroupAssignment.findMany({
      where: {
        matter: notDeleted,
        group: { active: true, ...notDeleted, members: { some: { userId } } },
      },
      select: { matterId: true },
    }),
  ]);

  return [
    ...new Set([
      ...direct.map((a) => a.matterId),
      ...viaGroup.map((a) => a.matterId),
    ]),
  ];
}

export async function getActivityLogsForAssignee(
  user: SessionUser,
  limit = 50
) {
  const matterIds = await getMatterIdsForUser(user.id);
  if (matterIds.length === 0) return [];

  const [docs, tasks, billing] = await Promise.all([
    prisma.documentLink.findMany({
      where: { matterId: { in: matterIds }, ...notDeleted },
      select: { id: true },
    }),
    prisma.task.findMany({
      where: { matterId: { in: matterIds }, ...notDeleted },
      select: { id: true },
    }),
    prisma.billingRecord.findMany({
      where: { matterId: { in: matterIds }, ...notDeleted },
      select: { id: true },
    }),
  ]);

  const docIds = docs.map((d) => d.id);
  const taskIds = tasks.map((t) => t.id);
  const billingIds = billing.map((b) => b.id);

  return prisma.activityLog.findMany({
    where: {
      OR: [
        { entityType: EntityType.MATTER, entityId: { in: matterIds } },
        { entityType: EntityType.DOCUMENT_LINK, entityId: { in: docIds } },
        { entityType: EntityType.TASK, entityId: { in: taskIds } },
        { entityType: EntityType.BILLING_RECORD, entityId: { in: billingIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
