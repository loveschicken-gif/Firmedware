# Firmedware security edge cases

Security-focused extract from the full [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md). Use for threat modeling and pre-production review.

## Threat model summary (v1.2)

| Asset | Threat | Controls to verify |
| --- | --- | --- |
| PostgreSQL metadata | Unauthorized read/write | Matter-level RBAC, server actions |
| Credentials | Brute force, weak seed | Lockout, bcrypt, change default password |
| Sessions (JWT) | Stale role / deactivated user | AUTH-010/011; consider session revocation |
| Document URLs | XSS, javascript: links | DOC-009/016; escape UI |
| External documents | SSRF/proxy (out of scope) | DOC-025 — server must not fetch |
| Activity logs | Tampering, exfiltration | Triggers ACT-013; CSV-006/010 |
| GitHub repo | Secret commit | DEP-014; docs/SECURITY.md |
| Future AI | Confidentiality breach | AI-* — disabled, no outbound calls |
| Metadata fields | Confidential facts without files | META-* — titles, notes, search, CSV |
| External DMS ACLs | Public link while app RBAC OK | EXT-* — not enforced by Firmedware |
| Backups | Dump leak or failed restore | BKP-* — encrypted, access-controlled |

## Security owner and review cadence

Each firm should name one **admin or IT maintainer** (not a shared login) responsible for:

- User onboarding and offboarding
- User role review
- Group and matter assignment review
- Backup confirmation and restore testing
- Activity log review (unusual exports, failed logins, role changes)
- External document permission review (Drive, OneDrive, SharePoint, Dropbox, local shares)
- Security settings review (lockout, permission confirmation, notices)
- Incident response coordination

Suggested cadence for a small firm (adjust to risk and staffing):

| Review item | Suggested cadence |
| --- | --- |
| Active users (still employed, correct role) | Monthly |
| Admin accounts (who has ADMIN, shared creds?) | Monthly |
| Matter and group assignments | Monthly, or after staffing / matter changes |
| External document permissions | Monthly, or when closing a matter |
| Activity logs (AUTH, SECURITY, exports, admin changes) | Weekly for small firms; more often for sensitive matters |
| Backups (job succeeded, file reachable) | Weekly confirmation |
| Backup restore test | Periodic (e.g. quarterly) |
| Security settings (lockout, permission confirm, notices) | Quarterly |

Firmedware does not automate these reviews. The firm defines who performs them and records outcomes internally.

## Incident response mini-playbook

When a suspected account compromise, metadata leak, or unauthorized access occurs:

1. **Disable** the affected user account (Admin → Users → deactivate).
2. **Change passwords** for affected accounts and any shared admin credentials that may be exposed.
3. **Review** recent `ActivityLog` entries for that user (logins, exports, creates, updates, archives, document opens).
4. **Review** document links added or opened by the affected account in Firmedware.
5. **Review** external storage permissions in Google Drive, OneDrive, SharePoint, Dropbox, or local folders—Firmedware cannot fix provider ACLs from inside the app.
6. **Revoke or rotate** over-shared external document links where needed.
7. **Export** relevant activity logs for internal review (admin-only CSV; store securely, not in email or GitHub).
8. **Check** database and deployment access (who can reach PostgreSQL, server, backups, `.env`).
9. **Decide** whether client, court, regulator, insurer, or internal notifications are required—**the firm** makes legal, ethical, contractual, and regulatory decisions.
10. **Document** the incident, timeline, and remediation steps for internal records.

**Disclaimer:** Firmedware can support investigation through metadata and activity logs. It does not provide legal advice, breach notification, or regulator reporting. The firm remains responsible for response decisions.

## Metadata breach examples

Firmedware does not store legal document **files** by default, but **metadata can still be confidential**. A user blocked from a file may still see sensitive facts in the application.

Examples of sensitive metadata:

- Client names and contact fields
- Matter titles (parties, claims, forum, strategy hints)
- Document link **titles** (e.g. settlement drafts, privileged labels)
- Task descriptions and **deadline descriptions** (hearing dates, court steps)
- External URLs (hostnames, folder paths, tokens in query strings)
- Activity log summaries and export rows
- Folder paths for `LOCAL_FOLDER` links
- Document link tokens embedded in shared URLs

**Warning:** Treat metadata as confidential. Use matter-level RBAC, avoid unnecessary detail in titles and task text, and train staff not to paste privileged content into notes or activity-visible fields. See test IDs **META-001–008** and [FAILURE_MODE_MATRIX.md](./FAILURE_MODE_MATRIX.md).

## Security acceptance gates

Do **not** use Firmedware with real client or matter information until these gates pass:

- [ ] **AUTH** P0 tests pass (lockout, inactive user, safe login errors)
- [ ] **RBAC** P0 tests pass (unassigned matters, viewer read-only, server-side checks)
- [ ] **Document link** P0 tests pass (URL validation, permission confirmation, no server fetch)
- [ ] **Search leakage** P0 tests pass (hidden matters/clients/documents)
- [ ] **Activity log** immutability P0 tests pass (DB trigger blocks update/delete)
- [ ] **CSV export** P0 tests pass (no secrets, formula injection escaped)
- [ ] **Deployment** secret checks pass (`AUTH_SECRET`, no `.env` in repo)
- [ ] **Backups** configured, access-restricted, and **restore-tested** (BKP-001–003)
- [ ] **Default seed admin password** changed (DEP-013, ADMIN-010)
- [ ] **External document permission policy** adopted (confirmation + periodic link review; EXT-007/008)
- [ ] **AI connector** remains disabled unless a **written firm policy** explicitly approves a future fork (AI-001)

Passing tests supports operational readiness; it does **not** mean SOC 2, ISO 27001, PDPA, or lawyer conduct compliance.

## Abuse cases to test

