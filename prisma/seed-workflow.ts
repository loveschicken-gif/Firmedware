import type { PrismaClient } from "@prisma/client";

const MATTER_STATUSES = [
  { name: "new_intake", labelEn: "New Intake", labelTh: "รับเรื่องใหม่", color: "#6366f1", sortOrder: 0, isDefault: true, isFinal: false },
  { name: "conflict_check", labelEn: "Conflict Check", labelTh: "ตรวจสอบผลประโยชน์ขัดกัน", color: "#8b5cf6", sortOrder: 1, isDefault: false, isFinal: false },
  { name: "open", labelEn: "Open", labelTh: "เปิดงาน", color: "#2563eb", sortOrder: 2, isDefault: false, isFinal: false },
  { name: "pending_client_docs", labelEn: "Pending Client Documents", labelTh: "รอเอกสารจากลูกความ", color: "#d97706", sortOrder: 3, isDefault: false, isFinal: false },
  { name: "drafting", labelEn: "Drafting", labelTh: "จัดทำเอกสาร", color: "#0891b2", sortOrder: 4, isDefault: false, isFinal: false },
  { name: "filed", labelEn: "Filed", labelTh: "ยื่นต่อศาลหรือหน่วยงานแล้ว", color: "#059669", sortOrder: 5, isDefault: false, isFinal: false },
  { name: "waiting", labelEn: "Waiting", labelTh: "รอศาลหรือหน่วยงาน", color: "#ca8a04", sortOrder: 6, isDefault: false, isFinal: false },
  { name: "negotiation", labelEn: "Negotiation", labelTh: "เจรจา", color: "#7c3aed", sortOrder: 7, isDefault: false, isFinal: false },
  { name: "closed", labelEn: "Closed", labelTh: "ปิดงาน", color: "#64748b", sortOrder: 8, isDefault: false, isFinal: true },
  { name: "archived", labelEn: "Archived", labelTh: "เก็บถาวร", color: "#475569", sortOrder: 9, isDefault: false, isFinal: true },
] as const;

const CONTRACT_STATUSES = [
  { name: "intake", labelEn: "Intake", labelTh: "รับเรื่อง", color: "#6366f1", sortOrder: 0, isDefault: true, isFinal: false },
  { name: "first_draft", labelEn: "First Draft", labelTh: "ร่างครั้งแรก", color: "#2563eb", sortOrder: 1, isDefault: false, isFinal: false },
  { name: "internal_review", labelEn: "Internal Review", labelTh: "ตรวจภายใน", color: "#0891b2", sortOrder: 2, isDefault: false, isFinal: false },
  { name: "sent_counterparty", labelEn: "Sent to Counterparty", labelTh: "ส่งให้อีกฝ่าย", color: "#7c3aed", sortOrder: 3, isDefault: false, isFinal: false },
  { name: "negotiation", labelEn: "Negotiation", labelTh: "เจรจา", color: "#d97706", sortOrder: 4, isDefault: false, isFinal: false },
  { name: "client_review", labelEn: "Client Review", labelTh: "รอลูกความตรวจ", color: "#ca8a04", sortOrder: 5, isDefault: false, isFinal: false },
  { name: "ready_to_sign", labelEn: "Ready to Sign", labelTh: "พร้อมลงนาม", color: "#059669", sortOrder: 6, isDefault: false, isFinal: false },
  { name: "signed", labelEn: "Signed", labelTh: "ลงนามแล้ว", color: "#16a34a", sortOrder: 7, isDefault: false, isFinal: true },
  { name: "expired", labelEn: "Expired", labelTh: "หมดอายุ", color: "#64748b", sortOrder: 8, isDefault: false, isFinal: true },
  { name: "terminated", labelEn: "Terminated", labelTh: "สิ้นสุดสัญญา", color: "#475569", sortOrder: 9, isDefault: false, isFinal: true },
] as const;

export async function seedWorkflowStatuses(prisma: PrismaClient) {
  const count = await prisma.workflowStatus.count();
  if (count > 0) {
    await backfillMatterStatusIds(prisma);
    return;
  }

  for (const s of MATTER_STATUSES) {
    await prisma.workflowStatus.create({
      data: { entityType: "MATTER", ...s },
    });
  }
  for (const s of CONTRACT_STATUSES) {
    await prisma.workflowStatus.create({
      data: { entityType: "CONTRACT", ...s },
    });
  }
  console.log("Seeded workflow statuses (MATTER + CONTRACT)");

  await backfillMatterStatusIds(prisma);
}

async function backfillMatterStatusIds(prisma: PrismaClient) {
  const open = await prisma.workflowStatus.findFirst({
    where: { entityType: "MATTER", name: "open" },
  });
  const pending = await prisma.workflowStatus.findFirst({
    where: { entityType: "MATTER", name: "pending_client_docs" },
  });
  const closed = await prisma.workflowStatus.findFirst({
    where: { entityType: "MATTER", name: "closed" },
  });
  const waiting = await prisma.workflowStatus.findFirst({
    where: { entityType: "MATTER", name: "waiting" },
  });

  const matters = await prisma.matter.findMany({
    where: { statusId: null },
    select: { id: true, status: true },
  });

  for (const m of matters) {
    let statusId = open?.id;
    if (m.status === "CLOSED") statusId = closed?.id ?? statusId;
    else if (m.status === "PENDING") statusId = pending?.id ?? statusId;
    else if (m.status === "ON_HOLD") statusId = waiting?.id ?? statusId;
    if (statusId) {
      await prisma.matter.update({
        where: { id: m.id },
        data: { statusId },
      });
    }
  }
}
