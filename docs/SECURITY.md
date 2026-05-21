# Firmedware security model / โมเดลความปลอดภัย Firmedware

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

Firmedware v1.2 is a **single-tenant** law firm tracker. It stores **metadata and document references** only: external URLs, local/manual paths, and manual references (paper/archive labels). The database model remains `DocumentLink` for compatibility.

**ภาษาไทย:** Firmedware v1.2 เป็นระบบติดตามงานของสำนักกฎหมายแบบ **เทนแนนต์เดียว** เก็บเฉพาะ **ข้อมูลเมตาดาตา** และการอ้างอิงเอกสาร (URL ภายนอก, path ในเครื่อง, ข้อมูลอ้างอิง manual) โมเดลในฐานข้อมูลยังชื่อ `DocumentLink`

For lawyer-led workflow framing, deployment modes, and the minimum production checklist, see the README: [Law firm operations and production readiness](../README.md#law-firm-operations-and-production-readiness). Framework references in the README are orientation only; Firmedware is not SOC 2, ISO/IEC 27001, or PDPA compliant by default. See [Source and citation policy](./README.md#source-and-citation-policy).

**ภาษาไทย:** ดู README สำหรับกรอบงานและ checklist การใช้งานจริง การอ้างอิงกรอบงานเป็นการชี้ทิศทางเท่านั้น Firmedware ไม่ได้รับการรับรอง SOC 2, ISO/IEC 27001 หรือ PDPA โดยอัตโนมัติ ดู [นโยบายแหล่งอ้างอิง](./README.md#source-and-citation-policy)

## What Firmedware does not do / สิ่งที่ Firmedware ไม่ทำ

Firmedware does not:

**ภาษาไทย:** Firmedware ไม่ได้ทำสิ่งต่อไปนี้:

- Provide legal advice
  - **ภาษาไทย:** ให้คำปรึกษากฎหมาย
- Replace lawyer supervision
  - **ภาษาไทย:** แทนที่การกำกับดูแลของทนายความ
- Replace professional judgment
  - **ภาษาไทย:** แทนที่วิจารณญาณวิชาชีพ
- Replace document management systems
  - **ภาษาไทย:** แทนที่ระบบจัดการเอกสาร (DMS)
- Replace accounting software
  - **ภาษาไทย:** แทนที่ซอฟต์แวร์บัญชี
- Replace cybersecurity review
  - **ภาษาไทย:** แทนที่การตรวจสอบความปลอดภัยทางไซเบอร์
- Replace SOC 2 or ISO/IEC 27001 certification
  - **ภาษาไทย:** แทนที่การรับรอง SOC 2 หรือ ISO/IEC 27001
- Control permissions inside Google Drive, OneDrive, SharePoint, Dropbox, or local folders
  - **ภาษาไทย:** ควบคุมสิทธิ์ภายใน Google Drive, OneDrive, SharePoint, Dropbox หรือโฟลเดอร์ในเครื่อง
- Verify whether external document links are properly restricted
  - **ภาษาไทย:** ตรวจสอบว่าลิงก์เอกสารภายนอกถูกจำกัดสิทธิ์อย่างเหมาะสมหรือไม่
- Automatically detect conflicts of interest
  - **ภาษาไทย:** ตรวจจับความขัดแย้งทางผลประโยชน์โดยอัตโนมัติ
- Automatically calculate court deadlines
  - **ภาษาไทย:** คำนวณกำหนดศาลโดยอัตโนมัติ
- Automatically preserve records for litigation hold
  - **ภาษาไทย:** เก็บรักษาเอกสารสำหรับ litigation hold โดยอัตโนมัติ
- Automatically classify privileged documents
  - **ภาษาไทย:** จัดประเภทเอกสารที่มีสิทธิ์ไม่เปิดเผย (privileged) โดยอัตโนมัติ
- Automatically prevent users from copying external links
  - **ภาษาไทย:** ป้องกันผู้ใช้คัดลอกลิงก์ภายนอกโดยอัตโนมัติ
- Store PDFs, Word files, or email bodies (by default)
  - **ภาษาไทย:** เก็บไฟล์ PDF, Word หรือเนื้อหาอีเมล (ค่าเริ่มต้นไม่เก็บ)
- Fetch or proxy document content from external providers
  - **ภาษาไทย:** ดึงหรือ proxy เนื้อหาเอกสารจากผู้ให้บริการภายนอก
- Read, validate existence of, or index local file paths stored as references
  - **ภาษาไทย:** อ่าน ตรวจว่า path มีจริง หรือ index เนื้อหาโฟลเดอร์จาก path ที่บันทึกไว้
- Run AI on client or matter data (gateway stubs only; no provider execution)
  - **ภาษาไทย:** รัน AI บนข้อมูลลูกความหรืองาน/คดี (มีเฉพาะ stub เกตเวย์ ไม่มีการเรียกผู้ให้บริการจริง)

Document links open in the user’s browser using **their** session with the external provider. Permissions are enforced **outside** Firmedware.

**ภาษาไทย:** ลิงก์เอกสารเปิดในเบราว์เซอร์ของผู้ใช้โดยใช้ **เซสชันของผู้ใช้** กับผู้ให้บริการภายนอก สิทธิ์ถูกบังคับใช้ **นอก** Firmedware

## Repository Safety / ความปลอดภัยของ Repository

The GitHub repository should contain code and documentation only. It should not contain confidential firm data, database dumps, exported CSV files, document links, real legal documents, screenshots of client data, environment variables, or secrets.

**ภาษาไทย:** Repository บน GitHub ควรมีเฉพาะโค้ดและเอกสารประกอบ ไม่ควรมีข้อมูลลับของสำนัก ไฟล์ dump ฐานข้อมูล CSV ที่ export ลิงก์เอกสาร เอกสารกฎหมายจริง ภาพหน้าจอข้อมูลลูกความ ตัวแปรสภาพแวดล้อม หรือ secrets

Anyone forking Firmedware should review `.gitignore` and avoid committing sensitive data.

**ภาษาไทย:** ผู้ที่ fork Firmedware ควรตรวจ `.gitignore` และหลีกเลี่ยงการ commit ข้อมูลที่ละเอียดอ่อน

See also the README: [Do Not Commit Secrets or Firm Data](../README.md#do-not-commit-secrets-or-firm-data).

**ภาษาไทย:** ดูเพิ่มใน README: [Do Not Commit Secrets or Firm Data](../README.md#do-not-commit-secrets-or-firm-data)

## Metadata sensitivity / ความอ่อนไหวของข้อมูลเมตาดาตา

Firmedware does not store document contents by default, but metadata can still be sensitive.

**ภาษาไทย:** Firmedware ไม่เก็บเนื้อหาเอกสารตามค่าเริ่มต้น แต่ข้อมูลเมตาดาตายังอาจละเอียดอ่อนได้

Examples of sensitive metadata include:

**ภาษาไทย:** ตัวอย่างข้อมูลเมตาดาตาที่ละเอียดอ่อน ได้แก่:

- Client names
  - **ภาษาไทย:** ชื่อลูกความ
- Matter titles
  - **ภาษาไทย:** ชื่องาน/คดี
- Case numbers
  - **ภาษาไทย:** เลขคดี
- Opposing party names
  - **ภาษาไทย:** ชื่อคู่ความ
- Document titles
  - **ภาษาไทย:** ชื่อเอกสาร
- Deadline descriptions
  - **ภาษาไทย:** คำอธิบายกำหนดเวลา
- Task notes
  - **ภาษาไทย:** หมายเหตุงาน (task)
- External folder names
  - **ภาษาไทย:** ชื่อโฟลเดอร์ภายนอก
- External document URLs
  - **ภาษาไทย:** URL เอกสารภายนอก
- Activity history
  - **ภาษาไทย:** ประวัติบันทึกกิจกรรม

Firms should not assume that metadata-only systems are low risk. Access control, logging, backup protection, and confidentiality policies still matter.

**ภาษาไทย:** สำนักไม่ควรสมมติว่าระบบที่เก็บเฉพาะข้อมูลเมตาดาตามีความเสี่ยงต่ำ การควบคุมการเข้าถึง การบันทึก log การป้องกัน backup และนโยบายความลับยังสำคัญ

## Privilege and confidentiality warning / คำเตือนเรื่องสิทธิ์ไม่เปิดเผยและความลับ

Firmedware may contain metadata related to privileged or confidential legal matters, even if it does not store document files.

**ภาษาไทย:** Firmedware อาจมีข้อมูลเมตาดาตาที่เกี่ยวกับเรื่องกฎหมายที่มีสิทธิ์ไม่เปิดเผยหรือเป็นความลับ แม้จะไม่เก็บไฟล์เอกสาร

Matter names, client names, notes, task descriptions, document titles, deadlines, and external links may reveal sensitive information.

**ภาษาไทย:** ชื่องาน/คดี ชื่อลูกความ หมายเหตุ คำอธิบายงาน ชื่อเอกสาร กำหนดเวลา และลิงก์ภายนอกอาจเปิดเผยข้อมูลที่ละเอียดอ่อน

Firms should treat Firmedware data as confidential legal operations data and limit access accordingly.

**ภาษาไทย:** สำนักควรถือข้อมูลใน Firmedware เป็นข้อมูลการดำเนินงานกฎหมายที่เป็นความลับ และจำกัดการเข้าถึงให้เหมาะสม

## Basic threat model / โมเดลภัยคุกคามพื้นฐาน

Firmedware is designed to reduce common operational risks in small law firm workflows, but it does not remove all security risks.

**ภาษาไทย:** Firmedware ออกแบบมาเพื่อลดความเสี่ยงในการดำเนินงานของสำนักขนาดเล็ก แต่ไม่ได้ขจัดความเสี่ยงด้านความปลอดภัยทั้งหมด

### Primary risks / ความเสี่ยงหลัก

- Unauthorized user access
  - **ภาษาไทย:** การเข้าถึงโดยผู้ใช้ที่ไม่ได้รับอนุญาต
- Weak or shared passwords
  - **ภาษาไทย:** รหัสผ่านอ่อนหรือใช้ร่วมกัน
- Overly broad Google Drive, OneDrive, SharePoint, Dropbox, or local folder permissions
  - **ภาษาไทย:** สิทธิ์ Google Drive, OneDrive, SharePoint, Dropbox หรือโฟลเดอร์ในเครื่องกว้างเกินไป
- Leaked external document links
  - **ภาษาไทย:** ลิงก์เอกสารภายนอกรั่วไหล
- Lost or compromised staff devices
  - **ภาษาไทย:** อุปกรณ์พนักงานสูญหายหรือถูกเจาะ
- Unreviewed user roles after staff departure
  - **ภาษาไทย:** ไม่ทบทวนบทบาทผู้ใช้หลังพนักงานลาออก
- Accidental export of activity logs or matter data
  - **ภาษาไทย:** export บันทึกกิจกรรมหรือข้อมูลงาน/คดีโดยไม่ตั้งใจ
- Misuse of AI tools with confidential or privileged information
  - **ภาษาไทย:** ใช้เครื่องมือ AI กับข้อมูลลับหรือที่มีสิทธิ์ไม่เปิดเผย
- Unencrypted or untested backups
  - **ภาษาไทย:** backup ไม่เข้ารหัสหรือไม่เคยทดสอบกู้คืน
- Deployment without HTTPS, VPN, or IP restrictions
  - **ภาษาไทย:** deploy โดยไม่มี HTTPS, VPN หรือจำกัด IP

### Risk mapping (examples) / การแมปความเสี่ยง (ตัวอย่าง)

| Risk | Firmedware control | Firm responsibility |
| --- | --- | --- |
| Unauthorized access | RBAC, matter-scoped visibility, user deactivation | Role review, offboarding, least privilege |
| Weak passwords | bcrypt hashing, login lockout | Strong password policy, MFA at proxy |
| Broad DMS permissions | Permission confirmation checkbox on save | ACL review in Google/Microsoft/Dropbox |
| Leaked document links | Metadata-only storage; no link validation | Link sharing policy, periodic permission audit |
| Staff departure | Deactivate user; assignments retained in history | Remove DMS access; reassign matters |
| Accidental export | Activity export logged (`SECURITY` category) | Who may export; review export events |
| AI misuse | No AI in core | Written AI policy; block public tools for client data |
| Backup failure | Soft delete preserves records | Encrypted backups, restore testing |
| Insecure deployment | Session auth, no document proxy | HTTPS, VPN/IP allowlist, private Postgres |

**ภาษาไทย (สรุป):**

- **การเข้าถึงโดยไม่ได้รับอนุญาต** — Firmedware: RBAC, การมองเห็นตามงาน/คดี, ปิดการใช้งานผู้ใช้ | สำนัก: ทบทวนบทบาท, offboarding, least privilege
- **รหัสผ่านอ่อน** — Firmedware: bcrypt, login lockout | สำนัก: นโยบายรหัสผ่านแข็งแรง, MFA ที่ proxy
- **สิทธิ์ DMS กว้างเกินไป** — Firmedware: checkbox ยืนยันสิทธิ์ตอนบันทึก | สำนัก: ทบทวน ACL ใน Google/Microsoft/Dropbox
- **ลิงก์เอกสารรั่ว** — Firmedware: เก็บเฉพาะข้อมูลเมตาดาตา, ไม่ตรวจลิงก์ | สำนัก: นโยบายแชร์ลิงก์, audit สิทธิ์เป็นระยะ
- **พนักงานลาออก** — Firmedware: ปิดใช้งานผู้ใช้, ประวัติการมอบหมายคงอยู่ | สำนัก: ถอนสิทธิ์ DMS, มอบหมายงาน/คดีใหม่
- **export โดยไม่ตั้งใจ** — Firmedware: บันทึก export ในหมวด `SECURITY` | สำนัก: กำหนดผู้ export ได้, ทบทวนเหตุการณ์
- **ใช้ AI ผิดวิธี** — Firmedware: ไม่มี AI ในแกนหลัก | สำนัก: นโยบาย AI เป็นลายลักษณ์, บล็อกเครื่องมือสาธารณะสำหรับข้อมูลลูกความ
- **backup ล้มเหลว** — Firmedware: ลบแบบ soft เก็บระเบียน | สำนัก: backup เข้ารหัส, ทดสอบกู้คืน
- **deploy ไม่ปลอดภัย** — Firmedware: session auth, ไม่ proxy เอกสาร | สำนัก: HTTPS, VPN/IP allowlist, Postgres ส่วนตัว

Firmedware’s controls should be combined with firm-level policies and secure deployment practices. See [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §3–4.

**ภาษาไทย:** มาตรการของ Firmedware ควรใช้ร่วมกับนโยบายระดับสำนักและการ deploy ที่ปลอดภัย ดู [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §3–4

## Data retention and deletion / การเก็บรักษาและการลบข้อมูล

Firmedware uses soft delete/archive behavior for core records. This helps preserve auditability and reduce accidental data loss.

**ภาษาไทย:** Firmedware ใช้การลบแบบ soft / archive สำหรับระเบียนหลัก เพื่อรักษาความสามารถในการ audit และลดการสูญหายของข้อมูลโดยไม่ตั้งใจ

Implemented in schema: `deletedAt` (and related audit fields) on `Client`, `Matter`, `DocumentLink`, `Task`, `Tag`, and `UserGroup`. User accounts use `active` deactivation rather than routine hard delete.

**ภาษาไทย:** ใน schema มี `deletedAt` (และฟิลด์ audit ที่เกี่ยวข้อง) บน `Client`, `Matter`, `DocumentLink`, `Task`, `Tag`, และ `UserGroup` บัญชีผู้ใช้ใช้การปิด `active` แทนการ hard delete เป็นปกติ

Each firm should define its own retention policy for:

**ภาษาไทย:** แต่ละสำนักควรกำหนดนโยบายเก็บรักษาของตนเองสำหรับ:

- Client records
  - **ภาษาไทย:** ระเบียนลูกความ
- Matter records
  - **ภาษาไทย:** ระเบียนงาน/คดี
- Document links
  - **ภาษาไทย:** ลิงก์เอกสาร
- Task history
  - **ภาษาไทย:** ประวัติงาน (task)
- Activity logs
  - **ภาษาไทย:** บันทึกกิจกรรม
- User accounts
  - **ภาษาไทย:** บัญชีผู้ใช้
- Exported CSV files
  - **ภาษาไทย:** ไฟล์ CSV ที่ export
- Database backups
  - **ภาษาไทย:** backup ฐานข้อมูล

Firmedware does not decide how long legal records should be retained. Retention periods may depend on the firm’s jurisdiction, professional responsibility duties, client agreements, limitation periods, tax rules, and internal policy.

**ภาษาไทย:** Firmedware ไม่ได้กำหนดระยะเวลาเก็บเอกสารกฎหมาย ระยะเวลาอาจขึ้นกับเขตอำนาจ หน้าที่วิชาชีพ สัญญาลูกความ อายุความ กฎภาษี และนโยบายภายใน

**Recommended practice:**

**ภาษาไทย:** **แนวทางที่แนะนำ:**

- Do not hard-delete client or matter records during ordinary use.
  - **ภาษาไทย:** อย่า hard-delete ระเบียนลูกความหรืองาน/คดีในการใช้งานปกติ
- Review archived records periodically.
  - **ภาษาไทย:** ทบทวนระเบียนที่ archive เป็นระยะ
- Restrict access to old matters.
  - **ภาษาไทย:** จำกัดการเข้าถึงงาน/คดีเก่า
- Keep backup retention periods documented.
  - **ภาษาไทย:** บันทึกระยะเวลาเก็บ backup เป็นลายลักษณ์
- Test restoration from backup before relying on the system in production.
  - **ภาษาไทย:** ทดสอบกู้คืนจาก backup ก่อนใช้ระบบจริงใน production

Activity logs are append-only (PostgreSQL triggers block UPDATE/DELETE). Log retention duration is a **firm policy**, not enforced by the application.

**ภาษาไทย:** บันทึกกิจกรรมเป็นแบบ append-only (trigger ของ PostgreSQL บล็อก UPDATE/DELETE) ระยะเวลาเก็บ log เป็น **นโยบายของสำนัก** แอปไม่บังคับ

## AI connector governance / การกำกับดูแล AI connectors

**v1.2 includes an AI Connector Gateway stub only** (`src/lib/ai/`, `/api/ai/*`, `/admin/ai-connectors`). Connectors are **disabled by default**; no provider HTTP calls or API keys in the database. Future AI integrations should not be enabled until the firm has answered:

**ภาษาไทย:** **แกนหลัก v1.2 ไม่มี AI connectors** การเชื่อม AI ในอนาคตไม่ควรเปิดจนกว่าสำนักจะตอบคำถามต่อไปนี้:

- What AI provider will be used?
  - **ภาษาไทย:** จะใช้ผู้ให้บริการ AI ใด?
- Will data be sent to a third party?
  - **ภาษาไทย:** ข้อมูลจะส่งให้บุคคลที่สามหรือไม่?
- Are prompts and outputs retained by the provider?
  - **ภาษาไทย:** ผู้ให้บริการเก็บ prompt และผลลัพธ์หรือไม่?
- Is client confidential information allowed?
  - **ภาษาไทย:** อนุญาตข้อมูลลับของลูกความหรือไม่?
- Is privileged information allowed?
  - **ภาษาไทย:** อนุญาตข้อมูลที่มีสิทธิ์ไม่เปิดเผยหรือไม่?
- Is client consent required?
  - **ภาษาไทย:** ต้องได้ความยินยอมจากลูกความหรือไม่?
- Who may use the connector?
  - **ภาษาไทย:** ใครใช้ connector ได้บ้าง?
- Which matters are excluded?
  - **ภาษาไทย:** งาน/คดีใดยกเว้น?
- Are prompts logged?
  - **ภาษาไทย:** บันทึก prompt หรือไม่?
- Are outputs logged?
  - **ภาษาไทย:** บันทึกผลลัพธ์หรือไม่?
- Who reviews AI outputs before client use?
  - **ภาษาไทย:** ใครทบทวนผลลัพธ์ AI ก่อนใช้กับลูกความ?
- Can the AI connector access external document links?
  - **ภาษาไทย:** connector เข้าถึงลิงก์เอกสารภายนอกได้หรือไม่?
- Can the AI connector modify records?
  - **ภาษาไทย:** connector แก้ไขระเบียนได้หรือไม่?
- Can the AI connector export data?
  - **ภาษาไทย:** connector export ข้อมูลได้หรือไม่?

**Default position:** AI connectors should be disabled unless a firm has adopted a written AI use policy. Any fork adding AI must not ship with connectors enabled by default.

**ภาษาไทย:** **ตำแหน่งเริ่มต้น:** ควรปิด AI connectors จนกว่าสำนักจะมีนโยบายการใช้ AI เป็นลายลักษณ์ fork ที่เพิ่ม AI ต้องไม่ส่งมาพร้อม connector เปิดเป็นค่าเริ่มต้น

## AI Connector Gateway / เกตเวย์ตัวเชื่อม AI

**Operational guide:** [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md) — admin setup, HTTP API (`/api/ai/capabilities`, `/api/ai/policy-check`), integration sequence, environment variables, fork connector pattern.

Firmedware does not include working AI execution in core. The gateway provides **types**, a **conservative policy engine** (`evaluateAIConnectorPolicy`), **redaction heuristics** (advisory only), a **provider registry** (all `enabled: false`), and **policy-check API routes** that never call OpenAI, Anthropic, Gemini, Perplexity, or local inference endpoints.

**ภาษาไทย:** แกนหลักไม่มีการรัน AI จริง ดู [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md) สำหรับการตั้งค่าและการเชื่อม API

**Warning / คำเตือน:** AI connectors must not automatically send client names, matter notes, privileged communications, document references, external links, local paths, or personal data to third-party providers.

**ภาษาไทย:** ตัวเชื่อม AI ต้องไม่ส่งชื่อลูกความ บันทึกคดี การสื่อสารที่มีสิทธิ์ไม่เปิดเผย การอ้างอิงเอกสาร ลิงก์ภายนอก พาธในเครื่อง หรือข้อมูลส่วนบุคคลไปยังผู้ให้บริการโดยอัตโนมัติ

| Provider | Notes |
|----------|--------|
| OpenAI / ChatGPT | API workflow/checklist or Custom GPT Actions — firm policy required |
| Anthropic Claude | Drafting/review via commercial API — firm policy required |
| Google Gemini | Workspace-adjacent firms; **do not fetch Drive** from Firmedware |
| Perplexity | Public web research only — not client-specific facts |
| Local models | Higher control; still requires security review |

**Credentials:** Store provider keys in `OPENAI_API_KEY`, etc. (environment or secret manager). **Never** store keys in `FirmSettings` or the repository.

**ภาษาไทย:** เก็บ key ในตัวแปรสภาพแวดล้อมหรือ secret manager ห้ามเก็บในฐานข้อมูลหรือ repo

**Activity logging:** Policy checks log metadata only (`AI_POLICY_CHECKED` via `metadata.kind`). Do not log full prompts, outputs, secrets, privileged text, or document bodies by default. Future kinds: `AI_REQUEST_BLOCKED`, `AI_CONNECTOR_ENABLED`, `AI_CONNECTOR_DISABLED`, `AI_PROVIDER_CHANGED`, `AI_REQUEST_CREATED`, `AI_OUTPUT_GENERATED`.

Automated tests: `tests/ai-gateway.test.ts` (AI-GW-001 … AI-GW-012).

## Minimum production checklist / รายการตรวจสอบขั้นต่ำก่อน production

Before using Firmedware with real client or matter information:

**ภาษาไทย:** ก่อนใช้ Firmedware กับข้อมูลลูกความหรืองาน/คดีจริง:

- [ ] Change the seeded admin password.
  - [ ] เปลี่ยนรหัสผ่าน admin ที่ seed ไว้
- [ ] Use a strong `AUTH_SECRET`.
  - [ ] ใช้ `AUTH_SECRET` ที่แข็งแรง
- [ ] Deploy over HTTPS.
  - [ ] deploy ผ่าน HTTPS
- [ ] Restrict access by VPN, firewall, or IP allowlist where possible.
  - [ ] จำกัดการเข้าถึงด้วย VPN, firewall หรือ IP allowlist เท่าที่ทำได้
- [ ] Review all user roles.
  - [ ] ทบทวนบทบาทผู้ใช้ทั้งหมด
- [ ] Disable inactive users.
  - [ ] ปิดการใช้งานผู้ใช้ที่ไม่ active
- [ ] Configure database backups.
  - [ ] ตั้งค่า backup ฐานข้อมูล
- [ ] Encrypt backups where possible.
  - [ ] เข้ารหัส backup เท่าที่ทำได้
- [ ] Test backup restoration.
  - [ ] ทดสอบกู้คืนจาก backup
- [ ] Review external document permissions.
  - [ ] ทบทวนสิทธิ์เอกสารภายนอก
- [ ] Avoid “anyone with the link” document sharing unless approved.
  - [ ] หลีกเลี่ยงการแชร์แบบ “anyone with the link” เว้นแต่อนุมัติ
- [ ] Set a firm AI usage policy.
  - [ ] กำหนดนโยบายการใช้ AI ของสำนัก
- [ ] Set an offboarding process for departing staff.
  - [ ] กำหนดขั้นตอน offboarding เมื่อพนักงานลาออก
- [ ] Review activity logs periodically.
  - [ ] ทบทวนบันทึกกิจกรรมเป็นระยะ
- [ ] Document who is responsible for administration.
  - [ ] บันทึกว่าใครรับผิดชอบการดูแลระบบ

Step-by-step: [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §1–3 · [README checklist](../README.md#minimum-production-checklist).

**ภาษาไทย:** ขั้นตอนละเอียด: [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §1–3 · [README checklist](../README.md#minimum-production-checklist)

## Admin responsibilities / ความรับผิดชอบของผู้ดูแลระบบ

| Area | Responsibility |
|------|----------------|
| External DMS | Restrict folders/links in Google/Microsoft/Dropbox to authorized staff |
| Deployment | HTTPS, VPN or IP allowlist, encrypted Postgres backups |
| Authentication | Strong passwords; **2FA at reverse proxy** recommended (see [EXTENSIONS.md](./EXTENSIONS.md)) |
| Users | Create/deactivate accounts; limit Admin role |
| Security settings | `/admin/security` — notice, permission checkbox, login lockout |

**ภาษาไทย (สรุป):**

- **DMS ภายนอก** — จำกัดโฟลเดอร์/ลิงก์ใน Google/Microsoft/Dropbox ให้เฉพาะพนักงานที่ได้รับอนุญาต
- **Deployment** — HTTPS, VPN หรือ IP allowlist, backup Postgres ที่เข้ารหัส
- **การยืนยันตัวตน** — รหัสผ่านแข็งแรง; แนะนำ **2FA ที่ reverse proxy** (ดู [EXTENSIONS.md](./EXTENSIONS.md))
- **ผู้ใช้** — สร้าง/ปิดบัญชี; จำกัดบทบาท Admin
- **การตั้งค่าความปลอดภัย** — `/admin/security` — ข้อความแจ้ง, checkbox สิทธิ์, login lockout

## Audit trail (immutable) / บันทึก audit (แก้ไขไม่ได้)

- `ActivityLog` rows are **append-only** (PostgreSQL triggers block UPDATE/DELETE)
  - **ภาษาไทย:** แถว `ActivityLog` เป็น **append-only** (trigger ของ PostgreSQL บล็อก UPDATE/DELETE)
- Categories: `DATA`, `AUTH`, `SECURITY`, `ADMIN`, `DOCUMENT`
  - **ภาษาไทย:** หมวด: `DATA`, `AUTH`, `SECURITY`, `ADMIN`, `DOCUMENT`
- Actor name/email snapshot at log time
  - **ภาษาไทย:** snapshot ชื่อ/อีเมลผู้กระทำ ณ เวลาบันทึก
- Security events include: login success/failure, password changes, role changes, user deactivation, security setting updates, document link opened, external invoice link opened (billing), activity export
  - **ภาษาไทย:** เหตุการณ์ด้านความปลอดภัย ได้แก่ login สำเร็จ/ล้มเหลว, เปลี่ยนรหัสผ่าน, เปลี่ยนบทบาท, ปิดผู้ใช้, อัปเดตการตั้งค่าความปลอดภัย, เปิดลิงก์เอกสาร, เปิดลิงก์ใบแจ้งหนี้ภายนอก (billing), export บันทึกกิจกรรม
- Download CSV from Activity pages (same visibility rules as UI)
  - **ภาษาไทย:** ดาวน์โหลด CSV จากหน้า Activity (กฎการมองเห็นเดียวกับ UI)

## Confidentiality notice / ข้อความแจ้งความลับ

Shown after login and in the app shell (dismissible per browser session). Text is defined in locale files (`common.confidentiality.notice`). Controlled by `FirmSettings.confidentialityNoticeEnabled`.

**ภาษาไทย:** แสดงหลัง login และใน app shell (ปิดได้ต่อเซสชันเบราว์เซอร์) ข้อความอยู่ในไฟล์ locale (`common.confidentiality.notice`) ควบคุมด้วย `FirmSettings.confidentialityNoticeEnabled`

## Document links / ลิงก์เอกสาร

When **Require permission confirmation** is enabled (default), users must check a box confirming external storage permissions are restricted before saving a link.

**ภาษาไทย:** เมื่อเปิด **Require permission confirmation** (ค่าเริ่มต้น) ผู้ใช้ต้องติ๊กยืนยันว่าสิทธิ์ที่เก็บภายนอกถูกจำกัดก่อนบันทึกลิงก์

## Login lockout / การล็อกบัญชีเมื่อ login ล้มเหลว

After repeated failed attempts (configurable in Security settings), the account is temporarily blocked. Successful login resets the counter.

**ภาษาไทย:** หลังพยายาม login ล้มเหลวซ้ำ (ตั้งค่าได้ใน Security settings) บัญชีจะถูกบล็อกชั่วคราว login สำเร็จจะรีเซ็ตตัวนับ

## User security fields / ฟิลด์ความปลอดภัยของผู้ใช้

`lastLoginAt`, `lastFailedLoginAt`, `failedLoginCount`, `passwordChangedAt` — for admin review and lockout logic.

**ภาษาไทย:** `lastLoginAt`, `lastFailedLoginAt`, `failedLoginCount`, `passwordChangedAt` — สำหรับผู้ดูแลระบบทบทวนและตรรกะ lockout

## Document sensitivity / ระดับความอ่อนไหวของเอกสาร

Optional label on each link: Normal, Confidential, Highly confidential, Privileged. Display only; does not change external permissions.

**ภาษาไทย:** ป้ายกำกับตัวเลือกต่อลิงก์: Normal, Confidential, Highly confidential, Privileged แสดงผลเท่านั้น ไม่เปลี่ยนสิทธิ์ภายนอก

## Billing module (optional) / โมดูล billing (ตัวเลือก)

When `FirmSettings.enableBilling` is on:

**ภาษาไทย:** เมื่อเปิด `FirmSettings.enableBilling`:

- Stores invoice metadata (title, amount, currency, dates, status) and optional external invoice URL
  - **ภาษาไทย:** เก็บข้อมูลเมตาดาตาใบแจ้งหนี้ (ชื่อ, จำนวน, สกุลเงิน, วันที่, สถานะ) และ URL ใบแจ้งหนี้ภายนอก (ถ้ามี)
- Does **not** store payment card data, bank credentials, or ledger entries
  - **ภาษาไทย:** **ไม่** เก็บข้อมูลบัตรชำระเงิน ข้อมูลธนาคาร หรือรายการบัญชีแยกประเภท
- External invoice links open in the user’s browser (same model as document links); opens are logged
  - **ภาษาไทย:** ลิงก์ใบแจ้งหนี้ภายนอกเปิดในเบราว์เซอร์ของผู้ใช้ (แบบเดียวกับลิงก์เอกสาร); การเปิดถูกบันทึก
- **Admin** may archive billing records; Lawyer/Staff may create/update on matters they can access; **Viewer** is read-only
  - **ภาษาไทย:** **Admin** archive ระเบียน billing ได้; Lawyer/Staff สร้าง/อัปเดตในงาน/คดีที่เข้าถึงได้; **Viewer** อ่านอย่างเดียว
- Activity: create, update, status change, archive, view, external link opened
  - **ภาษาไทย:** บันทึกกิจกรรม: สร้าง, อัปเดต, เปลี่ยนสถานะ, archive, ดู, เปิดลิงก์ภายนอก

## Recommended production controls / มาตรการ production ที่แนะนำ

1. TLS termination (reverse proxy)
   - **ภาษาไทย:** TLS termination (reverse proxy)
2. MFA in front of the app (Authelia, Cloudflare Access, Azure AD proxy, etc.)
   - **ภาษาไทย:** MFA หน้าแอป (Authelia, Cloudflare Access, Azure AD proxy ฯลฯ)
3. Private network or IP allowlist for self-hosted instances
   - **ภาษาไทย:** เครือข่ายส่วนตัวหรือ IP allowlist สำหรับ self-hosted
4. Encrypted backups of PostgreSQL
   - **ภาษาไทย:** backup PostgreSQL ที่เข้ารหัส
5. Rate limiting at the proxy
   - **ภาษาไทย:** rate limiting ที่ proxy
6. Rotate `AUTH_SECRET` and database credentials
   - **ภาษาไทย:** หมุนเวียน `AUTH_SECRET` และ credentials ฐานข้อมูล
7. Remove `SEED_ADMIN_PASSWORD` after bootstrap
   - **ภาษาไทย:** ลบ `SEED_ADMIN_PASSWORD` หลัง bootstrap

See also [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §3.

**ภาษาไทย:** ดูเพิ่ม [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §3