| Abuse case | Expected protection |
| --- | --- |
| User guesses another matter URL | Matter-level RBAC blocks access (RBAC-001) |
| Viewer submits hidden edit form | Server-side authorization blocks mutation (RBAC-003) |
| Departed staff keeps old session | Deactivation blocks login; review stale JWT on next action (AUTH-002, AUTH-011) |
| User adds `javascript:` link | URL scheme validation blocks or neutralizes (DOC-009) |
| User adds public Google Drive link | Permission confirmation and warning appear (DOC-019, EXT-001, EXT-008) |
| Admin exports CSV with spreadsheet formula payload | CSV injection protection escapes dangerous values (CSV-010) |
| Developer commits `.env` or database backup | `.gitignore` and documentation warn; never commit (DEP-014, BKP-004) |
| AI connector tries to process matter notes | Disabled-by-default; policy-check only — no provider call (AI-001, AI-GW-002) |

## Security tests to automate first

Ranked starting set for CI or pre-release smoke (see [EDGE_CASE_TEST_PLAN.md](./EDGE_CASE_TEST_PLAN.md) for steps):

1. `AUTH-001` — brute-force lockout
2. `AUTH-002` — inactive user cannot login
3. `AUTH-010` — role change blocks stale write permission
4. `AUTH-011` — deactivated user cannot continue mutating records
5. `RBAC-001` — unassigned matter URL blocked
6. `RBAC-003` — viewer cannot mutate data
7. `RBAC-017` — hidden document does not appear in search
8. `DOC-009` — `javascript:` URL blocked
9. `DOC-019` — permission confirmation required
10. `DOC-025` — server does not fetch external document URLs
11. `SRCH-009` — hidden matter title does not appear in search
12. `ACT-013` — ActivityLog update blocked by DB trigger
13. `CSV-006` — CSV does not contain secrets
14. `CSV-010` — CSV formula injection escaped
15. `AI-001` / `AI-GW-001` — AI connectors disabled by default; no provider SDK calls
16. `AI-GW-003`–`AI-GW-012` — policy blocks confidential/links/paths; viewer forbidden; no mutate/export/fetch

Suggested files: `tests/auth-edge-cases.test.ts`, `tests/rbac.test.ts`, `tests/document-references.test.ts` (LOCAL-001–012, DOC URL safety), `tests/search-permissions.test.ts`, `tests/activity-log.test.ts`, `tests/ai-gateway.test.ts`.

### Local path and manual reference tests (automated)

| Test ID | Summary |
| --- | --- |
| LOCAL-001 | Windows UNC path accepted as `LOCAL_PATH` |
| LOCAL-002 | macOS/Linux absolute path accepted |
| LOCAL-003 | Drive-letter / OneDrive sync-style path accepted |
| LOCAL-004 | `LOCAL_PATH` not validated as http(s) URL |
| LOCAL-005 | Server does not `fetch()` document paths |
| LOCAL-006 | Hidden matter local path blocked by RBAC |
| LOCAL-007 | Hidden local path excluded from search |
| LOCAL-008 | Manual reference text accepted |
| LOCAL-009 | Thai manual reference accepted |
| LOCAL-010 | Manual reference not opened as external link |
| LOCAL-011 | Dangerous schemes / XSS payloads blocked or escaped |
| LOCAL-012 | Copy path uses same RBAC as document access |

## Security test cases (detailed)

P0 and P1 cases from the full plan:

#### AUTH-001

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-001 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Fail login until threshold exceeded; retry with correct password during lockout; retry after lockout window |
| **Expected result** | Generic invalid-credentials only; lockout enforced; counter resets on success |
| **What failure would look like** | Unlimited attempts; lockout bypass; user enumeration via different errors |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-002

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-002 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login as user with active=false |
| **Expected result** | Rejected; AUTH activity logged; no JWT |
| **What failure would look like** | Inactive user session created |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-003

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-003 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login user only deactivated (no hard delete) |
| **Expected result** | Same as AUTH-002 |
| **What failure would look like** | Deleted user still authenticates |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### AUTH-004

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-004 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login with email differing only by case from stored email |
| **Expected result** | Consistent behavior (match or safe fail with generic error) |
| **What failure would look like** | Wrong account match or duplicate sessions |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### AUTH-005

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-005 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Login with padded spaces in email field |
| **Expected result** | Trim/reject; no crash |
| **What failure would look like** | Accidental account creation or wrong binding |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### AUTH-007

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-007 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Email `admin' OR '1'='1` |
| **Expected result** | Safe failure; no SQL leak in response |
| **What failure would look like** | SQLi or auth bypass |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-009

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-009 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Two sessions; change password in A; submit in B |
| **Expected result** | B invalidated or must re-auth; no silent continue |
| **What failure would look like** | Stale password session indefinitely |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### AUTH-010

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-010 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Lawyer session; admin changes role to VIEWER; submit edit |
| **Expected result** | Server rejects mutation |
| **What failure would look like** | Stale JWT retains LAWYER writes |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-011

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-011 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Lawyer session; admin deactivates user; continue browsing |
| **Expected result** | Document known JWT gap; ideally block on next server action |
| **What failure would look like** | Deactivated user mutates records |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-012

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-012 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Expired/invalid session cookie; POST server action |
| **Expected result** | Redirect login; no mutation |
| **What failure would look like** | Unauthenticated write succeeds |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-013

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-013 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Start app with missing/invalid AUTH_SECRET |
| **Expected result** | Fail fast; no insecure sessions |
| **What failure would look like** | Weak/forged tokens accepted |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AUTH-014

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-014 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | Run seed when User table non-empty |
| **Expected result** | No admin overwrite |
| **What failure would look like** | Second admin or password reset |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AUTH-015

