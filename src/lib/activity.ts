import {
  ActivityAction,
  ActivityCategory,
  EntityType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Append-only audit entries. No update/delete APIs — enforced in PostgreSQL. */
export async function logActivity(params: {
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  summary: string;
  category?: ActivityCategory;
  metadata?: Prisma.InputJsonValue;
}) {
  const actor = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true },
  });
  if (!actor) {
    throw new Error("Cannot log activity: user not found");
  }

  return prisma.activityLog.create({
    data: {
      userId: params.userId,
      actorName: actor.name,
      actorEmail: actor.email,
      entityType: params.entityType,
      entityId: params.entityId,
      category: params.category ?? ActivityCategory.DATA,
      action: params.action,
      summary: params.summary,
      metadata: params.metadata,
    },
  });
}

export async function getEntityActivity(
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  return prisma.activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
