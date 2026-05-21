# Thailand jurisdiction pack / แพ็กเขตอำนาจไทย

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

Operational templates for Thai law firms adapting Firmedware. **Not legal advice.** **Thailand-focused workflow notes are operational templates only**—review and adapt with qualified Thai legal professionals before use with real client or matter data.

**ภาษาไทย:** เทมเพลตปฏิบัติการสำหรับสำนักงานกฎหมายไทย **ไม่ใช่คำแนะนำทางกฎหมาย** หมายเหตุไทยเป็นเทมเพลตปฏิบัติการเท่านั้น — ให้ทนายความหรือผู้เชี่ยวชาญไทยทบทวนก่อนใช้กับข้อมูลจริง

Firmedware **records** (clients, matters, tasks, document links, activity logs) live in **PostgreSQL** on your firm’s deployment—not in GitHub. **Legal documents** stay in external storage (Google Drive, OneDrive, SharePoint, Dropbox, or a local shared folder). For production, deploy **one shared instance** and have all users sign in through the same URL. See the main README: [Code vs Data vs Documents](../../../README.md#code-vs-data-vs-documents), [How Multiple Users Access the Same Firm](../../../README.md#how-multiple-users-access-the-same-firm), [Shared firm deployment](../../SETUP_PLAYBOOK.md#shared-firm-deployment).

**ภาษาไทย:** **ข้อมูลในระบบ** (ลูกความ งาน/คดี งานย่อย ลิงก์เอกสาร บันทึกกิจกรรม) อยู่ใน **PostgreSQL** ของการติดตั้งสำนักงาน ไม่ได้อยู่ใน GitHub **เอกสารกฎหมาย** เก็บภายนอก (Google Drive, OneDrive, SharePoint, Dropbox หรือโฟลเดอร์ร่วม) ใช้งานจริงควรติดตั้ง **หนึ่ง instance ร่วมกัน** ผู้ใช้เข้า URL เดียวกัน ดู [Code vs Data vs Documents](../../../README.md#code-vs-data-vs-documents), [How Multiple Users Access the Same Firm](../../../README.md#how-multiple-users-access-the-same-firm), [การติดตั้งสำนักงานร่วมกัน](../../SETUP_PLAYBOOK.md#shared-firm-deployment)

## Contents / สารบัญ


| File                                           | Purpose                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| [matter-statuses.md](./matter-statuses.md)     | Bilingual matter workflow status suggestions                  |
| [document-taxonomy.md](./document-taxonomy.md) | Thai document categories (tags / titles)                      |
| [pdpa-checklist.md](./pdpa-checklist.md)       | PDPA-oriented operational checklist for metadata-only systems |
| [ai-use-policy.md](./ai-use-policy.md)         | AI use policy template for Thai firms                         |
| [closing-checklist.md](./closing-checklist.md) | Matter closing checklist template                             |


**ภาษาไทย (ตารางไฟล์):**


| ไฟล์                                           | วัตถุประสงค์                               |
| ---------------------------------------------- | ------------------------------------------ |
| [matter-statuses.md](./matter-statuses.md)     | สถานะ workflow งาน/คดี แบบสองภาษา          |
| [document-taxonomy.md](./document-taxonomy.md) | หมวดเอกสารไทย (แท็ก / ชื่อลิงก์)           |
| [pdpa-checklist.md](./pdpa-checklist.md)       | เช็กลิสต์ PDPA สำหรับระบบเก็บเฉพาะเมตาดาตา |
| [ai-use-policy.md](./ai-use-policy.md)         | เทมเพลตนโยบายการใช้ AI                     |
| [closing-checklist.md](./closing-checklist.md) | เช็กลิสต์ปิดงาน/คดี                        |


## How to use / วิธีใช้งาน

1. Review templates with a responsible lawyer or DPO.
2. Choose setup path: [SETUP_INDEX.md](../../SETUP_INDEX.md) or [START_HERE.md](../../START_HERE.md) — lawyers use [LAWYER_FIRM_SETUP.md](../../LAWYER_FIRM_SETUP.md) (no technical steps); IT uses [DEPLOY_GUIDE.md](../../DEPLOY_GUIDE.md).
3. Configure **Admin → Workflow statuses**, **tags**, and firm settings in Firmedware.
4. Align with [SETUP_PLAYBOOK.md](../../SETUP_PLAYBOOK.md) §§3–6 and [SECURITY.md](../../SECURITY.md).
5. Store approved firm policies outside the repo (internal wiki or policy folder).

**ภาษาไทย:**

1. ทบทวนเทมเพลตกับทนายความผู้รับผิดชอบหรือ DPO
2. เลือกเส้นทาง: [SETUP_INDEX.md](../../SETUP_INDEX.md) หรือ [START_HERE.md](../../START_HERE.md) — ทนายความใช้ [LAWYER_FIRM_SETUP.md](../../LAWYER_FIRM_SETUP.md) IT ใช้ [DEPLOY_GUIDE.md](../../DEPLOY_GUIDE.md)
3. ตั้งค่า **Admin → Workflow statuses**, **แท็ก** และการตั้งค่าสำนักงานใน Firmedware
4. ให้สอดคล้องกับ [SETUP_PLAYBOOK.md](../../SETUP_PLAYBOOK.md) §3–6 และ [SECURITY.md](../../SECURITY.md)
5. เก็บนโยบายที่อนุมัติแล้วนอก repo (วิกิภายในหรือโฟลเดอร์นโยบาย)

## Built-in seed alignment / การสอดคล้องกับ seed ใน repo

`prisma/seed-workflow.ts` seeds English/Thai matter statuses (e.g. รับเรื่องใหม่, ตรวจสอบผลประโยชน์ขัดกัน, ปิดงาน). Extend via admin UI or fork the seed file.

**ภาษาไทย:** `prisma/seed-workflow.ts` ใส่สถานะงาน/คดีภาษาอังกฤษ/ไทย (เช่น รับเรื่องใหม่, ตรวจสอบผลประโยชน์ขัดกัน, ปิดงาน) ขยายผ่าน UI แอดมินหรือ fork ไฟล์ seed

## Topics for firm playbooks (not legal citations) / หัวข้อสำหรับคู่มือภายใน (ไม่ใช่การอ้างอิงทางกฎหมาย)

Map these templates to your internal policies after review with qualified advisors. Use **official primary sources** only when citing law or regulator requirements. [Add official source] where your firm maintains the authoritative link.

- **Professional conduct and client confidentiality** — review applicable Thai lawyer conduct rules and confidentiality duties.
- **Personal data (PDPA)** — review collection, use, disclosure, security, retention, breach response, data subject rights, and processor/vendor management. Firmedware does not automate PDPA compliance.
- **Electronic records and signatures** — review applicable electronic transactions rules and transaction-specific formalities.
- **Tax, accounting, and court practice** — maintain separate checklists per matter type and forum.

**ภาษาไทย:** จับคู่เทมเพลตกับนโยบายภายในหลังทบทวนกับผู้เชี่ยวชาญที่เหมาะสม อ้างอิงกฎหมายเฉพาะจากแหล่งทางการเท่านั้น

- **จรรยาบรรณและความลับลูกความ** — ทบทวนข้อบังคับวิชาชีพและหน้าที่รักษาความลับ
- **ข้อมูลส่วนบุคคล (PDPA)** — ทบทวนข้อกำหนดการเก็บ ใช้ เปิดเผย ความปลอดภัย การเก็บรักษา การแจ้งเหตุ และสิทธิเจ้าของข้อมูล
- **บันทึกและลายมือชื่ออิเล็กทรอนิกส์** — ทบทวนกฎธุรกรรมทางอิเล็กทรอนิกส์และข้อกำหนดเฉพาะธุรกรรม
- **ภาษี บัญชี และขั้นตอนศาล** — ใช้เช็กลิสต์แยกตามประเภทงาน

Firmedware does not automate compliance.

**ภาษาไทย:** Firmedware ไม่ได้ทำให้การปฏิบัติตามกฎหมายเป็นอัตโนมัติ

## Disclaimer / ข้อจำกัดความรับผิดชอบ

Firmedware is not a Thai-law compliance product. Templates do not determine compliance with Thai law, Lawyers Council rules, PDPA, court rules, or tax rules.

**ภาษาไทย:** Firmedware ไม่ใช่ผลิตภัณฑ์รับรองการปฏิบัติตามกฎหมายไทย เทมเพลตไม่ได้กำหนดว่าสำนักงานปฏิบัติตามกฎหมายไทย ข้อบังคับสภาทนายความ PDPA กฎศาล หรือกฎภาษีหรือไม่