| Field | Detail |
| --- | --- |
| **Test ID** | AUTH-015 |
| **Module** | Authentication |
| **Risk type** | Auth / session |
| **Persona** | Anonymous / DevOps / Lawyer |
| **Preconditions** | Docker or local dev DB; FirmSettings defaults; seed admin exists |
| **Steps** | First boot seed with empty SEED_ADMIN_PASSWORD |
| **Expected result** | Reject or force change before prod (default changeme documented) |
| **What failure would look like** | Blank-password admin in production |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### RBAC-001

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-001 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Open /matters/{M2} |
| **Expected result** | 404/redirect; no data |
| **What failure would look like** | Matter body or metadata exposed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-002

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-002 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Open /clients/{hidden} direct URL |
| **Expected result** | Blocked for non-admin |
| **What failure would look like** | Client PII visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-003

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-003 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Viewer POST create/update/archive/export |
| **Expected result** | All rejected server-side |
| **What failure would look like** | Viewer mutates data |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-004

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-004 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/users |
| **Expected result** | Redirect/403 |
| **What failure would look like** | User admin reachable |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-005

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-005 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/groups |
| **Expected result** | Blocked |
| **What failure would look like** | Group admin exposed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-006

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-006 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/settings |
| **Expected result** | Blocked |
| **What failure would look like** | Settings changed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-007

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-007 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/security |
| **Expected result** | Blocked |
| **What failure would look like** | Security settings changed |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-008

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-008 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /admin/workflow-statuses |
| **Expected result** | Blocked |
| **What failure would look like** | Workflow CRUD exposed |
| **Priority** | P1 |
| **Suggested automated test type** | E2E |

#### RBAC-009

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-009 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Lawyer GET /activity firm-wide |
| **Expected result** | Blocked |
| **What failure would look like** | Firm audit visible |
| **Priority** | P0 |
| **Suggested automated test type** | E2E |

#### RBAC-010

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-010 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Add user to G1; assign G1 to M1 |
| **Expected result** | User gains M1 access |
| **What failure would look like** | Group assignment ignored |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-011

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-011 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Deactivate G1 |
| **Expected result** | Group path access removed |
| **What failure would look like** | Inactive group still grants access |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-012

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-012 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Remove user from G1 |
| **Expected result** | Group-based access removed if no direct assign |
| **What failure would look like** | Access persists incorrectly |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-013

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-013 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Remove MatterGroupAssignment |
| **Expected result** | Members lose group path access |
| **What failure would look like** | Access persists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-014

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-014 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | User direct+group on M1; remove one path |
| **Expected result** | Access remains via remaining path |
| **What failure would look like** | Premature loss or excess retention |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-015

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-015 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Archive M1 |
| **Expected result** | Hidden from non-admin lists/search |
| **What failure would look like** | Archived matter visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-016

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-016 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Archive all matters under client |
| **Expected result** | Non-admin loses client |
| **What failure would look like** | Client still visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-017

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-017 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Search document on inaccessible matter |
| **Expected result** | No hit |
| **What failure would look like** | URL/title leaked in search |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-018

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-018 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Dashboard tasks for inaccessible matter |
| **Expected result** | Excluded |
| **What failure would look like** | Task counts leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RBAC-019

| Field | Detail |
| --- | --- |
| **Test ID** | RBAC-019 |
| **Module** | RBAC |
| **Risk type** | Permission leakage |
| **Persona** | Lawyer / Staff / Viewer / Admin |
| **Preconditions** | Matters M1 (assigned), M2 (unassigned), groups G1 active/inactive, archived M3 |
| **Steps** | Invoke server actions without UI (curl/form) |
| **Expected result** | RBAC enforced same as UI |
| **What failure would look like** | Direct action bypass |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-001

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-001 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C0 has no matters: list/detail/search as lawyer vs admin |
| **Expected result** | Admin sees; non-admin typically hidden |
| **What failure would look like** | Unexpected client exposure |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-002

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-002 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C1 only archived matters |
| **Expected result** | Non-admin cannot see C1 |
| **What failure would look like** | Client visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-003

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-003 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C2 one visible + one hidden matter |
| **Expected result** | Client visible; only M-visible listed |
| **What failure would look like** | Hidden matter listed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-004

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-004 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C3 matter only via inactive group |
| **Expected result** | No access |
| **What failure would look like** | Access via dead group |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-005

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-005 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | C4 matter assigned to inactive user |
| **Expected result** | That user cannot access |
| **What failure would look like** | Inactive assignee retains access |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-006

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-006 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Search hidden client displayName |
| **Expected result** | Zero results for lawyer |
| **What failure would look like** | Name appears in search |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-007

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-007 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Direct /clients/{hiddenId} |
| **Expected result** | Blocked |
| **What failure would look like** | 200 with PII |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-008

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-008 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Admin archives all matters on C5 |
| **Expected result** | Lawyer loses C5 visibility |
| **What failure would look like** | Client still visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CLI-009

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-009 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Document on C6 client-only link |
| **Expected result** | Visible only if client has accessible matter per documentWhereForUser |
| **What failure would look like** | Doc visible without matter access |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CLI-010

| Field | Detail |
| --- | --- |
| **Test ID** | CLI-010 |
| **Module** | Client visibility |
| **Risk type** | Visibility |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Clients C0–C9 seeded per scenario in steps |
| **Steps** | Task on C7 without visible matter |
| **Expected result** | Task hidden from lawyer lists |
| **What failure would look like** | Task leaked on dashboard |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DOC-001

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-001 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Create link `drive.google.com/...` without scheme |
| **Expected result** | Stored as https://… |
| **What failure would look like** | Invalid stored URL |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-003

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-003 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Google Drive URL + GOOGLE_DRIVE provider |
| **Expected result** | Saved; external open only |
| **What failure would look like** | Server fetch |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DOC-007

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-007 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | LOCAL_FOLDER path `\\server\share\file` |
| **Expected result** | Accepted as metadata string |
| **What failure would look like** | Path traversal server-side N/A |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DOC-008

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-008 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `not a url` |
| **Expected result** | validation.urlInvalid |
| **What failure would look like** | 500 error |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-009

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-009 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `javascript:alert(1)` |
| **Expected result** | Rejected (verify URL scheme policy) |
| **What failure would look like** | XSS via href |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-010

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-010 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `data:text/html,<script>` |
| **Expected result** | Rejected |
| **What failure would look like** | Inline content execution |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### DOC-011

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-011 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL `file:///etc/passwd` |
| **Expected result** | Rejected or blocked open |
| **What failure would look like** | Local file read UX |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-013

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-013 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | URL with `?token=secret` |
| **Expected result** | Stored; no server outbound call |
| **What failure would look like** | Token logged in server fetch |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-015

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-015 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | provider OTHER, empty providerLabel |
| **Expected result** | providerNameRequired |
| **What failure would look like** | Saved incomplete |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-016

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-016 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | providerLabel `<img onerror=alert(1)>` |
| **Expected result** | Escaped text in HTML |
| **What failure would look like** | Stored XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-017

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-017 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | title `<script>alert(1)</script>` |
| **Expected result** | Escaped |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-018

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-018 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | notes XSS payload |
| **Expected result** | Escaped |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-019

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-019 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Submit create without permissionConfirmed checkbox |
| **Expected result** | permissionConfirmRequired when setting true |
| **What failure would look like** | Link saved without confirm |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-020

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-020 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Open /documents/{id} for inaccessible matter |
| **Expected result** | Blocked |
| **What failure would look like** | Metadata visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-021

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-021 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Document matterId null, clientId set |
| **Expected result** | RBAC via client matters |
| **What failure would look like** | Leak to unassigned lawyer |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DOC-022

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-022 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Document on archived matter |
| **Expected result** | Hidden from lawyer |
| **What failure would look like** | Still listed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DOC-023

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-023 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | POST sensitivity INVALID |
| **Expected result** | Zod reject |
| **What failure would look like** | Wrong enum in DB |
| **Priority** | P1 |
| **Suggested automated test type** | unit |

