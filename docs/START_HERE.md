# Start here / เริ่มต้นที่นี่

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

**Quick index (one screen):** [SETUP_INDEX.md](./SETUP_INDEX.md) — steps, checklists, and links only.

Choose your path before you read the full [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md).

**ภาษาไทย:** ดัชนีสั้น [SETUP_INDEX.md](./SETUP_INDEX.md) — เลือกเส้นทางก่อนอ่าน [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) ฉบับเต็ม

---

## Who are you? / คุณคือใคร

| You are… | Open this guide |
|----------|-----------------|
| IT, developer, or tech-capable office manager (Docker, server, backups) | **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** — technical deploy |
| Lawyer, partner, or office manager **after** you have a login URL | **[LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md)** — no command line |
| Both (typical) | Tech completes **DEPLOY_GUIDE** → lawyers complete **LAWYER_FIRM_SETUP** |

**ภาษาไทย:**

| คุณคือ… | เปิดคู่มือนี้ |
|--------|----------------|
| IT, นักพัฒนา หรือเจ้าหน้าที่ที่ติดตั้งเซิร์ฟเวอร์ได้ | **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** |
| ทนายความหรือผู้จัดการสำนักงาน **หลังมี URL เข้าระบบแล้ว** | **[LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md)** |
| ทั้งสองบทบาท | Tech ทำ **DEPLOY_GUIDE** → ทนายความทำ **LAWYER_FIRM_SETUP** |

---

## How big is your firm? / สำนักงานมีขนาดเท่าใด

Firmedware v1.2 is designed for **mini/small teams (1–4 people)** and **small firms (5–15 people)** on **one shared deployment** and **one PostgreSQL database**.

**ภาษาไทย:** v1.2 ออกแบบสำหรับ **ทีมเล็กมาก (1–4 คน)** และ **สำนักงานขนาดเล็ก (5–15 คน)** บน **การติดตั้งร่วมกันหนึ่งครั้ง** และ **ฐานข้อมูล PostgreSQL หนึ่งชุด**

| Size | People | Technical guide | Lawyer guide |
|------|--------|-----------------|--------------|
| **Mini / small team** | 1–4 | [DEPLOY § Mini](./DEPLOY_GUIDE.md#mini-team-1-4-people) | [LAWYER § Mini](./LAWYER_FIRM_SETUP.md#mini-team-1-4-people) |
| **Small firm** | 5–15 | [DEPLOY § Small](./DEPLOY_GUIDE.md#small-firm-5-15-people) | [LAWYER § Small](./LAWYER_FIRM_SETUP.md#small-firm-5-15-people) |

Examples:

- **1** solo lawyer → mini team (solo subsection)
- **3–4** attorneys + 0–1 assistant → mini team
- **8** attorneys + paralegals → small firm
- **15** total staff → upper bound of “small firm” in these docs

**ภาษาไทย:** ทนายเดี่ยว = mini team; 3–4 ทนาย = mini team; 8–15 คน = small firm

### Not suitable for larger firms (but you can develop this repo) / ไม่เหมาะกับสำนักงานใหญ่ (แต่พัฒนา repo ต่อได้)

Firmedware **core is not aimed at mid-size or large firms** (roughly **16+ people**, multiple offices, complex HR/IT, or enterprise SSO/DMS integration out of the box).

**ภาษาไทย:** **แกนหลักไม่ได้มุ่งเป้าสำนักงานขนาดกลางหรือใหญ่** (โดยประมาณ **16 คนขึ้นไป** หลายสาขา หรือต้องการ SSO/การเชื่อม DMS ระดับองค์กรในตัว)

That does **not** mean you cannot use the code:

- **Fork and extend** — multi-office routing, SSO, billing integrations, AI execution, comments, 2FA in-app: see [EXTENSIONS.md](./EXTENSIONS.md).
- **Operate a larger firm on a fork** after your own security and workflow design review.
- **Use v1.2 as-is** only when a **single-tenant, 1–15 user, metadata-only** model fits.

**ภาษาไทย:** ยังใช้โค้ดได้โดย **fork และขยาย** ดู [EXTENSIONS.md](./EXTENSIONS.md); ใช้ v1.2 ตามที่ส่งมาเมื่อโมเดล **เทนแนนต์เดียว 1–15 คน เก็บเฉพาะเมตาดาตา** เหมาะกับงาน

---

## Before go-live (everyone) / ก่อนใช้งานจริง (ทุกคน)

- [ ] **One URL** — all lawyers and staff use the same deployed address (not separate laptops each running their own database).
- [ ] **One database** — firm records live in PostgreSQL on that deployment (not in GitHub).
- [ ] **Documents stay in your DMS** — Google Drive, OneDrive, SharePoint, Dropbox, or a shared folder; Firmedware stores **links and metadata only**.

**ภาษาไทย:**

- [ ] **URL เดียว** — ทุกคนเข้าที่อยู่เดียวกัน
- [ ] **ฐานข้อมูลเดียว** — ข้อมูลสำนักอยู่ใน PostgreSQL ของการติดตั้งนั้น
- [ ] **เอกสารอยู่ใน DMS** — Firmedware เก็บลิงก์และเมตาดาตาเท่านั้น

---

## Common mistake / ข้อผิดพลาดที่พบบ่อย

**Wrong:** Each lawyer clones GitHub, runs `npm run dev` locally, and expects matters to sync.

**Right:** One person deploys once; everyone logs into that instance.

**ภาษาไทย:** **ผิด:** แต่ละคน clone และรัน local แยกกัน **ถูก:** ติดตั้งครั้งเดียว ทุกคน login เข้า instance เดียวกัน

---

## More reading / อ่านเพิ่ม

| Topic | Document |
|-------|----------|
| One-screen setup index | [SETUP_INDEX.md](./SETUP_INDEX.md) |
| Full operational reference | [SETUP_PLAYBOOK.md](./SETUP_PLAYBOOK.md) |
| Security model | [SECURITY.md](./SECURITY.md) |
| Thailand workflow templates | [jurisdictions/thailand/](./jurisdictions/thailand/README.md) |
| Production checklist (README) | [Minimum production checklist](../README.md#minimum-production-checklist) |
| Fork ideas (2FA, AI, multi-tenant) | [EXTENSIONS.md](./EXTENSIONS.md) |
