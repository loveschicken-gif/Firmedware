# Matter statuses (Thailand) / สถานะงาน/คดี (ไทย)

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`). Status tables are bilingual by design.

Suggested bilingual workflow statuses for Thai litigation, advisory, and transactional matters. Configure under **Admin → Workflow statuses** (`entityType: MATTER`).

**ภาษาไทย:** สถานะ workflow แบบสองภาษาสำหรับคดีความ ที่ปรึกษา และธุรกรรมในประเทศไทย ตั้งค่าที่ **Admin → Workflow statuses** (`entityType: MATTER`)

## Seeded in repo (reference) / ที่ seed ใน repo (อ้างอิง)

| name (slug) | English | Thai |
| --- | --- | --- |
| `new_intake` | New Intake | รับเรื่องใหม่ |
| `conflict_check` | Conflict Check | ตรวจสอบผลประโยชน์ขัดกัน |
| `open` | Open | เปิดงาน |
| `pending_client_docs` | Pending Client Documents | รอเอกสารจากลูกความ |
| `drafting` | Drafting | จัดทำเอกสาร |
| `filed` | Filed | ยื่นต่อศาลหรือหน่วยงานแล้ว |
| `waiting` | Waiting | รอศาลหรือหน่วยงาน |
| `negotiation` | Negotiation | เจรจา |
| `closed` | Closed | ปิดงาน |
| `archived` | Archived | เก็บถาวร |

Source: [`prisma/seed-workflow.ts`](../../../prisma/seed-workflow.ts)

**ภาษาไทย:** แหล่งข้อมูล: [`prisma/seed-workflow.ts`](../../../prisma/seed-workflow.ts)

## Optional extensions / การขยายเพิ่มเติม (ถ้าต้องการ)

Add via admin if your practice needs finer stages:

**ภาษาไทย:** เพิ่มผ่านแอดมินหากสำนักงานต้องการขั้นตอนละเอียดขึ้น

| Suggested Thai label | Suggested English | Notes |
| --- | --- | --- |
| เปิดแฟ้มงาน | Open file | After conflict cleared |
| ตรวจเอกสารภายใน | Internal review | Drafting QA |
| ส่งให้ลูกความตรวจ | Sent to client for review | |
| ส่งให้อีกฝ่าย | Sent to counterparty | Contract / negotiation |
| อยู่ระหว่างเจรจา | In negotiation | May overlap `negotiation` |
| รอลงนาม | Awaiting signature | |

Mark `isFinal: true` only for statuses that should block routine edits (e.g. ปิดงาน, เก็บถาวร).

**ภาษาไทย:** ตั้ง `isFinal: true` เฉพาะสถานะที่ควรหยุดการแก้ไขปกติ (เช่น ปิดงาน, เก็บถาวร)

## Practice-area hints / คำแนะนำตามสายงาน

| Practice | Often-used statuses |
| --- | --- |
| Litigation | conflict_check → open → drafting → filed → waiting → closed |
| Contract | new_intake → drafting → negotiation → closed |
| Corporate registration | pending_client_docs → drafting → filed → closed |

**ภาษาไทย (ตารางสายงาน):**

| สายงาน | สถานะที่มักใช้ |
| --- | --- |
| คดีความ | conflict_check → open → drafting → filed → waiting → closed |
| สัญญา | new_intake → drafting → negotiation → closed |
| จดทะเบียนนิติบุคคล | pending_client_docs → drafting → filed → closed |

Firm lawyers should define escalation rules (e.g. when to move from รอเอกสารจากลูกความ to เปิดแฟ้มงาน).

**ภาษาไทย:** ทนายความในสำนักงานควรกำหนดกฎการเลื่อนสถานะ (เช่น เมื่อไหร่จะย้ายจาก รอเอกสารจากลูกความ ไป เปิดแฟ้มงาน)