#### DOC-024

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-024 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | Click open document |
| **Expected result** | target=_blank external; no iframe embed |
| **What failure would look like** | Proxied content in app |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DOC-025

| Field | Detail |
| --- | --- |
| **Test ID** | DOC-025 |
| **Module** | Document links |
| **Risk type** | XSS / SSRF / RBAC |
| **Persona** | Lawyer |
| **Preconditions** | requireDocumentPermissionConfirm=true unless noted |
| **Steps** | tcpdump during create/view doc |
| **Expected result** | No HTTP to drive/sharepoint host from server |
| **What failure would look like** | SSRF/fetch |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-003

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-003 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= Thai client name |
| **Expected result** | Matching client if RBAC allows |
| **What failure would look like** | No Thai match |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-004

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-004 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= English matter title |
| **Expected result** | Match within RBAC |
| **What failure would look like** | Leak hidden matter |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-005

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-005 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= mixed Thai+English |
| **Expected result** | Reasonable contains match |
| **What failure would look like** | Encoding failure |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-006

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-006 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= case number with / and - |
| **Expected result** | Match matter fields |
| **What failure would look like** | Regex blow-up |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-007

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-007 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= `'; DROP TABLE--` |
| **Expected result** | No SQL error |
| **What failure would look like** | Injection |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-008

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-008 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | q= `<script>alert(1)</script>` |
| **Expected result** | No reflection XSS |
| **What failure would look like** | XSS |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-009

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-009 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Lawyer searches unassigned matter title |
| **Expected result** | No results |
| **What failure would look like** | Title hit |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-010

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-010 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search archived matter name as admin vs lawyer |
| **Expected result** | Admin may see; lawyer not |
| **What failure would look like** | Lawyer sees archived |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-011

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-011 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search archived document title |
| **Expected result** | Excluded for non-admin |
| **What failure would look like** | Leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SRCH-012

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-012 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | enableEntityNotes=false; search note text |
| **Expected result** | Notes may still match in DB—document behavior |
| **What failure would look like** | Unexpected note leak in UI |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### SRCH-014

| Field | Detail |
| --- | --- |
| **Test ID** | SRCH-014 |
| **Module** | Search |
| **Risk type** | Injection / RBAC |
| **Persona** | Lawyer / Admin |
| **Preconditions** | globalSearch limit 20/section |
| **Steps** | Search highly confidential doc title |
| **Expected result** | RBAC before sensitivity display |
| **What failure would look like** | Leak |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-001

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-001 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive client with active matters |
| **Expected result** | Soft delete client; matters policy consistent |
| **What failure would look like** | FK violation |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-002

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-002 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter with open tasks |
| **Expected result** | Tasks hidden/archived cascade per rules |
| **What failure would look like** | Orphan visible tasks |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-003

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-003 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter with documents |
| **Expected result** | Docs hidden from lawyer |
| **What failure would look like** | Docs visible |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-004

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-004 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive document link |
| **Expected result** | Excluded from lists |
| **What failure would look like** | Still searchable |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-006

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-006 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Deactivate group with matter assignments |
| **Expected result** | Access revoked |
| **What failure would look like** | Stale access |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-007

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-007 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Deactivate workflow status in use |
| **Expected result** | Matters keep statusId; badge works |
| **What failure would look like** | Create matter fails globally |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-009

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-009 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Attempt hard delete via tampered action |
| **Expected result** | Rejected |
| **What failure would look like** | Row gone |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-010

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-010 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Lists/search/dashboard exclude archived |
| **Expected result** | Consistent filters notDeleted |
| **What failure would look like** | Ghost records |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ARCH-011

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-011 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive client; activity log entry |
| **Expected result** | DELETE/archived summary append-only |
| **What failure would look like** | No log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ARCH-012

