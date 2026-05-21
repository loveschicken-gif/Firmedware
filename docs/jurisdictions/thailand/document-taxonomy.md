# Document taxonomy (Thailand) / หมวดหมู่เอกสาร (ไทย)

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`) for section intros. List items keep Thai (English) labels as-is.

Use **tags** and consistent **document link titles** in Firmedware. This list is a starting taxonomy—not an enforced schema.

**ภาษาไทย:** ใช้ **แท็ก** และ **ชื่อลิงก์เอกสาร** ให้สม่ำเสมอใน Firmedware รายการนี้เป็นจุดเริ่มต้น ไม่ใช่ schema บังคับ

## Identity and authority / ตัวตนและอำนาจ

**ภาษาไทย:** เอกสารยืนยันตัวตน มอบอำนาจ และอำนาจนิติบุคคล

- หนังสือมอบอำนาจ (Power of attorney)
- บัตรประชาชน / เอกสารยืนยันตัวตน
- หนังสือรับรองบริษัท
- บัญชีรายชื่อผู้ถือหุ้น
- หนังสือแต่งตั้งกรรมการ

## Contracts / สัญญา

**ภาษาไทย:** ร่าง สัญญา และเอกสารที่เกี่ยวข้องกับธุรกรรม

- ร่างสัญญา
- สัญญา
- สัญญาลงนามแล้ว
- ภาคผนวก / แนบท้ายสัญญา
- บันทึกข้อตกลง (MOU)

## Litigation and agency / คดีความและหน่วยงาน

**ภาษาไทย:** เอกสารศาล หน่วยงาน และพยานหลักฐาน

- คำฟ้อง
- คำให้การ
- คำร้อง / คำขอ
- คำสั่งศาล
- พยานหลักฐาน
- บันทึกการสอบพยาน

## Correspondence and advice / หนังสือและคำปรึกษา

**ภาษาไทย:** การติดต่อ บันทึก และ memo

- หนังสือโต้ตอบ
- อีเมล / จดหมาย (metadata link only)
- บันทึกคำปรึกษา
- บันทึกประชุม
- Legal memo (TH/EN)

## Billing (if tracked externally or in a fork) / การเรียกเก็บเงิน

**ภาษาไทย:** ใช้เมื่อติดตามนอกระบบหรือใน fork — อ้างอิงใน notes ตามนโยบายสำนักงาน

- ใบแจ้งหนี้
- ใบเสร็จรับเงิน
- ใบกำกับภาษี (reference in notes if needed)

## Sensitivity / ระดับความลับ

Map to Firmedware `DocumentSensitivity` where appropriate:

**ภาษาไทย:** จับคู่กับ `DocumentSensitivity` ใน Firmedware ตามความเหมาะสม

| Taxonomy examples | Sensitivity |
| --- | --- |
| Routine correspondence | NORMAL |
| Client financials | CONFIDENTIAL |
| Litigation strategy | HIGHLY_CONFIDENTIAL |
| Privileged advice | PRIVILEGED |

**ภาษาไทย (ตาราง):**

| ตัวอย่างหมวด | ระดับ |
| --- | --- |
| หนังสือทั่วไป | NORMAL |
| ข้อมูลการเงินลูกความ | CONFIDENTIAL |
| กลยุทธ์คดี | HIGHLY_CONFIDENTIAL |
| คำปรึกษาที่ได้รับความคุ้มครอง | PRIVILEGED |

External DMS permissions remain the primary access control—see [SETUP_PLAYBOOK §4](../../SETUP_PLAYBOOK.md#4-document-and-drive-links).

**ภาษาไทย:** สิทธิ์ใน DMS ภายนอกยังเป็นหลักในการควบคุมการเข้าถึง — ดู [SETUP_PLAYBOOK §4](../../SETUP_PLAYBOOK.md#4-document-and-drive-links)
