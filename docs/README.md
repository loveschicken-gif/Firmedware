# Firmedware documentation / เอกสาร Firmedware

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

**ภาษาไทย:** เอกสารในโฟลเดอร์ `docs/` เป็นสองภาษา — ภาษาอังกฤษก่อน ตามด้วยภาษาไทยในแต่ละส่วน

## Firm setup (start here) / ติดตั้งสำนักงาน (เริ่มที่นี่)

**One-page index (checklists & links):** [SETUP_INDEX.md](./SETUP_INDEX.md)

| I need to… | Open |
|------------|------|
| Choose path and firm size (1–4 vs 5–15) | [START_HERE.md](./START_HERE.md) |
| **Deploy** the app (Docker, HTTPS, backups) | [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) |
| **Configure the firm** (no command line) | [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md) |
| Deep reference (security, documents, activity) | [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) §§3–6 |

**ภาษาไทย:** ดัชนีหนึ่งหน้า [SETUP_INDEX.md](./SETUP_INDEX.md) — ติดตั้งเทคนิค [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) · ทนายความ [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md)

---

## Full documentation index / สารบัญเอกสารทั้งหมด

| Document | English | ภาษาไทย |
| --- | --- | --- |
| [SETUP_INDEX.md](./SETUP_INDEX.md) | One-screen setup index (links & steps) | ดัชนีติดตั้งหนึ่งหน้า |
| [START_HERE.md](./START_HERE.md) | Choose path + firm size (mini 1–4, small 5–15) | เริ่มต้น — เลือกเส้นทางและขนาดสำนักงาน |
| [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) | Technical deploy (IT / developer) | ติดตั้งทางเทคนิค |
| [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md) | Non-technical lawyer & office setup | ตั้งค่าสำหรับทนายความ (ไม่ใช่เทคนิค) |
| [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) | Deep reference (security, documents, activity) | อ้างอิงลึก §3–6 |
| [SECURITY.md](./SECURITY.md) | Security model, threat model, retention, go-live | แบบจำลองความปลอดภัย ภัยคุกคาม การเก็บรักษา |
| [EXTENSIONS.md](./EXTENSIONS.md) | 2FA, comments, multi-tenant forks | การขยายระบบ (2FA คอมเมนต์ multi-tenant) |
| [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md) | AI gateway setup, policy API, provider integration | ตั้งค่า AI connector และเชื่อม API |
| [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md) | Edge-case & failure testing catalog | แผนทดสอบ edge case |
| [FAILURE_MODE_MATRIX.md](./FAILURE_MODE_MATRIX.md) | Failure modes → tests → mitigations | เมทริกซ์โหมดความล้มเหลว |
| [SECURITY_EDGE_CASES.md](./SECURITY_EDGE_CASES.md) | Security-focused edge cases (P0/P1) | edge case ด้านความปลอดภัย |
| [jurisdictions/thailand/](./jurisdictions/thailand/README.md) | Thailand workflow templates | แพ็กเทมเพลตสำหรับสำนักงานกฎหมายไทย |

## Where data lives & shared access / ข้อมูลอยู่ที่ไหนและการเข้าถึงร่วมกัน

| Topic | Guide |
| --- | --- |
| Code vs database vs external documents | [README § Code vs Data vs Documents](../README.md#code-vs-data-vs-documents) |
| PostgreSQL records and backups | [README § Where Firm Data Is Stored](../README.md#where-firm-data-is-stored) |
| One deployment, multiple users | [README § How Multiple Users Access the Same Firm](../README.md#how-multiple-users-access-the-same-firm) · [Playbook § Shared firm deployment](./SETUP_PLAYBOOK.md#shared-firm-deployment) |
| GitHub is not the firm database | [README § Important: GitHub Is Not the Firm Database](../README.md#important-github-is-not-the-firm-database) |
| Do not commit secrets or firm data | [README § Do Not Commit Secrets or Firm Data](../README.md#do-not-commit-secrets-or-firm-data) · [SECURITY.md § Repository Safety](./SECURITY.md#repository-safety) |

**ภาษาไทย:** โค้ดอยู่ GitHub ข้อมูลสำนักงานอยู่ PostgreSQL เอกสารกฎหมายอยู่ที่เก็บภายนอก ใช้งานจริงติดตั้งร่วมกันหนึ่งครั้ง ผู้ใช้เข้า URL เดียวกัน

Application UI strings live in `locales/th/` and `locales/en/` — not in these operational docs.

**ภาษาไทย:** ข้อความในแอปอยู่ที่ `locales/th/` และ `locales/en/` ไม่ได้อยู่ในเอกสารปฏิบัติการนี้

## Terminology glossary / คำศัพท์มาตรฐาน

| English | ภาษาไทย |
| --- | --- |
| matter | งาน/คดี (matter) |
| client | ลูกความ |
| soft delete / archive | ลบแบบ soft / เก็บถาวร |
| activity log | บันทึกกิจกรรม (audit log) |
| document link | ลิงก์เอกสาร |
| metadata | ข้อมูลเมตาดาตา |
| single tenant | เทนแนนต์เดียว |
| not legal advice | ไม่ใช่คำแนะนำทางกฎหมาย |

Main project overview: [README.md](../README.md).

## Source and citation policy / นโยบายแหล่งอ้างอิง

Firmedware documentation avoids law firm marketing blogs, vendor marketing pages, and non-authoritative legal commentary as authority.

**ภาษาไทย:** เอกสารนี้ไม่อ้างอิงบล็อกการตลาดของสำนักงานกฎหมาย หน้า marketing ของ vendor หรือความเห็นที่ไม่ใช่แหล่งหลักเป็นหลัก

Where citations are needed, prefer:

- Official statutes, regulators, courts, and bar/lawyer council publications
- Official standards bodies (ISO, AICPA, NIST, OWASP)
- Official product documentation when describing a specific product

Operational templates are **not legal advice**. Firms should review applicable law and professional obligations with qualified advisors.

References to frameworks (SOC 2, ISO/IEC 27001, PDPA, etc.) are orientation only. Firmedware is **not** certified or compliant by default.

**ภาษาไทย:** การอ้างอิงกรอบงานเป็นการชี้ทิศทางเท่านั้น Firmedware **ไม่** ได้รับการรับรองหรือปฏิบัติตามกฎหมายโดยอัตโนมัติ