| Field | Detail |
| --- | --- |
| **Test ID** | ARCH-012 |
| **Module** | Archive / soft delete |
| **Risk type** | Data integrity |
| **Persona** | Admin / Lawyer |
| **Preconditions** | deletedAt soft delete pattern |
| **Steps** | Archive matter; FK integrity |
| **Expected result** | No orphan violations |
| **What failure would look like** | DB constraint error |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-001

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-001 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Create client |
| **Expected result** | CREATE DATA log |
| **What failure would look like** | Missing log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-002

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-002 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Update matter |
| **Expected result** | UPDATE log with diff metadata |
| **What failure would look like** | Missing log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-003

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-003 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Archive matter |
| **Expected result** | DELETE/archived log |
| **What failure would look like** | Wrong action |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-005

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-005 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Successful login |
| **Expected result** | AUTH log |
| **What failure would look like** | Missing |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-006

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-006 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Failed login |
| **Expected result** | AUTH log without password |
| **What failure would look like** | Password in metadata |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-007

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-007 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Admin changes user role |
| **Expected result** | ADMIN log |
| **What failure would look like** | Missing |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-008

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-008 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | User changes password |
| **Expected result** | SECURITY/AUTH log |
| **What failure would look like** | Cleartext password logged |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-009

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-009 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Admin CSV export |
| **Expected result** | Export action logged |
| **What failure would look like** | No log |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-010

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-010 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Lawyer GET /api/activity/export firm-wide |
| **Expected result** | 403 |
| **What failure would look like** | Full firm CSV |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-011

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-011 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Prisma activityLog.update via script |
| **Expected result** | App path N/A; DB trigger blocks |
| **What failure would look like** | Row changed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-012

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-012 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Prisma activityLog.delete |
| **Expected result** | Trigger exception |
| **What failure would look like** | Row deleted |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-013

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-013 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | SQL UPDATE ActivityLog |
| **Expected result** | Trigger raises |
| **What failure would look like** | Immutable broken |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ACT-014

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-014 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Deactivate user; old logs |
| **Expected result** | actorName/actorEmail snapshot preserved |
| **What failure would look like** | Logs blanked |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ACT-015

| Field | Detail |
| --- | --- |
| **Test ID** | ACT-015 |
| **Module** | Activity log |
| **Risk type** | Audit / immutability |
| **Persona** | Admin / Lawyer / DevOps |
| **Preconditions** | Migration 20260522100000_immutable_activity_log |
| **Steps** | Large note in metadata |
| **Expected result** | Truncated/summary only |
| **What failure would look like** | Full privileged text stored |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SEC-008

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-008 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Lawyer update security settings |
| **Expected result** | Blocked |
| **What failure would look like** | Lockout disabled |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### SEC-010

| Field | Detail |
| --- | --- |
| **Test ID** | SEC-010 |
| **Module** | Security settings |
| **Risk type** | Auth policy |
| **Persona** | Admin / Anonymous |
| **Preconditions** | FirmSettings security fields |
| **Steps** | Failed login unknown vs known email |
| **Expected result** | Same generic UI message |
| **What failure would look like** | User enumeration |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-001

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-001 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Admin export /api/activity/export |
| **Expected result** | 200 CSV |
| **What failure would look like** | 403 |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-002

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-002 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Lawyer firm-wide export |
| **Expected result** | 403 |
| **What failure would look like** | Full dump |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-003

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-003 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Rows with Thai characters |
| **Expected result** | UTF-8 BOM optional; readable |
| **What failure would look like** | Mojibake |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-004

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-004 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Metadata with commas quotes newlines |
| **Expected result** | RFC4180 escaping |
| **What failure would look like** | Broken columns |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### CSV-006

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-006 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Inspect CSV content |
| **Expected result** | No passwordHash AUTH_SECRET |
| **What failure would look like** | Secret leak |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-007

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-007 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Lawyer scoped entity export |
| **Expected result** | Only assigned matter scope |
| **What failure would look like** | Extra rows |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### CSV-008

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-008 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Export triggers activity log |
| **Expected result** | Logged |
| **What failure would look like** | No trail |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-009

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-009 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Content-Disposition filename |
| **Expected result** | Safe alphanumeric name |
| **What failure would look like** | Path injection |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### CSV-010

| Field | Detail |
| --- | --- |
| **Test ID** | CSV-010 |
| **Module** | CSV export |
| **Risk type** | Data exfiltration / injection |
| **Persona** | Admin / Lawyer |
| **Preconditions** | activity-export.ts |
| **Steps** | Cell `=cmd|'/c calc'!A0` |
| **Expected result** | Escaped prefix tab or quote |
| **What failure would look like** | Formula injection |
| **Priority** | P0 |
| **Suggested automated test type** | unit |

#### AI-001

| Field | Detail |
| --- | --- |
| **Test ID** | AI-001 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI connector DISABLED (default) |
| **Expected result** | No AI routes/responses |
| **What failure would look like** | Endpoint exists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### AI-002

| Field | Detail |
| --- | --- |
| **Test ID** | AI-002 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Public research mode with client PII prompt |
| **Expected result** | Blocked by policy (future) |
| **What failure would look like** | PII sent |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-003

| Field | Detail |
| --- | --- |
| **Test ID** | AI-003 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Privileged matter prompt |
| **Expected result** | Blocked default |
| **What failure would look like** | Leak |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-004

| Field | Detail |
| --- | --- |
| **Test ID** | AI-004 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | External doc link in prompt |
| **Expected result** | Blocked default |
| **What failure would look like** | Fetch |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-005

| Field | Detail |
| --- | --- |
| **Test ID** | AI-005 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | userConfirmation=false |
| **Expected result** | Blocked |
| **What failure would look like** | Runs anyway |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-006

| Field | Detail |
| --- | --- |
| **Test ID** | AI-006 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Missing provider |
| **Expected result** | Blocked |
| **What failure would look like** | Call made |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-007

| Field | Detail |
| --- | --- |
| **Test ID** | AI-007 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Invalid provider enum |
| **Expected result** | Blocked |
| **What failure would look like** | Call made |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-008

| Field | Detail |
| --- | --- |
| **Test ID** | AI-008 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | No OPENAI_API_KEY in env required |
| **Expected result** | App starts without AI keys |
| **What failure would look like** | Startup fail |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### AI-009

| Field | Detail |
| --- | --- |
| **Test ID** | AI-009 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Network capture on AI UI action |
| **Expected result** | No third-party HTTPS |
| **What failure would look like** | Outbound API |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-010

| Field | Detail |
| --- | --- |
| **Test ID** | AI-010 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Blocked request audit |
| **Expected result** | Metadata-only log if implemented |
| **What failure would look like** | Full prompt stored |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### AI-011

| Field | Detail |
| --- | --- |
| **Test ID** | AI-011 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | Privileged prompt logging |
| **Expected result** | Not stored |
| **What failure would look like** | Log leak |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-012

| Field | Detail |
| --- | --- |
| **Test ID** | AI-012 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot CREATE matter |
| **Expected result** | No mutation API |
| **What failure would look like** | Record created |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-013

