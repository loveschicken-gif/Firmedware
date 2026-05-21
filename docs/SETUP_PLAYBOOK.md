# Firmedware setup playbook / คู่มือติดตั้ง Firmedware

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

**Setup index:** [SETUP_INDEX.md](./SETUP_INDEX.md) (one screen) · **Start here:** [START_HERE.md](./START_HERE.md) — choose technical vs lawyer path and firm size (**mini team 1–4** or **small firm 5–15**).

| Path | Guide |
|------|--------|
| Technical deploy (Docker, backups, HTTPS) | [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) |
| Lawyers & office managers (no command line) | [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md) |

This playbook is the **deep reference** for §§3–6 (security, documents, activity, optional features). v1.2 targets **1–15 users** on one deployment; **16+** or enterprise needs → fork [EXTENSIONS.md](./EXTENSIONS.md).

**ภาษาไทย:** เริ่มที่ [START_HERE.md](./START_HERE.md) — เทคนิคดู [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) ทนายความดู [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md) คู่มือนี้เป็นส่วนลึก §3–6

For API development, data location, and lawyer-led workflow framing: [README](../README.md). Thai templates: [jurisdictions/thailand/](./jurisdictions/thailand/README.md).

---

## Shared firm deployment / การติดตั้งสำนักงานร่วมกัน

One shared instance, one PostgreSQL database, one URL for all users. Summary and firm-size routing: [START_HERE.md](./START_HERE.md).

**ภาษาไทย:** หนึ่ง instance หนึ่งฐานข้อมูล หนึ่ง URL — สรุปที่ [START_HERE.md](./START_HERE.md)

---

## 1. First admin (single tenant) / 1. แอดมินคนแรก (เทนแนนต์เดียว)

Firmedware is **one firm per deployment**: one PostgreSQL database, one `FirmSettings` record, no multi-tenant routing.

