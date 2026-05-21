# AI use policy template (Thailand) / เทมเพลตนโยบายการใช้ AI (ไทย)

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`). Checklist items: English line, then indented Thai.

Firm-internal policy draft for lawyers and staff. **Not legal advice.** Adapt and approve before use.

**ภาษาไทย:** ร่างนโยบายภายในสำนักงานสำหรับทนายความและเจ้าหน้าที่ **ไม่ใช่คำแนะนำทางกฎหมาย** ปรับและอนุมัติก่อนใช้งาน

## Purpose / วัตถุประสงค์

Define whether and how staff may use AI tools (ChatGPT, Claude, Gemini, Copilot, Thai legal research bots, etc.) in connection with firm work, especially where **client confidential information**, **privileged communications**, or **PDPA personal data** are involved.

**ภาษาไทย:** กำหนดว่าพนักงานใช้เครื่องมือ AI (ChatGPT, Claude, Gemini, Copilot บอทค้นความกฎหมายไทย ฯลฯ) กับงานสำนักงานได้อย่างไร โดยเฉพาะเมื่อมี **ข้อมูลลับของลูกความ** **การสื่อสารที่ได้รับความคุ้มครอง** หรือ **ข้อมูลส่วนบุคคลตาม PDPA**

## Default position / หลักการเริ่มต้น

- **No** pasting client names, matter facts, draft pleadings, contracts, evidence descriptions, or document contents into **public** or **unapproved** AI services unless explicitly permitted.
- **No** autonomous legal advice to clients generated solely by AI without lawyer review.
- Firmedware v1.2 has **no AI connectors**; any future connector requires [AI connector governance](../../../README.md#ai-connector-governance-checklist).

**ภาษาไทย:**

- **ห้าม** วางชื่อลูกความ ข้อเท็จจริงคดี ร่างคำฟ้อง สัญญา คำอธิบายพยาน หรือเนื้อหาเอกสารลงบริการ AI **สาธารณะ** หรือที่ **ยังไม่อนุมัติ** เว้นแต่อนุญาตชัดเจน
- **ห้าม** ให้คำแนะนำทางกฎหมายแก่ลูกความโดย AI อย่างเดียวโดยไม่มีทนายความทบทวน
- Firmedware v1.2 **ไม่มีตัวเชื่อม AI** ตัวเชื่อมในอนาคตต้องผ่าน [AI connector governance](../../../README.md#ai-connector-governance-checklist)

## Permitted uses (examples—firm to customize) / การใช้ที่อนุญาต (ตัวอย่าง—ให้สำนักงานปรับ)

- [ ] Public-law research without client identifiers
  - [ ] ค้นความกฎหมายสาธารณะโดยไม่มีตัวระบุลูกความ
- [ ] Internal drafting assistance with **de-identified** facts only
  - [ ] ช่วยร่างภายในโดยใช้ข้อเท็จจริงที่ **ปิดบัตรตัวตน** เท่านั้น
- [ ] Approved enterprise AI with DPA, no training on firm data, logging enabled
  - [ ] AI องค์กรที่อนุมัติ มี DPA ไม่ฝึกจากข้อมูลสำนักงาน เปิดบันทึกการใช้งาน
- [ ] Translation of **non-confidential** materials
  - [ ] แปลเอกสารที่ **ไม่เป็นความลับ**

## Prohibited uses (examples) / การใช้ที่ห้าม (ตัวอย่าง)

- [ ] Uploading คำฟ้อง, สัญญา, พยานหลักฐาน, or client emails with identifiers
  - [ ] อัปโหลด คำฟ้อง สัญญา พยานหลักฐาน หรืออีเมลลูกความที่มีตัวระบุตัวตน
- [ ] Using consumer AI accounts for billable client work without approval
  - [ ] ใช้บัญชี AI สำหรับผู้บริโภคกับงานลูกความที่คิดค่าบริการโดยไม่ได้รับอนุมัติ
- [ ] Relying on AI-generated citations without verification
  - [ ] อ้างอิงจาก AI โดยไม่ตรวจสอบแหล่งอ้างอิง
- [ ] Sharing privileged strategy or ลูกความ PII
  - [ ] แชร์กลยุทธ์ที่ได้รับความคุ้มครองหรือ PII ของลูกความ

## Controls / มาตรการควบคุม

| Control | Owner |
| --- | --- |
| Written policy distribution | Managing partner / IT |
| Training on PDPA + confidentiality | HR / DPO |
| Approved tool list | IT |
| Matter-level exclusion (high-risk matters) | Supervising lawyer |
| Audit of AI vendor terms | DPO / IT |

**ภาษาไทย (ตาราง):**

| มาตรการ | ผู้รับผิดชอบ |
| --- | --- |
| แจกจ่ายนโยบายเป็นลายลักษณ์อักษร | หุ้นส่วนผู้จัดการ / IT |
| อบรม PDPA + ความลับ | HR / DPO |
| รายการเครื่องมือที่อนุมัติ | IT |
| ยกเว้นระดับงาน/คดี (งานเสี่ยงสูง) | ทนายความกำกับดูแล |
| ตรวจข้อกำหนดผู้ให้บริการ AI | DPO / IT |

## Review checklist before enabling any AI connector / เช็กลิสต์ก่อนเปิดตัวเชื่อม AI

See README [AI connector governance checklist](../../../README.md#ai-connector-governance-checklist).

**ภาษาไทย:** ดู [AI connector governance checklist](../../../README.md#ai-connector-governance-checklist) ใน README

## Thai-specific reminders / ข้อควรจำเฉพาะไทย

- PDPA may apply to personal data sent to AI vendors (including extraterritorial processing).
- Lawyer confidentiality (e.g. conduct rules on client secrets) may restrict disclosure to third-party AI.
- Court filings and signed documents may have additional restrictions on automated generation.

**ภาษาไทย:**

- PDPA อาจใช้กับข้อมูลส่วนบุคคลที่ส่งให้ผู้ให้บริการ AI (รวมการประมวลผลนอกประเทศ)
- ความลับทางวิชาชีพทนายความ (เช่น กฎจรรยาบรรณเรื่องความลับลูกความ) อาจจำกัดการเปิดเผยต่อ AI ของบุคคลที่สาม
- เอกสารยื่นศาลและเอกสารลงนามอาจมีข้อจำกัดเพิ่มเรื่องการสร้างโดยอัตโนมัติ

## Acknowledgment / การรับทราบ

Staff should acknowledge the firm AI policy annually (outside Firmedware or via internal HR system).

**ภาษาไทย:** พนักงานควรรับทราบนโยบาย AI ของสำนักงานทุกปี (นอก Firmedware หรือผ่านระบบ HR ภายใน)