| Field | Detail |
| --- | --- |
| **Test ID** | AI-013 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot DELETE |
| **Expected result** | No delete |
| **What failure would look like** | Archive via AI |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-014

| Field | Detail |
| --- | --- |
| **Test ID** | AI-014 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot export CSV |
| **Expected result** | No export path |
| **What failure would look like** | CSV download |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### AI-015

| Field | Detail |
| --- | --- |
| **Test ID** | AI-015 |
| **Module** | AI connector (future) |
| **Risk type** | Data exfiltration |
| **Persona** | Admin |
| **Preconditions** | v1.2: no src AI—test docs/future stubs |
| **Steps** | AI cannot fetch Drive link |
| **Expected result** | No SSRF |
| **What failure would look like** | Server fetch |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-001

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-001 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | DATABASE_URL missing |
| **Expected result** | Startup error clear |
| **What failure would look like** | Silent sqlite fallback |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-002

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-002 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | DATABASE_URL wrong host |
| **Expected result** | Connection error |
| **What failure would look like** | Hang forever |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-003

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-003 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_SECRET missing |
| **Expected result** | Auth failure |
| **What failure would look like** | Insecure default |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-004

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-004 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_SECRET short guessable |
| **Expected result** | Document rotate; sessions weak |
| **What failure would look like** | Forge tokens |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-005

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-005 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_URL missing |
| **Expected result** | Auth callback issues |
| **What failure would look like** | OAuth loop |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-006

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-006 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | AUTH_URL mismatch deployment |
| **Expected result** | Login redirect wrong host |
| **What failure would look like** | Open redirect |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-007

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-007 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Postgres stopped |
| **Expected result** | 500 with safe message |
| **What failure would look like** | Stack trace to user |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-008

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-008 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Migrations not applied |
| **Expected result** | Prisma error on query |
| **What failure would look like** | Partial schema |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-010

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-010 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Docker volume removed |
| **Expected result** | Empty DB on restart |
| **What failure would look like** | Data loss without warning |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-012

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-012 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Restore dump to fresh DB |
| **Expected result** | App works; seed idempotent |
| **What failure would look like** | Constraint errors |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DEP-013

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-013 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Production still uses changeme seed password |
| **Expected result** | Manual checklist fail |
| **What failure would look like** | Compromise |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-014

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-014 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | .env in git status |
| **Expected result** | Docs warn; gitignore blocks |
| **What failure would look like** | Secret in repo |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### DEP-015

| Field | Detail |
| --- | --- |
| **Test ID** | DEP-015 |
| **Module** | Deployment |
| **Risk type** | Availability / secrets |
| **Persona** | DevOps |
| **Preconditions** | Docker compose docs |
| **Steps** | Two laptops local install |
| **Expected result** | Separate DBs; no sync |
| **What failure would look like** | Users expect merge |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### DB-001

| Field | Detail |
| --- | --- |
| **Test ID** | DB-001 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Create matter without clientId |
| **Expected result** | DB/Prisma reject |
| **What failure would look like** | Orphan matter |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-002

| Field | Detail |
| --- | --- |
| **Test ID** | DB-002 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | DocumentLink without clientId |
| **Expected result** | Reject |
| **What failure would look like** | Orphan doc |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-003

| Field | Detail |
| --- | --- |
| **Test ID** | DB-003 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate MatterAssignment |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicate row |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-004

| Field | Detail |
| --- | --- |
| **Test ID** | DB-004 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate MatterGroupAssignment |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicate |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-005

| Field | Detail |
| --- | --- |
| **Test ID** | DB-005 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate user email |
| **Expected result** | Unique violation |
| **What failure would look like** | Two users |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-006

| Field | Detail |
| --- | --- |
| **Test ID** | DB-006 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Duplicate tag name |
| **Expected result** | Unique violation |
| **What failure would look like** | Duplicates |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-007

| Field | Detail |
| --- | --- |
| **Test ID** | DB-007 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Two default workflow statuses |
| **Expected result** | App enforces single default |
| **What failure would look like** | Two defaults |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-008

| Field | Detail |
| --- | --- |
| **Test ID** | DB-008 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Delete client with matters |
| **Expected result** | Restrict or soft cascade per schema |
| **What failure would look like** | FK error uncaught |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-009

| Field | Detail |
| --- | --- |
| **Test ID** | DB-009 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | ActivityLog UPDATE |
| **Expected result** | Trigger block |
| **What failure would look like** | Mutable log |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### DB-011

| Field | Detail |
| --- | --- |
| **Test ID** | DB-011 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Dates stored UTC display Bangkok |
| **Expected result** | Consistent |
| **What failure would look like** | Off-by-one |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### DB-012

| Field | Detail |
| --- | --- |
| **Test ID** | DB-012 |
| **Module** | Database integrity |
| **Risk type** | Constraints |
| **Persona** | DevOps |
| **Preconditions** | prisma/schema.prisma |
| **Steps** | Run seed twice |
| **Expected result** | Idempotent tags/settings |
| **What failure would look like** | Duplicate admins |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-001

| Field | Detail |
| --- | --- |
| **Test ID** | META-001 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Create matter title with client name + claim strategy; lawyer without matter access searches |
| **Expected result** | No search/list/detail leak of title |
| **What failure would look like** | Hidden matter title visible in search or URL |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-002

| Field | Detail |
| --- | --- |
| **Test ID** | META-002 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Document title `Settlement offer 12M THB draft.pdf` on assigned matter; export activity CSV |
| **Expected result** | Title visible only to authorized users; CSV scoped |
| **What failure would look like** | Revealing title in export to wrong role |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-003

| Field | Detail |
| --- | --- |
| **Test ID** | META-003 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Task description with privileged communication summary |
| **Expected result** | Visible only via matter RBAC; not in global activity for non-admin |
| **What failure would look like** | Task note in firm-wide feed |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-004