**Full bootstrap steps:** [DEPLOY_GUIDE.md § Core deploy](./DEPLOY_GUIDE.md#core-deploy-all-sizes--ติดตั้งหลัก-ทุกขนาด).

**ภาษาไทย:** ขั้นตอนติดตั้งเต็มอยู่ใน [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

---

## 2. Adding firm members / 2. เพิ่มสมาชิกสำนักงาน

**By firm size:** [LAWYER_FIRM_SETUP.md — Mini team (1–4)](./LAWYER_FIRM_SETUP.md#mini-team-1-4-people) · [Small firm (5–15)](./LAWYER_FIRM_SETUP.md#small-firm-5-15-people).

Non-admins only see **clients and matters they are assigned to** (directly or via group).

**ภาษาไทย:** รายละเอียดผู้ใช้และกลุ่มอยู่ใน [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md)

---

## 3. Security measures / 3. มาตรการความปลอดภัย

See [SECURITY.md](./SECURITY.md) for the full security model (no file proxying, immutable audit log, admin responsibilities).

**ภาษาไทย:** ดู [SECURITY.md](./SECURITY.md) สำหรับแบบจำลองความปลอดภัยเต็มรูปแบบ (ไม่ proxy ไฟล์ บันทึก audit แก้ไม่ได้ ความรับผิดชอบแอดมิน)

### Built into Firmedware / มีใน Firmedware แล้ว

| Control | Notes |
|---------|--------|
| Password auth | bcrypt-hashed passwords; JWT sessions (Auth.js) |
| RBAC | Admin, Lawyer, Staff, Viewer |
| Matter visibility | Default: assigned matters only (`FirmSettings.defaultMatterVisibility`) |
| Activity audit | CREATE, UPDATE, DELETE, VIEW logged |
| No document proxy | Links open in the browser; server never fetches file bytes |
| Soft delete | Archive clients, matters, documents, tasks |
| Deactivate users | `active` flag blocks login |

**ภาษาไทย (สรุปตาราง):**

| การควบคุม | หมายเหตุ |
|-----------|----------|
| รหัสผ่าน | bcrypt; session JWT (Auth.js) |
| RBAC | Admin, Lawyer, Staff, Viewer |
| การมองเห็นงาน/คดี | ค่าเริ่มต้น: เฉพาะงาน/คดีที่มอบหมาย (`FirmSettings.defaultMatterVisibility`) |
| audit กิจกรรม | บันทึก CREATE, UPDATE, DELETE, VIEW |
| ไม่ proxy เอกสาร | ลิงก์เปิดในเบราว์เซอร์ เซิร์ฟเวอร์ไม่ดึงไฟล์ |
| soft delete | เก็บถาวรลูกความ งาน/คดี ลิงก์เอกสาร งานย่อย |
| ปิดใช้งานผู้ใช้ | ฟล็ก `active` บล็อกการ login |

### Your responsibility (recommended for production) / ความรับผิดชอบของสำนักงาน (แนะนำ production)

| Control | Recommendation |
|---------|----------------|
| **HTTPS** | Terminate TLS at nginx, Caddy, or cloud load balancer |
| **2FA / MFA** | **Strongly recommended** — enforce at reverse proxy (Authelia, Cloudflare Access, Azure AD Application Proxy) or add TOTP in your fork ([EXTENSIONS.md](./EXTENSIONS.md)) |
| Network | VPN or IP allowlist for self-hosted instances |
| Database | Do not expose Postgres publicly; encrypted backups |
| Secrets | Rotate `AUTH_SECRET`; unique DB password |
| DMS permissions | Google Drive / SharePoint sharing is enforced **in Microsoft/Google**, not in Firmedware |
| Rate limiting | Configure at reverse proxy / WAF |

**ภาษาไทย (สรุปตาราง):**

| การควบคุม | คำแนะนำ |
|-----------|---------|
| **HTTPS** | สิ้นสุด TLS ที่ nginx, Caddy หรือ load balancer |
| **2FA / MFA** | **แนะนำอย่างยิ่ง** — บังคับที่ reverse proxy (Authelia, Cloudflare Access, Azure AD Application Proxy) หรือเพิ่ม TOTP ใน fork ([EXTENSIONS.md](./EXTENSIONS.md)) |
| เครือข่าย | VPN หรือ IP allowlist สำหรับ self-host |
| ฐานข้อมูล | อย่าเปิด Postgres สาธารณะ; backup เข้ารหัส |
| ความลับ | หมุนเวียน `AUTH_SECRET`; รหัส DB ไม่ซ้ำ |
| สิทธิ์ DMS | การแชร์ Google Drive / SharePoint บังคับ **ใน Microsoft/Google** ไม่ใช่ใน Firmedware |
| rate limiting | ตั้งที่ reverse proxy / WAF |

**Go-live checklist:** [README — Minimum production checklist](../README.md#minimum-production-checklist) (password, HTTPS, backups, DMS permissions, AI policy, offboarding, activity review).

**ภาษาไทย:** **checklist go-live:** [README — Minimum production checklist](../README.md#minimum-production-checklist) (รหัสผ่าน, HTTPS, backup, สิทธิ์ DMS, นโยบาย AI, offboarding, ทบทวนกิจกรรม)

---

## 4. Document and drive links / 4. ลิงก์เอกสารและไดรฟ์

Firmedware stores **metadata and document references only** — not file contents.

Reference types in the UI:

| Type | Use for | Stored in `url` field |
|------|---------|---------------------|
| **External URL** | Drive, OneDrive, SharePoint, Dropbox, web links | `https://…` |
| **Local / manual path** | NAS, UNC (`\\server\share`), drive letter, macOS/Linux paths, OneDrive/Google Drive *desktop sync folders* | Path string as text |
| **Manual reference** | Paper files, cabinets, archive boxes, offline drives | Free text |

Firmedware does **not** verify paths exist, read files, crawl folders, or fetch external URLs from the server.

**ภาษาไทย:** Firmedware เก็บ **ข้อมูลเมตาดาตาและการอ้างอิงเอกสารเท่านั้น** — ไม่เก็บเนื้อหาไฟล์ รองรับ URL ภายนอก, path ในเครื่อง/โฟลเดอร์แชร์, และข้อมูลอ้างอิง manual (เอกสารกระดาษ/กล่องเก็บ) ไม่ตรวจสอบว่า path มีจริงและไม่ดึงไฟล์จากเซิร์ฟเวอร์

### Supported providers (UI) / ผู้ให้บริการที่รองรับ (UI)

| Provider | Typical use |
|----------|-------------|
| **Google Drive** | `drive.google.com`, `docs.google.com` shared links |
| **OneDrive** | Personal or business OneDrive share links |
| **SharePoint** | `*.sharepoint.com` site/library links |
| **Dropbox** | Shared file/folder links |
| **Local shared folder** | Internal NAS path documented for staff (browser may need HTTPS share) |
| **Other** | iManage, NetDocuments, Box, Egnyte — set custom label |

**ภาษาไทย (สรุปตาราง):**

| ผู้ให้บริการ | การใช้ทั่วไป |
|-------------|-------------|
| **Google Drive** | ลิงก์แชร์ `drive.google.com`, `docs.google.com` |
| **OneDrive** | ลิงก์แชร์ OneDrive ส่วนตัวหรือธุรกิจ |
| **SharePoint** | ลิงก์ไซต์/ไลบรารี `*.sharepoint.com` |
| **Dropbox** | ลิงก์แชร์ไฟล์/โฟลเดอร์ |
| **Local shared folder** | path NAS ภายใน บันทึกให้เจ้าหน้าที่ (เบราว์เซอร์อาจต้อง HTTPS share) |
| **Other** | iManage, NetDocuments, Box, Egnyte — ตั้ง label เอง |

### Firm conventions (recommended) / แบบแปลงสำนักงาน (แนะนำ)

- Use a consistent path pattern in SharePoint/Drive, e.g. `{ClientCode}/{MatterNumber}/{DocType}/`.
- Put the **canonical** link in Firmedware; avoid duplicate registrations.
- Matter **group assignments** can store a `directoryPath` hint for where files live.
- **Permissions** must be set in the DMS; Firmedware does not sync ACLs.

**ภาษาไทย:**

- ใช้รูปแบบ path สม่ำเสมอใน SharePoint/Drive เช่น `{ClientCode}/{MatterNumber}/{DocType}/`
- ใส่ลิงก์ **canonical** ใน Firmedware หลีกเลี่ยงลงทะเบียนซ้ำ
- การมอบหมาย **group** ในงาน/คดี เก็บ `directoryPath` เป็นคำใบ้ตำแหน่งไฟล์
- **สิทธิ์** ตั้งใน DMS — Firmedware ไม่ sync ACL

### Privacy reminder / ข้อควรจำเรื่องความเป็นส่วนตัว

Opening a link uses the user’s browser session with Google/Microsoft. Firmedware does not validate that the user still has access in the DMS.

**ภาษาไทย:** การเปิดลิงก์ใช้ session เบราว์เซอร์ของผู้ใช้กับ Google/Microsoft — Firmedware ไม่ตรวจว่าผู้ใช้ยังมีสิทธิ์ใน DMS หรือไม่

---

## 5. Activity logs and tasks / 5. บันทึกกิจกรรมและงานย่อย

| Who | What they see |
|-----|----------------|
| **Matter assignee** (user or group member) | Activity timeline on **Matter**, **Task**, and **Document** detail pages for that matter |
| **Non-assignee** | No entity-level activity on those records |
| **Admin** | Firm-wide **Activity** page (`/activity`) — all audit entries |
| **Non-admin** | **Account → Recent matter activity** — entries for assigned matters only |

**ภาษาไทย (สรุปตาราง):**

| ผู้ใช้ | สิ่งที่เห็น |
|--------|------------|
| **ผู้ได้รับมอบหมายงาน/คดี** (user หรือสมาชิกกลุ่ม) | timeline กิจกรรมในหน้า **Matter**, **Task**, **Document** ของงาน/คดีนั้น |
| **ผู้ที่ไม่ได้รับมอบหมาย** | ไม่เห็นกิจกรรมระดับ entity บนเรคอร์ดเหล่านั้น |
| **Admin** | หน้า **Activity** ทั้งสำนักงาน (`/activity`) — รายการ audit ทั้งหมด |
| **ไม่ใช่แอดมิน** | **Account → Recent matter activity** — เฉพาะงาน/คดีที่มอบหมาย |

Task lists and deadlines follow the same matter visibility rules as clients and documents.

**ภาษาไทย:** รายการงานย่อยและกำหนดเวลาใช้กฎการมองเห็นงาน/คดีเดียวกับลูกความและลิงก์เอกสาร

### Immutable audit trail / เส้นทาง audit ที่แก้ไม่ได้

- Activity log rows are **append-only**. The app has no edit or delete controls for audit entries.
- PostgreSQL **triggers block UPDATE and DELETE** on `ActivityLog` (even direct database access raises an error).
- Each entry stores a snapshot of **actor name and email** at the time of the action (renaming a user later does not rewrite history).
- Use **Download activity log (CSV)** on the Activity page, Account page, or entity Activity tab to export records for retention or review. Exports respect the same visibility rules as the on-screen list.

**ภาษาไทย:**

- แถวบันทึกกิจกรรมเป็น **append-only** แอปไม่มีปุ่มแก้หรือลบ audit
- PostgreSQL **trigger บล็อก UPDATE และ DELETE** บน `ActivityLog` (แม้เข้า DB โดยตรงก็ error)
- แต่ละรายการเก็บ snapshot **ชื่อและอีเมลผู้กระทำ** ณ เวลานั้น (เปลี่ยนชื่อผู้ใช้ภายหลังไม่เขียนทับประวัติ)
- ใช้ **Download activity log (CSV)** ในหน้า Activity, Account หรือแท็บ Activity ของ entity เพื่อส่งออก — กฎการมองเห็นเท่ากับบนหน้าจอ

---

## 6. Optional features / 6. ฟีเจอร์เสริม

Configured under **Admin → Firm settings → Optional features**:

**ภาษาไทย:** ตั้งที่ **Admin → Firm settings → Optional features**

| Flag | Default | Effect |
|------|---------|--------|
| **Entity notes fields** | On | Notes on clients, matters, document links |
| **Comments module** | Off | Placeholder on matter detail when enabled; **no threads in core** |
| **Billing & payment tracking** | Off | `/billing` routes; invoice metadata, external invoice URL, payment status on client/matter pages and dashboard |

**ภาษาไทย (สรุปตาราง):**

| แฟล็ก | ค่าเริ่มต้น | ผล |
|------|------------|-----|
| **Entity notes fields** | เปิด | หมายเหตุบนลูกความ งาน/คดี ลิงก์เอกสาร |
| **Comments module** | ปิด | placeholder ในหน้างาน/คดีเมื่อเปิด — **core ไม่มีเธรด** |
| **Billing & payment tracking** | ปิด | เส้นทาง `/billing`; เมตาดาตาใบแจ้งหนี้ URL ภายนอก สถานะชำระในหน้าลูกความ/งาน/คดีและแดชบอร์ด |

**Billing is not accounting software.** It does not process payments, connect to banks, or file taxes. Use your firm’s accounting system for ledgers and tax; use Firmedware only to track which invoices exist, their status, and links to external invoices.

**ภาษาไทย:** **Billing ไม่ใช่ซอฟต์แวร์บัญชี** ไม่รับชำระเงิน ไม่เชื่อมธนาคาร ไม่ยื่นภาษี ใช้ระบบบัญชีของสำนักงานสำหรับบัญชีและภาษี ใช้ Firmedware เพื่อติดตามว่ามีใบแจ้งหนี้ใด สถานะอย่างไร และลิงก์ภายนอก

**Billing access (when enabled):**

| Role | Billing |
|------|---------|
| **Admin** | All records; archive (soft-delete) |
| **Lawyer / Staff** | Create/update on accessible matters; view scoped records |
| **Viewer** | Read-only on accessible matters |

**ภาษาไทย (สรุปตาราง — เมื่อเปิด Billing):**

| Role | Billing |
|------|---------|
| **Admin** | เรคอร์ดทั้งหมด; เก็บถาวร (soft-delete) |
| **Lawyer / Staff** | สร้าง/แก้ในงาน/คดีที่เข้าถึงได้; ดูตามขอบเขต |
| **Viewer** | อ่านอย่างเดียวในงาน/คดีที่เข้าถึงได้ |

**Design intent:** Firmedware is a registry and workflow tracker, not a collaboration suite or accounting platform. Attorney work product and privileged communications should stay in the DMS, email, or systems your firm already secures.

**ภาษาไทย:** **เจตนาออกแบบ:** Firmedware เป็นทะเบียนและตัวติดตาม workflow ไม่ใช่ชุด collaboration หรือแพลตฟอร์มบัญชี ผลงานทนายและการสื่อสารที่มีสิทธิ์ควรอยู่ใน DMS อีเมล หรือระบบที่สำนักงานมีอยู่แล้ว

To add comment threads, fork the app and implement a `Comment` model — see [EXTENSIONS.md](./EXTENSIONS.md).

**ภาษาไทย:** หากต้องการเธรดคอมเมนต์ ให้ fork และ implement โมเดล `Comment` — ดู [EXTENSIONS.md](./EXTENSIONS.md)

---

## 7. Account and administration / 7. บัญชีและการดูแลระบบ

Open **Account** from your name in the sidebar.

**ภาษาไทย:** เปิด **Account** จากชื่อในแถบด้านข้าง

| Section | Who | Purpose |
|---------|-----|---------|
| **Profile** | Everyone | Name, preferred language |
| **Security** | Everyone | Change password |
| **Recent matter activity** | Non-admin | Audit entries for your matters |
| **Administration** | Admin | Links to Users, Groups, Activity log, Firm settings |

**ภาษาไทย (สรุปตาราง):**

| ส่วน | ผู้ใช้ | วัตถุประสงค์ |
|------|--------|---------------|
| **Profile** | ทุกคน | ชื่อ ภาษาที่ต้องการ |
| **Security** | ทุกคน | เปลี่ยนรหัสผ่าน |
| **Recent matter activity** | ไม่ใช่แอดมิน | รายการ audit ของงาน/คดีที่คุณเกี่ยวข้อง |
| **Administration** | Admin | ลิงก์ไป Users, Groups, Activity log, Firm settings |

Centralizing admin links on Account keeps day-to-day navigation simple while preserving full admin screens under `/admin/*` and `/activity`.

**ภาษาไทย:** รวมลิงก์แอดมินที่ Account ทำให้นำทางประจำวันง่าย ขณะที่หน้าจอแอดมินเต็มยังอยู่ที่ `/admin/*` และ `/activity`
