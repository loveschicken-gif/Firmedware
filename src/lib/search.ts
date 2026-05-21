import { MatterStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/rbac";
import {
  clientWhereForUser,
  documentWhereForUser,
  isAdmin,
  matterWhereForUser,
} from "@/lib/rbac";
import { getActivityLogsForAssignee } from "@/lib/activity-access";

export async function globalSearch(user: SessionUser, query: string) {
  const q = query.trim();
  if (!q) {
    return { clients: [], matters: [], documents: [] };
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const statusMatch = Object.values(MatterStatus).find(
    (s) => s.toLowerCase() === q.toLowerCase() || s.replace("_", " ").toLowerCase() === q.toLowerCase()
  );

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        clientWhereForUser(user),
        {
          OR: [
            { displayName: contains },
            { companyName: contains },
            { notes: contains },
            { tags: { some: { tag: { name: contains } } } },
          ],
        },
      ],
    },
    take: 20,
    include: { tags: { include: { tag: true } } },
  });

  const matters = await prisma.matter.findMany({
    where: {
      AND: [
        matterWhereForUser(user),
        {
          OR: [
            { title: contains },
            { caseNumber: contains },
            { notes: contains },
            ...(statusMatch ? [{ status: statusMatch }] : []),
            { tags: { some: { tag: { name: contains } } } },
          ],
        },
      ],
    },
    take: 20,
    include: {
      client: { select: { displayName: true } },
      tags: { include: { tag: true } },
    },
  });

  const documents = await prisma.documentLink.findMany({
    where: {
      AND: [
        documentWhereForUser(user),
        {
          OR: [
            { title: contains },
            { notes: contains },
            { tags: { some: { tag: { name: contains } } } },
          ],
        },
      ],
    },
    take: 20,
    include: {
      client: { select: { displayName: true } },
      matter: { select: { title: true } },
      tags: { include: { tag: true } },
    },
  });

  return { clients, matters, documents };
}

export async function getActivityForUser(user: SessionUser, limit = 50) {
  if (isAdmin(user)) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  return getActivityLogsForAssignee(user, limit);
}