| Field | Detail |
| --- | --- |
| **Test ID** | META-004 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Task deadlineType `ศาลนัดสืบพยาน 15 ส.ค.` visible on task list |
| **Expected result** | Same RBAC as task; no extra leak on dashboard |
| **What failure would look like** | Deadline text exposes case to unassigned user |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### META-005

| Field | Detail |
| --- | --- |
| **Test ID** | META-005 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Update matter with long confidential note; view activity timeline |
| **Expected result** | Summary redacted/truncated; no full privileged text in ActivityLog metadata |
| **What failure would look like** | Full note text in activity JSON/CSV |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-006

| Field | Detail |
| --- | --- |
| **Test ID** | META-006 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Search partial matter title as unassigned lawyer |
| **Expected result** | No snippet/hit (SRCH-009 alignment) |
| **What failure would look like** | Search result shows revealing substring |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### META-007

| Field | Detail |
| --- | --- |
| **Test ID** | META-007 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Inspect browser history, referrer, and exported CSV for raw `/matters/{uuid}` paths without context |
| **Expected result** | Paths alone do not expose titles; pairing with other leaks documented |
| **What failure would look like** | UUID + title in query string or CSV column combo enables inference |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### META-008

| Field | Detail |
| --- | --- |
| **Test ID** | META-008 |
| **Module** | Metadata sensitivity |
| **Risk type** | Confidentiality (metadata-only) |
| **Persona** | Lawyer / Admin |
| **Preconditions** | Firm training: treat all metadata as confidential; RBAC seeded |
| **Steps** | Admin exports activity CSV; verify matter/document titles in rows match RBAC scope |
| **Expected result** | No titles for matters user could not access in scoped export |
| **What failure would look like** | CSV rows include confidential titles from inaccessible matters |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### EXT-001

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-001 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save Google Drive link known to be “Anyone with the link”; open in incognito without firm login |
| **Expected result** | Firmedware stores metadata only; file may still be public—document in test report |
| **What failure would look like** | Firm assumes Firmedware access = file security |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### EXT-002

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-002 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save SharePoint link with broad org sharing; viewer without SP license opens link |
| **Expected result** | Link may open for org users even when Firmedware RBAC blocks |
| **What failure would look like** | Over-shared SP link undetected |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-003

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-003 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Save Dropbox public link; verify opens without Dropbox firm account |
| **Expected result** | External public access despite internal restriction |
| **What failure would look like** | Same as EXT-001 |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-004

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-004 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | LOCAL_FOLDER path to `\\fileserver\matter\doc` from lawyer laptop without VPN |
| **Expected result** | Link saved; open fails or wrong share—user understands limit |
| **What failure would look like** | False confidence in access |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-006

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-006 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Tamper form: omit permissionConfirmed while setting true in FirmSettings |
| **Expected result** | Server rejects create/update (DOC-019) |
| **What failure would look like** | Link saved without confirmation |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### EXT-007

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-007 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Review firm playbook: quarterly external link permission audit checklist exists |
| **Expected result** | Checklist documented in SETUP_PLAYBOOK or internal wiki |
| **What failure would look like** | No periodic review process |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### EXT-008

| Field | Detail |
| --- | --- |
| **Test ID** | EXT-008 |
| **Module** | External storage permissions |
| **Risk type** | Third-party ACL mismatch |
| **Persona** | Lawyer / Admin |
| **Preconditions** | requireDocumentPermissionConfirm=true; docs/SETUP_PLAYBOOK §4 |
| **Steps** | Read Admin → Security + document form helper text |
| **Expected result** | Clear warning: Firmedware does not enforce Drive/SP/OneDrive/Dropbox ACLs |
| **What failure would look like** | UI implies app controls external file permissions |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-001

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-001 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Run `pg_dump` against production DB container |
| **Expected result** | Non-zero success; file size >0 |
| **What failure would look like** | Backup script fails silently |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-002

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-002 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Store dump on encrypted volume or restricted share; verify permissions |
| **Expected result** | Only admin/IT OS accounts can read |
| **What failure would look like** | World-readable backup file |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-003

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-003 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Restore dump to fresh DB; run smoke test login + matter list |
| **Expected result** | App functional; row counts match |
| **What failure would look like** | Restore never tested; corruption found in crisis |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-004

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-004 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | `git status` after backup job; confirm dumps in .gitignore |
| **Expected result** | No `.sql`/dump staged |
| **What failure would look like** | Backup committed to GitHub |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-005

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-005 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Inspect backup file for `.env`, connection strings, or seed passwords |
| **Expected result** | Only DB content; secrets not embedded in dump path readme |
| **What failure would look like** | AUTH_SECRET pasted into backup folder README |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-006

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-006 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Restore production dump to developer laptop by mistake |
| **Expected result** | Procedure prevents or scrubs after test |
| **What failure would look like** | Prod client data on unsecured laptop |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-007

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-007 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Attempt restore from 90-day-old backup after migration |
| **Expected result** | Document stale schema risk; test or reject |
| **What failure would look like** | Wrong schema/data loss |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### BKP-008

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-008 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Simulate missing scheduled backup (monitoring alert) |
| **Expected result** | Alert fires; runbook exists |
| **What failure would look like** | Silent no-backup |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### BKP-009

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-009 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Truncate/corrupt dump file; run restore |
| **Expected result** | Restore fails cleanly with error |
| **What failure would look like** | Partial corrupt DB accepted |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### BKP-010

