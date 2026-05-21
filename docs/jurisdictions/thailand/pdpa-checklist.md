# PDPA operational checklist (Thailand) / เช็กลิสต์ PDPA ปฏิบัติการ (ไทย)

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`). Checklist items: English line, then indented Thai.

For firms using Firmedware as a **metadata-only** matter tracker. **Not legal advice.** Review with a lawyer and/or DPO. Map to your PDPA governance program.

**ภาษาไทย:** สำหรับสำนักงานที่ใช้ Firmedware เป็นระบบติดตามงาน/คดี **เฉพาะเมตาดาตา** **ไม่ใช่คำแนะนำทางกฎหมาย** ทบทวนกับทนายความและ/หรือ DPO จับคู่กับโปรแกรมกำกับ PDPA ของสำนักงาน

Firmedware may process personal data in: client names, contacts, matter titles, task notes, document titles, URLs, activity logs, and user accounts.

**ภาษาไทย:** Firmedware อาจประมวลผลข้อมูลส่วนบุคคลใน: ชื่อลูกความ ผู้ติดต่อ ชื่องาน/คดี บันทึกงาน ชื่อเอกสาร URL บันทึกกิจกรรม และบัญชีผู้ใช้

## Governance / การกำกับดูแล

- [ ] Named DPO or privacy owner (if required)
  - [ ] แต่งตั้ง DPO หรือผู้รับผิดชอบความเป็นส่วนตัว (ถ้าจำเป็น)
- [ ] Record of processing activities includes Firmedware / hosting / backups
  - [ ] บันทึกกิจกรรมการประมวลผลครอบคลุม Firmedware / โฮสต์ / สำรองข้อมูล
- [ ] Lawful basis documented for each data category
  - [ ] ฐานทางกฎหมายของแต่ละประเภทข้อมูลมีเอกสาร
- [ ] Privacy notice / engagement letter covers case management metadata
  - [ ] ประกาศความเป็นส่วนตัว / สัญญาว่าจ้างครอบคลุมเมตาดาตาของระบบจัดการคดี
- [ ] Data subject request process (access, correction, deletion where applicable)
  - [ ] ขั้นตอนคำขอของเจ้าของข้อมูล (เข้าถึง แก้ไข ลบ ตามที่ใช้ได้)

## Security (organizational + technical) / ความปลอดภัย (องค์กรและเทคนิค)

- [ ] HTTPS and access restriction (VPN / IP allowlist) for production
  - [ ] HTTPS และจำกัดการเข้าถึง (VPN / IP allowlist) ใน production
- [ ] RBAC reviewed quarterly; offboarding disables users and reviews DMS access
  - [ ] ทบทวน RBAC รายไตรมาส; ปิดผู้ใช้เมื่อลาออกและทบทวนสิทธิ์ DMS
- [ ] Postgres and backups encrypted; backup retention documented
  - [ ] เข้ารหัส Postgres และสำรองข้อมูล; กำหนดระยะเก็บสำรองเป็นลายลักษณ์อักษร
- [ ] Activity log export restricted to admins; exports logged
  - [ ] จำกัดการส่งออกบันทึกกิจกรรมให้แอดมิน; บันทึกการส่งออก
- [ ] Breach response playbook (internal + PDPC notification where required)
  - [ ] คู่มือตอบเหตุละเมิด (ภายใน + แจ้ง สคส. ตามที่ต้องทำ)

## Data minimization in Firmedware / การลดข้อมูลใน Firmedware

- [ ] Matter titles avoid unnecessary national ID or sensitive identifiers
  - [ ] ชื่องาน/คดีไม่ใส่เลขบัตรหรือตัวระบุที่ละเอียดอ่อนโดยไม่จำเป็น
- [ ] Task notes avoid pasting full ID numbers or medical data unless necessary
  - [ ] บันทึกงานไม่วางเลขบัตรเต็มหรือข้อมูลสุขภาพ เว้นแต่จำเป็น
- [ ] Document link titles descriptive but not excessively revealing
  - [ ] ชื่อลิงก์เอกสารอธิบายได้แต่ไม่เปิดเผยเกินจำเป็น
- [ ] Tags used consistently instead of duplicating PII in free text
  - [ ] ใช้แท็กสม่ำเสมอ แทนการซ้ำ PII ในข้อความอิสระ

## Vendors / ผู้ให้บริการ

- [ ] Hosting provider (cloud VM, office server) reviewed
  - [ ] ทบทวนผู้ให้บริการโฮสต์ (คลาวด์ VM เซิร์ฟเวอร์ในสำนักงาน)
- [ ] Google / Microsoft / Dropbox DPA or terms reviewed
  - [ ] ทบทวน DPA หรือข้อกำหนด Google / Microsoft / Dropbox
- [ ] Subprocessors list updated if using managed IT
  - [ ] อัปเดตรายการผู้ประมวลผลย่อยหากใช้ IT ภายนอก

## Retention / การเก็บรักษา

- [ ] Retention schedule for matters, logs, backups, CSV exports
  - [ ] ตารางเก็บรักษางาน/คดี บันทึก สำรอง และ CSV ที่ส่งออก
- [ ] Soft-deleted records reviewed before any hard delete
  - [ ] ทบทวนข้อมูลที่ soft-delete ก่อน hard delete
- [ ] Align retention with limitation periods and client agreements
  - [ ] ให้สอดคล้องกับอายุความและสัญญาลูกความ

## AI and sharing / AI และการแชร์

- [ ] Written AI policy: no client facts in public AI tools unless approved
  - [ ] นโยบาย AI เป็นลายลักษณ์อักษร: ไม่ใส่ข้อเท็จจริงลูกความใน AI สาธารณะ เว้นแต่อนุมัติ
- [ ] External link sharing policy (no “anyone with the link” by default)
  - [ ] นโยบายแชร์ลิงก์ภายนอก (ไม่ตั้ง “ใครมีลิงก์ก็เข้าได้” เป็นค่าเริ่มต้น)
- [ ] Cross-border transfer assessment if hosting or AI outside Thailand
  - [ ] ประเมินการถ่ายโอนข้ามพรมแดนหากโฮสต์หรือ AI อยู่นอกไทย

## Official sources (firm to maintain) / แหล่งทางการ (สำนักงานจัดเก็บเอง)

Review applicable Thai personal data protection requirements using **official regulator and primary legal sources** maintained by your firm. Do not rely on third-party marketing summaries as authority.

[Add official source: Personal Data Protection Commission / primary PDPA publications.]

Firmedware does not automate PDPA compliance.

**ภาษาไทย:** ทบทวน PDPA จากแหล่งทางการของหน่วยงานกำกับและกฎหมายหลักที่สำนักงานจัดเก็บ อย่าอ้างอิงสรุปจากบล็อกการตลาดของบุคคลที่สามเป็นหลัก

[เพิ่มแหล่งทางการ: สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล / เอกสาร PDPA หลัก]

**ภาษาไทย:** Firmedware ไม่ได้ทำให้การปฏิบัติตาม PDPA เป็นอัตโนมัติ
