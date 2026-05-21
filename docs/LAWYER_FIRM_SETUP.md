# Lawyer & firm setup (non-technical) / ตั้งค่าสำนักงาน (ไม่ใช่เทคนิค)

> **Bilingual / สองภาษา:** English first, then Thai (`ภาษาไทย`).

**No Docker, no terminal, no API keys.** Use this guide **after** IT gives you a **login URL**.

Technical deploy: **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)**. Choose your path: **[START_HERE.md](./START_HERE.md)**.

**Firm size:** **Mini team (1–4)** or **small firm (5–15)**. Firmedware v1.2 is **not designed for larger firms (16+)** as shipped; bigger practices should **fork and develop** the repo ([EXTENSIONS.md](./EXTENSIONS.md)).

Quick index: **[SETUP_INDEX.md](./SETUP_INDEX.md)**.

## Contents / สารบัญ

- [What Firmedware is / is not](#what-firmedware-is--is-not--firmedware-คืออะไร--ไม่ใช่อะไร)
- [Before you start](#before-you-start--ก่อนเริ่ม)
- [Day 1 — Firm settings](#day-1--firm-settings--วันแรก--ตั้งค่าสำนักงาน)
- [Day 1 — Workflow & tags](#day-1--workflow--tags--วันแรก--สถานะงานและแท็ก)
- [Day 2 — People](#day-2--people--วันที่สอง--ผู้ใช้)
- [Mini team (1–4)](#mini-team-1-4-people)
- [Small firm (5–15)](#small-firm-5-15-people)
- [Day 2 — Groups](#day-2--groups-small-firm-only--กลุ่ม-เฉพาะสำนักงาน-5-15-คน)
- [Every matter](#every-matter-daily-workflow--ทุกงานคดี)
- [Documents](#documents--firm-rules--เอกสาร--กฎสำนักงาน)
- [AI connectors](#ai-connectors--ตัวเชื่อม-ai)
- [Go-live gate](#go-live-gate--เมื่อไหร่ถึงใช้ข้อมูลลูกความจริง)
- [Weekly habits](#weekly-habits--offboarding--นิสัยรายสัปดาห์และการลาออก)
- [Printable checklists](#printable-checklists--เช็กลิสต์พิมพ์ได้)

---

## What Firmedware is / is not / Firmedware คืออะไร / ไม่ใช่อะไร

| Is | Is not |
|----|--------|
| A shared list of clients, matters, tasks, and **links** to documents | Document storage (no PDF upload by default) |
| Matter-based access control (who is assigned sees the matter) | Automatic sync with Google Drive / SharePoint permissions |
| An audit trail of who changed what | Legal advice or ethics compliance certification |
| Bilingual Thai/English UI | AI that runs on your client data by default |

**Files live in** Google Drive, OneDrive, SharePoint, Dropbox, or a firm folder. **Firmedware stores the link and notes only.**

**ภาษาไทย:** ไฟล์อยู่ใน DMS ภายนอก Firmedware เก็บลิงก์และหมายเหตุ

---

## Before you start / ก่อนเริ่ม

Ask IT (or whoever deployed) for:

- [ ] **Firmedware URL** (bookmark it)
- [ ] **Your email and temporary password** (change at **Account → Security** on first login)
- [ ] **Where firm documents are stored** (e.g. “Corporate matters → SharePoint /Clients”)

**Do not** install GitHub or run the app on your laptop for daily work — use the shared URL.

**ภาษาไทย:** ขอ URL และบัญชีจาก IT อย่ารันแอปแยกบนเครื่องตัวเอง

---

## Day 1 — Firm settings / วันแรก — ตั้งค่าสำนักงาน

**Who:** Managing lawyer or designated admin.

| Step | Where | Action |
|------|--------|--------|
| Firm name, timezone, language | **Admin → Settings** | Set firm display name; `Asia/Bangkok` if Thailand |
| Security | **Admin → Security** | Keep confidentiality notice **on**; document permission confirm **on** |
| AI connectors | **Admin → AI connectors** | Leave **disabled** until written firm AI policy exists |

Optional: [Thailand templates](./jurisdictions/thailand/README.md) for statuses and policies (not legal advice).

---

## Day 1 — Workflow & tags / วันแรก — สถานะงานและแท็ก

| Step | Where | Action |
|------|--------|--------|
| Matter statuses | **Admin → Workflow statuses** | Keep or edit 5–10 statuses you actually use (intake → active → closed) |
| Tags (optional) | **Admin → Tags** | e.g. Urgent, Litigation, Corporate |

**Mini team:** one lawyer can decide alone. **Small firm:** agree statuses with partners first.

---

## Day 2 — People / วันที่สอง — ผู้ใช้

<a id="mini-team-1-4-people"></a>

### Mini team (1–4 people) / ทีมเล็กมาก (1–4 คน)

| Person | Suggested role |
|--------|----------------|
| Solo lawyer | `ADMIN` (you) |
| 2–4 attorneys | Each `LAWYER` (or one `ADMIN` + others `LAWYER`) |
| Assistant | `STAFF` (can add tasks and document links) |
| Bookkeeper read-only | `VIEWER` (optional) |

- Create accounts: **Admin → Users → New**
- **Do not share** one login
- **Skip groups** — on each matter, assign **yourself** (and assistant if any)

<a id="small-firm-5-15-people"></a>

### Small firm (5–15 people) / สำนักงานขนาดเล็ก (5–15 คน)

| Seats (example) | Role |
|-----------------|------|
| Managing partner + office/IT contact | `ADMIN` (**max 2**) |
| Attorneys (3–8) | `LAWYER` |
| Paralegals / legal assistants (2–5) | `STAFF` |
| Billing clerk or intern | `VIEWER` or `STAFF` |

- Create **individual** accounts for everyone
- **Never** more than **two** admins

---

## Day 2 — Groups (small firm only) / กลุ่ม (เฉพาะสำนักงาน 5–15 คน)

**Mini team:** skip this section.

**Small firm:**

1. **Admin → Groups** — create 2–4 groups (e.g. Litigation, Corporate, Advisory).
2. Add members to each group.
3. On every matter: assign **lead lawyer** + **group**; optional **directory path** (folder hint in Drive/SharePoint).

Non-admins only see clients and matters they are assigned to (directly or via group).

**ภาษาไทย:** สำนักงาน 5–15 คน ควรใช้กลุ่ม; ทีม 1–4 คน ข้ามส่วนนี้

---

## Every matter (daily workflow) / ทุกงาน/คดี

1. **Clients** — create or select client  
2. **Matters** — new matter, title, status  
3. **Assignments** — mini: assign people; small: assign lawyer + group  
4. **Document links** — paste **one canonical link** per document (Drive/SharePoint/etc.); confirm permission warning  
5. **Tasks** — deadlines and assignee  

**Do not** paste full client names or privileged text into external AI tools (ChatGPT, etc.) unless firm policy allows.

---

## Documents — firm rules / เอกสาร — กฎสำนักงาน

- [ ] Real files stay in the **DMS**; Firmedware has the **link** only  
- [ ] Confirm **document permission** when the app asks  
- [ ] Avoid “anyone with the link” sharing unless policy allows  
- [ ] **Small firm:** agree folder pattern (e.g. `ClientCode/MatterNumber/`) in Drive/SharePoint  

Details: [SETUP_PLAYBOOK §4](./SETUP_PLAYBOOK.md#4-document-and-drive-links--4-ลิงก์เอกสารและไดรฟ์).

---

## AI connectors / ตัวเชื่อม AI

**Technical setup & API (for IT / developers):** [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md)

### Lawyer / office manager steps

| Step | Action |
|------|--------|
| 1 | Draft or adopt a **written AI use policy** (template: [Thailand ai-use-policy.md](./jurisdictions/thailand/ai-use-policy.md) — adapt with qualified advisors). |
| 2 | Partners approve whether any third-party AI is allowed, for which tasks, and whether client or privileged information may be used. |
| 3 | Until approved, leave **Admin → AI connectors** **disabled** (default in v1.2). |
| 4 | If approved, an **Admin** enables connectors, sets **mode** (e.g. `WORKFLOW_TEMPLATES_ONLY` for generic checklists only), and records the firm’s preferred provider label — **not** an API key. |
| 5 | IT stores real API keys on the **server** only when a custom integration or fork actually calls OpenAI/Claude/etc. Core v1.2 does not call providers. |

**Rules (default):**

- **No** sending client names, matter notes, privileged communications, or document links/paths to third-party AI unless policy and mode explicitly allow it.  
- Lawyers must **review** any AI output before client use.  
- Firmedware does **not** upload files or read Google Drive / SharePoint contents for AI.

**ภาษาไทย:** ปิดตัวเชื่อม AI จนกว่าจะมีนโยบายเป็นลายลักษณ์ เปิดที่ Admin → AI connectors เฉพาะเมื่ออนุมัติ เก็บ API key ที่เซิร์ฟเวอร์เท่านั้น รายละเอียดเทคนิคดู [AI_CONNECTOR_SETUP.md](./AI_CONNECTOR_SETUP.md)

---

## Go-live gate / เมื่อไหร่ถึงใช้ข้อมูลลูกความจริง

**Ask IT to confirm:**

- [ ] Backups run and were **restored once** in a test  
- [ ] HTTPS works on the firm URL  
- [ ] Default `changeme` password is **not** in use  

**Firm:**

- [ ] Start with **new matters only** (do not migrate entire history on day one)  
- [ ] **Small firm:** optional **pilot** — 4–5 users for one week, then roll out  

---

## Weekly habits & offboarding / นิสัยรายสัปดาห์และการลาออก

| Cadence | Action |
|---------|--------|
| Each new matter | Assignments correct before adding confidential notes |
| When someone leaves | **Admin → Users → Edit** → turn **Active** off same day |
| **Small firm** monthly | Admin reviews inactive users and exports (if any) |

---

## Larger than 15 people? / มากกว่า 15 คน?

These guides stop at **15 users** on one deployment. Bigger firms need custom workflow, SSO, and often multi-office design — plan a **fork** and development effort; see [EXTENSIONS.md](./EXTENSIONS.md). v1.2 core will feel constrained without that work.

**ภาษาไทย:** มากกว่า 15 คน ควรวางแผน fork และพัฒนาเพิ่ม ไม่ใช่แค่เปิดใช้ v1.2 ตามที่ส่งมา

---

## Printable checklists / เช็กลิสต์พิมพ์ได้

<a id="mini-team-go-live-1-4"></a>

### Mini team go-live (1–4)

- [ ] Login URL bookmarked; password changed  
- [ ] Admin → Settings and Security saved  
- [ ] Workflow statuses agreed  
- [ ] User accounts created (no shared login)  
- [ ] IT: backups scheduled  
- [ ] Document rule: files in DMS, links in Firmedware  
- [ ] AI connectors disabled  
- [ ] First real matter created with assignment + one document link  
- [ ] External AI policy: no client names unless approved  

<a id="small-firm-go-live-5-15"></a>

### Small firm go-live (5–15)

- [ ] All of mini checklist above  
- [ ] At most 2 admins; role matrix applied  
- [ ] 2–4 practice groups created and used on matters  
- [ ] Pilot users trained (4–5 people, one week)  
- [ ] Folder naming convention communicated  
- [ ] Partners signed off on statuses and confidentiality notice  
- [ ] Offboarding process written (deactivate user same day)  
- [ ] Monthly admin review calendar invite  
- [ ] AI policy acknowledged (connectors stay off until approved)  
- [ ] No “each laptop runs its own database”  

---

## See also / ดูเพิ่ม

| Topic | Link |
|-------|------|
| Technical deploy | [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) |
| Security, activity, billing | [SETUP_PLAYBOOK.md §§3–6](./SETUP_PLAYBOOK.md) |
| Thailand pack | [jurisdictions/thailand/](./jurisdictions/thailand/README.md) |
