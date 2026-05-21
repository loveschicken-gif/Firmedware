# Deploy guide (technical) / คู่มือติดตั้ง (เทคนิค)

> **Bilingual / สองภาษา:** English first, then Thai (`ภาษาไทย`).

For **lawyers and office managers** (no servers): use **[LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md)** instead.

Entry point: **[START_HERE.md](./START_HERE.md)**.

**Audience:** IT, developer, or tech-capable staff deploying [docker-compose.yml](../docker-compose.yml) or Node.js + PostgreSQL.

**Firm size:** This guide covers **mini/small team (1–4)** and **small firm (5–15)**. For **16+ people** or multi-office enterprise needs, v1.2 core is **not a fit as-is** — fork and extend per [EXTENSIONS.md](./EXTENSIONS.md).

Quick index: **[SETUP_INDEX.md](./SETUP_INDEX.md)**.

## Contents / สารบัญ

- [Prerequisites](#prerequisites--สิ่งที่ต้องมี)
- [Core deploy (all sizes)](#core-deploy-all-sizes--ติดตั้งหลัก-ทุกขนาด)
- [Production hardening](#production-hardening-all-sizes--เสริมความปลอดภัย-production)
- [Mini team (1–4)](#mini-team-1-4-people)
- [Small firm (5–15)](#small-firm-5-15-people)
- [Larger than 15](#larger-than-15-people--มากกว่า-15-คน)
- [Handoff to lawyers](#handoff-to-lawyers--ส่งมอบให้ทนายความ)
- [See also](#see-also--ดูเพิ่ม)

---

## Prerequisites / สิ่งที่ต้องมี

| Option | Requirements |
|--------|----------------|
| **Docker Compose** (recommended) | Docker, Docker Compose; copy [.env.example](../.env.example) to `.env` |
| **Manual** | Node.js 22+, PostgreSQL 16+, `npm ci`, `npx prisma migrate deploy` |

**ภาษาไทย:** แนะนำ Docker Compose หรือ Node 22 + PostgreSQL 16

---

## Core deploy (all sizes) / ติดตั้งหลัก (ทุกขนาด)

1. **Environment** — set before first start:
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — public URL users will open (e.g. `https://tracker.yourfirm.com`)
   - `DATABASE_URL` — PostgreSQL connection string
   - `SEED_ADMIN_EMAIL` — firm-owned mailbox
   - `SEED_ADMIN_PASSWORD` — strong temporary password (**not** `changeme` in production)

2. **Start stack**

   ```bash
   docker compose up -d --build
   ```

   Or: `npx prisma migrate deploy` then `npm run db:seed` and `npm run build` / `npm start`.

3. **First login** — seed creates one **ADMIN** when the `User` table is empty.

4. **Immediately** — sign in, open **Account → Security**, change password.

5. **After go-live** — remove `SEED_ADMIN_PASSWORD` from production `.env` / Compose.

6. **Hand off to lawyers** — send [handoff email](#handoff-to-lawyers) with URL and link to [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md).

**ภาษาไทย:** ตั้ง env → start → login → เปลี่ยนรหัสผ่าน → ลบ SEED_ADMIN_PASSWORD จาก production → ส่ง URL ให้ทนายความ

Deep reference: [SETUP_PLAYBOOK.md §1](./SETUP_PLAYBOOK.md#1-first-admin-single-tenant--1-แอดมินคนแรก-เทนแนนต์เดียว) (stub).

---

## Production hardening (all sizes) / เสริมความปลอดภัย production

- [ ] **HTTPS** for any access outside a trusted office LAN
- [ ] **Unique** Postgres password (change default `firmedware` in production)
- [ ] Postgres **not** exposed to the public internet
- [ ] VPN, firewall, or IP allowlist where possible
- [ ] Automated **backups** (`pg_dump` or provider snapshots) to firm-controlled storage
- [ ] **One restore test** before real client data
- [ ] Never commit `.env`, dumps, or CSV exports to GitHub

Optional: **MFA at reverse proxy** (Authelia, Cloudflare Access, Azure AD proxy) — see [EXTENSIONS.md § 2FA](./EXTENSIONS.md#two-factor-authentication-2fa--การยืนยันตัวตนสองปัจจัย-2fa).

Full checklist: [README — Minimum production checklist](../README.md#minimum-production-checklist).

---

<a id="mini-team-1-4-people"></a>

## Mini team (1–4 people) / ทีมเล็กมาก (1–4 คน)

Includes **solo practitioners** (1 lawyer) and **2–4** attorneys with 0–1 assistant.

### Hosting

| Pattern | Notes |
|---------|--------|
| Office PC / mini-PC on LAN | Fine if only you (or the office) access on the network |
| Small VPS (1 vCPU, 2 GB RAM minimum) | Use when logging in from home, court, or mobile |
| HTTPS | Required if the instance is reachable from the internet |

### Accounts

- Typically **one** `ADMIN` (the lawyer or owner).
- Optional: one `STAFF` assistant (create after deploy under **Admin → Users**).
- **Skip** user groups — assign the lawyer directly on each matter.
- Second `ADMIN` only if someone else must reset passwords (break-glass).

### Backups

- **Weekly** minimum; solo owner is the backup contact.
- Store backups encrypted, off the same machine when possible.

### Deploy checklist (mini)

- [ ] Core deploy + password change complete
- [ ] HTTPS if remote access
- [ ] Weekly backup scheduled
- [ ] Handoff to [LAWYER_FIRM_SETUP — Mini team](./LAWYER_FIRM_SETUP.md#mini-team-1-4-people) (even if the “team” is only you)

---

<a id="small-firm-5-15-people"></a>

## Small firm (5–15 people) / สำนักงานขนาดเล็ก (5–15 คน)

### Hosting

- **One shared HTTPS URL** bookmarked by all staff.
- Suggested VM: **2 vCPU, 4 GB RAM**, 20–40 GB disk (guideline, not a hard limit).
- Office LAN server is OK if everyone is on-site; add HTTPS + VPN if hybrid.

### Accounts

- **At most 2** `ADMIN` users (primary + break-glass).
- Remaining seats: `LAWYER`, `STAFF`, `VIEWER` per [LAWYER_FIRM_SETUP role matrix](./LAWYER_FIRM_SETUP.md#small-firm-5-15-people).
- Plan **2–4 practice groups** in Admin (Litigation, Corporate, etc.) — see lawyer guide.

### Backups

- **Daily** automated backups recommended.
- Name one **backup owner** (office manager or IT).

### Security extras

- MFA at edge **recommended** for remote access.
- Review [SETUP_PLAYBOOK §3](./SETUP_PLAYBOOK.md#3-security-measures--3-มาตรการความปลอดภัย) with managing partner.

### Deploy checklist (small firm)

- [ ] Core deploy + production hardening
- [ ] Daily backups + restore test documented
- [ ] All user accounts created (no shared logins)
- [ ] Handoff email sent to partners / office manager
- [ ] Pilot week planned (4–5 users) before firm-wide matter migration

---

## Larger than 15 people? / มากกว่า 15 คน?

v1.2 **documentation and defaults target 1–15 users** on a single tenant. For **16+** staff, multiple offices, or enterprise IAM:

- Expect to **fork** the repository and design extensions (SSO, `firmId`, reporting, DMS sync).
- Do **not** assume v1.2 RBAC, groups, and ops docs scale without customization.
- Start from [EXTENSIONS.md](./EXTENSIONS.md) and your own architecture review.

**ภาษาไทย:** มากกว่า 15 คน ควร **fork** และออกแบบขยาย — ไม่ถือว่า v1.2 พร้อมใช้ตามที่ส่งมา

---

## Handoff to lawyers / ส่งมอบให้ทนายความ

Copy into email or internal wiki when login works:

```text
Subject: Firmedware is ready

Firmedware URL: https://YOUR-FIRM-URL
Your login: name@firm.com
Temporary password: (sent separately — change on first login at Account → Security)

Next steps (no technical steps):
1. Open docs/LAWYER_FIRM_SETUP.md
2. Start at "Before you start"
3. Mini team (1–4): follow the Mini team section
   Small firm (5–15): follow the Small firm section

Questions about servers/backups: contact [IT contact name]
```

**ภาษาไทย:** ส่ง URL, login, และลิงก์ LAWYER_FIRM_SETUP.md — ไม่มีคำสั่งเทคนิคในอีเมล

---

## See also / ดูเพิ่ม

| Topic | Link |
|-------|------|
| Lawyer configuration | [LAWYER_FIRM_SETUP.md](./LAWYER_FIRM_SETUP.md) |
| Documents, activity log, billing flags | [SETUP_PLAYBOOK.md §§3–6](./SETUP_PLAYBOOK.md) |
| Security model | [SECURITY.md](./SECURITY.md) |