| Field | Detail |
| --- | --- |
| **Test ID** | BKP-010 |
| **Module** | Backup / restore |
| **Risk type** | Availability / confidentiality |
| **Persona** | DevOps / Admin |
| **Preconditions** | Production-like Postgres; firm backup policy documented |
| **Steps** | Non-admin user attempts read backup share |
| **Expected result** | OS/filesystem denies |
| **What failure would look like** | Lawyer downloads full firm dump |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-001

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-001 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Add lawyer to Litigation group also assigned to all open matters |
| **Expected result** | Review matter list—only intended matters visible |
| **What failure would look like** | User sees entire firm caseload |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-002

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-002 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Promote VIEWER to LAWYER by mistake; viewer refreshes session |
| **Expected result** | Writes blocked until re-login; activity logs role change |
| **What failure would look like** | Viewer edits after role change without audit |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ADMIN-003

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-003 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Departed employee: admin forgets deactivate for 30 days |
| **Expected result** | Account still logs in (AUTH-002 if deactivated); process audit |
| **What failure would look like** | Stale active account |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-004

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-004 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Set minimal lockout/password guidance; weak user passwords allowed |
| **Expected result** | Document firm policy; optional future min length enforcement |
| **What failure would look like** | Trivial passwords firm-wide |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-005

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-005 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Disable requireDocumentPermissionConfirm in Admin → Security |
| **Expected result** | Allowed only with conscious admin action; EXT-008 warning still visible |
| **What failure would look like** | Links saved without user acknowledgment |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### ADMIN-006

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-006 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Bulk deactivate wrong workflow status used by open matters |
| **Expected result** | Matters retain statusId; badge fallback; no data loss |
| **What failure would look like** | Open matters untrackable |
| **Priority** | P1 |
| **Suggested automated test type** | integration |

#### ADMIN-007

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-007 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Export activity CSV; save to personal Downloads without encryption |
| **Expected result** | Process review—export logged (CSV-008); firm policy on storage |
| **What failure would look like** | CSV on unsecured personal device |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-008

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-008 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | SEED_ADMIN_EMAIL=gmail personal on production |
| **Expected result** | Document risk; use firm-owned mailbox |
| **What failure would look like** | Account recovery/lost employee risk |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### ADMIN-009

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-009 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Two lawyers share admin password (process) |
| **Expected result** | Discouraged in docs; per-user accounts |
| **What failure would look like** | No attribution in logs |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### ADMIN-010

| Field | Detail |
| --- | --- |
| **Test ID** | ADMIN-010 |
| **Module** | Admin misconfiguration |
| **Risk type** | Operational error |
| **Persona** | Admin |
| **Preconditions** | Admin account; sample users/groups |
| **Steps** | Production login still uses changeme (DEP-013) |
| **Expected result** | Block go-live until changed |
| **What failure would look like** | Trivial admin compromise |
| **Priority** | P0 |
| **Suggested automated test type** | manual |

#### RET-001

| Field | Detail |
| --- | --- |
| **Test ID** | RET-001 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archive matter; query DB directly |
| **Expected result** | Row remains with deletedAt set |
| **What failure would look like** | Hard delete removed evidence |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-002

| Field | Detail |
| --- | --- |
| **Test ID** | RET-002 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archived matter absent from lawyer list/search/dashboard |
| **Expected result** | Hidden per ARCH-010 |
| **What failure would look like** | Still in active lists |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-003

| Field | Detail |
| --- | --- |
| **Test ID** | RET-003 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Archive matter; view activity history |
| **Expected result** | Prior ActivityLog rows unchanged (immutable) |
| **What failure would look like** | Logs deleted with archive |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-004

| Field | Detail |
| --- | --- |
| **Test ID** | RET-004 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Attempt hard delete matter via UI/API |
| **Expected result** | Only soft delete available |
| **What failure would look like** | Purge button removes row |
| **Priority** | P0 |
| **Suggested automated test type** | integration |

#### RET-005

| Field | Detail |
| --- | --- |
| **Test ID** | RET-005 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | pg_dump after archive |
| **Expected result** | Backup still contains archived rows |
| **What failure would look like** | Firm understands backups retain archived data |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-006

| Field | Detail |
| --- | --- |
| **Test ID** | RET-006 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Firm retention period documented in playbook/internal policy |
| **Expected result** | Written retention for metadata + backups |
| **What failure would look like** | No documented retention |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-007

| Field | Detail |
| --- | --- |
| **Test ID** | RET-007 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | Litigation hold: docs warn Firmedware has no legal-hold automation |
| **Expected result** | SECURITY.md / playbook explicit |
| **What failure would look like** | Firm assumes hold flag exists |
| **Priority** | P1 |
| **Suggested automated test type** | manual |

#### RET-008

| Field | Detail |
| --- | --- |
| **Test ID** | RET-008 |
| **Module** | Retention / legal hold |
| **Risk type** | Compliance / evidence |
| **Persona** | Admin / DevOps |
| **Preconditions** | Matter M archived; docs/SECURITY.md retention notes |
| **Steps** | CSV export + backup retention periods noted for firm |
| **Expected result** | Export files and dumps have defined destroy date |
| **What failure would look like** | Indefinite uncontrolled copies |
| **Priority** | P1 |
| **Suggested automated test type** | manual |


## Repository & deployment safety

Manual checks (no Test ID):
- Confirm `.gitignore` excludes `.env`, `*.sql`, dumps, exports.
- Confirm production uses one shared PostgreSQL (see README).
- Confirm `AUTH_SECRET` rotated from dev default.
- Review [SECURITY.md](./SECURITY.md) Repository Safety section.

## P0 security gate (minimum)

- [ ] `AUTH-001`
- [ ] `AUTH-002`
- [ ] `AUTH-007`
- [ ] `AUTH-011`
- [ ] `RBAC-001`
- [ ] `RBAC-003`
- [ ] `RBAC-019`
- [ ] `DOC-009`
- [ ] `DOC-019`
- [ ] `DOC-025`
- [ ] `SRCH-007`
- [ ] `SRCH-009`
- [ ] `ACT-006`
- [ ] `ACT-010`
- [ ] `ACT-013`
- [ ] `CSV-006`
- [ ] `CSV-010`
- [ ] `SEC-010`
- [ ] `AI-001`
- [ ] `AI-009`
- [ ] `DEP-013`
- [ ] `DEP-014`
- [ ] `META-001`
- [ ] `META-005`
- [ ] `META-008`
- [ ] `EXT-006`
- [ ] `EXT-008`
- [ ] `BKP-001`
- [ ] `BKP-002`
- [ ] `BKP-003`
- [ ] `BKP-004`
- [ ] `ADMIN-002`
- [ ] `ADMIN-005`
- [ ] `ADMIN-010`
- [ ] `RET-001`
- [ ] `RET-002`
- [ ] `RET-004`
