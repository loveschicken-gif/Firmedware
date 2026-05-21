import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/rbac";
import { isAdmin, matterAccessForUser } from "@/lib/rbac";
import { notDeleted } from "@/lib/soft-delete";

const matterDetailInclude = {
  client: true,
  workflowStatus: true,
  tags: { include: { tag: true } },
  assignments: { include: { user: { select: { name: true, role: true } } } },
  groupAssignments: {
    include: { group: { select: { name: true } } },
  },
  documentLinks: {
    where: notDeleted,
    orderBy: { updatedAt: "desc" as const },
  },
  tasks: {
    where: notDeleted,
    orderBy: { dueAt: "asc" as const },
  },
};

export async function getMatterForUser(user: SessionUser, matterId: string) {
  if (isAdmin(user)) {
    return prisma.matter.findFirst({
      where: { id: matterId, ...notDeleted },
      include: matterDetailInclude,
    });
  }

  return prisma.matter.findFirst({
    where: {
      id: matterId,
      ...matterAccessForUser(user.id),
    },
    include: matterDetailInclude,
  });
}
