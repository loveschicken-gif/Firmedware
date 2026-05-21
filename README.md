# Firmedware

Lightweight, open-source law firm tracking for **mini teams (1–4)** and **small firms (5–15)**. Store **metadata and document references** (external URLs, local paths, manual references) only—no PDF uploads, no AI execution by default (optional policy gateway stubs), no document proxying. **Not aimed at larger firms (16+)** as shipped; fork and extend this repo for enterprise needs.

**A legal workflow operating layer**—not a document vault, not an AI lawyer, and not accounting software. Built as a **Thai/English law firm workflow starter kit** (bilingual UI, Bangkok default timezone, seeded Thai workflow labels) that firms can adapt for Thailand and cross-border practice. Firmedware provides the technical foundation; **lawyers and legal operations professionals** should define the legal workflow, risk controls, confidentiality rules, status taxonomy, and operational playbooks for each firm.

**Version 1.2** — single tenant: one firm per deployment. The GitHub repository contains **application code only**; firm records live in **PostgreSQL** on your deployment, and legal documents stay in **external storage** (Google Drive, OneDrive, SharePoint, Dropbox, or a local shared folder). See [Code vs Data vs Documents](#code-vs-data-vs-documents).

### Technical foundation

Firmedware ships with:

- Next.js 16, TypeScript, PostgreSQL, Prisma, Auth.js, bcrypt password hashing, JWT sessions
- Matter-level RBAC (Admin, Lawyer, Staff, Viewer) and assigned-matter visibility
- Soft delete / archive on main records; user deactivation instead of hard delete
- Append-only, DB-protected activity logs with CSV export
- Bilingual Thai/English UI and workflow status labels
- Document reference registry — external URLs (Drive, SharePoint, OneDrive, Dropbox), local/manual paths (NAS, UNC, synced folders), and manual references (paper files, archive boxes)
- Docker Compose deployment and operational docs
- No file bytes stored, no AI execution by default (policy gateway stubs only), no document proxying or parsing

```text
Define the workflow.
Define the risk.
Define the confidentiality rules.
Define the matter statuses.
Define the document taxonomy.
Define the closing checklist.
Define the AI policy.
Define the security expectations.
```

## Getting started / เริ่มต้นติดตั้งสำนักงาน

Use the **setup guides** (not this README alone) when putting Firmedware into production.

| Guide | Who | Purpose |
|-------|-----|---------|
| **[docs/SETUP_INDEX.md](docs/SETUP_INDEX.md)** | Everyone | One-screen index — steps, firm size, checklists |
| **[docs/START_HERE.md](docs/START_HERE.md)** | Everyone | Choose technical vs lawyer path |
| **[docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md)** | IT / developer | Docker, HTTPS, backups, handoff email |
| **[docs/LAWYER_FIRM_SETUP.md](docs/LAWYER_FIRM_SETUP.md)** | Lawyers & office managers | Settings, users, matters — **no command line** |
| **[docs/SETUP_PLAYBOOK.md](docs/SETUP_PLAYBOOK.md)** | Reference | Security, documents, activity log, optional features (§§3–6) |
| **[docs/SECURITY.md](docs/SECURITY.md)** | Admin / partner | Threat model, retention, AI governance |

**Firm size (v1.2):**

| Size | People | Guides |
|------|--------|--------|
| **Mini / small team** | 1–4 | [DEPLOY § Mini](docs/DEPLOY_GUIDE.md#mini-team-1-4-people) · [LAWYER § Mini](docs/LAWYER_FIRM_SETUP.md#mini-team-1-4-people) |
| **Small firm** | 5–15 | [DEPLOY § Small](docs/DEPLOY_GUIDE.md#small-firm-5-15-people) · [LAWYER § Small](docs/LAWYER_FIRM_SETUP.md#small-firm-5-15-people) |
| **16+** | Not targeted as-is | [docs/EXTENSIONS.md](docs/EXTENSIONS.md) — fork and develop |

**ภาษาไทย:** เริ่มที่ [SETUP_INDEX](docs/SETUP_INDEX.md) — ติดตั้งเทคนิค [DEPLOY_GUIDE](docs/DEPLOY_GUIDE.md) · ทนายความ [LAWYER_FIRM_SETUP](docs/LAWYER_FIRM_SETUP.md)

## Code vs Data vs Documents

Firmedware separates application code, application records, and legal documents.

| Layer | Stored where | What it contains |
|---|---|---|
| Application code | GitHub repository / deployed server | Firmedware source code |
| Application database | PostgreSQL | Users, clients, matters, tasks, tags, statuses, activity logs, and document links |
| Legal documents | External storage chosen by the firm | Google Drive, OneDrive, SharePoint, Dropbox, local shared folder, or another document system |
| Backups | Firm-controlled backup location | Database backup files, usually created with `pg_dump` |

Firmedware does not store document files by default. It stores metadata and external document links only.

The GitHub repository does not contain the firm’s client data unless a firm mistakenly commits database dumps, `.env` files, seed data with real information, exported CSV files, document links, or legal documents.

Do not commit confidential firm data to GitHub.

## Where Firm Data Is Stored

Firmedware data is stored in the PostgreSQL database connected to the deployed application.

In the default Docker Compose setup, PostgreSQL data is stored in the Docker volume used by the database service. The firm or maintainer should back up this database regularly using a tool such as `pg_dump`.

Examples of records stored in PostgreSQL:

- User accounts
- Roles and permissions
- Clients
- Matters
- Tasks
- Tags
- Workflow statuses
- Document link metadata
- Activity logs
- Firm settings

Examples of records not stored in PostgreSQL by default:

- PDF files
- Word documents
- Scanned documents
- Images
- Full document contents
- AI prompts or outputs, unless a future fork explicitly adds that feature

## How Multiple Users Access the Same Firm

Firmedware is single-tenant: one firm per deployment.

A law firm should deploy one shared Firmedware instance connected to one PostgreSQL database. Lawyers, staff, and viewers should access that same deployed application through a shared internal URL or private domain.

Recommended setup:

1. An admin or IT maintainer deploys Firmedware once.
2. The deployment connects to one PostgreSQL database.
3. The seed admin logs in and changes the default password.
4. The admin creates user accounts for lawyers, staff, and viewers.
5. Users log in through the same application URL.
6. Access is controlled by role, matter assignment, and group assignment.

Users should not each run separate local copies if the firm wants shared data. Separate local installations create separate databases and will not automatically sync.

## Important: GitHub Is Not the Firm Database

Cloning the GitHub repository gives a user the Firmedware code, not the firm’s data.

If two people clone the repo and run Firmedware separately on their own computers, they will create separate local databases. Their records will not be shared unless both installations are deliberately configured to connect to the same PostgreSQL database.

For a real firm deployment, use one shared server and one shared database.

## Deployment Models

| Model | Data sharing | Best for | Notes |
|---|---|---|---|
| Local developer install | No shared firm data by default | Development and testing | Each machine has its own local database unless configured otherwise |
| Office LAN server | Yes, if everyone connects to the same server | Small office | App runs on one office machine or server; users access through the local network |
| Private cloud VM | Yes | Remote or hybrid firm | Use HTTPS, firewall, VPN, or IP allowlist |
| Managed deployment | Yes | Firms without technical staff | IT provider maintains app, database, backups, and updates |

For production use, the recommended model is one shared deployment, one shared PostgreSQL database, and controlled user accounts.

## Firm setup by size / ติดตั้งตามขนาดสำนักงาน

**Index:** [docs/SETUP_INDEX.md](docs/SETUP_INDEX.md) · **Overview:** [docs/START_HERE.md](docs/START_HERE.md)

### Mini / small team (1–4 people)

Includes **solo practitioners** and **2–4** attorneys (optional assistant).

- One shared deployment URL (office PC, mini-PC, or small VPS).
- Usually **one** admin account; **skip** practice groups — assign lawyers directly on matters.
- Weekly database backups minimum.
- Lawyer steps: [LAWYER_FIRM_SETUP — Mini team](docs/LAWYER_FIRM_SETUP.md#mini-team-1-4-people).

### Small firm (5–15 people)

Example: five to fifteen people sharing one tracker.

- Deploy once on an office server or private cloud VM with **HTTPS**.
- One PostgreSQL database; **at most two** admin accounts.
- Create individual logins; use **2–4 practice groups** on matters.
- Daily backups; optional one-week pilot with 4–5 users before firm-wide rollout.
- Technical: [DEPLOY_GUIDE — Small firm](docs/DEPLOY_GUIDE.md#small-firm-5-15-people) · Lawyers: [LAWYER_FIRM_SETUP — Small firm](docs/LAWYER_FIRM_SETUP.md#small-firm-5-15-people).

### Correct vs incorrect (all sizes)

**Correct:**

- One deployment, one database, one URL for everyone.
- Documents in Drive / SharePoint / Dropbox / shared folder; **links** in Firmedware.
- Regular `pg_dump` (or provider) backups.

**Incorrect:**

- Each lawyer clones GitHub and runs a separate local database (records do not sync).
- Shared admin password or `changeme` left in production.

**ภาษาไทย:** ถูก = หนึ่ง URL หนึ่งฐานข้อมูล · ผิด = แต่ละคนรัน local แยกกัน

## Do Not Commit Secrets or Firm Data

Never commit the following to GitHub:

- `.env`
- `DATABASE_URL`
- `AUTH_SECRET`
- Seed admin password
- Database backup files
- CSV exports
- Client names
- Matter records
- Document links
- Real legal documents
- Screenshots containing confidential data
- AI provider API keys, if a future fork adds AI connectors

Use `.gitignore` to exclude local secrets, backups, exports, screenshots, and temporary files.

## Features

- **Clients & companies** — contact info, status, optional notes, tags
- **Matters** — case tracking with user/group assignments and status
- **Document link registry** — Google Drive, SharePoint, OneDrive, Dropbox, local folders (URLs only)
- **Tasks & deadlines** — overdue and weekly views; optional `deadlineType` convention per firm
- **Search** — clients, matters, documents, tags, notes (when enabled)
- **Activity timeline** — append-only audit log (immutable in DB); CSV export; matter-scoped for assignees; firm-wide for admins
- **Role-based access** — Admin, Lawyer, Staff, Viewer ([roles explained below](#user-roles))
- **Matter-level visibility** — non-admins only see assigned matters
- **Account hub** — profile, password, optional admin shortcuts
- **Optional features** — toggle entity notes, comments extension point, and billing/payment tracking per firm
- **Billing (optional)** — invoice metadata, external invoice links, and payment status — not accounting software; no payment processing
- **Security (v1.2)** — login lockout, confidentiality notice, document permission confirmation, security audit categories
- **Custom workflow statuses** — configurable matter (and contract) statuses with Thai/English labels
- **Document sensitivity** — optional confidentiality level per link
- **Production operations** — retention, threat model, deployment modes, go-live checklist — see [Law firm operations](#law-firm-operations-and-production-readiness)

## Model stack for legal workflow development

### Lawyer-led development model

Firmedware is designed as a technical foundation for small law firm operations. The software provides the structure for clients, matters, tasks, document links, tags, user roles, groups, audit logs, and bilingual Thai/English workflows. However, the most important configuration work should be led by lawyers or legal operations professionals.

Firmedware should not be treated as a finished “one-size-fits-all” legal management system. Each firm should adapt the workflow, permissions, confidentiality rules, matter statuses, document categories, and operating playbooks to match its own practice areas, ethical duties, client expectations, and jurisdictional requirements.

#### What lawyers should define

| Area | What lawyers should define |
| --- | --- |
| Matter workflow | Intake stages, review stages, pending statuses, closing stages, and escalation rules |
| Contract workflow | Drafting, internal review, counterparty review, negotiation, signing, renewal, expiry, and termination statuses |
| Client categories | Individual, company, prospect, active client, inactive client, high-risk client, repeat client |
| Document taxonomy | Contract, evidence, court filing, memo, correspondence, ID document, corporate document, invoice, approval record |
| Confidentiality levels | Normal, confidential, highly confidential, privileged, restricted-access |
| User roles | Who can view, create, update, archive, export, or manage users/groups/tags |
| Matter access rules | Who should be assigned directly, which groups inherit access, and when access should be removed |
| Deadline policy | Court deadlines, client deadlines, internal deadlines, limitation periods, renewal dates, payment deadlines |
| Closing checklist | Final documents linked, client notified, payment checked, tasks completed, folder reviewed, closing note added |
| Audit review policy | Who reviews activity logs, how often, and what events require escalation |
| External document policy | How Google Drive, OneDrive, SharePoint, Dropbox, or local folder permissions should be managed outside Firmedware |
| AI usage policy | Whether staff may use ChatGPT, Claude, Gemini, or other AI tools, and what client information must never be entered into them |

#### Recommended legal workflow add-ons

The following features can be added or customized by firms:

1. **Custom matter statuses**
   - New intake
   - Conflict check
   - Open
   - Pending client documents
   - Drafting
   - Filed
   - Waiting for court/agency
   - Negotiation
   - Closed
   - Archived

2. **Custom contract statuses**
   - Intake
   - First draft
   - Internal review
   - Sent to counterparty
   - Negotiation
   - Client review
   - Ready to sign
   - Signed
   - Expired
   - Terminated

   *CONTRACT workflow rows are seeded and admin-manageable; a dedicated contract entity and UI require a fork—see [EXTENSIONS.md](docs/EXTENSIONS.md).*

3. **Document sensitivity labels**
   - Normal
   - Confidential
   - Highly confidential
   - Privileged
   - Restricted *(not a built-in enum—use tags or a fork if needed)*

4. **Deadline types**
   - Court deadline
   - Filing deadline
   - Client deadline
   - Internal deadline
   - Payment deadline
   - Contract renewal
   - Limitation period

5. **Payment and invoice tracking**
   - Draft invoice
   - Sent invoice
   - Partially paid
   - Paid
   - Overdue
   - Cancelled
   - Written off

   *(optional core module — enable under Admin → Firm settings; metadata and status only, not accounting)*

6. **Conflict-checking playbook**
   - Opposing parties
   - Related parties
   - Affiliates
   - Counterparties
   - Court or agency
   - Jurisdiction
   - Internal conflict notes

7. **Matter closing checklist**
   - All tasks completed
   - Final documents linked
   - Client notified
   - Outstanding invoices checked
   - External folder permission reviewed
   - Closing note added

#### Already in this repo

- **Matter workflow statuses** — seeded examples (intake through archived) with Thai/English labels; edit under **Admin → Workflow statuses**
- **Document sensitivity** — `NORMAL`, `CONFIDENTIAL`, `HIGHLY_CONFIDENTIAL`, `PRIVILEGED` on each document link
- **Tags** — client, matter, and document taxonomy via shared tags
- **Task `deadlineType`** — free-text field for firm-specific deadline conventions
- **Conflict-check stage** — example status `conflict_check` in seed data; process steps are firm-defined in playbooks

## Security and confidentiality model

Firmedware is designed for legal environments where confidentiality, access control, and operational accountability are important.

The current design follows a conservative approach:

- Firmedware stores metadata and external document links only.
- Firmedware does not store PDF, Word, image, or scanned document files by default.
- Firmedware does not fetch, parse, proxy, summarize, or transmit document contents.
- Document access remains controlled by the firm’s external storage provider, such as Google Drive, OneDrive, SharePoint, Dropbox, or a local shared folder.
- Matter visibility is scoped by direct user assignment or active group assignment.
- Admins can manage users, groups, tags, settings, and firm-wide activity.
- Users may be deactivated instead of deleted.
- Main records use soft delete/archive behavior.
- Activity logs are append-only and intended to be auditable (DB-level protection against update/delete).

Metadata can be sensitive even without file storage—see [Metadata sensitivity](#metadata-sensitivity).

### Important confidentiality note

Firmedware can help organize legal workflows, but it does not replace a law firm’s confidentiality policy, access-control policy, document-retention policy, cybersecurity program, or professional responsibility obligations.

Firms using Firmedware should maintain their own policies for:

- Client confidentiality
- Privileged information
- Document permissions
- External sharing
- Password management
- Remote access
- Device security
- Backup and disaster recovery
- AI tool usage
- Staff onboarding and offboarding

### External document permissions

Because Firmedware stores external document links, the firm must ensure that permissions in the external storage system are properly configured.

Before adding a document link, users should confirm that the file or folder is restricted to authorized users only.

Examples:

- Google Drive folder permissions should not be set to “Anyone with the link” unless intentionally approved.
- OneDrive or SharePoint links should be limited to firm-authorized users where possible.
- Dropbox links should be reviewed before sharing.
- Local folder paths should be available only on secured firm devices or networks.

Firmedware tracks the link, but the external storage provider controls access to the actual file.

## Security standards and compliance notes

Firmedware is **not** currently certified under SOC 2, ISO/IEC 27001, or any other formal security certification scheme. Any production deployment should be independently reviewed before use with sensitive client information.

**Firmedware is not SOC 2 certified, ISO/IEC 27001 certified, PDPA compliant by default, or professionally approved by any bar or regulator.** The software may support certain controls, but compliance depends on deployment, policies, evidence, training, monitoring, and organizational practice.

References to legal, regulatory, or security frameworks in this documentation are for **orientation only**. They are not legal advice, compliance advice, cybersecurity advice, or certification. Firms should consult qualified professionals and official sources before relying on Firmedware in production.

However, the project is designed to support security practices that can be **mapped to** recognized frameworks, including:

- [SOC 2 Trust Services Criteria](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022) (AICPA): Security, Availability, Processing Integrity, Confidentiality, and Privacy
- [ISO/IEC 27001](https://www.iso.org/standard/27001) (ISO) information security management principles
- Professional responsibility duties relating to confidentiality, competence, supervision, and secure communication—firms should review applicable bar rules, ethics guidance, and official publications in their jurisdiction
- Firm-specific cybersecurity, privacy, and document-retention policies

### Suggested security baseline for deployments

Production deployments should consider:

| Control area | Recommended measure |
| --- | --- |
| Access control | Role-based access control, least privilege, active user review |
| Authentication | Strong passwords, session timeout, 2FA through reverse proxy or future in-app 2FA |
| Network security | HTTPS, VPN or IP allowlist for private deployments |
| Logging | Immutable activity logs, login logs, export logs, admin action logs |
| Data protection | Encrypted database volume, encrypted backups, restricted database access |
| Backup | Scheduled encrypted backups, restore testing, offsite backup copy |
| External documents | Permission review for Drive, OneDrive, SharePoint, Dropbox, and local folders |
| Admin governance | Named admin owners, role-change review, user offboarding checklist |
| Incident response | Process for suspected unauthorized access, lost device, leaked document link, or compromised account |
| AI usage | Clear policy on whether client information may be entered into ChatGPT, Claude, Gemini, or other AI tools |
| Vendor review | Review hosting providers, storage providers, email providers, and backup providers |

Implementation detail: [SETUP_PLAYBOOK §3](docs/SETUP_PLAYBOOK.md#3-security-measures--3-มาตรการความปลอดภัย) · [SECURITY.md](docs/SECURITY.md) · [LAWYER_FIRM_SETUP](docs/LAWYER_FIRM_SETUP.md)

### SOC 2 note

SOC 2 is not a software feature that can be enabled in code. It is an independent attestation process based on controls, evidence, policies, monitoring, and operational practice.

Firmedware may support SOC 2-style controls such as access control, audit logging, confidentiality warnings, soft delete, and admin review workflows. A firm or vendor seeking SOC 2 would still need formal policies, control testing, evidence collection, and an independent audit.

### ISO/IEC 27001 note

ISO/IEC 27001 is an information security management system standard. Firmedware can support parts of an ISMS, such as access control, auditability, asset tracking, and operational logging, but certification requires an organization-level security management program.

### Legal ethics note

See [Professional responsibility disclaimer](#professional-responsibility-disclaimer) under [Law firm operations and production readiness](#law-firm-operations-and-production-readiness).

## Law firm operations and production readiness

### Metadata sensitivity

Firmedware does not store document contents by default, but metadata can still be sensitive.

Examples of sensitive metadata include:

- Client names
- Matter titles
- Case numbers
- Opposing party names
- Document titles
- Deadline descriptions
- Task notes
- External folder names
- External document URLs
- Activity history

Firms should not assume that metadata-only systems are low risk. Access control, logging, backup protection, and confidentiality policies still matter.

### Privilege and confidentiality warning

Firmedware may contain metadata related to privileged or confidential legal matters, even if it does not store document files.

Matter names, client names, notes, task descriptions, document titles, deadlines, and external links may reveal sensitive information.

Firms should treat Firmedware data as confidential legal operations data and limit access accordingly. The in-app confidentiality notice (`FirmSettings.confidentialityNoticeEnabled`) reminds users on login; it does not replace firm policy or privilege review.

### Basic threat model

Firmedware is designed to reduce common operational risks in small law firm workflows, but it does not remove all security risks.

Primary risks include:

- Unauthorized user access
- Weak or shared passwords
- Overly broad Google Drive, OneDrive, SharePoint, Dropbox, or local folder permissions
- Leaked external document links
- Lost or compromised staff devices
- Unreviewed user roles after staff departure
- Accidental export of activity logs or matter data
- Misuse of AI tools with confidential or privileged information
- Unencrypted or untested backups
- Deployment without HTTPS, VPN, or IP restrictions

Firmedware’s controls, such as RBAC, matter-scoped visibility, activity logs, soft delete, and document permission warnings, should be combined with firm-level policies and secure deployment practices. See [SECURITY.md — Basic threat model](docs/SECURITY.md#basic-threat-model) for a risk-to-control mapping.

### Data retention and deletion

Firmedware uses soft delete/archive behavior for core records (`deletedAt` on clients, matters, document links, tasks, tags, and groups). This helps preserve auditability and reduce accidental data loss.

Each firm should define its own retention policy for client records, matter records, document links, task history, activity logs, user accounts, exported CSV files, and database backups. Firmedware does not decide how long legal records should be retained.

Full guidance: [SECURITY.md — Data retention and deletion](docs/SECURITY.md#data-retention-and-deletion).

### Deployment modes

See [Deployment Models](#deployment-models) for how code, data, and shared access fit together. Summary:

| Mode | Description | Best for |
| --- | --- | --- |
| Local development | Runs on a developer machine | Testing and customization |
| Office LAN deployment | Runs on a local server or mini PC inside the office | Small firms that do not need remote access |
| Private cloud deployment | Runs on a cloud VM with HTTPS, firewall, VPN, or IP allowlist | Firms needing secure remote access |
| Managed internal deployment | Maintained by an IT provider or technical consultant | Firms without in-house technical staff |

Production deployments should not use default credentials, public HTTP, weak passwords, or unencrypted backups. Use **one shared deployment and one PostgreSQL database** so all users see the same firm records.

### Minimum production checklist

Before using Firmedware with real client or matter information:

- Change the seeded admin password.
- Use a strong `AUTH_SECRET`.
- Deploy over HTTPS.
- Restrict access by VPN, firewall, or IP allowlist where possible.
- Review all user roles.
- Disable inactive users.
- Configure database backups.
- Encrypt backups where possible.
- Test backup restoration.
- Review external document permissions.
- Avoid “anyone with the link” document sharing unless approved.
- Set a firm AI usage policy.
- Set an offboarding process for departing staff.
- Review activity logs periodically.
- Document who is responsible for administration.

Step-by-step: [SETUP_INDEX](docs/SETUP_INDEX.md) · [DEPLOY_GUIDE](docs/DEPLOY_GUIDE.md) (technical) · [LAWYER_FIRM_SETUP](docs/LAWYER_FIRM_SETUP.md) (firm configuration) · [SETUP_PLAYBOOK §3](docs/SETUP_PLAYBOOK.md#3-security-measures--3-มาตรการความปลอดภัย) (deep reference).

### AI connector governance checklist

Future AI connectors should not be enabled until the firm has answered:

- What AI provider will be used?
- Will data be sent to a third party?
- Are prompts and outputs retained by the provider?
- Is client confidential information allowed?
- Is privileged information allowed?
- Is client consent required?
- Who may use the connector?
- Which matters are excluded?
- Are prompts logged?
- Are outputs logged?
- Who reviews AI outputs before client use?
- Can the AI connector access external document links?
- Can the AI connector modify records?
- Can the AI connector export data?

**Default position:** AI connectors should be disabled unless a firm has adopted a written AI use policy. See [SECURITY.md — AI connector governance](docs/SECURITY.md#ai-connector-governance) and [AI Connector Gateway](#ai-connector-gateway) below.

### AI Connector Gateway

Firmedware does **not** run AI by default. v1.2 adds an optional **AI Connector Gateway** — firm settings, conservative policy engine, and HTTP routes that **approve or deny** a request before any external AI call. Core does **not** invoke provider APIs; API keys are **not** stored in the database.

| Layer | What |
|-------|------|
| **Admin setup** | **Admin → AI connectors** — enable flag, connector mode, preferred provider label (metadata only) |
| **Policy API** | `GET /api/ai/capabilities`, `POST /api/ai/policy-check` (Admin, Lawyer, Staff; not Viewer) |
| **Code** | `src/lib/ai/` — `types`, `policy`, `redaction`, `registry`, `gateway`, `activity` |
| **Firm settings** | `enableAIConnectors` (default `false`), `aiConnectorMode`, `aiConnectorProvider` |

**Setup and API integration (full guide):** [docs/AI_CONNECTOR_SETUP.md](docs/AI_CONNECTOR_SETUP.md) — governance checklist, connector modes, request/response examples, recommended integration flow, fork pattern for OpenAI/Claude/etc., and environment variables.

**Warning:** Do not automatically send client names, matter notes, privileged communications, document references, external links, local paths, or personal data to third-party AI.

| Provider | Typical use (policy-gated; fork implements HTTP) |
|----------|--------------------------------------------------|
| OpenAI / ChatGPT | Workflow/checklist generation; Custom GPT Actions calling `policy-check` first |
| Anthropic Claude | Drafting, review, playbook assistance |
| Google Gemini | Workspace-adjacent firms — **do not** fetch Drive contents from Firmedware |
| Perplexity | Public web research only — not client-specific facts |
| Local models | On-prem inference — still requires security review |

Store provider keys in server environment variables or a secret manager — **never** in `FirmSettings` or git. Tests: `npm run test:ai` (AI-GW-001 … AI-GW-012).

### What Firmedware does not do

Firmedware does not:

- Provide legal advice or replace lawyer supervision and professional judgment
- Replace document management systems, accounting software, or cybersecurity review
- Provide SOC 2 or ISO/IEC 27001 certification
- Control permissions inside Google Drive, OneDrive, SharePoint, Dropbox, or local folders
- Verify whether external document links are properly restricted
- Automatically detect conflicts of interest, calculate court deadlines, preserve records for litigation hold, or classify privileged documents
- Automatically prevent users from copying external links

Full list: [SECURITY.md — What Firmedware does not do](docs/SECURITY.md#what-firmedware-does-not-do).

### Future modules and fork ideas

Potential future modules include:

- In-app 2FA / WebAuthn
- AI connector execution layer (gateway stubs exist; providers still disabled)
- Extended billing reports (fork)
- Contract entity and contract lifecycle tracking
- Conflict-checking module
- Client intake forms
- Matter closing checklist builder
- Deadline type templates
- Document permission review checklist
- Practice-area templates
- Data export and import tools
- Matter archive review workflow
- Client portal, if a firm chooses to build one

Implementation paths: [EXTENSIONS.md](docs/EXTENSIONS.md). Lawyer-defined templates: [Lawyer contribution roadmap](#lawyer-contribution-roadmap).

### Professional responsibility disclaimer

Firmedware is a workflow and tracking tool. It does not determine whether a firm’s use of the software complies with professional responsibility rules, privacy laws, court rules, client agreements, cybersecurity requirements, or document-retention obligations.

Law firms should review their own duties before using Firmedware with real client or matter information. Firmedware is not legal advice, cybersecurity advice, compliance certification, or a substitute for professional review.

## Thailand-focused legal operations notes

**Thailand-focused workflow notes are operational templates only.** They should be reviewed and adapted by qualified Thai legal professionals before use with real client or matter information.

Firmedware is designed to be adaptable for Thai law firms, Thai lawyers, and cross-border teams working with Thai clients or Thai legal documents.

The system supports Thai/English UI and workflow labels, but firms remain responsible for configuring the system according to Thai law, professional responsibility rules, client confidentiality obligations, privacy obligations, court practice, document-retention requirements, and internal firm policy.

Operational templates: [Thailand jurisdiction pack](docs/jurisdictions/thailand/README.md).

### Thai legal practice considerations

Thai firms using Firmedware should consider configuring:

| Area | Thai-law-oriented configuration |
| --- | --- |
| Client confidentiality | Internal rules for protecting ลูกความ, ข้อมูลคดี, เอกสาร, and privileged/confidential communications |
| PDPA | Personal data handling rules for clients, counterparties, employees, witnesses, directors, shareholders, and contact persons |
| Lawyer conduct | Confidentiality duties under Thai lawyer professional conduct rules |
| Document taxonomy | หนังสือมอบอำนาจ, บัตรประชาชน, หนังสือรับรองบริษัท, สัญญา, คำฟ้อง, คำให้การ, พยานหลักฐาน, บันทึกข้อความ, ใบแจ้งหนี้ |
| Matter types | Litigation, corporate, contract review, labor, IP, immigration, real estate, family, tax, PDPA/data privacy |
| Deadline types | วันนัดศาล, วันครบกำหนดยื่นเอกสาร, อายุความ, วันครบกำหนดชำระเงิน, วันต่ออายุสัญญา, วันส่งเอกสารให้ลูกความ |
| External document storage | Google Drive, OneDrive, SharePoint, Dropbox, or local folders should be permission-restricted |
| Billing/payment tracking | Invoice status, payment status, withholding tax/VAT notes if the firm chooses to build this module |
| AI usage | Rules on whether lawyers/staff may use ChatGPT, Claude, Gemini, or other AI systems with Thai legal documents or client facts |

### Suggested Thai matter statuses

Default seed data in [`prisma/seed-workflow.ts`](prisma/seed-workflow.ts) includes bilingual labels. Firms may add or edit statuses under **Admin → Workflow statuses**. Extended suggestions:

- รับเรื่องใหม่
- ตรวจสอบผลประโยชน์ขัดกัน
- เปิดแฟ้มงาน
- รอเอกสารจากลูกความ
- ร่างเอกสาร
- ตรวจเอกสารภายใน
- ส่งให้ลูกความตรวจ
- ส่งให้อีกฝ่าย
- ยื่นต่อศาล/หน่วยงานแล้ว
- รอศาล/หน่วยงาน
- อยู่ระหว่างเจรจา
- รอลงนาม
- ปิดงาน
- เก็บถาวร

See [matter-statuses.md](docs/jurisdictions/thailand/matter-statuses.md).

### Suggested Thai document categories

Use **tags** and document titles; full taxonomy template: [document-taxonomy.md](docs/jurisdictions/thailand/document-taxonomy.md).

- หนังสือมอบอำนาจ
- บัตรประชาชน/เอกสารยืนยันตัวตน
- หนังสือรับรองบริษัท
- บัญชีรายชื่อผู้ถือหุ้น
- สัญญา
- ร่างสัญญา
- สัญญาลงนามแล้ว
- คำฟ้อง
- คำให้การ
- คำร้อง/คำขอ
- พยานหลักฐาน
- หนังสือโต้ตอบ
- บันทึกคำปรึกษา
- บันทึกประชุม
- ใบแจ้งหนี้
- ใบเสร็จรับเงิน

### Thai PDPA and personal data handling

Firmedware may contain personal data even when it stores metadata only. Client names, contact information, matter titles, task notes, document titles, and external links may identify individuals directly or indirectly.

Firms using Firmedware in Thailand should consider:

- Lawful basis or appropriate justification for collecting and using personal data
- Notice to clients or relevant individuals where required
- Access controls and least-privilege permissions
- Data minimization in matter titles, task descriptions, and notes
- Retention and deletion practices
- Breach response process
- Vendor and hosting review
- Backup security
- Restrictions on AI tools and external sharing

Operational checklist: [pdpa-checklist.md](docs/jurisdictions/thailand/pdpa-checklist.md). Firmedware does not automate PDPA compliance.

### Topics for Thai firm playbooks (not legal citations)

Firms adapting Firmedware for Thai legal practice should review applicable law and professional obligations, then convert requirements into firm-specific playbooks, checklists, access rules, and retention policies. Firmedware does not automate compliance.

- **Lawyer confidentiality and professional conduct** — Thai law firms should review applicable professional conduct rules, including duties relating to client confidentiality, conflicts, supervision, and secure handling of client information. [Add official source: Lawyers Council of Thailand / primary conduct rules.]
- **Personal data (PDPA)** — Firms using Firmedware in Thailand should review applicable Thai personal data protection requirements, including obligations relating to collection, use, disclosure, security measures, retention, breach response, data subject rights, and vendor or processor management. Firmedware does not automate PDPA compliance. [Add official source: Personal Data Protection Commission / primary PDPA materials.]
- **Electronic records and signatures** — Firms using electronic records, electronic signatures, or digital document workflows should review applicable electronic transactions rules and any transaction-specific formalities or exclusions. [Add official source: primary statute / regulator publication.]
- **Tax and accounting retention** — if billing or invoice modules are added, review applicable record-keeping rules with qualified advisors.
- **Court and agency practice** — filing rules, deadlines, and document requirements vary by court, agency, and matter type; maintain practice-specific checklists.

### Thai law and professional responsibility disclaimer

Firmedware is **not** a Thai-law compliance product. It does not determine whether a law firm’s use of the system complies with Thai law, Lawyers Council rules, PDPA, court rules, tax/accounting rules, client agreements, or internal professional responsibility obligations.

Thai law firms should review their own duties before using Firmedware with real client or matter information.

### หมายเหตุสำหรับสำนักงานกฎหมายไทย

Firmedware เป็นระบบติดตามงานกฎหมายแบบ lightweight สำหรับสำนักงานกฎหมายขนาดเล็ก โดยออกแบบให้เก็บเฉพาะข้อมูลเชิงโครงสร้าง เช่น ลูกความ งาน/คดี สถานะงาน แท็ก งานที่ต้องทำ และลิงก์ไปยังเอกสารภายนอก เช่น Google Drive, OneDrive, SharePoint, Dropbox หรือโฟลเดอร์ภายในสำนักงาน

ระบบนี้ไม่ได้เก็บไฟล์เอกสารจริง ไม่ได้อ่านเนื้อหาเอกสาร ไม่ได้ส่งเอกสารเข้า AI และไม่ได้ควบคุมสิทธิ์การเข้าถึงไฟล์ในระบบจัดเก็บภายนอกโดยตรง

สำนักงานควรกำหนดนโยบายภายในเกี่ยวกับการรักษาความลับของลูกความ การตั้งค่าสิทธิ์เอกสาร การใช้งาน AI การเก็บรักษาข้อมูล การสำรองข้อมูล และการปิดสิทธิ์ผู้ใช้งานเมื่อพนักงานหรือทนายความออกจากสำนักงาน

## Jurisdiction packs

Firmedware can be extended through **jurisdiction-specific playbooks**—operational templates each firm must review and adapt. They are not legal advice.

| Pack | Path |
| --- | --- |
| Thailand (starter) | [docs/jurisdictions/thailand/](docs/jurisdictions/thailand/README.md) |

Example layout:

- `docs/jurisdictions/thailand/README.md`
- `docs/jurisdictions/thailand/matter-statuses.md`
- `docs/jurisdictions/thailand/document-taxonomy.md`
- `docs/jurisdictions/thailand/pdpa-checklist.md`
- `docs/jurisdictions/thailand/ai-use-policy.md`
- `docs/jurisdictions/thailand/closing-checklist.md`

Contributions welcome for additional jurisdictions (e.g. Singapore, US state packs) via the same folder pattern.

## Lawyer contribution roadmap

Firmedware welcomes lawyer-led contributions. Good legal software is not only a coding problem; it requires accurate legal workflows, realistic office practices, confidentiality judgment, and jurisdiction-specific playbooks.

Lawyers can contribute by designing:

### 1. Practice-area templates

Examples:

- Litigation matter template
- Contract review matter template
- Corporate registration matter template
- Employment advisory matter template
- Immigration matter template
- IP filing matter template
- Data privacy matter template
- Real estate transaction matter template

Each template may include default statuses, task checklists, document categories, deadline types, and closing steps.

### 2. Intake checklists

Examples:

- New client intake
- Conflict check
- Corporate client onboarding
- Individual client onboarding
- Litigation intake
- Contract review intake
- Data privacy assessment intake

### 3. Document taxonomies

Examples:

- Engagement letter
- Power of attorney
- ID document
- Corporate affidavit
- Contract draft
- Signed contract
- Court filing
- Evidence
- Legal memo
- Email correspondence
- Invoice
- Receipt
- Approval record

### 4. Risk flags

Examples:

- Urgent deadline
- Limitation period risk
- Missing client documents
- Pending payment
- High-confidentiality matter
- Privileged documents
- External counsel involved
- Client approval required
- Court filing pending

### 5. Closing checklists

Examples:

- Final advice sent
- Final document linked
- Signed copy received
- Invoice/payment checked
- Client folder reviewed
- Access permissions reviewed
- Matter status changed to closed
- Closing note completed

### 6. AI use policy templates

Examples:

- No client confidential information in public AI tools
- Public-law research allowed
- Client-document summarization requires approval
- AI output must be verified by a lawyer
- AI-generated citations must be checked
- No autonomous legal advice to clients

### How to contribute

- **Playbooks (no code)** — Open a GitHub issue or discussion with a status list, intake checklist, closing checklist, or AI policy template for your practice area or jurisdiction. Thailand templates: [docs/jurisdictions/thailand/](docs/jurisdictions/thailand/README.md).
- **Configuration** — Fork the repo and customize `prisma/seed-workflow.ts` and **Admin → Workflow statuses** for your firm; adjust tags and firm settings after deploy.
- **Code** — Follow [EXTENSIONS.md](docs/EXTENSIONS.md) for 2FA, comment threads, contract entities, invoicing, and other forks.

## Quick start (Docker) / ทดลองหรือติดตั้งด้วย Docker

For **local development or evaluation** only. Real firms should follow [Getting started](#getting-started--เริ่มต้นติดตั้งสำนักงาน) and [DEPLOY_GUIDE](docs/DEPLOY_GUIDE.md).

```bash
git clone <your-repo-url> firmedware
cd firmedware
cp .env.example .env
# Edit AUTH_SECRET in .env (openssl rand -base64 32)
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the seeded admin:

| Variable | Default |
|----------|---------|
| `SEED_ADMIN_EMAIL` | `admin@firm.local` |
| `SEED_ADMIN_PASSWORD` | `changeme` |

**Bootstrap admin (single firm):** On first startup with an empty database, Firmedware creates one administrator from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Use a firm-owned mailbox, sign in, change the password immediately under **Account → Security**, and add members under **Admin → Users**. Do not use `changeme` in production; remove `SEED_ADMIN_PASSWORD` from env after go-live. There is no public registration.

Production deploy: [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) · Firm configuration (lawyers): [docs/LAWYER_FIRM_SETUP.md](docs/LAWYER_FIRM_SETUP.md).

## Local development (without Docker app)

```bash
cp .env.example .env
docker compose up -d db
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

## User roles

Firmedware has four roles. **There is no public sign-up** — an **Admin** creates accounts under **Admin → Users**. Everyone signs in with their own email and password.

### How access works

- **Matter-scoped visibility** — Except **Admin**, users only see **clients, matters, documents, tasks, and billing** tied to matters they are assigned to (directly on the matter, or via an **active group** on that matter).
- **Client visibility** — A non-admin sees a **client** only if they can access **at least one matter** under that client.
- **Write vs read** — **Viewer** is read-only. **Lawyer** and **Staff** have the same permissions in software; the distinction is for your firm’s org chart (who is licensed vs support staff).
- **Admin** — Sees **all** non-deleted records in the deployment and can configure the firm.

### Role reference

| Role | Typical person | What they see | What they can change |
|------|----------------|---------------|----------------------|
| **Admin** | Managing partner, office manager, IT contact | **Entire firm** — all clients, matters, documents, tasks, billing (when enabled) | Everything non-admins can, plus **user accounts**, **groups**, **tags**, **workflow statuses**, **firm settings**, **security settings**, **AI connector policy** (disabled by default). **Firm-wide activity log** and export. Only role that can **delete billing records** (when billing is enabled). |
| **Lawyer** | Attorney, partner on a matter | Assigned matters and related clients, documents, tasks, billing | Create and edit **clients, matters, tasks, document links**, and billing rows on accessible matters. Cannot open **Admin** screens or manage other users. |
| **Staff** | Paralegal, legal assistant, secretary | Same as **Lawyer** (matter/group assignment) | Same as **Lawyer** in v1.2 — use this role for support staff who should update tasks and links but are not attorneys. |
| **Viewer** | Bookkeeper, intern, read-only reviewer | Same matter scope as Lawyer/Staff | **Read only** — no new clients, matters, tasks, document links, or billing edits. Useful for finance or oversight without changing case data. |

### Admin-only areas (sidebar)

| Area | Purpose |
|------|---------|
| **Admin → Users** | Create, edit, deactivate accounts; set role |
| **Admin → Groups** | Practice teams; assign groups to matters (recommended for 5–15 person firms) |
| **Admin → Settings** | Firm name, timezone, default language, optional features (billing, notes, etc.) |
| **Admin → Security** | Login lockout, confidentiality notice, document permission confirmation |
| **Admin → Workflow statuses** | Matter/contract status labels (English + Thai) |
| **Admin → AI connectors** | Policy-only gateway (off by default; no provider calls in core v1.2) |
| **Admin → Tags** | Shared tag taxonomy (also linked from main nav for admins) |
| **Activity** | Firm-wide audit timeline (non-admins see activity only on their matters) |

### Suggested role mix (starting point)

| Firm size | Guidance |
|-----------|----------|
| **Solo (1)** | One **Admin** account for the lawyer (you). |
| **Mini team (1–4)** | One **Admin** + **Lawyer** for each attorney; **Staff** for assistant; optional **Viewer** for bookkeeper. Groups optional — assign people directly on each matter. |
| **Small firm (5–15)** | **At most two Admins** (primary + break-glass). Most attorneys **Lawyer**; paralegals **Staff**; billing clerk **Viewer** or **Staff**. Use **groups** on matters for practice areas. |

Step-by-step: [LAWYER_FIRM_SETUP — Day 2: People](docs/LAWYER_FIRM_SETUP.md#day-2--people--วันที่สอง--ผู้ใช้). Security detail: [SECURITY.md](docs/SECURITY.md).

**Do not share one login** across multiple people — each person needs an individual account for the audit trail and matter-level access control to work.

## Operations & security

| Topic | Guide |
|-------|--------|
| **Firm setup (start here)** | [SETUP_INDEX](docs/SETUP_INDEX.md) · [START_HERE](docs/START_HERE.md) · [DEPLOY_GUIDE](docs/DEPLOY_GUIDE.md) · [LAWYER_FIRM_SETUP](docs/LAWYER_FIRM_SETUP.md) |
| Code vs data vs documents | README § [Code vs Data vs Documents](#code-vs-data-vs-documents), [Where firm data is stored](#where-firm-data-is-stored), [GitHub is not the firm database](#important-github-is-not-the-firm-database) |
| Shared firm access | README § [How multiple users access the same firm](#how-multiple-users-access-the-same-firm), [Firm setup by size](#firm-setup-by-size--ติดตั้งตามขนาดสำนักงาน) |
| Lawyer-led workflow & compliance framing | README § [Model stack](#model-stack-for-legal-workflow-development), [Security](#security-and-confidentiality-model), [Standards](#security-standards-and-compliance-notes), [Contribution roadmap](#lawyer-contribution-roadmap) |
| Production readiness | README § [Law firm operations](#law-firm-operations-and-production-readiness) · [SECURITY.md](docs/SECURITY.md) |
| Pre-production security review | [SECURITY_EDGE_CASES.md](docs/SECURITY_EDGE_CASES.md) — threat model, acceptance gates, incident playbook |
| Edge-case & failure testing | [EDGE_CASE_TEST_PLAN.md](docs/EDGE_CASE_TEST_PLAN.md) · [FAILURE_MODE_MATRIX.md](docs/FAILURE_MODE_MATRIX.md) · `npm test` (Postgres required; CI on push/PR) |
| Thailand / bilingual ops | README § [Thailand-focused notes](#thailand-focused-legal-operations-notes) · [Thailand pack](docs/jurisdictions/thailand/README.md) |
| Admin & members | [LAWYER_FIRM_SETUP § Day 2](docs/LAWYER_FIRM_SETUP.md#day-2--people--วันที่สอง--ผู้ใช้) · [DEPLOY_GUIDE § Handoff](docs/DEPLOY_GUIDE.md#handoff-to-lawyers--ส่งมอบให้ทนายความ) |
| Security & **2FA (recommended)** | [SECURITY.md](docs/SECURITY.md) · [SETUP_PLAYBOOK §3](docs/SETUP_PLAYBOOK.md#3-security-measures--3-มาตรการความปลอดภัย) |
| Workflow statuses | [LAWYER_FIRM_SETUP § Workflow](docs/LAWYER_FIRM_SETUP.md#day-1--workflow--tags--วันแรก--สถานะงานและแท็ก) · Admin → Workflow statuses |
| Drive / SharePoint links | [SETUP_PLAYBOOK §4](docs/SETUP_PLAYBOOK.md#4-document-and-drive-links--4-ลิงก์เอกสารและไดรฟ์) |
| Task & activity visibility | [SETUP_PLAYBOOK §5](docs/SETUP_PLAYBOOK.md#5-activity-logs-and-tasks--5-บันทึกกิจกรรมและงานย่อย) |
| Notes, comments & billing toggles | [SETUP_PLAYBOOK §6](docs/SETUP_PLAYBOOK.md#6-optional-features--6-ฟีเจอร์เสริม) |
| AI connectors (disabled by default) | [AI_CONNECTOR_SETUP.md](docs/AI_CONNECTOR_SETUP.md) · [AI Connector Gateway](#ai-connector-gateway) |
| Forking (2FA, comments, multi-tenant, 16+) | [EXTENSIONS.md](docs/EXTENSIONS.md) |
| All documentation | [docs/README.md](docs/README.md) |

### Document references (not file storage)

Firmedware supports three kinds of **document references** (UI label; database model remains `DocumentLink`):

1. **External URLs** — Google Drive, OneDrive, SharePoint, Dropbox, or other `https://` links  
2. **Local / manual paths** — office server, NAS, shared drive, or desktop-synced folder paths (e.g. `\\OfficeServer\ClientFiles\…`, `D:\FirmDocs\…`, `/Users/shared/…`)  
3. **Manual references** — paper files, archive boxes, or offline storage labels (free text)

Firmedware stores these as **metadata only**. It does not verify that a local path exists, does not read local files, does not upload files, and does not fetch or proxy external URLs.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `SEED_ADMIN_EMAIL` | Initial admin email (first boot only) |
| `SEED_ADMIN_PASSWORD` | Initial admin password (first boot only) |

## Privacy & document handling

See [Security and confidentiality model](#security-and-confidentiality-model), [SECURITY.md](docs/SECURITY.md), [LAWYER_FIRM_SETUP — Documents](docs/LAWYER_FIRM_SETUP.md#documents--firm-rules--เอกสาร--กฎสำนักงาน), and [SETUP_PLAYBOOK §§3–4](docs/SETUP_PLAYBOOK.md#3-security-measures--3-มาตรการความปลอดภัย).

## Tech stack

Next.js App Router · TypeScript · Tailwind CSS · shadcn-style UI · Prisma · PostgreSQL · Auth.js · Docker Compose

## Backup

Persisted Postgres data lives in the `postgres_data` Docker volume (see [Where Firm Data Is Stored](#where-firm-data-is-stored)). Back up with `pg_dump` against the running `db` service. Store backup files in a firm-controlled location—not in the GitHub repository.

## Source and citation policy

Firmedware documentation avoids relying on law firm marketing blogs, vendor marketing pages, or non-authoritative commentary as legal authority.

Where legal, regulatory, or security references are needed, maintainers should prefer:

- Official statutes and regulations
- Official regulator or government publications
- Official court or bar/lawyer council materials
- Official standards bodies (e.g. ISO, AICPA, NIST, OWASP)
- Official product documentation for product-specific behavior

Operational templates in this repository are not legal advice and should be adapted by qualified professionals.

See also [docs/README.md — Source and citation policy](docs/README.md#source-and-citation-policy).

## License

MIT — see [LICENSE](LICENSE).
