# Extension guide / คู่มือการขยายระบบ

> **Bilingual / สองภาษา:** Each section is English first, then Thai (`ภาษาไทย`).

Ways to extend this starter pack without changing core philosophy (metadata + external links, single tenant, matter-scoped access).

**ภาษาไทย:** แนวทางขยาย starter pack โดยไม่เปลี่ยนหลักการ — เก็บเฉพาะข้อมูลเมตาดาตาและลิงก์เอกสารภายนอก เทนแนนต์เดียว และการเข้าถึงตามงาน/คดีที่มอบหมาย

v1.2 adds security logging, workflow statuses, and document sensitivity — see [SECURITY.md](./SECURITY.md).

**ภาษาไทย:** v1.2 มีบันทึกความปลอดภัย สถานะ workflow และระดับความลับของเอกสาร — ดู [SECURITY.md](./SECURITY.md)

## Two-factor authentication (2FA) / การยืนยันตัวตนสองปัจจัย (2FA)

**Not included in core.** Credentials login only.

**ภาษาไทย:** **ยังไม่มีใน core** — เข้าสู่ระบบด้วยรหัสผ่านเท่านั้น

### Recommended: enforce MFA outside the app / แนะนำ: บังคับ MFA นอกแอป

| Approach | Fits when |
|----------|-----------|
| [Authelia](https://www.authelia.com/docs/) | Self-hosted Docker stack in front of Next.js (official docs) |
| Cloudflare Access | Zero Trust access in front of your hostname — see [Cloudflare One documentation](https://developers.cloudflare.com/cloudflare-one/) (official product docs) |
| Azure AD Application Proxy / similar | Microsoft 365 shops |

**ภาษาไทย (สรุปตาราง):**

- **Authelia** — สแต็ก Docker ภายในองค์กร วางหน้า Next.js (เอกสารทางการ)
- **Cloudflare Access** — Zero Trust หน้าโดเมน — ดูเอกสาร Cloudflare One ทางการ
- **Azure AD Application Proxy** — ร้านที่ใช้ Microsoft 365

Users complete MFA before reaching `/login`.

**ภาษาไทย:** ผู้ใช้ทำ MFA ก่อนถึง `/login`

### Fork: TOTP inside the app / Fork: TOTP ในแอป

1. Add fields on `User`: `totpSecret`, `totpEnabled`.
2. Use a library such as `otpauth` for enroll/verify flows.
3. Extend Auth.js `authorize` to require TOTP after password when enabled.
4. Provide backup codes and admin reset.

**ภาษาไทย:**

1. เพิ่มฟิลด์ `totpSecret`, `totpEnabled` ใน `User`
2. ใช้ไลบรารีเช่น `otpauth` สำหรับลงทะเบียน/ยืนยัน
3. ขยาย Auth.js `authorize` ให้ต้องใช้ TOTP หลังรหัสผ่านเมื่อเปิดใช้
4. มีรหัสสำรองและให้แอดมินรีเซ็ตได้

Document the choice in your firm's internal runbook.

**ภาษาไทย:** บันทึกการเลือกใช้ใน runbook ภายในสำนักงาน

## Comment threads / เธรดคอมเมนต์

Core provides an **optional flag** (`FirmSettings.enableComments`) and a **placeholder** on matter detail — not a `Comment` table.

**ภาษาไทย:** core มีแฟล็ก `enableComments` และ placeholder ในหน้างาน/คดี — **ยังไม่มีตาราง `Comment`**

### Suggested fork shape / โครงสร้าง fork ที่แนะนำ

```prisma
model Comment {
  id        String   @id @default(cuid())
  matterId  String
  authorId  String
  body      String
  createdAt DateTime @default(now())
  matter    Matter   @relation(fields: [matterId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}
```

**ภาษาไทย:** โมเดล Comment ตัวอย่างสำหรับ fork — ต้องใช้กฎการเข้าถึงเดียวกับ activity log

- Gate create/read with the same rules as `canViewEntityActivity` in `src/lib/activity-access.ts`.
  - **ภาษาไทย:** สร้าง/อ่านตามกฎ `canViewEntityActivity` ใน `src/lib/activity-access.ts`
- Log `CREATE` on comments in `ActivityLog` if you extend `EntityType`.
  - **ภาษาไทย:** บันทึก `CREATE` ใน `ActivityLog` หากขยาย `EntityType`
- Consider retention and export policies for privilege review.
  - **ภาษาไทย:** กำหนดนโยบายเก็บรักษาและส่งออกสำหรับการตรวจสิทธิ์ความลับ

## AI Connector Gateway / เกตเวย์ตัวเชื่อม AI

**Full setup & API guide:** [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md) (admin UI, `policy-check` / `capabilities` API, integration flow, env vars, fork example).

Core ships **stubs only** under `src/lib/ai/` and `/api/ai/*`. All providers in `aiProviderRegistry` have `enabled: false`. No document fetching, no record mutation, no export to AI.

**ภาษาไทย:** แกนหลักมีเฉพาะ stub ผู้ให้บริการปิดทั้งหมด ดู [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md) สำหรับการตั้งค่าและ API

### Fork: enable a provider

1. Complete [AI connector governance](./SECURITY.md#ai-connector-governance--การกำกับดูแล-ai-connectors) and a written firm policy.
2. Set `FirmSettings.enableAIConnectors` and `aiConnectorMode` via **Admin → AI connectors** (`/admin/ai-connectors`).
3. From your UI or server action: `GET /api/ai/capabilities`, then `POST /api/ai/policy-check` with `userConfirmed: true` and attestation flags — stop if `decision.allowed` is false.
4. Add `src/lib/ai/connectors/<provider>.ts` that calls the vendor API only after `evaluateFirmAIPolicy()` returns allowed.
5. Set `aiProviderRegistry.<PROVIDER>.enabled = true` in the fork when ready for production.
6. Store API keys in environment variables (e.g. `OPENAI_API_KEY`) — never in Prisma. See `.env.example` comments.
7. Log `AI_REQUEST_CREATED` / `AI_OUTPUT_GENERATED` via `metadata.kind`; do not log full prompts/outputs unless firm policy requires it.

**ภาษาไทย:** เปิดผู้ให้บริการใน fork หลังนโยบายลายลักษณ์ เรียก policy-check ก่อนเรียก vendor ใช้ env สำหรับ key

## SharePoint and other DMS / SharePoint และ DMS อื่น

`SHAREPOINT` is a first-class `DocumentProvider`. For iManage, NetDocuments, or Box, use `OTHER` + `providerLabel` until you add enum values and locale strings.

**ภาษาไทย:** `SHAREPOINT` เป็น `DocumentProvider` หลัก สำหรับ iManage, NetDocuments, Box ใช้ `OTHER` + `providerLabel` จนกว่าจะเพิ่ม enum และข้อความใน locale

## Multi-tenant / หลายเทนแนนต์

This repo assumes **one firm per database**. Multi-tenant forks typically add `firmId` to all tables and subdomain routing — a large schema change; start a separate design doc before migrating.

**ภาษาไทย:** repo นี้สมมติ **หนึ่งสำนักงานต่อฐานข้อมูล** การทำ multi-tenant มักเพิ่ม `firmId` ทุกตารางและ routing ตาม subdomain — เปลี่ยน schema มาก ควรมีเอกสารออกแบบแยกก่อนย้าย
