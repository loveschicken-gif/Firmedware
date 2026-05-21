import { z } from "zod";

export const tagIdsSchema = z.array(z.string()).optional();

export function parseTagIds(formData: FormData): string[] {
  const raw = formData.getAll("tagIds");
  return raw.filter((v): v is string => typeof v === "string" && v.length > 0);
}

export function parseAssigneeIds(formData: FormData): string[] {
  const raw = formData.getAll("assigneeIds");
  return raw.filter((v): v is string => typeof v === "string" && v.length > 0);
}

export function parseGroupIds(formData: FormData): string[] {
  const raw = formData.getAll("groupIds");
  return raw.filter((v): v is string => typeof v === "string" && v.length > 0);
}

export type GroupAssignmentInput = {
  groupId: string;
  label: string;
  directoryPath: string | null;
};

export function parseGroupAssignments(
  formData: FormData,
  groupIds: string[],
  groupNameById: Map<string, string>
): GroupAssignmentInput[] {
  return groupIds.map((groupId) => {
    const label =
      (formData.get(`groupLabel_${groupId}`) as string)?.trim() ||
      groupNameById.get(groupId) ||
      "Team";
    const directoryPath =
      (formData.get(`groupDirectory_${groupId}`) as string)?.trim() || null;
    return { groupId, label, directoryPath };
  });
}
